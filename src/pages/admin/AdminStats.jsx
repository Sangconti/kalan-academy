import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

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

  const successTimeoutRef = useRef(null);


  // =========================================================
  // CHARGEMENT DES STATISTIQUES
  // =========================================================

  const loadStatistics = useCallback(
    async (isRefresh = false) => {
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
          // ---------------------------------------------------
          // PROFILS
          // ---------------------------------------------------
          supabase
            .from("profiles")
            .select(
              "id, full_name, role, class_id, xp, level"
            ),

          // ---------------------------------------------------
          // CLASSES
          // ---------------------------------------------------
          supabase
            .from("classes")
            .select(
              "id, name, description, order_number"
            )
            .order("order_number", {
              ascending: true,
            }),

          // ---------------------------------------------------
          // MATIÈRES
          // ---------------------------------------------------
          supabase
            .from("subjects")
            .select(
              "id, class_id, name, code, order_number"
            )
            .order("order_number", {
              ascending: true,
            }),

          // ---------------------------------------------------
          // CHAPITRES
          // ---------------------------------------------------
          supabase
            .from("chapters")
            .select(
              "id, subject_id, title, order_number"
            ),

          // ---------------------------------------------------
          // LEÇONS
          // ---------------------------------------------------
          supabase
            .from("lessons")
            .select(
              "id, chapter_id, title, video_url, is_premium, order_number"
            ),

          // ---------------------------------------------------
          // QUIZ
          // ---------------------------------------------------
          supabase
            .from("quizzes")
            .select(
              "id, lesson_id, title, passing_score, created_at"
            ),

          // ---------------------------------------------------
          // TENTATIVES DE QUIZ
          // ---------------------------------------------------
          // "answers" n'est pas nécessaire pour AdminStats.
          supabase
            .from("quiz_attempts")
            .select(
              "id, user_id, quiz_id, score, attempt_number, created_at"
            )
            .order("created_at", {
              ascending: false,
            }),

          // ---------------------------------------------------
          // TÉLÉCHARGEMENTS
          // ---------------------------------------------------
          supabase
            .from("downloads")
            .select(
              "id, user_id, lesson_id, file_size_mb, downloaded_at"
            ),
        ]);


        // =====================================================
        // VÉRIFICATION DES ERREURS
        // =====================================================

        const results = [
          {
            name: "profiles",
            result: profilesResult,
          },
          {
            name: "classes",
            result: classesResult,
          },
          {
            name: "subjects",
            result: subjectsResult,
          },
          {
            name: "chapters",
            result: chaptersResult,
          },
          {
            name: "lessons",
            result: lessonsResult,
          },
          {
            name: "quizzes",
            result: quizzesResult,
          },
          {
            name: "quiz_attempts",
            result: attemptsResult,
          },
          {
            name: "downloads",
            result: downloadsResult,
          },
        ];

        const failedResult = results.find(
          ({ result }) => result?.error
        );

        if (failedResult) {
          console.error(
            `Erreur Supabase dans "${failedResult.name}" :`,
            failedResult.result.error
          );

          throw failedResult.result.error;
        }


        // =====================================================
        // STOCKAGE
        // =====================================================

        setProfiles(
          Array.isArray(profilesResult.data)
            ? profilesResult.data
            : []
        );

        setClasses(
          Array.isArray(classesResult.data)
            ? classesResult.data
            : []
        );

        setSubjects(
          Array.isArray(subjectsResult.data)
            ? subjectsResult.data
            : []
        );

        setChapters(
          Array.isArray(chaptersResult.data)
            ? chaptersResult.data
            : []
        );

        setLessons(
          Array.isArray(lessonsResult.data)
            ? lessonsResult.data
            : []
        );

        setQuizzes(
          Array.isArray(quizzesResult.data)
            ? quizzesResult.data
            : []
        );

        setQuizAttempts(
          Array.isArray(attemptsResult.data)
            ? attemptsResult.data
            : []
        );

        setDownloads(
          Array.isArray(downloadsResult.data)
            ? downloadsResult.data
            : []
        );


        // =====================================================
        // MESSAGE DE SUCCÈS
        // =====================================================

        if (isRefresh) {
          setSuccess(
            "Statistiques actualisées avec succès."
          );

          if (successTimeoutRef.current) {
            clearTimeout(
              successTimeoutRef.current
            );
          }

          successTimeoutRef.current =
            setTimeout(() => {
              setSuccess("");
              successTimeoutRef.current = null;
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
    },
    []
  );


  // =========================================================
  // CHARGEMENT INITIAL
  // =========================================================

  useEffect(() => {
    loadStatistics();

    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(
          successTimeoutRef.current
        );

        successTimeoutRef.current = null;
      }
    };
  }, [loadStatistics]);


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

  const lessonsWithVideo = useMemo(() => {
    return lessons.filter(
      (lesson) =>
        typeof lesson.video_url === "string" &&
        lesson.video_url.trim() !== ""
    ).length;
  }, [lessons]);


  // =========================================================
  // XP
  // =========================================================

  const totalXP = useMemo(() => {
    return students.reduce(
      (total, student) =>
        total + (Number(student.xp) || 0),
      0
    );
  }, [students]);


  const averageXP =
    totalStudents > 0
      ? Math.round(
          totalXP / totalStudents
        )
      : 0;


  // =========================================================
  // NIVEAU
  // =========================================================

  const averageLevel =
    totalStudents > 0
      ? (
          students.reduce(
            (total, student) =>
              total +
              (Number(student.level) || 0),
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
              total +
              (Number(attempt.score) || 0),
            0
          ) / totalAttempts
        )
      : 0;


  // =========================================================
  // MAP DES SEUILS DE RÉUSSITE
  // =========================================================

  const quizPassingScores = useMemo(() => {
    const map = new Map();

    quizzes.forEach((quiz) => {
      const passingScore =
        Number(quiz.passing_score);

      map.set(
        quiz.id,
        Number.isFinite(passingScore)
          ? passingScore
          : 50
      );
    });

    return map;
  }, [quizzes]);


  // =========================================================
  // TAUX DE RÉUSSITE
  // =========================================================

  const successRate = useMemo(() => {
    if (totalAttempts === 0) {
      return 0;
    }

    let passed = 0;

    quizAttempts.forEach((attempt) => {
      const passingScore =
        quizPassingScores.get(
          attempt.quiz_id
        ) ?? 50;

      const score =
        Number(attempt.score) || 0;

      if (score >= passingScore) {
        passed += 1;
      }
    });

    return Math.round(
      (passed / totalAttempts) * 100
    );
  }, [
    quizAttempts,
    quizPassingScores,
    totalAttempts,
  ]);


  // =========================================================
  // ÉLÈVES AYANT RÉALISÉ AU MOINS UN QUIZ
  // =========================================================

  const activeStudentIds = useMemo(() => {
    const ids = new Set();

    quizAttempts.forEach((attempt) => {
      if (attempt.user_id) {
        ids.add(attempt.user_id);
      }
    });

    return ids;
  }, [quizAttempts]);


  const activeStudents =
    activeStudentIds.size;


  const activityRate =
    totalStudents > 0
      ? Math.round(
          (activeStudents / totalStudents) *
            100
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
  // MAP DES ÉLÈVES PAR CLASSE
  // =========================================================

  const studentsByClass = useMemo(() => {
    const map = new Map();

    students.forEach((student) => {
      if (!student.class_id) {
        return;
      }

      if (!map.has(student.class_id)) {
        map.set(
          student.class_id,
          []
        );
      }

      map
        .get(student.class_id)
        .push(student);
    });

    return map;
  }, [students]);


  // =========================================================
  // MAP DES TENTATIVES PAR ÉLÈVE
  // =========================================================

  const attemptsByUser = useMemo(() => {
    const map = new Map();

    quizAttempts.forEach((attempt) => {
      if (!attempt.user_id) {
        return;
      }

      if (!map.has(attempt.user_id)) {
        map.set(
          attempt.user_id,
          []
        );
      }

      map
        .get(attempt.user_id)
        .push(attempt);
    });

    return map;
  }, [quizAttempts]);


  // =========================================================
  // STATISTIQUES PAR CLASSE
  // =========================================================

  const classStatistics = useMemo(() => {
    return classes.map((classe) => {
      const classStudents =
        studentsByClass.get(
          classe.id
        ) || [];

      let attemptsCount = 0;
      let totalScore = 0;

      classStudents.forEach(
        (student) => {
          const studentAttempts =
            attemptsByUser.get(
              student.id
            ) || [];

          attemptsCount +=
            studentAttempts.length;

          studentAttempts.forEach(
            (attempt) => {
              totalScore +=
                Number(
                  attempt.score
                ) || 0;
            }
          );
        }
      );

      const averageScore =
        attemptsCount > 0
          ? Math.round(
              totalScore /
                attemptsCount
            )
          : 0;

      const classXP =
        classStudents.reduce(
          (total, student) =>
            total +
            (Number(student.xp) || 0),
          0
        );

      return {
        ...classe,
        students:
          classStudents.length,
        attempts:
          attemptsCount,
        averageScore,
        totalXP: classXP,
      };
    });
  }, [
    classes,
    studentsByClass,
    attemptsByUser,
  ]);


  // =========================================================
  // MAP CHAPITRES PAR MATIÈRE
  // =========================================================

  const chaptersBySubject = useMemo(() => {
    const map = new Map();

    chapters.forEach((chapter) => {
      if (!chapter.subject_id) {
        return;
      }

      if (!map.has(chapter.subject_id)) {
        map.set(
          chapter.subject_id,
          []
        );
      }

      map
        .get(chapter.subject_id)
        .push(chapter);
    });

    return map;
  }, [chapters]);


  // =========================================================
  // MAP LEÇONS PAR CHAPITRE
  // =========================================================

  const lessonsByChapter = useMemo(() => {
    const map = new Map();

    lessons.forEach((lesson) => {
      if (!lesson.chapter_id) {
        return;
      }

      if (!map.has(lesson.chapter_id)) {
        map.set(
          lesson.chapter_id,
          []
        );
      }

      map
        .get(lesson.chapter_id)
        .push(lesson);
    });

    return map;
  }, [lessons]);


  // =========================================================
  // MAP QUIZ PAR LEÇON
  // =========================================================

  const quizzesByLesson = useMemo(() => {
    const map = new Map();

    quizzes.forEach((quiz) => {
      if (!quiz.lesson_id) {
        return;
      }

      if (!map.has(quiz.lesson_id)) {
        map.set(
          quiz.lesson_id,
          []
        );
      }

      map
        .get(quiz.lesson_id)
        .push(quiz);
    });

    return map;
  }, [quizzes]);


  // =========================================================
  // MAP TENTATIVES PAR QUIZ
  // =========================================================

  const attemptsByQuiz = useMemo(() => {
    const map = new Map();

    quizAttempts.forEach((attempt) => {
      if (!attempt.quiz_id) {
        return;
      }

      if (!map.has(attempt.quiz_id)) {
        map.set(
          attempt.quiz_id,
          []
        );
      }

      map
        .get(attempt.quiz_id)
        .push(attempt);
    });

    return map;
  }, [quizAttempts]);


  // =========================================================
  // STATISTIQUES PAR MATIÈRE
  // =========================================================

  const subjectStatistics = useMemo(() => {
    return subjects.map((subject) => {
      const subjectChapters =
        chaptersBySubject.get(
          subject.id
        ) || [];

      let lessonsCount = 0;
      let quizzesCount = 0;
      let attemptsCount = 0;
      let totalScore = 0;

      subjectChapters.forEach(
        (chapter) => {
          const chapterLessons =
            lessonsByChapter.get(
              chapter.id
            ) || [];

          lessonsCount +=
            chapterLessons.length;

          chapterLessons.forEach(
            (lesson) => {
              const lessonQuizzes =
                quizzesByLesson.get(
                  lesson.id
                ) || [];

              quizzesCount +=
                lessonQuizzes.length;

              lessonQuizzes.forEach(
                (quiz) => {
                  const quizAttemptsForSubject =
                    attemptsByQuiz.get(
                      quiz.id
                    ) || [];

                  attemptsCount +=
                    quizAttemptsForSubject.length;

                  quizAttemptsForSubject.forEach(
                    (attempt) => {
                      totalScore +=
                        Number(
                          attempt.score
                        ) || 0;
                    }
                  );
                }
              );
            }
          );
        }
      );

      const averageScore =
        attemptsCount > 0
          ? Math.round(
              totalScore /
                attemptsCount
            )
          : 0;

      return {
        ...subject,
        chapters:
          subjectChapters.length,
        lessons:
          lessonsCount,
        quizzes:
          quizzesCount,
        attempts:
          attemptsCount,
        averageScore,
      };
    });
  }, [
    subjects,
    chaptersBySubject,
    lessonsByChapter,
    quizzesByLesson,
    attemptsByQuiz,
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
  // RENDU CHARGEMENT
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


  // =========================================================
  // RENDU PRINCIPAL
  // =========================================================

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

        <StatCard
          icon={Users}
          label="Élèves"
          value={totalStudents}
          description={`${activeStudents} actifs`}
          iconClass="text-blue-600"
          bgClass="bg-blue-100"
        />


        <StatCard
          icon={Trophy}
          label="XP total"
          value={totalXP.toLocaleString("fr-FR")}
          description={`${averageXP.toLocaleString("fr-FR")} XP moyen`}
          iconClass="text-yellow-600"
          bgClass="bg-yellow-100"
        />


        <StatCard
          icon={ClipboardCheck}
          label="Tentatives de quiz"
          value={totalAttempts}
          description={`${successRate}% de réussite`}
          iconClass="text-green-600"
          bgClass="bg-green-100"
        />


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