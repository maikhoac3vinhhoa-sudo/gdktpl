import { UserRole, UserStatus, LessonStatus } from '../types';
import type { Course, Lesson, Question, QuizResult, User, StudentPerformance, Exam, Post, Comment, DocFolder, DocFile } from '../types';
import { MOCK_COURSES, MOCK_LESSONS, MOCK_QUIZ, MOCK_USERS, MOCK_POSTS } from '../constants';

// Simulated latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Storage Keys
const KEYS = {
  USERS: 'edu_db_users_v2', 
  COURSES: 'edu_db_courses_v2',
  EXAMS: 'edu_db_exams_v2',
  POSTS: 'edu_db_posts_v2',
  RESULTS: 'edu_db_results_v2',
  DOC_FOLDERS: 'edu_db_doc_folders',
  DOC_FILES: 'edu_db_doc_files'
};

class MockBackend {
  private currentUser: User | null = null;
  
  private users: User[] = [];
  private courses: Course[] = [];
  private exams: Exam[] = [];
  private posts: Post[] = [];
  private results: QuizResult[] = []; 
  
  // New: Document Storage
  private docFolders: DocFolder[] = [];
  private docFiles: DocFile[] = [];

  constructor() {
      this.loadData();
  }

  // --- INTERNAL HELPER: Load/Save Data ---
  private loadData() {
      // 1. Users
      const savedUsers = localStorage.getItem(KEYS.USERS);
      let loadedUsers: User[] = [];
      try { loadedUsers = savedUsers ? JSON.parse(savedUsers) : []; } catch (e) { loadedUsers = []; }

      // SELF-HEALING Check
      const hasDefaultAdmin = loadedUsers.some(u => u.username === 'giaovien1');

      if (!savedUsers || loadedUsers.length === 0 || !hasDefaultAdmin) {
          console.warn("⚠️ Data corrupted or missing. Resetting DB to Defaults...");
          this.users = [...MOCK_USERS];
          this.courses = [...MOCK_COURSES];
          this.exams = [
            { id: 'exam1', title: 'Đề kiểm tra 15 phút - Chủ đề 1', topic: 'Chủ đề 1', createdAt: new Date().toISOString(), questions: MOCK_QUIZ }
          ];
          this.posts = [...MOCK_POSTS];
          this.results = [];
          
          // Default Docs
          this.docFolders = [
            { id: 'f_root_1', name: 'Đề cương ôn tập', parentId: null },
            { id: 'f_root_2', name: 'Sách giáo khoa điện tử', parentId: null },
          ];
          // Default docs have dummy URLs, real uploads will have Base64
          this.docFiles = [
            { id: 'doc1', folderId: 'f_root_1', name: 'De_cuong_GDKTPL_12_HK1.pdf', type: 'PDF', size: '2.4 MB', uploadDate: '2023-09-15', url: '#', downloadCount: 154 },
            { id: 'doc2', folderId: 'f_root_2', name: 'SGK_GDKTPL_12_Canh_Dieu.pdf', type: 'PDF', size: '45 MB', uploadDate: '2023-08-15', url: '#', downloadCount: 512 },
          ];

          this.saveData(); 
      } else {
          this.users = loadedUsers;
          this.courses = JSON.parse(localStorage.getItem(KEYS.COURSES) || '[]');
          this.exams = JSON.parse(localStorage.getItem(KEYS.EXAMS) || '[]');
          this.posts = JSON.parse(localStorage.getItem(KEYS.POSTS) || '[]');
          this.results = JSON.parse(localStorage.getItem(KEYS.RESULTS) || '[]');
          
          // Load Docs
          this.docFolders = JSON.parse(localStorage.getItem(KEYS.DOC_FOLDERS) || '[]');
          this.docFiles = JSON.parse(localStorage.getItem(KEYS.DOC_FILES) || '[]');
          
          // Fallback if docs empty but user exists (migration)
          if(this.docFolders.length === 0) {
             this.docFolders = [ { id: 'f_root_1', name: 'Đề cương ôn tập', parentId: null } ];
          }
      }
      if (this.courses.length === 0) this.courses = [...MOCK_COURSES];
  }

