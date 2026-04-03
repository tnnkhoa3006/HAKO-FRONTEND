import React from "react";
import { ChevronRight } from "lucide-react";
import styles from "./Setting.module.scss";

interface SettingItemProps {
  label: string | React.ReactNode;
  noHover?: boolean;
}

export default function SettingItem({
  label,
  noHover = false,
}: SettingItemProps) {
  return (
    <div
      className={`${styles.settingItem} ${noHover ? styles.settingItemStatic : ""} ${!noHover ? "cursor-pointer" : ""}`}
    >
      <div className={styles.settingLabel}>{label}</div>
      {typeof label === "string" && (
        <ChevronRight size={18} className={styles.settingChevron} />
      )}
    </div>
  );
}
