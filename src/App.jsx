import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useUser } from './hooks/useUser'
import { useNetwork } from './hooks/useNetwork'
import { syncPendingData } from './offline/sync'

import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import ClassPage from "./pages/ClassPage";
import SubjectPage from "./pages/SubjectPage";
import ChapterPage from "./pages/ChapterPage";
import LessonPage from "./pages/LessonPage";
import ExercisePage from "./pages/ExercisePage";

import DashboardPage from "./pages/DashboardPage";
import ProfilePage from "./pages/ProfilePage";
import DownloadsPage from "./pages/DownloadsPage";
import SettingsPage from "./pages/SettingsPage";
import CoursesPage from "./pages/CoursesPage";
import Layout from "./components/Layout";
import LoginAdmin from "./pages/admin/LoginAdmin";
import ProtectedAdminRoute from "./components/admin/ProtectedAdminRoute";
import DashboardAdmin from "./pages/admin/DashboardAdmin";
import AdminLayout from "./components/admin/AdminLayout";
import UsersAdmin from "./pages/admin/UsersAdmin";
import ClassesAdmin from "./pages/admin/ClassesAdmin";
import AdminSubjects from "./pages/admin/AdminSubjects";
import AdminChapters from "./pages/admin/AdminChapters";
import AdminLessons from "./pages/admin/AdminLessons";


function App() {
  const { user, loading } = useUser()
  const { isOnline } = useNetwork()

  useEffect(() => {
    if (isOnline && user) syncPendingData()
  }, [isOnline, user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <Routes>

      <Route path="/admin/login" element={<LoginAdmin />} />

      <Route
      path="/admin"
      element={
      <ProtectedAdminRoute>

      <AdminLayout>

      <DashboardAdmin/>

      </AdminLayout>

      </ProtectedAdminRoute>
      }
      />

      <Route
      path="/admin/users"
      element={
      <ProtectedAdminRoute>

      <AdminLayout>

      <UsersAdmin/>

      </AdminLayout>

      </ProtectedAdminRoute>
      }
      />

      <Route
       path="/admin/subjects"
       element={<AdminSubjects/>}
      />

      <Route
       path="/admin/chapters/:subjectId"
       element={<AdminChapters/>}
      />

      <Route
       path="/admin/lessons/:chapterId"
       element={<AdminLessons/>}
      />

      <Route

      path="/admin/classes"

      element={

      <ProtectedAdminRoute>

      <AdminLayout>

      <ClassesAdmin/>

      </AdminLayout>

      </ProtectedAdminRoute>

      }

      />

      <Route
        path="/login"
        element={
          !user
            ? <LoginPage />
            : <Navigate to="/" />
        }
      />


      <Route element={<Layout />}>

        <Route
          path="/"
          element={
            user
              ? <HomePage />
              : <Navigate to="/login" />
          }
        />


        <Route
          path="/class/:classId"
          element={
            user
              ? <ClassPage />
              : <Navigate to="/login" />
          }
        />


        <Route
          path="/subject/:subjectId"
          element={
            user
              ? <SubjectPage />
              : <Navigate to="/login" />
          }
        />


        <Route
          path="/chapter/:chapterId"
          element={
            user
              ? <ChapterPage />
              : <Navigate to="/login" />
          }
        />


        <Route
          path="/lesson/:lessonId"
          element={
            user
              ? <LessonPage />
              : <Navigate to="/login" />
          }
        />


        <Route
          path="/exercise/:lessonId"
          element={
            user
              ? <ExercisePage />
              : <Navigate to="/login" />
          }
        />


        <Route
          path="/dashboard"
          element={
            user
              ? <DashboardPage />
              : <Navigate to="/login" />
          }
        />


        <Route
          path="/downloads"
          element={
            user
              ? <DownloadsPage />
              : <Navigate to="/login" />
          }
        />


        <Route
          path="/profile"
          element={
            user
              ? <ProfilePage />
              : <Navigate to="/login" />
          }
        />


        <Route
          path="/settings"
          element={
            user
              ? <SettingsPage />
              : <Navigate to="/login" />
          }
        />


      </Route>

        <Route
         path="/courses"
         element={
         user ? <CoursesPage /> : <Navigate to="/login" />
         }
        />

      <Route
        path="*"
        element={<Navigate to="/" />}
      />


    </Routes>
  )
}

export default App
