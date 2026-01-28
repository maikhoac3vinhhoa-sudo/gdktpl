
import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';
import type { User, Course, Post } from '../types';
import { backend } from '../services/mockBackend';
import { Camera, Edit2, MapPin, Calendar, BookOpen, Award, MessageCircle, Clock, CheckCircle, Loader2 } from 'lucide-react';
import CourseCard from './CourseCard';

interface ProfileProps {
  user: User;
}

const Profile: React.FC<ProfileProps> = ({ user: initialUser }) => {
  const [user, setUser] = useState<User>(initialUser);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'COURSES' | 'ACTIVITY' | 'FORUM'>('OVERVIEW');
  const [activityData, setActivityData] = useState<{posts: Post[], courses: Course[], recentResults: any[]}>({ posts: [], courses: [], recentResults: [] });
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editBio, setEditBio] = useState(user.bio || '');

  useEffect(() => {
    // Fetch data related to user
    const loadData = async () => {
        const data = await backend.getUserActivityData(user.id);
        setActivityData(data);
        setLoading(false);
    };
    loadData();
  }, [user.id]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      setIsUploading(true);
      try {
          const base64 = await backend.uploadImage(file);
          const updated = await backend.updateUserProfile(user.id, { [type === 'avatar' ? 'avatar' : 'coverPhoto']: base64 });
          setUser(updated);
      } catch (err: any) {
          alert(err.message || "Lỗi tải ảnh");
      } finally {
          setIsUploading(false);
      }
  };

  const handleSaveBio = async () => {
      const updated = await backend.updateUserProfile(user.id, { bio: editBio });
      setUser(updated);
      setIsEditing(false);
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10 animate-in fade-in duration-500">
      
      {/* --- HEADER SECTION --- */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
        {/* Cover Photo */}
        <div className="h-48 md:h-64 bg-slate-200 relative group">
           {user.coverPhoto ? (
               <img src={user.coverPhoto} alt="Cover" className="w-full h-full object-cover" />
           ) : (
               <div className="w-full h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
           )}
           <label className="absolute bottom-4 right-4 bg-black/50 hover:bg-black/70 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
             {isUploading ? <Loader2 size={16} className="animate-spin"/> : <Camera size={16} />} 
             {isUploading ? 'Đang tải...' : 'Chỉnh sửa ảnh bìa'}
             <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'cover')} disabled={isUploading}/>
           </label>
        </div>

        {/* Profile Bar */}
        <div className="px-6 pb-6 pt-16 md:pt-4 relative flex flex-col md:flex-row items-center md:items-end gap-4 md:pl-44">
           {/* Avatar */}
           <div className="absolute -top-16 md:-top-16 left-1/2 -translate-x-1/2 md:left-8 md:translate-x-0 group">
               <div className="w-32 h-32 rounded-full border-4 border-white shadow-md overflow-hidden bg-white">
                   <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
               </div>
               <label 
                  className="absolute bottom-1 right-1 bg-slate-100 p-2 rounded-full text-slate-700 hover:bg-slate-200 shadow-sm border border-slate-300 cursor-pointer"
                  title="Đổi ảnh đại diện"
               >
                   {isUploading ? <Loader2 size={16} className="animate-spin"/> : <Camera size={16} />}
                   <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'avatar')} disabled={isUploading}/>
               </label>
           </div>

           {/* Info */}
           <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl font-bold text-slate-900 flex items-center justify-center md:justify-start gap-2">
                  {user.name}
                  {user.role === UserRole.ADMIN && (
                      <span title="Giáo viên đã xác minh">
                        <Award size={20} className="text-blue-500" />
                      </span>
                  )}
              </h1>
              <p className="text-slate-500 text-sm font-medium">
                  {user.role === UserRole.ADMIN ? 'Giáo viên bộ môn GD KT&PL' : `Học sinh lớp ${user.className}`}
              </p>
           </div>

           {/* Stats (Desktop) */}
           <div className="hidden md:flex gap-6 text-center pr-4">
               <div>
                   <span className="block font-bold text-slate-800 text-lg">12</span>
                   <span className="text-xs text-slate-500 uppercase">Khóa học</span>
               </div>
               <div>
                   <span className="block font-bold text-slate-800 text-lg">{activityData.posts.length}</span>
                   <span className="text-xs text-slate-500 uppercase">Bài viết</span>
               </div>
               <div>
                   <span className="block font-bold text-slate-800 text-lg">8.5</span>
                   <span className="text-xs text-slate-500 uppercase">Điểm TB</span>
               </div>
           </div>

           {/* Action */}
           <div className="flex gap-2">
               {isEditing ? (
                   <div className="flex gap-2">
                       <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-slate-100 rounded-lg text-slate-600 font-medium text-sm">Hủy</button>
                       <button onClick={handleSaveBio} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium text-sm">Lưu</button>
                   </div>
               ) : (
                   <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium text-sm flex items-center gap-2">
                       <Edit2 size={16} /> Chỉnh sửa hồ sơ
                   </button>
               )}
           </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-t border-slate-100 px-6 overflow-x-auto">
           <div className="flex gap-6 min-w-max">
               {[
                   { id: 'OVERVIEW', label: 'Tổng quan', icon: <MapPin size={18}/> },
                   { id: 'COURSES', label: user.role === 'ADMIN' ? 'Khóa giảng dạy' : 'Khóa học', icon: <BookOpen size={18}/> },
                   { id: 'ACTIVITY', label: 'Hoạt động', icon: <Clock size={18}/> },
                   { id: 'FORUM', label: 'Diễn đàn', icon: <MessageCircle size={18}/> }
               ].map((tab) => (
                   <button
                     key={tab.id}
                     onClick={() => setActiveTab(tab.id as any)}
                     className={`flex items-center gap-2 py-4 text-sm font-semibold border-b-2 transition-colors ${
                         activeTab === tab.id 
                            ? 'border-indigo-600 text-indigo-600' 
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                     }`}
                   >
                       {tab.icon} {tab.label}
                   </button>
               ))}
           </div>
        </div>
      </div>

      {/* --- CONTENT SECTION --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Left Info Column */}
         <div className="space-y-6">
             <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                 <h3 className="font-bold text-slate-800 mb-3">Giới thiệu</h3>
                 {isEditing ? (
                     <textarea 
                        value={editBio} 
                        onChange={(e) => setEditBio(e.target.value)} 
                        className="w-full border rounded-lg p-2 text-sm h-24"
                        placeholder="Viết đôi dòng về bạn..."
                     />
                 ) : (
                     <p className="text-slate-600 text-sm leading-relaxed">
                         {user.bio || 'Chưa có thông tin giới thiệu.'}
                     </p>
                 )}
                 <div className="mt-4 space-y-2">
                     <div className="flex items-center gap-2 text-sm text-slate-500">
                         <MapPin size={16} /> 
                         <span>Đến từ <strong>Hà Nội</strong></span>
                     </div>
                     <div className="flex items-center gap-2 text-sm text-slate-500">
                         <Calendar size={16} /> 
                         <span>Tham gia từ <strong>09/2023</strong></span>
                     </div>
                 </div>
             </div>

             <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                 <h3 className="font-bold text-slate-800 mb-3">Huy hiệu đạt được</h3>
                 <div className="flex flex-wrap gap-2">
                     {['Học sinh tích cực', 'Thánh giải đố', 'Chăm chỉ'].map(badge => (
                         <span key={badge} className="px-3 py-1 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-full text-xs font-bold flex items-center gap-1">
                             <Award size={12} /> {badge}
                         </span>
                     ))}
                 </div>
             </div>
         </div>

         {/* Main Content Column */}
         <div className="lg:col-span-2 space-y-6">
             {loading ? <div className="text-center py-10">Đang tải dữ liệu...</div> : (
                 <>
                    {activeTab === 'OVERVIEW' && (
                        <div className="space-y-6">
                            {/* Featured Stats */}
                             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                 <h3 className="font-bold text-slate-800 mb-4">Thống kê học tập</h3>
                                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                     <div className="bg-blue-50 p-4 rounded-xl text-center">
                                         <h4 className="text-2xl font-bold text-blue-600">54h</h4>
                                         <span className="text-xs text-blue-600 font-medium">Giờ học</span>
                                     </div>
                                     <div className="bg-green-50 p-4 rounded-xl text-center">
                                         <h4 className="text-2xl font-bold text-green-600">92%</h4>
                                         <span className="text-xs text-green-600 font-medium">Chuyên cần</span>
                                     </div>
                                     <div className="bg-purple-50 p-4 rounded-xl text-center">
                                         <h4 className="text-2xl font-bold text-purple-600">15</h4>
                                         <span className="text-xs text-purple-600 font-medium">Bài kiểm tra</span>
                                     </div>
                                     <div className="bg-orange-50 p-4 rounded-xl text-center">
                                         <h4 className="text-2xl font-bold text-orange-600">Top 5</h4>
                                         <span className="text-xs text-orange-600 font-medium">Xếp hạng</span>
                                     </div>
                                 </div>
                             </div>

                             {/* Recent Activity */}
                             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                 <h3 className="font-bold text-slate-800 mb-4">Hoạt động gần đây</h3>
                                 <div className="space-y-4">
                                     {activityData.recentResults.map((item, idx) => (
                                         <div key={idx} className="flex gap-4 items-start pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                                             <div className="bg-indigo-100 text-indigo-600 p-2 rounded-lg">
                                                 <CheckCircle size={20} />
                                             </div>
                                             <div>
                                                 <p className="text-slate-800 font-medium">Đã hoàn thành <span className="text-indigo-600 font-bold">{item.examTitle}</span></p>
                                                 <p className="text-sm text-slate-500">Đạt điểm: {item.score}/10 • {new Date(item.date).toLocaleDateString('vi-VN')}</p>
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                             </div>
                        </div>
                    )}

                    {activeTab === 'COURSES' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {activityData.courses.length > 0 ? (
                                activityData.courses.map(course => <CourseCard key={course.id} course={course} />)
                            ) : (
                                <p className="col-span-2 text-center text-slate-500 py-10">Chưa tham gia khóa học nào.</p>
                            )}
                        </div>
                    )}

                    {activeTab === 'FORUM' && (
                        <div className="space-y-4">
                             {activityData.posts.length > 0 ? (
                                 activityData.posts.map(post => (
                                     <div key={post.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                                         <div className="flex justify-between text-sm text-slate-500 mb-2">
                                             <span>Đăng vào: {new Date(post.createdAt).toLocaleDateString('vi-VN')}</span>
                                             <span>{post.comments.length} bình luận</span>
                                         </div>
                                         <h4 className="font-medium text-slate-900 mb-2">{post.content}</h4>
                                         {post.tags.length > 0 && <div className="flex gap-2">{post.tags.map(t => <span key={t} className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">{t}</span>)}</div>}
                                     </div>
                                 ))
                             ) : (
                                 <div className="text-center py-10 bg-white rounded-xl border border-slate-200 text-slate-500">
                                     <MessageCircle size={40} className="mx-auto mb-2 opacity-20"/>
                                     <p>Chưa có bài viết nào trên diễn đàn.</p>
                                 </div>
                             )}
                        </div>
                    )}

                    {activeTab === 'ACTIVITY' && (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h3 className="font-bold text-slate-800 mb-4">Lịch sử chi tiết</h3>
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="p-3">Hoạt động</th>
                                        <th className="p-3">Thời gian</th>
                                        <th className="p-3 text-right">Kết quả</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activityData.recentResults.map((item, idx) => (
                                        <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50">
                                            <td className="p-3 font-medium text-slate-700">{item.examTitle}</td>
                                            <td className="p-3 text-slate-500">{new Date(item.date).toLocaleString('vi-VN')}</td>
                                            <td className="p-3 text-right font-bold text-indigo-600">{item.score}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                 </>
             )}
         </div>
      </div>
    </div>
  );
};

export default Profile;