  private saveData() {
      try {
        localStorage.setItem(KEYS.USERS, JSON.stringify(this.users));
        localStorage.setItem(KEYS.COURSES, JSON.stringify(this.courses));
        localStorage.setItem(KEYS.EXAMS, JSON.stringify(this.exams));
        localStorage.setItem(KEYS.POSTS, JSON.stringify(this.posts));
        localStorage.setItem(KEYS.RESULTS, JSON.stringify(this.results));
        localStorage.setItem(KEYS.DOC_FOLDERS, JSON.stringify(this.docFolders));
        localStorage.setItem(KEYS.DOC_FILES, JSON.stringify(this.docFiles));
      } catch (e) {
          console.error("Storage Quota Exceeded", e);
          alert("Cảnh báo: Bộ nhớ trình duyệt đã đầy! Một số dữ liệu mới có thể không được lưu. Hãy xóa bớt tài liệu hoặc ảnh lớn.");
      }
  }

  // --- AUTHENTICATION ---
  async login(username: string, password: string, role: UserRole): Promise<User> {
    await delay(600);
    const cleanUser = username.trim();
    const cleanPass = password.trim();
    const user = this.users.find(u => u.username === cleanUser && u.password === cleanPass);
    if (!user) throw new Error("Tên đăng nhập hoặc mật khẩu không đúng.");
    if (user.role !== role) {
        const roleName = user.role === UserRole.ADMIN ? 'Giáo viên' : 'Học sinh';
        throw new Error(`Tài khoản này là ${roleName}. Vui lòng chuyển tab "${roleName}" để đăng nhập.`);
    }
    if (user.status === UserStatus.PENDING) throw new Error("Tài khoản đang chờ duyệt.");
    if (user.status === UserStatus.LOCKED) throw new Error("Tài khoản đã bị khóa.");
    this.currentUser = user;
    localStorage.setItem('edu_current_user', JSON.stringify(user));
    return user;
  }

