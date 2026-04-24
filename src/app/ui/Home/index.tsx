import { Post } from "@/types/home.type";
import Image from "next/image";
import { useState, useRef, useEffect, memo } from "react";
import styles from "./Home.module.scss";
import InteractionButton from "../InteractionButton";
import CommentInput from "../CommentInput";
import ShortenCaption from "@/components/ShortenCaption";
import Comment from "../Comment";
import { useTime } from "@/app/hooks/useTime";
import { useCount } from "@/app/hooks/useCount";
import { BiDotsHorizontalRounded } from "react-icons/bi";
import OverlayRelatedPosts from "@/components/Post/OverlayRelatedPosts";
import { useStory } from "@/contexts/StoryContext";
import StoryAvatar from "@/components/Story/StoryAvatar";
import { usePostContext } from "@/contexts/PostContext";
import { socketService } from "@/server/socket";
import { useHandleUserClick } from "@/utils/useHandleUserClick";

type AuthorType = Post["author"];

interface HomeUiProps {
  loading: boolean;
  posts: Post[];
  onLikeRealtime: (postId: string, isLike: boolean) => void;
  onOpenPostModal?: (post: Post, videoTime?: number) => void;
  relatedOverlayPostId?: string | null;
  onCloseRelatedOverlay?: () => void;
}

// Skeleton Loading Component
const SkeletonPost = memo(() => (
  <div
    className={`${styles.postItemResponsiveBg} rounded-md`}
    style={{ border: "1px solid var(--post-border)" }}
  >
    {/* Header skeleton */}
    <div className="flex items-center gap-3 p-3 justify-between">
      <div className="w-10 h-10 bg-gray-700 rounded-full animate-pulse"></div>
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="w-24 h-4 bg-gray-700 rounded animate-pulse"></div>
          <div className="w-16 h-3 bg-gray-700 rounded animate-pulse"></div>
        </div>
      </div>
      <div className="w-6 h-6 bg-gray-700 rounded-full animate-pulse"></div>
    </div>

    {/* Media skeleton */}
    <div
      className={`${styles.mediaContainerResponsiveBg} relative w-full aspect-square`}
    >
      <div
        className="w-full h-full bg-gray-700 animate-pulse"
        style={{ borderRadius: "8px" }}
      ></div>
    </div>

    {/* Interaction buttons skeleton */}
    <div
      className={`flex items-center justify-between px-3 py-3 ${styles.InteractionButtonContainer}`}
    >
      <div className="flex items-center gap-4">
        <div className="w-6 h-6 bg-gray-700 rounded animate-pulse"></div>
        <div className="w-6 h-6 bg-gray-700 rounded animate-pulse"></div>
        <div className="w-6 h-6 bg-gray-700 rounded animate-pulse"></div>
      </div>
      <div className="w-6 h-6 bg-gray-700 rounded animate-pulse"></div>
    </div>

    {/* Likes skeleton */}
    <div className={`px-3 pb-2 ${styles.commentInput}`}>
      <div className="w-20 h-4 bg-gray-700 rounded animate-pulse"></div>
    </div>

    {/* Caption skeleton */}
    <div className="px-3 pb-2">
      <div className="flex items-start gap-2">
        <div className="w-16 h-4 bg-gray-700 rounded animate-pulse"></div>
        <div className="flex-1">
          <div className="w-full h-4 bg-gray-700 rounded animate-pulse mb-1"></div>
          <div className="w-3/4 h-4 bg-gray-700 rounded animate-pulse"></div>
        </div>
      </div>
    </div>

    {/* Comments link skeleton */}
    <div className={`px-3 pt-1 pb-2 ${styles.commentInput}`}>
      <div className="w-32 h-3 bg-gray-700 rounded animate-pulse"></div>
    </div>

    {/* Comment input skeleton */}
    <div className={`px-3 pb-3 ${styles.commentInput}`}>
      <div className="w-full h-10 bg-gray-700 rounded animate-pulse"></div>
    </div>
  </div>
));

