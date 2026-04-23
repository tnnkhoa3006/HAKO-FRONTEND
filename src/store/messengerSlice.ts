import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { getAvailableUsers, getMessagesWithPagination, getUserStatus, getGroups, addGroupMembersAPI, removeGroupMemberAPI, updateGroupRoleAPI } from "@/server/messenger";
import { Message, User } from "@/types/user.type";
import { MessengerState, Group } from "@/types/messenger.types";
import { createRef } from "react";

const PAGE_SIZE = 20;

interface AvailableUser {
  _id: string;
  username: string;
  profilePicture?: string;
  checkMark?: boolean;
  lastActive?: string | number | null;
  lastOnline?: string | number | null;
  isOnline?: boolean;
}

export const fetchAvailableUsers = createAsyncThunk(
  "messenger/fetchAvailableUsers",
  async () => {
    const response = await getAvailableUsers();
    const users: User[] = Array.isArray(response)
      ? response.map((user: AvailableUser & { hasStory?: boolean }) => ({
          id: user._id,
          _id: user._id,
          username: user.username,
          fullName: user.username,
          email: "",
          phoneNumber: 0,
          profilePicture: user.profilePicture || "",
          bio: "",
          followers: [],
          following: [],
          isPrivate: false,
          authType: "local",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          checkMark: user.checkMark || false,
          lastActive: user.lastActive || null,
          lastOnline: user.lastOnline || null,
          isFollowing: false,
          followersCount: 0,
          followingCount: 0,
          hasStory: user.hasStory || false,
        }))
      : [];
    return users;
  }
);

export const fetchMessages = createAsyncThunk(
  "messenger/fetchMessages",
  async ({
    userId,
    before,
    replace = false,
    isGroup = false,
  }: {
    userId: string;
    before?: string;
    replace?: boolean;
    isGroup?: boolean;
  }) => {
    const res = await getMessagesWithPagination(userId, before, PAGE_SIZE, isGroup);
    return { ...res, before, replace };
  }
);

export const fetchGroups = createAsyncThunk(
  "messenger/fetchGroups",
  async () => {
    const response = await getGroups();
    return response as Group[];
  }
);

export const addGroupMembersThunk = createAsyncThunk(
  "messenger/addGroupMembers",
  async ({ groupId, members }: { groupId: string; members: string[] }) => {
    const response = await addGroupMembersAPI(groupId, members);
    return response.group as Group;
  }
);

export const removeGroupMemberThunk = createAsyncThunk(
  "messenger/removeGroupMember",
  async ({ groupId, memberId }: { groupId: string; memberId: string }) => {
    const response = await removeGroupMemberAPI(groupId, memberId);
    return response.group as Group;
  }
);

export const updateGroupRoleThunk = createAsyncThunk(
  "messenger/updateGroupRole",
  async ({ groupId, memberId, role }: { groupId: string; memberId: string; role: 'coAdmin' | 'member' }) => {
    const response = await updateGroupRoleAPI(groupId, memberId, role);
    return response.group as Group;
  }
);

export const checkOnline = createAsyncThunk(
 "messenger/checkOnline",
 async (identifier: string) => {
   const response = await getUserStatus(identifier);
   return response;
 }
);

type ConversationCache = {
  messages: Message[];
  before?: string;
  hasMore: boolean;
};

const initialState: MessengerState & { conversations: Record<string, ConversationCache> } = {
  availableUsers: [],
  selectedUser: null,
  groups: [],
  selectedGroup: null,
  messages: [],
  message: "",
  loading: false,
  loadingMore: false,
  hasMore: true,
  before: undefined,
  showMainChat: false,
  ringtoneRef: createRef<HTMLAudioElement>(),
  inCall: false,
  incoming: null,
  callHistory: [],
  userStatus: null,
  checkingStatus: false,
  timestamp: 0,
  status: "missed",
  lastFetchedUserId: undefined,
  replyTo: null,
  conversations: {},
};

