"use client";

import React from "react";
import styles from "./Footer.module.scss";
import { usePathname } from "next/navigation";

interface FooterProps {
  type?: "login" | "home";
}

const Footer: React.FC<FooterProps> = ({ type = "home" }) => {
  const pathname = usePathname();

  if (
    pathname &&
    (
      pathname.includes("call-modal") ||
      pathname.includes("post") ||
      pathname.includes("messages")
    )
  ) {
    return null;
  }

  const footerLinks = [
    "HAKO",
    "Giới thiệu",
    "Blog",
    "Việc làm",
    "Trợ giúp",
    "API",
    "Quyền riêng tư",
    "Điều khoản",
    "Vị trí",
    "Ứng dụng",
    "Cộng đồng",
    "Liên hệ",
  ];

  const containerClass =
    type === "login" ? styles.container : styles["container-home"];

  return (
    <footer
      className={`flex flex-col justify-center items-center text-xs text-center py-4 px-4 ${containerClass}`}
    >
      <div className={styles.footer}>
        <div className="flex flex-wrap justify-center gap-4 mb-4">
          {footerLinks.map((link, index) => (
            <a key={index} href="#" className={styles.link}>
              {link}
            </a>
          ))}
        </div>
        <div className={`flex justify-center items-center gap-2 ${styles.meta}`}>
          <span>Tiếng Việt</span>
          <span>© 2026 HAKO</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
