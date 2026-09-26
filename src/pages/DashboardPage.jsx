import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useParams,
  useLocation,
  useOutletContext,
} from "react-router-dom";

import {
  Award,
  BookOpen,
  Star,
  Trophy,
  Target,
  RefreshCw,
  TrendingUp,
} from "lucide-react";

import { supabase } from "../lib/supabase";

const XP_PER_LEVEL = 500;

const DASHBOARD_CACHE_PREFIX =
  "kalan_dashboard_";

const DASHBOARD_CACHE_DURATION =
  5 * 60 * 1000;

// =====================================================
// CACHE
// =====================================================

function getDashboardCacheKey(userId) {
  return `${DASHBOARD_CACHE_PREFIX}${userId}`;
}

function getCachedDashboard(
  userId,
  allowExpired = false
) {
  try {
    const key =
      getDashboardCacheKey(userId);

    const raw =
      sessionStorage.getItem(key);

    if (!raw) {
      return null;
    }

    const parsed =
      JSON.parse(raw);

    if (!parsed?.data) {
      return null;
    }

    const age =
      Date.now() -
      Number(parsed.timestamp || 0);

    if (
      !allowExpired &&
      age > DASHBOARD_CACHE_DURATION
    ) {
      return null;
    }

    return parsed.data;
  } catch (error) {
    console.warn(
      "⚠️ Lecture cache Dashboard impossible :",
      error
    );

    return null;
  }
}

function setCachedDashboard(
  userId,
  data
) {
  try {
    const key =
      getDashboardCacheKey(userId);

    sessionStorage.setItem(
      key,
      JSON.stringify({
        timestamp: Date.now(),
        data,
      })
    );
  } catch (error) {
    console.warn(
      "⚠️ Écriture cache Dashboard impossible :",
      error
    );
  }
}

// =====================================================
// COMPOSANT
// =====================================================

