import { LessonStatus, QuestionType, UserRole, UserStatus } from './types';
import type { Course, Lesson, Question, User, Post } from './types';

// --- REALISTIC MOCK USERS LIST ---
export const MOCK_USERS: User[] = [
  // --- GIÁO VIÊN (ADMIN) ---
  {
    id: 'u_gv1',
    name: 'Cô Nguyễn Thu Trang',
    username: 'giaovien1',
    password: '123',
    role: UserRole.ADMIN,
    avatar: 'https://ui-avatars.com/api/?name=Nguyen+Thu+Trang&background=e11d48&color=fff',
    coverPhoto: 'https://picsum.photos/1200/400?random=100',
    bio: 'Tổ trưởng chuyên môn GD KT&PL. Phụ trách khối 12.',
    status: UserStatus.ACTIVE
  },

  // --- HỌC SINH MẪU ---
  {
    id: 'hs_1',
    name: 'Nguyễn Văn An',
    username: 'hs1',
    password: '123',
    role: UserRole.STUDENT,
    className: '12A1',
    avatar: 'https://ui-avatars.com/api/?name=Nguyen+Van+An&background=0D8ABC&color=fff',
    status: UserStatus.ACTIVE
  }
];

// Mock Questions
export const MOCK_QUIZ: Question[] = [
  {
    id: 'q1',
    type: QuestionType.MULTIPLE_CHOICE,
    text: 'Chỉ tiêu nào sau đây thường được dùng để đo lường tăng trưởng kinh tế?',
    options: [
      'Tổng sản phẩm quốc nội (GDP).',
      'Chỉ số giá tiêu dùng (CPI).',
      'Tỷ lệ thất nghiệp.',
      'Lãi suất ngân hàng.'
    ],
    correctOptionIndex: 0,
    explanation: 'GDP là thước đo tổng giá trị thị trường của tất cả các hàng hóa và dịch vụ cuối cùng được sản xuất ra trong phạm vi một lãnh thổ quốc gia trong một thời kỳ nhất định.'
  },
  {
    id: 'q2',
    type: QuestionType.TRUE_FALSE_GROUP,
    text: 'Đọc các nhận định sau về Phát triển kinh tế:',
    statements: [
      { id: 's1', text: 'Tăng trưởng kinh tế là điều kiện cần của phát triển kinh tế.', isCorrect: true },
      { id: 's2', text: 'Phát triển kinh tế chỉ chú trọng đến quy mô sản lượng, không quan tâm đến xã hội.', isCorrect: false },
      { id: 's3', text: 'Cơ cấu kinh tế hợp lý là một biểu hiện của phát triển kinh tế.', isCorrect: true },
      { id: 's4', text: 'Mọi sự tăng trưởng kinh tế đều dẫn đến phát triển kinh tế.', isCorrect: false }
    ],
    explanation: 'Tăng trưởng kinh tế là điều kiện cần, nhưng chưa đủ. Phát triển kinh tế còn bao gồm thay đổi cơ cấu và tiến bộ xã hội.'
  }
];

// Mock Lessons for Course 1
export const MOCK_LESSONS: Lesson[] = [
  {
    id: 'l1',
    courseId: 'c1',
    title: 'Bài 1: Tăng trưởng kinh tế',
    description: 'Khái niệm và ý nghĩa của tăng trưởng kinh tế.',
    status: LessonStatus.COMPLETED,
    order: 1,
    objectives: '- Nêu được khái niệm tăng trưởng kinh tế.\n- Giải thích được ý nghĩa của tăng trưởng kinh tế đối với sự phát triển của đất nước.\n- Phân biệt được tăng trưởng kinh tế và phát triển kinh tế.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Placeholder video
    contentMarkdown: `
### 1. Khái niệm tăng trưởng kinh tế
Tăng trưởng kinh tế là sự gia tăng về quy mô sản lượng của nền kinh tế trong một thời kỳ nhất định so với thời kỳ trước đó.

### 2. Ý nghĩa
- Thể hiện sự phát triển của đất nước.
- Tạo điều kiện nâng cao đời sống nhân dân.
- Giảm tỷ lệ thất nghiệp.
    `,
    mindmapImage: 'https://picsum.photos/800/400?grayscale',
    keywords: ['Tăng trưởng', 'GDP', 'GNP', 'Quy mô kinh tế'],
    questions: MOCK_QUIZ
  },
  {
    id: 'l2',
    courseId: 'c1',
    title: 'Bài 2: Phát triển kinh tế',
    description: 'Mối quan hệ giữa tăng trưởng và phát triển bền vững.',
    status: LessonStatus.IN_PROGRESS,
    order: 2,
    objectives: '- Hiểu được bản chất của phát triển kinh tế.\n- Phân tích được mối quan hệ giữa tăng trưởng và phát triển bền vững.',
    contentMarkdown: `### Nội dung chính\nPhát triển kinh tế bao gồm tăng trưởng kinh tế gắn liền với cơ cấu kinh tế hợp lý, tiến bộ và công bằng xã hội.`,
    mindmapImage: 'https://picsum.photos/800/400?blur',
    keywords: ['Phát triển bền vững', 'Cơ cấu kinh tế', 'Công bằng xã hội'],
    questions: [MOCK_QUIZ[1]]
  },
  {
    id: 'l3',
    courseId: 'c1',
    title: 'Bài 3: Hội nhập kinh tế',
    description: 'Các cấp độ hội nhập.',
    status: LessonStatus.NOT_STARTED,
    order: 3,
    objectives: '- Trình bày được các hình thức hội nhập kinh tế quốc tế.',
    contentMarkdown: `### Nội dung đang cập nhật...`,
    keywords: ['Hội nhập', 'FTA', 'WTO'],
    questions: []
  }
];

