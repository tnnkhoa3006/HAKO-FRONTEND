import React, { useRef, useState } from "react";
import { SendHorizontal, Smile, Image as ImageIcon } from "lucide-react";
import styles from "./Messenger.module.scss";
import InputStory from "../Modal/Story/StoryInput";
import { ReplyMessageDisplayText, ReplyMessageBubble } from "./ReplyMessage";
import type { User, Message } from "@/types/user.type";
import Image from "next/image";
import EmojiPicker from "@/components/EmojiPicker";
import {
  focusAndRestoreSelection,
  insertTextAtCursor,
} from "@/utils/insertTextAtCursor";

export type MessageInputProps = {
  message: string;
  setMessage: (value: string) => void;
  handleSendMessage: () => void;
  handleKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  inputStory?: boolean;
  // --- Reply feature ---
  replyTo?: string | null;
  clearReplyTo?: () => void;
  messages?: Message[];
  availableUsers?: User[];
  userId?: string;
  // Thêm các props cho file upload
  file?: File | null;
  setFile?: (f: File | null) => void;
  filePreview?: string | null;
  setFilePreview?: (url: string | null) => void;
  fileInputRef?: React.RefObject<HTMLInputElement | null>;
  // Thêm prop để nhận mediaType của replyTo
  replyToMediaType?: string;
};

export default function MessageInput({
  message,
  setMessage,
  handleSendMessage,
  handleKeyPress,
  inputStory = false,
  replyTo,
  clearReplyTo,
  messages = [],
  availableUsers = [],
  userId = "",
  file,
  setFile,
  filePreview,
  setFilePreview,
  fileInputRef,
  replyToMediaType,
}: MessageInputProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  if (inputStory) {
    // Giao diện tối giản cho story: input ở giữa, heart icon, send button
    return (
      <InputStory
        message={message}
        setMessage={setMessage}
        handleSendMessage={handleSendMessage}
        handleKeyPress={handleKeyPress}
      />
    );
  }

  // Thêm logic chọn file, preview, và nút gửi file ở đây
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!setFile || !setFilePreview) return;
    const file = e.target.files?.[0] || null;
    setFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setFilePreview(url);
    } else {
      setFilePreview(null);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    const { nextValue, cursorPosition } = insertTextAtCursor(
      inputRef.current,
      message,
      emoji
    );

    setMessage(nextValue);
    setShowEmojiPicker(false);
    focusAndRestoreSelection(inputRef.current, cursorPosition);
  };

  return (
    <div
      className={`p-4 ${styles.messageInput}`}
    >
      {/* Reply preview below input */}
      {replyTo && (
        <div
          className={`flex items-center mb-2 rounded-lg px-3 py-2 relative overflow-hidden justify-start ${styles.replyPreview}`}
        >
          <div className="flex-1 min-w-0">
            {replyToMediaType === "image" ? (
              <>
                <ReplyMessageDisplayText
                  replyTo={replyTo}
                  availableUsers={availableUsers}
                  messages={messages}
                  userId={userId}
                  isPreview={true}
                  currentMessageSenderId={userId}
                />
                <p className={`text-[13px] font-medium mb-0.5 ${styles.chatName}`}>
                  Hình ảnh
                </p>
              </>
            ) : replyToMediaType === "video" ? (
              <>
                <ReplyMessageDisplayText
                  replyTo={replyTo}
                  availableUsers={availableUsers}
                  messages={messages}
                  userId={userId}
                  isPreview={true}
                  currentMessageSenderId={userId}
                />
                <p className={`text-[13px] font-medium mb-0.5 ${styles.chatName}`}>
                  Video
                </p>
              </>
            ) : (
              <>
                <ReplyMessageDisplayText
                  replyTo={replyTo}
                  availableUsers={availableUsers}
                  messages={messages}
                  userId={userId}
                  isPreview={true}
                  currentMessageSenderId={userId}
                />
                {/* FIXED: Bọc ReplyMessageBubble trong div để luôn căn trái */}
                <div style={{ display: "flex", justifyContent: "flex-start" }}>
                  <ReplyMessageBubble
                    replyTo={replyTo}
                    messages={messages}
                    userId={userId}
                  />
                </div>
              </>
            )}
          </div>
          <button
            className={`ml-2 text-xs px-1 ${styles.inputIcon}`}
            onClick={clearReplyTo}
            title="Hủy trả lời"
            type="button"
          >
            ✕
          </button>
        </div>
      )}
      {/* Hiển thị preview file nếu có */}
      {filePreview && (
        <div className="mb-2 flex items-center gap-2">
          {file && file.type.startsWith("image/") && (
            <Image
              src={filePreview}
              alt="preview"
              width={96}
              height={96}
              className="max-h-24 rounded"
            />
          )}
          {file && file.type.startsWith("video/") && (
            <video src={filePreview} controls className="max-h-24 rounded" />
          )}
          <button
            className={`ml-2 text-xs px-1 ${styles.inputIcon}`}
            onClick={() => {
              if (setFile) setFile(null);
              if (setFilePreview) setFilePreview(null);
              if (fileInputRef && fileInputRef.current)
                fileInputRef.current.value = "";
            }}
            title="Xóa file"
            type="button"
          >
            ✕
          </button>
        </div>
      )}
      <div className="flex items-center">
        <div className={`relative mr-3 flex-shrink-0 ${styles.emojiPickerAnchor}`}>
          <button
            type="button"
            className={`${styles.emojiTrigger} ${styles.inputIcon}`}
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            aria-label="Open emoji picker"
          >
            <Smile className="h-6 w-6" />
          </button>

          {showEmojiPicker && (
            <EmojiPicker
              onSelect={handleEmojiSelect}
              onClose={() => setShowEmojiPicker(false)}
            />
          )}
        </div>
        <div
          className={`flex-1 rounded-full flex items-center ${styles.fileInput} ${styles.inputShell}`}
        >
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Message..."
            className={`flex-1 bg-transparent px-4 py-2 focus:outline-none ${styles.inputText}`}
          />
          <button
            className={`mr-2 flex-shrink-0 ${styles.inputIcon}`}
            type="button"
            onClick={() =>
              fileInputRef &&
              fileInputRef.current &&
              fileInputRef.current.click()
            }
          >
            <ImageIcon
              className="h-5 w-5"
              style={{ cursor: "pointer" }}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              className={`hidden`}
              onChange={handleFileChange}
            />
          </button>
        </div>
        <button
          className={`ml-3 flex-shrink-0 ${styles.inputIcon}`}
          onClick={handleSendMessage}
        >
          <div className="flex items-center justify-center h-8 w-8">
            {message || file ? (
              <SendHorizontal className="h-5 w-5 text-blue-500" />
            ) : (
              <SendHorizontal className="h-5 w-5" />
            )}
          </div>
        </button>
      </div>
    </div>
  );
}
