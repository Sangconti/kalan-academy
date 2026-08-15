import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useUser } from './hooks/useUser'
import { useNetwork } from './hooks/useNetwork'
import { syncPendingData } from './offline/sync'

// ===============================
// PAGES UTILISATEUR
// ===============================
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import ClassPage from './pages/ClassPage'
import SubjectPage from './pages/SubjectPage'
import ChapterPage from './pages/ChapterPage'
import LessonPage from './pages/LessonPage'
import ExercisePage from './pages/ExercisePage'

import DashboardPage from './pages/DashboardPage'
import ProfilePage from './pages/ProfilePage'
import DownloadsPage from './pages/DownloadsPage'
import SettingsPage from './pages/SettingsPage'
import CoursesPage from './pages/CoursesPage'

import Layout from './components/Layout'
import ProtectedStudentRoute from './components/ProtectedStudentRoute'

import AccessPendingPage from './pages/AccessPendingPage'
import AccessBlockedPage from './pages/AccessBlockedPage'

// ===============================
// ADMIN
// ===============================
import LoginAdmin from './pages/admin/LoginAdmin'
import ProtectedAdminRoute from './components/admin/ProtectedAdminRoute'
import AdminLayout from './components/admin/AdminLayout'

import DashboardAdmin from './pages/admin/DashboardAdmin'
import UsersAdmin from './pages/admin/UsersAdmin'
import ClassesAdmin from './pages/admin/ClassesAdmin'
import AdminSubjects from './pages/admin/AdminSubjects'
import AdminChapters from './pages/admin/AdminChapters'
import AdminLessons from './pages/admin/AdminLessons'
import AdminLessonBlocks from './pages/admin/AdminLessonBlocks'
import AdminQuiz from './pages/admin/AdminQuiz'

// Nouvelles pages admin
import AdminVideos from './pages/admin/AdminVideos'
import AdminStats from './pages/admin/AdminStats'
import AdminSettings from './pages/admin/AdminSettings'