// Mock Courses
export const MOCK_COURSES: Course[] = [
  {
    id: 'c1',
    title: 'Pháp luật và Đời sống',
    description: 'Nắm vững khái niệm, vai trò và các chỉ tiêu đo lường tăng trưởng kinh tế.',
    thumbnail: 'https://picsum.photos/400/250?random=1',
    totalLessons: 3,
    completedLessons: 1,
    grade: 12,
    studentsCount: 156,
    updatedAt: new Date().toISOString(),
    lessons: MOCK_LESSONS
  },
  {
    id: 'c2',
    title: 'Hội nhập kinh tế quốc tế',
    description: 'Hiểu về các hình thức hội nhập, cơ hội và thách thức đối với Việt Nam.',
    thumbnail: 'https://picsum.photos/400/250?random=2',
    totalLessons: 5,
    completedLessons: 1,
    grade: 12,
    studentsCount: 98,
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    lessons: []
  },
  {
    id: 'c3',
    title: 'Pháp luật về doanh nghiệp',
    description: 'Quyền tự do kinh doanh và nghĩa vụ của doanh nghiệp theo pháp luật.',
    thumbnail: 'https://picsum.photos/400/250?random=3',
    totalLessons: 6,
    completedLessons: 0,
    grade: 12,
    studentsCount: 120,
    updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    lessons: []
  },
  {
    id: 'c4',
    title: 'Cạnh tranh cung cầu',
    description: 'Quy luật cung cầu trong nền kinh tế thị trường.',
    thumbnail: 'https://picsum.photos/400/250?random=4',
    totalLessons: 8,
    completedLessons: 0,
    grade: 11,
    studentsCount: 204,
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    lessons: []
  },
  {
    id: 'c5',
    title: 'Lạm phát và thất nghiệp',
    description: 'Nguyên nhân, hậu quả và giải pháp.',
    thumbnail: 'https://picsum.photos/400/250?random=5',
    totalLessons: 5,
    completedLessons: 0,
    grade: 11,
    studentsCount: 85,
    updatedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    lessons: []
  },
  {
    id: 'c6',
    title: 'Nền kinh tế và các chủ thể',
    description: 'Giới thiệu về các chủ thể trong nền kinh tế.',
    thumbnail: 'https://picsum.photos/400/250?random=6',
    totalLessons: 3,
    completedLessons: 0,
    grade: 10,
    studentsCount: 312,
    updatedAt: new Date(Date.now() - 86400000 * 20).toISOString(),
    lessons: []
  }
];

// Mock Posts for Community
export const MOCK_POSTS: Post[] = [
  {
    id: 'p1',
    author: MOCK_USERS[1], // hs_1
    content: 'Mọi người cho em hỏi sự khác nhau cơ bản giữa Tăng trưởng kinh tế và Phát triển kinh tế với ạ? Em hay bị nhầm 2 cái này quá 😭',
    tags: ['#chude1', '#thacmac'],
    createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    likes: 5,
    isLikedByCurrentUser: false,
    comments: [
      {
        id: 'cm1',
        author: MOCK_USERS[0], // Teacher 1
        content: 'Chào em. Tăng trưởng chỉ nói về Quy mô (Lượng), còn Phát triển bao gồm cả Quy mô + Cơ cấu + Xã hội (Chất). Em nhớ từ khóa: Tăng trưởng là "Lớn lên", Phát triển là "Trưởng thành" nhé.',
        createdAt: new Date(Date.now() - 1800000).toISOString(),
        isAccepted: true
      }
    ],
    context: { type: 'LESSON', id: 'l2', title: 'Bài 2: Phát triển kinh tế' }
  }
];