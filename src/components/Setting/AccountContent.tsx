"use client";

import React, { useState } from "react";
import SettingItem from "./SettingItem";
import { useUser } from "@/app/hooks/useUser";
import Image from "next/image";
import { updateBio } from "@/server/user";
import styles from "./Setting.module.scss";

export default function AccountContent() {
  const { user, loading } = useUser();
  const [bio, setBio] = useState(user?.bio || "");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  if (loading || !user) {
    return null;
  }

  const handleSaveBio = async () => {
    try {
      setIsSaving(true);
      await updateBio(bio);
      setMessage("Đã lưu thành công.");
      setBio("");
    } catch (error: unknown) {
      if (error instanceof Error) {
        setMessage(`Lưu thất bại: ${error.message}`);
      } else {
        setMessage("Lưu thất bại. Vui lòng thử lại.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.contentStack}>
      <div className={`${styles.settingItem} ${styles.settingItemStatic} ${styles.accountCard}`}>
        <div className={styles.accountCardInner}>
          <div className={styles.accountAvatar}>
            <Image
              src={user.profilePicture}
              alt="avatar"
              width={40}
              height={40}
              className="rounded-full"
            />
          </div>
          <div className={styles.accountMeta}>
            <p>{user.fullName}</p>
            <p>{user.username}</p>
          </div>
        </div>
        <button className={styles.ghostButton}>Sửa</button>
      </div>

      <div className={styles.contentStack}>
        <SettingItem label="Thông tin cá nhân" />
        <SettingItem label="Đổi mật khẩu" />
        <SettingItem label="Email" />
        <SettingItem label="Số điện thoại" />

        <SettingItem
          noHover
          label={
            <div className="w-full">
              <label htmlFor="bio" className={styles.settingLabel}>
                Thêm tiểu sử
              </label>
              <textarea
                id="bio"
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Viết gì đó về bạn..."
                className={styles.textarea}
              />
              <div className={styles.helperRow}>
                {message && <span className={styles.helperText}>{message}</span>}
                <button
                  onClick={handleSaveBio}
                  disabled={isSaving}
                  className={styles.primaryButton}
                >
                  {isSaving ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </div>
          }
        />
      </div>
    </div>
  );
}
