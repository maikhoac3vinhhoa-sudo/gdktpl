
import React, { useEffect, useState } from 'react';
import { UserRole } from '../types';
import type { Post, User } from '../types';
import { backend } from '../services/mockBackend';
import { MessageCircle, Heart, Share2, MoreHorizontal, Image, Send, Check, Award, TrendingUp, Search, Loader2, BookOpen } from 'lucide-react';

interface CommunityProps {
  currentUser: User;
}

const Community: React.FC<CommunityProps> = ({ currentUser }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create Post State
  const [newContent, setNewContent] = useState('');
  const [newTags, setNewTags] = useState('');
  const [postImage, setPostImage] = useState<string | undefined>(undefined);
  const [isPosting, setIsPosting] = useState(false);

  // Comment State
  const [commentInput, setCommentInput] = useState<Record<string, string>>({});

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    const data = await backend.getCommunityPosts();
    setPosts(data);
    setLoading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      try {
          const base64 = await backend.uploadImage(file);
          setPostImage(base64);
      } catch (err: any) {
          alert(err.message || "Lỗi tải ảnh");
      }
  };

  const handleCreatePost = async () => {
    if (!newContent.trim()) return;
    setIsPosting(true);
    const tags = newTags.split(',').map(t => t.trim()).filter(t => t.startsWith('#'));
    
    // Pass the real base64 image here
    await backend.createPost(newContent, postImage, tags);
    
    setNewContent('');
    setNewTags('');
    setPostImage(undefined);
    await loadPosts();
    setIsPosting(false);
  };

  const handleLike = async (postId: string) => {
    await backend.toggleLikePost(postId);
    // Optimistic update
    setPosts(posts.map(p => {
        if (p.id === postId) {
            return {
                ...p,
                likes: p.isLikedByCurrentUser ? p.likes - 1 : p.likes + 1,
                isLikedByCurrentUser: !p.isLikedByCurrentUser
            };
        }
        return p;
    }));
  };

  const handleSubmitComment = async (postId: string) => {
    const content = commentInput[postId];
    if (!content?.trim()) return;
    
    await backend.addComment(postId, content);
    setCommentInput({ ...commentInput, [postId]: '' });
    await loadPosts(); // Refresh to see new comment
  };

  const handleToggleAccept = async (postId: string, commentId: string) => {
      if (currentUser.role !== UserRole.ADMIN) return;
      await backend.toggleAcceptedComment(postId, commentId);
      await loadPosts();
  }

  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000); // seconds

    if (diff < 60) return 'Vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    return `${Math.floor(diff / 86400)} ngày trước`;
  };

  if (loading) return <div className="text-center p-8">Đang tải cộng đồng...</div>;

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* --- LEFT FEED (8/12) --- */}
      <div className="col-span-12 lg:col-span-8 space-y-6">
        
        {/* Create Post Box */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div className="flex gap-3 mb-3">
                <img src={currentUser.avatar} alt="Me" className="w-10 h-10 rounded-full object-cover" />
                <textarea 
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="flex-1 bg-slate-50 border-none rounded-xl p-3 focus:ring-2 focus:ring-indigo-200 resize-none outline-none"
                    placeholder="Bạn đang thắc mắc điều gì? Hãy hỏi cộng đồng nhé..."
                    rows={2}
                />
            </div>
            {postImage && (
                <div className="relative mb-3 ml-14 group max-w-sm">
                    <img src={postImage} alt="Preview" className="rounded-lg max-h-48 border border-slate-200"/>
                    <button 
                        onClick={() => setPostImage(undefined)}
                        className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-red-500"
                    >
                        <Loader2 size={16} className="hidden"/> {/* Dummy ref */}
                        X
                    </button>
                </div>
            )}
            <div className="flex justify-between items-center pl-14">
                <div className="flex gap-2">
                    <label className="p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors cursor-pointer" title="Thêm ảnh">
                        <Image size={20} />
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                    <input 
                        value={newTags}
                        onChange={e => setNewTags(e.target.value)}
                        className="text-sm border-b border-slate-200 bg-transparent outline-none py-1 w-48 text-indigo-600 placeholder:text-slate-400" 
                        placeholder="#Tag (VD: #chude1, #cauhoi)" 
                    />
                </div>
                <button 
                    onClick={handleCreatePost}
                    disabled={!newContent.trim() || isPosting}
                    className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 transition-all"
                >
                    <Send size={16} /> {isPosting ? 'Đang đăng...' : 'Đăng bài'}
                </button>
            </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center justify-between">
            <div className="flex gap-2">
                <button className="px-3 py-1 bg-white border border-slate-200 rounded-full text-sm font-bold text-indigo-600 shadow-sm">Mới nhất</button>
                <button className="px-3 py-1 bg-transparent text-slate-500 hover:bg-white hover:shadow-sm rounded-full text-sm font-medium transition-all">Sôi nổi nhất</button>
                <button className="px-3 py-1 bg-transparent text-slate-500 hover:bg-white hover:shadow-sm rounded-full text-sm font-medium transition-all">Chưa giải đáp</button>
            </div>
        </div>

        {/* Posts List */}
        <div className="space-y-6">
            {posts.map(post => (
                <div key={post.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Post Header */}
                    <div className="p-4 flex items-start justify-between">
                        <div className="flex gap-3">
                            <img src={post.author.avatar} alt={post.author.name} className="w-10 h-10 rounded-full border border-slate-100 object-cover" />
                            <div>
                                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                    {post.author.name}
                                    {post.author.role === 'ADMIN' && (
                                        <span title="Giáo viên">
                                            <Award size={14} className="text-blue-500" />
                                        </span>
                                    )}
                                </h4>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <span>{getTimeAgo(post.createdAt)}</span>
                                    {post.context && (
                                        <>
                                            <span>•</span>
                                            <span className="bg-slate-100 text-slate-600 px-1.5 rounded flex items-center gap-1">
                                                <BookOpen size={10} /> {post.context.title}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        <button className="text-slate-400 hover:text-slate-600"><MoreHorizontal size={20}/></button>
                    </div>

                    {/* Post Content */}
                    <div className="px-4 pb-2">
                        <p className="text-slate-800 whitespace-pre-line mb-3">{post.content}</p>
                        {post.tags.length > 0 && (
                            <div className="flex gap-2 mb-3">
                                {post.tags.map((tag, i) => <span key={i} className="text-indigo-600 text-sm hover:underline cursor-pointer">{tag}</span>)}
                            </div>
                        )}
                        {post.imageUrl && (
                            <div className="rounded-lg overflow-hidden border border-slate-100 mb-2 bg-slate-50">
                                <img src={post.imageUrl} alt="Content" className="w-full object-contain max-h-[500px]" />
                            </div>
                        )}
                    </div>

                    {/* Stats & Actions */}
                    <div className="px-4 py-2 border-t border-slate-50 flex items-center justify-between text-slate-500 text-sm">
                        <div className="flex items-center gap-1">
                            {post.likes > 0 && (
                                <>
                                    <div className="bg-blue-500 rounded-full p-1"><Heart size={10} className="text-white fill-white"/></div>
                                    <span>{post.likes}</span>
                                </>
                            )}
                        </div>
                        <div className="flex gap-3">
                             <span>{post.comments.length} bình luận</span>
                        </div>
                    </div>

                    <div className="px-2 py-1 border-t border-slate-100 grid grid-cols-3 gap-1">
                        <button 
                            onClick={() => handleLike(post.id)}
                            className={`flex items-center justify-center gap-2 py-2 rounded-lg transition-colors font-medium text-sm ${post.isLikedByCurrentUser ? 'text-pink-600 bg-pink-50' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            <Heart size={18} className={post.isLikedByCurrentUser ? "fill-pink-600" : ""} /> Thích
                        </button>
                        <button className="flex items-center justify-center gap-2 py-2 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors font-medium text-sm">
                            <MessageCircle size={18} /> Bình luận
                        </button>
                        <button className="flex items-center justify-center gap-2 py-2 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors font-medium text-sm">
                            <Share2 size={18} /> Chia sẻ
                        </button>
                    </div>

                    {/* Comments Section */}
                    {post.comments.length > 0 && (
                        <div className="bg-slate-50 px-4 py-4 space-y-4 border-t border-slate-100">
                             {post.comments.map(comment => (
                                 <div key={comment.id} className={`flex gap-3 ${comment.isAccepted ? 'bg-green-50 p-3 rounded-lg border border-green-200' : ''}`}>
                                     <img src={comment.author.avatar} alt="" className="w-8 h-8 rounded-full flex-shrink-0 object-cover" />
                                     <div className="flex-1">
                                         <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 inline-block min-w-[200px]">
                                             <div className="flex items-center gap-2 mb-1">
                                                 <span className="font-bold text-xs text-slate-900">{comment.author.name}</span>
                                                 {comment.isAccepted && (
                                                     <span className="flex items-center gap-0.5 text-[10px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full border border-green-200">
                                                         <Check size={10} /> CHUẨN
                                                     </span>
                                                 )}
                                             </div>
                                             <p className="text-sm text-slate-800">{comment.content}</p>
                                         </div>
                                         <div className="flex items-center gap-4 mt-1 ml-2 text-xs text-slate-500 font-medium">
                                             <span>{getTimeAgo(comment.createdAt)}</span>
                                             <button className="hover:text-indigo-600">Thích</button>
                                             {currentUser.role === UserRole.ADMIN && (
                                                 <button 
                                                    onClick={() => handleToggleAccept(post.id, comment.id)} 
                                                    className={`${comment.isAccepted ? 'text-green-600' : 'hover:text-green-600'}`}
                                                 >
                                                     {comment.isAccepted ? 'Bỏ xác nhận' : 'Xác nhận đúng'}
                                                 </button>
                                             )}
                                         </div>
                                     </div>
                                 </div>
                             ))}
                        </div>
                    )}
                    
                    {/* Add Comment Input */}
                    <div className="p-3 border-t border-slate-100 flex gap-2 items-center bg-slate-50">
                        <img src={currentUser.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                        <div className="flex-1 relative">
                            <input 
                                type="text" 
                                value={commentInput[post.id] || ''}
                                onChange={(e) => setCommentInput({ ...commentInput, [post.id]: e.target.value })}
                                onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment(post.id)}
                                className="w-full bg-white border border-slate-200 rounded-full py-2 px-4 pr-10 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all"
                                placeholder="Viết bình luận..."
                            />
                            <button 
                                onClick={() => handleSubmitComment(post.id)}
                                className="absolute right-2 top-1.5 text-indigo-600 hover:bg-indigo-50 p-1 rounded-full"
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* --- RIGHT SIDEBAR (4/12) --- */}
      <div className="hidden lg:block lg:col-span-4 space-y-6">
          {/* Search */}
          <div className="bg-white rounded-xl shadow-sm p-2 border border-slate-200 flex items-center gap-2">
             <Search size={20} className="text-slate-400 ml-2"/>
             <input type="text" className="w-full p-2 outline-none text-sm" placeholder="Tìm kiếm thảo luận..." />
          </div>

          {/* Gamification: Leaderboard */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="p-4 border-b border-slate-100 flex items-center gap-2">
                 <Award className="text-yellow-500" />
                 <h3 className="font-bold text-slate-800">Bảng vàng tích cực</h3>
             </div>
             <div className="p-2">
                 {[1,2,3].map(i => (
                     <div key={i} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                         <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${i===1?'bg-yellow-400':i===2?'bg-slate-300':'bg-orange-300'}`}>{i}</div>
                         <img src={`https://ui-avatars.com/api/?name=User+${i}&background=random`} className="w-8 h-8 rounded-full" alt="" />
                         <div className="flex-1">
                             <p className="text-sm font-bold text-slate-800">Học sinh {i}</p>
                             <p className="text-xs text-slate-500">1.2k điểm uy tín</p>
                         </div>
                     </div>
                 ))}
             </div>
             <div className="p-3 text-center border-t border-slate-50">
                 <button className="text-xs font-bold text-indigo-600 hover:underline">Xem tất cả</button>
             </div>
          </div>

           {/* Trending Tags */}
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="p-4 border-b border-slate-100 flex items-center gap-2">
                 <TrendingUp className="text-pink-500" />
                 <h3 className="font-bold text-slate-800">Chủ đề nóng</h3>
             </div>
             <div className="p-4 flex flex-wrap gap-2">
                 {['#dethithu', '#kinhtehoc', '#chude1', '#cauhoi', '#giai_dap_nhanh', '#onthi2025'].map(tag => (
                     <span key={tag} className="bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 transition-colors text-slate-600 text-xs font-medium px-3 py-1.5 rounded-full cursor-pointer">
                         {tag}
                     </span>
                 ))}
             </div>
           </div>

           {/* Footer Info */}
           <div className="text-center text-xs text-slate-400 px-4">
               <p>© 2025 EduGDKTPL Community</p>
               <p>Nội quy cộng đồng • Chính sách riêng tư</p>
           </div>
      </div>
    </div>
  );
};

export default Community;
