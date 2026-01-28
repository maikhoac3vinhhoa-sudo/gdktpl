
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { backend } from '../services/mockBackend';
import { Sparkles, Bot, User as UserIcon, Loader2, Minimize2, Send } from 'lucide-react';
import type { ChatMessage } from '../types';

const AIChatSupport: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
      { id: 'welcome', role: 'model', text: 'Xin chào! Mình là trợ lý AI EduGDKTPL. Mình có thể giúp gì cho bạn về môn Kinh tế & Pháp luật hôm nay?', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = async () => {
      if (!input.trim()) return;

      const userMsg: ChatMessage = {
          id: `u_${Date.now()}`,
          role: 'user',
          text: input,
          timestamp: new Date()
      };

      // Add user message to UI state immediately
      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      setInput('');
      setIsTyping(true);

      try {
          // 1. Retrieve Internal Knowledge Context
          const context = await backend.getKnowledgeContext();
          
          // 2. Initialize Gemini with process.env.API_KEY
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          
          // 3. Construct System Prompt
          const systemInstruction = `
            Bạn là một trợ lý AI giáo dục chuyên về môn Giáo dục Kinh tế và Pháp luật lớp 12 (Chương trình GDPT 2018).
            Nhiệm vụ của bạn là giải đáp thắc mắc của học sinh dựa trên kiến thức được cung cấp.
            
            DỮ LIỆU KIẾN THỨC NỘI BỘ (Ưu tiên dùng thông tin này):
            ${context}
            
            QUY TẮC TRẢ LỜI:
            1. Nếu thông tin có trong Dữ liệu nội bộ, hãy dùng nó để trả lời chi tiết.
            2. Nếu không tìm thấy trong Dữ liệu nội bộ, hãy sử dụng kiến thức rộng lớn của bạn về môn học này để trả lời chính xác, ngắn gọn và dễ hiểu.
            3. Luôn giữ giọng điệu thân thiện, khuyến khích học tập.
            4. Trả lời bằng Tiếng Việt.
            5. Nếu câu hỏi không liên quan đến môn học, hãy lịch sự từ chối và hướng học sinh quay lại bài học.
          `;

          // 4. Prepare History for Context-Aware Chat
          const apiContents = updatedMessages
              .filter(m => m.id !== 'welcome')
              .map(m => ({
                  role: m.role,
                  parts: [{ text: m.text }]
              }));

          // 5. Generate Content
          const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: apiContents,
            config: {
                systemInstruction: systemInstruction,
            }
          });

          const aiText = response.text || "Xin lỗi, hiện tại mình đang gặp chút trục trặc khi kết nối. Bạn thử lại sau nhé!";

          const aiMsg: ChatMessage = {
              id: `m_${Date.now()}`,
              role: 'model',
              text: aiText,
              timestamp: new Date()
          };
          setMessages(prev => [...prev, aiMsg]);

      } catch (error: any) {
          console.error("AI Error:", error);
          let errorMessage = "Rất tiếc, hệ thống đang bận. Vui lòng thử lại sau.";
          
          if (error.message?.includes("API key")) {
              errorMessage = "Lỗi cấu hình API Key. Vui lòng kiểm tra file .env";
          }

          const errorMsg: ChatMessage = {
              id: `err_${Date.now()}`,
              role: 'model',
              text: errorMessage,
              timestamp: new Date()
          };
          setMessages(prev => [...prev, errorMsg]);
      } finally {
          setIsTyping(false);
      }
  };

  return (
    <>
        {/* Floating Trigger Button */}
        {!isOpen && (
            <button 
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white p-4 rounded-full shadow-lg shadow-indigo-500/40 transition-all hover:scale-110 flex items-center justify-center animate-in zoom-in duration-300"
            >
                <Sparkles size={24} className="absolute animate-pulse" />
                <Bot size={28} className="relative z-10" />
            </button>
        )}

        {/* Chat Window */}
        {isOpen && (
            <div className="fixed bottom-6 right-6 z-50 w-full max-w-[380px] h-[550px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex items-center justify-between text-white shadow-md z-10">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                            <Bot size={20} className="text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm">Trợ lý EduGDKTPL</h3>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                <span className="text-[10px] text-indigo-100 font-medium">Luôn sẵn sàng</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-1">
                        <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-indigo-100 hover:text-white" title="Thu nhỏ">
                            <Minimize2 size={18} />
                        </button>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 custom-scrollbar">
                    {messages.map((msg) => (
                        <div 
                            key={msg.id} 
                            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                        >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-sm ${msg.role === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'}`}>
                                {msg.role === 'user' ? <UserIcon size={16} /> : <Bot size={16} />}
                            </div>
                            <div 
                                className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                    msg.role === 'user' 
                                        ? 'bg-indigo-600 text-white rounded-tr-none' 
                                        : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                                }`}
                            >
                                <div className="whitespace-pre-line">{msg.text}</div>
                                <div className={`text-[10px] mt-1 text-right ${msg.role === 'user' ? 'text-indigo-200' : 'text-slate-400'}`}>
                                    {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    {isTyping && (
                         <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                                <Bot size={16} />
                            </div>
                            <div className="bg-white border border-slate-100 p-3 rounded-2xl rounded-tl-none text-slate-500 shadow-sm flex items-center gap-2">
                                <Loader2 size={16} className="animate-spin text-indigo-600"/>
                                <span className="text-xs font-medium">Đang suy nghĩ...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-3 bg-white border-t border-slate-100">
                    <div className="relative flex items-center">
                        <input 
                            type="text" 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Hỏi về bài học, đề thi..." 
                            className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-medium transition-all"
                            disabled={isTyping}
                        />
                        <button 
                            onClick={handleSend}
                            disabled={!input.trim() || isTyping}
                            className="absolute right-2 p-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-lg transition-all shadow-sm"
                        >
                            <Send size={16} />
                        </button>
                    </div>
                    <div className="text-center mt-2">
                        <p className="text-[10px] text-slate-400">
                            AI có thể mắc lỗi. Hãy kiểm tra lại thông tin quan trọng.
                        </p>
                    </div>
                </div>
            </div>
        )}
    </>
  );
};

export default AIChatSupport;


