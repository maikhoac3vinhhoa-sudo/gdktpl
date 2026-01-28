import React, { useState, useEffect } from 'react';
import { User, UserRole, UserStatus } from '../types';
import { backend } from '../services/mockBackend';
import { Search, Plus, Trash2, Edit, Check, Eye, Ban, AlertCircle, CheckCircle, Lock, Users, X, FileSpreadsheet, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';

const AdminUserManager: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [classFilter, setClassFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'CREATE' | 'EDIT' | 'VIEW'>('CREATE');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<User>>({});
  
  // Import State
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
      fetchUsers();
  }, []);

  const fetchUsers = async () => {
      setLoading(true);
      const data = await backend.getAllUsers();
      setUsers(data);
      setLoading(false);
  };

  const handleDelete = async (id: string) => {
      if (confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
          await backend.deleteUser(id);
          fetchUsers();
      }
  };

  const handleActivate = async (user: User) => {
      if (confirm(`Kích hoạt tài khoản cho ${user.name}?`)) {
          await backend.updateUserProfile(user.id, { status: UserStatus.ACTIVE });
          await backend.importUsers([ {...user, status: UserStatus.ACTIVE} ]);
          fetchUsers();
      }
  };

  const handleSaveUser = async () => {
      if (!formData.name || !formData.username) return alert("Vui lòng nhập đủ thông tin");
      
      if (modalMode === 'CREATE') {
          const newUser: User = {
              id: `u${Date.now()}`,
              name: formData.name,
              username: formData.username,
              password: formData.password || '123456',
              role: formData.role || UserRole.STUDENT,
              className: formData.className || '12A1',
              status: (formData.status as UserStatus) || UserStatus.ACTIVE,
              avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=random`
          };
          await backend.createUser(newUser);
          if (newUser.status === UserStatus.ACTIVE) {
              await backend.importUsers([newUser]);
          }
      } else if (modalMode === 'EDIT' && selectedUser) {
          const updated = await backend.updateUserProfile(selectedUser.id, formData);
          if (updated.status === UserStatus.ACTIVE) {
               await backend.importUsers([updated]);
          }
      }

      setIsModalOpen(false);
      fetchUsers();
  };

  const openModal = (mode: 'CREATE' | 'EDIT' | 'VIEW', user?: User) => {
      setModalMode(mode);
      setSelectedUser(user || null);
      if (user) {
          setFormData({ ...user });
      } else {
          setFormData({ role: UserRole.STUDENT, status: UserStatus.ACTIVE, className: '12A1' });
      }
      setIsModalOpen(true);
  };
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const importedUsers: User[] = jsonData.map((row: any) => {
        // Mapping theo cấu trúc file: STT, Họ và Tên, Lớp, User, Pass, Role
        const roleStr = row['Role'] ? String(row['Role']).toUpperCase().trim() : '';
        const role = (roleStr === 'GV' || roleStr === 'ADMIN') ? UserRole.ADMIN : UserRole.STUDENT;

        return {
          id: `u_imp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: row['Họ và Tên'] || 'No Name',
          username: row['User'] ? String(row['User']) : undefined,
          password: row['Pass'] ? String(row['Pass']) : '123456',
          role: role,
          className: row['Lớp'] ? String(row['Lớp']) : undefined,
          status: UserStatus.ACTIVE,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(row['Họ và Tên'] || 'User')}&background=random`
        };
      });
      
      const validUsers = importedUsers.filter(u => u.username && u.name); // Simple validation

      if (validUsers.length > 0) {
          await backend.importUsers(validUsers);
          alert(`Đã nhập thành công ${validUsers.length} người dùng!`);
          fetchUsers();
      } else {
          alert('Không tìm thấy dữ liệu hợp lệ. Vui lòng kiểm tra cấu trúc file (Họ và Tên, User, Pass, Role, Lớp).');
      }

    } catch (err) {
      console.error(err);
      alert('Lỗi khi đọc file Excel. Vui lòng đảm bảo đúng định dạng.');
    } finally {
        setIsImporting(false);
    }
    // Reset input
    e.target.value = '';
  };

  const filteredUsers = users.filter(u => {
      const matchSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.username?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
      const matchClass = classFilter === 'ALL' || u.className === classFilter;
      const matchStatus = statusFilter === 'ALL' || (u.status || UserStatus.ACTIVE) === statusFilter;
      return matchSearch && matchRole && matchClass && matchStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
              <h1 className="text-2xl font-bold text-slate-900">Quản lý Người dùng</h1>
              <p className="text-slate-500">Học sinh, Giáo viên và Quản trị viên</p>
          </div>
          <div className="flex gap-2">
            <label className={`bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 shadow-lg shadow-green-200 transition-all cursor-pointer ${isImporting ? 'opacity-70 pointer-events-none' : ''}`}>
                {isImporting ? <Loader2 size={18} className="animate-spin"/> : <FileSpreadsheet size={18} />}
                <span>{isImporting ? 'Đang xử lý...' : 'Nhập Excel'}</span>
                <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} disabled={isImporting}/>
            </label>
            <button 
               onClick={() => openModal('CREATE')} 
               className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
            >
                <Plus size={18} /> Thêm mới
            </button>
          </div>
       </div>

       {/* Toolbar */}
       <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4">
           <div className="flex-1 relative">
               <Search size={18} className="absolute left-3 top-3 text-slate-400" />
               <input 
                  type="text" 
                  placeholder="Tìm kiếm theo tên hoặc tài khoản..." 
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
               />
           </div>
           <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
               <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[120px]">
                   <option value="ALL">Tất cả vai trò</option>
                   <option value={UserRole.STUDENT}>Học sinh</option>
                   <option value={UserRole.ADMIN}>Giáo viên</option>
               </select>
               <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[100px]">
                   <option value="ALL">Tất cả lớp</option>
                   <option value="12A1">Lớp 12A1</option>
                   <option value="12A2">Lớp 12A2</option>
                   <option value="12A3">Lớp 12A3</option>
                   <option value="12C">Lớp 12C</option>
                   <option value="12D">Lớp 12D</option>
               </select>
               <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[130px]">
                   <option value="ALL">Tất cả trạng thái</option>
                   <option value={UserStatus.ACTIVE}>Đang hoạt động</option>
                   <option value={UserStatus.PENDING}>Chờ duyệt</option>
                   <option value={UserStatus.LOCKED}>Đã khóa</option>
               </select>
           </div>
       </div>

       {/* Table */}
       <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
           <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                   <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase font-semibold">
                       <tr>
                           <th className="px-6 py-4">Người dùng</th>
                           <th className="px-6 py-4">Vai trò</th>
                           <th className="px-6 py-4">Lớp</th>
                           <th className="px-6 py-4">Trạng thái</th>
                           <th className="px-6 py-4 text-right">Thao tác</th>
                       </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                       {filteredUsers.length === 0 ? (
                           <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">Không tìm thấy người dùng nào.</td></tr>
                       ) : (
                           filteredUsers.map((user) => (
                               <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                                   <td className="px-6 py-4">
                                       <div className="flex items-center gap-3">
                                           <img src={user.avatar} alt="" className="w-10 h-10 rounded-full bg-slate-200 object-cover border border-slate-200" />
                                           <div>
                                               <p className="font-bold text-slate-900 text-sm">{user.name}</p>
                                               <p className="text-xs text-slate-500">{user.username || 'N/A'}</p>
                                           </div>
                                       </div>
                                   </td>
                                   <td className="px-6 py-4">
                                       {user.role === UserRole.ADMIN ? (
                                           <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
                                               <Lock size={12} /> Giáo viên
                                           </span>
                                       ) : (
                                           <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                                               <Users size={12} /> Học sinh
                                           </span>
                                       )}
                                   </td>
                                   <td className="px-6 py-4 text-sm font-medium text-slate-700">
                                       {user.className || '-'}
                                   </td>
                                   <td className="px-6 py-4">
                                       {user.status === UserStatus.PENDING ? (
                                           <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
                                               <AlertCircle size={12} /> Chờ duyệt
                                           </span>
                                       ) : user.status === UserStatus.LOCKED ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                                               <Ban size={12} /> Đã khóa
                                           </span>
                                       ) : (
                                           <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                                               <CheckCircle size={12} /> Hoạt động
                                           </span>
                                       )}
                                   </td>
                                   <td className="px-6 py-4 text-right">
                                       <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                           {user.status === UserStatus.PENDING && (
                                               <button onClick={() => handleActivate(user)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Kích hoạt">
                                                   <Check size={18} />
                                               </button>
                                           )}
                                           <button onClick={() => openModal('VIEW', user)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Xem chi tiết">
                                               <Eye size={18} />
                                           </button>
                                           <button onClick={() => openModal('EDIT', user)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Sửa">
                                               <Edit size={18} />
                                           </button>
                                           <button onClick={() => handleDelete(user.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Xóa">
                                               <Trash2 size={18} />
                                           </button>
                                       </div>
                                   </td>
                               </tr>
                           ))
                       )}
                   </tbody>
               </table>
           </div>
       </div>

       {/* Modal */}
       {isModalOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
               <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                   <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                       <h2 className="text-lg font-bold text-slate-800">
                           {modalMode === 'CREATE' ? 'Thêm người dùng mới' : modalMode === 'EDIT' ? 'Chỉnh sửa thông tin' : 'Chi tiết người dùng'}
                       </h2>
                       <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24}/></button>
                   </div>
                   
                   <div className="p-6 overflow-y-auto">
                       {modalMode === 'VIEW' && selectedUser ? (
                           <div className="text-center space-y-4">
                               <img src={selectedUser.avatar} alt="" className="w-24 h-24 rounded-full mx-auto border-4 border-slate-100 shadow-sm" />
                               <div>
                                   <h3 className="text-xl font-bold text-slate-900">{selectedUser.name}</h3>
                                   <p className="text-slate-500">{selectedUser.role === UserRole.ADMIN ? 'Giáo viên' : 'Học sinh'} • {selectedUser.className || 'N/A'}</p>
                               </div>
                               <div className="grid grid-cols-2 gap-4 text-left bg-slate-50 p-4 rounded-xl border border-slate-100">
                                   <div>
                                       <label className="text-xs text-slate-400 font-bold uppercase">Tên đăng nhập</label>
                                       <p className="font-medium text-slate-800">{selectedUser.username}</p>
                                   </div>
                                   <div>
                                       <label className="text-xs text-slate-400 font-bold uppercase">Trạng thái</label>
                                       <p className={`font-medium ${selectedUser.status === UserStatus.ACTIVE ? 'text-green-600' : 'text-orange-600'}`}>{selectedUser.status || UserStatus.ACTIVE}</p>
                                   </div>
                                   <div className="col-span-2">
                                       <label className="text-xs text-slate-400 font-bold uppercase">Giới thiệu</label>
                                       <p className="text-sm text-slate-600">{selectedUser.bio || 'Chưa có thông tin.'}</p>
                                   </div>
                               </div>
                           </div>
                       ) : (
                           <div className="space-y-4">
                               <div>
                                   <label className="block text-sm font-medium text-slate-700 mb-1">Họ và tên</label>
                                   <input value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Nhập họ tên" />
                               </div>
                               <div className="grid grid-cols-2 gap-4">
                                   <div>
                                       <label className="block text-sm font-medium text-slate-700 mb-1">Tên đăng nhập</label>
                                       <input value={formData.username || ''} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Username" disabled={modalMode === 'EDIT'} />
                                   </div>
                                   <div>
                                       <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu</label>
                                       <input value={formData.password || ''} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder={modalMode === 'EDIT' ? 'Giữ nguyên nếu không đổi' : 'Nhập mật khẩu'} type="password" />
                                   </div>
                               </div>
                               <div className="grid grid-cols-2 gap-4">
                                   <div>
                                       <label className="block text-sm font-medium text-slate-700 mb-1">Vai trò</label>
                                       <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as UserRole})} className="w-full border border-slate-300 rounded-lg p-2.5 outline-none">
                                           <option value={UserRole.STUDENT}>Học sinh</option>
                                           <option value={UserRole.ADMIN}>Giáo viên</option>
                                       </select>
                                   </div>
                                   <div>
                                       <label className="block text-sm font-medium text-slate-700 mb-1">Lớp</label>
                                       <input value={formData.className || ''} onChange={e => setFormData({...formData, className: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 outline-none" placeholder="VD: 12A1" />
                                   </div>
                               </div>
                               <div>
                                   <label className="block text-sm font-medium text-slate-700 mb-1">Trạng thái</label>
                                   <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as UserStatus})} className="w-full border border-slate-300 rounded-lg p-2.5 outline-none">
                                       <option value={UserStatus.ACTIVE}>Hoạt động</option>
                                       <option value={UserStatus.PENDING}>Chờ duyệt</option>
                                       <option value={UserStatus.LOCKED}>Khóa tài khoản</option>
                                   </select>
                               </div>
                           </div>
                       )}
                   </div>

                   {modalMode !== 'VIEW' && (
                       <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                           <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium">Hủy bỏ</button>
                           <button onClick={handleSaveUser} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200">
                               {modalMode === 'CREATE' ? 'Tạo mới' : 'Lưu thay đổi'}
                           </button>
                       </div>
                   )}
               </div>
           </div>
       )}
    </div>
  );
};

export default AdminUserManager;