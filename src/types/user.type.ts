export interface GetUserResponse {
  success: boolean;
  user: User;
  message?: string;

}

export interface User {
  id: string;
  _id: string;
  username: string ;
  fullName: string;
  email: string;
  phoneNumber: number;
  profilePicture: string;
  bio: string;
  followers: string[];
  following: string[];
  isPrivate: boolean;
  authType: string;
  role?: "user" | "admin";
  createdAt: string;
  updatedAt: string;
  posts?: string[];
  checkMark: boolean;
  currentUserId?: string;
  isFollowing?: boolean;
  followersCount?: number;
  followingCount?: number;
  lastActive?: number | string | null;
  lastOnline?: number | string | null;
  lastActiveTime?: string;
  lastOnlineTime?: string;
  hasStories?: boolean;
  isBot?: boolean;
}

export interface BotSuggestion {
  label: string;
  prompt: string;
}

export interface BotSearchResultPost {
  _id: string;
  link: string;
  caption: string;
  excerpt: string;
  type: "image" | "video" | "text";
  fileUrl?: string;
  createdAt: string;
  aiTopics?: string[];
  author: {
    _id: string;
    username: string;
    fullName?: string;
    profilePicture?: string;
    checkMark?: boolean;
    isBot?: boolean;
  };
}

export interface BotPayload {
  type: string;
  topic?: string;
  query?: string;
  topics?: string[];
  offset?: number;
  nextOffset?: number;
  total?: number;
  hasMore?: boolean;
  suggestions?: string[] | BotSuggestion[];
  posts?: BotSearchResultPost[];
}

export interface Message {
  id: string;
  _id: string;
  content: string;
  senderId: string;
  sender?: User;
  receiverId?: string;
  receiver?: User;
  groupId?: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
  message: string;
  replyTo?: string | null;
  mediaUrl?: string;
  mediaType?: "image" | "video" | "file";
  isOwnMessage?: boolean;
  tempId?: string; // Add this line for optimistic update and deduplication
  botPayload?: BotPayload | null;
}

export interface UploadAvatarResponse {
  success: boolean;
  message: string;
  profilePicture: string;
}

export interface DeleteAvatarResponse {
  success: boolean;
  message: string;
}

export interface UpdateBioResponse {
  success: boolean;
  message: string;
  user: {
    _id: string;
    username: string;
    bio: string;
    profilePicture?: string;
  };
}

export interface SuggestedUser {
  _id: string;
  username: string;
  profilePicture?: string;
  checkMark: boolean;
  // thêm các trường khác nếu cần
}

export interface SuggestUsersResponse {
  success: boolean;
  users: SuggestedUser[];
}
