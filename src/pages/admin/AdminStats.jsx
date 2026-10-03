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

// ===========================================================
// CACHE MÉMOIRE
// ===========================================================

let statisticsCache = null;
let statisticsLoadingPromise = null;

// ===========================================================
// CHARGEMENT CENTRALISÉ
// ===========================================================

async function fetchStatistics() {
  if (statisticsCache) {
    return statisticsCache;
  }

  if (statisticsLoadingPromise) {
    return statisticsLoadingPromise;
  }

  statisticsLoadingPromise = (async () => {
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
      // -------------------------------------------------------
      // PROFILS
      // -------------------------------------------------------
      supabase
        .from("profiles")
        .select(
          "id, full_name, role, class_id, xp, level"
        ),

      // -------------------------------------------------------
      // CLASSES
      // -------------------------------------------------------
      supabase
        .from("classes")
        .select("id, name")
        .order("name", {
          ascending: true,
        }),

      // -------------------------------------------------------
      // MATIÈRES
      // -------------------------------------------------------
      supabase
        .from("subjects")
        .select("id, name, code")
        .order("order_number", {
          ascending: true,
        }),

      // -------------------------------------------------------
      // CHAPITRES
      // -------------------------------------------------------
      supabase
        .from("chapters")
        .select(
          "id, subject_id, title"
        ),

      // -------------------------------------------------------
      // LEÇONS
      // -------------------------------------------------------
      supabase
        .from("lessons")
        .select(
          "id, chapter_id, title, video_url, is_premium"
        ),

      // -------------------------------------------------------
      // QUIZ
      // -------------------------------------------------------
      supabase
        .from("quizzes")
        .select(
          "id, lesson_id, passing_score"
        ),

      // -------------------------------------------------------
      // TENTATIVES
      // -------------------------------------------------------
      supabase
        .from("quiz_attempts")
        .select(
          "id, user_id, quiz_id, score"
        )
        .order("created_at", {
          ascending: false,
        }),

      // -------------------------------------------------------
      // TÉLÉCHARGEMENTS
      // -------------------------------------------------------
      // On ne récupère plus toutes les lignes.
      // La page utilise uniquement le nombre total.
      supabase
        .from("downloads")
        .select("id", {
          count: "exact",
          head: true,
        }),
    ]);

    // =========================================================
    // VÉRIFICATION DES ERREURS
    // =========================================================

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

    const statistics = {
      profiles: Array.isArray(profilesResult.data)
        ? profilesResult.data
        : [],

      classes: Array.isArray(classesResult.data)
        ? classesResult.data
        : [],

      subjects: Array.isArray(subjectsResult.data)
        ? subjectsResult.data
        : [],

      chapters: Array.isArray(chaptersResult.data)
        ? chaptersResult.data
        : [],

      lessons: Array.isArray(lessonsResult.data)
        ? lessonsResult.data
        : [],

      quizzes: Array.isArray(quizzesResult.data)
        ? quizzesResult.data
        : [],

      quizAttempts: Array.isArray(attemptsResult.data)
        ? attemptsResult.data
        : [],

      downloads: Number(downloadsResult.count) || 0,
    };

    statisticsCache = statistics;

    return statistics;
  })();

  try {
    return await statisticsLoadingPromise;
  } finally {
    statisticsLoadingPromise = null;
  }
}

// ===========================================================
// COMPOSANT PRINCIPAL
// ===========================================================

