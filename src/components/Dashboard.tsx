import React, { useEffect, useState } from 'react';
import { User, UserRole, Course } from '../types';
import { backend } from '../services/mockBackend';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, PieChart, Pie, Cell } from 'recharts';
import { Users, Filter, BookOpen, Activity, Award, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import CourseCard from './CourseCard';

const Dashboard: React.FC<{ user: User }> = ({ user }) => {
  const [adminStats, setAdminStats] = useState<any>(null);
  const [classFilter, setClassFilter] = useState<string>('ALL');
  const [studentCourses, setStudentCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
        if (user.role === UserRole.ADMIN) {
            const stats = await backend.getAdminStats(classFilter);
            setAdminStats(stats);
        } else {
            const courses = await backend.getCourses();
            setStudentCourses(courses.slice(0, 4)); // Show recent 4
        }
        setLoading(false);
    };
    loadData();
  }, [user.role, classFilter]);

  if (loading) return <div className="p-8 text-center">Đang tải dữ liệu...</div>;

  // --- ADMIN VIEW ---
  if (user.role === UserRole.ADMIN) {
     const data = [
        { name: 'T1', students: 40, active: 24 },
        { name: 'T2', students: 30, active: 13 },
        { name: 'T3', students: 20, active: 98 },
        { name: 'T4', students: 27, active: 39 },
        { name: 'T5', students: 18, active: 48 },
        { name: 'T6', students: 23, active: 38 },
     ];

     return (
       <div className="space-y-6 animate-in fade-in duration-500">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Tổng quan hệ thống</h1>
                <p className="text-slate-500">Thống kê hoạt động và kết quả học tập</p>
            </div>
            <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    <Filter size={16} /> Lọc theo lớp:
                </span>
                <select 
                    value={classFilter}
                    onChange={(e) => setClassFilter(e.target.value)}
                    className="bg-white border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 outline-none"
                >
                    <option value="ALL">Tất cả các lớp</option>
                    <option value="12A1">Lớp 12A1</option>
                    <option value="12A2">Lớp 12A2</option>
                </select>
            </div>
         </div>

         {/* Stats Cards */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
              <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Tổng học sinh</p>
                  <h3 className="text-3xl font-bold text-slate-800">{adminStats?.totalStudents || 0}</h3>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Users size={24}/></div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
               <div>
                   <p className="text-sm font-medium text-slate-500 mb-1">Đang hoạt động</p>
                   <h3 className="text-3xl font-bold text-green-600">{adminStats?.activeNow || 0}</h3>
               </div>
               <div className="p-3 bg-green-50 text-green-600 rounded-lg"><Activity size={24}/></div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
               <div>
                   <p className="text-sm font-medium text-slate-500 mb-1">Điểm TB Hệ thống</p>
                   <h3 className="text-3xl font-bold text-purple-600">{adminStats?.avgSystemScore || 0}</h3>
               </div>
               <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><Award size={24}/></div>
            </div>
             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
               <div>
                   <p className="text-sm font-medium text-slate-500 mb-1">Bài tập đã nộp</p>
                   <h3 className="text-3xl font-bold text-orange-600">842</h3>
               </div>
               <div className="p-3 bg-orange-50 text-orange-600 rounded-lg"><CheckCircle size={24}/></div>
            </div>
         </div>

         {/* Charts */}
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                 <h3 className="font-bold text-slate-800 mb-6">Biểu đồ truy cập & học tập</h3>
                 <div className="h-80">
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} />
                            <Tooltip cursor={{fill: '#f1f5f9'}} />
                            <Bar dataKey="students" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Truy cập" />
                            <Bar dataKey="active" fill="#22c55e" radius={[4, 4, 0, 0]} name="Làm bài" />
                        </BarChart>
                     </ResponsiveContainer>
                 </div>
             </div>
             
             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                 <h3 className="font-bold text-slate-800 mb-4">Top học sinh xuất sắc</h3>
                 <div className="space-y-4">
                     {adminStats?.topStudents?.map((s: any, i: number) => (
                         <div key={i} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg transition-colors">
                             <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs ${i===0?'bg-yellow-400':i===1?'bg-slate-300':'bg-orange-300'}`}>{i+1}</div>
                             <img src={s.avatar} alt="" className="w-10 h-10 rounded-full bg-slate-200" />
                             <div className="flex-1">
                                 <p className="text-sm font-bold text-slate-900">{s.name}</p>
                                 <p className="text-xs text-slate-500">{s.className} • {s.avgScore} điểm</p>
                             </div>
                         </div>
                     ))}
                 </div>
             </div>
         </div>
       </div>
     );
  }

  // --- STUDENT VIEW ---
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row justify-between items-end gap-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 text-white shadow-lg">
            <div>
                <h1 className="text-3xl font-bold mb-2">Xin chào, {user.name}! 👋</h1>
                <p className="text-indigo-100">Bạn có <strong className="text-white">3 bài tập</strong> cần hoàn thành hôm nay.</p>
            </div>
            <div className="flex gap-4">
                <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl text-center min-w-[100px]">
                    <span className="block text-2xl font-bold">8.5</span>
                    <span className="text-xs text-indigo-100">Điểm TB</span>
                </div>
                <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl text-center min-w-[100px]">
                    <span className="block text-2xl font-bold">12</span>
                    <span className="text-xs text-indigo-100">Giờ học</span>
                </div>
            </div>
        </div>

        <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <BookOpen className="text-indigo-600"/> Khóa học của tôi
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {studentCourses.map(course => (
                    <CourseCard key={course.id} course={course} />
                ))}
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><TrendingUp size={20} className="text-green-600"/> Biểu đồ năng lực</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                            {name: 'Bài 1', score: 8}, {name: 'Bài 2', score: 6.5}, {name: 'Bài 3', score: 9}, {name: 'Bài 4', score: 7.5}, {name: 'Bài 5', score: 8.5}
                        ]}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                            <XAxis dataKey="name" tick={{fontSize: 12}} />
                            <YAxis domain={[0, 10]} />
                            <Tooltip />
                            <Bar dataKey="score" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Điểm số"/>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Clock size={20} className="text-orange-500"/> Sắp diễn ra</h3>
                <div className="space-y-4">
                    <div className="flex gap-3 p-3 bg-slate-50 rounded-lg border-l-4 border-red-500">
                        <div className="flex-1">
                            <p className="text-sm font-bold text-slate-800">Thi thử HK1</p>
                            <p className="text-xs text-slate-500">Ngày 20/10 • 45 phút</p>
                        </div>
                        <button className="text-xs font-bold text-indigo-600 bg-white px-2 py-1 rounded border shadow-sm">Chi tiết</button>
                    </div>
                    <div className="flex gap-3 p-3 bg-slate-50 rounded-lg border-l-4 border-blue-500">
                        <div className="flex-1">
                            <p className="text-sm font-bold text-slate-800">Nộp bài tập Bài 3</p>
                            <p className="text-xs text-slate-500">Hạn chót: Hôm nay</p>
                        </div>
                        <button className="text-xs font-bold text-indigo-600 bg-white px-2 py-1 rounded border shadow-sm">Nộp bài</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default Dashboard;