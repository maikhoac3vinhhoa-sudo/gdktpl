
import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { User, UserRole } from './types';
import { backend } from './services/mockBackend';
import Layout from './components/Layout';
import Community from './components/Community';
import Profile from './components/Profile'; 
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AdminUserManager from './components/AdminUserManager';
import AdminExamManager from './components/AdminExamManager';
import AdminCourseManager from './components/AdminCourseManager';
import LessonView from './components/LessonView';
import CourseList from './components/CourseList';
import DocumentLibrary from './components/DocumentLibrary';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { 
      backend.getCurrentUser().then(u => { 
          setUser(u); 
          setLoading(false); 
      }); 
  }, []);

  const handleLogin = async (u: string, p: string, r: UserRole) => { 
      const usr = await backend.login(u, p, r); 
      setUser(usr); 
  };

  const handleLogout = async () => { 
      await backend.logout(); 
      setUser(null); 
  };

  if (loading) return <div>Loading...</div>;
  if (!user) return <Login onLogin={handleLogin} isLoading={false} />;

  return (
    <HashRouter>
      <Layout user={user} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard user={user} />} />
          <Route path="/courses" element={<CourseList user={user} />} />
          <Route path="/course/:courseId" element={<LessonView />} />
          
          <Route path="/community" element={<Community currentUser={user} />} />
          <Route path="/documents" element={<DocumentLibrary />} />
          
          <Route path="/admin/users" element={user.role === UserRole.ADMIN ? <AdminUserManager /> : <Navigate to="/" />} />
          <Route path="/admin/courses" element={user.role === UserRole.ADMIN ? <AdminCourseManager /> : <Navigate to="/" />} />
          <Route path="/admin/exams" element={user.role === UserRole.ADMIN ? <AdminExamManager /> : <Navigate to="/" />} />
          
          <Route path="/profile" element={<Profile user={user} />} />
          
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;
