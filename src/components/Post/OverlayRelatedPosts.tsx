"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { Post } from "@/types/home.type";
import { getAuthToken } from "@/server/auth";
import styles from "./OverlayRelatedPosts.module.scss";

type OverlayRelatedPostsProps = {
  postId: string;
  onClose: () => void;
};

export default function OverlayRelatedPosts({
  postId,
  onClose,
}: OverlayRelatedPostsProps) {
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRelated = async () => {
      try {
        const token = getAuthToken();
        const headers: HeadersInit = {
          "Content-Type": "application/json",
        };

        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/posts/${postId}/related`,
          {
            method: "GET",
            headers,
            credentials: "include",
          }
        );

        const data = await res.json();
        if (data.success && data.posts) {
          // Lấy tối đa 4 bài
          setRelatedPosts(data.posts.slice(0, 4));
        }
      } catch (err) {
        console.error("Error fetching related posts:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRelated();
  }, [postId]);

  if (loading) {
    return (
      <div className={styles.overlay}>
        <div className={styles.loading}>Đang tìm bài viết liên quan...</div>
      </div>
    );
  }

  if (relatedPosts.length === 0) {
    return (
      <div className={styles.overlay}>
        <button className={styles.closeBtn} onClick={onClose}>
          <X size={24} />
        </button>
        <div className={styles.noData}>Không tìm thấy bài viết liên quan</div>
      </div>
    );
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.container} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>Gợi ý cho bạn</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className={styles.grid}>
          {relatedPosts.map((post) => (
            <Link
              key={post._id}
              href={`/post/${post._id}`}
              className={styles.item}
            >
              <div className={styles.imageWrapper}>
                {post.type === "text" || !post.fileUrl ? (
                  <div className={styles.textCard}>
                    <p>{post.caption || "Bài viết chữ"}</p>
                  </div>
                ) : (
                  <Image
                    src={post.fileUrl}
                    alt={post.caption || "Related post"}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className={styles.image}
                  />
                )}
              </div>
              {post.caption && (
                <div className={styles.captionOverlay}>
                  <p>{post.caption}</p>
                </div>
              )}
            </Link>
          ))}

        </div>
      </div>
    </div>
  );
}
