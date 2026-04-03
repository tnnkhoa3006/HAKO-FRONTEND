import React, { useState } from "react";
import Image from "next/image";
import { FaPlus } from "react-icons/fa6";
import { useUser } from "@/app/hooks/useUser";
import CreateStoryModal from "../Modal/Story/CreateStoryModal";

export default function AddStoryItem() {
  const { user } = useUser();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex flex-col items-center space-y-1 group"
        style={{ cursor: "pointer" }}
      >
        {/* Avatar Container */}
        <div className="relative">
          {/* Avatar Image */}
          <div
            className="relative w-16 h-16 rounded-full overflow-hidden transition-all duration-300"
            style={{
              backgroundColor: "var(--story-core-bg)",
              border: "1px solid var(--story-add-border)",
              boxShadow: "var(--surface-shadow)",
            }}
          >
            <Image
              src={user?.profilePicture || "/api/placeholder/60/60"}
              alt="Thêm tin"
              width={64}
              height={64}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
          </div>

          {/* Add Story Button */}
          <div
            className="absolute -bottom-0 -right-0 w-5 h-5 rounded-full flex items-center justify-center transition-colors"
            style={{
              backgroundColor: "var(--accent-color)",
              border: "2px solid var(--story-add-plus-border)",
            }}
          >
            <FaPlus size={10} className="text-white leading-none p-0" />
          </div>
        </div>

        {/* them tin */}
        <span
          className="text-xs text-center max-w-16 truncate mt-1 transition-colors"
          style={{ color: "var(--story-label)" }}
        >
          Tin của bạn
        </span>
      </button>

      <CreateStoryModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}
