import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";

import { useUser } from "./hooks/useUser";
import { useNetwork } from "./hooks/useNetwork";
import { syncPendingData } from "./offline/sync";

// =====================================================
// PAGES UTILISATEUR
// =====================================================

import LoginPage from "./pages/LoginPage";

import HomePage from "./pages/HomePage";
import ClassPage from "./pages/ClassPage";
import SubjectPage from "./pages/SubjectPage";
import ChapterPage from "./pages/ChapterPage";
import LessonPage from "./pages/LessonPage";
import ExercisePage from "./pages/ExercisePage";
import VideoPage from "./pages/VideoPage";

import DashboardPage from "./pages/DashboardPage";
import ProfilePage from "./pages/ProfilePage";
import DownloadsPage from "./pages/DownloadsPage";
import SettingsPage from "./pages/SettingsPage";
import CoursesPage from "./pages/CoursesPage";

// =====================================================
// LAYOUTS / PROTECTIONS
// =====================================================

import Layout from "./components/Layout";
import ProtectedStudentRoute from "./components/ProtectedStudentRoute";
import StudentPreviewLayout from "./components/StudentPreviewLayout";

// =====================================================
// ACCÈS
// =====================================================

import AccessPendingPage from "./pages/AccessPendingPage";
import AccessBlockedPage from "./pages/AccessBlockedPage";

// =====================================================
// ADMIN
// =====================================================

import LoginAdmin from "./pages/admin/LoginAdmin";
import ProtectedAdminRoute from "./components/admin/ProtectedAdminRoute";
import AdminLayout from "./components/admin/AdminLayout";

import DashboardAdmin from "./pages/admin/DashboardAdmin";
import UsersAdmin from "./pages/admin/UsersAdmin";
import ClassesAdmin from "./pages/admin/ClassesAdmin";
import AdminSubjects from "./pages/admin/AdminSubjects";
import AdminChapters from "./pages/admin/AdminChapters";
import AdminLessons from "./pages/admin/AdminLessons";
import AdminLessonBlocks from "./pages/admin/AdminLessonBlocks";
import AdminQuiz from "./pages/admin/AdminQuiz";

import AdminVideos from "./pages/admin/AdminVideos";
import AdminStats from "./pages/admin/AdminStats";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminStudentPage from "./pages/admin/AdminStudentPage";

import ConsultationStudentLayout from "./components/ConsultationStudentLayout";
import { ConsultationStudentProvider } from "./context/ConsultationStudentContext";

// =====================================================
// APP
// =====================================================