function App() {
  const { user, loading } = useUser()
  const { isOnline } = useNetwork()

  // ==========================================
  // SYNCHRONISATION OFFLINE
  // ==========================================
  useEffect(() => {
    if (isOnline && user) {
      syncPendingData()
    }
  }, [isOnline, user])


  // ==========================================
  // CHARGEMENT INITIAL
  // ==========================================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            Chargement...
          </p>
        </div>
      </div>
    )
  }


  return (
    <Routes>

      {/* =====================================================
          ADMIN — CONNEXION
      ===================================================== */}

      <Route
        path="/admin/login"
        element={<LoginAdmin />}
      />


      <Route
        path="/access-pending"
        element={
          user
            ? <AccessPendingPage />
            : <Navigate to="/login" replace />
        }
      />

      <Route
        path="/access-blocked"
        element={
          user
            ? <AccessBlockedPage />
            : <Navigate to="/login" replace />
        }
      />


      {/* =====================================================
          ADMIN — DASHBOARD
      ===================================================== */}

      <Route
        path="/admin"
        element={
          <ProtectedAdminRoute>
            <AdminLayout>
              <DashboardAdmin />
            </AdminLayout>
          </ProtectedAdminRoute>
        }
      />


      {/* =====================================================
          ADMIN — UTILISATEURS
      ===================================================== */}

      <Route
        path="/admin/users"
        element={
          <ProtectedAdminRoute>
            <AdminLayout>
              <UsersAdmin />
            </AdminLayout>
          </ProtectedAdminRoute>
        }
      />


      {/* =====================================================
          ADMIN — CLASSES
      ===================================================== */}

      <Route
        path="/admin/classes"
        element={
          <ProtectedAdminRoute>
            <AdminLayout>
              <ClassesAdmin />
            </AdminLayout>
          </ProtectedAdminRoute>
        }
      />


      {/* =====================================================
          ADMIN — MATIÈRES
      ===================================================== */}

      <Route
        path="/admin/subjects"
        element={
          <ProtectedAdminRoute>
            <AdminLayout>
              <AdminSubjects />
            </AdminLayout>
          </ProtectedAdminRoute>
        }
      />


      {/* =====================================================
          ADMIN — CHAPITRES
      ===================================================== */}

      <Route
        path="/admin/chapters/:subjectId"
        element={
          <ProtectedAdminRoute>
            <AdminLayout>
              <AdminChapters />
            </AdminLayout>
          </ProtectedAdminRoute>
        }
      />


      {/* =====================================================
          ADMIN — LEÇONS
      ===================================================== */}

      <Route
        path="/admin/lessons/:chapterId"
        element={
          <ProtectedAdminRoute>
            <AdminLayout>
              <AdminLessons />
            </AdminLayout>
          </ProtectedAdminRoute>
        }
      />


            {/* =====================================================
                ADMIN — BLOCS PÉDAGOGIQUES
                Gestion du contenu d'une leçon
            ===================================================== */}

            <Route
              path="/admin/lesson/:lessonId/blocks"
              element={
                <ProtectedAdminRoute>
                  <AdminLayout>
                    <AdminLessonBlocks />
                  </AdminLayout>
                </ProtectedAdminRoute>
              }
            />

             {/* =====================================================
                 ADMIN — QUIZ
                 Gestion du quiz et des questions d'une leçon
             ===================================================== */}

             <Route
               path="/admin/lesson/:lessonId/quiz"
               element={
                 <ProtectedAdminRoute>
                   <AdminLayout>
                     <AdminQuiz />
                   </AdminLayout>
                 </ProtectedAdminRoute>
               }
             />

      {/* =====================================================
          ADMIN — VIDÉOS
          Gestion réelle des vidéos liées aux leçons
      ===================================================== */}

      <Route
        path="/admin/videos"
        element={
          <ProtectedAdminRoute>
            <AdminLayout>
              <AdminVideos />
            </AdminLayout>
          </ProtectedAdminRoute>
        }
      />


      {/* =====================================================
          ADMIN — STATISTIQUES
          Élèves, progression, XP, quiz, classes, matières
      ===================================================== */}

      <Route
        path="/admin/stats"
        element={
          <ProtectedAdminRoute>
            <AdminLayout>
              <AdminStats />
            </AdminLayout>
          </ProtectedAdminRoute>
        }
      />


      {/* =====================================================
          ADMIN — PARAMÈTRES
          Paramètres administrateur persistants
      ===================================================== */}

      <Route
        path="/admin/settings"
        element={
          <ProtectedAdminRoute>
            <AdminLayout>
              <AdminSettings />
            </AdminLayout>
          </ProtectedAdminRoute>
        }
      />


      {/* =====================================================
          UTILISATEUR — LOGIN
      ===================================================== */}

      <Route
        path="/login"
        element={<LoginPage />}
      />

      {/*  <Route
        path="/login"
        element={
          !user
            ? <LoginPage />
            : <Navigate to="/" replace />
        }
      />*/}


      {/* =====================================================
          APPLICATION UTILISATEUR — ACCÈS PROTÉGÉ
      ===================================================== */}

      <Route
        element={
          user ? (
            <ProtectedStudentRoute user={user}>
              <Layout />
            </ProtectedStudentRoute>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      >

        {/* =====================================================
            ACCUEIL
        ===================================================== */}

        <Route
          path="/"
          element={<HomePage />}
        />


        {/* =====================================================
            CLASSE
        ===================================================== */}

        <Route
          path="/class/:classId"
          element={<ClassPage />}
        />


        {/* =====================================================
            MATIÈRE
        ===================================================== */}

        <Route
          path="/subject/:subjectId"
          element={<SubjectPage />}
        />


        {/* =====================================================
            CHAPITRE
        ===================================================== */}

        <Route
          path="/chapter/:chapterId"
          element={<ChapterPage />}
        />


        {/* =====================================================
            LEÇON
        ===================================================== */}

        <Route
          path="/lesson/:lessonId"
          element={<LessonPage />}
        />


        {/* =====================================================
            EXERCICES / QUIZ
        ===================================================== */}

        <Route
          path="/exercise/:lessonId"
          element={<ExercisePage />}
        />


        {/* =====================================================
            DASHBOARD ÉLÈVE
        ===================================================== */}

        <Route
          path="/dashboard"
          element={<DashboardPage />}
        />


        {/* =====================================================
            TÉLÉCHARGEMENTS
        ===================================================== */}

        <Route
          path="/downloads"
          element={<DownloadsPage />}
        />


        {/* =====================================================
            PROFIL
        ===================================================== */}

        <Route
          path="/profile"
          element={<ProfilePage />}
        />


        {/* =====================================================
            PARAMÈTRES ÉLÈVE
        ===================================================== */}

        <Route
          path="/settings"
          element={<SettingsPage />}
        />

      </Route>


      {/* =====================================================
          COURS
      ===================================================== */}

      <Route
        path="/courses"
        element={
          user ? (
            <ProtectedStudentRoute user={user}>
              <CoursesPage />
            </ProtectedStudentRoute>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />


      {/* =====================================================
          ROUTE INCONNUE
      ===================================================== */}

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />

    </Routes>
  )
}

export default App