import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { Smile, X } from "lucide-react";
import { VscSend } from "react-icons/vsc";
import { useDispatch, useSelector } from "react-redux";
import EmojiPicker from "@/components/EmojiPicker";
import styles from "@/components/Modal/Post/PostModal.module.scss";
import { useUser } from "@/app/hooks/useUser";
import { AppDispatch, RootState } from "@/store";
import { addComment } from "@/store/comment";
import { Post } from "@/types/home.type";
import {
  focusAndRestoreSelection,
  insertTextAtCursor,
} from "@/utils/insertTextAtCursor";

interface ReplyData {
  commentId: string;
  username: string;
  fullname?: string;
}

interface CommentInputProps {
  post: Post;
  comment?: string;
  handleCommentChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  handleSubmitComment?: (e: FormEvent) => void;
  isSubmitting?: boolean;
  replyTo?: ReplyData | null;
  onReplyCancel?: () => void;
  inputStyle?: React.CSSProperties;
}

export default function CommentInput({
  post,
  comment: externalComment,
  handleCommentChange: externalHandleChange,
  handleSubmitComment,
  isSubmitting = false,
  replyTo,
  onReplyCancel,
  inputStyle,
  detail = false,
}: CommentInputProps & { detail?: boolean }) {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useUser();
  const inputRef = useRef<HTMLInputElement>(null);

  const [commentText, setCommentText] = useState(externalComment || "");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);

  const loading = useSelector(
    (state: RootState) =>
      (state.comments as RootState["comments"]).loading[`add_${post._id}`] ||
      false
  );
  const error = useSelector(
    (state: RootState) =>
      (state.comments as RootState["comments"]).error[`add_${post._id}`]
  );

  const isCurrentlySubmitting = isSubmitting || loading;

  useEffect(() => {
    if (replyTo) {
      setCommentText(`@${replyTo.username} `);
      return;
    }

    if (externalComment === undefined) {
      setCommentText("");
    }
  }, [replyTo, externalComment]);

  const inputValue =
    externalComment !== undefined ? externalComment : commentText;

  const updateInputValue = useCallback(
    (value: string) => {
      setCommentText(value);

      if (externalHandleChange) {
        externalHandleChange({
          target: { value },
          currentTarget: { value },
        } as ChangeEvent<HTMLInputElement>);
      }
    },
    [externalHandleChange]
  );

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;

      if (replyTo) {
        const mentionText = `@${replyTo.username} `;
        if (!value.startsWith(mentionText)) {
          updateInputValue(mentionText);
          return;
        }
      }

      updateInputValue(value);
    },
    [replyTo, updateInputValue]
  );

  const handleEmojiSelect = (emoji: string) => {
    const { nextValue, cursorPosition } = insertTextAtCursor(
      inputRef.current,
      inputValue,
      emoji
    );

    updateInputValue(nextValue);
    focusAndRestoreSelection(inputRef.current, cursorPosition);
  };

  const handleReduxSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (inputValue.trim().length === 0 || isCurrentlySubmitting) {
      return;
    }

    const actualCommentText = inputValue.trim();

    if (replyTo) {
      const mentionText = `@${replyTo.username} `;
      if (actualCommentText.startsWith(mentionText)) {
        const contentAfterMention = actualCommentText
          .slice(mentionText.length)
          .trim();
        if (contentAfterMention.length === 0) {
          return;
        }
      }
    }

    try {
      await dispatch(
        addComment({
          itemId: post._id,
          itemType: post.type,
          text: actualCommentText,
          parentId: replyTo?.commentId,
        })
      ).unwrap();

      setCommentText("");
      setShowEmojiPicker(false);
      onReplyCancel?.();
    } catch (submitError) {
      console.error("Failed to add comment:", submitError);
    }
  };

  const submitHandler = handleSubmitComment || handleReduxSubmit;
  const canSubmit = replyTo
    ? inputValue.length > `@${replyTo.username} `.length
    : inputValue.trim().length > 0;

  return (
    <div>
      {replyTo && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 12px",
            backgroundColor: "rgba(255,255,255,0.1)",
            borderRadius: "8px",
            marginBottom: "8px",
            fontSize: "14px",
            color: "rgba(255,255,255,0.8)",
          }}
        >
          <span>
            Đang trả lời <strong>@{replyTo.username}</strong>
          </span>
          <button
            type="button"
            onClick={onReplyCancel}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.6)",
              cursor: "pointer",
              padding: "4px",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      <form
        onSubmit={submitHandler}
        className={detail ? styles.commentFormDetail : styles.commentForm}
      >
        <div className={styles.avatarContainer}>
          {user && (
            <Image
              src={user.profilePicture}
              alt="Avatar"
              width={30}
              height={30}
              className="rounded-full object-cover"
            />
          )}
        </div>

        <div className={styles.emojiPickerAnchor}>
          <button
            ref={emojiButtonRef}
            type="button"
            className={styles.emojiButton}
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            aria-label="Open emoji picker"
          >
            <Smile size={18} />
          </button>

          {showEmojiPicker && (
            <EmojiPicker
              onSelect={handleEmojiSelect}
              onClose={() => setShowEmojiPicker(false)}
              anchorElement={emojiButtonRef.current}
            />
          )}
        </div>

          <input
          ref={inputRef}
          type="text"
          placeholder={replyTo ? `Trả lời @${replyTo.username}...` : "Bình luận..."}
          value={inputValue}
          onChange={handleInputChange}
          className={styles.commentInput}
          disabled={isCurrentlySubmitting}
          autoFocus={!!replyTo}
          style={inputStyle}
        />
        <button
          type="submit"
          className={`${styles.postButton} ${canSubmit ? styles.active : ""}`}
          disabled={!canSubmit || isCurrentlySubmitting}
        >
          {isCurrentlySubmitting ? (
            <div
              style={{
                width: "20px",
                height: "20px",
                border: "2px solid rgba(255,255,255,0.3)",
                borderTop: "2px solid currentColor",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            ></div>
          ) : (
            <VscSend size={20} />
          )}
        </button>
        {error && <div className={styles.errorMessage}>{error}</div>}
      </form>
    </div>
  );
}
