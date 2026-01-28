import React, { useState } from 'react';
import { Question, QuestionType, QuizResult } from '../types';
import { backend } from '../services/mockBackend';
import { AlertCircle, Check, X, RefreshCw, Send, BookOpen } from 'lucide-react';

interface QuizTakerProps {
  quizId: string;
  questions: Question[];
  onComplete: (result: QuizResult) => void;
}

const QuizTaker: React.FC<QuizTakerProps> = ({ quizId, questions, onComplete }) => {
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({}); // qId -> selected option index or boolean map
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [maxScore, setMaxScore] = useState(0);

  const currentQuestion = questions[currentQIndex];

  // Handle Answer Selection
  const handleSelectOption = (qId: string, optionIndex: number) => {
    if (isSubmitted) return;
    setAnswers(prev => ({ ...prev, [qId]: optionIndex }));
  };

  const handleTrueFalseToggle = (qId: string, statementId: string, value: boolean) => {
    if (isSubmitted) return;
    setAnswers(prev => {
      const current = prev[qId] || {};
      return {
        ...prev,
        [qId]: { ...current, [statementId]: value }
      };
    });
  };

  // Submit Logic
  const handleSubmit = async () => {
    let rawScore = 0;
    let totalMaxScore = 0; 

    questions.forEach(q => {
      if (q.type === QuestionType.MULTIPLE_CHOICE) {
        // Dạng 1: Chọn 1 đáp án đúng -> 0.25đ
        totalMaxScore += 0.25;
        if (answers[q.id] === q.correctOptionIndex) {
          rawScore += 0.25;
        }
      } else if (q.type === QuestionType.TRUE_FALSE_GROUP) {
        // Dạng 2: Đúng/Sai theo nhóm 4 ý -> Max 1.0đ
        totalMaxScore += 1.0;
        
        const userAns = answers[q.id] || {};
        let correctStatementsCount = 0;
        
        q.statements?.forEach(stmt => {
           // Check if user answer matches correct answer
           if (userAns[stmt.id] === stmt.isCorrect) {
             correctStatementsCount++;
           }
        });

        // Quy tắc làm tròn điểm theo Số ý đúng trong 1 câu hỏi
        if (correctStatementsCount === 1) rawScore += 0.1;
        else if (correctStatementsCount === 2) rawScore += 0.25;
        else if (correctStatementsCount === 3) rawScore += 0.5;
        else if (correctStatementsCount === 4) rawScore += 1.0;
      }
    });

    // Làm tròn 2 chữ số thập phân
    const finalScore = Math.round(rawScore * 100) / 100; 
    setScore(finalScore);
    setMaxScore(totalMaxScore);
    setIsSubmitted(true);
    
    const result = {
      quizId,
      score: finalScore,
      maxScore: totalMaxScore,
      completedAt: new Date().toISOString()
    };
    
    // Save to real backend storage
    await backend.submitQuizResult(result);

    onComplete(result);
  };

  const handleNext = () => {
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(currentQIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentQIndex > 0) {
      setCurrentQIndex(currentQIndex - 1);
    }
  };

  // Renderers
  const renderMultipleChoice = (q: Question) => {
    const userSelected = answers[q.id];
    return (
      <div className="space-y-3">
        {q.options?.map((opt, idx) => {
          let styles = "p-4 rounded-lg border cursor-pointer flex items-center transition-all ";
          
          if (isSubmitted) {
            if (idx === q.correctOptionIndex) styles += "bg-green-100 border-green-500 text-green-900 ";
            else if (idx === userSelected && idx !== q.correctOptionIndex) styles += "bg-red-100 border-red-500 text-red-900 ";
            else styles += "border-slate-200 bg-white opacity-60 ";
          } else {
            if (userSelected === idx) styles += "bg-indigo-50 border-indigo-500 shadow-sm ";
            else styles += "bg-white border-slate-200 hover:bg-slate-50 ";
          }

          return (
            <div key={idx} onClick={() => handleSelectOption(q.id, idx)} className={styles}>
               <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center
                  ${userSelected === idx || (isSubmitted && idx === q.correctOptionIndex) ? 'border-current' : 'border-slate-300'}
               `}>
                 {(userSelected === idx || (isSubmitted && idx === q.correctOptionIndex)) && <div className="w-2.5 h-2.5 rounded-full bg-current" />}
               </div>
               <span className="flex-1">{String.fromCharCode(65 + idx)}. {opt}</span>
               {isSubmitted && idx === q.correctOptionIndex && <Check size={18} className="text-green-600" />}
               {isSubmitted && idx === userSelected && idx !== q.correctOptionIndex && <X size={18} className="text-red-600" />}
            </div>
          );
        })}
      </div>
    );
  };

  const renderTrueFalse = (q: Question) => {
    const userAns = answers[q.id] || {};
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-12 gap-4 text-sm font-semibold text-slate-500 border-b pb-2">
            <div className="col-span-8">Mệnh đề</div>
            <div className="col-span-2 text-center">Đúng</div>
            <div className="col-span-2 text-center">Sai</div>
        </div>
        {q.statements?.map((stmt) => {
           const currentVal = userAns[stmt.id];
           const isCorrect = isSubmitted ? currentVal === stmt.isCorrect : null;
           
           return (
             <div key={stmt.id} className={`grid grid-cols-12 gap-4 items-center p-3 rounded-md ${isSubmitted ? (isCorrect ? 'bg-green-50' : 'bg-red-50') : 'hover:bg-slate-50'}`}>
                <div className="col-span-8">{stmt.text}</div>
                <div className="col-span-2 flex justify-center">
                  <button 
                    onClick={() => handleTrueFalseToggle(q.id, stmt.id, true)}
                    className={`w-6 h-6 rounded border flex items-center justify-center ${currentVal === true ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-300'}`}
                    disabled={isSubmitted}
                  >
                    {currentVal === true && <Check size={14} />}
                  </button>
                </div>
                <div className="col-span-2 flex justify-center">
                  <button 
                    onClick={() => handleTrueFalseToggle(q.id, stmt.id, false)}
                    className={`w-6 h-6 rounded border flex items-center justify-center ${currentVal === false ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-300'}`}
                    disabled={isSubmitted}
                  >
                    {currentVal === false && <Check size={14} />}
                  </button>
                </div>
                {isSubmitted && (
                   <div className="col-span-12 text-xs font-semibold mt-1">
                      {isCorrect ? <span className="text-green-600 flex items-center gap-1"><Check size={12}/> Chính xác</span> : <span className="text-red-600 flex items-center gap-1"><X size={12}/> Sai (Đáp án: {stmt.isCorrect ? 'Đúng' : 'Sai'})</span>}
                   </div>
                )}
             </div>
           )
        })}
      </div>
    );
  };

  if (questions.length === 0) return <div className="text-center p-8 text-slate-500">Chưa có câu hỏi nào.</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">Bài tập trắc nghiệm</h2>
        <div className="text-sm font-medium text-slate-500">
          Câu hỏi {currentQIndex + 1}/{questions.length}
        </div>
      </div>

      <div className="w-full bg-slate-100 h-1.5 rounded-full mb-8">
        <div 
           className="bg-indigo-600 h-1.5 rounded-full transition-all"
           style={{ width: `${((currentQIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      <div className="mb-8 min-h-[300px]">
        {currentQuestion.passageContent && (
             <div className="mb-6 bg-slate-50 p-4 rounded-xl border-l-4 border-indigo-500 text-slate-700 text-sm whitespace-pre-line shadow-sm">
                 <h4 className="font-bold text-indigo-700 flex items-center gap-2 mb-2"><BookOpen size={16}/> Thông tin chung</h4>
                 {currentQuestion.passageContent}
             </div>
        )}

        <h3 className="text-lg font-medium text-slate-900 mb-4 flex gap-3">
          <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-sm h-fit mt-0.5 whitespace-nowrap">Câu {currentQIndex + 1}</span>
          <span>{currentQuestion.text}</span>
        </h3>
        
        {currentQuestion.type === QuestionType.MULTIPLE_CHOICE 
           ? renderMultipleChoice(currentQuestion) 
           : renderTrueFalse(currentQuestion)
        }

        {isSubmitted && currentQuestion.explanation && (
          <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h4 className="flex items-center gap-2 font-semibold text-blue-800 mb-1">
              <AlertCircle size={16} /> Giải thích chi tiết
            </h4>
            <p className="text-blue-700 text-sm">{currentQuestion.explanation}</p>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center pt-6 border-t border-slate-100">
         <button 
           onClick={handlePrev} 
           disabled={currentQIndex === 0}
           className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50"
         >
           Quay lại
         </button>

         {!isSubmitted ? (
            currentQIndex === questions.length - 1 ? (
              <button 
                onClick={handleSubmit}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
              >
                <Send size={18} /> Nộp bài
              </button>
            ) : (
              <button 
                onClick={handleNext}
                className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
              >
                Câu tiếp theo
              </button>
            )
         ) : (
            <div className="flex items-center gap-4">
              <span className="text-lg font-bold text-slate-900">Điểm: {score}/{maxScore}</span>
              {currentQIndex < questions.length - 1 && (
                <button 
                  onClick={handleNext}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg"
                >
                  Xem tiếp
                </button>
              )}
            </div>
         )}
      </div>
    </div>
  );
};

export default QuizTaker;