const messengerSlice = createSlice({
  name: "messenger",
  initialState,
  reducers: {
    setSelectedUser: (state, action: PayloadAction<User | null>) => {
      const newSelectedUser = action.payload;
      const previousSelectedUserId = state.selectedUser?._id;
      const previousSelectedGroupId = state.selectedGroup?._id;

      if (previousSelectedUserId) {
        state.conversations[previousSelectedUserId] = {
          messages: state.messages,
          before: state.before,
          hasMore: state.hasMore,
        };
      } else if (previousSelectedGroupId) {
        state.conversations[`group_${previousSelectedGroupId}`] = {
          messages: state.messages,
          before: state.before,
          hasMore: state.hasMore,
        };
      }

      state.selectedUser = newSelectedUser;
      state.selectedGroup = null; // Clear selected group when user is selected
      state.replyTo = null;

      if (newSelectedUser) {
        const cachedConversation = state.conversations[newSelectedUser._id];

        if (cachedConversation) {
          state.messages = cachedConversation.messages;
          state.before = cachedConversation.before;
          state.hasMore = cachedConversation.hasMore;
          state.loading = false;
          state.loadingMore = false;
        } else {
          state.messages = [];
          state.before = undefined;
          state.hasMore = true;
          state.loading = false;
          state.loadingMore = false;
        }
        state.showMainChat = true;
      } else {
        state.messages = [];
        state.before = undefined;
        state.hasMore = true;
        state.showMainChat = false;
      }
    },
    setSelectedGroup: (state, action: PayloadAction<Group | null>) => {
      const newSelectedGroup = action.payload;
      const previousSelectedUserId = state.selectedUser?._id;
      const previousSelectedGroupId = state.selectedGroup?._id;

      if (previousSelectedUserId) {
        state.conversations[previousSelectedUserId] = {
          messages: state.messages,
          before: state.before,
          hasMore: state.hasMore,
        };
      } else if (previousSelectedGroupId) {
        state.conversations[`group_${previousSelectedGroupId}`] = {
          messages: state.messages,
          before: state.before,
          hasMore: state.hasMore,
        };
      }

      state.selectedGroup = newSelectedGroup;
      state.selectedUser = null; // Clear selected user when group is selected
      state.replyTo = null;

      if (newSelectedGroup) {
        const cachedConversation = state.conversations[`group_${newSelectedGroup._id}`];

        if (cachedConversation) {
          state.messages = cachedConversation.messages;
          state.before = cachedConversation.before;
          state.hasMore = cachedConversation.hasMore;
          state.loading = false;
          state.loadingMore = false;
        } else {
          state.messages = [];
          state.before = undefined;
          state.hasMore = true;
          state.loading = false;
          state.loadingMore = false;
        }
        state.showMainChat = true;
      } else {
        state.messages = [];
        state.before = undefined;
        state.hasMore = true;
        state.showMainChat = false;
      }
    },
    setMessage: (state, action: PayloadAction<string>) => {
      state.message = action.payload;
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      const newMsg = action.payload;
      const exists = state.messages.some(
        (msg) =>
          (msg._id && newMsg._id && msg._id === newMsg._id) ||
          (msg.id && newMsg.id && msg.id === newMsg.id)
      );
      if (!exists) {
        state.messages.push(newMsg);
      }
    },
    setShowMainChat: (state, action: PayloadAction<boolean>) => {
      state.showMainChat = action.payload;
    },
    setReplyTo: (state, action: PayloadAction<string | null>) => {
      state.replyTo = action.payload;
    },
    clearReplyTo: (state) => {
      state.replyTo = null;
    },
    setInCall: (state, action: PayloadAction<boolean>) => {
      state.inCall = action.payload;
    },
    setIncoming: (
      state,
      action: PayloadAction<{
        callerId: string;
        callType: "audio" | "video";
      } | null>
    ) => {
      state.incoming = action.payload;
    },
    addCallHistory: (
      state,
      action: PayloadAction<{
        userId: string;
        callType: "audio" | "video";
        timestamp: number;
        duration?: number;
        status: "missed" | "answered" | "outgoing";
      }>
    ) => {
      state.callHistory.push(action.payload);
    },
    setMessages: (state, action: PayloadAction<Message[]>) => {
      state.messages = action.payload;
    },
    resetMessagesState: (state) => {
      state.messages = [];
      state.before = undefined;
      state.hasMore = true;
      state.loading = false;
      state.loadingMore = false;
      state.conversations = {};
    },
    resetUserStatus: (state) => {
      state.userStatus = null;
      state.checkingStatus = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAvailableUsers.fulfilled, (state, action) => {
        state.availableUsers = action.payload;
      })
      .addCase(fetchAvailableUsers.rejected, (state) => {
        state.availableUsers = [];
      })
      .addCase(fetchMessages.pending, (state, action) => {
        const { replace } = action.meta.arg as { replace?: boolean };
        if (replace) {
          state.loading = true;
        } else {
          state.loadingMore = true;
        }
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        const { messages, hasMore, oldestTimestamp, replace } = action.payload;
        if (replace) {
          state.messages = messages;
        } else {
          state.messages = [...messages, ...state.messages];
        }
        state.before = oldestTimestamp === null ? undefined : oldestTimestamp;
        state.hasMore = hasMore;
        state.loading = false;
        state.loadingMore = false;
        if (state.selectedUser) {
          state.lastFetchedUserId = state.selectedUser._id;
        }
      })
      .addCase(fetchMessages.rejected, (state) => {
        state.loading = false;
        state.loadingMore = false;
      })
      .addCase(checkOnline.pending, (state) => {
        state.checkingStatus = true;
      })
      .addCase(checkOnline.fulfilled, (state, action) => {
        state.userStatus = action.payload;
        state.checkingStatus = false;
      })
      .addCase(checkOnline.rejected, (state) => {
        state.userStatus = null;
        state.checkingStatus = false;
      })
      .addCase(fetchGroups.fulfilled, (state, action) => {
        state.groups = action.payload;
      })
      .addCase(addGroupMembersThunk.fulfilled, (state, action) => {
        if (state.selectedGroup && state.selectedGroup._id === action.payload._id) {
          state.selectedGroup = action.payload;
        }
        const index = state.groups.findIndex(g => g._id === action.payload._id);
        if (index !== -1) {
          state.groups[index] = action.payload;
        }
      })
      .addCase(removeGroupMemberThunk.fulfilled, (state, action) => {
        if (state.selectedGroup && state.selectedGroup._id === action.payload._id) {
          state.selectedGroup = action.payload;
        }
        const index = state.groups.findIndex(g => g._id === action.payload._id);
        if (index !== -1) {
          state.groups[index] = action.payload;
        }
      })
      .addCase(updateGroupRoleThunk.fulfilled, (state, action) => {
        if (state.selectedGroup && state.selectedGroup._id === action.payload._id) {
          state.selectedGroup = action.payload;
        }
        const index = state.groups.findIndex(g => g._id === action.payload._id);
        if (index !== -1) {
          state.groups[index] = action.payload;
        }
      });
  },
});

export const {
  setSelectedUser,
  setSelectedGroup,
  setMessage,
  addMessage,
  setShowMainChat,
  setInCall,
  setIncoming,
  addCallHistory,
  resetMessagesState,
  resetUserStatus,
  setReplyTo,
  clearReplyTo,
  setMessages,
} = messengerSlice.actions;

export default messengerSlice.reducer;