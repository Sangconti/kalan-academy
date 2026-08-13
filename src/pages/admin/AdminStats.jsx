import { useEffect, useMemo, useState } from "react";

import {
  BarChart3,
  Users,
  BookOpen,
  Trophy,
  ClipboardCheck,
  GraduationCap,
  Video,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Loader2,
  TrendingUp,
  Award,
  Download,
} from "lucide-react";

import { supabase } from "../../lib/supabase";


export default function AdminStats() {
  // =========================================================
  // ÉTATS
  // =========================================================

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [profiles, setProfiles] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [downloads, setDownloads] = useState([]);


  // =========================================================
  // CHARGEMENT DES STATISTIQUES
  // =========================================================

  const loadStatistics = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");
      setSuccess("");

      const [
        profilesResult,
        classesResult,
        subjectsResult,
        chaptersResult,
        lessonsResult,
        quizzesResult,
        attemptsResult,
        downloadsResult,
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            "id, full_name, avatar_url, role, class_id, is_premium, xp, level, created_at"
          ),

        supabase
          .from("classes")
          .select(
            "id, name, description, order_number"
          )
          .order("order_number", {
            ascending: true,
          }),

        supabase
          .from("subjects")
          .select(
            "id, class_id, name, code, order_number"
          )
          .order("order_number", {
            ascending: true,
          }),

        supabase
          .from("chapters")
          .select(
            "id, subject_id, title, order_number"
          ),

        supabase
          .from("lessons")
          .select(
            "id, chapter_id, title, video_url, is_premium, order_number"
          ),

        supabase
          .from("quizzes")
          .select(
            "id, lesson_id, title, passing_score, created_at"
          ),

        supabase
          .from("quiz_attempts")
          .select(
            "id, user_id, quiz_id, score, answers, attempt_number, created_at"
          )
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("downloads")
          .select(
            "id, user_id, lesson_id, file_size_mb, downloaded_at"
          ),
      ]);


      // =======================================================
      // VÉRIFICATION DES ERREURS
      // =======================================================

      const results = [
        profilesResult,
        classesResult,
        subjectsResult,
        chaptersResult,
        lessonsResult,
        quizzesResult,
        attemptsResult,
        downloadsResult,
      ];

      const failedResult = results.find(
        (result) => result.error
      );

      if (failedResult) {
        throw failedResult.error;
      }


      // =======================================================
      // STOCKAGE
      // =======================================================

      setProfiles(profilesResult.data || []);
      setClasses(classesResult.data || []);
      setSubjects(subjectsResult.data || []);
      setChapters(chaptersResult.data || []);
      setLessons(lessonsResult.data || []);
      setQuizzes(quizzesResult.data || []);
      setQuizAttempts(attemptsResult.data || []);
      setDownloads(downloadsResult.data || []);


      if (isRefresh) {
        setSuccess(
          "Statistiques actualisées avec succès."
        );

        setTimeout(() => {
          setSuccess("");
        }, 3000);
      }

    } catch (err) {
      console.error(
        "Erreur chargement statistiques :",
        err
      );

      setError(
        err?.message ||
          "Impossible de charger les statistiques."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  // =========================================================
  // CHARGEMENT INITIAL
  // =========================================================

  useEffect(() => {
    loadStatistics();
  }, []);


  // =========================================================
  // ÉLÈVES
  // =========================================================

  const students = useMemo(() => {
    return profiles.filter(
      (profile) =>
        profile.role === "student" ||
        profile.role === "élève" ||
        profile.role === "eleve" ||
        !profile.role
    );
  }, [profiles]);


  // =========================================================
  // STATISTIQUES GÉNÉRALES
  // =========================================================

  const totalStudents = students.length;

  const totalClasses = classes.length;

  const totalSubjects = subjects.length;

  const totalChapters = chapters.length;

  const totalLessons = lessons.length;

  const totalQuizzes = quizzes.length;

  const totalAttempts = quizAttempts.length;

  const totalDownloads = downloads.length;


  // =========================================================
  // VIDÉOS
  // =========================================================

  const lessonsWithVideo = lessons.filter(
    (lesson) =>
      typeof lesson.video_url === "string" &&
      lesson.video_url.trim() !== ""
  ).length;


  // =========================================================
  // XP
  // =========================================================

  const totalXP = students.reduce(
    (total, student) =>
      total + (Number(student.xp) || 0),
    0
  );

  const averageXP =
    totalStudents > 0
      ? Math.round(totalXP / totalStudents)
      : 0;


  // =========================================================
  // NIVEAU
  // =========================================================

  const averageLevel =
    totalStudents > 0
      ? (
          students.reduce(
            (total, student) =>
              total + (Number(student.level) || 0),
            0
          ) / totalStudents
        ).toFixed(1)
      : 0;


  // =========================================================
  // SCORES QUIZ
  // =========================================================

  const averageQuizScore =
    totalAttempts > 0
      ? Math.round(
          quizAttempts.reduce(
            (total, attempt) =>
              total + (Number(attempt.score) || 0),
            0
          ) / totalAttempts
        )
      : 0;


  // =========================================================
  // TAUX DE RÉUSSITE
  // =========================================================

  const passedAttempts = quizAttempts.filter(
    (attempt) => {
      const quiz = quizzes.find(
        (item) => item.id === attempt.quiz_id
      );

      const passingScore =
        Number(quiz?.passing_score) || 50;

      return (
        Number(attempt.score) >= passingScore
      );
    }
  ).length;


  const successRate =
    totalAttempts > 0
      ? Math.round(
          (passedAttempts / totalAttempts) * 100
        )
      : 0;


  // =========================================================
  // ÉLÈVES AYANT RÉALISÉ AU MOINS UN QUIZ
  // =========================================================

  const activeStudentIds = useMemo(() => {
    return new Set(
      quizAttempts
        .map((attempt) => attempt.user_id)
        .filter(Boolean)
    );
  }, [quizAttempts]);


  const activeStudents =
    activeStudentIds.size;


  const activityRate =
    totalStudents > 0
      ? Math.round(
          (activeStudents / totalStudents) * 100
        )
      : 0;


  // =========================================================
  // CLASSEMENT XP
  // =========================================================

  const topStudents = useMemo(() => {
    return [...students]
      .sort(
        (a, b) =>
          (Number(b.xp) || 0) -
          (Number(a.xp) || 0)
      )
      .slice(0, 10);
  }, [students]);


  // =========================================================
  // STATISTIQUES PAR CLASSE
  // =========================================================

  const classStatistics = useMemo(() => {
    return classes.map((classe) => {
      const classStudents = students.filter(
        (student) =>
          student.class_id === classe.id
      );

      const classStudentIds = new Set(
        classStudents.map(
          (student) => student.id
        )
      );

      const classAttempts =
        quizAttempts.filter((attempt) =>
          classStudentIds.has(attempt.user_id)
        );

      const averageScore =
        classAttempts.length > 0
          ? Math.round(
              classAttempts.reduce(
                (total, attempt) =>
                  total +
                  (Number(attempt.score) || 0),
                0
              ) / classAttempts.length
            )
          : 0;

      const classXP = classStudents.reduce(
        (total, student) =>
          total + (Number(student.xp) || 0),
        0
      );

      return {
        ...classe,
        students: classStudents.length,
        attempts: classAttempts.length,
        averageScore,
        totalXP: classXP,
      };
    });
  }, [
    classes,
    students,
    quizAttempts,
  ]);


  // =========================================================
  // STATISTIQUES PAR MATIÈRE
  // =========================================================

  const subjectStatistics = useMemo(() => {
    return subjects.map((subject) => {
      const subjectChapters =
        chapters.filter(
          (chapter) =>
            chapter.subject_id === subject.id
        );

      const chapterIds = new Set(
        subjectChapters.map(
          (chapter) => chapter.id
        )
      );

      const subjectLessons =
        lessons.filter((lesson) =>
          chapterIds.has(lesson.chapter_id)
        );

      const lessonIds = new Set(
        subjectLessons.map(
          (lesson) => lesson.id
        )
      );

      const subjectQuizzes =
        quizzes.filter((quiz) =>
          lessonIds.has(quiz.lesson_id)
        );

      const quizIds = new Set(
        subjectQuizzes.map(
          (quiz) => quiz.id
        )
      );

      const subjectAttempts =
        quizAttempts.filter((attempt) =>
          quizIds.has(attempt.quiz_id)
        );

      const averageScore =
        subjectAttempts.length > 0
          ? Math.round(
              subjectAttempts.reduce(
                (total, attempt) =>
                  total +
                  (Number(attempt.score) || 0),
                0
              ) /
                subjectAttempts.length
            )
          : 0;

      return {
        ...subject,
        chapters: subjectChapters.length,
        lessons: subjectLessons.length,
        quizzes: subjectQuizzes.length,
        attempts: subjectAttempts.length,
        averageScore,
      };
    });
  }, [
    subjects,
    chapters,
    lessons,
    quizzes,
    quizAttempts,
  ]);


  // =========================================================
  // FORMAT NOM ÉLÈVE
  // =========================================================

  const getStudentName = (student) => {
    return (
      student.full_name ||
      "Élève sans nom"
    );
  };


  // =========================================================
  // RENDU
  // =========================================================

  if (loading) {
    return (
      <div className="p-6">

        <div className="flex items-center justify-center min-h-[400px]">

          <div className="text-center">

            <Loader2
              size={40}
              className="animate-spin text-blue-600 mx-auto mb-4"
            />

            <p className="text-slate-600">
              Chargement des statistiques...
            </p>

          </div>

        </div>

      </div>
    );
  }


  return (
    <div className="p-6">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">

        <div>

          <div className="flex items-center gap-3">

            <div className="p-3 bg-blue-100 rounded-xl">

              <BarChart3
                size={25}
                className="text-blue-600"
              />

            </div>

            <div>

              <h1 className="text-2xl font-bold text-slate-900">
                Statistiques
              </h1>

              <p className="text-sm text-slate-500">
                Vue globale des performances de Kalan Academy.
              </p>

            </div>

          </div>

        </div>


        <button
          type="button"
          onClick={() => loadStatistics(true)}
          disabled={refreshing}
          className="
            inline-flex
            items-center
            justify-center
            gap-2
            px-4
            py-2.5
            rounded-lg
            bg-blue-600
            text-white
            hover:bg-blue-700
            disabled:opacity-50
            disabled:cursor-not-allowed
          "
        >

          <RefreshCw
            size={18}
            className={
              refreshing
                ? "animate-spin"
                : ""
            }
          />

          Actualiser

        </button>

      </div>


      {/* =====================================================
          ERREUR
      ===================================================== */}

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex gap-3">

          <AlertCircle
            size={20}
            className="shrink-0"
          />

          <div>

            <p className="font-semibold">
              Impossible de charger les statistiques
            </p>

            <p className="text-sm mt-1">
              {error}
            </p>

          </div>

        </div>
      )}


      {/* =====================================================
          SUCCÈS
      ===================================================== */}

      {success && (
        <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 flex gap-3">

          <CheckCircle
            size={20}
            className="shrink-0"
          />

          <p className="text-sm font-medium">
            {success}
          </p>

        </div>
      )}


      {/* =====================================================
          CARTES PRINCIPALES
      ===================================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">

        {/* Élèves */}

        <StatCard
          icon={Users}
          label="Élèves"
          value={totalStudents}
          description={`${activeStudents} actifs`}
          iconClass="text-blue-600"
          bgClass="bg-blue-100"
        />


        {/* XP */}

        <StatCard
          icon={Trophy}
          label="XP total"
          value={totalXP.toLocaleString("fr-FR")}
          description={`${averageXP.toLocaleString("fr-FR")} XP moyen`}
          iconClass="text-yellow-600"
          bgClass="bg-yellow-100"
        />


        {/* Quiz */}

        <StatCard
          icon={ClipboardCheck}
          label="Tentatives de quiz"
          value={totalAttempts}
          description={`${successRate}% de réussite`}
          iconClass="text-green-600"
          bgClass="bg-green-100"
        />


        {/* Score */}

        <StatCard
          icon={TrendingUp}
          label="Score moyen"
          value={`${averageQuizScore}%`}
          description={`${activeStudents} élèves actifs`}
          iconClass="text-purple-600"
          bgClass="bg-purple-100"
        />

      </div>


      {/* =====================================================
          CONTENU PÉDAGOGIQUE
      ===================================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5 mb-8">

        <MiniStat
          icon={GraduationCap}
          label="Classes"
          value={totalClasses}
        />

        <MiniStat
          icon={BookOpen}
          label="Matières"
          value={totalSubjects}
        />

        <MiniStat
          icon={BookOpen}
          label="Chapitres"
          value={totalChapters}
        />

        <MiniStat
          icon={BookOpen}
          label="Leçons"
          value={totalLessons}
        />

        <MiniStat
          icon={Video}
          label="Leçons vidéo"
          value={`${lessonsWithVideo}/${totalLessons}`}
        />

      </div>


      {/* =====================================================
          ANALYSE ACTIVITÉ
      ===================================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

        {/* Activité */}

        <div className="bg-white border border-slate-200 rounded-xl p-5">

          <h2 className="font-semibold text-slate-900 mb-4">
            Activité élèves
          </h2>

          <div className="flex items-center gap-4">

            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">

              <Users
                size={28}
                className="text-blue-600"
              />

            </div>

            <div>

              <p className="text-3xl font-bold text-slate-900">
                {activityRate}%
              </p>

              <p className="text-sm text-slate-500">
                des élèves ont réalisé un quiz
              </p>

            </div>

          </div>

        </div>


        {/* Niveau */}

        <div className="bg-white border border-slate-200 rounded-xl p-5">

          <h2 className="font-semibold text-slate-900 mb-4">
            Niveau moyen
          </h2>

          <div className="flex items-center gap-4">

            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">

              <Award
                size={28}
                className="text-purple-600"
              />

            </div>

            <div>

              <p className="text-3xl font-bold text-slate-900">
                {averageLevel}
              </p>

              <p className="text-sm text-slate-500">
                niveau moyen des élèves
              </p>

            </div>

          </div>

        </div>


        {/* Téléchargements */}

        <div className="bg-white border border-slate-200 rounded-xl p-5">

          <h2 className="font-semibold text-slate-900 mb-4">
            Téléchargements
          </h2>

          <div className="flex items-center gap-4">

            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">

              <Download
                size={28}
                className="text-green-600"
              />

            </div>

            <div>

              <p className="text-3xl font-bold text-slate-900">
                {totalDownloads}
              </p>

              <p className="text-sm text-slate-500">
                téléchargements enregistrés
              </p>

            </div>

          </div>

        </div>

      </div>


      {/* =====================================================
          CLASSES
      ===================================================== */}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-8">

        <div className="p-5 border-b border-slate-200">

          <h2 className="text-lg font-semibold text-slate-900">
            Statistiques par classe
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            Élèves, XP et performances aux quiz.
          </p>

        </div>


        {classStatistics.length === 0 ? (

          <div className="p-8 text-center text-slate-500">
            Aucune classe disponible.
          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full text-sm">

              <thead className="bg-slate-50">

                <tr>

                  <th className="text-left p-4 font-semibold text-slate-600">
                    Classe
                  </th>

                  <th className="text-left p-4 font-semibold text-slate-600">
                    Élèves
                  </th>

                  <th className="text-left p-4 font-semibold text-slate-600">
                    XP total
                  </th>

                  <th className="text-left p-4 font-semibold text-slate-600">
                    Quiz
                  </th>

                  <th className="text-left p-4 font-semibold text-slate-600">
                    Score moyen
                  </th>

                </tr>

              </thead>


              <tbody>

                {classStatistics.map((classe) => (

                  <tr
                    key={classe.id}
                    className="border-t border-slate-100"
                  >

                    <td className="p-4 font-medium text-slate-900">
                      {classe.name}
                    </td>

                    <td className="p-4 text-slate-600">
                      {classe.students}
                    </td>

                    <td className="p-4 text-slate-600">
                      {classe.totalXP.toLocaleString("fr-FR")}
                    </td>

                    <td className="p-4 text-slate-600">
                      {classe.attempts}
                    </td>

                    <td className="p-4">

                      <span
                        className={`
                          inline-flex
                          px-2.5
                          py-1
                          rounded-full
                          text-xs
                          font-semibold

                          ${
                            classe.averageScore >= 70
                              ? "bg-green-100 text-green-700"
                              : classe.averageScore >= 50
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }
                        `}
                      >
                        {classe.averageScore}%
                      </span>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>


      {/* =====================================================
          MATIÈRES
      ===================================================== */}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-8">

        <div className="p-5 border-b border-slate-200">

          <h2 className="text-lg font-semibold text-slate-900">
            Statistiques par matière
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            Contenu pédagogique et performances des quiz.
          </p>

        </div>


        {subjectStatistics.length === 0 ? (

          <div className="p-8 text-center text-slate-500">
            Aucune matière disponible.
          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full text-sm">

              <thead className="bg-slate-50">

                <tr>

                  <th className="text-left p-4 font-semibold text-slate-600">
                    Matière
                  </th>

                  <th className="text-left p-4 font-semibold text-slate-600">
                    Chapitres
                  </th>

                  <th className="text-left p-4 font-semibold text-slate-600">
                    Leçons
                  </th>

                  <th className="text-left p-4 font-semibold text-slate-600">
                    Quiz
                  </th>

                  <th className="text-left p-4 font-semibold text-slate-600">
                    Tentatives
                  </th>

                  <th className="text-left p-4 font-semibold text-slate-600">
                    Score moyen
                  </th>

                </tr>

              </thead>


              <tbody>

                {subjectStatistics.map((subject) => (

                  <tr
                    key={subject.id}
                    className="border-t border-slate-100"
                  >

                    <td className="p-4">

                      <div>

                        <p className="font-medium text-slate-900">
                          {subject.name}
                        </p>

                        {subject.code && (
                          <p className="text-xs text-slate-400">
                            {subject.code}
                          </p>
                        )}

                      </div>

                    </td>

                    <td className="p-4 text-slate-600">
                      {subject.chapters}
                    </td>

                    <td className="p-4 text-slate-600">
                      {subject.lessons}
                    </td>

                    <td className="p-4 text-slate-600">
                      {subject.quizzes}
                    </td>

                    <td className="p-4 text-slate-600">
                      {subject.attempts}
                    </td>

                    <td className="p-4">

                      <span
                        className={`
                          inline-flex
                          px-2.5
                          py-1
                          rounded-full
                          text-xs
                          font-semibold

                          ${
                            subject.averageScore >= 70
                              ? "bg-green-100 text-green-700"
                              : subject.averageScore >= 50
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }
                        `}
                      >
                        {subject.averageScore}%
                      </span>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>


      {/* =====================================================
          CLASSEMENT XP
      ===================================================== */}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">

        <div className="p-5 border-b border-slate-200">

          <h2 className="text-lg font-semibold text-slate-900">
            Classement XP
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            Les élèves ayant accumulé le plus d'XP.
          </p>

        </div>


        {topStudents.length === 0 ? (

          <div className="p-8 text-center text-slate-500">
            Aucun élève disponible.
          </div>

        ) : (

          <div className="divide-y divide-slate-100">

            {topStudents.map(
              (student, index) => (

                <div
                  key={student.id}
                  className="flex items-center justify-between gap-4 p-4"
                >

                  <div className="flex items-center gap-4 min-w-0">

                    <div
                      className={`
                        w-9
                        h-9
                        rounded-full
                        flex
                        items-center
                        justify-center
                        font-bold
                        shrink-0

                        ${
                          index === 0
                            ? "bg-yellow-100 text-yellow-700"
                            : index === 1
                            ? "bg-slate-200 text-slate-700"
                            : index === 2
                            ? "bg-orange-100 text-orange-700"
                            : "bg-slate-100 text-slate-500"
                        }
                      `}
                    >
                      {index + 1}
                    </div>


                    <div className="min-w-0">

                      <p className="font-medium text-slate-900 truncate">
                        {getStudentName(student)}
                      </p>

                      <p className="text-xs text-slate-500">
                        Niveau {Number(student.level) || 0}
                      </p>

                    </div>

                  </div>


                  <div className="flex items-center gap-2 shrink-0">

                    <Trophy
                      size={17}
                      className="text-yellow-500"
                    />

                    <span className="font-bold text-slate-900">
                      {(Number(student.xp) || 0).toLocaleString(
                        "fr-FR"
                      )}
                    </span>

                    <span className="text-xs text-slate-500">
                      XP
                    </span>

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </div>

    </div>
  );
}


// ===========================================================
// COMPOSANT STAT CARD
// ===========================================================

function StatCard({
  icon: Icon,
  label,
  value,
  description,
  iconClass,
  bgClass,
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">

      <div className="flex items-start justify-between gap-4">

        <div>

          <p className="text-sm text-slate-500">
            {label}
          </p>

          <p className="text-3xl font-bold text-slate-900 mt-2">
            {value}
          </p>

          {description && (
            <p className="text-xs text-slate-500 mt-2">
              {description}
            </p>
          )}

        </div>


        <div
          className={`
            p-3
            rounded-xl
            ${bgClass}
          `}
        >

          <Icon
            size={22}
            className={iconClass}
          />

        </div>

      </div>

    </div>
  );
}


// ===========================================================
// COMPOSANT MINI STAT
// ===========================================================

function MiniStat({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">

      <div className="flex items-center gap-3">

        <div className="p-2 bg-slate-100 rounded-lg">

          <Icon
            size={19}
            className="text-slate-600"
          />

        </div>

        <div>

          <p className="text-xs text-slate-500">
            {label}
          </p>

          <p className="text-xl font-bold text-slate-900">
            {value}
          </p>

        </div>

      </div>

    </div>
  );
}
