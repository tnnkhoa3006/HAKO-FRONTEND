"use client";

import { type FormEvent, type ReactNode, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@/app/hooks/useUser";
import {
  ArrowLeft,
  Bell,
  BookOpen,
  Check,
  Copy,
  Database,
  FileImage,
  Loader2,
  Pencil,
  Search,
  Shield,
  Trash2,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  listAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  notifyAdminUsers,
  listAdminPosts,
  deleteAdminPost,
  listAdminStories,
  deleteAdminStory,
  seedSampleData,
  createAdminPost,
  createAdminStory,
} from "@/server/admin";

type Section = "users" | "posts" | "stories" | "notify" | "seed";
type AdminUser = Record<string, unknown>;
type AdminPost = Record<string, unknown>;
type AdminStory = Record<string, unknown>;

const navItems: {
  id: Section;
  label: string;
  desc: string;
  Icon: LucideIcon;
}[] = [
  { id: "users", label: "Người dùng", desc: "Tài khoản và quyền", Icon: Users },
  { id: "posts", label: "Bài viết", desc: "Nội dung feed", Icon: FileImage },
  { id: "stories", label: "Story", desc: "Media ngắn hạn", Icon: BookOpen },
  { id: "notify", label: "Thông báo", desc: "Broadcast / target", Icon: Bell },
  { id: "seed", label: "Dữ liệu mẫu", desc: "Bộ demo nhanh", Icon: Database },
];

const meta: Record<Section, { title: string; desc: string; helper: string; Icon: LucideIcon }> = {
  users: {
    title: "Quản lý người dùng",
    desc: "Tìm kiếm, sao chép ID, tạo mới và chỉnh sửa nhanh các trường an toàn.",
    helper: "Search chạy thủ công để bảng không reload theo từng ký tự.",
    Icon: Users,
  },
  posts: {
    title: "Quản lý bài viết",
    desc: "Đăng bài thay cho user, xem preview media và xóa nhanh nội dung gần đây.",
    helper: "Phù hợp để seed content hoặc kiểm tra feed trên môi trường test.",
    Icon: FileImage,
  },
  stories: {
    title: "Quản lý story",
    desc: "Tạo story mới, xem preview và dọn nhanh các story đang hoạt động.",
    helper: "Preview media ngay trong dashboard để thao tác đỡ rối hơn.",
    Icon: BookOpen,
  },
  notify: {
    title: "Gửi thông báo",
    desc: "Soạn nội dung, chọn phạm vi gửi và kiểm tra nhanh trước khi bắn thông báo.",
    helper: "Có thể gửi toàn bộ hoặc nhắm theo danh sách userId.",
    Icon: Bell,
  },
  seed: {
    title: "Tạo dữ liệu mẫu",
    desc: "Khởi tạo nhanh bộ tài khoản demo để test UI và media flow.",
    helper: "Dành cho local hoặc staging khi cần dữ liệu có sẵn ngay.",
    Icon: Database,
  },
};

const inputClass =
  "w-full rounded-2xl border border-[var(--divider-soft)] bg-[var(--auth-input-bg)] px-3.5 py-2.5 text-sm text-[var(--auth-input-text)] placeholder:text-[var(--auth-placeholder)] outline-none transition-[border-color,box-shadow] duration-200 ease-out focus:border-[var(--accent-color)]/45 focus:shadow-[0_0_0_3px_var(--accent-soft)]";
const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--accent-color)] px-4 py-2.5 text-sm font-semibold text-[#0a1628] shadow-md shadow-black/15 transition-all duration-200 hover:brightness-105 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45";
const btnSecondary =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--divider-soft)] bg-[var(--surface-muted)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] transition-all duration-200 hover:bg-[var(--surface-muted-hover)] active:scale-[0.98]";
const btnGhost =
  "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[var(--accent-strong)] transition-colors duration-200 hover:bg-[var(--accent-soft)]";
const btnDangerGhost =
  "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#ff8d98] transition-colors duration-200 hover:bg-[#ff8d98]/12";
const cardClass =
  "rounded-[26px] border border-[var(--divider-soft)] bg-[var(--surface-inset)]/88 p-4 shadow-sm shadow-black/5 backdrop-blur-sm md:p-5";

const newUserDefault = { username: "", fullName: "", email: "", password: "", phoneNumber: "" };
const editDefault = { fullName: "", bio: "", isPrivate: false, checkMark: false };
const postDefault = { caption: "", type: "image" as "image" | "video", authorId: "" };
const storyDefault = { caption: "", authorId: "", musicId: "" };

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cn(cardClass, className)}>{children}</section>;
}

