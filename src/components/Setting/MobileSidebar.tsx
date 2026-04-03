import React from "react";
import { Settings, X } from "lucide-react";
import { useRouter } from "next/navigation";
import styles from "./Setting.module.scss";

export type TabType = {
  id: string;
  label: string;
  icon?: React.ReactNode;
};

export type MobileSidebarProps = {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  tabs: TabType[];
};

export default function MobileSidebar({
  mobileMenuOpen,
  setMobileMenuOpen,
  activeTab,
  setActiveTab,
  tabs,
}: MobileSidebarProps) {
  const router = useRouter();

  const handleClose = () => {
    router.back();
  };

  return (
    <div
      className={`fixed inset-0 z-50 transition-transform duration-300 md:hidden ${
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      } ${styles.container}`}
      style={{ backgroundColor: "var(--settings-mobile-bg)" }}
    >
      <div
        className="flex items-center justify-between p-4"
        style={{ borderBottom: "1px solid var(--divider-soft)" }}
      >
        <div
          className="flex items-center space-x-2"
          style={{ color: "var(--foreground)" }}
        >
          <Settings size={24} />
          <h1
            className="text-xl font-semibold"
            style={{ color: "var(--foreground)" }}
          >
            Cài đặt
          </h1>
        </div>
        <button onClick={handleClose} style={{ color: "var(--foreground)" }}>
          <X size={24} />
        </button>
      </div>

      <div className="p-4 space-y-1">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setMobileMenuOpen(false);
            }}
            className="flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors"
            style={{
              background:
                activeTab === tab.id
                  ? "var(--surface-muted-hover)"
                  : "transparent",
            }}
          >
            <span
              style={{
                color:
                  activeTab === tab.id
                    ? "var(--foreground)"
                    : "var(--secondary-text)",
              }}
            >
              {tab.icon}
            </span>
            <span
              style={{
                color:
                  activeTab === tab.id
                    ? "var(--foreground)"
                    : "var(--secondary-text)",
              }}
            >
              {tab.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
