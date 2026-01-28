import React from 'react';
import { Course, LessonStatus } from '../types';
import { Book, CheckCircle, PlayCircle, Users, ChevronRight, Edit, Lock, List, GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CourseCardProps {
  course: Course;
  isAdmin?: boolean;
  onEdit?: (course: Course) => void;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, isAdmin, onEdit }) => {
  const percentage = course.totalLessons > 0 
    ? Math.round((course.completedLessons / course.totalLessons) * 100) 
    : 0;

  // Preview first 3 lessons
  const previewLessons = course.lessons && course.lessons.length > 0 
    ? course.lessons.slice(0, 3) 
    : [];

  return (
    <div className="group bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl hover:border-indigo-300 transition-all duration-300 flex flex-col h-full relative">
      
      {/* 1. Image Section */}
      <div className="relative w-full aspect-video overflow-hidden bg-slate-100">
        <img 
          src={course.thumbnail} 
          alt={course.title} 
          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x225?text=No+Image';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-90" />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
            <span className="bg-white/20 backdrop-blur-md text-white border border-white/30 text-[10px] font-bold px-2 py-1 rounded-full shadow-sm flex items-center gap-1">
                <GraduationCap size={12} /> Khối {course.grade || 12}
            </span>
        </div>

        {/* Stats on Image */}
        <div className="absolute bottom-3 left-3 right-3 text-white flex justify-between items-end">
            <div>
                 <h3 className="text-white font-bold text-lg leading-tight line-clamp-2 drop-shadow-md mb-1">{course.title}</h3>
                 <div className="flex items-center gap-3 text-xs font-medium text-slate-200">
                    <span className="flex items-center gap-1">
                        <Users size={12} /> {course.studentsCount || 0}
                    </span>
                    <span className="flex items-center gap-1">
                        <Book size={12} /> {course.totalLessons} bài
                    </span>
                </div>
            </div>
        </div>

        {/* Edit Button for Admin */}
        {isAdmin && onEdit && (
            <button 
                onClick={(e) => {
                    e.preventDefault();
                    onEdit(course);
                }}
                className="absolute top-3 right-3 bg-white/90 hover:bg-white text-slate-700 p-2 rounded-full shadow-lg hover:text-indigo-600 transition-all z-20" 
                title="Chỉnh sửa thông tin"
            >
                <Edit size={16} />
            </button>
        )}
      </div>
      
      {/* 2. Content Body */}
      <div className="p-4 flex-1 flex flex-col">
        <p className="text-slate-500 text-xs mb-4 line-clamp-2 h-8 leading-relaxed">
          {course.description}
        </p>
        
        {/* Lesson Preview Accordion-like */}
        <div className="mt-auto mb-4 bg-slate-50 rounded-xl p-3 border border-slate-100">
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase mb-2">
                <List size={10} /> Nội dung khóa học
            </div>
            {previewLessons.length > 0 ? (
                <div className="space-y-2">
                    {previewLessons.map((lesson, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-slate-700 group/item">
                            <div className={`w-1.5 h-1.5 rounded-full ${lesson.status === LessonStatus.COMPLETED ? 'bg-green-500' : 'bg-slate-300'}`} />
                            <span className="truncate flex-1 group-hover/item:text-indigo-600 transition-colors">{lesson.title}</span>
                            {lesson.status === LessonStatus.LOCKED && <Lock size={10} className="text-slate-400"/>}
                        </div>
                    ))}
                    {course.totalLessons > 3 && (
                        <div className="text-[10px] text-indigo-600 font-bold pl-3.5 pt-1">
                            + {course.totalLessons - 3} bài học khác
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-xs text-slate-400 italic py-1">Đang cập nhật nội dung...</div>
            )}
        </div>

        {/* 3. Action Footer */}
        <div className="space-y-3">
          {percentage > 0 && !isAdmin && (
            <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold text-slate-500">
                <span>Tiến độ</span>
                <span className="text-indigo-600">{percentage}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1">
                <div 
                    className="bg-indigo-600 h-1 rounded-full transition-all duration-500" 
                    style={{ width: `${percentage}%` }}
                />
                </div>
            </div>
          )}
          
          <Link 
            to={isAdmin ? `/admin/courses` : `/course/${course.id}`} 
            className={`
                w-full py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm
                ${isAdmin
                    ? 'bg-slate-800 text-white hover:bg-slate-900'
                    : percentage === 100 
                        ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200' 
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
                }
            `}
          >
             {isAdmin ? (
                 <>Quản lý nội dung <List size={16}/></>
             ) : percentage === 100 ? (
               <>Đã hoàn thành <CheckCircle size={16} /></>
             ) : percentage > 0 ? (
               <>Tiếp tục học <PlayCircle size={16} /></>
             ) : (
               <>Bắt đầu ngay <ChevronRight size={16} /></>
             )}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;