  async getCurrentUser(): Promise<User | null> {
    const saved = localStorage.getItem('edu_current_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const freshUser = this.users.find(u => u.id === parsed.id);
        if (freshUser) { this.currentUser = freshUser; return freshUser; }
      } catch (e) { return null; }
    }
    return null;
  }

  async logout(): Promise<void> {
    await delay(300);
    this.currentUser = null;
    localStorage.removeItem('edu_current_user');
  }

  async updateUserProfile(userId: string, data: Partial<User>): Promise<User> {
    await delay(400);
    const idx = this.users.findIndex(u => u.id === userId);
    if (idx !== -1) {
        this.users[idx] = { ...this.users[idx], ...data };
        this.saveData();
        if (this.currentUser && this.currentUser.id === userId) {
            this.currentUser = this.users[idx];
            localStorage.setItem('edu_current_user', JSON.stringify(this.currentUser));
        }
        return this.users[idx];
    }
    throw new Error("User not found");
  }

  // --- DATA RETRIEVAL FOR PROFILE ---
  async getUserActivityData(userId: string): Promise<{posts: Post[], courses: Course[], recentResults: any[]}> {
      await delay(400);
      const userPosts = this.posts.filter(p => p.author.id === userId);
      const recentResults = this.results.map(r => {
          let title = "Bài kiểm tra";
          const exam = this.exams.find(e => e.id === r.quizId);
          if (exam) title = exam.title;
          else {
              for (const c of this.courses) {
                  const l = c.lessons?.find(ls => ls.id === r.quizId);
                  if (l) { title = l.title; break; }
              }
          }
          return { examTitle: title, score: r.score, date: r.completedAt };
      }).reverse().slice(0, 10);
      
      const activeCourses = this.courses.filter(c => c.completedLessons > 0);
      return { posts: userPosts, courses: activeCourses, recentResults };
  }

  // --- COURSE MANAGEMENT ---
  async getCourses(): Promise<Course[]> { await delay(400); return this.courses; }
  
  async getCourseById(id: string): Promise<Course | undefined> { 
      await delay(200); 
      return this.courses.find(c => c.id === id); 
  }
  
  async addCourse(course: Course): Promise<void> { await delay(400); this.courses.push({ ...course, updatedAt: new Date().toISOString() }); this.saveData(); }
  
  async updateCourse(id: string, data: Partial<Course>): Promise<void> { await delay(400); const idx = this.courses.findIndex(c => c.id === id); if (idx !== -1) { this.courses[idx] = { ...this.courses[idx], ...data, updatedAt: new Date().toISOString() }; this.saveData(); } }
  
  async deleteCourse(id: string): Promise<void> { await delay(400); this.courses = this.courses.filter(c => c.id !== id); this.saveData(); }
  
  async getLessons(courseId: string): Promise<Lesson[]> { 
      await delay(300); 
      const course = this.courses.find(c => c.id === courseId); 
      return course?.lessons || []; 
  }
  
  async saveLessons(courseId: string, lessons: Lesson[]): Promise<void> { 
      await delay(400); 
      const idx = this.courses.findIndex(c => c.id === courseId); 
      if (idx !== -1) { 
          this.courses[idx].lessons = lessons; 
          this.courses[idx].totalLessons = lessons.length; 
          this.courses[idx].completedLessons = lessons.filter(l => l.status === LessonStatus.COMPLETED).length;
          this.courses[idx].updatedAt = new Date().toISOString(); 
          this.saveData(); 
      } 
  }

  async markLessonAsCompleted(courseId: string, lessonId: string): Promise<void> {
      await delay(300);
      const courseIndex = this.courses.findIndex(c => c.id === courseId);
      if (courseIndex !== -1) {
          const course = this.courses[courseIndex];
          if (course.lessons) {
              const lessonIndex = course.lessons.findIndex(l => l.id === lessonId);
              if (lessonIndex !== -1) {
                  course.lessons[lessonIndex].status = LessonStatus.COMPLETED;
                  course.completedLessons = course.lessons.filter(l => l.status === LessonStatus.COMPLETED).length;
                  this.saveData();
              }
          }
      }
  }

  // --- EXAM MANAGEMENT ---
  async getExams(): Promise<Exam[]> { await delay(400); return this.exams; }
  async addExam(exam: Exam): Promise<void> { await delay(400); this.exams.push(exam); this.saveData(); }
  async deleteExam(id: string): Promise<void> { await delay(400); this.exams = this.exams.filter(e => e.id !== id); this.saveData(); }

  // --- QUIZ & RESULTS ---
  async submitQuizResult(result: QuizResult): Promise<void> { await delay(500); this.results.push(result); this.saveData(); }

  // --- USER MANAGEMENT ---
  async getAllUsers(): Promise<User[]> { await delay(400); return this.users; }
  async createUser(user: User): Promise<void> { await delay(500); if (this.users.find(u => u.username === user.username)) throw new Error("Tên đăng nhập đã tồn tại."); this.users.push(user); this.saveData(); }
  async deleteUser(id: string): Promise<void> { await delay(400); this.users = this.users.filter(u => u.id !== id); this.saveData(); }
  async importUsers(users: User[]): Promise<{success: boolean, message: string}> { await delay(800); users.forEach(u => { const idx = this.users.findIndex(existing => existing.id === u.id || existing.username === u.username); if (idx !== -1) this.users[idx] = { ...this.users[idx], ...u }; else this.users.push(u); }); this.saveData(); return { success: true, message: `Đã nhập ${users.length} người dùng.` }; }

  // --- COMMUNITY ---
  async getCommunityPosts(): Promise<Post[]> { await delay(400); return [...this.posts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); }
  async createPost(content: string, imageUrl?: string, tags?: string[], context?: any): Promise<void> { await delay(400); if (!this.currentUser) throw new Error("Must be logged in"); const newPost: Post = { id: `p${Date.now()}`, author: this.currentUser, content, imageUrl, tags: tags || [], createdAt: new Date().toISOString(), likes: 0, isLikedByCurrentUser: false, comments: [], context }; this.posts.unshift(newPost); this.saveData(); }
  async toggleLikePost(postId: string): Promise<void> { await delay(200); const post = this.posts.find(p => p.id === postId); if (post) { if (post.isLikedByCurrentUser) { post.likes--; post.isLikedByCurrentUser = false; } else { post.likes++; post.isLikedByCurrentUser = true; } this.saveData(); } }
  async addComment(postId: string, content: string): Promise<void> { await delay(300); if (!this.currentUser) throw new Error("Must be logged in"); const post = this.posts.find(p => p.id === postId); if (post) { post.comments.push({ id: `cm${Date.now()}`, author: this.currentUser, content, createdAt: new Date().toISOString(), isAccepted: false }); this.saveData(); } }
  async toggleAcceptedComment(postId: string, commentId: string): Promise<void> { await delay(200); const post = this.posts.find(p => p.id === postId); if (post) { const comment = post.comments.find(c => c.id === commentId); if (comment) { comment.isAccepted = !comment.isAccepted; this.saveData(); } } }

  // --- DOCS & AI CONTEXT ---
  async getDocStructure(): Promise<{folders: DocFolder[], files: DocFile[]}> {
      await delay(200);
      return { folders: this.docFolders, files: this.docFiles };
  }

  async createFolder(name: string, parentId: string | null): Promise<DocFolder> {
      await delay(300);
      const newFolder: DocFolder = {
          id: `f_${Date.now()}`,
          name: name,
          parentId: parentId
      };
      this.docFolders.push(newFolder);
      this.saveData();
      return newFolder;
  }

  // Generic Image Upload for Profile/Posts
  async uploadImage(file: File): Promise<string> {
      if (file.size > 0.5 * 1024 * 1024) { // Limit images to 500KB
          throw new Error("Ảnh quá lớn! Vui lòng chọn ảnh dưới 500KB.");
      }
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = error => reject(error);
      });
  }

  async uploadFile(file: File, folderId: string): Promise<DocFile> {
      if (file.size > 1.5 * 1024 * 1024) { // Limit docs to 1.5MB
          throw new Error("File quá lớn! Vui lòng tải file dưới 1.5MB.");
      }

      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => {
              const base64Data = reader.result as string;
              
              const ext = file.name.split('.').pop()?.toUpperCase() || 'OTHER';
              const type = (['PDF', 'DOCX', 'PPT', 'IMG', 'PNG', 'JPG', 'JPEG'].includes(ext) || file.type.includes('image') ? 'IMG' : 'OTHER') as any;
              
              const newFile: DocFile = {
                  id: `doc_${Date.now()}`,
                  folderId: folderId,
                  name: file.name,
                  type: ext === 'PDF' ? 'PDF' : type,
                  size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
                  uploadDate: new Date().toISOString().split('T')[0],
                  url: base64Data, 
                  downloadCount: 0
              };
              
              this.docFiles.push(newFile);
              try {
                  this.saveData();
                  resolve(newFile);
              } catch (e) {
                  this.docFiles.pop();
                  reject(new Error("Bộ nhớ đầy. Không thể lưu file này."));
              }
          };
          reader.onerror = error => reject(error);
      });
  }

  async getKnowledgeContext(): Promise<string> {
      let context = "HỆ THỐNG KIẾN THỨC GDKTPL 12:\n\n";
      this.courses.forEach(c => {
          context += `[CHỦ ĐỀ: ${c.title}]\n${c.description}\n`;
          c.lessons?.forEach(l => {
              context += ` - Bài: ${l.title}\n   + Mục tiêu: ${l.objectives || 'N/A'}\n   + Nội dung: ${l.contentMarkdown?.substring(0, 200)}...\n`;
          });
      });
      return context;
  }

  async getAdminStats(classFilter: string = 'ALL'): Promise<any> {
    await delay(500);
    const filteredUsers = this.users.filter(u => u.role === UserRole.STUDENT && (classFilter === 'ALL' || u.className === classFilter));
    return {
        totalStudents: filteredUsers.length,
        activeNow: Math.ceil(filteredUsers.length * 0.2),
        avgSystemScore: 7.8, 
        topStudents: filteredUsers.slice(0, 5).map(u => ({
            id: u.id,
            name: u.name,
            className: u.className,
            avatar: u.avatar,
            avgScore: 8 + Math.random() * 2,
            studyTimeHours: 10 + Math.random() * 50,
            completedLessons: 5
        }))
    };
  }
}

export const backend = new MockBackend();