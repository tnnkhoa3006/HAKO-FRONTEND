"use client";

import React, { useState, useEffect } from "react";
import { Settings, ArrowLeft, LogOut, X } from "lucide-react";
import { useRouter } from "next/navigation";
import MobileHeader from "./MobileHeader";
import MobileSidebar from "./MobileSidebar";
import AccountContent from "./AccountContent";
import PrivacyContent from "./PrivacyContent";
import SecurityContent from "./SecurityContent";
import NotificationsContent from "./NotificationsContent";
import { tabs } from "./tab";
import useLogout from "@/app/hooks/useLogout";
import styles from "./Setting.module.scss";

export default function Setting() {
  const [activeTab, setActiveTab] = useState("account");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();
  const { handleLogout, isLoggingOut, logoutError } = useLogout();

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      setActiveTab("");
      setMobileMenuOpen(true);
    }
    setIsInitialized(true);
  }, []);

  const handleBack = () => {
    if (window.innerWidth < 768 && !mobileMenuOpen) {
      setMobileMenuOpen(true);
      setActiveTab("");
    } else {
      router.back();
    }
  };

  const onLogout = async () => {
    await handleLogout();
    setShowLogoutModal(false);
  };

  const handleTabClick = (tabId: string) => {
    if (tabId === "logout") {
      setShowLogoutModal(true);
    } else {
      setActiveTab(tabId);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "account":
        return <AccountContent />;
      case "privacy":
        return <PrivacyContent />;
      case "security":
        return <SecurityContent />;
      case "notifications":
        return <NotificationsContent />;
      default:
        return (
          <div className={styles.helperText}>
            Chưa có nội dung cho tab này.
          </div>
        );
    }
  };

  const LogoutModal = () => {
    if (!showLogoutModal) return null;

    return (
      <div className={styles.logoutOverlay}>
        <div className={styles.logoutCard}>
          <div className={styles.logoutHeader}>
            <div className={styles.logoutTitle}>
              <LogOut size={22} className="text-red-400" />
              <h3>Đăng xuất tài khoản</h3>
            </div>
            <button
              onClick={() => setShowLogoutModal(false)}
              className={styles.backButton}
            >
              <X size={18} />
            </button>
          </div>

          <div className={styles.logoutBody}>
            <p>Bạn có chắc chắn muốn đăng xuất khỏi tài khoản của mình?</p>

            {logoutError && <div className={styles.errorBox}>{logoutError}</div>}

            <div className={styles.logoutActions}>
              <button
                onClick={() => setShowLogoutModal(false)}
                className={styles.ghostButton}
              >
                Hủy
              </button>
              <button
                onClick={onLogout}
                disabled={isLoggingOut}
                className={styles.dangerButton}
              >
                {isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!isInitialized) {
    return null;
  }

  return (
    <div className={styles.shell}>
      <MobileHeader
        activeTab={activeTab}
        tabs={tabs}
        setMobileMenuOpen={setMobileMenuOpen}
        handleBack={handleBack}
      />

      <MobileSidebar
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        activeTab={activeTab}
        setActiveTab={handleTabClick}
        tabs={tabs}
      />

      <div className={styles.desktopSidebar}>
        <div className={styles.desktopHeader}>
          <button onClick={handleBack} className={styles.backButton}>
            <ArrowLeft size={20} />
          </button>

          <div className={styles.desktopHeaderTitle}>
            <Settings size={22} />
            <h1>Cài đặt</h1>
          </div>
        </div>

        <div className={styles.tabList}>
          {tabs.map((tab) => (
            <div
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`${styles.tabItem} ${
                activeTab === tab.id && tab.id !== "logout"
                  ? styles.tabItemActive
                  : ""
              } ${tab.id === "logout" ? styles.tabItemLogout : ""}`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.mainContent}>
        <h2 className={styles.sectionTitle}>
          {tabs.find((tab) => tab.id === activeTab)?.label}
        </h2>

        {renderTabContent()}
      </div>

      <LogoutModal />
    </div>
  );
}
