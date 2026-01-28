import React, { useState, useEffect } from 'react';
import { DocFolder, DocFile } from '../types';
import { backend } from '../services/mockBackend';
import { Folder, FileText, Download, ChevronRight, ChevronDown, Search, FolderOpen, File as FileIcon, Image, Presentation, FileType, Plus, Upload, FolderPlus, X, Loader2, Eye } from 'lucide-react';

const DocumentLibrary: React.FC = () => {
  const [folders, setFolders] = useState<DocFolder[]>([]);
  const [files, setFiles] = useState<DocFile[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('root');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root']));
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'UPLOAD' | 'NEW_FOLDER'>('UPLOAD');
  
  // Upload State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [targetFolderId, setTargetFolderId] = useState<string>('root');
  const [isUploading, setIsUploading] = useState(false);

  // New Folder State
  const [newFolderName, setNewFolderName] = useState('');
  const [parentFolderId, setParentFolderId] = useState<string>('root');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
      backend.getDocStructure().then(({ folders, files }) => {
        setFolders(folders);
        setFiles(files);
        setLoading(false);
    });
  }

  const toggleFolder = (folderId: string) => {
      const newExpanded = new Set(expandedFolders);
      if (newExpanded.has(folderId)) newExpanded.delete(folderId);
      else newExpanded.add(folderId);
      setExpandedFolders(newExpanded);
      setSelectedFolderId(folderId);
  };

  const getChildFolders = (parentId: string | null) => folders.filter(f => f.parentId === parentId);
  const getFolderFiles = (folderId: string) => {
      return files.filter(f => 
          (f.folderId === folderId || (folderId === 'root' && !f.folderId)) 
          && f.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
  };
  
  const currentFolder = selectedFolderId === 'root' 
    ? { id: 'root', name: 'Tài liệu chung' } 
    : folders.find(f => f.id === selectedFolderId);

  // --- ACTIONS ---

  const handleCreateFolder = async () => {
      if (!newFolderName.trim()) return alert("Vui lòng nhập tên thư mục");
      setIsUploading(true);
      const pid = parentFolderId === 'root' ? null : parentFolderId;
      await backend.createFolder(newFolderName, pid);
      await loadData();
      setIsUploading(false);
      setIsModalOpen(false);
      setNewFolderName('');
  };

  const handleUploadFile = async () => {
      if (!uploadFile) return alert("Vui lòng chọn file");
      setIsUploading(true);
      try {
        await backend.uploadFile(uploadFile, targetFolderId);
        await loadData();
        setUploadFile(null);
        setIsModalOpen(false);
      } catch (err: any) {
          alert(err.message || "Lỗi tải file");
      } finally {
        setIsUploading(false);
      }
  };

  const openModal = () => {
      setTargetFolderId(selectedFolderId);
      setParentFolderId(selectedFolderId); 
      setIsModalOpen(true);
  };

  // Render Tree Node (Sidebar)
  const renderTree = (parentId: string | null, level = 0) => {
      const children = getChildFolders(parentId);
      if (children.length === 0) return null;

      return (
          <div className="pl-2">
              {children.map(folder => {
                  const isExpanded = expandedFolders.has(folder.id);
                  const isSelected = selectedFolderId === folder.id;
                  const hasChildren = getChildFolders(folder.id).length > 0;

                  return (
                      <div key={folder.id}>
                          <div 
                             className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors text-sm ${isSelected ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                             onClick={() => toggleFolder(folder.id)}
                             style={{ paddingLeft: `${level * 12 + 8}px` }}
                          >
                              {hasChildren ? (
                                  <span className="text-slate-400">{isExpanded ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}</span>
                              ) : <span className="w-3.5"/>}
                              
                              <Folder size={16} className={isSelected ? 'fill-indigo-200' : 'fill-slate-100'} />
                              <span className="truncate">{folder.name}</span>
                          </div>
                          {isExpanded && renderTree(folder.id, level + 1)}
                      </div>
                  );
              })}
          </div>
      );
  };

  const renderFolderOptions = (parentId: string | null, prefix = '') => {
      const children = getChildFolders(parentId);
      return children.map(f => (
          <React.Fragment key={f.id}>
              <option value={f.id}>{prefix} 📂 {f.name}</option>
              {renderFolderOptions(f.id, prefix + '-- ')}
          </React.Fragment>
      ));
  };

  const getFileIcon = (type: string) => {
      switch(type) {
          case 'PDF': return <FileText className="text-red-500" size={32} />;
          case 'DOCX': return <FileText className="text-blue-500" size={32} />;
          case 'PPT': return <Presentation className="text-orange-500" size={32} />;
          case 'IMG': return <Image className="text-purple-500" size={32} />;
          default: return <FileIcon className="text-slate-400" size={32} />;
      }
  };

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col animate-in fade-in duration-500">
        <div className="flex justify-between items-center mb-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><FolderOpen className="text-indigo-600"/> Thư viện tài liệu</h1>
                <p className="text-slate-500">Kho tài liệu, đề cương và sách giáo khoa điện tử</p>
            </div>
            
            <div className="flex gap-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Tìm kiếm tài liệu..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64 bg-white"
                    />
                </div>
                <button 
                    onClick={openModal}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all font-bold"
                >
                    <Plus size={20} /> Tải lên / Tạo mới
                </button>
            </div>
        </div>

        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex">
            {/* Left Sidebar: Tree */}
            <div className="w-72 border-r border-slate-100 bg-slate-50/50 flex flex-col">
                <div className="p-4 border-b border-slate-100 font-bold text-slate-700 flex items-center gap-2">
                    <FolderOpen size={18} /> Cây thư mục
                </div>
                <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                    <div 
                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors text-sm mb-1 ${selectedFolderId === 'root' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                        onClick={() => toggleFolder('root')}
                    >
                         <span className="w-3.5"/>
                         <Folder size={16} className={selectedFolderId === 'root' ? 'fill-indigo-200' : 'fill-slate-100'} />
                         <span>Tài liệu chung</span>
                    </div>
                    {renderTree(null)} 
                </div>
            </div>

            {/* Right Content: Grid */}
            <div className="flex-1 flex flex-col">
                <div className="p-4 border-b border-slate-100 bg-white flex justify-between items-center">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                         <span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold uppercase">Folder</span>
                         <span className="font-bold text-slate-800 text-lg">/ {currentFolder?.name}</span>
                         <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{getFolderFiles(selectedFolderId).length} files</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                    {loading ? <div className="text-center py-10">Đang tải...</div> : (
                        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4">
                            {getFolderFiles(selectedFolderId).map(file => (
                                <div key={file.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all group flex flex-col h-full">
                                    <div className="h-24 bg-slate-50 rounded-lg mb-3 flex items-center justify-center group-hover:bg-indigo-50 transition-colors relative">
                                        {getFileIcon(file.type)}
                                        {/* Overlay Actions */}
                                        <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            {file.url !== '#' && (
                                                <a 
                                                    href={file.url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="p-2 bg-white text-indigo-600 rounded-full hover:bg-indigo-50 transition-colors" 
                                                    title="Xem trước"
                                                >
                                                    <Eye size={16} />
                                                </a>
                                            )}
                                            <a 
                                                href={file.url} 
                                                download={file.name}
                                                className={`p-2 bg-white text-green-600 rounded-full hover:bg-green-50 transition-colors ${file.url === '#' ? 'opacity-50 cursor-not-allowed' : ''}`} 
                                                title="Tải xuống"
                                                onClick={e => file.url === '#' && e.preventDefault()}
                                            >
                                                <Download size={16} />
                                            </a>
                                        </div>
                                    </div>
                                    <h4 className="font-bold text-slate-800 text-sm line-clamp-2 mb-1" title={file.name}>{file.name}</h4>
                                    <div className="flex justify-between items-end mt-auto pt-2">
                                        <div>
                                            <p className="text-xs text-slate-500">{file.size} • {file.type}</p>
                                            <p className="text-[10px] text-slate-400">{file.uploadDate}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {getFolderFiles(selectedFolderId).length === 0 && (
                                <div className="col-span-full text-center py-20 text-slate-400 flex flex-col items-center">
                                    <FileType size={48} className="mb-4 opacity-20" />
                                    <p>Thư mục trống</p>
                                    <button onClick={openModal} className="mt-4 text-indigo-600 font-bold hover:underline">Tải tài liệu lên ngay</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* --- UPLOAD / NEW FOLDER MODAL --- */}
        {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                    <div className="flex border-b border-slate-100">
                        <button 
                            onClick={() => setModalTab('UPLOAD')} 
                            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${modalTab === 'UPLOAD' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'bg-slate-50 text-slate-500'}`}
                        >
                            <Upload size={18} /> Tải file lên
                        </button>
                        <button 
                            onClick={() => setModalTab('NEW_FOLDER')} 
                            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${modalTab === 'NEW_FOLDER' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'bg-slate-50 text-slate-500'}`}
                        >
                            <FolderPlus size={18} /> Tạo thư mục
                        </button>
                        <button onClick={() => setIsModalOpen(false)} className="px-4 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"><X size={20}/></button>
                    </div>

                    <div className="p-6">
                        {modalTab === 'UPLOAD' ? (
                            <div className="space-y-4">
                                <div className="border-2 border-dashed border-indigo-200 bg-indigo-50 rounded-xl p-8 text-center relative hover:bg-indigo-100 transition-colors">
                                    <input 
                                        type="file" 
                                        onChange={(e) => setUploadFile(e.target.files?.[0] || null)} 
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                    {uploadFile ? (
                                        <div className="text-indigo-700 font-bold flex flex-col items-center">
                                            <FileText size={40} className="mb-2"/>
                                            {uploadFile.name}
                                            <span className="text-xs font-normal text-indigo-500 mt-1">{(uploadFile.size/1024/1024).toFixed(2)} MB</span>
                                        </div>
                                    ) : (
                                        <div className="text-indigo-400 flex flex-col items-center">
                                            <Upload size={40} className="mb-2"/>
                                            <span className="font-bold text-indigo-600">Chọn file từ máy tính</span>
                                            <span className="text-xs mt-1">Hỗ trợ PDF, Word, Ảnh... (Max 1.5MB)</span>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Lưu vào thư mục</label>
                                    <select 
                                        value={targetFolderId} 
                                        onChange={e => setTargetFolderId(e.target.value)}
                                        className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                    >
                                        <option value="root">📁 Tài liệu chung (Gốc)</option>
                                        {renderFolderOptions(null)}
                                    </select>
                                </div>
                                <button 
                                    onClick={handleUploadFile} 
                                    disabled={!uploadFile || isUploading}
                                    className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isUploading ? <Loader2 className="animate-spin" size={20}/> : <Upload size={20}/>}
                                    {isUploading ? 'Đang xử lý...' : 'Bắt đầu tải lên'}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tên thư mục mới</label>
                                    <input 
                                        value={newFolderName}
                                        onChange={e => setNewFolderName(e.target.value)}
                                        className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                                        placeholder="VD: Đề thi học kỳ 1..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Thư mục cha</label>
                                    <select 
                                        value={parentFolderId} 
                                        onChange={e => setParentFolderId(e.target.value)}
                                        className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                    >
                                        <option value="root">📁 Tài liệu chung (Gốc)</option>
                                        {renderFolderOptions(null)}
                                    </select>
                                </div>
                                <button 
                                    onClick={handleCreateFolder} 
                                    disabled={!newFolderName.trim() || isUploading}
                                    className="w-full py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg shadow-green-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isUploading ? <Loader2 className="animate-spin" size={20}/> : <FolderPlus size={20}/>}
                                    {isUploading ? 'Đang tạo...' : 'Tạo thư mục'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default DocumentLibrary;