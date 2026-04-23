"use client";

import { useState, useMemo } from "react";
import { X, Search, Check } from "lucide-react";
import { User } from "@/types/user.type";
import Image from "next/image";
import styles from "./Messenger.module.scss";

interface CreateGroupModalProps {
  availableUsers: User[];
  onClose: () => void;
  onSubmit: (name: string, members: string[]) => void;
}

export default function CreateGroupModal({
  availableUsers,
  onClose,
  onSubmit,
}: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const filteredUsers = useMemo(() => {
    return availableUsers.filter((user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [availableUsers, searchQuery]);

  const toggleUser = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds((prev) => prev.filter((id) => id !== userId));
    } else {
      setSelectedUserIds((prev) => [...prev, userId]);
    }
  };

  const handleSubmit = () => {
    if (groupName.trim() && selectedUserIds.length > 0) {
      onSubmit(groupName.trim(), selectedUserIds);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className={`bg-[var(--surface-color)] rounded-xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl border border-[rgba(255,255,255,0.1)]`} style={{ maxHeight: '80vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[rgba(255,255,255,0.1)]">
          <h2 className="text-lg font-semibold text-white">Tạo nhóm mới</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-[rgba(255,255,255,0.1)] transition-colors text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 flex flex-col flex-1 overflow-hidden">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">Tên nhóm</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Nhập tên nhóm..."
              className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-300 mb-1">Thành viên ({selectedUserIds.length})</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm bạn bè..."
                className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg pl-9 pr-3 py-2 text-white outline-none focus:border-blue-500 transition-colors text-sm"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto mt-2 min-h-[200px] pr-1 scrollbar-thin">
            {filteredUsers.length === 0 ? (
              <div className="text-center text-gray-400 text-sm py-4">Không tìm thấy người dùng</div>
            ) : (
              filteredUsers.map((user) => {
                const isSelected = selectedUserIds.includes(user._id);
                return (
                  <div
                    key={user._id}
                    onClick={() => toggleUser(user._id)}
                    className="flex items-center p-2 rounded-lg hover:bg-[rgba(255,255,255,0.05)] cursor-pointer transition-colors mb-1"
                  >
                    <div className="relative w-10 h-10 rounded-full flex-shrink-0 mr-3">
                      {user.profilePicture ? (
                        <Image src={user.profilePicture} alt={user.username} layout="fill" objectFit="cover" className="rounded-full" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold rounded-full">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {isSelected && (
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 border-2 border-[var(--surface-color)] rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{user.username}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-[rgba(255,255,255,0.3)]'}`}>
                      {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[rgba(255,255,255,0.1)] flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-[rgba(255,255,255,0.1)] transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={!groupName.trim() || selectedUserIds.length === 0}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            Tạo nhóm
          </button>
        </div>
      </div>
    </div>
  );
}
