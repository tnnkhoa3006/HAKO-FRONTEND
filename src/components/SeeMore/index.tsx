"use client";

import { useEffect, useRef } from "react";
import { Settings, Activity, Bookmark, Moon, Sun, FileWarning } from "lucide-react";
import { useRouter } from "next/navigation";
import { logout } from "@/server/auth";
import { useTheme } from "@/contexts/ThemeContext";

export default function MoreMenu({ onClose }: { onClose: () => void }) {
  const modalRef = useRef(null);
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const isDark = theme === "dark";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !(modalRef.current as HTMLElement).contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/accounts");
      localStorage.clear();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleThemeToggle = () => {
    toggleTheme();
    onClose();
  };

  const menuItems = [
    { icon: Settings, label: "Cài đặt" },
    { icon: Activity, label: "Hoạt động của bạn" },
    { icon: Bookmark, label: "Đã lưu" },
    {
      icon: isDark ? Moon : Sun,
      label: isDark ? "Chuyển sang sáng" : "Chuyển sang tối",
      onClick: handleThemeToggle,
    },
    { icon: FileWarning, label: "Báo cáo sự cố" },
  ];

  return (
    <div
      ref={modalRef}
      className="absolute bottom-full left-4 rounded-xl shadow-lg w-72 overflow-hidden"
      style={{
        zIndex: 1000,
        width: "300px",
        backgroundColor: "var(--menu-bg)",
        marginBottom: "10px",
        border: "1px solid var(--menu-border)",
        color: "var(--menu-text)",
        boxShadow: isDark
          ? "0 8px 24px rgba(0,0,0,0.6)"
          : "0 8px 24px rgba(0,0,0,0.15)",
        transition: "background-color 0.3s ease, border-color 0.3s ease",
      }}
    >
      <div>
        {menuItems.map(({ icon: Icon, label, onClick }) => (
          <button
            key={label}
            className="w-full text-left px-4 py-3 flex items-center gap-3"
            style={{
              color: "var(--menu-text)",
              transition: "background-color 0.2s ease",
            }}
            onClick={onClick}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "var(--menu-hover)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            <Icon
              size={20}
              color={isDark ? "#ffffff" : "#000000"}
              style={{ transition: "color 0.3s ease" }}
            />
            <span>{label}</span>
          </button>
        ))}
      </div>

      <div
        className="h-px my-1"
        style={{ backgroundColor: "var(--menu-divider)" }}
      ></div>

      <button
        className="w-full text-left px-4 py-3 flex items-center gap-3"
        style={{ color: "var(--menu-text)", transition: "background-color 0.2s ease" }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = "var(--menu-hover)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.backgroundColor = "transparent")
        }
      >
        <span>Threads</span>
      </button>

      <div
        className="h-px my-1"
        style={{ backgroundColor: "var(--menu-divider)" }}
      ></div>

      <button
        className="w-full text-left px-4 py-3"
        style={{ color: "var(--menu-text)", transition: "background-color 0.2s ease" }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = "var(--menu-hover)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.backgroundColor = "transparent")
        }
      >
        <span>Chuyển tài khoản</span>
      </button>
      <button
        className="w-full text-left px-4 py-3"
        onClick={handleLogout}
        style={{ color: "var(--menu-text)", transition: "background-color 0.2s ease" }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = "var(--menu-hover)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.backgroundColor = "transparent")
        }
      >
        <span>Đăng xuất</span>
      </button>
    </div>
  );
}
