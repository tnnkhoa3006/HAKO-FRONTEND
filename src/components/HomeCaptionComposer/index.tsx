"use client";
 
import { FormEvent, useEffect, useMemo, useState, useRef } from "react";
import Image from "next/image";
import { createPost } from "@/server/posts";
import { useUser } from "@/app/hooks/useUser";
import { usePostContext } from "@/contexts/PostContext";
import { Post } from "@/types/home.type";
import styles from "./HomeCaptionComposer.module.scss";
import { Send, Smile } from "lucide-react";
import EmojiPicker from "@/components/EmojiPicker";
 
const FALLBACK_AVATAR =
  "https://thumbs.dreamstime.com/b/default-avatar-profile-icon-vector-social-media-user-portrait-176256935.jpg";
 
export default function HomeCaptionComposer() {
  const { user } = useUser();
  const { setPosts } = usePostContext();
  const [caption, setCaption] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState("");
  const [storedUsername, setStoredUsername] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiAnchorRef = useRef<HTMLButtonElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
 
  useEffect(() => {
    if (typeof window !== "undefined") {
      setStoredUsername(localStorage.getItem("username") || "");
    }
  }, []);
 
  const displayUsername = useMemo(
    () => user?.username || storedUsername || "username",
    [storedUsername, user?.username]
  );
 
  const handleSubmit = async (event?: FormEvent) => {
    if (event) event.preventDefault();
    const trimmedCaption = caption.trim();
 
    if (!trimmedCaption || isPosting) {
      return;
    }
 
    try {
      setIsPosting(true);
      setError("");
 
      const formData = new FormData();
      formData.append("caption", trimmedCaption);
      formData.append("type", "text");
 
      const response = await createPost(formData);
      const createdPost = response?.post as Post | undefined;
 
      if (createdPost?._id) {
        setPosts((prev) => [
          createdPost,
          ...prev.filter((post) => post._id !== createdPost._id),
        ]);
      }
 
      setCaption("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "44px";
      }
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Không thể đăng bài lúc này";
      setError(message);
    } finally {
      setIsPosting(false);
    }
  };
 
  const handleEmojiSelect = (emoji: string) => {
    setCaption((prev) => prev + emoji);
    textareaRef.current?.focus();
  };
 
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCaption(e.target.value);
    // Auto resize
    e.target.style.height = "44px";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
  };
 
  return (
    <div className={styles.wrapper}>
      <form className={styles.compactCard} onSubmit={handleSubmit}>
        <div className={styles.avatarWrapper}>
          <Image
            src={user?.profilePicture || FALLBACK_AVATAR}
            alt={displayUsername}
            width={40}
            height={40}
            className={styles.avatarSmall}
          />
        </div>
 
        <div className={styles.inputContainer}>
          <textarea
            ref={textareaRef}
            value={caption}
            onChange={handleTextareaChange}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            className={styles.compactInput}
            placeholder={`${displayUsername}, bạn đang nghĩ gì vậy?`}
            disabled={isPosting}
          />
          
          <div className={styles.actionButtons}>
            <button
              ref={emojiAnchorRef}
              type="button"
              className={styles.iconBtn}
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              title="Thêm emoji"
            >
              <Smile size={20} />
            </button>
            
            <button
              type="submit"
              className={`${styles.sendBtn} ${caption.trim() ? styles.active : ""}`}
              disabled={isPosting || !caption.trim()}
              title="Đăng bài"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
 
        {showEmojiPicker && (
          <EmojiPicker
            onSelect={handleEmojiSelect}
            onClose={() => setShowEmojiPicker(false)}
            anchorElement={emojiAnchorRef.current}
            align="right"
          />
        )}
      </form>
      {error && <p className={styles.errorText}>{error}</p>}
    </div>
  );
}