SkeletonPost.displayName = "SkeletonPost";

// PostItem component được tách riêng để tối ưu
const PostItem = memo(
  ({
    post,
    onOpenComments,
    onOpenPostSettings,
    onAvatarClick,
    onUserClick,
    visiblePosts,
    videoRefs,
    postRefs,
    fromNow,
    format,
    handleLikeRealtime,
    showRelatedOverlay,
    onCloseRelatedOverlay,
  }: {
    post: Post;
    onOpenComments: (post: Post, e: React.MouseEvent) => void;
    onOpenPostSettings: (post: Post, e: React.MouseEvent) => void;
    onAvatarClick: (author: AuthorType) => void;
    onUserClick: (username: string) => void;
    visiblePosts: string[];
    videoRefs: React.MutableRefObject<{
      [key: string]: HTMLVideoElement | null;
    }>;
    postRefs: React.MutableRefObject<{ [key: string]: HTMLDivElement | null }>;
    fromNow: (date: string) => string;
    format: (num: number) => string;
    handleLikeRealtime: (postId: string, isLike: boolean) => void;
    showRelatedOverlay?: boolean;
    onCloseRelatedOverlay?: () => void;
  }) => {
    const [showAiSummary, setShowAiSummary] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    const author = post.author;
    const authorUsername = author?.username || "Người dùng";
    const authorProfilePicture =
      author?.profilePicture || "/api/placeholder/40/40";
    const hasAuthorProfile = Boolean(author?._id || author?.username);
    const postText = post.caption?.trim() || post.desc?.trim() || "";
    const isTextOnlyPost = post.type === "text" || !post.fileUrl;
 
    const CHAR_LIMIT = 260;
    const isLongText = postText.length > CHAR_LIMIT;
    const displayPostText = isLongText && !isExpanded 
      ? postText.slice(0, CHAR_LIMIT) + "..." 
      : postText;

    return (
      <div
        ref={(el) => {
          postRefs.current[post._id] = el;
          return undefined;
        }}
        data-post-id={post._id}
        className={`${styles.postItemResponsiveBg} rounded-md`}
        style={{ border: "1px solid var(--post-border)" }}
      >
        <div className="flex items-center gap-3 p-3 justify-between">
          {/* Avatar */}
          <div
            onClick={() => {
              if (hasAuthorProfile) {
                onAvatarClick(author);
              }
            }}
            className={hasAuthorProfile ? "cursor-pointer" : "cursor-default"}
          >
            {post.hasStories && hasAuthorProfile ? (
              <StoryAvatar
                author={author}
                hasStories={true}
                size="small"
              />
            ) : (
              <Image
                onClick={(e) => {
                  e.stopPropagation();
                  if (author?.username) {
                    onUserClick(author.username);
                  }
                }}
                src={authorProfilePicture}
                alt={authorUsername}
                width={40}
                height={40}
                className="rounded-full object-cover w-10 h-10"
                priority
              />
            )}
          </div>

          {/* Username & time */}
          <div className="flex flex-1 flex-col" style={{ color: "var(--post-text)" }}>
            <div className="flex items-center gap-2 font-semibold" style={{ color: "var(--post-text)" }}>
              <span
                className="hover:underline cursor-pointer flex items-center gap-1.5"
                onClick={(e) => {
                  e.stopPropagation();
                  if (author?.username) {
                    onUserClick(author.username);
                  }
                }}
              >
                {authorUsername}

                {author?.checkMark && (
                  <svg
                    aria-label="Đã xác minh"
                    fill="rgb(0, 149, 246)"
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
              </span>
            </div>

            {/* Time - đặt dưới username */}
            <span className="text-sm flex items-center" style={{ color: "var(--post-time-text)" }}>
              {fromNow(post.createdAt)}
            </span>
          </div>

          {/* PostSetting trigger button */}
          <button
            onClick={(e) => onOpenPostSettings(post, e)}
            className="p-1 rounded-full transition-colors"
            style={{ color: "var(--post-text)" }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--sidebar-hover)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <BiDotsHorizontalRounded size={24} />
          </button>
        </div>

        <div
          className={`${styles.mediaContainerResponsiveBg} relative w-full ${
            isTextOnlyPost ? styles.textPostWrapper : "aspect-square"
          }`}
        >
          {isTextOnlyPost ? (
            <div className={`${styles.textPostCard} ${isExpanded ? styles.expanded : ""}`}>
              <div className={styles.textPostTexture}></div>
              <div className={styles.textPostContent}>
                <p className={styles.textPostCaption}>{displayPostText}</p>
                {isLongText && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsExpanded(!isExpanded);
                    }}
                    className={styles.seeMoreBtn}
                  >
                    {isExpanded ? "Thu gọn" : "Xem thêm"}
                  </button>
                )}
              </div>
            </div>
          ) : post.type === "image" ? (
            <Image
              src={post.fileUrl}
              alt={post.caption}
              fill
              className="object-cover"
              style={{ borderRadius: "8px" }}
            />
          ) : post.type === "video" ? (
            <video
              ref={(el) => {
                videoRefs.current[post._id] = el;
                return undefined;
              }}
              src={post.fileUrl}
              className="w-full h-full object-cover"
              style={{ borderRadius: "8px" }}
              autoPlay={visiblePosts.includes(post._id)}
              muted={false}
              playsInline
              controls
              controlsList="nodownload noremoteplayback"
              onClick={(e) => e.stopPropagation()}
              onPlay={() => {
                const video = videoRefs.current[post._id];
                if (video) delete video.dataset.userPaused;
              }}
              onPause={() => {
                const video = videoRefs.current[post._id];
                if (
                  video &&
                  document.body.contains(video) &&
                  video.closest("[data-post-id]")
                ) {
                  video.dataset.userPaused = "true";
                }
              }}
            />
          ) : null}

          {showRelatedOverlay && (
            <OverlayRelatedPosts
              postId={post._id}
              onClose={onCloseRelatedOverlay || (() => {})}
            />
          )}

        </div>

        <div
          className={`flex items-center justify-between px-3 py-3 ${styles.InteractionButtonContainer}`}
        >
          <InteractionButton
            post={post}
            style={{
              padding: "0",
              borderTop: "none",
            }}
            onClick={(
              e: React.MouseEvent<HTMLButtonElement | HTMLDivElement>
            ) => onOpenComments(post, e)}
            TotalHeart={post.totalLikes}
            TotalComment={post.totalComments}
            isLiked={post.isLike}
            onLikeRealtime={handleLikeRealtime}
          />
        </div>

        <div
          className={`px-3 pb-2 font-semibold ${styles.commentInput}`}
          style={{ color: "var(--post-text)" }}
        >
          {format(post.totalLikes)} lượt thích
        </div>

        {!isTextOnlyPost && (
          <div className="px-3 pb-2" style={{ color: "var(--post-subtext)" }}>
          <span
            className={`font-semibold mr-2 cursor-pointer hover:underline`}
            style={{ color: "var(--post-text)" }}
          >
            {authorUsername}
          </span>
          <ShortenCaption text={post.caption} maxLines={2} className="w-full" />

          {post.aiSummary && (
            <div className={styles.aiSummaryWrapper}>
              <button
                className={`${styles.aiSummaryToggle} ${showAiSummary ? styles.active : ""}`}
                onClick={() => setShowAiSummary(!showAiSummary)}
              >
                <div className={styles.aiSparkleIcon}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
                  </svg>
                </div>
                <span>{showAiSummary ? "Ẩn tóm tắt" : "Tóm tắt thông minh"}</span>
              </button>

              {showAiSummary && (
                <div className={styles.aiSummaryContainer}>
                  <p className={styles.aiSummaryText}>{post.aiSummary}</p>
                </div>
              )}
            </div>
          )}
          </div>
        )}
        <button
          className={`px-3 pt-1 pb-2 text-sm text-[#8e8e8e] cursor-pointer hover:underline ${styles.commentInput}`}
          onClick={(e) => onOpenComments(post, e)}
        >
          Xem tất cả {format(post.totalComments)} bình luận
        </button>

        <div className={styles.commentInput}>
          <CommentInput post={post} />
        </div>
      </div>
    );
  }
);

