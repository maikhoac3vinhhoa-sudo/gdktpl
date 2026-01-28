export enum UserRole {
  ADMIN = 'ADMIN',
  STUDENT = 'STUDENT'
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  LOCKED = 'LOCKED'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  className?: string;
  avatar?: string;
  coverPhoto?: string;
  bio?: string;
  username?: string;
  password?: string;
  status?: UserStatus;
}

export enum LessonStatus {
  LOCKED = 'LOCKED',
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED'
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  status: LessonStatus;
  objectives?: string;
  videoUrl?: string;
  contentMarkdown?: string;
  mindmapImage?: string;
  keywords?: string[];
  questions?: Question[];
}

export interface Course {
  id: string;
  title: string;
  thumbnail: string;
  description: string;
  totalLessons: number;
  completedLessons: number;
  grade?: number;
  studentsCount?: number;
  updatedAt?: string;
  lessons?: Lesson[];
}

export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TRUE_FALSE_GROUP = 'TRUE_FALSE_GROUP'
}

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options?: string[];
  correctOptionIndex?: number;
  statements?: {
    id: string;
    text: string;
    isCorrect: boolean;
  }[];
  explanation?: string;
  passageContent?: string;
}

export interface QuizResult {
  quizId: string;
  score: number;
  maxScore: number;
  completedAt: string;
}

export interface Exam {
  id: string;
  title: string;
  topic: string;
  tags?: string[];
  createdAt: string;
  questions: Question[];
}

// Analytics Types
export interface ClassStat {
  className: string;
  studentCount: number;
  avgScore: number;
  completionRate: number;
}

export interface StudentPerformance {
  id: string;
  name: string;
  className: string;
  avatar: string;
  avgScore: number;
  studyTimeHours: number;
  completedLessons: number;
}

export interface Comment {
  id: string;
  author: User;
  content: string;
  createdAt: string;
  isAccepted: boolean;
}

export interface Post {
  id: string;
  author: User;
  content: string;
  imageUrl?: string;
  tags: string[];
  createdAt: string;
  likes: number;
  isLikedByCurrentUser?: boolean;
  comments: Comment[];
  context?: {
    type: 'LESSON' | 'EXAM';
    id: string;
    title: string;
  };
}

export interface DocFolder {
  id: string;
  name: string;
  parentId: string | null;
}

export interface DocFile {
  id: string;
  folderId: string;
  name: string;
  type: 'PDF' | 'DOCX' | 'PPT' | 'IMG' | 'OTHER';
  size: string;
  uploadDate: string;
  url: string;
  downloadCount: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isThinking?: boolean;
}