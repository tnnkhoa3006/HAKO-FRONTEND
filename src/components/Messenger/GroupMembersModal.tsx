import React, { useState, useEffect } from "react";
import Image from "next/image";
import { X, MoreVertical, UserPlus, Shield, ShieldAlert, UserMinus } from "lucide-react";
import { Group } from "@/types/messenger.types";
import { User } from "@/types/user.type";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addGroupMembersThunk, removeGroupMemberThunk, updateGroupRoleThunk } from "@/store/messengerSlice";
import AddGroupMembersModal from "./AddGroupMembersModal";

interface GroupMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group;
  handleUserClick: (username: string) => void;
}

export default function GroupMembersModal({
  isOpen,
  onClose,
  group,
  handleUserClick,
}: GroupMembersModalProps) {
  const dispatch = useAppDispatch();
  const { availableUsers } = useAppSelector((state) => state.messenger);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUserId(localStorage.getItem("id") || "");
    }
  }, []);

  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [activeMenuUserId, setActiveMenuUserId] = useState<string | null>(null);

  if (!isOpen) return null;

  const getAdminId = (admin: User | string) => {
    if (typeof admin === "string") return admin;
    return admin._id;
  };

  const adminId = getAdminId(group.admin);
  const coAdminIds = (group.coAdmins || []).map(ca => typeof ca === 'string' ? ca : ca._id);
  
  const isCreator = currentUserId === adminId;
  const isCoAdmin = coAdminIds.includes(currentUserId);
  const isAdmin = isCreator || isCoAdmin;

  const handleAddMembers = (memberIds: string[]) => {
    dispatch(addGroupMembersThunk({ groupId: group._id, members: memberIds }));
    setShowAddMembersModal(false);
  };

  const handleRemoveMember = (memberId: string) => {
    dispatch(removeGroupMemberThunk({ groupId: group._id, memberId }));
    setActiveMenuUserId(null);
  };

  const handleToggleRole = (memberId: string, currentRole: 'coAdmin' | 'member') => {
    const newRole = currentRole === 'coAdmin' ? 'member' : 'coAdmin';
    dispatch(updateGroupRoleThunk({ groupId: group._id, memberId, role: newRole }));
    setActiveMenuUserId(null);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-[9999]">
        <div className="bg-[#262626]/90 backdrop-blur-md border border-white/10 rounded-xl w-[420px] max-w-[90vw] max-h-[80vh] flex flex-col shadow-2xl">
          <div className="flex justify-between items-center p-4 border-b border-white/10">
            <h2 className="text-white text-lg font-semibold">
              Thành viên nhóm ({group.members.length})
            </h2>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <button
                  onClick={() => setShowAddMembersModal(true)}
                  className="p-2 rounded-full hover:bg-white/10 text-blue-400 transition-colors"
                  title="Thêm thành viên"
                >
                  <UserPlus size={20} />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>
          
          <div className="overflow-y-auto flex-1 p-4">
            <div className="flex flex-col gap-4">
              {group.members.map((member) => {
                const isMemberCreator = member._id === adminId;
                const isMemberCoAdmin = coAdminIds.includes(member._id);
                const isMemberSelf = member._id === currentUserId;
                
                return (
                  <div key={member._id} className="flex items-center justify-between relative">
                    <div 
                      className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                      onClick={() => {
                        handleUserClick(member.username);
                        onClose();
                      }}
                    >
                      <div className="w-12 h-12 rounded-full overflow-hidden relative flex-shrink-0">
                        {member.profilePicture ? (
                          <Image
                            src={member.profilePicture}
                            alt={member.username}
                            layout="fill"
                            objectFit="cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-600 flex items-center justify-center text-white text-lg">
                            {member.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-white font-medium truncate">{member.username}</p>
                          {isMemberCreator && (
                            <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full flex-shrink-0">
                              Trưởng nhóm
                            </span>
                          )}
                          {isMemberCoAdmin && (
                            <span className="text-[10px] bg-purple-600 text-white px-2 py-0.5 rounded-full flex-shrink-0">
                              Phó nhóm
                            </span>
                          )}
                        </div>
                        <p className="text-gray-400 text-sm truncate">{member.fullName || member.username}</p>
                      </div>
                    </div>

                    {/* Actions Menu */}
                    {!isMemberCreator && !isMemberSelf && isAdmin && (
                      <div className="relative ml-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuUserId(activeMenuUserId === member._id ? null : member._id);
                          }}
                          className="p-2 rounded-full hover:bg-white/10 text-gray-400 transition-colors"
                        >
                          <MoreVertical size={18} />
                        </button>

                        {activeMenuUserId === member._id && (
                          <div className="absolute right-0 top-full mt-1 w-48 bg-[#333] border border-white/10 rounded-lg shadow-xl z-10 overflow-hidden py-1">
                            {isCreator && (
                              <button
                                onClick={() => handleToggleRole(member._id, isMemberCoAdmin ? 'coAdmin' : 'member')}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-white hover:bg-white/5 transition-colors text-left"
                              >
                                {isMemberCoAdmin ? (
                                  <><ShieldAlert size={16} className="text-orange-400" /> Gỡ Phó nhóm</>
                                ) : (
                                  <><Shield size={16} className="text-purple-400" /> Chỉ định Phó nhóm</>
                                )}
                              </button>
                            )}
                            
                            {(isCreator || (isCoAdmin && !isMemberCoAdmin)) && (
                              <button
                                onClick={() => handleRemoveMember(member._id)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-white/5 transition-colors text-left"
                              >
                                <UserMinus size={16} /> Xóa khỏi nhóm
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {showAddMembersModal && (
        <AddGroupMembersModal
          availableUsers={availableUsers}
          currentMembers={group.members}
          onClose={() => setShowAddMembersModal(false)}
          onSubmit={handleAddMembers}
        />
      )}
    </>
  );
}