function PanelHeader({
  title,
  desc,
  action,
}: {
  title: string;
  desc?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h3 className="text-base font-semibold tracking-tight text-[var(--foreground)] md:text-lg">
          {title}
        </h3>
        {desc ? <p className="mt-1 text-sm leading-relaxed text-[var(--foreground)]/65">{desc}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

function EmptyState({
  Icon,
  title,
  desc,
}: {
  Icon: LucideIcon;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-[24px] border border-dashed border-[var(--divider-soft)] bg-[var(--surface-muted)]/35 px-6 py-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--surface-base)] ring-1 ring-[var(--divider-soft)]">
        <Icon className="h-6 w-6 text-[var(--accent-strong)]" />
      </div>
      <h4 className="mt-4 text-base font-semibold text-[var(--foreground)]">{title}</h4>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-[var(--foreground)]/62">{desc}</p>
    </div>
  );
}

function MediaPreview({
  src,
  isVideo,
  className,
}: {
  src: string;
  isVideo: boolean;
  className: string;
}) {
  if (!src) {
    return (
      <div className={cn(className, "flex items-center justify-center bg-[var(--surface-muted)] text-[var(--foreground)]/45")}>
        <FileImage className="h-8 w-8" />
      </div>
    );
  }
  if (isVideo) {
    return <video src={src} className={className} muted playsInline preload="metadata" />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className={className} loading="lazy" />
  );
}

export default function AdminDashboard() {
  const { user, loading } = useUser();
  const [section, setSection] = useState<Section>("users");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [isSectionLoading, setIsSectionLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [stories, setStories] = useState<AdminStory[]>([]);

  const [userSearch, setUserSearch] = useState("");
  const [newUser, setNewUser] = useState(newUserDefault);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(editDefault);

  const [notifyText, setNotifyText] = useState("");
  const [notifyBroadcast, setNotifyBroadcast] = useState(false);
  const [notifyIds, setNotifyIds] = useState("");

  const [postForm, setPostForm] = useState(postDefault);
  const [postFile, setPostFile] = useState<File | null>(null);
  const [storyForm, setStoryForm] = useState(storyDefault);
  const [storyMedia, setStoryMedia] = useState<File | null>(null);

  const prefersReducedMotion = useReducedMotion() ?? false;
  const active = meta[section];
  const recipientIds = notifyIds.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);

  const flash = useCallback((text: string) => {
    setMsg(text);
    setErr(null);
  }, []);

  const fail = useCallback((error: unknown, fallback: string) => {
    setErr(error instanceof Error ? error.message : fallback);
  }, []);

  useEffect(() => {
    if (!msg) return;
    const t = window.setTimeout(() => setMsg(null), 4000);
    return () => window.clearTimeout(t);
  }, [msg]);

  useEffect(() => {
    if (!copiedId) return;
    const t = window.setTimeout(() => setCopiedId(null), 1800);
    return () => window.clearTimeout(t);
  }, [copiedId]);

  const loadUsers = useCallback(async (query?: string) => {
    setIsSectionLoading(true);
    try {
      const data = await listAdminUsers({ q: query?.trim() || undefined });
      setUsers(Array.isArray(data.users) ? data.users : []);
    } catch (error) {
      fail(error, "Lỗi tải danh sách người dùng");
    } finally {
      setIsSectionLoading(false);
    }
  }, [fail]);

  const loadPosts = useCallback(async () => {
    setIsSectionLoading(true);
    try {
      const data = await listAdminPosts();
      setPosts(Array.isArray(data.posts) ? data.posts : []);
    } catch (error) {
      fail(error, "Lỗi tải bài viết");
    } finally {
      setIsSectionLoading(false);
    }
  }, [fail]);

  const loadStories = useCallback(async () => {
    setIsSectionLoading(true);
    try {
      const data = await listAdminStories();
      setStories(Array.isArray(data.stories) ? data.stories : []);
    } catch (error) {
      fail(error, "Lỗi tải story");
    } finally {
      setIsSectionLoading(false);
    }
  }, [fail]);

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    if (section === "users") void loadUsers();
    if (section === "posts") void loadPosts();
    if (section === "stories") void loadStories();
  }, [user, section, loadUsers, loadPosts, loadStories]);
  const copyId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
    } catch {
      setErr("Không sao chép được ID");
    }
  };

  const onSearchUsers = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await loadUsers(userSearch);
  };

  const onCreateUser = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPendingAction("create-user");
    try {
      await createAdminUser({
        username: newUser.username.trim(),
        fullName: newUser.fullName.trim(),
        email: newUser.email.trim() || undefined,
        phoneNumber: newUser.phoneNumber.trim() || undefined,
        password: newUser.password,
      });
      flash("Đã tạo người dùng");
      setNewUser(newUserDefault);
      await loadUsers(userSearch);
    } catch (error) {
      fail(error, "Lỗi tạo người dùng");
    } finally {
      setPendingAction(null);
    }
  };

  const onSaveUser = async () => {
    if (!editUserId) return;
    setPendingAction("save-user");
    try {
      await updateAdminUser(editUserId, editForm);
      flash("Đã cập nhật");
      setEditUserId(null);
      await loadUsers(userSearch);
    } catch (error) {
      fail(error, "Lỗi cập nhật người dùng");
    } finally {
      setPendingAction(null);
    }
  };

  const onDeleteUser = async (id: string, username: string) => {
    if (!confirm(`Xóa @${username}?`)) return;
    setPendingAction(`delete-user-${id}`);
    try {
      await deleteAdminUser(id);
      flash("Đã xóa người dùng");
      await loadUsers(userSearch);
    } catch (error) {
      fail(error, "Lỗi xóa người dùng");
    } finally {
      setPendingAction(null);
    }
  };

  const onCreatePost = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!postFile || !postForm.authorId.trim()) return setErr("Chọn file và nhập authorId.");
    setPendingAction("create-post");
    try {
      const fd = new FormData();
      fd.append("file", postFile);
      fd.append("caption", postForm.caption);
      fd.append("type", postForm.type);
      fd.append("authorId", postForm.authorId.trim());
      await createAdminPost(fd);
      flash("Đã đăng bài");
      setPostFile(null);
      setPostForm(postDefault);
      await loadPosts();
    } catch (error) {
      fail(error, "Lỗi đăng bài");
    } finally {
      setPendingAction(null);
    }
  };

  const onDeletePost = async (id: string) => {
    if (!confirm("Xóa bài viết này?")) return;
    setPendingAction(`delete-post-${id}`);
    try {
      await deleteAdminPost(id);
      flash("Đã xóa bài viết");
      await loadPosts();
    } catch (error) {
      fail(error, "Lỗi xóa bài viết");
    } finally {
      setPendingAction(null);
    }
  };

  const onCreateStory = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!storyMedia || !storyForm.authorId.trim()) return setErr("Chọn media và nhập authorId.");
    setPendingAction("create-story");
    try {
      const fd = new FormData();
      fd.append("media", storyMedia);
      fd.append("caption", storyForm.caption);
      fd.append("authorId", storyForm.authorId.trim());
      if (storyForm.musicId.trim()) fd.append("musicId", storyForm.musicId.trim());
      await createAdminStory(fd);
      flash("Đã tạo story");
      setStoryMedia(null);
      setStoryForm(storyDefault);
      await loadStories();
    } catch (error) {
      fail(error, "Lỗi tạo story");
    } finally {
      setPendingAction(null);
    }
  };

  const onDeleteStory = async (id: string) => {
    if (!confirm("Xóa story này?")) return;
    setPendingAction(`delete-story-${id}`);
    try {
      await deleteAdminStory(id);
      flash("Đã xóa story");
      await loadStories();
    } catch (error) {
      fail(error, "Lỗi xóa story");
    } finally {
      setPendingAction(null);
    }
  };

  const onNotify = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPendingAction("notify");
    try {
      await notifyAdminUsers({
        message: notifyText.trim(),
        broadcast: notifyBroadcast,
        userIds: notifyBroadcast ? undefined : recipientIds,
      });
      flash("Đã gửi thông báo");
      setNotifyText("");
      setNotifyIds("");
    } catch (error) {
      fail(error, "Lỗi gửi thông báo");
    } finally {
      setPendingAction(null);
    }
  };

  const onSeed = async () => {
    setPendingAction("seed");
    try {
      await seedSampleData();
      flash("Đã tạo dữ liệu mẫu");
    } catch (error) {
      fail(error, "Lỗi tạo dữ liệu mẫu");
    } finally {
      setPendingAction(null);
    }
  };

  const stats =
    section === "users"
      ? [
          { label: "User", value: String(users.length), Icon: Users },
          { label: "Admin", value: String(users.filter((u) => u.role === "admin").length), Icon: Shield },
          { label: "Private", value: String(users.filter((u) => Boolean(u.isPrivate)).length), Icon: Check },
        ]
      : section === "posts"
        ? [
            { label: "Posts", value: String(posts.length), Icon: FileImage },
            { label: "Video", value: String(posts.filter((p) => String(p.type || "").toLowerCase() === "video").length), Icon: FileImage },
            { label: "Caption", value: String(posts.filter((p) => Boolean(String(p.caption || "").trim())).length), Icon: Check },
          ]
        : section === "stories"
          ? [
              { label: "Stories", value: String(stories.length), Icon: BookOpen },
              { label: "Nhạc", value: String(stories.filter((s) => Boolean(s.musicId || s.audioUrl)).length), Icon: Bell },
              { label: "Caption", value: String(stories.filter((s) => Boolean(String(s.caption || "").trim())).length), Icon: Check },
            ]
          : section === "notify"
            ? [
                { label: "Mode", value: notifyBroadcast ? "All" : "Target", Icon: Bell },
                { label: "Users", value: notifyBroadcast ? "All" : String(recipientIds.length), Icon: Users },
                { label: "Ký tự", value: String(notifyText.trim().length), Icon: Check },
              ]
            : [
                { label: "Accounts", value: "3", Icon: Users },
                { label: "Password", value: "1", Icon: Shield },
                { label: "Run", value: "1 click", Icon: Database },
              ];

  const panelMotion = prefersReducedMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 } };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-3 text-[var(--foreground)]">
        <Loader2 className="h-7 w-7 animate-spin text-[var(--accent-color)]" />
        <span className="text-sm">Đang tải...</span>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="flex min-h-screen flex-col text-[var(--foreground)]">
        <header className="border-b border-[var(--divider-soft)] bg-[var(--surface-base)]/95 px-4 py-3 backdrop-blur-md">
          <Link href="/" className={btnSecondary}>
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Link>
        </header>
        <div className="mx-auto flex w-full max-w-md flex-1 items-center px-4 py-10">
          <Card className="w-full text-center">
            <Shield className="mx-auto mb-4 h-12 w-12 text-[var(--accent-color)]" />
            <h1 className="text-xl font-semibold">Không có quyền truy cập</h1>
            <p className="mt-2 text-sm leading-relaxed text-[var(--foreground)]/70">
              Chỉ quản trị viên mới xem được khu vực này.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col text-[var(--foreground)] md:flex-row md:overflow-hidden">
      <aside className="hidden w-[280px] shrink-0 border-r border-[var(--divider-soft)] bg-[var(--surface-base)]/80 p-3 backdrop-blur-xl md:flex md:flex-col">
        <Card className="bg-[var(--surface-muted)]/24">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent-soft)] ring-1 ring-[var(--accent-color)]/20">
              <Shield className="h-5 w-5 text-[var(--accent-strong)]" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--accent-strong)]">Admin</div>
              <div className="truncate text-base font-semibold">{user.fullName || user.username}</div>
              <div className="truncate text-xs text-[var(--foreground)]/58">@{user.username}</div>
            </div>
          </div>
        </Card>
        <nav className="mt-4 space-y-2">
          {navItems.map(({ id, label, desc, Icon }) => {
            const isActive = section === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setSection(id)}
                className={cn(
                  "w-full rounded-[22px] border p-4 text-left transition-all duration-200",
                  isActive
                    ? "border-[var(--accent-color)]/30 bg-[var(--accent-soft)]"
                    : "border-[var(--divider-soft)] bg-[var(--surface-muted)]/20 hover:bg-[var(--surface-muted)]/35",
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--surface-base)]/80">
                    <Icon className={cn("h-4 w-4", isActive ? "text-[var(--accent-strong)]" : "text-[var(--foreground)]/72")} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{label}</div>
                    <div className="mt-1 text-xs text-[var(--foreground)]/58">{desc}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="z-20 flex items-center gap-3 border-b border-[var(--divider-soft)] bg-[var(--surface-base)]/80 px-3 py-3 backdrop-blur-xl sm:px-4 lg:px-5">
          <Link href="/" className={btnSecondary}>
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Quay lại feed</span>
          </Link>
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent-soft)] ring-1 ring-[var(--accent-color)]/15">
              <active.Icon className="h-5 w-5 text-[var(--accent-strong)]" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{active.title}</div>
              <div className="truncate text-xs text-[var(--foreground)]/58">{active.helper}</div>
            </div>
          </div>
          {isSectionLoading ? (
            <div className="hidden items-center gap-2 rounded-full border border-[var(--divider-soft)] bg-[var(--surface-inset)]/95 px-3 py-1.5 text-xs text-[var(--foreground)]/78 shadow-sm sm:inline-flex">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--accent-color)]" />
              Đang tải
            </div>
          ) : null}
        </header>

        <div className="flex-1 overflow-y-auto px-3 pb-5 pt-3 sm:px-4 lg:px-5">
          <div className="mb-3 flex gap-2 overflow-x-auto rounded-2xl border border-[var(--divider-soft)]/70 bg-[var(--surface-base)]/90 p-1.5 md:hidden">
            {navItems.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setSection(id)}
                className={cn(
                  "shrink-0 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all",
                  section === id
                    ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                    : "bg-[var(--surface-muted)]/80 text-[var(--foreground)]/90",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {msg ? (
              <motion.div key="ok" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mb-3 flex items-center gap-2 rounded-2xl border border-[var(--accent-color)]/25 bg-[var(--accent-soft)]/90 px-4 py-3 text-sm text-[var(--accent-strong)]">
                <Check className="h-4 w-4" />
                {msg}
              </motion.div>
            ) : null}
          </AnimatePresence>
          <AnimatePresence mode="wait">
            {err ? (
              <motion.div key="err" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mb-3 flex items-center justify-between gap-3 rounded-2xl border border-[#ff8d98]/35 bg-[#ff8d98]/10 px-4 py-3 text-sm text-[#ff8d98]">
                <span>{err}</span>
                <button type="button" onClick={() => setErr(null)} className="rounded-lg p-1 hover:bg-white/10">
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div key={section} {...panelMotion} className="space-y-5">
              <Card className="overflow-hidden bg-[var(--surface-strong)]/92 p-0">
                <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.95fr)] lg:p-6">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-[var(--divider-soft)] bg-[var(--surface-muted)]/60 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--accent-strong)]">
                      <active.Icon className="h-3.5 w-3.5" />
                      {navItems.find((x) => x.id === section)?.label}
                    </div>
                    <h1 className="mt-4 text-2xl font-semibold tracking-tight md:text-[2rem]">{active.title}</h1>
                    <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[var(--foreground)]/68">{active.desc}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                    {stats.map(({ label, value, Icon }) => (
                      <div key={label} className="rounded-2xl border border-[var(--divider-soft)]/80 bg-[var(--surface-muted)]/45 p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs uppercase tracking-[0.08em] text-[var(--foreground)]/55">{label}</span>
                          <Icon className="h-4 w-4 text-[var(--accent-strong)]" />
                        </div>
                        <div className="mt-4 text-2xl font-semibold tracking-tight">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              {section === "users" && (
                <div className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_360px]">
                  <Card className="space-y-4">
                    <PanelHeader title="Danh sách người dùng" desc="Search thủ công để giảm cảm giác giật khi thao tác." action={<button type="button" className={btnSecondary} onClick={() => void loadUsers(userSearch)}><Search className="h-4 w-4" />Làm mới</button>} />
                    <form onSubmit={onSearchUsers} className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
                      <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-45" /><input value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="username, họ tên hoặc email" className={`${inputClass} pl-10`} /></div>
                      <button type="submit" className={btnSecondary}><Search className="h-4 w-4" />Tìm</button>
                    </form>
                    {users.length === 0 ? <EmptyState Icon={Users} title="Chưa có dữ liệu" desc="Thử tìm kiếm lại hoặc tải mới danh sách." /> : (
                      <>
                        <div className="grid gap-3 md:hidden">
                          {users.map((u) => {
                            const id = String(u._id || u.id || "");
                            const uname = String(u.username || "user");
                            return <div key={id} className="rounded-2xl border border-[var(--divider-soft)] bg-[var(--surface-muted)]/30 p-4"><div className="flex items-start justify-between gap-3"><div><div className="text-sm font-semibold">@{uname}</div><div className="text-xs text-[var(--foreground)]/58">{String(u.fullName || "")}</div></div><button type="button" className={btnGhost} onClick={() => { setEditUserId(id); setEditForm({ fullName: String(u.fullName || ""), bio: String(u.bio || ""), isPrivate: !!u.isPrivate, checkMark: !!u.checkMark }); }}><Pencil className="h-3.5 w-3.5" />Sửa</button></div><div className="mt-3 flex items-center gap-2"><code className="min-w-0 flex-1 truncate text-[11px] text-[var(--foreground)]/58">{id}</code><button type="button" className={btnGhost} onClick={() => void copyId(id)}>{copiedId === id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}</button></div></div>;
                          })}
                        </div>
                        <div className="hidden overflow-hidden rounded-[24px] border border-[var(--divider-soft)] md:block">
                          <div className="max-h-[560px] overflow-auto">
                            <table className="w-full min-w-[680px] text-left text-sm">
                              <thead className="sticky top-0 bg-[var(--surface-base)] text-xs uppercase tracking-wide text-[var(--foreground)]/70"><tr><th className="px-4 py-3">Người dùng</th><th className="px-4 py-3">Liên hệ</th><th className="px-4 py-3">Vai trò</th><th className="px-4 py-3 text-right">Thao tác</th></tr></thead>
                              <tbody>{users.map((u) => { const id = String(u._id || u.id || ""); const uname = String(u.username || "user"); return <tr key={id} className="border-t border-[var(--divider-soft)]/50 hover:bg-[var(--surface-muted)]/35"><td className="px-4 py-3"><div className="font-semibold">@{uname}</div><div className="text-xs text-[var(--foreground)]/58">{String(u.fullName || "")}</div><div className="mt-2 flex items-center gap-2"><code className="max-w-[180px] truncate rounded-full bg-[var(--surface-base)] px-2.5 py-1 text-[10px] text-[var(--foreground)]/58">{id}</code><button type="button" className={btnGhost} onClick={() => void copyId(id)}>{copiedId === id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}</button></div></td><td className="px-4 py-3">{String(u.email || u.phoneNumber || "—")}</td><td className="px-4 py-3"><span className={cn("inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold", u.role === "admin" ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]" : "bg-[var(--surface-base)] text-[var(--foreground)]/72")}>{String(u.role || "user")}</span></td><td className="px-4 py-3 text-right"><div className="flex flex-wrap justify-end gap-2"><button type="button" className={btnGhost} onClick={() => { setEditUserId(id); setEditForm({ fullName: String(u.fullName || ""), bio: String(u.bio || ""), isPrivate: !!u.isPrivate, checkMark: !!u.checkMark }); }}><Pencil className="h-3.5 w-3.5" />Sửa</button><button type="button" className={btnDangerGhost} onClick={() => void onDeleteUser(id, uname)}><Trash2 className="h-3.5 w-3.5" />Xóa</button></div></td></tr>; })}</tbody>
                            </table>
                          </div>
                        </div>
                      </>
                    )}
                  </Card>
                  <Card className="space-y-4">
                    <PanelHeader title="Tạo người dùng mới" desc="Điền nhanh thông tin cơ bản." />
                    <form onSubmit={onCreateUser} className="space-y-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <input value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} placeholder="username" className={inputClass} />
                        <input value={newUser.fullName} onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })} placeholder="Họ tên" className={inputClass} />
                        <input value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} placeholder="Email" className={inputClass} />
                        <input value={newUser.phoneNumber} onChange={(e) => setNewUser({ ...newUser, phoneNumber: e.target.value })} placeholder="Số điện thoại" className={inputClass} />
                        <input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} placeholder="Mật khẩu" className={`${inputClass} sm:col-span-2`} />
                      </div>
                      <button type="submit" className={cn(btnPrimary, "w-full")} disabled={pendingAction === "create-user"}>{pendingAction === "create-user" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}Tạo người dùng</button>
                    </form>
                  </Card>
                </div>
              )}

              {section === "posts" && (
                <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
                  <Card className="space-y-4">
                    <PanelHeader title="Đăng bài mới" desc="Chọn file, authorId và caption nếu cần." />
                    <form onSubmit={onCreatePost} className="space-y-4">
                      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[22px] border border-dashed border-[var(--divider-soft)] bg-[var(--surface-muted)]/30 px-4 py-8 text-center"><FileImage className="h-8 w-8 opacity-55" /><span className="text-sm">{postFile ? postFile.name : "Ảnh hoặc video"}</span><input type="file" accept="image/*,video/*" className="hidden" onChange={(e) => setPostFile(e.target.files?.[0] || null)} /></label>
                      <input value={postForm.authorId} onChange={(e) => setPostForm({ ...postForm, authorId: e.target.value })} placeholder="MongoDB authorId" className={inputClass} />
                      <select value={postForm.type} onChange={(e) => setPostForm({ ...postForm, type: e.target.value as "image" | "video" })} className={inputClass}><option value="image">Ảnh</option><option value="video">Video / reel</option></select>
                      <input value={postForm.caption} onChange={(e) => setPostForm({ ...postForm, caption: e.target.value })} placeholder="Caption" className={inputClass} />
                      <button type="submit" className={cn(btnPrimary, "w-full")} disabled={pendingAction === "create-post"}>{pendingAction === "create-post" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileImage className="h-4 w-4" />}Đăng bài</button>
                    </form>
                  </Card>
                  <Card className="space-y-4">
                    <PanelHeader title="Bài viết gần đây" desc="Preview media trực tiếp để check nhanh nội dung." action={<button type="button" className={btnSecondary} onClick={() => void loadPosts()}><Search className="h-4 w-4" />Làm mới</button>} />
                    {posts.length === 0 ? <EmptyState Icon={FileImage} title="Chưa có bài viết" desc="Danh sách bài viết hiện đang trống." /> : <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">{posts.map((p) => { const id = String(p._id || ""); const url = String(p.fileUrl || ""); const isVideo = String(p.type || "").toLowerCase() === "video" || /\.(mp4|webm|mov|m4v)$/i.test(url); return <article key={id} className="overflow-hidden rounded-[24px] border border-[var(--divider-soft)] bg-[var(--surface-muted)]/28"><MediaPreview src={url} isVideo={isVideo} className="h-48 w-full object-cover" /><div className="space-y-3 p-4"><div className="flex items-start justify-between gap-3"><div><div className="text-sm font-semibold">@{String((p.author as Record<string, unknown> | undefined)?.username || "?")}</div><div className="text-xs text-[var(--foreground)]/55">{String((p.author as Record<string, unknown> | undefined)?.fullName || "")}</div></div><span className="rounded-full bg-[var(--surface-base)] px-2.5 py-1 text-[11px] font-semibold text-[var(--foreground)]/65">{isVideo ? "Video" : "Ảnh"}</span></div><p className="line-clamp-3 text-sm text-[var(--foreground)]/72">{String(p.caption || "Không có caption")}</p><button type="button" className={cn(btnDangerGhost, "w-full justify-center border border-[#ff8d98]/25 py-2.5")} onClick={() => void onDeletePost(id)}><Trash2 className="h-3.5 w-3.5" />Xóa bài viết</button></div></article>; })}</div>}
                  </Card>
                </div>
              )}
              {section === "stories" && (
                <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
                  <Card className="space-y-4">
                    <PanelHeader title="Tạo story" desc="Tạo nhanh story bằng authorId, có thể thêm musicId." />
                    <form onSubmit={onCreateStory} className="space-y-4">
                      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[22px] border border-dashed border-[var(--divider-soft)] bg-[var(--surface-muted)]/30 px-4 py-8 text-center"><BookOpen className="h-8 w-8 opacity-55" /><span className="text-sm">{storyMedia ? storyMedia.name : "Ảnh hoặc video"}</span><input type="file" accept="image/*,video/*" className="hidden" onChange={(e) => setStoryMedia(e.target.files?.[0] || null)} /></label>
                      <input value={storyForm.authorId} onChange={(e) => setStoryForm({ ...storyForm, authorId: e.target.value })} placeholder="MongoDB authorId" className={inputClass} />
                      <input value={storyForm.caption} onChange={(e) => setStoryForm({ ...storyForm, caption: e.target.value })} placeholder="Caption (tùy chọn)" className={inputClass} />
                      <input value={storyForm.musicId} onChange={(e) => setStoryForm({ ...storyForm, musicId: e.target.value })} placeholder="musicId (tùy chọn)" className={inputClass} />
                      <button type="submit" className={cn(btnPrimary, "w-full")} disabled={pendingAction === "create-story"}>{pendingAction === "create-story" ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookOpen className="h-4 w-4" />}Tạo story</button>
                    </form>
                  </Card>
                  <Card className="space-y-4">
                    <PanelHeader title="Story gần đây" desc="Preview nhanh để nhận diện media trước khi xóa." action={<button type="button" className={btnSecondary} onClick={() => void loadStories()}><Search className="h-4 w-4" />Làm mới</button>} />
                    {stories.length === 0 ? <EmptyState Icon={BookOpen} title="Chưa có story" desc="Khi có story active, chúng sẽ hiện ở đây." /> : <div className="grid gap-4 md:grid-cols-2">{stories.map((s) => { const id = String(s._id || ""); const url = String(s.media || s.mediaUrl || ""); const isVideo = String(s.type || "").toLowerCase() === "video" || /\.(mp4|webm|mov|m4v)$/i.test(url); return <article key={id} className="overflow-hidden rounded-[24px] border border-[var(--divider-soft)] bg-[var(--surface-muted)]/28"><div className="flex gap-4 p-4"><MediaPreview src={url} isVideo={isVideo} className="h-32 w-24 shrink-0 rounded-2xl object-cover" /><div className="flex min-w-0 flex-1 flex-col justify-between"><div><div className="text-sm font-semibold">@{String((s.author as Record<string, unknown> | undefined)?.username || "?")}</div><div className="text-xs text-[var(--foreground)]/55">{String((s.author as Record<string, unknown> | undefined)?.fullName || "")}</div><p className="mt-3 line-clamp-3 text-sm text-[var(--foreground)]/72">{String(s.caption || "Không có caption")}</p></div><button type="button" className={cn(btnDangerGhost, "mt-4 self-start border border-[#ff8d98]/25 px-3 py-2")} onClick={() => void onDeleteStory(id)}><Trash2 className="h-3.5 w-3.5" />Xóa story</button></div></div></article>; })}</div>}
                  </Card>
                </div>
              )}

              {section === "notify" && (
                <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_320px]">
                  <Card className="space-y-4">
                    <PanelHeader title="Soạn thông báo" desc="Chọn mode gửi trước, sau đó nhập nội dung và danh sách ID nếu cần." />
                    <form onSubmit={onNotify} className="space-y-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <button type="button" onClick={() => setNotifyBroadcast(true)} className={cn("rounded-2xl border px-4 py-4 text-left transition-all", notifyBroadcast ? "border-[var(--accent-color)]/40 bg-[var(--accent-soft)] text-[var(--accent-strong)]" : "border-[var(--divider-soft)] bg-[var(--surface-muted)]/35")}>Gửi toàn bộ</button>
                        <button type="button" onClick={() => setNotifyBroadcast(false)} className={cn("rounded-2xl border px-4 py-4 text-left transition-all", !notifyBroadcast ? "border-[var(--accent-color)]/40 bg-[var(--accent-soft)] text-[var(--accent-strong)]" : "border-[var(--divider-soft)] bg-[var(--surface-muted)]/35")}>Gửi theo ID</button>
                      </div>
                      <textarea value={notifyText} onChange={(e) => setNotifyText(e.target.value)} className={`${inputClass} min-h-[180px] resize-y`} placeholder="Nội dung thông báo..." />
                      {!notifyBroadcast ? <textarea value={notifyIds} onChange={(e) => setNotifyIds(e.target.value)} className={`${inputClass} min-h-[120px] resize-y font-mono text-xs`} placeholder="Mỗi dòng một userId MongoDB" /> : null}
                      <div className="flex items-center justify-between rounded-[22px] border border-[var(--divider-soft)] bg-[var(--surface-muted)]/30 p-4">
                        <div className="text-sm text-[var(--foreground)]/68">{notifyBroadcast ? "Sẽ gửi tới toàn bộ người dùng." : `Đang nhắm tới ${recipientIds.length} userId.`}</div>
                        <button type="submit" className={btnPrimary} disabled={pendingAction === "notify"}>{pendingAction === "notify" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}Gửi</button>
                      </div>
                    </form>
                  </Card>
                  <Card className="space-y-4">
                    <PanelHeader title="Tóm tắt" desc="Preview nhanh trước khi gửi." />
                    <div className="rounded-2xl border border-[var(--divider-soft)]/80 bg-[var(--surface-muted)]/35 p-4 text-sm text-[var(--foreground)]/72">{notifyText.trim() || "Nội dung thông báo sẽ hiện ở đây khi bạn bắt đầu nhập."}</div>
                  </Card>
                </div>
              )}

              {section === "seed" && (
                <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_320px]">
                  <Card className="space-y-5">
                    <PanelHeader title="Tạo dữ liệu mẫu" desc="Tạo 3 tài khoản demo và dữ liệu media cơ bản cho môi trường test." />
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl border border-[var(--divider-soft)] bg-[var(--surface-muted)]/35 p-4"><div className="text-xs uppercase tracking-[0.08em] text-[var(--foreground)]/55">Username</div><code className="mt-2 block rounded-xl bg-[var(--surface-base)] px-3 py-2 text-sm text-[var(--accent-strong)]">hako_seed_demo_0..2</code></div>
                      <div className="rounded-2xl border border-[var(--divider-soft)] bg-[var(--surface-muted)]/35 p-4"><div className="text-xs uppercase tracking-[0.08em] text-[var(--foreground)]/55">Mật khẩu</div><code className="mt-2 block rounded-xl bg-[var(--surface-base)] px-3 py-2 text-sm">Demo123456</code></div>
                    </div>
                    <button type="button" className={btnPrimary} onClick={() => void onSeed()} disabled={pendingAction === "seed"}>{pendingAction === "seed" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}Tạo dữ liệu mẫu</button>
                  </Card>
                  <Card className="space-y-4">
                    <PanelHeader title="Gợi ý" desc="Dùng bộ seed này để test feed, profile và media flow nhanh hơn." />
                    <div className="rounded-2xl border border-[var(--divider-soft)]/80 bg-[var(--surface-muted)]/35 p-4 text-sm leading-relaxed text-[var(--foreground)]/68">Sau khi seed xong, bạn có thể vào phần bài viết hoặc story để bổ sung thêm nội dung demo.</div>
                  </Card>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {editUserId ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-[2px]" style={{ background: "var(--overlay-backdrop)" }} onClick={() => setEditUserId(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 8 }} className="w-full max-w-lg overflow-hidden rounded-[28px] border border-[var(--divider-soft)] bg-[var(--surface-strong)] shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between gap-4 border-b border-[var(--divider-soft)] px-6 py-5"><div><h3 className="text-lg font-semibold">Chỉnh sửa người dùng</h3><p className="mt-1 text-sm text-[var(--foreground)]/62">Chỉ cập nhật các trường an toàn.</p></div><button type="button" onClick={() => setEditUserId(null)} className="rounded-xl border border-[var(--divider-soft)] bg-[var(--surface-muted)] p-2"><X className="h-4 w-4" /></button></div>
              <div className="space-y-4 p-6">
                <input value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} placeholder="Họ tên" className={inputClass} />
                <textarea value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} placeholder="Bio" className={`${inputClass} min-h-[104px] resize-y`} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex items-center justify-between rounded-2xl border border-[var(--divider-soft)] bg-[var(--surface-muted)]/30 px-4 py-3 text-sm"><span>Riêng tư</span><input type="checkbox" checked={editForm.isPrivate} onChange={(e) => setEditForm({ ...editForm, isPrivate: e.target.checked })} /></label>
                  <label className="flex items-center justify-between rounded-2xl border border-[var(--divider-soft)] bg-[var(--surface-muted)]/30 px-4 py-3 text-sm"><span>Tích xanh</span><input type="checkbox" checked={editForm.checkMark} onChange={(e) => setEditForm({ ...editForm, checkMark: e.target.checked })} /></label>
                </div>
              </div>
              <div className="flex justify-end gap-2 border-t border-[var(--divider-soft)] px-6 py-4"><button type="button" className={btnSecondary} onClick={() => setEditUserId(null)}>Hủy</button><button type="button" className={btnPrimary} onClick={() => void onSaveUser()} disabled={pendingAction === "save-user"}>{pendingAction === "save-user" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}Lưu</button></div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
