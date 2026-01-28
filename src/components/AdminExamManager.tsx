import React, { useState, useEffect } from 'react';
import { Exam, Question, QuestionType, Course } from '../types';
import { backend } from '../services/mockBackend';
import { Plus, Trash2, Edit, UploadCloud, FileType, Loader2, Eye, ClipboardList, ArrowLeft, X, BookOpen } from 'lucide-react';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

// Fix: Handle PDF.js import structure (Namespace vs Default)
const pdfjs: any = (pdfjsLib as any).default || pdfjsLib;
if (pdfjs.GlobalWorkerOptions) {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;
}

const AdminExamManager: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [mode, setMode] = useState<'LIST' | 'CREATE_INPUT' | 'PREVIEW'>('LIST');
  const [activeTab, setActiveTab] = useState<'MANUAL' | 'UPLOAD'>('MANUAL');
  const [isProcessing, setIsProcessing] = useState(false);

  // Form State
  const [newExamTitle, setNewExamTitle] = useState('');
  const [newExamTopic, setNewExamTopic] = useState('');
  const [newExamTags, setNewExamTags] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  
  // Manual Entry State
  const [qType, setQType] = useState<QuestionType>(QuestionType.MULTIPLE_CHOICE);
  const [qText, setQText] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctIdx, setCorrectIdx] = useState(0);
  const [statements, setStatements] = useState([
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false }
  ]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const e = await backend.getExams();
    const c = await backend.getCourses();
    setExams(e);
    setCourses(c);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Stop click from bubbling to card
    if(confirm("Bạn có chắc muốn xóa đề thi này?")) {
      await backend.deleteExam(id);
      await loadData();
    }
  }

  // --- MANUAL ENTRY HANDLERS ---
  const handleAddManualQuestion = () => {
    if(!qText) return alert("Vui lòng nhập nội dung câu hỏi");
    
    const newQ: Question = {
      id: `q${Date.now()}`,
      type: qType,
      text: qText,
    };

    if (qType === QuestionType.MULTIPLE_CHOICE) {
       newQ.options = [...options];
       newQ.correctOptionIndex = correctIdx;
    } else {
       newQ.statements = statements.map((s, i) => ({
         id: `s${Date.now()}_${i}`,
         text: s.text,
         isCorrect: s.isCorrect
       }));
    }

    setQuestions([...questions, newQ]);
    // Reset Form
    setQText('');
    setOptions(['','','','']);
    setStatements([
      { text: '', isCorrect: false }, { text: '', isCorrect: false },
      { text: '', isCorrect: false }, { text: '', isCorrect: false }
    ]);
  };

  // --- AI / DOCUMENT PARSER LOGIC ---

  const parseWordDocument = (htmlString: string): Question[] => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlString, 'text/html');
      
      const elements = Array.from(doc.body.children);
      const parsedQuestions: Question[] = [];
      
      let currentQ: any = null;
      let currentType: QuestionType = QuestionType.MULTIPLE_CHOICE;
      let bufferStatements: any[] = [];
      let bufferOptions: string[] = [];
      let bufferCorrectIdx = -1;
      let currentPassageContext = ""; // For Cluster Questions
      let isCollectingPassage = false;

      const finalizeQuestion = () => {
          if (!currentQ) return;
          
          if (currentType === QuestionType.MULTIPLE_CHOICE) {
             currentQ.options = bufferOptions;
             currentQ.correctOptionIndex = bufferCorrectIdx !== -1 ? bufferCorrectIdx : 0; 
             while (currentQ.options.length < 4) currentQ.options.push("");
          } else {
             currentQ.statements = bufferStatements;
          }
          currentQ.type = currentType;
          if (currentPassageContext) {
              currentQ.passageContent = currentPassageContext;
          }

          parsedQuestions.push(currentQ);
          currentQ = null;
          bufferStatements = [];
          bufferOptions = [];
          bufferCorrectIdx = -1;
      };

      const isQuestionStart = (text: string) => /^(Câu|Bài)\s+\d+[:.]/i.test(text.trim());
      const isClusterTrigger = (text: string) => /đọc thông tin.*trả lời.*câu hỏi/i.test(text.trim());

      const isTextUnderlined = (node: Element, searchText: string): boolean => {
          const inner = node.innerHTML;
          const letter = searchText.trim().replace(/[\.\)]/g, ''); 
          const regex = new RegExp(`(<u[^>]*>|<span[^>]*style="[^"]*underline[^"]*"[^>]*>)\\s*${letter}\\s*(<\\/u>|<\\/span>)`, 'i');
          return regex.test(inner);
      };

      elements.forEach((el) => {
          const text = el.textContent?.trim() || "";
          
          if (isClusterTrigger(text)) {
              finalizeQuestion();
              isCollectingPassage = true;
              currentPassageContext = text + "\n";
              return;
          }

          if (isQuestionStart(text)) {
              isCollectingPassage = false;
              finalizeQuestion(); 
              currentQ = {
                  id: `qi_${Date.now()}_${parsedQuestions.length}`,
                  text: text, 
              };
              currentType = QuestionType.MULTIPLE_CHOICE; 
          } 
          else if (isCollectingPassage) {
              currentPassageContext += text + "\n";
          }
          else if (currentQ) {
              // True/False: lowercase a, b, c, d
              const tfMatch = text.match(/^([a-d])[\)\.]\s*(.+)/);
              
              if (tfMatch) {
                  currentType = QuestionType.TRUE_FALSE_GROUP;
                  const letter = tfMatch[1];
                  const content = tfMatch[2].trim();
                  const isUnderlined = isTextUnderlined(el, letter);
                  
                  bufferStatements.push({
                      id: `s_${Date.now()}_${bufferStatements.length}`,
                      text: content,
                      isCorrect: isUnderlined
                  });
              } 
              // Multiple Choice: Uppercase A, B, C, D
              else if (text.match(/^[A-D][\.\:]/)) {
                  if (currentType !== QuestionType.TRUE_FALSE_GROUP) {
                      currentType = QuestionType.MULTIPLE_CHOICE;
                  }
                  
                  const match = text.match(/^([A-D])[\.\:]\s*(.+)/);
                  if (match) {
                      const letter = match[1];
                      const content = match[2];
                      bufferOptions.push(content);
                      if (isTextUnderlined(el, letter)) {
                          bufferCorrectIdx = bufferOptions.length - 1;
                      }
                  }
              }
              else {
                  if (bufferOptions.length === 0 && bufferStatements.length === 0) {
                      currentQ.text += "\n" + text;
                  }
              }
          }
      });
      finalizeQuestion(); 
      return parsedQuestions;
  };

  const parsePdfDocument = async (arrayBuffer: ArrayBuffer): Promise<Question[]> => {
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";
      
      for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join('\n');
          fullText += pageText + "\n";
      }

      const lines = fullText.split('\n').map(l => l.trim()).filter(Boolean);
      const parsedQuestions: Question[] = [];
      let currentQ: any = null;
      let bufferStatements: any[] = [];
      let bufferOptions: string[] = [];

      const finalize = () => {
          if(!currentQ) return;
          if (bufferStatements.length > 0) {
             currentQ.type = QuestionType.TRUE_FALSE_GROUP;
             currentQ.statements = bufferStatements;
          } else {
             currentQ.type = QuestionType.MULTIPLE_CHOICE;
             currentQ.options = bufferOptions;
             while(currentQ.options.length < 4) currentQ.options.push("");
             currentQ.correctOptionIndex = 0; 
          }
          parsedQuestions.push(currentQ);
          currentQ = null; bufferStatements = []; bufferOptions = [];
      };

      lines.forEach(line => {
          if (/^(Câu|Bài)\s+\d+[:.]/i.test(line)) {
              finalize();
              currentQ = { id: `pdf_${Date.now()}_${parsedQuestions.length}`, text: line };
          } 
          else if (currentQ) {
              const tfMatch = line.match(/^([a-d])[\)\.]\s*(.+)/);
              if (tfMatch) {
                   bufferStatements.push({ id: `s_${Date.now()}`, text: tfMatch[2], isCorrect: false });
              }
              else if (/^[A-D][\.\:]/.test(line)) {
                   bufferOptions.push(line.replace(/^[A-D][\.\:]\s*/, ""));
              }
              else {
                  if (bufferStatements.length === 0 && bufferOptions.length === 0) currentQ.text += " " + line;
              }
          }
      });
      finalize();
      return parsedQuestions;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsProcessing(true);

      try {
          if (file.name.endsWith('.docx')) {
              const arrayBuffer = await file.arrayBuffer();
              const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
              const parsedQs = parseWordDocument(result.value);
              
              if (parsedQs.length > 0) {
                  setQuestions([...questions, ...parsedQs]);
                  alert(`Đã nhận diện ${parsedQs.length} câu hỏi từ file Word.\nLưu ý: Đã phân biệt chữ HOA (Trắc nghiệm) và chữ thường (Đúng/Sai).`);
              } else {
                  alert("Không tìm thấy câu hỏi. Kiểm tra định dạng (Câu 1:, A., a)...)");
              }
          } else if (file.name.endsWith('.pdf')) {
              const arrayBuffer = await file.arrayBuffer();
              const parsedQs = await parsePdfDocument(arrayBuffer);
              if (parsedQs.length > 0) {
                  setQuestions([...questions, ...parsedQs]);
                  alert(`Đã trích xuất ${parsedQs.length} câu hỏi từ PDF.`);
              }
          } else {
              alert("Vui lòng chọn file .docx hoặc .pdf");
          }
      } catch (err) {
          console.error(err);
          alert("Lỗi khi đọc file. Vui lòng thử lại.");
      } finally {
          setIsProcessing(false);
      }
  };

  const handleFinalSave = async () => {
      const exam: Exam = {
          id: `ex${Date.now()}`,
          title: newExamTitle,
          topic: newExamTopic || 'Tổng hợp',
          tags: newExamTags.split(',').map(t => t.trim()).filter(Boolean),
          createdAt: new Date().toISOString(),
          questions: questions
      };
      await backend.addExam(exam);
      await loadData();
      setMode('LIST');
      setNewExamTitle('');
      setNewExamTopic('');
      setNewExamTags('');
      setQuestions([]);
  };

  if (mode === 'LIST') {
      return (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Quản lý Đề thi</h1>
              <p className="text-slate-500">Ngân hàng đề kiểm tra và ôn tập</p>
            </div>
            <button onClick={() => setMode('CREATE_INPUT')} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
              <Plus size={18} /> Tạo đề mới
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {exams.map(exam => (
               <div key={exam.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col hover:border-indigo-300 transition-colors group">
                  <div className="flex justify-between items-start mb-3">
                     <div className="p-2 bg-orange-100 text-orange-600 rounded-lg group-hover:bg-orange-600 group-hover:text-white transition-colors">
                        <ClipboardList size={20} />
                     </div>
                     <div className="flex gap-1">
                        <button type="button" onClick={(e) => handleDelete(e, exam.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-slate-50 z-10 relative"><Trash2 size={16}/></button>
                     </div>
                  </div>
                  <h3 className="font-bold text-slate-900 mb-1 line-clamp-2 flex-1">{exam.title}</h3>
                  <p className="text-xs text-slate-500 mb-2 font-medium">{exam.topic}</p>
                  <div className="flex flex-wrap gap-1 mb-4">
                     {exam.tags?.map(t => <span key={t} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{t}</span>)}
                  </div>
                  <div className="mt-auto pt-4 border-t border-slate-50 flex justify-between text-xs font-medium text-slate-600">
                     <span>{exam.questions.length} câu hỏi</span>
                     <span>{new Date(exam.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>
               </div>
             ))}
          </div>
        </div>
      );
  }

  if (mode === 'CREATE_INPUT') {
      return (
        <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in slide-in-from-right-4 duration-300">
           <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
             <button onClick={() => setMode('LIST')} className="p-2 hover:bg-slate-100 rounded-full"><ArrowLeft size={20}/></button>
             <div>
               <h1 className="text-2xl font-bold text-slate-900">Tạo đề thi mới</h1>
               <p className="text-slate-500">Bước 1: Nhập thông tin & Câu hỏi</p>
             </div>
           </div>
  
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tên đề thi <span className="text-red-500">*</span></label>
                        <input value={newExamTitle} onChange={e => setNewExamTitle(e.target.value)} className="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" placeholder="VD: Kiểm tra 15 phút - Bài 1" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Chủ đề</label>
                            <input list="topics" value={newExamTopic} onChange={e => setNewExamTopic(e.target.value)} className="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Chọn hoặc nhập mới..." />
                            <datalist id="topics">{courses.map(c => <option key={c.id} value={c.title} />)}</datalist>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tags</label>
                            <input value={newExamTags} onChange={e => setNewExamTags(e.target.value)} className="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" placeholder="VD: HK1, Kho" />
                        </div>
                    </div>
                 </div>

                 <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="flex border-b border-slate-100">
                        <button onClick={() => setActiveTab('MANUAL')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'MANUAL' ? 'border-indigo-600 text-indigo-600 bg-indigo-50' : 'border-transparent text-slate-500'}`}>
                           <Edit size={16} className="inline mr-2"/> Nhập thủ công
                        </button>
                        <button onClick={() => setActiveTab('UPLOAD')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'UPLOAD' ? 'border-green-600 text-green-600 bg-green-50' : 'border-transparent text-slate-500'}`}>
                           <UploadCloud size={16} className="inline mr-2"/> Upload File
                        </button>
                    </div>
                    
                    <div className="p-6">
                        {activeTab === 'MANUAL' ? (
                            <div className="space-y-5">
                                <div className="flex gap-6">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="qtype" checked={qType === QuestionType.MULTIPLE_CHOICE} onChange={() => setQType(QuestionType.MULTIPLE_CHOICE)} className="w-4 h-4 text-indigo-600"/> <span className="font-medium">Trắc nghiệm</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="qtype" checked={qType === QuestionType.TRUE_FALSE_GROUP} onChange={() => setQType(QuestionType.TRUE_FALSE_GROUP)} className="w-4 h-4 text-indigo-600"/> <span className="font-medium">Đúng / Sai</span>
                                    </label>
                                </div>
                                <textarea value={qText} onChange={e => setQText(e.target.value)} rows={3} className="w-full border p-3 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Nhập nội dung câu hỏi..." />
                                
                                {qType === QuestionType.MULTIPLE_CHOICE ? (
                                    <div className="space-y-3 bg-slate-50 p-4 rounded-lg">
                                        {options.map((opt, i) => (
                                            <div key={i} className="flex items-center gap-3">
                                                <input type="radio" name="correctOpt" checked={correctIdx === i} onChange={() => setCorrectIdx(i)} className="w-4 h-4 text-green-600 cursor-pointer"/>
                                                <span className="font-bold text-slate-500 w-4">{String.fromCharCode(65+i)}</span>
                                                <input value={opt} onChange={e => { const n = [...options]; n[i] = e.target.value; setOptions(n); }} className="flex-1 border p-2 rounded text-sm" placeholder={`Phương án ${String.fromCharCode(65+i)}`} />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="space-y-3 bg-slate-50 p-4 rounded-lg">
                                        {statements.map((stmt, i) => (
                                            <div key={i} className="flex items-center gap-3">
                                                <span className="font-bold text-slate-500 w-4">{String.fromCharCode(97+i)}</span>
                                                <input value={stmt.text} onChange={e => { const n = [...statements]; n[i].text = e.target.value; setStatements(n); }} className="flex-1 border p-2 rounded text-sm" placeholder={`Mệnh đề ${String.fromCharCode(97+i)}`} />
                                                <div className="flex bg-white rounded border border-slate-200 p-1">
                                                    <label className={`cursor-pointer px-3 py-1 text-xs font-bold rounded ${stmt.isCorrect ? 'bg-green-100 text-green-700' : 'text-slate-400'}`}><input type="radio" name={`stmt_${i}`} checked={stmt.isCorrect} onChange={() => { const n = [...statements]; n[i].isCorrect = true; setStatements(n); }} className="hidden"/> Đúng</label>
                                                    <label className={`cursor-pointer px-3 py-1 text-xs font-bold rounded ${!stmt.isCorrect ? 'bg-red-100 text-red-700' : 'text-slate-400'}`}><input type="radio" name={`stmt_${i}`} checked={!stmt.isCorrect} onChange={() => { const n = [...statements]; n[i].isCorrect = false; setStatements(n); }} className="hidden"/> Sai</label>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <button onClick={handleAddManualQuestion} className="w-full py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 flex items-center justify-center gap-2"><Plus size={16}/> Thêm câu hỏi</button>
                            </div>
                        ) : (
                            <div className="text-center space-y-4">
                                <div className="border-2 border-dashed border-indigo-200 bg-indigo-50 rounded-xl p-10 flex flex-col items-center justify-center relative hover:bg-indigo-100 transition-colors">
                                    {isProcessing ? <div className="text-indigo-600"><Loader2 size={40} className="animate-spin mb-2"/><p>Đang phân tích...</p></div> : (
                                        <>
                                            <input type="file" accept=".docx, .pdf" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                            <FileType size={48} className="text-indigo-400 mb-3" />
                                            <p className="text-indigo-900 font-medium">Chọn file Word hoặc PDF</p>
                                            <p className="text-xs text-slate-500 mt-2">Hỗ trợ .docx (nhận diện đáp án gạch chân) và .pdf</p>
                                        </>
                                    )}
                                </div>
                                <div className="text-left bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm text-slate-600">
                                    <p className="font-bold mb-1">Quy tắc nhận diện:</p>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li><strong>Trắc nghiệm (4 phương án):</strong> Sử dụng chữ cái <strong>IN HOA</strong> (Ví dụ: <u>A</u>. Nội dung).</li>
                                        <li><strong>Đúng/Sai (Chùm):</strong> Sử dụng chữ cái <strong>thường</strong> a), b), c), d). (Ví dụ: <u>a</u>) Mệnh đề).</li>
                                        <li><strong>Câu hỏi chùm:</strong> Bắt đầu bằng dòng "Đọc thông tin và trả lời...".</li>
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                 </div>
              </div>

              <div className="space-y-6">
                 <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 h-full flex flex-col">
                    <h3 className="font-bold text-slate-800 mb-4 flex justify-between items-center">Danh sách ({questions.length}) <button onClick={() => setQuestions([])} className="text-xs text-red-500 hover:bg-red-50 px-2 py-1 rounded">Xóa hết</button></h3>
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 max-h-[500px]">
                        {questions.map((q, i) => (
                            <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-sm relative group">
                                <button type="button" onClick={() => setQuestions(questions.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 text-slate-400 hover:text-red-500 z-10 p-1 bg-white/50 rounded-full hover:bg-red-50"><X size={16}/></button>
                                {q.passageContent && (
                                    <div className="mb-2 bg-indigo-50 p-2 rounded text-indigo-700 text-xs italic border border-indigo-100 flex gap-2">
                                        <BookOpen size={14} className="flex-shrink-0 mt-0.5"/>
                                        <div className="line-clamp-2">{q.passageContent}</div>
                                    </div>
                                )}
                                <div className="flex gap-2 mb-1">
                                    <span className="font-bold text-indigo-700">Câu {i+1}:</span>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${q.type === QuestionType.TRUE_FALSE_GROUP ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {q.type === QuestionType.TRUE_FALSE_GROUP ? 'Đúng/Sai' : 'Trắc nghiệm'}
                                    </span>
                                </div>
                                <p className="text-slate-700 line-clamp-2">{q.text}</p>
                            </div>
                        ))}
                    </div>
                    <div className="pt-4 mt-4 border-t border-slate-100">
                        <button onClick={handleFinalSave} className="w-full py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 shadow-lg shadow-green-200"><Eye size={20} /> Hoàn tất & Lưu</button>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      );
  }

  return <div>Preview Mode</div>;
};

export default AdminExamManager;