"use client";

import Image from "next/image";
import Link from "next/link";
import styles from "./Messenger.module.scss";
import type { BotSearchResultPost, Message } from "@/types/user.type";

type MessageBubbleProps = {
  message: Message;
  isCurrentUser: boolean;
  onQuickReply?: (prompt: string) => void;
};

type QuickReply = {
  label: string;
  prompt: string;
};

const isQuickReply = (value: unknown): value is QuickReply => {
  return (
    typeof value === "object" &&
    value !== null &&
    "label" in value &&
    "prompt" in value &&
    typeof (value as QuickReply).label === "string" &&
    typeof (value as QuickReply).prompt === "string"
  );
};

const isSearchResultPost = (value: unknown): value is BotSearchResultPost => {
  return (
    typeof value === "object" &&
    value !== null &&
    "_id" in value &&
    "link" in value &&
    typeof (value as BotSearchResultPost)._id === "string" &&
    typeof (value as BotSearchResultPost).link === "string"
  );
};

export default function MessageBubble({
  message,
  isCurrentUser,
  onQuickReply,
}: MessageBubbleProps) {
  if (isCurrentUser || !message.botPayload) {
    return null;
  }

  const payload = message.botPayload;
  const quickReplies = Array.isArray(payload.suggestions)
    ? payload.suggestions.filter(isQuickReply)
    : [];
  const captionSuggestions =
    payload.type === "caption_suggestions" && Array.isArray(payload.suggestions)
      ? payload.suggestions.filter(
          (suggestion): suggestion is string => typeof suggestion === "string"
        )
      : [];
  const searchPosts =
    payload.type === "search_results" && Array.isArray(payload.posts)
      ? payload.posts.filter(isSearchResultPost)
      : [];

  if (
    payload.type !== "search_results" &&
    payload.type !== "caption_suggestions" &&
    quickReplies.length === 0
  ) {
    return null;
  }

  return (
    <div className={styles.botContent}>
      {captionSuggestions.length > 0 && (
        <div className={styles.botCaptionList}>
          {captionSuggestions.map((suggestion, index) => (
            <div key={`${message._id}-caption-${index}`} className={styles.botCaptionItem}>
              <span className={styles.botCaptionIndex}>{index + 1}</span>
              <p className={styles.botCaptionText}>{suggestion}</p>
            </div>
          ))}
        </div>
      )}

      {searchPosts.length > 0 && (
        <div className={styles.botCards}>
          {searchPosts.map((post) => (
            <Link key={post._id} href={post.link} className={styles.botCard}>
              {post.fileUrl && post.type === "image" ? (
                <div className={styles.botCardMedia}>
                  <Image
                    src={post.fileUrl}
                    alt={post.caption}
                    fill
                    className={styles.botCardImage}
                  />
                </div>
              ) : (
                <div className={styles.botCardPlaceholder}>
                  <span>{post.type === "video" ? "VIDEO" : "POST"}</span>
                </div>
              )}

              <div className={styles.botCardBody}>
                <p className={styles.botCardMeta}>
                  @{post.author.username}
                  {post.aiTopics?.length ? ` • ${post.aiTopics.slice(0, 2).join(" • ")}` : ""}
                </p>
                <p className={styles.botCardTitle}>{post.caption}</p>
                <p className={styles.botCardExcerpt}>{post.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {quickReplies.length > 0 && (
        <div className={styles.botQuickActions}>
          {quickReplies.map((quickReply) => (
            <button
              key={`${message._id}-${quickReply.prompt}`}
              type="button"
              className={styles.botQuickReply}
              onClick={() => onQuickReply?.(quickReply.prompt)}
            >
              {quickReply.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
