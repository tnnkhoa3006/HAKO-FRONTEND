"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  EmojiStyle,
  SkinTonePickerLocation,
  SuggestionMode,
  Theme,
  type EmojiClickData,
} from "emoji-picker-react";
import { X } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import styles from "./EmojiPicker.module.scss";

const Picker = dynamic(() => import("emoji-picker-react"), { ssr: false });

type EmojiPickerProps = {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  align?: "left" | "right";
  anchorElement?: HTMLElement | null;
};

export default function EmojiPicker({
  onSelect,
  onClose,
  align = "left",
  anchorElement,
}: EmojiPickerProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const [position, setPosition] = useState({ top: 0, left: 0, ready: false });

  useEffect(() => {
    const updatePosition = () => {
      const targetAnchor = anchorElement;
      if (!targetAnchor || !popoverRef.current) return;

      const anchorRect = targetAnchor.getBoundingClientRect();
      const popoverRect = popoverRef.current.getBoundingClientRect();
      const spacing = 10;

      let left =
        align === "right"
          ? anchorRect.right - popoverRect.width
          : anchorRect.left;

      left = Math.min(
        Math.max(8, left),
        window.innerWidth - popoverRect.width - 8
      );

      let top = anchorRect.top - popoverRect.height - spacing;
      if (top < 8) {
        top = Math.min(
          anchorRect.bottom + spacing,
          window.innerHeight - popoverRect.height - 8
        );
      }

      setPosition({ top, left, ready: true });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [align, anchorElement]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !popoverRef.current?.contains(target) &&
        !anchorElement?.contains(target)
      ) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose, anchorElement]);


  const pickerContent = (
    <div
      ref={popoverRef}
      className={`${styles.popover} ${
        align === "right" ? styles.alignRight : styles.alignLeft
      }`}
      role="dialog"
      aria-label="Emoji picker"
      style={{
        top: position.top,
        left: position.left,
        opacity: position.ready ? 1 : 0,
      }}
    >
      <div className={styles.header}>
        <span className={styles.title}>Emoji</span>
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close emoji picker"
        >
          <X size={16} />
        </button>
      </div>

      <div className={styles.pickerShell}>
        <Picker
          theme={theme === "light" ? Theme.LIGHT : Theme.DARK}
          emojiStyle={EmojiStyle.NATIVE}
          lazyLoadEmojis
          autoFocusSearch={false}
          searchPlaceholder="Tim emoji"
          suggestedEmojisMode={SuggestionMode.RECENT}
          skinTonePickerLocation={SkinTonePickerLocation.SEARCH}
          previewConfig={{ showPreview: false }}
          width="100%"
          height={360}
          onEmojiClick={(emojiData: EmojiClickData) => onSelect(emojiData.emoji)}
        />
      </div>
    </div>
  );

  return createPortal(pickerContent, document.body);
}
