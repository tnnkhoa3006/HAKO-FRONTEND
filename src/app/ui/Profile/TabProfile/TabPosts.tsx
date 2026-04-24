import { useEffect, useState } from "react";
import Image from "next/image";
import { Camera, Play } from "lucide-react";
import { usePost } from "@/app/hooks/usePost";
import PostModal from "@/components/Modal/Post/PostModal";
import { getUserPosts } from "@/server/posts";
import { Post as HomePost } from "@/types/home.type";
import { User } from "@/types/user.type";

type ProfilePost = Pick<HomePost, "_id" | "fileUrl" | "type">;

const PostSkeleton = () => (
  <div
    className="relative aspect-square rounded-lg animate-pulse"
    style={{ backgroundColor: "var(--profile-card)" }}
  >
    <div
      className="w-full h-full rounded-lg"
      style={{ backgroundColor: "var(--surface-muted-hover)" }}
    ></div>
  </div>
);

export default function TabPosts({ user }: { user: User }) {
  const {
    selectedPost,
    isModalOpen,
    handlePostClick,
    setIsModalOpen,
    setSelectedPost,
  } = usePost();
  const [posts, setPosts] = useState<ProfilePost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPostLoading, setIsPostLoading] = useState(false);

  const postsCount = user?.posts?.length ?? 0;

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setIsLoading(true);
        const data = await getUserPosts({
          userId: user._id,
          username: user.username,
        });
        setPosts(
          data.filter(
            (post: ProfilePost) => post.type !== "text" && Boolean(post.fileUrl)
          )
        );
      } catch (error) {
        console.error("Loi khi lay bai dang:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?._id || user?.username) {
      fetchPosts();
    }
  }, [user]);

  const handleClick = async (postId: string) => {
    setIsPostLoading(true);
    await handlePostClick(postId);
    setIsPostLoading(false);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPost(null);
  };

  return (
    <div className="mt-5">
      {isLoading ? (
        postsCount === 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <PostSkeleton key={index} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {Array.from({ length: postsCount }).map((_, index) => (
              <PostSkeleton key={index} />
            ))}
          </div>
        )
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-10 text-center">
          <div className="mb-4" style={{ color: "var(--secondary-text)" }}>
            <Camera size={50} />
          </div>
          <h2
            className="text-xl font-semibold"
            style={{ color: "var(--profile-text)" }}
          >
            Chưa có bài viết
          </h2>
          <p style={{ color: "var(--secondary-text)" }}>
            Khi người dùng chia sẻ ảnh hoặc video, bài viết sẽ hiển thị tại đây
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {posts.map((post) => (
            <div
              key={post._id}
              className="relative aspect-square cursor-pointer overflow-hidden rounded-lg transition-opacity hover:opacity-90"
              onClick={() => handleClick(post._id)}
            >
              {post.type === "video" ? (
                <>
                  <video
                    src={post.fileUrl}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                    preload="metadata"
                  />
                  <div className="pointer-events-none absolute right-3 top-3">
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-full"
                      style={{
                        backgroundColor: "rgba(15, 23, 42, 0.52)",
                        backdropFilter: "blur(6px)",
                      }}
                    >
                      <Play size={16} className="ml-0.5 text-white fill-white" />
                    </div>
                  </div>
                </>
              ) : (
                <Image
                  src={post.fileUrl}
                  alt="Post"
                  className="w-full h-full object-cover"
                  width={300}
                  height={300}
                />
              )}

              {isPostLoading &&
                selectedPost &&
                selectedPost._id === post._id && (
                  <div
                    className="absolute inset-0 flex items-center justify-center rounded-lg"
                    style={{ backgroundColor: "var(--overlay-backdrop)" }}
                  >
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
                  </div>
                )}
            </div>
          ))}
        </div>
      )}

      {isModalOpen && selectedPost && (
        <PostModal post={selectedPost} onClose={handleCloseModal} />
      )}
    </div>
  );
}
