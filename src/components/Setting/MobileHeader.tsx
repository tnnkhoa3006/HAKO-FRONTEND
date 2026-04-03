import React from "react";
import { ArrowLeft } from "lucide-react";

interface TabItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface MobileHeaderProps {
  activeTab: string;
  tabs: TabItem[];
  setMobileMenuOpen: (isOpen: boolean) => void;
  handleBack: () => void;
}

export default function MobileHeader({
  activeTab,
  tabs,
  // setMobileMenuOpen,
  handleBack,
}: MobileHeaderProps) {
  return (
    <div
      className="flex items-center justify-between p-4 md:hidden"
      style={{ borderBottom: "1px solid var(--divider-soft)" }}
    >
      {/* Left: Back */}
      <div style={{ color: "var(--foreground)" }}>
        <button
          onClick={handleBack}
          className="cursor-pointer"
          style={{ color: "var(--foreground)" }}
        >
          <ArrowLeft size={20} />
        </button>
      </div>

      {/* Right: Menu button + Tab label */}
      <div className="flex items-center space-x-3 flex-1 justify-center">
        <h1
          className="text-lg font-semibold"
          style={{ color: "var(--foreground)" }}
        >
          {tabs.find((tab) => tab.id === activeTab)?.label}
        </h1>
        {/* <button onClick={() => setMobileMenuOpen(true)} className="text-white">
          <Menu size={24} />
        </button> */}
      </div>
    </div>
  );
}