export default function AdminStats() {
  // =========================================================
  // ÉTATS
  // =========================================================

  const [loading, setLoading] = useState(
    () => !statisticsCache
  );

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [profiles, setProfiles] = useState(
    () => statisticsCache?.profiles || []
  );

  const [classes, setClasses] = useState(
    () => statisticsCache?.classes || []
  );

  const [subjects, setSubjects] = useState(
    () => statisticsCache?.subjects || []
  );

  const [chapters, setChapters] = useState(
    () => statisticsCache?.chapters || []
  );

  const [lessons, setLessons] = useState(
    () => statisticsCache?.lessons || []
  );

  const [quizzes, setQuizzes] = useState(
    () => statisticsCache?.quizzes || []
  );

  const [quizAttempts, setQuizAttempts] = useState(
    () => statisticsCache?.quizAttempts || []
  );

  const [downloads, setDownloads] = useState(
    () => statisticsCache?.downloads || 0
  );

  const successTimeoutRef = useRef(null);

  // =========================================================
  // APPLICATION DES DONNÉES
  // =========================================================

  const applyStatistics = useCallback(
    (statistics) => {
      setProfiles(statistics.profiles);
      setClasses(statistics.classes);
      setSubjects(statistics.subjects);
      setChapters(statistics.chapters);
      setLessons(statistics.lessons);
      setQuizzes(statistics.quizzes);
      setQuizAttempts(statistics.quizAttempts);
      setDownloads(statistics.downloads);
    },
    []
  );

  // =========================================================
  // CHARGEMENT DES STATISTIQUES
  // =========================================================

  const loadStatistics = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);

          // Le bouton Actualiser force une nouvelle récupération.
          statisticsCache = null;
        } else if (!statisticsCache) {
          setLoading(true);
        }

        setError("");
        setSuccess("");

        const statistics =
          await fetchStatistics();

        applyStatistics(statistics);

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
    [applyStatistics]
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
  const totalDownloads = downloads;

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
        map.set(student.class_id, []);
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
        map.set(attempt.user_id, []);
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
        map.set(chapter.subject_id, []);
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
        map.set(lesson.chapter_id, []);
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
        map.set(quiz.lesson_id, []);
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
        map.set(attempt.quiz_id, []);
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
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="theme-surface theme-border border rounded-3xl shadow-sm p-8 text-center">
            <Loader2
              size={40}
              className="animate-spin text-accent mx-auto mb-4"
            />

            <p className="theme-text font-semibold">
              Chargement des statistiques...
            </p>

            <p className="theme-text-secondary text-sm mt-1">
              Analyse des données de Kalan Academy.
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
    <div className="p-4 md:p-6 space-y-7">
      {/* HEADER */}

      <div
        className="
          relative
          overflow-hidden
          rounded-3xl
          bg-accent-soft
          border
          border-accent
          p-6
          md:p-8
          shadow-lg
        "
      >
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-accent opacity-10" />
        <div className="absolute -left-16 -bottom-20 w-48 h-48 rounded-full bg-accent opacity-10" />
        <div className="absolute right-16 -bottom-24 w-56 h-56 rounded-full bg-accent opacity-5" />

        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 shrink-0 rounded-2xl bg-white/70 dark:bg-gray-950/30 border border-white/50 dark:border-white/10 flex items-center justify-center">
                <BarChart3
                  size={27}
                  className="text-accent"
                />
              </div>

              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent text-white text-xs font-semibold mb-3">
                  <TrendingUp size={14} />
                  Analyse de la plateforme
                </div>

                <h1 className="text-2xl md:text-3xl font-bold leading-tight theme-text">
                  Statistiques
                </h1>

                <p className="theme-text-secondary mt-3 leading-relaxed">
                  Vue globale des performances et de
                  l'activité de Kalan Academy.
                </p>
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
                px-5
                py-3
                rounded-xl
                bg-accent
                text-white
                font-bold
                shadow-md
                hover:opacity-90
                hover:-translate-y-0.5
                disabled:opacity-50
                disabled:cursor-not-allowed
                transition
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

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/70 dark:bg-gray-950/30 theme-text text-sm font-medium border border-white/50 dark:border-white/10">
              <Users
                size={16}
                className="text-accent"
              />
              {totalStudents} élève
              {totalStudents > 1 ? "s" : ""}
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/70 dark:bg-gray-950/30 theme-text text-sm font-medium border border-white/50 dark:border-white/10">
              <BookOpen
                size={16}
                className="text-accent"
              />
              {totalLessons} leçon
              {totalLessons > 1 ? "s" : ""}
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/70 dark:bg-gray-950/30 theme-text text-sm font-medium border border-white/50 dark:border-white/10">
              <ClipboardCheck
                size={16}
                className="text-accent"
              />
              {totalAttempts} tentative
              {totalAttempts > 1 ? "s" : ""}
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/70 dark:bg-gray-950/30 theme-text text-sm font-medium border border-white/50 dark:border-white/10">
              <Video
                size={16}
                className="text-accent"
              />
              {lessonsWithVideo} vidéo
              {lessonsWithVideo > 1 ? "s" : ""}
            </div>
          </div>
        </div>
      </div>

      {/* ERREUR */}

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 flex gap-3">
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

      {/* SUCCÈS */}

      {success && (
        <div className="p-4 rounded-2xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 text-green-700 dark:text-green-300 flex gap-3">
          <CheckCircle
            size={20}
            className="shrink-0"
          />

          <p className="text-sm font-medium">
            {success}
          </p>
        </div>
      )}

      {/* CARTES PRINCIPALES */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          icon={Users}
          label="Élèves"
          value={totalStudents}
          description={`${activeStudents} actifs`}
          iconClass="text-accent"
        />

        <StatCard
          icon={Trophy}
          label="XP total"
          value={totalXP.toLocaleString("fr-FR")}
          description={`${averageXP.toLocaleString("fr-FR")} XP moyen`}
          iconClass="text-yellow-600 dark:text-yellow-300"
        />

        <StatCard
          icon={ClipboardCheck}
          label="Tentatives de quiz"
          value={totalAttempts}
          description={`${successRate}% de réussite`}
          iconClass="text-green-600 dark:text-green-300"
        />

        <StatCard
          icon={TrendingUp}
          label="Score moyen"
          value={`${averageQuizScore}%`}
          description={`${activeStudents} élèves actifs`}
          iconClass="text-purple-600 dark:text-purple-300"
        />
      </div>

      {/* CONTENU PÉDAGOGIQUE */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5">
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

      {/* ANALYSE ACTIVITÉ */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <InsightCard
          title="Activité élèves"
          icon={Users}
          iconClass="text-accent"
          iconBackground="bg-accent-soft"
          value={`${activityRate}%`}
          description="des élèves ont réalisé un quiz"
        />

        <InsightCard
          title="Niveau moyen"
          icon={Award}
          iconClass="text-purple-600 dark:text-purple-300"
          iconBackground="bg-purple-50 dark:bg-purple-950/30"
          value={averageLevel}
          description="niveau moyen des élèves"
        />

        <InsightCard
          title="Téléchargements"
          icon={Download}
          iconClass="text-green-600 dark:text-green-300"
          iconBackground="bg-green-50 dark:bg-green-950/30"
          value={totalDownloads}
          description="téléchargements enregistrés"
        />
      </div>

      {/* CLASSES */}

      <div className="theme-surface theme-border border rounded-3xl overflow-hidden shadow-sm">
        <div className="p-5 md:p-6 border-b theme-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-soft border border-accent flex items-center justify-center">
              <GraduationCap
                size={19}
                className="text-accent"
              />
            </div>

            <div>
              <h2 className="text-lg font-bold theme-text">
                Statistiques par classe
              </h2>

              <p className="text-sm theme-text-secondary mt-1">
                Élèves, XP et performances aux quiz.
              </p>
            </div>
          </div>
        </div>

        {classStatistics.length === 0 ? (
          <div className="p-8 text-center theme-text-secondary">
            Aucune classe disponible.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-accent-soft">
                <tr>
                  <th className="text-left p-4 font-semibold theme-text-secondary">
                    Classe
                  </th>

                  <th className="text-left p-4 font-semibold theme-text-secondary">
                    Élèves
                  </th>

                  <th className="text-left p-4 font-semibold theme-text-secondary">
                    XP total
                  </th>

                  <th className="text-left p-4 font-semibold theme-text-secondary">
                    Quiz
                  </th>

                  <th className="text-left p-4 font-semibold theme-text-secondary">
                    Score moyen
                  </th>
                </tr>
              </thead>

              <tbody>
                {classStatistics.map((classe) => (
                  <tr
                    key={classe.id}
                    className="border-t theme-border hover:bg-accent-soft transition"
                  >
                    <td className="p-4 font-semibold theme-text">
                      {classe.name}
                    </td>

                    <td className="p-4 theme-text-secondary">
                      {classe.students}
                    </td>

                    <td className="p-4 theme-text-secondary">
                      {classe.totalXP.toLocaleString(
                        "fr-FR"
                      )}
                    </td>

                    <td className="p-4 theme-text-secondary">
                      {classe.attempts}
                    </td>

                    <td className="p-4">
                      <ScoreBadge
                        score={classe.averageScore}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MATIÈRES */}

      <div className="theme-surface theme-border border rounded-3xl overflow-hidden shadow-sm">
        <div className="p-5 md:p-6 border-b theme-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-soft border border-accent flex items-center justify-center">
              <BookOpen
                size={19}
                className="text-accent"
              />
            </div>

            <div>
              <h2 className="text-lg font-bold theme-text">
                Statistiques par matière
              </h2>

              <p className="text-sm theme-text-secondary mt-1">
                Contenu pédagogique et performances des quiz.
              </p>
            </div>
          </div>
        </div>

        {subjectStatistics.length === 0 ? (
          <div className="p-8 text-center theme-text-secondary">
            Aucune matière disponible.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-accent-soft">
                <tr>
                  <th className="text-left p-4 font-semibold theme-text-secondary">
                    Matière
                  </th>

                  <th className="text-left p-4 font-semibold theme-text-secondary">
                    Chapitres
                  </th>

                  <th className="text-left p-4 font-semibold theme-text-secondary">
                    Leçons
                  </th>

                  <th className="text-left p-4 font-semibold theme-text-secondary">
                    Quiz
                  </th>

                  <th className="text-left p-4 font-semibold theme-text-secondary">
                    Tentatives
                  </th>

                  <th className="text-left p-4 font-semibold theme-text-secondary">
                    Score moyen
                  </th>
                </tr>
              </thead>

              <tbody>
                {subjectStatistics.map((subject) => (
                  <tr
                    key={subject.id}
                    className="border-t theme-border hover:bg-accent-soft transition"
                  >
                    <td className="p-4">
                      <div>
                        <p className="font-semibold theme-text">
                          {subject.name}
                        </p>

                        {subject.code && (
                          <p className="text-xs theme-text-secondary mt-0.5">
                            {subject.code}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="p-4 theme-text-secondary">
                      {subject.chapters}
                    </td>

                    <td className="p-4 theme-text-secondary">
                      {subject.lessons}
                    </td>

                    <td className="p-4 theme-text-secondary">
                      {subject.quizzes}
                    </td>

                    <td className="p-4 theme-text-secondary">
                      {subject.attempts}
                    </td>

                    <td className="p-4">
                      <ScoreBadge
                        score={subject.averageScore}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CLASSEMENT XP */}

      <div className="theme-surface theme-border border rounded-3xl overflow-hidden shadow-sm">
        <div className="p-5 md:p-6 border-b theme-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-soft border border-accent flex items-center justify-center">
              <Trophy
                size={19}
                className="text-accent"
              />
            </div>

            <div>
              <h2 className="text-lg font-bold theme-text">
                Classement XP
              </h2>

              <p className="text-sm theme-text-secondary mt-1">
                Les élèves ayant accumulé le plus d'XP.
              </p>
            </div>
          </div>
        </div>

        {topStudents.length === 0 ? (
          <div className="p-8 text-center theme-text-secondary">
            Aucun élève disponible.
          </div>
        ) : (
          <div className="divide-y theme-border">
            {topStudents.map(
              (student, index) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between gap-4 p-4 hover:bg-accent-soft transition"
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
                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-300"
                            : index === 1
                            ? "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                            : index === 2
                            ? "bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-300"
                            : "bg-accent-soft text-accent"
                        }
                      `}
                    >
                      {index + 1}
                    </div>

                    <div className="min-w-0">
                      <p className="font-semibold theme-text truncate">
                        {getStudentName(student)}
                      </p>

                      <p className="text-xs theme-text-secondary">
                        Niveau {Number(student.level) || 0}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Trophy
                      size={17}
                      className="text-yellow-500"
                    />

                    <span className="font-bold theme-text">
                      {(Number(student.xp) || 0).toLocaleString(
                        "fr-FR"
                      )}
                    </span>

                    <span className="text-xs theme-text-secondary">
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
// COMPOSANTS VISUELS
// ===========================================================

function StatCard({
  icon: Icon,
  label,
  value,
  description,
  iconClass,
}) {
  return (
    <div className="relative overflow-hidden theme-surface theme-border border rounded-3xl shadow-sm p-5 hover:shadow-lg hover:-translate-y-0.5 transition">
      <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-accent opacity-5" />

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm theme-text-secondary">
            {label}
          </p>

          <p className="text-3xl font-bold theme-text mt-2">
            {value}
          </p>

          {description && (
            <p className="text-xs theme-text-secondary mt-2">
              {description}
            </p>
          )}
        </div>

        <div className="w-12 h-12 rounded-2xl bg-accent-soft border border-accent flex items-center justify-center shrink-0">
          <Icon
            size={22}
            className={iconClass}
          />
        </div>
      </div>
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="theme-surface theme-border border rounded-3xl shadow-sm p-4 hover:shadow-md transition">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent-soft border border-accent flex items-center justify-center shrink-0">
          <Icon
            size={19}
            className="text-accent"
          />
        </div>

        <div>
          <p className="text-xs theme-text-secondary">
            {label}
          </p>

          <p className="text-xl font-bold theme-text">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function InsightCard({
  title,
  icon: Icon,
  iconClass,
  iconBackground,
  value,
  description,
}) {
  return (
    <div className="theme-surface theme-border border rounded-3xl shadow-sm p-5 hover:shadow-md transition">
      <h2 className="font-bold theme-text mb-4">
        {title}
      </h2>

      <div className="flex items-center gap-4">
        <div
          className={`
            w-16
            h-16
            rounded-2xl
            flex
            items-center
            justify-center
            border
            border-accent
            ${iconBackground}
          `}
        >
          <Icon
            size={28}
            className={iconClass}
          />
        </div>

        <div>
          <p className="text-3xl font-bold theme-text">
            {value}
          </p>

          <p className="text-sm theme-text-secondary">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

function ScoreBadge({ score }) {
  const className =
    score >= 70
      ? "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-300 border-green-200 dark:border-green-900/50"
      : score >= 50
      ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-900/50"
      : "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-300 border-red-200 dark:border-red-900/50";

  return (
    <span
      className={`
        inline-flex
        px-2.5
        py-1
        rounded-full
        text-xs
        font-semibold
        border
        ${className}
      `}
    >
      {score}%
    </span>
  );
}
