import React, { useState, useEffect } from 'react';
import { Course, Lesson, LessonStatus, Question, QuestionType, Exam } from '../types';
import { backend } from '../services/mockBackend';
import { Edit, Plus, Trash2, Video, FileText, Image, Tag, Save, UploadCloud, ArrowLeft, X, BrainCircuit, Calendar, Filter, ChevronDown, Check, FolderOpen, Target, GraduationCap, Settings, Users, Book, MoreVertical, Search, LayoutGrid, BookOpen } from 'lucide-react';
import mammoth from 'mammoth';

const AdminCourseManager: React.FC = () => {
  const [viewMode, setViewMode] = useState<'LIST' | 'EDIT_COURSE'>('LIST');
  const [courses, setCourses] = useState<Course[]>([]);
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);
  
  // List View Filters
  const [activeGrade, setActiveGrade] = useState<number>(12);
  const [searchTerm, setSearchTerm] = useState('');

  // Course Info Modal (Create/Edit Metadata)
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [courseForm, setCourseForm] = useState<Partial<Course>>({});
  const [isCreating, setIsCreating] = useState(false);

  // Lesson Management State
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  
  // Lesson Form Data
  const [lTitle, setLTitle] = useState('');
  const [lObjectives, setLObjectives] = useState('');
  const [lVideo, setLVideo] = useState('');
  const [lContent, setLContent] = useState('');
  const [lMindmap, setLMindmap] = useState('');
  const [lKeywords, setLKeywords] = useState('');
  const [lQuestions, setLQuestions] = useState<Question[]>([]);
  const [lessonTab, setLessonTab] = useState<'CONTENT' | 'QUIZ'>('CONTENT');

  // --- Quiz Management State ---
  const [questionMode, setQuestionMode] = useState<'LIST' | 'CREATE' | 'IMPORT'>('LIST');
  const [newQType, setNewQType] = useState<QuestionType>(QuestionType.MULTIPLE_CHOICE);
  const [newQText, setNewQText] = useState('');
  const [newQOptions, setNewQOptions] = useState(['', '', '', '']);
  const [newQCorrectIdx, setNewQCorrectIdx] = useState(0);
  const [newQStatements, setNewQStatements] = useState([{ text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }]);
  const [availableExams, setAvailableExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [importSelection, setImportSelection] = useState<Set<string>>(new Set());

  useEffect(() => { loadCourses(); }, []);

  const loadCourses = async () => {
    const data = await backend.getCourses();
    setCourses(data);
  };

  // --- Course Info Logic ---
  const openCreateCourseModal = () => {
      setIsCreating(true);
      setCourseForm({ title: '', description: '', thumbnail: 'https://picsum.photos/400/225', grade: 12 });
      setIsInfoModalOpen(true);
  };

  const openEditInfoModal = (course: Course) => {
      setIsCreating(false);
      setCourseForm({ ...course });
      setIsInfoModalOpen(true);
  };

  const handleSaveCourseInfo = async () => {
      if (!courseForm.title) return alert("Vui lòng nhập tên khóa học");
      
      if (isCreating) {
          const newCourse: Course = {
              id: `c_${Date.now()}`,
              title: courseForm.title,
              description: courseForm.description || '',
              thumbnail: courseForm.thumbnail || '',
              grade: courseForm.grade || 12,
              totalLessons: 0,
              completedLessons: 0,
              studentsCount: 0,
              updatedAt: new Date().toISOString(),
              lessons: []
          };
          await backend.addCourse(newCourse);
      } else if (courseForm.id) {
          await backend.updateCourse(courseForm.id, {
              title: courseForm.title,
              description: courseForm.description,
              thumbnail: courseForm.thumbnail,
              grade: courseForm.grade
          });
      }
      
      await loadCourses();
      setIsInfoModalOpen(false);
  };

  const handleDeleteCourse = async (id: string) => {
      if (confirm("Bạn có chắc chắn muốn xóa khóa học này? Hành động này không thể hoàn tác.")) {
          await backend.deleteCourse(id);
          await loadCourses();
      }
  };

  // --- Content Logic ---
  const handleManageContent = async (course: Course) => {
      setCurrentCourse(course);
      const ls = await backend.getLessons(course.id);
      setLessons(ls);
      setViewMode('EDIT_COURSE');
  };

  const openLessonModal = (lesson?: Lesson) => {
      setEditingLesson(lesson || null);
      if (lesson) {
          setLTitle(lesson.title);
          setLObjectives(lesson.objectives || '');
          setLVideo(lesson.videoUrl || '');
          setLContent(lesson.contentMarkdown || '');
          setLMindmap(lesson.mindmapImage || '');
          setLKeywords(lesson.keywords?.join(', ') || '');
          setLQuestions(lesson.questions || []);
      } else {
          setLTitle(''); setLObjectives(''); setLVideo(''); setLContent(''); setLMindmap(''); setLKeywords(''); setLQuestions([]);
      }
      setLessonTab('CONTENT');
      setQuestionMode('LIST');
      setIsLessonModalOpen(true);
  };

  const handleSaveLesson = async () => {
      if (!lTitle) return alert("Vui lòng nhập tên bài học");
      const newLesson: Lesson = {
          id: editingLesson ? editingLesson.id : `l${Date.now()}`,
          courseId: currentCourse!.id,
          title: lTitle,
          description: '',
          order: editingLesson ? editingLesson.order : lessons.length + 1,
          status: LessonStatus.NOT_STARTED,
          objectives: lObjectives,
          videoUrl: lVideo,
          contentMarkdown: lContent,
          mindmapImage: lMindmap,
          keywords: lKeywords.split(',').map(s => s.trim()).filter(Boolean),
          questions: lQuestions
      };

      let updatedLessons = [...lessons];
      if (editingLesson) {
          updatedLessons = updatedLessons.map(l => l.id === newLesson.id ? newLesson : l);
      } else {
          updatedLessons.push(newLesson);
      }
      
      await backend.saveLessons(currentCourse!.id, updatedLessons);
      setLessons(updatedLessons);
      setIsLessonModalOpen(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
          if (file.name.endsWith('.docx')) {
              const arrayBuffer = await file.arrayBuffer();
              const result = await mammoth.convertToHtml({ arrayBuffer });
              const tempDiv = document.createElement("div");
              tempDiv.innerHTML = result.value;
              setLContent(tempDiv.innerText || result.value);
              alert("Đã trích xuất nội dung từ file Word!");
          } else {
              alert("Vui lòng chọn file .docx");
          }
      } catch (err) {
          console.error(err);
          alert("Lỗi đọc file");
      }
  };

  // --- Question Logic ---
  const handleStartCreateQuestion = () => {
      setNewQText(''); setNewQOptions(['', '', '', '']); setNewQCorrectIdx(0);
      setNewQStatements([{ text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }]);
      setQuestionMode('CREATE');
  };

  const handleSaveNewQuestion = () => {
      if (!newQText.trim()) return alert("Nhập nội dung câu hỏi!");
      const q: Question = { id: `q_${Date.now()}`, text: newQText, type: newQType };
      if (newQType === QuestionType.MULTIPLE_CHOICE) { q.options = newQOptions; q.correctOptionIndex = newQCorrectIdx; } 
      else { q.statements = newQStatements.map((s, i) => ({ id: `s_${Date.now()}_${i}`, text: s.text, isCorrect: s.isCorrect })); }
      setLQuestions([...lQuestions, q]); setQuestionMode('LIST');
  };

  const handleStartImport = async () => {
      const exams = await backend.getExams();
      setAvailableExams(exams); setSelectedExamId(''); setImportSelection(new Set()); setQuestionMode('IMPORT');
  };

  const handleToggleImportSelection = (qId: string) => {
      const next = new Set(importSelection); if (next.has(qId)) next.delete(qId); else next.add(qId); setImportSelection(next);
  };

  const handleImportQuestions = () => {
      const exam = availableExams.find(e => e.id === selectedExamId); if (!exam) return;
      const questionsToImport = exam.questions.filter(q => importSelection.has(q.id)).map(q => ({ ...q, id: `q_imp_${Date.now()}_${q.id}` }));
      setLQuestions([...lQuestions, ...questionsToImport]); setQuestionMode('LIST');
  };

  const filteredCourses = courses.filter(c => {
      return (c.grade === activeGrade) && c.title.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (viewMode === 'LIST') {
      return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 bg-gradient-to-r from-slate-900 to-slate-800 p-8 rounded-3xl shadow-xl text-white">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <LayoutGrid className="text-indigo-400" /> Quản lý Khóa học
                    </h1>
                    <p className="text-slate-400 mt-2 text-lg">Thiết lập chương trình học, bài giảng và ngân hàng câu hỏi.</p>
                </div>
                <button 
                    onClick={openCreateCourseModal} 
                    className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/30"
                >
                    <Plus size={20} /> Tạo chủ đề mới
                </button>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between sticky top-0 bg-slate-50 z-10 py-2">
                <div className="flex p-1.5 bg-white border border-slate-200 rounded-xl shadow-sm">
                  {[12, 11, 10].map((grade) => (
                      <button
                        key={grade}
                        onClick={() => setActiveGrade(grade)}
                        className={`
                            px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all duration-300
                            ${activeGrade === grade 
                                ? 'bg-indigo-600 text-white shadow-md' 
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}
                        `}
                      >
                          <GraduationCap size={16} />
                          Khối {grade}
                      </button>
                  ))}
                </div>

                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Tìm kiếm chủ đề..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredCourses.map(course => (
                    <div key={course.id} className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all duration-300 flex flex-col overflow-hidden relative">
                        <div className="relative aspect-video bg-slate-100 overflow-hidden">
                            <img src={course.thumbnail} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" alt="" onError={(e)=>(e.target as HTMLImageElement).src='https://via.placeholder.com/400x225'}/>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-80" />
                            <div className="absolute top-3 left-3">
                                <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-lg border border-white/20">
                                    Khối {course.grade}
                                </span>
                            </div>
                            <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openEditInfoModal(course)} className="p-2 bg-white/90 text-slate-700 rounded-full hover:text-indigo-600 hover:bg-white shadow-sm" title="Cài đặt thông tin">
                                    <Settings size={16} />
                                </button>
                                <button onClick={() => handleDeleteCourse(course.id)} className="p-2 bg-white/90 text-slate-700 rounded-full hover:text-red-600 hover:bg-white shadow-sm" title="Xóa khóa học">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="p-5 flex-1 flex flex-col">
                            <h3 className="font-bold text-slate-900 line-clamp-2 text-lg mb-2 group-hover:text-indigo-700 transition-colors">{course.title}</h3>
                            <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                                <span className="flex items-center gap-1"><Users size={14}/> {course.studentsCount || 0} học viên</span>
                                <span className="flex items-center gap-1"><Book size={14}/> {course.totalLessons} bài học</span>
                            </div>
                            
                            <div className="mt-auto pt-4 border-t border-slate-100">
                                <button 
                                    onClick={() => handleManageContent(course)}
                                    className="w-full py-2.5 bg-indigo-50 text-indigo-700 rounded-xl font-bold text-sm hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2"
                                >
                                    <Edit size={16} /> Quản lý nội dung
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                
                <button 
                    onClick={openCreateCourseModal}
                    className="border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center p-8 text-slate-400 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all min-h-[300px]"
                >
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4 group-hover:bg-white group-hover:shadow-sm">
                        <Plus size={32} />
                    </div>
                    <span className="font-bold">Thêm chủ đề mới</span>
                </button>
            </div>

            {isInfoModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800">{isCreating ? 'Tạo khóa học mới' : 'Cập nhật thông tin'}</h3>
                            <button onClick={() => setIsInfoModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tên chủ đề <span className="text-red-500">*</span></label>
                                <input 
                                    value={courseForm.title}
                                    onChange={e => setCourseForm({...courseForm, title: e.target.value})}
                                    className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-900"
                                    placeholder="VD: Pháp luật và Đời sống"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Khối lớp</label>
                                    <select 
                                        value={courseForm.grade}
                                        onChange={e => setCourseForm({...courseForm, grade: Number(e.target.value)})}
                                        className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                    >
                                        <option value={10}>Khối 10</option>
                                        <option value={11}>Khối 11</option>
                                        <option value={12}>Khối 12</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Link Ảnh bìa</label>
                                    <input 
                                        value={courseForm.thumbnail}
                                        onChange={e => setCourseForm({...courseForm, thumbnail: e.target.value})}
                                        className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mô tả ngắn</label>
                                <textarea 
                                    value={courseForm.description}
                                    onChange={e => setCourseForm({...courseForm, description: e.target.value})}
                                    className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 text-sm h-24 resize-none"
                                    placeholder="Giới thiệu về nội dung chủ đề..."
                                />
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button onClick={() => setIsInfoModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-bold">Hủy</button>
                            <button onClick={handleSaveCourseInfo} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-lg shadow-indigo-200">
                                <Save size={16} /> Lưu thông tin
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
      );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 h-[calc(100vh-100px)] flex flex-col">
        <div className="flex items-center gap-4 border-b border-slate-200 pb-4 shrink-0">
            <button onClick={() => setViewMode('LIST')} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-slate-800"><ArrowLeft size={24}/></button>
            <div>
                <h1 className="text-2xl font-bold text-slate-900">{currentCourse?.title}</h1>
                <p className="text-slate-500 text-sm flex items-center gap-2">
                    <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs font-bold">Khối {currentCourse?.grade}</span>
                    <span>• {lessons.length} bài học</span>
                </p>
            </div>
            <button onClick={() => openLessonModal()} className="ml-auto bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all">
                <Plus size={20} /> Thêm bài học
            </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-white rounded-2xl shadow-sm border border-slate-200">
            {lessons.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <Book size={48} className="mb-4 text-slate-200" />
                    <p>Chưa có bài học nào. Hãy thêm bài học đầu tiên!</p>
                </div>
            ) : (
                <div className="divide-y divide-slate-100">
                    {lessons.map((lesson, idx) => (
                        <div key={lesson.id} className="p-5 flex items-center justify-between hover:bg-slate-50 group transition-colors">
                            <div className="flex items-center gap-5">
                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-lg border border-slate-200">{idx + 1}</div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-lg">{lesson.title}</h4>
                                    <div className="flex gap-4 text-xs text-slate-500 mt-1.5">
                                        <span className={`flex items-center gap-1 ${lesson.videoUrl ? 'text-green-600' : ''}`}><Video size={14}/> {lesson.videoUrl ? 'Có Video' : 'Thiếu Video'}</span>
                                        <span className={`flex items-center gap-1 ${lesson.contentMarkdown ? 'text-green-600' : ''}`}><FileText size={14}/> {lesson.contentMarkdown ? 'Có nội dung' : 'Thiếu nội dung'}</span>
                                        <span className={`flex items-center gap-1 ${lesson.questions && lesson.questions.length > 0 ? 'text-green-600' : ''}`}><BrainCircuit size={14}/> {lesson.questions?.length || 0} câu hỏi</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                                <button onClick={() => openLessonModal(lesson)} className="px-4 py-2 bg-white border border-slate-200 text-indigo-600 font-bold rounded-lg hover:bg-indigo-50 hover:border-indigo-200 shadow-sm flex items-center gap-2">
                                    <Edit size={16}/> Chỉnh sửa
                                </button>
                                <button className="p-2 bg-white border border-slate-200 text-red-500 rounded-lg hover:bg-red-50 hover:border-red-200 shadow-sm" title="Xóa bài học">
                                    <Trash2 size={16}/>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {isLessonModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <div>
                             <h2 className="text-lg font-bold text-slate-800">{editingLesson ? 'Chỉnh sửa nội dung' : 'Thêm bài học mới'}</h2>
                             <p className="text-xs text-slate-500">{currentCourse?.title}</p>
                        </div>
                        <button onClick={() => setIsLessonModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-200 rounded-full transition-colors"><X size={24}/></button>
                    </div>
                    
                    <div className="flex border-b border-slate-100 bg-white px-6 pt-2">
                        <button onClick={() => setLessonTab('CONTENT')} className={`mr-6 pb-3 text-sm font-bold border-b-2 flex items-center gap-2 transition-colors ${lessonTab === 'CONTENT' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                            <BookOpen size={18}/> Hệ thống kiến thức
                        </button>
                        <button onClick={() => setLessonTab('QUIZ')} className={`pb-3 text-sm font-bold border-b-2 flex items-center gap-2 transition-colors ${lessonTab === 'QUIZ' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                            <BrainCircuit size={18}/> Ngân hàng câu hỏi <span className="bg-slate-100 text-slate-600 px-1.5 rounded-full text-xs">{lQuestions.length}</span>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
                        {lessonTab === 'CONTENT' ? (
                            <div className="max-w-4xl mx-auto space-y-6">
                                <div className="grid grid-cols-12 gap-6">
                                    <div className="col-span-8">
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Tên bài học <span className="text-red-500">*</span></label>
                                        <input value={lTitle} onChange={e => setLTitle(e.target.value)} className="w-full border border-slate-300 p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium" placeholder="VD: Bài 1: Tăng trưởng kinh tế"/>
                                    </div>
                                    <div className="col-span-4">
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Video (Youtube ID/URL)</label>
                                        <input value={lVideo} onChange={e => setLVideo(e.target.value)} className="w-full border border-slate-300 p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="https://youtu.be/..."/>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-2"><Target size={16} className="text-indigo-500"/> Mục tiêu bài học (Yêu cầu cần đạt)</label>
                                    <textarea 
                                        value={lObjectives} 
                                        onChange={e => setLObjectives(e.target.value)} 
                                        className="w-full border border-slate-300 p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm h-24 shadow-sm" 
                                        placeholder="- Nêu được khái niệm...&#10;- Giải thích được ý nghĩa..."
                                    />
                                </div>

                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                                        <h3 className="font-bold text-slate-800 flex items-center gap-2"><FileText size={18} className="text-blue-500"/> Nội dung kiến thức</h3>
                                        <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors">
                                            <UploadCloud size={14}/> Upload file Word (.docx)
                                            <input type="file" accept=".docx" className="hidden" onChange={handleFileUpload}/>
                                        </label>
                                    </div>
                                    <textarea value={lContent} onChange={e => setLContent(e.target.value)} className="w-full border border-slate-200 bg-slate-50 p-4 rounded-xl text-sm h-64 resize-y focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-colors" placeholder="Soạn thảo nội dung hoặc upload từ file word..."/>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                     <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                                        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2"><Image size={16} className="text-purple-500"/> Sơ đồ tư duy (Link ảnh)</h3>
                                        <input value={lMindmap} onChange={e => setLMindmap(e.target.value)} className="w-full border border-slate-300 p-2.5 rounded-lg text-sm" placeholder="https://..."/>
                                    </div>
                                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                                        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2"><Tag size={16} className="text-orange-500"/> Từ khóa (Tags)</h3>
                                        <input value={lKeywords} onChange={e => setLKeywords(e.target.value)} className="w-full border border-slate-300 p-2.5 rounded-lg text-sm" placeholder="GDP, Kinh tế, ..."/>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4 h-full flex flex-col max-w-5xl mx-auto">
                                {questionMode === 'LIST' && (
                                    <>
                                        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                            <h3 className="font-bold text-slate-800">Danh sách câu hỏi hiện tại</h3>
                                            <div className="flex gap-2">
                                                <button onClick={handleStartImport} className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-100 flex items-center gap-2 transition-colors">
                                                    <FolderOpen size={16}/> Lấy từ Kho đề thi
                                                </button>
                                                <button onClick={handleStartCreateQuestion} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-md shadow-indigo-200 transition-colors">
                                                    <Plus size={16}/> Tạo câu hỏi mới
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex-1 overflow-y-auto bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                                            {lQuestions.length === 0 ? (
                                                <div className="text-center text-slate-400 py-20 flex flex-col items-center">
                                                    <BrainCircuit size={48} className="mb-4 text-slate-200"/>
                                                    <p>Chưa có câu hỏi nào trong bài học này.</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {lQuestions.map((q, i) => (
                                                        <div key={i} className="p-4 border border-slate-100 bg-slate-50/50 rounded-xl text-sm flex justify-between items-start group hover:bg-indigo-50/30 hover:border-indigo-100 transition-colors">
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded text-xs">Câu {i+1}</span>
                                                                    <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">{q.type === 'MULTIPLE_CHOICE' ? 'Trắc nghiệm' : 'Đúng/Sai'}</span>
                                                                </div>
                                                                <p className="font-medium text-slate-700 line-clamp-2">{q.text}</p>
                                                            </div>
                                                            <button onClick={() => setLQuestions(lQuestions.filter((_, idx) => idx !== i))} className="text-slate-300 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-all"><Trash2 size={18}/></button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}

                                {questionMode === 'CREATE' && (
                                    <div className="h-full flex flex-col bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                                        <h3 className="font-bold text-slate-800 mb-6 pb-2 border-b flex items-center gap-2"><Plus size={20} className="text-indigo-600"/> Soạn câu hỏi mới</h3>
                                        <div className="space-y-6 overflow-y-auto flex-1 custom-scrollbar pr-2">
                                            <div className="flex gap-6">
                                                <label className="flex items-center gap-3 cursor-pointer p-3 border border-slate-200 rounded-lg has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50 transition-all">
                                                    <input type="radio" checked={newQType === QuestionType.MULTIPLE_CHOICE} onChange={() => setNewQType(QuestionType.MULTIPLE_CHOICE)} className="w-4 h-4 text-indigo-600 accent-indigo-600"/> <span className="font-bold text-slate-700">Trắc nghiệm (4 đáp án)</span>
                                                </label>
                                                <label className="flex items-center gap-3 cursor-pointer p-3 border border-slate-200 rounded-lg has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50 transition-all">
                                                    <input type="radio" checked={newQType === QuestionType.TRUE_FALSE_GROUP} onChange={() => setNewQType(QuestionType.TRUE_FALSE_GROUP)} className="w-4 h-4 text-indigo-600 accent-indigo-600"/> <span className="font-bold text-slate-700">Đúng / Sai (4 ý)</span>
                                                </label>
                                            </div>
                                            
                                            <div>
                                                 <label className="block text-sm font-bold text-slate-700 mb-2">Nội dung câu hỏi</label>
                                                 <textarea value={newQText} onChange={e => setNewQText(e.target.value)} placeholder="Nhập câu hỏi..." className="w-full border border-slate-300 rounded-xl p-4 outline-none focus:ring-2 focus:ring-indigo-500 font-medium" rows={3} />
                                            </div>
                                            
                                            {newQType === QuestionType.MULTIPLE_CHOICE ? (
                                                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Các phương án (Chọn đáp án đúng)</label>
                                                    {newQOptions.map((opt, i) => (
                                                        <div key={i} className="flex items-center gap-3">
                                                            <div className="relative flex items-center justify-center">
                                                                <input type="radio" checked={newQCorrectIdx === i} onChange={() => setNewQCorrectIdx(i)} className="w-5 h-5 text-indigo-600 accent-indigo-600 cursor-pointer z-10"/>
                                                                <div className={`absolute w-8 h-8 rounded-full ${newQCorrectIdx === i ? 'bg-indigo-100' : 'bg-transparent'} -z-0`}></div>
                                                            </div>
                                                            <span className="font-bold text-slate-400 w-4">{String.fromCharCode(65+i)}</span>
                                                            <input value={opt} onChange={e => {const n = [...newQOptions]; n[i] = e.target.value; setNewQOptions(n)}} className={`flex-1 border p-3 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 ${newQCorrectIdx===i ? 'border-indigo-300 bg-white' : 'border-slate-200'}`} placeholder={`Nhập đáp án ${String.fromCharCode(65+i)}`}/>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Các mệnh đề</label>
                                                    {newQStatements.map((stmt, i) => (
                                                        <div key={i} className="flex items-center gap-3">
                                                            <span className="w-4 font-bold text-slate-500">{String.fromCharCode(97+i)}</span>
                                                            <input value={stmt.text} onChange={e => {const n = [...newQStatements]; n[i].text = e.target.value; setNewQStatements(n)}} className="flex-1 border p-3 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Nhập mệnh đề..."/>
                                                            <div className="flex bg-white rounded-lg border border-slate-200 p-1">
                                                                <label className={`cursor-pointer px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${stmt.isCorrect ? 'bg-green-100 text-green-700' : 'text-slate-400 hover:bg-slate-50'}`}><input type="radio" name={`stmt_${i}`} checked={stmt.isCorrect} onChange={() => {const n = [...newQStatements]; n[i].isCorrect = true; setNewQStatements(n)}} className="hidden"/> Đúng</label>
                                                                <label className={`cursor-pointer px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${!stmt.isCorrect ? 'bg-red-100 text-red-700' : 'text-slate-400 hover:bg-slate-50'}`}><input type="radio" name={`stmt_${i}`} checked={!stmt.isCorrect} onChange={() => {const n = [...newQStatements]; n[i].isCorrect = false; setNewQStatements(n)}} className="hidden"/> Sai</label>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex justify-end gap-3 pt-6 mt-2 border-t border-slate-100">
                                            <button onClick={() => setQuestionMode('LIST')} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-bold">Hủy bỏ</button>
                                            <button onClick={handleSaveNewQuestion} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200">Hoàn tất</button>
                                        </div>
                                    </div>
                                )}

                                {questionMode === 'IMPORT' && (
                                    <div className="h-full flex flex-col bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                                         <h3 className="font-bold text-slate-800 mb-6 pb-2 border-b flex items-center justify-between">
                                            <span className="flex items-center gap-2"><FolderOpen size={20} className="text-orange-500"/> Chọn từ Ngân hàng đề</span>
                                            {selectedExamId && <span className="text-xs font-bold bg-indigo-600 text-white px-3 py-1 rounded-full">Đã chọn: {importSelection.size} câu</span>}
                                        </h3>
                                        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                                            <select value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)} className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50">
                                                <option value="">-- Chọn đề thi gốc --</option>
                                                {availableExams.map(ex => <option key={ex.id} value={ex.id}>{ex.title}</option>)}
                                            </select>
                                            
                                            <div className="flex-1 overflow-y-auto custom-scrollbar border border-slate-200 rounded-xl p-4 space-y-2 bg-slate-50">
                                                {selectedExamId ? (
                                                    availableExams.find(e => e.id === selectedExamId)?.questions.map((q, i) => (
                                                        <div key={q.id} onClick={() => handleToggleImportSelection(q.id)} className={`p-4 rounded-xl border cursor-pointer text-sm flex gap-3 transition-all ${importSelection.has(q.id) ? 'bg-indigo-50 border-indigo-500 shadow-sm' : 'bg-white border-slate-200 hover:border-indigo-300'}`}>
                                                            <div className={`w-6 h-6 rounded-lg border flex items-center justify-center flex-shrink-0 transition-colors ${importSelection.has(q.id) ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-slate-100'}`}>
                                                                {importSelection.has(q.id) && <Check size={14} strokeWidth={3}/>}
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="font-bold text-slate-700 mb-1">Câu {i+1}</p>
                                                                <p className="text-slate-600 line-clamp-2">{q.text}</p>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-center text-slate-400 py-20 flex flex-col items-center">
                                                        <Search size={40} className="mb-2 opacity-20"/>
                                                        <p>Vui lòng chọn một đề thi để xem danh sách câu hỏi.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-3 pt-6 mt-2 border-t border-slate-100">
                                            <button onClick={() => setQuestionMode('LIST')} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-bold">Quay lại</button>
                                            <button onClick={handleImportQuestions} disabled={importSelection.size === 0} className="px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-200 transition-all">
                                                Nhập {importSelection.size} câu hỏi
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t border-slate-100 bg-white flex justify-end gap-3 z-10">
                        <button onClick={() => setIsLessonModalOpen(false)} className="px-6 py-3 text-slate-600 hover:bg-slate-100 rounded-xl font-bold text-sm">Đóng</button>
                        <button onClick={handleSaveLesson} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 text-sm flex items-center gap-2 transition-all">
                            <Save size={18} /> Lưu bài học
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default AdminCourseManager;