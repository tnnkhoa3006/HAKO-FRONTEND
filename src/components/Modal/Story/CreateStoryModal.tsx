import React, { useState, useRef, ChangeEvent, useEffect, useCallback } from "react";
import { X, Plus, Send, Music, Search, Check } from "lucide-react";
import { createStory, getMusicList } from "@/server/story";
import { useAppDispatch } from "@/store/hooks";
import { fetchStoryHome } from "@/store/story";
import { createPortal } from "react-dom";
import Image from "next/image";

interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MusicTrack {
  _id: string;
  nameMusic: string;
  author: string;
  image: string;
  media: string;
  duration?: number;
}

export default function CreateStoryModal({ isOpen, onClose }: CreateStoryModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [caption, setCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isMusicMenuOpen, setIsMusicMenuOpen] = useState(false);
  const [musicList, setMusicList] = useState<MusicTrack[]>([]);
  const [selectedMusic, setSelectedMusic] = useState<MusicTrack | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingMusic, setIsLoadingMusic] = useState(false);
  const audioPreviewRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dispatch = useAppDispatch();

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const fetchMusic = useCallback(async () => {
    try {
      setIsLoadingMusic(true);
      const music = await getMusicList();
      setMusicList(music || []);
    } catch (err) {
      console.error("Lỗi khi tải danh sách nhạc:", err);
    } finally {
      setIsLoadingMusic(false);
    }
  }, []);

  useEffect(() => {
    if (isMusicMenuOpen && musicList.length === 0) {
      fetchMusic();
    }
  }, [isMusicMenuOpen, musicList.length, fetchMusic]);

  if (!isOpen || !mounted) return null;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const type = selectedFile.type.startsWith("image/") ? "image" : selectedFile.type.startsWith("video/") ? "video" : null;
    
    if (!type) {
      setError("Chỉ hỗ trợ định dạng ảnh hoặc video.");
      return;
    }

    setFile(selectedFile);
    setMediaType(type);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setError(null);
  };

  const clearSelection = () => {
    setFile(null);
    setPreviewUrl(null);
    setMediaType(null);
    setSelectedMusic(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    clearSelection();
    setCaption("");
    setError(null);
    setIsMusicMenuOpen(false);
    onClose();
  };

  const handleSubmit = async () => {
    if (!file) return;

    try {
      setIsUploading(true);
      setError(null);
      
      const formData = new FormData();
      formData.append("media", file);
      if (caption) formData.append("caption", caption);
      if (selectedMusic) formData.append("musicId", selectedMusic._id);

      await createStory(formData);
      
      // Refresh stories list
      dispatch(fetchStoryHome());
      
      handleClose();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Đã xảy ra lỗi khi tạo story.";
      setError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const toggleMusic = (track: MusicTrack) => {
    if (selectedMusic?._id === track._id) {
      setSelectedMusic(null);
    } else {
      setSelectedMusic(track);
    }
  };

  const filteredMusic = musicList.filter(track => 
    track.nameMusic.toLowerCase().includes(searchQuery.toLowerCase()) ||
    track.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <input 
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*,video/*"
        className="hidden"
      />
      <div 
        className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-[420px] max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            {(previewUrl || isMusicMenuOpen) && (
              <button 
                onClick={() => isMusicMenuOpen ? setIsMusicMenuOpen(false) : clearSelection()}
                className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-all"
                title="Quay lại"
              >
                <X className="w-6 h-6 rotate-90" />
              </button>
            )}
            <h3 className="text-white font-bold text-lg">
              {isMusicMenuOpen ? "Chọn nhạc" : previewUrl ? "Xem trước tin" : "Tạo tin mới"}
            </h3>
          </div>
          <button 
            onClick={handleClose}
            className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        {!isMusicMenuOpen ? (
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <div className="flex flex-col items-center min-h-full">
              {!previewUrl ? (
                <div 
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  className="w-full aspect-[9/16] border-2 border-dashed border-zinc-700 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-500/5 transition-all group my-auto"
                >
                  <div className="p-4 bg-zinc-800 rounded-full mb-4 group-hover:scale-110 group-hover:bg-blue-500/20 transition-all duration-300">
                    <Plus className="w-8 h-8 text-blue-500" />
                  </div>
                  <p className="text-zinc-300 font-semibold text-center px-4">Tải ảnh hoặc video lên</p>
                  <p className="text-zinc-500 text-sm mt-2 text-center px-8">
                    Kéo thả hoặc nhấn để chọn
                  </p>
                </div>
              ) : (
                <>
                  <div className="w-full relative rounded-2xl overflow-hidden bg-black flex items-center justify-center aspect-[9/16] shadow-2xl ring-1 ring-zinc-800">
                    {mediaType === "image" ? (
                      <Image 
                        src={previewUrl} 
                        alt="Preview" 
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <video 
                        src={previewUrl} 
                        controls 
                        className="w-full h-full object-contain"
                      />
                    )}
                    
                    {/* Music Indicator Overlay */}
                    {selectedMusic && (
                      <div className="absolute top-4 left-4 right-16 flex items-center gap-3 p-3 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 animate-in slide-in-from-left duration-300">
                        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 animate-pulse relative">
                          <Image src={selectedMusic.image} alt={selectedMusic.nameMusic} fill className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-bold truncate">{selectedMusic.nameMusic}</p>
                          <p className="text-white/60 text-[10px] truncate">{selectedMusic.author}</p>
                        </div>
                        <div className="flex gap-0.5">
                          {[1,2,3].map(i => (
                            <div key={i} className={`w-0.5 bg-blue-500 rounded-full animate-music-bar-${i}`} style={{ height: '12px' }} />
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="absolute top-4 right-4 flex flex-col gap-2">
                      <button 
                        onClick={clearSelection}
                        className="p-2 bg-black/60 text-white rounded-full hover:bg-black/80 transition-all shadow-lg backdrop-blur-sm"
                      >
                        <X className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => setIsMusicMenuOpen(true)}
                        className={`p-2 rounded-full transition-all shadow-lg backdrop-blur-sm ${selectedMusic ? "bg-blue-600 text-white" : "bg-black/60 text-white hover:bg-black/80"}`}
                      >
                        <Music className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="w-full mt-6 space-y-4 pb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Mô tả câu chuyện</span>
                      {selectedMusic && (
                        <button 
                          onClick={() => setIsMusicMenuOpen(true)}
                          className="text-xs font-semibold text-blue-500 hover:text-blue-400 transition-colors flex items-center gap-1"
                        >
                          <Music className="w-3 h-3" /> Đổi nhạc
                        </button>
                      )}
                    </div>
                    <textarea
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      placeholder="Hãy viết gì đó về khoảnh khắc này..."
                      className="w-full bg-zinc-800/30 border border-zinc-800 rounded-xl p-4 text-white text-sm placeholder:text-zinc-600 focus:ring-2 focus:ring-blue-500 focus:bg-zinc-800 outline-none resize-none h-28 transition-all"
                    />
                  </div>
                </>
              )}

              {error && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl w-full">
                  <p className="text-red-500 text-xs text-center font-medium">{error}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 bg-zinc-950">
            <div className="p-4 pb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input 
                  autoFocus
                  type="text"
                  placeholder="Tìm kiếm bài hát hoặc nghệ sĩ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
              {isLoadingMusic ? (
                <div className="flex flex-col items-center justify-center h-48 gap-3">
                  <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                  <p className="text-zinc-500 text-sm">Đang tìm nhạc hay cho bạn...</p>
                </div>
              ) : filteredMusic.length > 0 ? (
                <div className="space-y-1">
                  {filteredMusic.map((track) => (
                    <button
                      key={track._id}
                      onClick={() => toggleMusic(track)}
                      className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all group ${
                        selectedMusic?._id === track._id ? "bg-blue-600/10" : "hover:bg-zinc-900"
                      }`}
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden relative flex-shrink-0">
                        <Image src={track.image} alt={track.nameMusic} fill className="object-cover" />
                        {selectedMusic?._id === track._id && (
                          <div className="absolute inset-0 bg-blue-600/40 flex items-center justify-center">
                            <Music className="w-5 h-5 text-white animate-bounce" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className={`text-sm font-bold truncate ${selectedMusic?._id === track._id ? "text-blue-500" : "text-white"}`}>
                          {track.nameMusic}
                        </p>
                        <p className="text-xs text-zinc-500 truncate">{track.author}</p>
                      </div>
                      {selectedMusic?._id === track._id && (
                        <div className="bg-blue-600 rounded-full p-1 shadow-lg">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-center px-8">
                  <Music className="w-10 h-10 text-zinc-800 mb-3" />
                  <p className="text-zinc-500 text-sm">Không tìm thấy bài hát nào phù hợp.</p>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-zinc-800 flex gap-3 bg-zinc-900/50 backdrop-blur-md">
              <button 
                onClick={() => setIsMusicMenuOpen(false)}
                className="flex-1 bg-zinc-800 text-white py-3 rounded-xl font-bold hover:bg-zinc-700 transition-all"
              >
                Xong
              </button>
            </div>
          </div>
        )}

        {/* Footer (Chỉ hiện ở view preview) */}
        {!isMusicMenuOpen && (
          <div className="p-4 border-t border-zinc-800 bg-zinc-900 sticky bottom-0 z-20">
            <button
              onClick={handleSubmit}
              disabled={!file || isUploading}
              className={`flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold transition-all w-full ${
                !file || isUploading 
                  ? "bg-zinc-800 text-zinc-600 cursor-not-allowed" 
                  : "bg-blue-600 text-white hover:bg-blue-500 active:scale-95 shadow-lg shadow-blue-600/20"
              }`}
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang đăng tin...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-white" />
                  Đăng lên tin của bạn
                </>
              )}
            </button>
          </div>
        )}
      </div>
      
      <audio 
        ref={audioPreviewRef} 
        src={selectedMusic?.media} 
        loop 
        className="hidden" 
        autoPlay={isOpen && !!selectedMusic}
      />

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #444;
        }

        @keyframes music-bar-1 { 0%, 100% { height: 4px; } 50% { height: 12px; } }
        @keyframes music-bar-2 { 0%, 100% { height: 12px; } 50% { height: 6px; } }
        @keyframes music-bar-3 { 0%, 100% { height: 8px; } 50% { height: 14px; } }
        .animate-music-bar-1 { animation: music-bar-1 0.6s ease-in-out infinite; }
        .animate-music-bar-2 { animation: music-bar-2 0.7s ease-in-out infinite; }
        .animate-music-bar-3 { animation: music-bar-3 0.8s ease-in-out infinite; }
      `}</style>
    </div>
  );

  return createPortal(modalContent, document.body);
}