export default function DashboardPage({
  consultationMode = false,
}) {
  const { studentId } =
    useParams();

  const location =
    useLocation();

  /*
   * IMPORTANT
   *
   * En consultation, ConsultationStudentLayout
   * transmet les données déjà chargées par
   * ConsultationStudentProvider.
   *
   * En mode normal / preview, aucun contexte
   * n'est nécessaire.
   */
  const outletContext =
    useOutletContext() || {};

  const consultationStudent =
    outletContext?.consultationMode
      ? outletContext?.student
      : null;

  const isConsultation =
    consultationMode ||
    location.state?.consultationMode === true ||
    (
      Boolean(studentId) &&
      location.pathname.includes(
        "/admin/student/"
      ) &&
      location.pathname.includes(
        "/consultation"
      )
    );

  const [profile, setProfile] =
    useState(null);

  const [subjects, setSubjects] =
    useState({});

  const [stats, setStats] =
    useState({
      lessons: 0,
      score: 0,
      badges: 0,
      attempts: 0,
    });

  const [badges, setBadges] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(null);

  const [refreshing, setRefreshing] =
    useState(false);

  const mountedRef =
    useRef(true);

  const loadingRequestRef =
    useRef(false);

  // =====================================================
  // NETTOYAGE
  // =====================================================

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  // =====================================================
  // APPLICATION DES DONNÉES
  // =====================================================

  const applyDashboardData =
    useCallback((data) => {
      if (!data) {
        return;
      }

      setProfile(
        data.profile || null
      );

      setSubjects(
        data.subjects || {}
      );

      setBadges(
        Array.isArray(data.badges)
          ? data.badges
          : []
      );

      setStats({
        lessons:
          Number(
            data.stats?.lessons
          ) || 0,

        score:
          Number(
            data.stats?.score
          ) || 0,

        badges:
          Number(
            data.stats?.badges
          ) || 0,

        attempts:
          Number(
            data.stats?.attempts
          ) || 0,
      });
    }, []);

  // =====================================================
  // UTILISATEUR CIBLE
  // =====================================================

  const getTargetUserId =
    useCallback(async () => {
      if (isConsultation) {
        return studentId;
      }

      const {
        data,
        error: sessionError,
      } =
        await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      return (
        data?.session?.user?.id ||
        null
      );
    }, [
      isConsultation,
      studentId,
    ]);

  // =====================================================
  // CHARGEMENT SUPABASE
  // =====================================================

  const fetchDashboardFromSupabase =
    useCallback(
      async (userId) => {
        if (!userId) {
          throw new Error(
            "Utilisateur introuvable."
          );
        }

        const [
          profileResult,
          progressResult,
          attemptsResult,
          badgesResult,
        ] =
          await Promise.all([
            // -------------------------------------------------
            // PROFILE
            // -------------------------------------------------

            supabase
              .from("profiles")
              .select(
                `
                  id,
                  full_name,
                  xp,
                  level
                `
              )
              .eq("id", userId)
              .maybeSingle(),

            // -------------------------------------------------
            // PROGRESSION
            // -------------------------------------------------

            supabase
              .from("user_progress")
              .select(
                `
                  completed,
                  lessons(
                    id,
                    title,
                    chapters(
                      id,
                      title,
                      subjects(
                        id,
                        name
                      )
                    )
                  )
                `
              )
              .eq(
                "user_id",
                userId
              ),

            // -------------------------------------------------
            // QUIZ
            // -------------------------------------------------

            supabase
              .from("quiz_attempts")
              .select(
                "score"
              )
              .eq(
                "user_id",
                userId
              ),

            // -------------------------------------------------
            // BADGES
            // -------------------------------------------------

            supabase
              .from("user_badges")
              .select(
                `
                  id,
                  badges(
                    id,
                    name,
                    description,
                    image_url
                  )
                `
              )
              .eq(
                "user_id",
                userId
              ),
          ]);

        // =====================================================
        // ERREURS
        // =====================================================

        if (profileResult.error) {
          throw profileResult.error;
        }

        if (progressResult.error) {
          console.warn(
            "⚠️ Erreur progression Dashboard :",
            progressResult.error
          );
        }

        if (attemptsResult.error) {
          console.warn(
            "⚠️ Erreur quiz Dashboard :",
            attemptsResult.error
          );
        }

        if (badgesResult.error) {
          console.warn(
            "⚠️ Erreur badges Dashboard :",
            badgesResult.error
          );
        }

        const profileData =
          profileResult.data || null;

        const progressData =
          progressResult.error
            ? []
            : (
                progressResult.data || []
              );

        const attemptsData =
          attemptsResult.error
            ? []
            : (
                attemptsResult.data || []
              );

        const badgesRaw =
          badgesResult.error
            ? []
            : (
                badgesResult.data || []
              );

        // =====================================================
        // LEÇONS TERMINÉES
        // =====================================================

        const completedLessons =
          progressData.reduce(
            (total, item) =>
              total +
              (
                item?.completed === true
                  ? 1
                  : 0
              ),
            0
          );

        // =====================================================
        // PROGRESSION PAR MATIÈRE
        // =====================================================

        const subjectsProgress =
          {};

        progressData.forEach(
          (item) => {
            const subjectName =
              item?.lessons?.chapters
                ?.subjects?.name;

            if (!subjectName) {
              return;
            }

            if (
              !subjectsProgress[
                subjectName
              ]
            ) {
              subjectsProgress[
                subjectName
              ] = {
                total: 0,
                completed: 0,
                percentage: 0,
              };
            }

            subjectsProgress[
              subjectName
            ].total += 1;

            if (
              item?.completed === true
            ) {
              subjectsProgress[
                subjectName
              ].completed += 1;
            }
          }
        );

        Object.keys(
          subjectsProgress
        ).forEach(
          (subjectName) => {
            const item =
              subjectsProgress[
                subjectName
              ];

            item.percentage =
              item.total > 0
                ? Math.round(
                    (
                      item.completed /
                      item.total
                    ) *
                    100
                  )
                : 0;
          }
        );

        // =====================================================
        // SCORE MOYEN
        // =====================================================

        const totalScore =
          attemptsData.reduce(
            (total, attempt) =>
              total +
              (
                Number(
                  attempt?.score
                ) || 0
              ),
            0
          );

        const averageScore =
          attemptsData.length > 0
            ? Math.round(
                totalScore /
                attemptsData.length
              )
            : 0;

        // =====================================================
        // BADGES
        // =====================================================

        const badgeData =
          badgesRaw
            .map(
              (item) =>
                item?.badges
            )
            .filter(Boolean);

        // =====================================================
        // RÉSULTAT FINAL
        // =====================================================

        return {
          profile:
            profileData,

          subjects:
            subjectsProgress,

          badges:
            badgeData,

          stats: {
            lessons:
              completedLessons,

            score:
              averageScore,

            badges:
              badgeData.length,

            attempts:
              attemptsData.length,
          },
        };
      },
      []
    );

  // =====================================================
  // CHARGEMENT DASHBOARD
  // =====================================================

  const loadDashboard =
    useCallback(
      async (isRefresh = false) => {
        if (
          loadingRequestRef.current &&
          !isRefresh
        ) {
          return;
        }

        loadingRequestRef.current =
          true;

        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError(null);

        try {
          /*
           * =================================================
           * CONSULTATION
           * =================================================
           */

          if (
            isConsultation &&
            !isRefresh
          ) {
            if (
              !consultationStudent
            ) {
              throw new Error(
                "Informations de l'élève introuvables."
              );
            }

            const consultationData = {
              profile:
                consultationStudent
                  .profile || null,

              subjects:
                consultationStudent
                  .subjects || {},

              badges:
                Array.isArray(
                  consultationStudent
                    .badges
                )
                  ? consultationStudent
                      .badges
                  : [],

              stats:
                consultationStudent
                  .stats || {
                    lessons: 0,
                    score: 0,
                    badges: 0,
                    attempts: 0,
                  },
            };

            applyDashboardData(
              consultationData
            );

            console.log(
              "👁️⚡ Dashboard élève chargé depuis le contexte de consultation"
            );

            return;
          }

          // =====================================================
          // UTILISATEUR CIBLE
          // =====================================================

          const userId =
            await getTargetUserId();

          if (!userId) {
            throw new Error(
              "Impossible d'identifier l'utilisateur."
            );
          }

          // =====================================================
          // CACHE
          // =====================================================

          const cachedData =
            getCachedDashboard(
              userId,
              true
            );

          if (
            cachedData &&
            !isRefresh
          ) {
            applyDashboardData(
              cachedData
            );

            if (
              mountedRef.current
            ) {
              setLoading(false);
            }

            const raw =
              sessionStorage.getItem(
                getDashboardCacheKey(
                  userId
                )
              );

            let cacheIsFresh =
              false;

            if (raw) {
              try {
                const parsed =
                  JSON.parse(raw);

                const age =
                  Date.now() -
                  Number(
                    parsed.timestamp || 0
                  );

                cacheIsFresh =
                  age <=
                  DASHBOARD_CACHE_DURATION;
              } catch {
                cacheIsFresh =
                  false;
              }
            }

            if (cacheIsFresh) {
              console.log(
                "⚡ Dashboard chargé depuis le cache"
              );

              return;
            }
          }

          // =====================================================
          // HORS LIGNE
          // =====================================================

          if (
            typeof navigator !==
              "undefined" &&
            navigator.onLine === false
          ) {
            if (cachedData) {
              applyDashboardData(
                cachedData
              );

              console.log(
                "📴 Dashboard chargé depuis le cache hors ligne"
              );

              return;
            }

            throw new Error(
              "Connexion Internet indisponible et aucune donnée en cache."
            );
          }

          // =====================================================
          // SUPABASE
          // =====================================================

          const freshData =
            await fetchDashboardFromSupabase(
              userId
            );

          if (
            !mountedRef.current
          ) {
            return;
          }

          applyDashboardData(
            freshData
          );

          setCachedDashboard(
            userId,
            freshData
          );

          console.log(
            "🌐 Dashboard élève actualisé depuis Supabase"
          );
        } catch (loadError) {
          console.error(
            "❌ Erreur chargement Dashboard :",
            loadError
          );

          /*
           * Fallback cache
           */
          try {
            const fallbackUserId =
              isConsultation
                ? studentId
                : await getTargetUserId();

            if (fallbackUserId) {
              const fallback =
                getCachedDashboard(
                  fallbackUserId,
                  true
                );

              if (fallback) {
                applyDashboardData(
                  fallback
                );

                console.log(
                  "⚠️ Dashboard récupéré depuis le cache"
                );

                return;
              }
            }
          } catch (fallbackError) {
            console.warn(
              "⚠️ Fallback Dashboard impossible :",
              fallbackError
            );
          }

          if (
            mountedRef.current
          ) {
            setError(
              loadError?.message ||
                "Impossible de charger le tableau de bord."
            );
          }
        } finally {
          loadingRequestRef.current =
            false;

          if (
            mountedRef.current
          ) {
            setLoading(false);
            setRefreshing(false);
          }
        }
      },
      [
        isConsultation,
        consultationStudent,
        studentId,
        applyDashboardData,
        getTargetUserId,
        fetchDashboardFromSupabase,
      ]
    );

  // =====================================================
  // CHARGEMENT INITIAL
  // =====================================================

  useEffect(() => {
    loadDashboard(false);
  }, [loadDashboard]);

  // =====================================================
  // XP / NIVEAU
  // =====================================================

  const xp =
    Math.max(
      Number(
        profile?.xp || 0
      ),
      0
    );

  const level =
    Math.floor(
      xp / XP_PER_LEVEL
    ) + 1;

  const xpInCurrentLevel =
    xp % XP_PER_LEVEL;

  const xpRemaining =
    XP_PER_LEVEL -
    xpInCurrentLevel;

  const levelProgress =
    Math.min(
      (
        xpInCurrentLevel /
        XP_PER_LEVEL
      ) *
        100,
      100
    );

  // =====================================================
  // RANG
  // =====================================================

  let rank =
    "Débutant";

  if (xp >= 5000) {
    rank =
      "Maître Kalan";
  } else if (xp >= 3000) {
    rank =
      "Expert";
  } else if (xp >= 1500) {
    rank =
      "Élève confirmé";
  } else if (xp >= 500) {
    rank =
      "Apprenti";
  }

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div
        className="
          min-h-[60vh]
          flex
          items-center
          justify-center
          theme-text
        "
      >
        <div className="text-center">
          <div
            className="
              animate-spin
              rounded-full
              h-10
              w-10
              border-b-2
              border-accent
              mx-auto
              mb-4
            "
          />

          <p
            className="
              theme-text-secondary
              text-sm
            "
          >
            Chargement de la progression...
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // ERREUR
  // =====================================================

  if (error) {
    return (
      <div
        className="
          min-h-[60vh]
          flex
          items-center
          justify-center
          px-4
        "
      >
        <div
          className="
            w-full
            max-w-md
            theme-surface
            border
            theme-border
            rounded-3xl
            p-6
            text-center
            shadow-lg
          "
        >
          <div
            className="
              w-14
              h-14
              rounded-2xl
              bg-accent-soft
              border
              border-accent
              mx-auto
              mb-4
              flex
              items-center
              justify-center
            "
          >
            <Target
              size={28}
              className="text-accent"
            />
          </div>

          <h2
            className="
              text-lg
              font-bold
              theme-text
              mb-2
            "
          >
            Impossible de charger la progression
          </h2>

          <p
            className="
              text-sm
              theme-text-secondary
              mb-5
            "
          >
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              loadDashboard(true)
            }
            disabled={refreshing}
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-accent
              text-white
              px-5
              py-3
              font-semibold
              shadow-md
              hover:opacity-90
              hover:-translate-y-0.5
              transition
              disabled:opacity-50
              disabled:hover:translate-y-0
            "
          >
            <RefreshCw
              size={17}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />

            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // =====================================================
  // PROFIL ABSENT
  // =====================================================

  if (!profile) {
    return (
      <div
        className="
          min-h-[60vh]
          flex
          items-center
          justify-center
          px-4
        "
      >
        <div
          className="
            w-full
            max-w-md
            theme-surface
            border
            theme-border
            rounded-3xl
            p-6
            text-center
            shadow-lg
          "
        >
          <div
            className="
              w-14
              h-14
              rounded-2xl
              bg-accent-soft
              border
              border-accent
              mx-auto
              mb-4
              flex
              items-center
              justify-center
            "
          >
            <BookOpen
              size={26}
              className="text-accent"
            />
          </div>

          <h2
            className="
              text-lg
              font-bold
              theme-text
              mb-2
            "
          >
            Profil introuvable
          </h2>

          <p
            className="
              text-sm
              theme-text-secondary
            "
          >
            Les informations de cet élève ne sont pas
            disponibles.
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // AFFICHAGE
  // =====================================================

  return (
    <div
      className="
        w-full
        space-y-6
        pb-6
      "
    >
      {/* =====================================================
          EN-TÊTE HERO
      ===================================================== */}

      <section
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
        {/* DÉCORATIONS */}

        <div
          className="
            absolute
            -right-10
            -top-10
            w-40
            h-40
            rounded-full
            bg-accent
            opacity-10
          "
        />

        <div
          className="
            absolute
            -left-16
            -bottom-20
            w-48
            h-48
            rounded-full
            bg-accent
            opacity-10
          "
        />

        <div
          className="
            absolute
            right-16
            -bottom-24
            w-56
            h-56
            rounded-full
            bg-accent
            opacity-5
          "
        />

        <div
          className="
            relative
            z-10
          "
        >
          {/* BADGE */}

          <div
            className="
              inline-flex
              items-center
              gap-2
              px-3
              py-1.5
              rounded-full
              bg-accent
              text-white
              text-xs
              font-semibold
              mb-4
            "
          >
            <TrendingUp size={14} />

            Tableau de bord
          </div>

          {/* BIENVENUE */}

          <p
            className="
              text-sm
              md:text-base
              font-semibold
              text-accent
              mb-1
            "
          >
            Bienvenue sur ton espace d'apprentissage
          </p>

          {/* NOM */}

          <h1
            className="
              text-2xl
              md:text-3xl
              font-bold
              leading-tight
              theme-text
            "
          >
            {profile.full_name || "Élève"}
          </h1>

          {/* SLOGAN */}

          <p
            className="
              text-lg
              md:text-xl
              font-bold
              theme-text
              mt-2
            "
          >
            Continue ton apprentissage et progresse chaque jour.
          </p>

          {/* DESCRIPTION + ACTUALISATION */}

          <div
            className="
              mt-4
              flex
              items-start
              justify-between
              gap-4
            "
          >
            <p
              className="
                theme-text-secondary
                max-w-2xl
                leading-relaxed
              "
            >
              Consulte ta progression, ton niveau, tes
              statistiques et les badges que tu as obtenus.
            </p>

            <button
              type="button"
              onClick={() =>
                loadDashboard(true)
              }
              disabled={refreshing}
              title="Actualiser"
              className="
                shrink-0
                w-11
                h-11
                rounded-xl
                bg-white/70
                dark:bg-gray-950/30
                border
                border-accent
                flex
                items-center
                justify-center
                text-accent
                hover:opacity-80
                transition
                disabled:opacity-50
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
            </button>
          </div>
        </div>
      </section>

      {/* =====================================================
          XP / NIVEAU
      ===================================================== */}

      <section
        className="
          relative
          overflow-hidden
          theme-surface
          border
          theme-border
          rounded-3xl
          p-5
          md:p-6
          shadow-sm
        "
      >
        <div
          className="
            absolute
            -right-10
            -top-10
            w-28
            h-28
            rounded-full
            bg-accent
            opacity-5
          "
        />

        <div className="relative z-10">
          <div
            className="
              flex
              items-center
              justify-between
              gap-4
              mb-4
            "
          >
            <div
              className="
                flex
                items-center
                gap-3
              "
            >
              <div
                className="
                  w-11
                  h-11
                  rounded-2xl
                  bg-accent-soft
                  border
                  border-accent
                  flex
                  items-center
                  justify-center
                "
              >
                <Star
                  size={22}
                  className="text-accent"
                />
              </div>

              <div>
                <p
                  className="
                    text-xs
                    theme-text-secondary
                  "
                >
                  Niveau
                </p>

                <p
                  className="
                    text-xl
                    font-bold
                    theme-text
                  "
                >
                  {level}
                </p>
              </div>
            </div>

            <div className="text-right">
              <p
                className="
                  text-xs
                  theme-text-secondary
                "
              >
                XP total
              </p>

              <p
                className="
                  text-xl
                  font-bold
                  text-accent
                "
              >
                {xp} XP
              </p>
            </div>
          </div>

          <div
            className="
              flex
              items-center
              justify-between
              gap-3
              mb-2
            "
          >
            <span
              className="
                text-sm
                font-semibold
                theme-text
              "
            >
              Progression vers le niveau {level + 1}
            </span>

            <span
              className="
                text-sm
                theme-text-secondary
              "
            >
              {xpInCurrentLevel} / {XP_PER_LEVEL} XP
            </span>
          </div>

          <div
            className="
              w-full
              h-3
              rounded-full
              theme-bg
              overflow-hidden
            "
          >
            <div
              className="
                h-full
                rounded-full
                bg-accent
                transition-all
              "
              style={{
                width: `${levelProgress}%`,
              }}
            />
          </div>

          <div
            className="
              flex
              items-center
              justify-between
              gap-3
              mt-3
            "
          >
            <span
              className="
                text-xs
                theme-text-secondary
              "
            >
              {xpInCurrentLevel} XP dans ce niveau
            </span>

            <span
              className="
                text-xs
                theme-text-secondary
              "
            >
              Encore {xpRemaining} XP
            </span>
          </div>
        </div>
      </section>

      {/* =====================================================
          RANG
      ===================================================== */}

      <section
        className="
          relative
          overflow-hidden
          theme-surface
          border
          theme-border
          rounded-3xl
          p-5
          md:p-6
          shadow-sm
        "
      >
        <div
          className="
            absolute
            -right-10
            -top-10
            w-28
            h-28
            rounded-full
            bg-accent
            opacity-5
          "
        />

        <div
          className="
            relative
            z-10
            flex
            items-center
            justify-between
            gap-4
          "
        >
          <div
            className="
              flex
              items-center
              gap-3
            "
          >
            <div
              className="
                w-11
                h-11
                rounded-2xl
                bg-accent-soft
                border
                border-accent
                flex
                items-center
                justify-center
              "
            >
              <Trophy
                size={22}
                className="text-accent"
              />
            </div>

            <div>
              <p
                className="
                  text-xs
                  theme-text-secondary
                "
              >
                Rang
              </p>

              <p
                className="
                  text-lg
                  font-bold
                  theme-text
                "
              >
                {rank}
              </p>
            </div>
          </div>

          <div
            className="
              hidden
              sm:flex
              items-center
              gap-2
              px-3
              py-2
              rounded-xl
              bg-accent-soft
              text-accent
              text-sm
              font-semibold
            "
          >
            <Star size={15} />
            XP
          </div>
        </div>
      </section>

      {/* =====================================================
          STATISTIQUES
      ===================================================== */}

      <section>
        <div
          className="
            flex
            items-center
            gap-2
            mb-3
          "
        >
          <TrendingUp
            size={20}
            className="text-accent"
          />

          <h2
            className="
              text-lg
              font-bold
              theme-text
            "
          >
            Statistiques
          </h2>
        </div>

        <div
          className="
            grid
            grid-cols-2
            gap-3
          "
        >
          {/* LEÇONS */}

          <div
            className="
              theme-surface
              border
              theme-border
              rounded-2xl
              p-4
              shadow-sm
            "
          >
            <div
              className="
                flex
                items-center
                gap-3
              "
            >
              <div
                className="
                  w-10
                  h-10
                  rounded-xl
                  bg-accent-soft
                  flex
                  items-center
                  justify-center
                "
              >
                <BookOpen
                  size={19}
                  className="text-accent"
                />
              </div>

              <div>
                <p
                  className="
                    text-2xl
                    font-bold
                    theme-text
                  "
                >
                  {stats.lessons}
                </p>

                <p
                  className="
                    text-xs
                    theme-text-secondary
                  "
                >
                  Leçons terminées
                </p>
              </div>
            </div>
          </div>

          {/* SCORE */}

          <div
            className="
              theme-surface
              border
              theme-border
              rounded-2xl
              p-4
              shadow-sm
            "
          >
            <div
              className="
                flex
                items-center
                gap-3
              "
            >
              <div
                className="
                  w-10
                  h-10
                  rounded-xl
                  bg-accent-soft
                  flex
                  items-center
                  justify-center
                "
              >
                <Target
                  size={19}
                  className="text-accent"
                />
              </div>

              <div>
                <p
                  className="
                    text-2xl
                    font-bold
                    theme-text
                  "
                >
                  {stats.score}%
                </p>

                <p
                  className="
                    text-xs
                    theme-text-secondary
                  "
                >
                  Score moyen
                </p>
              </div>
            </div>
          </div>

          {/* BADGES */}

          <div
            className="
              theme-surface
              border
              theme-border
              rounded-2xl
              p-4
              shadow-sm
            "
          >
            <div
              className="
                flex
                items-center
                gap-3
              "
            >
              <div
                className="
                  w-10
                  h-10
                  rounded-xl
                  bg-accent-soft
                  flex
                  items-center
                  justify-center
                "
              >
                <Award
                  size={19}
                  className="text-accent"
                />
              </div>

              <div>
                <p
                  className="
                    text-2xl
                    font-bold
                    theme-text
                  "
                >
                  {stats.badges}
                </p>

                <p
                  className="
                    text-xs
                    theme-text-secondary
                  "
                >
                  Badges obtenus
                </p>
              </div>
            </div>
          </div>

          {/* QUIZ */}

          <div
            className="
              theme-surface
              border
              theme-border
              rounded-2xl
              p-4
              shadow-sm
            "
          >
            <div
              className="
                flex
                items-center
                gap-3
              "
            >
              <div
                className="
                  w-10
                  h-10
                  rounded-xl
                  bg-accent-soft
                  flex
                  items-center
                  justify-center
                "
              >
                <Trophy
                  size={19}
                  className="text-accent"
                />
              </div>

              <div>
                <p
                  className="
                    text-2xl
                    font-bold
                    theme-text
                  "
                >
                  {stats.attempts}
                </p>

                <p
                  className="
                    text-xs
                    theme-text-secondary
                  "
                >
                  Quiz réalisés
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          PROGRESSION PAR MATIÈRE
      ===================================================== */}

      <section>
        <div
          className="
            flex
            items-center
            gap-2
            mb-3
          "
        >
          <BookOpen
            size={20}
            className="text-accent"
          />

          <h2
            className="
              text-lg
              font-bold
              theme-text
            "
          >
            Progression par matière
          </h2>
        </div>

        {Object.keys(subjects).length ===
        0 ? (
          <div
            className="
              theme-surface
              border
              theme-border
              rounded-2xl
              p-5
              text-center
            "
          >
            <div
              className="
                w-11
                h-11
                rounded-2xl
                bg-accent-soft
                mx-auto
                mb-3
                flex
                items-center
                justify-center
              "
            >
              <BookOpen
                size={21}
                className="text-accent"
              />
            </div>

            <p
              className="
                text-sm
                theme-text-secondary
              "
            >
              Aucune progression enregistrée.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(
              subjects
            ).map(
              ([
                subjectName,
                subject,
              ]) => (
                <div
                  key={subjectName}
                  className="
                    relative
                    overflow-hidden
                    theme-surface
                    border
                    theme-border
                    rounded-2xl
                    p-4
                    shadow-sm
                  "
                >
                  <div
                    className="
                      absolute
                      -right-8
                      -top-8
                      w-20
                      h-20
                      rounded-full
                      bg-accent
                      opacity-5
                    "
                  />

                  <div className="relative z-10">
                    <div
                      className="
                        flex
                        items-center
                        justify-between
                        gap-3
                        mb-2
                      "
                    >
                      <p
                        className="
                          font-semibold
                          theme-text
                          truncate
                        "
                      >
                        {subjectName}
                      </p>

                      <span
                        className="
                          text-sm
                          font-semibold
                          text-accent
                          shrink-0
                        "
                      >
                        {subject.percentage}%
                      </span>
                    </div>

                    <div
                      className="
                        w-full
                        h-2.5
                        rounded-full
                        theme-bg
                        overflow-hidden
                      "
                    >
                      <div
                        className="
                          h-full
                          rounded-full
                          bg-accent
                          transition-all
                        "
                        style={{
                          width: `${subject.percentage}%`,
                        }}
                      />
                    </div>

                    <p
                      className="
                        text-xs
                        theme-text-secondary
                        mt-2
                      "
                    >
                      {subject.completed} leçon
                      {subject.completed !== 1
                        ? "s"
                        : ""}{" "}
                      terminée
                      {subject.completed !== 1
                        ? "s"
                        : ""}{" "}
                      sur{" "}
                      {subject.total}
                    </p>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </section>

      {/* =====================================================
          BADGES
      ===================================================== */}

      <section>
        <div
          className="
            flex
            items-center
            gap-2
            mb-3
          "
        >
          <Award
            size={20}
            className="text-accent"
          />

          <h2
            className="
              text-lg
              font-bold
              theme-text
            "
          >
            Badges obtenus
          </h2>
        </div>

        {badges.length === 0 ? (
          <div
            className="
              theme-surface
              border
              theme-border
              rounded-2xl
              p-5
              text-center
            "
          >
            <div
              className="
                w-12
                h-12
                rounded-2xl
                bg-accent-soft
                border
                border-accent
                mx-auto
                mb-3
                flex
                items-center
                justify-center
              "
            >
              <Award
                size={24}
                className="text-accent"
              />
            </div>

            <p
              className="
                text-sm
                theme-text-secondary
              "
            >
              Aucun badge obtenu pour le moment.
            </p>
          </div>
        ) : (
          <div
            className="
              grid
              grid-cols-2
              gap-3
            "
          >
            {badges.map(
              (badge, index) => (
                <div
                  key={
                    badge?.id ||
                    `badge-${index}`
                  }
                  className="
                    relative
                    overflow-hidden
                    theme-surface
                    border
                    theme-border
                    rounded-2xl
                    p-4
                    shadow-sm
                  "
                >
                  <div
                    className="
                      absolute
                      -right-8
                      -top-8
                      w-20
                      h-20
                      rounded-full
                      bg-accent
                      opacity-5
                    "
                  />

                  <div className="relative z-10">
                    <div
                      className="
                        w-12
                        h-12
                        rounded-2xl
                        bg-accent-soft
                        border
                        border-accent
                        flex
                        items-center
                        justify-center
                        mb-3
                      "
                    >
                      {badge?.image_url ? (
                        <img
                          src={badge.image_url}
                          alt={badge.name || "Badge"}
                          className="w-10 h-10 object-contain"
                        />
                      ) : (
                        <Award
                          size={24}
                          className="text-accent"
                        />
                      )}
                    </div>

                    <p
                      className="
                        font-semibold
                        theme-text
                        text-sm
                      "
                    >
                      {badge?.name ||
                        "Badge"}
                    </p>

                    {badge?.description && (
                      <p
                        className="
                          text-xs
                          theme-text-secondary
                          mt-1
                          line-clamp-3
                        "
                      >
                        {badge.description}
                      </p>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </section>
    </div>
  );
}