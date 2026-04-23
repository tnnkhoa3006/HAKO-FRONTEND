import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { MdOutlineReply } from "react-icons/md";
import { HiOutlineFaceSmile } from "react-icons/hi2";
import { IoMdMore } from "react-icons/io";
import styles from "./Messenger.module.scss";
import type { User, Message } from "@/types/user.type";
import { Group } from "@/types/messenger.types";
import { useEffect, useRef, useState, useCallback } from "react";
import Call from "./call";
import { useTime } from "@/app/hooks/useTime";
import { useCheckOnline } from "@/app/hooks/useCheckOnline";
import { useTimeOffline } from "@/app/hooks/useTimeOffline";
import { OnlineIndicator } from "@/components/OnlineIndicator";
import StoryAvatar from "@/components/Story/StoryAvatar";
import { useHandleUserClick } from "@/utils/useHandleUserClick";
import MessageInput from "./MessageInput";
import { ReplyMessageDisplayText, ReplyMessageBubble } from "./ReplyMessage";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearReplyTo, setReplyTo } from "@/store/messengerSlice";
import {
  MessageSkeleton,
  MessageSkeletonRight,
  MessageSkeletonShort,
  MessageSkeletonRightShort,
  TypingSkeleton,
} from "@/Skeleton/messenger";
import GroupMembersModal from "./GroupMembersModal";
import dynamic from "next/dynamic";
const ImageVideoPreview = dynamic(
  () => import("@/components/Preview/ImageVideo"),
  { ssr: false }
);

export type MainChatProps = {
  selectedUser: (User & { hasStory?: boolean }) | null;
  selectedGroup?: Group | null;
  messages: Message[];
  message: string;
  setMessage: (msg: string) => void;
  handleSendMessage: () => void;
  handleKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  loading: boolean;
  userId: string;
  onLoadMore: () => void;
  hasMore: boolean;
  loadingMore: boolean;
  ringtoneRef: React.RefObject<HTMLAudioElement | null>;
  availableUsers: User[];
  showMainChat: boolean;
  setShowMainChat: (show: boolean) => void;
  file?: File | null;
  setFile?: (f: File | null) => void;
  filePreview?: string | null;
  setFilePreview?: (url: string | null) => void;
  fileInputRef?: React.RefObject<HTMLInputElement | null>;
  preview?: boolean;
  replace?: boolean;
};

