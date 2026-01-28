import React, { useState, useEffect } from 'react';
import { Course, User, UserRole } from '../types';
import { backend } from '../services/mockBackend';
import { Loader2, Search, BookOpen, Layers, GraduationCap, X, Save, Image as ImageIcon, Sparkles } from 'lucide-react';
import CourseCard from './CourseCard';

interface CourseListProps {
  user?: User | null;
}

const CourseList: React.FC<CourseListProps> = ({ user }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGrade, setActiveGrade] = useState<number>(12); // Default Grade 12
  const [searchTerm, setSearchTerm] = useState('');

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', thumbnail: '', grade: 12 });

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = () => {
    backend.getCourses().then(data => {
        const enhancedCourses = data.map(c => ({
            ...c,
            lessons: c.lessons && c.lessons.length > 0 ? c.lessons : [] 
        }));
        setCourses(enhancedCourses);
    }).finally(() => setLoading(false));
  };

  const handleEditClick = (course: Course) => {
      setEditingCourse(course);
      setEditForm({
          title: course.title,
          description: course.description,
          thumbnail: course.thumbnail,
          grade: course.grade || 12
      });
      setIsEditModalOpen(true);
  };

  const handleSaveCourse = async () => {
      if (!editingCourse) return;
      
      await backend.updateCourse(editingCourse.id, {
          title: editForm.title,
          description: editForm.description,
          thumbnail: editForm.thumbnail,
          grade: editForm.grade
      });
      
      // Update local state to reflect changes immediately
      setCourses(prev => prev.map(c => c.id === editingCourse.id ? { ...c, ...editForm } : c));
      setIsEditModalOpen(false);
      setEditingCourse(null);
  };

  // Filter Logic
  const filteredCourses = courses.filter(course => {
      const matchGrade = course.grade === activeGrade;
      const matchSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase());
      return matchGrade && matchSearch;
  });

  const stats = {
      total: courses.length,
      grade12: courses.filter(c => c.grade === 12).length,
      grade11: courses.filter(c => c.grade === 11).length,
      grade10: courses.filter(c => c.grade === 10).length,
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-indigo-600" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header Section */}
      <div className="relative bg-gradient-to-r from-indigo-600 to-purple-700 rounded-3xl p-8 text-white overflow-hidden shadow-xl">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-6">
              <div>
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm w-fit px-3 py-1 rounded-full text-xs font-bold mb-3 border border-white/20">
                    <Sparkles size={12} className="text-yellow-300" /> Hệ thống ôn luyện toàn diện
                </div>
                <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
                    Thư viện Khóa học
                </h1>
                <p className="text-indigo-100 text-lg max-w-2xl">
                    Hệ thống kiến thức Kinh tế & Pháp luật bám sát chương trình GDPT 2018. Chọn khối lớp để bắt đầu.
                </p>
              </div>
              
              <div className="flex items-center gap-4 bg-white/10 p-2 rounded-2xl backdrop-blur-sm border border-white/10">
                  <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60" size={20} />
                      <input 
                        type="text" 
                        placeholder="Tìm chủ đề..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2.5 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:bg-black/30 text-white placeholder:text-white/50 w-64 transition-all"
                      />
                  </div>
              </div>
          </div>
      </div>

      {/* Grade Tabs & Stats */}
      <div className="flex flex-col space-y-6">
          <div className="flex flex-wrap gap-4 items-center">
              <div className="flex p-1 bg-white border border-slate-200 rounded-xl shadow-sm">
                  {[12, 11, 10].map((grade) => (
                      <button
                        key={grade}
                        onClick={() => setActiveGrade(grade)}
                        className={`
                            px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all duration-300
                            ${activeGrade === grade 
                                ? 'bg-indigo-600 text-white shadow-md' 
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}
                        `}
                      >
                          <GraduationCap size={16} />
                          Khối {grade}
                          <span className={`ml-1 text-[10px] py-0.5 px-1.5 rounded-full ${activeGrade === grade ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                              {grade === 12 ? stats.grade12 : grade === 11 ? stats.grade11 : stats.grade10}
                          </span>
                      </button>
                  ))}
              </div>
              <div className="hidden md:flex items-center gap-2 text-sm text-slate-500 ml-auto">
                   <Layers size={16} /> Tổng số: <span className="font-bold text-slate-900">{stats.total} chủ đề</span>
              </div>
          </div>

          {/* Grid Content */}
          {filteredCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredCourses.map(course => (
                  <CourseCard 
                    key={course.id} 
                    course={course} 
                    isAdmin={user?.role === UserRole.ADMIN}
                    onEdit={handleEditClick}
                  />
                ))}
              </div>
          ) : (
              <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300 shadow-sm">
                  <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                     <Layers size={32} className="text-slate-300" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-600">Không tìm thấy khóa học nào</h3>
                  <p className="text-slate-400 text-sm mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
                  {user?.role === UserRole.ADMIN && (
                      <button className="mt-4 text-indigo-600 font-bold hover:underline">
                          + Thêm khóa học mới
                      </button>
                  )}
              </div>
          )}
      </div>

      {/* Quick Edit Modal */}
      {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <h3 className="font-bold text-slate-800">Chỉnh sửa thông tin</h3>
                      <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                  </div>
                  <div className="p-6 space-y-4">
                      {/* Thumbnail Preview */}
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-100 border border-slate-200 group">
                          <img src={editForm.thumbnail} className="w-full h-full object-cover" onError={(e) => (e.target as HTMLImageElement).src='https://via.placeholder.com/400x225'} alt=""/>
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <p className="text-white text-xs font-bold"><ImageIcon className="mx-auto mb-1"/> Thay đổi link ảnh bên dưới</p>
                          </div>
                      </div>

                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tên khóa học</label>
                          <input 
                              value={editForm.title}
                              onChange={e => setEditForm({...editForm, title: e.target.value})}
                              className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-800"
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mô tả ngắn</label>
                          <textarea 
                              value={editForm.description}
                              onChange={e => setEditForm({...editForm, description: e.target.value})}
                              className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none text-sm h-20 resize-none"
                          />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Link Ảnh bìa</label>
                              <input 
                                  value={editForm.thumbnail}
                                  onChange={e => setEditForm({...editForm, thumbnail: e.target.value})}
                                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Khối lớp</label>
                              <select 
                                  value={editForm.grade}
                                  onChange={e => setEditForm({...editForm, grade: Number(e.target.value)})}
                                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                              >
                                  <option value={10}>Khối 10</option>
                                  <option value={11}>Khối 11</option>
                                  <option value={12}>Khối 12</option>
                              </select>
                          </div>
                      </div>
                  </div>
                  <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                      <button onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-bold">Hủy</button>
                      <button onClick={handleSaveCourse} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center gap-2">
                          <Save size={16} /> Lưu thay đổi
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default CourseList;