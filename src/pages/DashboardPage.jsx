// src/pages/DashboardPage.jsx

import {
  useEffect,
  useState
} from "react";

import {
  supabase
} from "../lib/supabase";

import {
  Award,
  BookOpen,
  Star,
  Trophy,
  Target,
  RefreshCw,
  TrendingUp
} from "lucide-react";


// =====================================================
// CONSTANTES XP
// =====================================================

const XP_PER_LEVEL = 500;


// =====================================================
// CACHE DASHBOARD
// =====================================================

const DASHBOARD_CACHE_PREFIX =
  "kalan_dashboard_";

const DASHBOARD_CACHE_DURATION =
  30 * 1000;


// =====================================================
// OUTILS CACHE
// =====================================================

function getDashboardCacheKey(userId) {

  return (
    DASHBOARD_CACHE_PREFIX +
    userId
  );

}


function getCachedDashboard(userId) {

  try {

    const key =
      getDashboardCacheKey(userId);

    const raw =
      sessionStorage.getItem(key);

    if (!raw) {
      return null;
    }


    const cached =
      JSON.parse(raw);


    if (
      !cached?.timestamp ||
      !cached?.data
    ) {

      sessionStorage.removeItem(key);

      return null;

    }


    const age =
      Date.now() -
      cached.timestamp;


    if (
      age >
      DASHBOARD_CACHE_DURATION
    ) {

      sessionStorage.removeItem(key);

      return null;

    }


    return cached.data;

  } catch (err) {

    console.warn(
      "⚠️ Cache Dashboard inaccessible :",
      err
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

        timestamp:
          Date.now(),

        data

      })
    );

  } catch (err) {

    console.warn(
      "⚠️ Impossible de sauvegarder le cache Dashboard :",
      err
    );

  }

}


// =====================================================
// PAGE DASHBOARD
// =====================================================

