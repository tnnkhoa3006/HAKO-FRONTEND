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
          <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-800 ring-2 ring-transparent group-hover:ring-blue-500 transition-all duration-300">
            <Image
              src={user?.profilePicture || "/api/placeholder/60/60"}
              alt="Thêm tin"
              width={64}
              height={64}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
          </div>

          {/* Add Story Button */}
          <div className="absolute -bottom-0 -right-0 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-black group-hover:bg-blue-400 transition-colors">
            <FaPlus size={10} className="text-white leading-none p-0" />
          </div>
        </div>

        {/* them tin */}
        <span className="text-gray-400 text-xs text-center max-w-16 truncate mt-1 group-hover:text-blue-500 transition-colors">
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
