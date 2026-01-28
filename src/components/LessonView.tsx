import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Course, Lesson, LessonStatus } from '../types';
import { backend } from '../services/mockBackend';
import { ArrowLeft, Check, Video, BookOpen, BrainCircuit, Target, RefreshCw } from 'lucide-react';
import QuizTaker from './QuizTaker';

const LessonView: React.FC = () => {
  const { courseId } = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [activeLessonId, setActiveLessonId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'KNOWLEDGE' | 'QUIZ'>('KNOWLEDGE');
  
  const loadData = () => {
    if (courseId) {
        backend.getCourseById(courseId).then(c => {
            if (c) {
                setCourse(c); // This has course stats
                backend.getLessons(courseId).then(ls => {
                    setLessons(ls); // This has lesson status
                    if (!activeLessonId && ls.length > 0) setActiveLessonId(ls[0].id);
                });
            }
        });
    }
  };

  useEffect(() => {
    loadData();
  }, [courseId]);

  if (!course) return <div className="p-8 text-center">Đang tải khóa học...</div>;

  const activeLesson = lessons.find(l => l.id === activeLessonId);
  // Calculate progress based on Current State, not just course metadata (which might be slightly stale if not refreshed deeply)
  const progress = lessons.length > 0 
    ? Math.round((lessons.filter(l => l.status === LessonStatus.COMPLETED).length / lessons.length) * 100) 
    : 0;

  const handleLessonComplete = async (result: any) => {
      console.log("Completed Result:", result);
      
      // 1. Mark as completed in Backend (Persistence)
      if (courseId && activeLessonId) {
          await backend.markLessonAsCompleted(courseId, activeLessonId);
      }

      // 2. Update Local State to reflect immediately
      setLessons(prev => prev.map(l => l.id === activeLessonId ? {...l, status: LessonStatus.COMPLETED} : l));
      
      // 3. Reload everything to be sure
      loadData();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white z-10">
            <div className="flex items-center gap-4">
                <Link to="/courses" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-lg font-bold text-slate-900">{course.title}</h1>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-green-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                        </div>
                        <span className="font-medium text-slate-700">{progress}% Hoàn thành</span>
                    </div>
                </div>
            </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
            <div className="w-80 border-r border-slate-100 flex flex-col bg-slate-50 overflow-y-auto">
                <div className="p-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Nội dung khóa học</h3>
                    <div className="space-y-2">
                        {lessons.map((lesson, idx) => (
                            <button
                                key={lesson.id}
                                onClick={() => { setActiveLessonId(lesson.id); setActiveTab('KNOWLEDGE'); }}
                                className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all ${
                                    activeLessonId === lesson.id 
                                    ? 'bg-white shadow-sm border border-indigo-100' 
                                    : 'hover:bg-white hover:shadow-sm border border-transparent'
                                }`}
                            >
                                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 transition-colors ${
                                    lesson.status === LessonStatus.COMPLETED ? 'bg-green-100 text-green-600' :
                                    activeLessonId === lesson.id ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-500'
                                }`}>
                                    {lesson.status === LessonStatus.COMPLETED ? <Check size={14}/> : idx + 1}
                                </div>
                                <div>
                                    <p className={`text-sm font-medium ${activeLessonId === lesson.id ? 'text-indigo-900' : 'text-slate-700'}`}>
                                        {lesson.title}
                                    </p>
                                    <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
                                        <Video size={10} /> Video bài giảng
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden relative">
                {activeLesson ? (
                    <>
                        <div className="flex border-b border-slate-100 bg-white">
                            <button 
                                onClick={() => setActiveTab('KNOWLEDGE')}
                                className={`flex-1 py-4 text-sm font-bold text-center border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'KNOWLEDGE' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                            >
                                <BookOpen size={18} /> Hệ thống kiến thức
                            </button>
                            <button 
                                onClick={() => setActiveTab('QUIZ')}
                                className={`flex-1 py-4 text-sm font-bold text-center border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'QUIZ' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                            >
                                <BrainCircuit size={18} /> Bài tập trắc nghiệm
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            <div className="max-w-4xl mx-auto">
                                {activeTab === 'KNOWLEDGE' ? (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        
                                        {/* Objectives Section */}
                                        {activeLesson.objectives && (
                                            <section className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
                                                <h2 className="text-lg font-bold text-indigo-800 mb-3 flex items-center gap-2">
                                                    <Target size={20} /> Mục tiêu bài học (Yêu cầu cần đạt)
                                                </h2>
                                                <div className="prose prose-sm prose-indigo whitespace-pre-line text-slate-700">
                                                    {activeLesson.objectives}
                                                </div>
                                            </section>
                                        )}

                                        <section>
                                            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                                                <span className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center text-sm font-bold">I</span>
                                                Video bài giảng
                                            </h2>
                                            {activeLesson.videoUrl ? (
                                                <div className="aspect-video rounded-xl overflow-hidden bg-black shadow-lg">
                                                    <iframe 
                                                        className="w-full h-full" 
                                                        src={activeLesson.videoUrl} 
                                                        title="Video lecture" 
                                                        frameBorder="0" 
                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                                        allowFullScreen
                                                    ></iframe>
                                                </div>
                                            ) : (
                                                <div className="p-8 bg-slate-50 rounded-xl text-center text-slate-400 border border-dashed border-slate-200">Chưa có video bài giảng</div>
                                            )}
                                        </section>

                                        <section>
                                            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                                                <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">II</span>
                                                Kiến thức trọng tâm
                                            </h2>
                                            <div className="prose prose-slate max-w-none bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                                                {activeLesson.contentMarkdown ? (
                                                    <div dangerouslySetInnerHTML={{ __html: activeLesson.contentMarkdown.replace(/\n/g, '<br/>') }} />
                                                ) : (
                                                    <p className="text-slate-400 italic">Nội dung đang cập nhật...</p>
                                                )}
                                            </div>
                                        </section>

                                        <section>
                                            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                                                <span className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center text-sm font-bold">III</span>
                                                Sơ đồ tư duy
                                            </h2>
                                            {activeLesson.mindmapImage ? (
                                                <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm cursor-zoom-in group relative">
                                                    <img src={activeLesson.mindmapImage} alt="Mindmap" className="w-full object-contain" />
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                                        <span className="bg-white/90 px-3 py-1 rounded-full text-xs font-bold shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">Phóng to</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="p-8 bg-slate-50 rounded-xl text-center text-slate-400 border border-dashed border-slate-200">Chưa có sơ đồ tư duy</div>
                                            )}
                                        </section>

                                        <section>
                                            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                                                <span className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-bold">IV</span>
                                                Từ khóa cần nhớ
                                            </h2>
                                            <div className="flex flex-wrap gap-2">
                                                {activeLesson.keywords && activeLesson.keywords.length > 0 ? (
                                                    activeLesson.keywords.map((kw, i) => (
                                                        <span key={i} className="px-4 py-2 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg text-sm font-bold hover:bg-orange-100 transition-colors cursor-default">
                                                            #{kw}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-slate-400 text-sm">Chưa có từ khóa.</span>
                                                )}
                                            </div>
                                        </section>
                                        
                                        <div className="h-10"></div>
                                        <div className="flex justify-center">
                                            <button onClick={() => setActiveTab('QUIZ')} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center gap-2">
                                                Chuyển sang Bài tập <BrainCircuit size={18}/>
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                        <QuizTaker 
                                            quizId={activeLesson.id} 
                                            questions={activeLesson.questions || []} 
                                            onComplete={handleLessonComplete}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full text-slate-400">Chọn một bài học để bắt đầu</div>
                )}
            </div>
        </div>
    </div>
  );
};

export default LessonView;