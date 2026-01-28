import React, { useState, useEffect } from 'react';
import { UserRole, User, UserStatus } from '../types';
import { backend } from '../services/mockBackend';
import { BookOpen, CheckCircle, TrendingUp, Users, Lock, User as UserIcon, Mail, AlertCircle, Loader2, Check, Key } from 'lucide-react';

interface LoginProps {
  onLogin: (username: string, pass: string, role: UserRole) => Promise<void>;
  isLoading: boolean;
}

const Login: React.FC<LoginProps> = ({ onLogin, isLoading }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [role, setRole] = useState<UserRole>(UserRole.STUDENT);
  
  // Login Form
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  // Register Form
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPass, setRegConfirmPass] = useState('');
  const [regClass, setRegClass] = useState('12A1');
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
      const savedUser = localStorage.getItem('saved_username');
      const savedPass = localStorage.getItem('saved_password');
      if (savedUser && savedPass) {
          setUsername(savedUser);
          setPassword(savedPass);
          setRememberMe(true);
      }
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username || !password) { setError('Vui lòng nhập tên đăng nhập và mật khẩu.'); return; }
    try {
      await onLogin(username.trim(), password.trim(), role);
      if (rememberMe) { localStorage.setItem('saved_username', username.trim()); localStorage.setItem('saved_password', password.trim()); } 
      else { localStorage.removeItem('saved_username'); localStorage.removeItem('saved_password'); }
    } catch (err: any) { setError(err.message || 'Đăng nhập thất bại.'); }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
      e.preventDefault(); setError(''); setSuccessMsg('');
      if (!regName || !regUsername || !regPassword) { setError('Vui lòng điền đầy đủ thông tin bắt buộc.'); return; }
      if (regPassword !== regConfirmPass) { setError('Mật khẩu xác nhận không khớp.'); return; }
      try {
          const newUser: User = { 
              id: `u_${Date.now()}`, 
              name: regName, 
              username: regUsername.trim(), 
              password: regPassword.trim(), 
              role: role, 
              className: role === UserRole.STUDENT ? regClass : undefined, 
              status: UserStatus.PENDING, 
              avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(regName)}&background=random` 
          };
          await backend.createUser(newUser);
          setSuccessMsg('Đăng ký thành công! Tài khoản đang chờ giáo viên duyệt.');
          setRegName(''); setRegUsername(''); setRegPassword(''); setRegConfirmPass('');
          setTimeout(() => { setIsRegistering(false); setSuccessMsg(''); }, 3000);
      } catch (err: any) { setError(err.message || 'Đăng ký thất bại.'); }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 lg:p-0">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col md:flex-row min-h-[600px] animate-in fade-in zoom-in duration-500">
        {/* Left Side */}
        <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-indigo-600 to-purple-700 text-white p-12 flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none"><svg width="100%" height="100%"><defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/></pattern></defs><rect width="100%" height="100%" fill="url(#grid)" /></svg></div>
            <div className="relative z-10"><div className="flex items-center gap-3 mb-8"><div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm border border-white/30"><BookOpen className="text-white" size={28} /></div><span className="text-2xl font-bold tracking-tight">EduGDKTPL</span></div><h1 className="text-4xl font-bold leading-tight mb-4 text-white">{isRegistering ? "Tham gia cộng đồng học tập!" : "Học tập hiệu quả, Tương lai vững chắc."}</h1><p className="text-indigo-100 text-lg opacity-90 leading-relaxed">Hệ thống ôn tập và kiểm tra kiến thức môn Giáo dục Kinh tế & Pháp luật - Lớp 12 bám sát chương trình mới.</p></div>
            <div className="relative z-10 space-y-4 mt-8"><div className="flex items-start gap-4 bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors"><CheckCircle className="text-green-300 flex-shrink-0 mt-0.5" /><div><h4 className="font-bold text-sm">Ngân hàng câu hỏi phong phú</h4><p className="text-xs text-indigo-100 opacity-80">Hàng ngàn câu trắc nghiệm cập nhật liên tục.</p></div></div><div className="flex items-start gap-4 bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors"><TrendingUp className="text-pink-300 flex-shrink-0 mt-0.5" /><div><h4 className="font-bold text-sm">Thống kê tiến độ thông minh</h4><p className="text-xs text-indigo-100 opacity-80">Theo dõi sự tiến bộ và gợi ý lộ trình ôn thi.</p></div></div></div>
            <div className="relative z-10 text-xs text-indigo-200 mt-8 flex justify-between items-center"><span>© 2025 EduSystem</span><span>Version 1.0.0</span></div>
        </div>
        {/* Right Side */}
        <div className="w-full md:w-1/2 p-8 lg:p-12 flex flex-col justify-center bg-white relative">
            <div className="mb-8"><h2 className="text-3xl font-bold text-slate-900 mb-2">{isRegistering ? 'Tạo tài khoản' : 'Đăng nhập'}</h2><p className="text-slate-500 text-sm">{isRegistering ? 'Điền thông tin bên dưới để đăng ký tài khoản mới.' : 'Chào mừng trở lại! Vui lòng nhập thông tin.'}</p></div>
            <div className="flex bg-slate-100 p-1 rounded-xl mb-6 relative"><button onClick={() => setRole(UserRole.STUDENT)} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 relative z-10 ${role === UserRole.STUDENT ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}><Users size={18} /> Học sinh</button><button onClick={() => setRole(UserRole.ADMIN)} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 relative z-10 ${role === UserRole.ADMIN ? 'text-pink-600' : 'text-slate-500 hover:text-slate-700'}`}><Lock size={18} /> Giáo viên</button><div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-lg shadow-sm transition-all duration-300 ease-in-out ${role === UserRole.ADMIN ? 'translate-x-[calc(100%+4px)]' : 'translate-x-0'}`}/></div>
            {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2 border border-red-100 animate-in fade-in slide-in-from-top-2"><AlertCircle size={16}/> {error}</div>}
            {successMsg && <div className="mb-4 p-3 bg-green-50 text-green-600 text-sm rounded-lg flex items-center gap-2 border border-green-100 animate-in fade-in slide-in-from-top-2"><CheckCircle size={16}/> {successMsg}</div>}
            <form onSubmit={isRegistering ? handleRegisterSubmit : handleLoginSubmit} className="space-y-4">
                {isRegistering && (<div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4"><div className="relative group"><UserIcon className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} /><input type="text" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium" placeholder="Họ và tên hiển thị" value={regName} onChange={e => setRegName(e.target.value)} /></div>{role === UserRole.STUDENT && (<div className="relative group"><Users className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} /><select className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none font-medium text-slate-600 cursor-pointer" value={regClass} onChange={e => setRegClass(e.target.value)}><option value="12A1">Lớp 12A1</option><option value="12A2">Lớp 12A2</option><option value="12A3">Lớp 12A3</option><option value="11A1">Lớp 11A1</option><option value="10A1">Lớp 10A1</option></select></div>)}</div>)}
                <div className="relative group"><Mail className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} /><input type="text" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium" placeholder={isRegistering ? "Tên đăng nhập (Username)" : "Tên đăng nhập"} value={isRegistering ? regUsername : username} onChange={e => isRegistering ? setRegUsername(e.target.value) : setUsername(e.target.value)} /></div>
                <div className="relative group"><Lock className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} /><input type="password" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium" placeholder="Mật khẩu" value={isRegistering ? regPassword : password} onChange={e => isRegistering ? setRegPassword(e.target.value) : setPassword(e.target.value)} /></div>
                {isRegistering && (<div className="relative group animate-in fade-in slide-in-from-bottom-4 duration-500"><CheckCircle className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} /><input type="password" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium" placeholder="Xác nhận mật khẩu" value={regConfirmPass} onChange={e => setRegConfirmPass(e.target.value)} /></div>)}
                {!isRegistering && (<div className="flex items-center justify-between text-sm"><label className="flex items-center gap-2 cursor-pointer text-slate-600 hover:text-slate-800 select-none"><div className="relative flex items-center"><input type="checkbox" className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-slate-300 shadow-sm checked:border-indigo-600 checked:bg-indigo-600 focus:ring-2 focus:ring-indigo-500/20 transition-all" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} /><Check size={10} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" /></div> Ghi nhớ đăng nhập</label><button type="button" onClick={() => alert("Liên hệ giáo viên.")} className="text-indigo-600 hover:text-indigo-700 font-bold hover:underline transition-colors">Quên mật khẩu?</button></div>)}
                <button type="submit" disabled={isLoading} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-4 transform active:scale-[0.98]">{isLoading ? <Loader2 className="animate-spin" size={20} /> : (isRegistering ? 'Hoàn tất đăng ký' : 'Đăng nhập ngay')}</button>
            </form>
            
            {/* Demo Credentials Hint */}
            {!isRegistering && (
                <div className="mt-6 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-500">
                    <p className="font-bold flex items-center gap-1 mb-1 text-slate-700"><Key size={12}/> Tài khoản dùng thử (Demo):</p>
                    <div className="grid grid-cols-2 gap-2">
                        <div onClick={() => { setUsername('giaovien1'); setPassword('123'); setRole(UserRole.ADMIN); }} className="cursor-pointer hover:bg-white p-1 rounded transition-colors">
                            <span className="font-bold text-pink-600">Giáo viên:</span> giaovien1 / 123
                        </div>
                        <div onClick={() => { setUsername('hs1'); setPassword('123'); setRole(UserRole.STUDENT); }} className="cursor-pointer hover:bg-white p-1 rounded transition-colors">
                            <span className="font-bold text-indigo-600">Học sinh:</span> hs1 / 123
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-8 text-center"><p className="text-slate-600 text-sm">{isRegistering ? "Đã có tài khoản?" : "Chưa có tài khoản?"} {' '}<button onClick={() => { setIsRegistering(!isRegistering); setError(''); setSuccessMsg(''); }} className="text-indigo-600 font-bold hover:text-indigo-700 hover:underline transition-colors">{isRegistering ? "Đăng nhập" : "Đăng ký miễn phí"}</button></p></div>
        </div>
      </div>
    </div>
  );
};

export default Login;