function App() {

  const {
    user,
    loading,
  } = useUser();

  const {
    isOnline,
  } = useNetwork();

  // ===================================================
  // SYNCHRONISATION OFFLINE
  // ===================================================

  useEffect(() => {

    if (
      isOnline &&
      user
    ) {

      console.log(
        "🔄 [APP] Lancement synchronisation utilisateur"
      );

      syncPendingData();
    }

  }, [
    isOnline,
    user,
  ]);

  // ===================================================
  // CHARGEMENT INITIAL
  // ===================================================

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
    );
  }

  // ===================================================
  // ROUTES
  // ===================================================

  return (
    <Routes>

      {/* =================================================
          ADMIN — CONNEXION
      ================================================= */}

      <Route
        path="/admin/login"
        element={
          <LoginAdmin />
        }
      />

      {/* =================================================
          ACCÈS EN ATTENTE
      ================================================= */}

      <Route
        path="/access-pending"
        element={
          user ? (
            <AccessPendingPage />
          ) : (
            <Navigate
              to="/login"
              replace
            />
          )
        }
      />

      {/* =================================================
          ACCÈS BLOQUÉ
      ================================================= */}

      <Route
        path="/access-blocked"
        element={
          user ? (
            <AccessBlockedPage />
          ) : (
            <Navigate
              to="/login"
              replace
            />
          )
        }
      />

      {/* =================================================
          ADMIN — DASHBOARD
      ================================================= */}

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

      {/* =================================================
          ADMIN — UTILISATEURS
      ================================================= */}

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

      {/* =================================================
          ADMIN — CONSULTATION D'UN ÉLÈVE
      ================================================= */}

      <Route
        path="/admin/student/:studentId"
        element={
          <ProtectedAdminRoute>
            <AdminLayout>
              <AdminStudentPage />
            </AdminLayout>
          </ProtectedAdminRoute>
        }
      />

      {/* =================================================
          ADMIN — CONSULTATION ÉLÈVE
      ================================================= */}

      <Route
        path="/admin/student/:studentId/consultation"
        element={
          <ProtectedAdminRoute>
            <ConsultationStudentProvider>
              <ConsultationStudentLayout />
            </ConsultationStudentProvider>
          </ProtectedAdminRoute>
        }
      >

        <Route
          index
          element={<HomePage />}
        />

        <Route
          path="class/:classId"
          element={<ClassPage />}
        />

        <Route
          path="subject/:subjectId"
          element={<SubjectPage />}
        />

        <Route
          path="chapter/:chapterId"
          element={<ChapterPage />}
        />

        <Route
          path="lesson/:lessonId"
          element={<LessonPage consultationMode />}
        />

        <Route
          path="exercise/:lessonId"
          element={<ExercisePage consultationMode />}
        />

        <Route
          path="video/:lessonId"
          element={<VideoPage consultationMode />}
        />

        <Route
          path="dashboard"
          element={<DashboardPage consultationMode />}
        />

        <Route
          path="downloads"
          element={<DownloadsPage consultationMode />}
        />

        <Route
          path="profile"
          element={<ProfilePage consultationMode />}
        />

        <Route
          path="settings"
          element={<SettingsPage consultationMode />}
        />

      </Route>


      {/* =================================================
          ADMIN — APERÇU DE L'APPLICATION ÉLÈVE
          =================================================

          Cet espace est différent du mode consultation.

          - Aucun studentId
          - Aucun élève particulier
          - Vue générale de l'application élève
          - Accessible uniquement depuis l'administration
          - Ne passe PAS par ProtectedStudentRoute
      ================================================= */}

      <Route
        path="/admin/student-preview"
        element={
          <ProtectedAdminRoute>
            <StudentPreviewLayout />
          </ProtectedAdminRoute>
        }
      >

        {/* ===============================================
            ACCUEIL APERÇU
        =============================================== */}

        <Route
          index
          element={
            <HomePage />
          }
        />

        {/* ===============================================
            CLASSE APERÇU
        =============================================== */}

        <Route
          path="class/:classId"
          element={
            <ClassPage />
          }
        />

        {/* ===============================================
            MATIÈRE APERÇU
        =============================================== */}

        <Route
          path="subject/:subjectId"
          element={
            <SubjectPage />
          }
        />

        {/* ===============================================
            CHAPITRE APERÇU
        =============================================== */}

        <Route
          path="chapter/:chapterId"
          element={
            <ChapterPage />
          }
        />

        {/* ===============================================
            LEÇON APERÇU
        =============================================== */}

        <Route
          path="lesson/:lessonId"
          element={
            <LessonPage />
          }
        />

        {/* ===============================================
            EXERCICE / QUIZ APERÇU
        =============================================== */}

        <Route
          path="exercise/:lessonId"
          element={
            <ExercisePage />
          }
        />

        {/* ===============================================
            VIDÉO APERÇU
        =============================================== */}

        <Route
          path="video/:lessonId"
          element={
            <VideoPage />
          }
        />

        {/* ===============================================
            DASHBOARD APERÇU
        =============================================== */}

        <Route
          path="dashboard"
          element={
            <DashboardPage />
          }
        />

        {/* ===============================================
            TÉLÉCHARGEMENTS APERÇU
        =============================================== */}

        <Route
          path="downloads"
          element={
            <DownloadsPage />
          }
        />

        {/* ===============================================
            PROFIL APERÇU
        =============================================== */}

        <Route
          path="profile"
          element={
            <ProfilePage />
          }
        />

        {/* ===============================================
            PARAMÈTRES APERÇU
        =============================================== */}

        <Route
          path="settings"
          element={
            <SettingsPage />
          }
        />

      </Route>


      {/* =================================================
          ADMIN — CLASSES
      ================================================= */}

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

      {/* =================================================
          ADMIN — MATIÈRES
      ================================================= */}

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

      {/* =================================================
          ADMIN — CHAPITRES
      ================================================= */}

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

      {/* =================================================
          ADMIN — LEÇONS
      ================================================= */}

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

      {/* =================================================
          ADMIN — BLOCS PÉDAGOGIQUES
      ================================================= */}

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

      {/* =================================================
          ADMIN — QUIZ
      ================================================= */}

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

      {/* =================================================
          ADMIN — VIDÉOS
      ================================================= */}

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

      {/* =================================================
          ADMIN — STATISTIQUES
      ================================================= */}

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

      {/* =================================================
          ADMIN — PARAMÈTRES
      ================================================= */}

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

      {/* =================================================
          LOGIN UTILISATEUR
      ================================================= */}

      <Route
        path="/login"
        element={
          <LoginPage />
        }
      />

      {/* =================================================
          APPLICATION ÉLÈVE
          TOUTES CES ROUTES PASSENT PAR
          ProtectedStudentRoute
      ================================================= */}

      <Route
        element={
          user ? (
            <ProtectedStudentRoute user={user}>
              <Layout />
            </ProtectedStudentRoute>
          ) : (
            <Navigate
              to="/login"
              replace
            />
          )
        }
      >

        {/* ===============================================
            ACCUEIL
        =============================================== */}

        <Route
          path="/"
          element={
            <HomePage />
          }
        />

        {/* ===============================================
            CLASSE
        =============================================== */}

        <Route
          path="/class/:classId"
          element={
            <ClassPage />
          }
        />

        {/* ===============================================
            MATIÈRE
        =============================================== */}

        <Route
          path="/subject/:subjectId"
          element={
            <SubjectPage />
          }
        />

        {/* ===============================================
            CHAPITRE
        =============================================== */}

        <Route
          path="/chapter/:chapterId"
          element={
            <ChapterPage />
          }
        />

        {/* ===============================================
            LEÇON
        =============================================== */}

        <Route
          path="/lesson/:lessonId"
          element={
            <LessonPage />
          }
        />

        {/* ===============================================
            EXERCICE / QUIZ
        =============================================== */}

        <Route
          path="/exercise/:lessonId"
          element={
            <ExercisePage />
          }
        />

        {/* ===============================================
            DASHBOARD ÉLÈVE
        =============================================== */}

        <Route
          path="/dashboard"
          element={
            <DashboardPage />
          }
        />

        {/* ===============================================
            TÉLÉCHARGEMENTS
        =============================================== */}

        <Route
          path="/downloads"
          element={
            <DownloadsPage />
          }
        />

        {/* ===============================================
            PROFIL
        =============================================== */}

        <Route
          path="/profile"
          element={
            <ProfilePage />
          }
        />

        {/* ===============================================
            PARAMÈTRES
        =============================================== */}

        <Route
          path="/settings"
          element={
            <SettingsPage />
          }
        />

      </Route>


      {/* =================================================
          COURS
      ================================================= */}

      <Route
        path="/courses"
        element={
          user ? (
            <ProtectedStudentRoute user={user}>
              <Layout>
                <CoursesPage />
              </Layout>
            </ProtectedStudentRoute>
          ) : (
            <Navigate
              to="/login"
              replace
            />
          )
        }
      />

      {/* =================================================
          ROUTE INCONNUE
      ================================================= */}

      <Route
        path="*"
        element={
          user ? (
            <Navigate
              to="/"
              replace
            />
          ) : (
            <Navigate
              to="/login"
              replace
            />
          )
        }
      />

    </Routes>
  );
}

export default App;