export default function MainChat({
  selectedUser,
  selectedGroup,
  messages,
  message,
  setMessage,
  handleSendMessage,
  handleKeyPress,
  loading,
  userId,
  onLoadMore,
  hasMore,
  loadingMore,
  ringtoneRef,
  availableUsers,
  showMainChat,
  setShowMainChat,
  file,
  setFile,
  filePreview,
  setFilePreview,
  fileInputRef,
  preview = false,
  replace = false,
}: MainChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [shouldMaintainScrollPosition, setShouldMaintainScrollPosition] =
    useState(false);
  const [previousScrollHeight, setPreviousScrollHeight] = useState(0);
  const [previousMessageCount, setPreviousMessageCount] = useState(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [previewMedia, setPreviewMedia] = useState<{
    src: string;
    type: "image" | "video";
  } | null>(null);
  const [showGroupMembers, setShowGroupMembers] = useState(false);

  const { formatTime } = useTime();
  const handleUserClick = useHandleUserClick();
  const { isUserOnline } = useCheckOnline(availableUsers);
  const { timeOffline } = useTimeOffline(
    selectedUser?.lastActive !== null && selectedUser?.lastActive !== undefined
      ? String(selectedUser.lastActive)
      : null,
    selectedUser?.lastOnline !== null && selectedUser?.lastOnline !== undefined
      ? String(selectedUser.lastOnline)
      : null,
    selectedUser?.lastActive !== null && selectedUser?.lastActive !== undefined
      ? String(selectedUser.lastActive)
      : null,
    selectedUser?.lastOnline !== null && selectedUser?.lastOnline !== undefined
      ? String(selectedUser.lastOnline)
      : null,
    isUserOnline(selectedUser?._id || "") ? "online" : "offline"
  );
  const dispatch = useAppDispatch();
  const replyTo = useAppSelector((state) => state.messenger.replyTo);

  // Removed unused isMobile state and effect

  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current || loadingMore) return;
    const { scrollTop } = messagesContainerRef.current;
    if (scrollTop === 0 && hasMore) {
      const { scrollHeight } = messagesContainerRef.current;
      setPreviousScrollHeight(scrollHeight);
      setShouldMaintainScrollPosition(true);
      onLoadMore();
    }
  }, [hasMore, loadingMore, onLoadMore]);

  useEffect(() => {
    if (
      shouldMaintainScrollPosition &&
      messagesContainerRef.current &&
      !loadingMore
    ) {
      const { scrollHeight } = messagesContainerRef.current;
      const scrollDifference = scrollHeight - previousScrollHeight;
      messagesContainerRef.current.scrollTop = scrollDifference;
      setShouldMaintainScrollPosition(false);
    }
  }, [loadingMore, shouldMaintainScrollPosition, previousScrollHeight]);

  useEffect(() => {
    if (!messagesEndRef.current || !messagesContainerRef.current) return;
    if (loadingMore) return;

    const container = messagesContainerRef.current;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 700;

    if (
      !isInitialLoad &&
      messages.length > previousMessageCount &&
      isNearBottom
    ) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
    // Đừng setPreviousMessageCount ở đây nếu đang loading
    if (!loading) setPreviousMessageCount(messages.length);
  }, [
    messages.length,
    loadingMore,
    isInitialLoad,
    previousMessageCount,
    loading,
  ]);

  const prevTargetIdRef = useRef<string | null>(null);
  const prevLoadingRef = useRef<boolean>(true);

  useEffect(() => {
    const prevTargetId = prevTargetIdRef.current;
    const prevLoading = prevLoadingRef.current;
    const currentTargetId = selectedGroup?._id || selectedUser?._id || null;

    if (
      messagesEndRef.current &&
      currentTargetId &&
      messages.length > 0 &&
      (prevTargetId !== currentTargetId || (prevLoading && !loading))
    ) {
      messagesEndRef.current.scrollIntoView({ behavior: "auto" });
      setIsInitialLoad(false);
      setPreviousMessageCount(messages.length);
    }
    if (prevTargetId !== currentTargetId) {
      setIsInitialLoad(true);
      setPreviousMessageCount(0);
    }
    prevTargetIdRef.current = currentTargetId;
    prevLoadingRef.current = loading;
  }, [selectedUser?._id, selectedGroup?._id, loading, messages.length]);

  const getActivityStatus = (user: User) => {
    if (!user) return "";
    return timeOffline;
  };

  const generateMessageKey = (msg: Message, index: number) => {
    if (msg._id) {
      return `${msg._id}-${index}`;
    }
    return `temp-${msg.senderId}-${Date.now()}-${index}`;
  };

  const handleReplyClick = (replyToId: string) => {
    const el = document.getElementById(`message-${replyToId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      const messageBubble = el.querySelector(".message-bubble");
      if (messageBubble) {
        messageBubble.classList.add("ring-2", "ring-white");
        setTimeout(() => {
          messageBubble.classList.remove("ring-2", "ring-white");
        }, 1200);
      }
    }
  };

  const handleEmojiReaction = (messageId: string) => {
    console.log("Emoji reaction for message:", messageId);
  };

  useEffect(() => {
    if (replace && messagesEndRef.current && messages.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: "auto" });
    }
  }, [replace, messages.length]);

  return (
    <div
      className={`flex-1 flex flex-col ${styles.mainChat} ${
        showMainChat ? styles.showMainChat : ""
      } ${preview ? "w-full h-full" : ""}`}
      style={
        preview
          ? {
              width: "100%",
              height: "100%",
              maxWidth: "100%",
              maxHeight: "100%",
            }
          : {}
      }
    >
      <div
        className={`flex justify-between items-center p-4 position-relative ${styles.chatHeader}`}
      >
        {selectedGroup ? (
          <>
            <div className="flex items-center">
              <button
                className={styles.backBtn}
                onClick={() => {
                  if (preview) {
                    setShowMainChat(false);
                  } else {
                    setShowMainChat(false);
                    window.history.back();
                  }
                }}
                style={{
                  marginRight: 8,
                  display: preview ? "block" : "none",
                }}
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div className="w-10 h-10 rounded-full mr-4 relative flex-shrink-0">
                {selectedGroup.avatar ? (
                  <Image src={selectedGroup.avatar} alt={selectedGroup.name} layout="fill" objectFit="cover" className="rounded-full" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white font-semibold text-lg rounded-full">
                    {selectedGroup.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div onClick={() => setShowGroupMembers(true)} className="cursor-pointer hover:opacity-80 transition-opacity">
                <div className="flex items-center gap-2">
                  <p className={`font-medium ${styles.text2} ${styles.username} ${styles.chatName}`}>
                    {selectedGroup.name}
                  </p>
                </div>
                <p className={`text-xs ${styles.text2} ${styles.chatMessage}`}>
                  {selectedGroup.members.length} thành viên
                </p>
              </div>
            </div>
          </>
        ) : selectedUser ? (
          <>
            <div className="flex items-center">
              <button
                className={styles.backBtn}
                onClick={() => {
                  if (preview) {
                    setShowMainChat(false);
                  } else {
                    setShowMainChat(false);
                    window.history.back();
                  }
                }}
                style={{
                  marginRight: 8,
                  display: preview ? "block" : "none",
                }}
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div className="w-10 h-10 rounded-full mr-4 relative">
                <StoryAvatar
                  author={selectedUser}
                  hasStories={!!selectedUser.hasStory}
                  variant="messenger"
                  size="large"
                  showUsername={false}
                  initialIndex={0}
                />
                <OnlineIndicator
                  isOnline={isUserOnline(selectedUser._id)}
                  className="absolute bottom-[-5] right-[-8px]"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p
                    className={`font-medium ${styles.text2} ${styles.username} ${styles.chatName}`}
                    onClick={() => handleUserClick(selectedUser.username)}
                    style={{
                      cursor: "pointer",
                    }}
                  >
                    {selectedUser.username}
                  </p>
                  {selectedUser.checkMark && (
                    <svg
                      aria-label="Đã xác minh"
                      fill="#0095F6"
                      height="12"
                      role="img"
                      viewBox="0 0 40 40"
                      width="12"
                    >
                      <title>Đã xác minh</title>
                      <path
                        d="M19.998 3.094 14.638 0l-2.972 5.15H5.432v6.354L0 14.64 3.094 20 0 25.359l5.432 3.137v5.905h5.975L14.638 40l5.36-3.094L25.358 40l3.232-5.6h6.162v-6.01L40 25.359 36.905 20 40 14.641l-5.248-3.03v-6.46h-6.419L25.358 0l-5.36 3.094Zm7.415 11.225 2.254 2.287-11.43 11.5-6.835-6.93 2.244-2.258 4.587 4.581 9.18-9.18Z"
                        fillRule="evenodd"
                      ></path>
                    </svg>
                  )}
                </div>
                <p className={`text-xs ${styles.text2} ${styles.chatMessage}`}>
                  {getActivityStatus(selectedUser)}
                </p>
              </div>
            </div>
            <Call
              userId={userId}
              calleeId={selectedUser._id}
              ringtoneRef={ringtoneRef}
              availableUsers={availableUsers}
            />
          </>
        ) : (
          <div className={`w-full text-center min-h-[28px] ${styles.metaText}`}></div>
        )}
      </div>

      {/* Messages */}
      {selectedUser || selectedGroup ? (
        <div
          className={`flex-1 overflow-y-auto overflow-x-hidden p-4 ${styles.messages}`}
          ref={messagesContainerRef}
          onScroll={handleScroll}
          style={{
            WebkitOverflowScrolling: "touch",
            position: "relative",
          }}
        >
          {/* Loading indicator at top for loadingMore */}
          {loadingMore && (
            <div className="flex justify-center py-2 mb-4">
              <div className="w-4 h-4 border-2 border-gray-600 border-t-blue-400 rounded-full animate-spin"></div>
            </div>
          )}

          {/* Skeleton loading khi đang load tin nhắn ban đầu */}
          {loading && messages.length === 0 ? (
            <div className="space-y-0">
              <MessageSkeleton />
              <MessageSkeletonRightShort />
              <MessageSkeletonShort />
              <MessageSkeletonRight />
              <TypingSkeleton />
            </div>
          ) : messages.length > 0 ? (
            messages.map((msg, index) => {
              function getId(id: unknown): string {
                if (!id) return "";
                if (typeof id === "string") return id;
                if (
                  typeof id === "object" &&
                  id !== null &&
                  "_id" in id &&
                  typeof (id as { _id: unknown })._id === "string"
                ) {
                  return (id as { _id: string })._id;
                }
                return "";
              }
              const msgSenderId = getId(msg.senderId);
              const msgReceiverId = getId(msg.receiverId);
              const isCurrentUser = msgSenderId === userId;
              const isOtherUser =
                (selectedUser &&
                  (msgSenderId === selectedUser._id ||
                    msgReceiverId === selectedUser._id)) ||
                (selectedGroup && msg.groupId === selectedGroup._id);
              const messageKey = generateMessageKey(msg, index);

              // Chỉ render tin nhắn thuộc về cuộc hội thoại này
              if (!isOtherUser && !isCurrentUser) return null;

              const senderUser = msgSenderId === userId ? null : availableUsers.find(u => u._id === msgSenderId) || (selectedGroup ? selectedGroup.members.find((m: User) => m._id === msgSenderId) : selectedUser);

              return (
                <div
                  key={messageKey}
                  id={`message-${msg._id}`}
                  className={`${styles.messageContainer} flex mb-4 ${
                    isCurrentUser ? "justify-end" : ""
                  }`}
                >
                  <div className="max-w-md relative flex">
                    {/* Avatar chỉ hiển thị cho tin nhắn của người khác */}
                    {!isCurrentUser && senderUser && (
                      <div
                        className={`w-8 h-8 rounded-full overflow-hidden mr-3 relative flex-shrink-0 self-end ${styles.avatarContainer}`}
                        title={senderUser.username}
                      >
                        {senderUser.profilePicture ? (
                          <Image
                            src={senderUser.profilePicture}
                            alt={senderUser.username}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center text-xs"
                            style={{
                              backgroundColor: "var(--messenger-empty-icon-bg)",
                              color: "var(--messenger-text)",
                            }}
                          >
                            {senderUser.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Container cho nội dung tin nhắn */}
                    <div className={`flex-1 ${styles.action}`}>
                      {/* Name in Group */}
                      {!isCurrentUser && selectedGroup && senderUser && (
                         <div className="text-xs text-gray-400 mb-1 ml-1">{senderUser.username}</div>
                      )}
                      {/* Message Actions */}
                      {!preview && (
                        <div
                          className={`${styles.messageActions} ${
                            isCurrentUser
                              ? styles.currentUser
                              : styles.otherUser
                          }`}
                        >
                          <button
                            className={`${styles.messageActionBtn} ${styles.emojiBtn}`}
                            onClick={() => handleEmojiReaction(msg._id)}
                            title="Xem thêm"
                            aria-label="Xem thêm"
                          >
                            <IoMdMore size={24} />
                          </button>

                          <button
                            className={`${styles.messageActionBtn} ${styles.replyBtn}`}
                            onClick={() => dispatch(setReplyTo(msg._id))}
                            title="Trả lời tin nhắn"
                            aria-label="Trả lời tin nhắn này"
                          >
                            <MdOutlineReply size={24} />
                          </button>

                          <button
                            className={`${styles.messageActionBtn} ${styles.emojiBtn}`}
                            onClick={() => handleEmojiReaction(msg._id)}
                            title="Thêm emoji"
                            aria-label="Thêm emoji reaction"
                          >
                            <HiOutlineFaceSmile size={24} />
                          </button>
                        </div>
                      )}

                      <div
                        className={`flex flex-col ${
                          isCurrentUser ? "items-end" : "items-start"
                        }`}
                      >
                        {/* Container cho reply + tin nhắn chính */}
                        <div
                          className={`flex flex-col ${styles.alo} ${
                            isCurrentUser ? "items-end" : "items-start"
                          } max-w-xs gap-1`}
                        >
                          {/* Tin nhắn được reply (nếu có) */}
                          {msg.replyTo && (
                            <div
                              className="w-full flex flex-col mb-1"
                              style={{ marginTop: "20px" }}
                            >
                              <ReplyMessageDisplayText
                                replyTo={msg.replyTo}
                                availableUsers={availableUsers}
                                messages={messages}
                                userId={userId}
                                currentMessageSenderId={msgSenderId}
                              />
                              <div
                                className={`${styles.alo} cursor-pointer transition-opacity max-w-full`}
                                style={{
                                  marginBottom: "-20px",
                                  borderRadius: "18px", // Reply bubble cũng tròn đều
                                }}
                                onClick={() => {
                                  const repliedMsgId =
                                    typeof msg.replyTo === "string"
                                      ? msg.replyTo
                                      : msg.replyTo &&
                                        typeof msg.replyTo === "object" &&
                                        "_id" in msg.replyTo
                                      ? (msg.replyTo as { _id: string })._id
                                      : undefined;
                                  if (repliedMsgId)
                                    handleReplyClick(repliedMsgId);
                                }}
                              >
                                <ReplyMessageBubble
                                  replyTo={msg.replyTo}
                                  messages={messages}
                                  userId={userId}
                                  sender={msgSenderId}
                                  receiver={msgReceiverId}
                                />
                              </div>
                            </div>
                          )}

                          {/* Tin nhắn chính */}
                          <div
                            className={`flex flex-col gap-2 ${
                              isCurrentUser ? "items-end" : "items-start"
                            }`}
                          >
                            {/* Text message bubble với width tự nhiên */}
                            {msg.message && (
                              <div
                                className={`message-bubble ${
                                  isCurrentUser ? styles.bubbleSelf : styles.bubbleOther
                                } px-3 py-2 inline-block max-w-[280px] w-fit`}
                                style={{
                                  zIndex: 2,
                                  borderRadius: (() => {
                                    // Tính toán border-radius dựa trên độ dài tin nhắn
                                    const messageLength =
                                      msg.message?.length || 0;
                                    let borderRadius;

                                    if (messageLength <= 10) {
                                      borderRadius = 20;
                                    } else if (messageLength <= 30) {
                                      borderRadius = 18;
                                    } else if (messageLength <= 80) {
                                      borderRadius = 16;
                                    } else {
                                      borderRadius = 14;
                                    }

                                    // Nếu có media, điều chỉnh border-radius để tạo hiệu ứng nối
                                    if (msg.mediaUrl) {
                                      if (isCurrentUser) {
                                        // Người dùng hiện tại - làm tròn góc trái dưới ít hơn
                                        return `${borderRadius}px ${borderRadius}px ${
                                          borderRadius - 12
                                        }px ${borderRadius}px`;
                                      } else {
                                        // Người khác - làm tròn góc phải dưới ít hơn
                                        return `${borderRadius}px ${borderRadius}px ${borderRadius}px ${
                                          borderRadius - 12
                                        }px`;
                                      }
                                    }

                                    // Không có media - tất cả góc đều tròn như cũ
                                    return `${borderRadius}px`;
                                  })(),
                                }}
                              >
                                <p
                                  className={`${styles.text} ${styles.bubbleText} text-sm leading-relaxed`}
                                >
                                  {msg.message}
                                </p>
                              </div>
                            )}

                            {/* Media với width riêng biệt */}
                            {msg.mediaUrl && (
                              <div
                                className="overflow-hidden w-fit relative group"
                                style={{
                                  backgroundColor: "transparent",
                                  zIndex: 1,
                                  borderRadius: (() => {
                                    // Điều chỉnh border-radius của media để nối với text
                                    if (msg.message) {
                                      if (isCurrentUser) {
                                        // Người dùng hiện tại (bên phải) - giảm borderRadius góc phải
                                        return "16px 5px 16px 16px";
                                      } else {
                                        // Người khác (bên trái) - giảm borderRadius góc trái
                                        return "5px 16px 16px 16px";
                                      }
                                    }
                                    // Không có text - tất cả góc đều tròn
                                    return "16px";
                                  })(),
                                  marginTop: msg.message ? "-8px" : "0",
                                }}
                              >
                                <div
                                  className="absolute inset-0 pointer-events-none rounded-[inherit] opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                  style={{ background: "rgba(0,0,0,0.08)" }}
                                />
                                <div className="transition-transform duration-200 group-hover:scale-[1.03]">
                                  {msg.mediaType === "image" ? (
                                    <Image
                                      src={msg.mediaUrl}
                                      alt="Shared image"
                                      width={200}
                                      height={150}
                                      className="object-cover cursor-pointer"
                                      style={{
                                        maxHeight: "200px",
                                        minHeight: "80px",
                                        maxWidth: "200px",
                                        width: "auto",
                                        height: "auto",
                                        display: "block",
                                        borderRadius: "inherit",
                                        background: "transparent",
                                      }}
                                      loading="lazy"
                                      onClick={() => {
                                        setPreviewMedia({
                                          src: msg.mediaUrl || "",
                                          type: "image",
                                        });
                                      }}
                                      onError={() => {
                                        console.error(
                                          "Failed to load image:",
                                          msg.mediaUrl
                                        );
                                      }}
                                    />
                                  ) : msg.mediaType === "video" ? (
                                    <video
                                      src={msg.mediaUrl}
                                      controls
                                      className="cursor-pointer object-cover"
                                      style={{
                                        maxHeight: "200px",
                                        minHeight: "80px",
                                        maxWidth: "200px",
                                        width: "auto",
                                        height: "auto",
                                        display: "block",
                                        borderRadius: "inherit",
                                        background: "transparent",
                                      }}
                                      preload="metadata"
                                      onClick={() => {
                                        setPreviewMedia({
                                          src: msg.mediaUrl || "",
                                          type: "video",
                                        });
                                      }}
                                      onError={() => {
                                        console.error(
                                          "Failed to load video:",
                                          msg.mediaUrl
                                        );
                                      }}
                                    >
                                      <source src={msg.mediaUrl} />
                                      Trình duyệt không hỗ trợ phát video này.
                                    </video>
                                  ) : null}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Thời gian tin nhắn + Actions Preview */}
                        {preview ? (
                          <div className={styles.messageMetaPreviewRow}>
                            {isCurrentUser ? (
                              <>
                                <div className={styles.messageActionsPreview}>
                                  <button
                                    className={styles.messageActionBtn}
                                    onClick={() => handleEmojiReaction(msg._id)}
                                    title="Xem thêm"
                                    aria-label="Xem thêm"
                                  >
                                    <IoMdMore size={16} />
                                  </button>
                                  <button
                                    className={styles.messageActionBtn}
                                    onClick={() =>
                                      dispatch(setReplyTo(msg._id))
                                    }
                                    title="Trả lời tin nhắn"
                                    aria-label="Trả lời tin nhắn này"
                                  >
                                    <MdOutlineReply size={16} />
                                  </button>
                                  <button
                                    className={styles.messageActionBtn}
                                    onClick={() => handleEmojiReaction(msg._id)}
                                    title="Thêm emoji"
                                    aria-label="Thêm emoji reaction"
                                  >
                                    <HiOutlineFaceSmile size={16} />
                                  </button>
                                </div>
                                <p className={`text-xs px-1 ${styles.metaText}`}>
                                  {formatTime(
                                    typeof msg.createdAt === "number"
                                      ? new Date(msg.createdAt)
                                      : !isNaN(Number(msg.createdAt))
                                      ? new Date(Number(msg.createdAt))
                                      : msg.createdAt,
                                    "HH:mm"
                                  )}
                                </p>
                              </>
                            ) : (
                              <>
                                <p className={`text-xs px-1 ${styles.metaText}`}>
                                  {formatTime(
                                    typeof msg.createdAt === "number"
                                      ? new Date(msg.createdAt)
                                      : !isNaN(Number(msg.createdAt))
                                      ? new Date(Number(msg.createdAt))
                                      : msg.createdAt,
                                    "HH:mm"
                                  )}
                                </p>
                                <div className={styles.messageActionsPreview}>
                                  <button
                                    className={styles.messageActionBtn}
                                    onClick={() => handleEmojiReaction(msg._id)}
                                    title="Xem thêm"
                                    aria-label="Xem thêm"
                                  >
                                    <IoMdMore size={16} />
                                  </button>
                                  <button
                                    className={styles.messageActionBtn}
                                    onClick={() =>
                                      dispatch(setReplyTo(msg._id))
                                    }
                                    title="Trả lời tin nhắn"
                                    aria-label="Trả lời tin nhắn này"
                                  >
                                    <MdOutlineReply size={16} />
                                  </button>
                                  <button
                                    className={styles.messageActionBtn}
                                    onClick={() => handleEmojiReaction(msg._id)}
                                    title="Thêm emoji"
                                    aria-label="Thêm emoji reaction"
                                  >
                                    <HiOutlineFaceSmile size={16} />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        ) : (
                          <p className={`text-xs mt-4 px-1 ${styles.metaText}`}>
                            {formatTime(
                              typeof msg.createdAt === "number"
                                ? new Date(msg.createdAt)
                                : !isNaN(Number(msg.createdAt))
                                ? new Date(Number(msg.createdAt))
                                : msg.createdAt,
                              "HH:mm"
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex justify-center items-center h-full">
              <p className={styles.emptyText}>
                Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
              </p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      ) : (
        <div className={`flex-1 flex items-center justify-center ${styles.emptyText}`}>
          Chọn một cuộc trò chuyện hoặc bắt đầu một cuộc trò chuyện mới
        </div>
      )}

      <MessageInput
        message={message}
        setMessage={setMessage}
        handleSendMessage={handleSendMessage}
        handleKeyPress={handleKeyPress}
        replyTo={replyTo}
        clearReplyTo={() => dispatch(clearReplyTo())}
        messages={messages}
        availableUsers={availableUsers}
        userId={userId}
        file={file}
        setFile={setFile}
        filePreview={filePreview}
        setFilePreview={setFilePreview}
        fileInputRef={fileInputRef}
        // Truyền mediaType của replyTo nếu có
        replyToMediaType={(() => {
          if (!replyTo) return undefined;
          if (
            typeof replyTo === "object" &&
            replyTo !== null &&
            "mediaType" in replyTo &&
            typeof (replyTo as { mediaType?: string }).mediaType === "string"
          ) {
            return (replyTo as { mediaType: string }).mediaType;
          }
          if (typeof replyTo === "string") {
            const found = messages.find((msg) => msg._id === replyTo);
            return found?.mediaType;
          }
          return undefined;
        })()}
      />

      {/* Media Preview Component - Ảnh/Video được chọn để xem trước */}
      {previewMedia && (
        <div
          className={`fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center`}
          onClick={() => setPreviewMedia(null)} // Đóng khi click ra ngoài
        >
          <ImageVideoPreview
            src={previewMedia.src}
            type={previewMedia.type}
            onClose={() => setPreviewMedia(null)}
          />
        </div>
      )}

      {/* Preview Media Modal */}
      {previewMedia && (
        <ImageVideoPreview
          src={previewMedia.src}
          type={previewMedia.type}
          onClose={() => setPreviewMedia(null)}
        />
      )}

      {selectedGroup && (
        <GroupMembersModal
          isOpen={showGroupMembers}
          onClose={() => setShowGroupMembers(false)}
          group={selectedGroup}
          handleUserClick={handleUserClick}
        />
      )}
    </div>
  );
}