export default function DashboardPage() {

  // ===================================================
  // STATE
  // ===================================================

  const [profile, setProfile] =
    useState(null);

  const [subjects, setSubjects] =
    useState({});

  const [stats, setStats] =
    useState({

      lessons: 0,
      score: 0,
      badges: 0,
      attempts: 0

    });

  const [badges, setBadges] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [refreshing, setRefreshing] =
    useState(false);


  // ===================================================
  // CHARGEMENT INITIAL
  // ===================================================

  useEffect(() => {

    loadDashboard();

  }, []);


  // ===================================================
  // APPLIQUER LES DONNÉES
  // ===================================================

  function applyDashboardData(data) {

    if (!data) {
      return;
    }


    setProfile(
      data.profile || null
    );


    setSubjects(
      data.subjects || {}
    );


    setStats(
      data.stats || {

        lessons: 0,
        score: 0,
        badges: 0,
        attempts: 0

      }
    );


    setBadges(
      data.badges || []
    );

  }


  // ===================================================
  // CHARGER DASHBOARD
  // ===================================================

  async function loadDashboard(
    isRefresh = false
  ) {

    try {

      if (isRefresh) {

        setRefreshing(true);

      } else {

        setLoading(true);

      }


      setError("");


      // =================================================
      // SESSION
      // =================================================

      const {
        data: {
          session
        },
        error: sessionError
      } =
        await supabase.auth.getSession();


      if (sessionError) {

        throw sessionError;

      }


      const user =
        session?.user;


      // =================================================
      // UTILISATEUR ABSENT
      // =================================================

      if (!user) {

        setProfile(null);

        setSubjects({});

        setBadges([]);

        setStats({

          lessons: 0,
          score: 0,
          badges: 0,
          attempts: 0

        });


        setError(
          "Tu dois être connecté pour voir ton tableau de bord."
        );

        return;

      }


      // =================================================
      // CACHE
      // =================================================
      //
      // On utilise le cache uniquement lors du chargement
      // normal.
      //
      // Le bouton "Actualiser" ignore volontairement
      // le cache et recharge les données depuis Supabase.
      // =================================================

      if (!isRefresh) {

        const cached =
          getCachedDashboard(
            user.id
          );


        if (cached) {

          console.log(
            "⚡ Dashboard chargé depuis le cache"
          );


          applyDashboardData(
            cached
          );


          setLoading(false);

          return;

        }

      }


      // =================================================
      // CHARGEMENT PARALLÈLE
      // =================================================

      const [

        profileResult,

        progressResult,

        attemptsResult,

        badgesResult

      ] = await Promise.all([


        // -------------------------------------------------
        // PROFILE
        // -------------------------------------------------

        supabase
          .from("profiles")
          .select(`
            id,
            full_name,
            xp,
            level
          `)
          .eq(
            "id",
            user.id
          )
          .single(),


        // -------------------------------------------------
        // PROGRESSION
        // -------------------------------------------------
        //
        // On ne récupère que les champs réellement
        // nécessaires au Dashboard.
        // -------------------------------------------------

        supabase
          .from("user_progress")
          .select(`
            completed,
            lessons(
              chapters(
                subjects(
                  name
                )
              )
            )
          `)
          .eq(
            "user_id",
            user.id
          ),


        // -------------------------------------------------
        // TENTATIVES QUIZ
        // -------------------------------------------------
        //
        // Seul score est nécessaire.
        // -------------------------------------------------

        supabase
          .from("quiz_attempts")
          .select(`
            score
          `)
          .eq(
            "user_id",
            user.id
          ),


        // -------------------------------------------------
        // BADGES
        // -------------------------------------------------

        supabase
          .from("user_badges")
          .select(`
            id,
            badges(
              id,
              name,
              description,
              xp_reward,
              image_url
            )
          `)
          .eq(
            "user_id",
            user.id
          )

      ]);


      // =================================================
      // PROFILE
      // =================================================

      if (profileResult.error) {

        throw profileResult.error;

      }


      const profileData =
        profileResult.data;


      // =================================================
      // PROGRESSION
      // =================================================

      if (progressResult.error) {

        console.error(
          "Erreur progression :",
          progressResult.error
        );

      }


      const progressData =
        progressResult.data || [];


      // =================================================
      // LEÇONS TERMINÉES
      // =================================================

      const completedLessons =
        progressData.reduce(
          (
            total,
            item
          ) => {

            return (
              total +
              (
                item?.completed === true
                  ? 1
                  : 0
              )
            );

          },
          0
        );


      // =================================================
      // PROGRESSION PAR MATIÈRE
      // =================================================

      const subjectsProgress = {};


      for (
        const item
        of progressData
      ) {

        const subject =
          item
            ?.lessons
            ?.chapters
            ?.subjects;


        if (!subject?.name) {

          continue;

        }


        const subjectName =
          subject.name;


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

            percent: 0

          };

        }


        subjectsProgress[
          subjectName
        ].total += 1;


        if (
          item.completed === true
        ) {

          subjectsProgress[
            subjectName
          ].completed += 1;

        }

      }


      // =================================================
      // POURCENTAGES
      // =================================================

      for (
        const subjectName
        of Object.keys(
          subjectsProgress
        )
      ) {

        const data =
          subjectsProgress[
            subjectName
          ];


        if (data.total > 0) {

          data.percent =
            Math.round(
              (
                data.completed /
                data.total
              ) * 100
            );

        }

      }


      // =================================================
      // TENTATIVES QUIZ
      // =================================================

      if (attemptsResult.error) {

        console.error(
          "Erreur quiz attempts :",
          attemptsResult.error
        );

      }


      const attemptsData =
        attemptsResult.data || [];


      // =================================================
      // SCORE MOYEN
      // =================================================

      let averageScore = 0;


      if (
        attemptsData.length > 0
      ) {

        const totalScore =
          attemptsData.reduce(
            (
              total,
              attempt
            ) => {

              return (
                total +
                Number(
                  attempt?.score || 0
                )
              );

            },
            0
          );


        averageScore =
          Math.round(
            totalScore /
            attemptsData.length
          );

      }


      // =================================================
      // BADGES
      // =================================================

      if (badgesResult.error) {

        console.error(
          "Erreur badges :",
          badgesResult.error
        );

      }


      const badgeData =
        badgesResult.data || [];


      // =================================================
      // DONNÉES FINALES
      // =================================================

      const dashboardData = {

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
            attemptsData.length

        }

      };


      // =================================================
      // APPLIQUER
      // =================================================

      applyDashboardData(
        dashboardData
      );


      // =================================================
      // SAUVEGARDE CACHE
      // =================================================

      setCachedDashboard(
        user.id,
        dashboardData
      );


      console.log(
        "✅ Dashboard chargé depuis Supabase"
      );

    }

    catch (err) {

      console.error(
        "Erreur Dashboard :",
        err
      );


      setError(
        err?.message ||
        "Impossible de charger ton tableau de bord."
      );

    }

    finally {

      setLoading(false);

      setRefreshing(false);

    }

  }


  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {

    return (

      <div
        className="
          min-h-[60vh]
          flex
          flex-col
          items-center
          justify-center
          px-6
        "
      >

        <div
          className="
            w-14
            h-14
            rounded-2xl
            bg-accent-soft
            flex
            items-center
            justify-center
            mb-4
          "
        >

          <TrendingUp
            size={28}
            className="text-accent"
          />

        </div>


        <p
          className="
            text-gray-700
            dark:text-gray-300
            font-semibold
          "
        >
          Chargement de ton tableau de bord...
        </p>

      </div>

    );

  }


  // ===================================================
  // ERREUR
  // ===================================================

  if (error) {

    return (

      <div
        className="
          max-w-2xl
          mx-auto
          px-5
          py-10
        "
      >

        <div
          className="
            theme-surface
            rounded-3xl
            border
            theme-border
            shadow-sm
            p-8
            text-center
          "
        >

          <div
            className="
              w-14
              h-14
              mx-auto
              rounded-2xl
              bg-red-50
              flex
              items-center
              justify-center
              mb-4
            "
          >

            ⚠️

          </div>


          <h2
            className="
              text-xl
              font-bold
              text-gray-900
              dark:text-white
            "
          >
            Impossible de charger le dashboard
          </h2>


          <p
            className="
              text-sm
              text-gray-600
              dark:text-gray-400
              mt-2
            "
          >
            {error}
          </p>


          <button
            type="button"
            onClick={() =>
              loadDashboard(true)
            }
            className="
              mt-6
              inline-flex
              items-center
              justify-center
              gap-2
              bg-accent
              text-white
              px-5
              py-3
              rounded-xl
              font-semibold
              hover:opacity-90
              transition
            "
          >

            <RefreshCw
              size={18}
            />

            Réessayer

          </button>

        </div>

      </div>

    );

  }


  // ===================================================
  // PROFIL ABSENT
  // ===================================================

  if (!profile) {

    return (

      <div
        className="
          max-w-2xl
          mx-auto
          px-5
          py-10
          text-center
        "
      >

        <div
          className="
            theme-surface
            rounded-3xl
            border
            theme-border
            shadow-sm
            p-8
          "
        >

          <h2
            className="
              text-xl
              font-bold
              text-gray-900
              dark:text-white
            "
          >
            Profil introuvable
          </h2>


          <p
            className="
              text-gray-600
              dark:text-gray-400
              mt-2
            "
          >
            Ton profil Kalan Academy n'a pas encore été trouvé.
          </p>

        </div>

      </div>

    );

  }


  // ===================================================
  // XP / NIVEAU
  // ===================================================

  const xp =
    Math.max(
      Number(profile.xp || 0),
      0
    );


  const level =
    Math.floor(
      xp / XP_PER_LEVEL
    ) + 1;


  const currentLevelXP =
    (level - 1) *
    XP_PER_LEVEL;


  const nextLevelXP =
    level *
    XP_PER_LEVEL;


  const xpInCurrentLevel =
    xp -
    currentLevelXP;


  const xpRemaining =
    Math.max(
      nextLevelXP - xp,
      0
    );


  const progressXP =
    Math.min(
      Math.max(
        (
          xpInCurrentLevel /
          XP_PER_LEVEL
        ) * 100,
        0
      ),
      100
    );


  // ===================================================
  // RANG
  // ===================================================

  let rank =
    "Débutant";


  if (xp >= 500) {

    rank =
      "Apprenti";

  }


  if (xp >= 1500) {

    rank =
      "Élève confirmé";

  }


  if (xp >= 3000) {

    rank =
      "Expert";

  }


  if (xp >= 5000) {

    rank =
      "Maître Kalan";

  }


  // ===================================================
  // NOM
  // ===================================================

  const studentName =
    profile.full_name ||
    "Élève";


  // ===================================================
  // AFFICHAGE
  // ===================================================

  return (

    <div
      className="
        min-h-screen
        bg-white
        px-5
        py-6
        md:px-8
        md:py-8
      "
    >

      <div
        className="
          max-w-6xl
          mx-auto
          space-y-6
        "
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <div
          className="
            flex
            flex-col
            sm:flex-row
            sm:items-center
            sm:justify-between
            gap-4
          "
        >

          <div>

            <p
              className="
                text-sm
                font-bold
                text-accent
              "
            >
              Kalan Academy
            </p>


            <h1
              className="
                text-2xl
                md:text-3xl
                font-extrabold
                text-gray-950
                dark:text-gray-950
                mt-1
              "
            >
              Bonjour {studentName} 👋
            </h1>


            <p
              className="
                text-gray-600
                dark:text-gray-600
                mt-1
              "
            >
              Voici ta progression et tes résultats.
            </p>

          </div>


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
              bg-white
              border
              theme-border
              text-gray-800
              px-4
              py-2.5
              rounded-xl
              font-semibold
              shadow-sm
              hover:bg-gray-50
              transition
              disabled:opacity-50
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

            Actualiser

          </button>

        </div>


        {/* =================================================
            CARTE XP
        ================================================= */}

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
            shadow-xl
          "
        >

          <div
            className="
              absolute
              -right-16
              -top-16
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
              right-10
              -bottom-24
              w-56
              h-56
              rounded-full
              bg-accent
              opacity-10
            "
          />


          <div
            className="
              relative
              z-10
            "
          >

            <div
              className="
                flex
                items-center
                gap-3
                mb-6
              "
            >

              <div
                className="
                  w-12
                  h-12
                  rounded-2xl
                  bg-accent
                  text-white
                  flex
                  items-center
                  justify-center
                  shrink-0
                "
              >

                <Star size={25} />

              </div>


              <div>

                <p
                  className="
                    text-accent
                    text-sm
                    font-medium
                  "
                >
                  Ton niveau
                </p>


                <h2
                  className="
                    text-2xl
                    md:text-3xl
                    font-extrabold
                    text-gray-950
                  "
                >
                  Niveau {level}
                </h2>

              </div>

            </div>


            <div
              className="
                grid
                sm:grid-cols-2
                gap-6
              "
            >

              <div>

                <p
                  className="
                    text-accent
                    text-sm
                    font-medium
                  "
                >
                  XP total
                </p>


                <p
                  className="
                    text-4xl
                    md:text-5xl
                    font-extrabold
                    mt-1
                    tracking-tight
                    text-gray-950
                  "
                >

                  {xp}

                  <span
                    className="
                      text-lg
                      font-semibold
                      text-accent
                      ml-2
                    "
                  >
                    XP
                  </span>

                </p>

              </div>


              <div
                className="
                  sm:text-right
                "
              >

                <p
                  className="
                    text-accent
                    text-sm
                    font-medium
                  "
                >
                  Rang
                </p>


                <p
                  className="
                    text-xl
                    md:text-2xl
                    font-extrabold
                    mt-1
                    text-gray-950
                  "
                >
                  {rank}
                </p>

              </div>

            </div>


            <div className="mt-7">

              <div
                className="
                  flex
                  flex-col
                  sm:flex-row
                  sm:items-center
                  sm:justify-between
                  gap-1
                  text-sm
                  text-gray-700
                  mb-2
                "
              >

                <span className="font-medium">
                  Progression vers le niveau {level + 1}
                </span>


                <span className="font-bold">
                  {xpInCurrentLevel} / {XP_PER_LEVEL} XP
                </span>

              </div>


              <div
                className="
                  h-3
                  bg-white/70
                  rounded-full
                  overflow-hidden
                "
              >

                <div
                  className="
                    h-full
                    bg-accent
                    rounded-full
                    transition-all
                    duration-500
                  "
                  style={{
                    width:
                      `${progressXP}%`
                  }}
                />

              </div>


              <div
                className="
                  flex
                  flex-col
                  sm:flex-row
                  sm:items-center
                  sm:justify-between
                  gap-1
                  mt-2
                  text-xs
                  text-gray-600
                "
              >

                <span>
                  {xpInCurrentLevel} XP gagnés dans ce niveau
                </span>


                <span>
                  Encore {xpRemaining} XP
                </span>

              </div>

            </div>

          </div>

        </div>


        {/* =================================================
            STATISTIQUES
        ================================================= */}

        <div
          className="
            grid
            grid-cols-2
            lg:grid-cols-4
            gap-4
          "
        >

          <div
            className="
              theme-surface
              rounded-2xl
              border
              theme-border
              shadow-sm
              p-5
            "
          >

            <div
              className="
                w-10
                h-10
                rounded-xl
                bg-accent-soft
                text-accent
                flex
                items-center
                justify-center
                mb-4
              "
            >

              <BookOpen size={21} />

            </div>


            <p
              className="
                text-sm
                text-gray-600
                dark:text-gray-600
              "
            >
              Leçons terminées
            </p>


            <p
              className="
                text-2xl
                font-extrabold
                text-gray-950
                mt-1
              "
            >
              {stats.lessons}
            </p>

          </div>


          <div
            className="
              theme-surface
              rounded-2xl
              border
              theme-border
              shadow-sm
              p-5
            "
          >

            <div
              className="
                w-10
                h-10
                rounded-xl
                bg-accent-soft
                text-accent
                flex
                items-center
                justify-center
                mb-4
              "
            >

              <Star size={21} />

            </div>


            <p
              className="
                text-sm
                text-gray-600
                dark:text-gray-600
              "
            >
              Score moyen
            </p>


            <p
              className="
                text-2xl
                font-extrabold
                text-gray-950
                mt-1
              "
            >
              {stats.score}%
            </p>

          </div>


          <div
            className="
              theme-surface
              rounded-2xl
              border
              theme-border
              shadow-sm
              p-5
            "
          >

            <div
              className="
                w-10
                h-10
                rounded-xl
                bg-accent-soft
                text-accent
                flex
                items-center
                justify-center
                mb-4
              "
            >

              <Award size={21} />

            </div>


            <p
              className="
                text-sm
                text-gray-600
                dark:text-gray-600
              "
            >
              Badges
            </p>


            <p
              className="
                text-2xl
                font-extrabold
                text-gray-950
                mt-1
              "
            >
              {stats.badges}
            </p>

          </div>


          <div
            className="
              theme-surface
              rounded-2xl
              border
              theme-border
              shadow-sm
              p-5
            "
          >

            <div
              className="
                w-10
                h-10
                rounded-xl
                bg-accent-soft
                text-accent
                flex
                items-center
                justify-center
                mb-4
              "
            >

              <Target size={21} />

            </div>


            <p
              className="
                text-sm
                text-gray-600
                dark:text-gray-600
              "
            >
              Quiz réalisés
            </p>


            <p
              className="
                text-2xl
                font-extrabold
                text-gray-950
                mt-1
              "
            >
              {stats.attempts}
            </p>

          </div>

        </div>


        {/* =================================================
            PROGRESSION PAR MATIÈRE
        ================================================= */}

        <section>

          <div
            className="
              flex
              items-center
              gap-3
              mb-4
            "
          >

            <div
              className="
                w-10
                h-10
                rounded-xl
                bg-accent-soft
                text-accent
                flex
                items-center
                justify-center
              "
            >

              <TrendingUp size={20} />

            </div>


            <div>

              <h2
                className="
                  text-xl
                  font-bold
                  text-gray-950
                "
              >
                Progression par matière
              </h2>


              <p
                className="
                  text-sm
                  text-gray-600
                  mt-1
                "
              >
                Suis ton avancement dans chaque matière.
              </p>

            </div>

          </div>


          {Object.keys(subjects).length === 0 ? (

            <div
              className="
                theme-surface
                rounded-2xl
                border
                theme-border
                shadow-sm
                p-8
                text-center
              "
            >

              <BookOpen
                size={36}
                className="
                  mx-auto
                  text-gray-300
                  mb-3
                "
              />


              <h3
                className="
                  font-bold
                  text-gray-800
                "
              >
                Pas encore de progression
              </h3>


              <p
                className="
                  text-sm
                  text-gray-600
                  mt-1
                "
              >
                Commence une leçon pour voir ta progression ici.
              </p>

            </div>

          ) : (

            <div
              className="
                grid
                md:grid-cols-2
                lg:grid-cols-3
                gap-4
              "
            >

              {Object.entries(subjects).map(
                ([name, data]) => (

                  <div
                    key={name}
                    className="
                      theme-surface
                      rounded-2xl
                      border
                      theme-border
                      shadow-sm
                      p-5
                    "
                  >

                    <div
                      className="
                        flex
                        items-center
                        justify-between
                        gap-3
                      "
                    >

                      <h3
                        className="
                          font-bold
                          text-gray-950
                          truncate
                        "
                      >
                        {name}
                      </h3>


                      <span
                        className="
                          text-sm
                          font-bold
                          text-accent
                        "
                      >
                        {data.percent}%
                      </span>

                    </div>


                    <div
                      className="
                        h-3
                        bg-gray-100
                        rounded-full
                        overflow-hidden
                        mt-4
                      "
                    >

                      <div
                        className="
                          h-full
                          bg-accent
                          rounded-full
                          transition-all
                          duration-500
                        "
                        style={{
                          width:
                            `${data.percent}%`
                        }}
                      />

                    </div>


                    <p
                      className="
                        text-xs
                        text-gray-600
                        mt-2
                      "
                    >

                      {data.completed} leçon
                      {data.completed > 1
                        ? "s"
                        : ""}
                      {" "}terminée
                      {data.completed > 1
                        ? "s"
                        : ""}
                      {" "}sur{" "}
                      {data.total}

                    </p>

                  </div>

                )
              )}

            </div>

          )}

        </section>


        {/* =================================================
            BADGES
        ================================================= */}

        <section>

          <div
            className="
              flex
              items-center
              gap-3
              mb-4
            "
          >

            <div
              className="
                w-10
                h-10
                rounded-xl
                bg-accent-soft
                text-accent
                flex
                items-center
                justify-center
              "
            >

              <Trophy size={21} />

            </div>


            <div>

              <h2
                className="
                  text-xl
                  font-bold
                  text-gray-950
                "
              >
                Mes badges
              </h2>


              <p
                className="
                  text-sm
                  text-gray-600
                "
              >
                Les récompenses que tu as obtenues.
              </p>

            </div>

          </div>


          {badges.length === 0 ? (

            <div
              className="
                theme-surface
                rounded-2xl
                border
                theme-border
                shadow-sm
                p-8
                text-center
              "
            >

              <div
                className="
                  text-4xl
                  mb-3
                "
              >
                🏆
              </div>


              <h3
                className="
                  font-bold
                  text-gray-800
                "
              >
                Aucun badge pour le moment
              </h3>


              <p
                className="
                  text-sm
                  text-gray-600
                  mt-1
                "
              >
                Réussis tes quiz et progresse dans tes leçons pour gagner des badges.
              </p>

            </div>

          ) : (

            <div
              className="
                grid
                sm:grid-cols-2
                lg:grid-cols-3
                gap-4
              "
            >

              {badges.map(item => {

                const badge =
                  item.badges;


                return (

                  <div
                    key={item.id}
                    className="
                      theme-surface
                      rounded-2xl
                      border
                      theme-border
                      shadow-sm
                      p-5
                    "
                  >

                    <div
                      className="
                        flex
                        items-start
                        gap-4
                      "
                    >

                      <div
                        className="
                          w-14
                          h-14
                          shrink-0
                          rounded-2xl
                          bg-accent-soft
                          flex
                          items-center
                          justify-center
                          overflow-hidden
                        "
                      >

                        {badge?.image_url ? (

                          <img
                            src={
                              badge.image_url
                            }
                            alt={
                              badge.name ||
                              "Badge"
                            }
                            className="
                              w-full
                              h-full
                              object-cover
                            "
                          />

                        ) : (

                          <span className="text-3xl">
                            🏆
                          </span>

                        )}

                      </div>


                      <div
                        className="
                          min-w-0
                        "
                      >

                        <h3
                          className="
                            font-bold
                            text-gray-950
                          "
                        >
                          {
                            badge?.name ||
                            "Badge"
                          }
                        </h3>


                        <p
                          className="
                            text-sm
                            text-gray-600
                            mt-1
                          "
                        >
                          {
                            badge?.description ||
                            "Badge obtenu sur Kalan Academy."
                          }
                        </p>


                        {badge?.xp_reward ? (

                          <p
                            className="
                              text-sm
                              font-semibold
                              text-accent
                              mt-2
                            "
                          >
                            +{badge.xp_reward} XP
                          </p>

                        ) : null}

                      </div>

                    </div>

                  </div>

                );

              })}

            </div>

          )}

        </section>

      </div>

    </div>

  );

}