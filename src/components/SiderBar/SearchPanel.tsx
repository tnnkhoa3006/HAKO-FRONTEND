"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Search, X } from "lucide-react";
import { suggestUsers } from "@/server/home";
import { SuggestedUser } from "@/types/user.type";
import { useRouter } from "next/navigation";
import styles from "./SearchPanel.module.scss";

interface SearchPanelProps {
  onClose: () => void;
}

interface RecentSearchUser {
  _id: string;
  username: string;
  profilePicture?: string;
  checkMark: boolean;
}

const RECENT_SEARCHES_KEY = "sidebar_recent_searches";
const MAX_RECENT_ITEMS = 8;

export default function SearchPanel({ onClose }: SearchPanelProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearchUser[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await suggestUsers();
        setSuggestedUsers(response.users || []);
      } catch (error) {
        console.error("Không thể tải dữ liệu tìm kiếm:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as RecentSearchUser[];
      if (Array.isArray(parsed)) {
        setRecentSearches(parsed);
      }
    } catch (error) {
      console.error("Không thể đọc lịch sử tìm kiếm:", error);
    }
  }, []);

  const filteredUsers = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return [];

    return suggestedUsers.filter((user) => {
      const username = user.username?.toLowerCase() || "";
      return username.includes(keyword);
    });
  }, [query, suggestedUsers]);

  const persistRecentSearches = (items: RecentSearchUser[]) => {
    setRecentSearches(items);
    if (typeof window !== "undefined") {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(items));
    }
  };

  const addRecentSearch = (user: SuggestedUser) => {
    const nextItem: RecentSearchUser = {
      _id: user._id,
      username: user.username,
      profilePicture: user.profilePicture,
      checkMark: user.checkMark,
    };

    const nextRecent = [
      nextItem,
      ...recentSearches.filter((item) => item._id !== user._id),
    ].slice(0, MAX_RECENT_ITEMS);

    persistRecentSearches(nextRecent);
  };

  const removeRecentSearch = (userId: string) => {
    const nextRecent = recentSearches.filter((item) => item._id !== userId);
    persistRecentSearches(nextRecent);
  };

  const handleSelectUser = (user: SuggestedUser | RecentSearchUser) => {
    addRecentSearch(user);
    router.push(`/${user.username}`);
    onClose();
  };

  const clearRecentSearches = () => {
    persistRecentSearches([]);
  };

  const renderUserRow = (user: SuggestedUser | RecentSearchUser) => (
    <button
      key={user._id}
      className={styles.userRow}
      onClick={() => handleSelectUser(user)}
    >
      <div className={styles.avatar}>
        {user.profilePicture ? (
          <Image
            src={user.profilePicture}
            alt={user.username}
            width={44}
            height={44}
            className={styles.avatarImage}
          />
        ) : (
          <div className={styles.avatarFallback}>
            {user.username.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <div className={styles.userMeta}>
        <span className={styles.username}>{user.username}</span>
        <span className={styles.subtitle}>Tài khoản</span>
      </div>
    </button>
  );

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Tìm kiếm</h2>

      <div className={styles.searchBox}>
        <Search size={16} className={styles.searchIcon} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className={styles.input}
          placeholder="Tìm kiếm"
        />
        {query && (
          <button className={styles.clearButton} onClick={() => setQuery("")}>
            <X size={14} />
          </button>
        )}
      </div>

      <div className={styles.body}>
        {query.trim() ? (
          <>
            {isLoading ? (
              <p className={styles.emptyText}>Đang tìm kiếm...</p>
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map(renderUserRow)
            ) : (
              <p className={styles.emptyText}>Không tìm thấy tài khoản phù hợp.</p>
            )}
          </>
        ) : (
          <>
            <div className={styles.sectionHeader}>
              <span>Gần đây</span>
              {recentSearches.length > 0 && (
                <button onClick={clearRecentSearches} className={styles.clearAll}>
                  Xóa tất cả
                </button>
              )}
            </div>

            {recentSearches.length > 0 ? (
              recentSearches.map((item) => (
                <div key={item._id} className={styles.recentRow}>
                  {renderUserRow(item)}
                  <button
                    className={styles.removeButton}
                    onClick={() => removeRecentSearch(item._id)}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))
            ) : (
              <p className={styles.emptyText}>Chưa có nội dung tìm kiếm gần đây.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