PostItem.displayName = "PostItem";

export default function HomeUi({
  loading,
  posts,
  onLikeRealtime,
  onOpenPostModal,
  isMobileView, // nhận từ cha
  onOpenMobileComment, // callback từ cha
  onOpenPostSettings, // thêm prop này
  relatedOverlayPostId,
  onCloseRelatedOverlay,
}: HomeUiProps & {
  isMobileView?: boolean;
  onOpenMobileComment?: (post: Post, videoTime?: number) => void;
  onOpenPostSettings?: (post: Post, e: React.MouseEvent) => void;
}) {
  const { setPosts } = usePostContext();
  // Restore local state for mobile comment modal logic
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [commentsAnimationClass, setCommentsAnimationClass] = useState("");
  const [overlayAnimationClass, setOverlayAnimationClass] = useState("");
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});
  const postRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [visiblePosts, setVisiblePosts] = useState<string[]>([]);
  const { fromNow } = useTime();
  const { format } = useCount();
  const handleUserClick = useHandleUserClick();
  const { openStory } = useStory();
  const isAnyModalOpen = useRef(false);

  const handleAvatarClick = async (author: AuthorType) => {
    if (!author?._id) return;
    await openStory(author, 0);
  };

  // Intersection Observer để quản lý autoplay video và visible posts
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        setVisiblePosts((prev) => {
          let changed = false;
          let newVisible = [...prev];
          entries.forEach((entry) => {
            const postId = entry.target.getAttribute("data-post-id");
            if (!postId) return;
            if (entry.isIntersecting) {
              if (!newVisible.includes(postId)) {
                newVisible.push(postId);
                changed = true;
              }
            } else {
              if (newVisible.includes(postId)) {
                newVisible = newVisible.filter((id) => id !== postId);
                changed = true;
              }
            }
          });
          return changed ? newVisible : prev;
        });

        // Handle video autoplay
        entries.forEach((entry) => {
          const postId = entry.target.getAttribute("data-post-id");
          if (!postId) return;
          const videoElement = videoRefs.current[postId];
          if (!videoElement) return;

          if (entry.isIntersecting) {
            if (videoElement.paused && !videoElement.dataset.userPaused) {
              videoElement
                .play()
                .catch((err) => console.log("Autoplay prevented:", err));
            }
          } else {
            if (!videoElement.paused) {
              videoElement.pause();
              videoElement.dataset.userPaused = "true";
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    // Observe tất cả posts hiện tại
    Object.keys(postRefs.current).forEach((postId) => {
      const postElement = postRefs.current[postId];
      if (postElement) {
        observer.observe(postElement);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [posts]);

  // Quản lý video pause/play events
  useEffect(() => {
    Object.values(videoRefs.current).forEach(
      (video) => {
        if (video) {
          video.onpause = () => {
            if (
              document.body.contains(video) &&
              video.closest("[data-post-id]")
            ) {
              video.dataset.userPaused = "true";
            }
          };
          video.onplay = () => {
            delete video.dataset.userPaused;
          };
        }
      },
      [posts]
    );
  });

  // Socket events cho realtime updates
  useEffect(() => {
    if (posts && posts.length > 0) {
      posts.forEach((post) => {
        socketService.joinPostRoom(post._id);
      });

      return () => {
        posts.forEach((post) => {
          socketService.leavePostRoom(post._id);
        });
      };
    }
  }, [posts]);

  // Listen to comment created events
  useEffect(() => {
    const handleCommentCreated = (data: {
      itemId: string;
      totalComments?: number;
    }) => {
      setPosts((prev) =>
        prev.map((p) => {
          if (p._id === data.itemId && typeof data.totalComments === "number") {
            if (p.author?.username === "khoatnn_6") {
              return {
                ...p,
                totalComments:
                  data.totalComments > p.totalComments
                    ? p.totalComments + 1
                    : p.totalComments,
              };
            }
            return { ...p, totalComments: data.totalComments };
          }
          return p;
        })
      );
    };

    socketService.onCommentCreated(handleCommentCreated);
    return () => socketService.offCommentCreated(handleCommentCreated);
  }, [setPosts]);

  const handleOpenComments = (post: Post, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isMobileView && onOpenPostModal) {
      // Dừng tất cả video khi mở modal
      Object.values(videoRefs.current).forEach((video) => {
        if (video && !video.paused) video.pause();
      });
      isAnyModalOpen.current = true;
      if (post.type === "video" && videoRefs.current[post._id]) {
        const videoElement = videoRefs.current[post._id];
        if (videoElement) {
          onOpenPostModal(post, videoElement.currentTime);
          return;
        }
      }
      onOpenPostModal(post);
      return;
    }

    // Nếu là mobile thì gọi callback cha để mở comment modal
    if (isMobileView && onOpenMobileComment) {
      if (post.type === "video" && videoRefs.current[post._id]) {
        const videoElement = videoRefs.current[post._id];
        if (videoElement) {
          videoElement.pause();
          onOpenMobileComment(post, videoElement.currentTime);
          return;
        }
      }
      onOpenMobileComment(post);
      return;
    }

    // ...giữ lại logic cũ nếu cần cho fallback
    setSelectedPost(post);
    setShowComments(true);
    setOverlayAnimationClass("");
    setCommentsAnimationClass("");
    setTimeout(() => {
      setOverlayAnimationClass("fadeIn");
      setCommentsAnimationClass("slideIn");
    }, 10);
  };

  const handleCloseComments = () => {
    if (isMobileView) {
      setOverlayAnimationClass("fadeOut");
      setCommentsAnimationClass("slideOut");

      setTimeout(() => {
        setShowComments(false);
        setSelectedPost(null);
        setOverlayAnimationClass("");
        setCommentsAnimationClass("");
      }, 400);
    } else {
      setShowComments(false);
      setSelectedPost(null);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleCloseComments();
  };

  // Hiển thị skeleton khi đang loading
  if (loading) {
    return (
      <div
        className={`${styles.homeContainerResponsiveBg} max-w-xl mx-auto space-y-8 font-sans`}
        style={{ color: "var(--post-text)" }}
      >
        {[...Array(5)].map((_, index) => (
          <SkeletonPost key={`skeleton-${index}`} />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${styles.homeContainerResponsiveBg} max-w-xl mx-auto font-sans`}
      style={{ color: "var(--post-text)" }}
    >
      {posts.map((post) => (
        <div key={post._id} className="mb-0 sm:mb-8">
          <PostItem
            post={post}
            onOpenComments={handleOpenComments}
            onOpenPostSettings={
              onOpenPostSettings ? (p, e) => onOpenPostSettings(p, e) : () => { }
            }
            onAvatarClick={handleAvatarClick}
            onUserClick={handleUserClick}
            visiblePosts={visiblePosts}
            videoRefs={videoRefs}
            postRefs={postRefs}
            fromNow={fromNow}
            format={format}
            handleLikeRealtime={onLikeRealtime}
            showRelatedOverlay={relatedOverlayPostId === post._id}
            onCloseRelatedOverlay={onCloseRelatedOverlay}

          />
        </div>
      ))}

      {/* Overlay và Comment component cho mobile - đã chuyển lên cha */}
      {!isMobileView && showComments && selectedPost && (
        <>
          <div
            className={`${styles.mobileOverlay} ${styles[overlayAnimationClass]}`}
            onClick={handleOverlayClick}
          />
          <Comment
            post={selectedPost}
            onClose={handleCloseComments}
            animationClass={commentsAnimationClass}
          />
        </>
      )}
    </div>
  );
}
