import Image from "next/image";
import { User } from "@/types/user.type";
import styles from "./Profile.module.scss";
import Infor from "./Infor/Infor";
import TabProfile from "./TabProfile";
import AddStory from "../../../components/AddStory";
import UploadAvatar from "@/components/Modal/AvatarPicture/upLoadAvatar";
import IsProfile from "@/components/isProfile";
import { useState } from "react";
import HeaderProfile from "./HeaderProfile";
import StoryAvatarProfile from "./StoryAvatarProfile";
import { useStory } from "@/contexts/StoryContext";

export default function Profile({ user: initialUser }: { user: User }) {
  const [user, setUser] = useState<User>(initialUser);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showChoiceModal, setShowChoiceModal] = useState(false);
  const { openStory, isLoading: isStoryLoading } = useStory();

  const handleAvatarClick = () => {
    if (user.hasStories) {
      setShowChoiceModal(true);
    } else {
      setShowAvatarModal(true);
    }
  };

  const handleAvatarChange = (newAvatarUrl: string | null) => {
    setUser((prev) => ({
      ...prev,
      profilePicture: newAvatarUrl || prev.profilePicture,
    }));
  };

  return (
    <div className={styles.container}>
      <HeaderProfile user={user} />
      <div className={styles.content}>
        <div className={styles.header}>
          <IsProfile
            profileId={user.id || user.username}
            fallback={
              <>
                {user.hasStories ? (
                  <div className={styles.hasStories}>
                    <StoryAvatarProfile author={user} hasStories={true} />
                    <div className={styles.fullName}>
                      <h3>{user?.fullName || "Người dùng"}</h3>
                    </div>
                  </div>
                ) : (
                  <div className={styles.avatar}>
                    <Image
                      src={user?.profilePicture || "/api/placeholder/150/150"}
                      alt="avatar"
                      width={150}
                      height={150}
                      className={styles.avatarImage}
                    />
                    <div className={styles.fullName}>
                      <h3>{user?.fullName || "Người dùng"}</h3>
                    </div>
                  </div>
                )}
              </>
            }
          >
            {user.hasStories ? (
              <div className={styles.hasStories}>
                <StoryAvatarProfile
                  author={user}
                  hasStories={true}
                  profileOpen={true}
                  onClick={handleAvatarClick}
                />
                <div className={styles.fullName}>
                  <h3>{user?.fullName || "Người dùng"}</h3>
                </div>
              </div>
            ) : (
              <div
                className={styles.avatar}
                onClick={handleAvatarClick}
                style={{ cursor: "pointer" }}
              >
                <Image
                  src={user?.profilePicture || "/api/placeholder/150/150"}
                  alt="avatar"
                  width={150}
                  height={150}
                  className={styles.avatarImage}
                />
                <div className={styles.fullName}>
                  <h3>{user?.fullName || "Người dùng"}</h3>
                </div>
              </div>
            )}
          </IsProfile>

          <Infor user={user} />
        </div>

        {/* phần thêm tin */}
        <AddStory profileId={user.id || user.username} />

        {/* phần tab */}
        <TabProfile user={user} />
      </div>

      {/* Modal lựa chọn - Facebook style */}
      {showChoiceModal && (
        <div
          className="fixed inset-0 z-[997] flex items-center justify-center"
          style={{ backgroundColor: "var(--profile-overlay)" }}
        >
          <div
            className="rounded-[24px] min-w-[280px] max-w-[320px] mx-4 overflow-hidden border"
            style={{
              background: "var(--profile-modal-surface)",
              borderColor: "rgba(164, 186, 224, 0.18)",
              boxShadow: "var(--surface-shadow)",
            }}
          >
            <button
              className="w-full py-3 px-4 text-left flex items-center gap-3 font-medium transition-colors duration-150 border-b"
              style={{
                color: "var(--foreground)",
                borderColor: "rgba(135, 161, 205, 0.14)",
              }}
              onClick={async () => {
                setShowChoiceModal(false);
                if (!isStoryLoading) {
                  await openStory(user, 0);
                }
              }}
            >
              <div className="w-8 h-8 flex items-center justify-center">
                <svg
                  className="w-5 h-5"
                  style={{ color: "var(--foreground)" }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </div>
              Xem tin
            </button>
            <button
              className="w-full py-3 px-4 text-left flex items-center gap-3 font-medium transition-colors duration-150 border-b"
              style={{
                color: "var(--foreground)",
                borderColor: "rgba(135, 161, 205, 0.14)",
              }}
              onClick={() => {
                setShowChoiceModal(false);
                setShowAvatarModal(true);
              }}
            >
              <div className="w-8 h-8 flex items-center justify-center">
                <svg
                  className="w-5 h-5"
                  style={{ color: "var(--foreground)" }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              Tải ảnh đại diện
            </button>
            <button
              className="w-full py-3 px-4 text-left flex items-center gap-3 font-medium transition-colors duration-150"
              style={{ color: "var(--secondary-text)" }}
              onClick={() => setShowChoiceModal(false)}
            >
              <div className="w-8 h-8 flex items-center justify-center">
                <svg
                  className="w-5 h-5"
                  style={{ color: "var(--secondary-text)" }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              Hủy
            </button>
          </div>
        </div>
      )}

      {/* Modal upload avatar */}
      {showAvatarModal && (
        <UploadAvatar
          currentAvatar={user?.profilePicture || "/api/placeholder/150/150"}
          onClose={() => setShowAvatarModal(false)}
          onAvatarChange={handleAvatarChange}
        />
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
