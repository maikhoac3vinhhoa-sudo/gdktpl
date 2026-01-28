
import React, { useState } from 'react';
import { UserRole } from '../types';
import type { User } from '../types';
import { 
  BookOpen, Home, LayoutDashboard, LogOut, User as UserIcon, Menu, 
  Users, GraduationCap, Settings, ClipboardList, MessageCircle, 
  ChevronLeft, ChevronRight, Search, Bell, HelpCircle, 
  Facebook, Youtube, Globe, Mail, Phone, MapPin, FolderOpen
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import AIChatSupport from './AIChatSupport';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile toggle
  const [isCollapsed, setIsCollapsed] = useState(false); // Desktop collapse
  const location = useLocation();

  // Define menus based on Role
  const studentNavItems = [
    { label: 'Trang chủ', icon: <Home size={20} />, path: '/' },
    { label: 'Góc học tập', icon: <MessageCircle size={20} />, path: '/community' },
    { label: 'Khóa học ôn thi', icon: <BookOpen size={20} />, path: '/courses' },
    { label: 'Thư viện tài liệu', icon: <FolderOpen size={20} />, path: '/documents' }, // NEW
    { label: 'Tiến độ học tập', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
    { label: 'Hồ sơ cá nhân', icon: <UserIcon size={20} />, path: '/profile' },
  ];

  const adminNavItems = [
    { label: 'Tổng quan', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
    { label: 'Góc học tập', icon: <MessageCircle size={20} />, path: '/community' },
    { label: 'Quản lý Học sinh', icon: <Users size={20} />, path: '/admin/users' },
    { label: 'Quản lý Khóa học', icon: <GraduationCap size={20} />, path: '/admin/courses' },
    { label: 'Quản lý Đề thi', icon: <ClipboardList size={20} />, path: '/admin/exams' },
    { label: 'Thư viện tài liệu', icon: <FolderOpen size={20} />, path: '/documents' }, // NEW
    { label: 'Hồ sơ Giáo viên', icon: <UserIcon size={20} />, path: '/profile' },
    { label: 'Cài đặt hệ thống', icon: <Settings size={20} />, path: '/settings' },
  ];

  const navItems = user.role === UserRole.ADMIN ? adminNavItems : studentNavItems;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* 
        === SIDEBAR (DESKTOP & MOBILE) === 
      */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200 shadow-sm
          transform transition-all duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
          md:relative md:translate-x-0 
          ${isCollapsed ? 'md:w-20' : 'md:w-64'}
          flex flex-col
        `}
      >
        {/* Sidebar Header / Logo */}
        <div className={`h-16 flex items-center border-b border-slate-100 ${isCollapsed ? 'justify-center px-0' : 'justify-between px-4'}`}>
          {!isCollapsed ? (
             <div className="flex items-center gap-2 text-indigo-700 font-extrabold text-xl tracking-tight animate-in fade-in duration-300">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                   <BookOpen size={18} strokeWidth={3} />
                </div>
                <span>EduGDKTPL</span>
             </div>
          ) : (
             <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-indigo-200 shadow-lg">
                <BookOpen size={20} />
             </div>
          )}
          
          {/* Mobile Close Button */}
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-slate-600">
            <ChevronLeft size={24} />
          </button>
        </div>
        
        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1.5 custom-scrollbar">
          {user.role === UserRole.ADMIN && !isCollapsed && (
            <div className="px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Quản trị viên
            </div>
          )}
          
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)} // Close on mobile click
                className={`
                  flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative
                  ${isActive 
                    ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
                  ${isCollapsed ? 'justify-center' : ''}
                `}
                title={isCollapsed ? item.label : ''}
              >
                <span className={`${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
                    {item.icon}
                </span>
                
                {!isCollapsed && (
                    <span className="whitespace-nowrap overflow-hidden text-sm">{item.label}</span>
                )}

                {/* Collapsed Tooltip (Optional visual enhancement) */}
                {isCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                        {item.label}
                    </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer / Toggle */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
           {!isCollapsed ? (
               <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm mb-3 flex items-center gap-3">
                   <img src={user.avatar} alt="Avatar" className="w-9 h-9 rounded-full bg-slate-200 object-cover flex-shrink-0" />
                   <div className="min-w-0 overflow-hidden">
                        <p className="text-sm font-bold text-slate-800 truncate">{user.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user.role === 'ADMIN' ? 'Giáo viên' : 'Học sinh'}</p>
                   </div>
               </div>
           ) : (
               <div className="flex justify-center mb-3">
                   <img src={user.avatar} alt="Avatar" className="w-8 h-8 rounded-full bg-slate-200 object-cover ring-2 ring-white shadow-sm" title={user.name} />
               </div>
           )}

           <div className="flex gap-2">
               <button 
                onClick={onLogout}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors ${isCollapsed ? 'px-0' : 'px-4'}`}
                title="Đăng xuất"
               >
                 <LogOut size={18} />
                 {!isCollapsed && <span className="text-xs font-bold">Thoát</span>}
               </button>
               
               <button 
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden md:flex items-center justify-center w-10 py-2 bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 rounded-lg transition-all shadow-sm"
                title={isCollapsed ? "Mở rộng" : "Thu gọn"}
               >
                 {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
               </button>
           </div>
        </div>
      </aside>

      {/* 
        === MAIN CONTENT WRAPPER === 
      */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50">
        
        {/* 1. Header */}
        <header className="h-16 bg-white border-b border-slate-200 shadow-sm sticky top-0 z-30 px-4 md:px-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
                {/* Mobile Menu Trigger */}
                <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
                    <Menu size={24} />
                </button>
                
                {/* Search Bar (Desktop) */}
                <div className="hidden md:flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-300 transition-all w-64 lg:w-96">
                    <Search size={18} className="text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Tìm khóa học, đề thi, tài liệu..." 
                        className="bg-transparent border-none outline-none text-sm w-full text-slate-700 placeholder:text-slate-400"
                    />
                </div>
            </div>

            <div className="flex items-center gap-3 md:gap-6">
                <button className="relative p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors">
                    <Bell size={20} />
                    <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                </button>
                <div className="h-6 w-px bg-slate-200 hidden md:block"></div>
                <button className="hidden md:flex items-center gap-2 text-slate-600 hover:text-indigo-600 text-sm font-medium transition-colors">
                    <HelpCircle size={18} /> Hỗ trợ
                </button>
                {/* User Dropdown Trigger (Simplified) */}
                <Link to="/profile" className="flex items-center gap-3 hover:bg-slate-50 p-1.5 pr-3 rounded-full transition-colors border border-transparent hover:border-slate-100">
                    <img src={user.avatar} className="w-8 h-8 rounded-full border border-slate-200" alt="" />
                    <span className="hidden md:block text-sm font-bold text-slate-700">{user.name}</span>
                </Link>
            </div>
        </header>

        {/* 2. Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto scroll-smooth custom-scrollbar flex flex-col relative">
            {/* Page Content */}
            <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
                {children}
            </div>

            {/* 3. Footer */}
            <footer className="bg-slate-900 text-slate-300 pt-12 pb-6 mt-12 border-t border-slate-800">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-8">
                    {/* Brand */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-white font-bold text-xl">
                            <BookOpen className="text-indigo-500" /> EduGDKTPL-12
                        </div>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            Nền tảng ôn tập và kiểm tra kiến thức môn Giáo dục Kinh tế & Pháp luật 12 hàng đầu. Bám sát chương trình GDPT 2018.
                        </p>
                        <div className="flex gap-4 pt-2">
                            <a href="#" className="p-2 bg-slate-800 rounded-full hover:bg-indigo-600 hover:text-white transition-all"><Facebook size={18}/></a>
                            <a href="#" className="p-2 bg-slate-800 rounded-full hover:bg-red-600 hover:text-white transition-all"><Youtube size={18}/></a>
                            <a href="#" className="p-2 bg-slate-800 rounded-full hover:bg-blue-400 hover:text-white transition-all"><Globe size={18}/></a>
                        </div>
                    </div>

                    {/* Links 1 */}
                    <div>
                        <h4 className="text-white font-bold mb-4">Khám phá</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link to="/courses" className="hover:text-indigo-400 transition-colors">Thư viện khóa học</Link></li>
                            <li><Link to="/community" className="hover:text-indigo-400 transition-colors">Diễn đàn hỏi đáp</Link></li>
                            <li><a href="#" className="hover:text-indigo-400 transition-colors">Ngân hàng đề thi</a></li>
                            <li><a href="#" className="hover:text-indigo-400 transition-colors">Tài liệu tham khảo</a></li>
                        </ul>
                    </div>

                    {/* Links 2 */}
                    <div>
                        <h4 className="text-white font-bold mb-4">Hỗ trợ</h4>
                        <ul className="space-y-2 text-sm">
                            <li><a href="#" className="hover:text-indigo-400 transition-colors">Hướng dẫn sử dụng</a></li>
                            <li><a href="#" className="hover:text-indigo-400 transition-colors">Chính sách bảo mật</a></li>
                            <li><a href="#" className="hover:text-indigo-400 transition-colors">Điều khoản dịch vụ</a></li>
                            <li><a href="#" className="hover:text-indigo-400 transition-colors">Câu hỏi thường gặp</a></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="text-white font-bold mb-4">Liên hệ</h4>
                        <ul className="space-y-3 text-sm">
                            <li className="flex items-start gap-3">
                                <MapPin size={18} className="text-indigo-500 shrink-0" />
                                <span>Tầng 5, Tòa nhà EduBuilding, Cầu Giấy, Hà Nội</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone size={18} className="text-indigo-500 shrink-0" />
                                <span>1900 1234 5678</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail size={18} className="text-indigo-500 shrink-0" />
                                <span>support@edugdktpl.vn</span>
                            </li>
                        </ul>
                    </div>
                </div>
                
                <div className="border-t border-slate-800 pt-6 px-6 text-center text-xs text-slate-500 max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <p>© 2025 EduGDKTPL System. All rights reserved.</p>
                    <p>Designed with ❤️ for MaiVanKhoa.</p>
                </div>
            </footer>
        </main>
      </div>

      {/* AI Chatbot Widget */}
      <AIChatSupport />

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;
