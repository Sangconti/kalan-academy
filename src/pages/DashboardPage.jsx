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
      // UTILISATEUR
      // =================================================

      const {
        data: {
          user
        },
        error: userError
      } =
        await supabase.auth.getUser();


      if (userError) {
        throw userError;
      }


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


      console.log(
        "DASHBOARD USER :",
        user.id
      );


      // =================================================
      // PROFILE
      // =================================================

      const {
        data: profileData,
        error: profileError
      } =
        await supabase

          .from("profiles")

          .select("*")

          .eq(
            "id",
            user.id
          )

          .single();


      if (profileError) {

        console.error(
          "Erreur profil :",
          profileError
        );

        throw profileError;
      }


      setProfile(
        profileData
      );


      // =================================================
      // PROGRESSION
      // =================================================

      const {
        data: progress,
        error: progressError
      } =
        await supabase

          .from("user_progress")

          .select(`
            id,
            completed,
            last_score,
            completion_percentage,
            lessons(
              id,
              title,
              chapter_id,
              chapters(
                id,
                subject_id,
                subjects(
                  id,
                  name
                )
              )
            )
          `)

          .eq(
            "user_id",
            user.id
          );


      if (progressError) {

        console.error(
          "Erreur progression :",
          progressError
        );

      }


      const progressData =
        progress || [];


      // =================================================
      // LEÇONS TERMINÉES
      // =================================================

      const completedLessons =
        progressData.filter(
          item =>
            item.completed === true
        ).length;


      // =================================================
      // PROGRESSION PAR MATIÈRE
      // =================================================

      const subjectsProgress = {};


      progressData.forEach(
        item => {

          const subject =
            item?.lessons
              ?.chapters
              ?.subjects;


          if (!subject?.name) {
            return;
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
      );


      // =================================================
      // CALCUL POURCENTAGE
      // =================================================

      Object.keys(
        subjectsProgress
      ).forEach(
        subjectName => {

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

          } else {

            data.percent = 0;

          }

        }
      );


      setSubjects(
        subjectsProgress
      );


      // =================================================
      // TENTATIVES QUIZ
      // =================================================

      const {
        data: attempts,
        error: attemptsError
      } =
        await supabase

          .from("quiz_attempts")

          .select(
            "id, score"
          )

          .eq(
            "user_id",
            user.id
          );


      if (attemptsError) {

        console.error(
          "Erreur quiz attempts :",
          attemptsError
        );

      }


      const attemptsData =
        attempts || [];


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
                  attempt.score || 0
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

      const {
        data: userBadges,
        error: badgeError
      } =
        await supabase

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
          );


      if (badgeError) {

        console.error(
          "Erreur badges :",
          badgeError
        );

      }


      setBadges(
        userBadges || []
      );


      // =================================================
      // STATS
      // =================================================

      setStats({

        lessons:
          completedLessons,

        score:
          averageScore,

        badges:
          userBadges?.length || 0,

        attempts:
          attemptsData.length

      });


      console.log(
        "DASHBOARD CHARGÉ",
        {
          completedLessons,
          averageScore,
          badges:
            userBadges?.length || 0,
          attempts:
            attemptsData.length
        }
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
            bg-blue-100
            flex
            items-center
            justify-center
            mb-4
          "
        >

          <TrendingUp
            size={28}
            className="
              text-blue-600
            "
          />

        </div>


        <p
          className="
            text-gray-600
            font-medium
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
            bg-white
            rounded-3xl
            border
            border-red-100
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
            "
          >
            Impossible de charger le dashboard
          </h2>


          <p
            className="
              text-sm
              text-gray-500
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
              bg-blue-600
              text-white
              px-5
              py-3
              rounded-xl
              font-semibold
              hover:bg-blue-700
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
            bg-white
            rounded-3xl
            border
            border-gray-100
            shadow-sm
            p-8
          "
        >

          <h2
            className="
              text-xl
              font-bold
              text-gray-900
            "
          >
            Profil introuvable
          </h2>


          <p
            className="
              text-gray-500
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
    Number(
      profile.xp || 0
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
    rank = "Apprenti";
  }

  if (xp >= 1500) {
    rank = "Élève confirmé";
  }

  if (xp >= 3000) {
    rank = "Expert";
  }

  if (xp >= 5000) {
    rank = "Maître Kalan";
  }


  // ===================================================
  // NOM ÉLÈVE
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
        bg-gray-50
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


        {/* ============================================
            HEADER
        ============================================ */}

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
                font-semibold
                text-blue-600
              "
            >
              Kalan Academy
            </p>


            <h1
              className="
                text-2xl
                md:text-3xl
                font-extrabold
                text-gray-900
                mt-1
              "
            >
              Bonjour {studentName} 👋
            </h1>


            <p
              className="
                text-gray-500
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
              border-gray-200
              text-gray-700
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


        {/* ============================================
            CARTE XP PRINCIPALE
        ============================================ */}

        <div
          className="
            relative
            overflow-hidden
            bg-gradient-to-br
            from-blue-600
            via-blue-700
            to-indigo-900
            rounded-3xl
            text-white
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
              bg-white/10
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
              bg-white/5
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
                mb-5
              "
            >

              <div
                className="
                  w-12
                  h-12
                  rounded-2xl
                  bg-white/15
                  flex
                  items-center
                  justify-center
                "
              >

                <Star
                  size={25}
                />

              </div>


              <div>

                <p
                  className="
                    text-blue-100
                    text-sm
                  "
                >
                  Ton niveau
                </p>


                <h2
                  className="
                    text-2xl
                    font-bold
                  "
                >
                  Niveau {level}
                </h2>

              </div>

            </div>


            <div
              className="
                flex
                flex-col
                sm:flex-row
                sm:items-end
                sm:justify-between
                gap-5
              "
            >

              <div>

                <p
                  className="
                    text-blue-100
                    text-sm
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
                  "
                >
                  {xp}
                  <span
                    className="
                      text-lg
                      font-medium
                      text-blue-200
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
                    text-blue-100
                    text-sm
                  "
                >
                  Rang
                </p>


                <p
                  className="
                    text-xl
                    font-bold
                    mt-1
                  "
                >
                  {rank}
                </p>

              </div>

            </div>


            {/* BARRE XP */}

            <div
              className="
                mt-6
              "
            >

              <div
                className="
                  flex
                  justify-between
                  text-xs
                  text-blue-100
                  mb-2
                "
              >

                <span>
                  Progression du niveau
                </span>


                <span>
                  {xpInCurrentLevel}/{XP_PER_LEVEL} XP
                </span>

              </div>


              <div
                className="
                  h-3
                  bg-white/20
                  rounded-full
                  overflow-hidden
                "
              >

                <div
                  className="
                    h-full
                    bg-white
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


              <p
                className="
                  text-xs
                  text-blue-100
                  mt-2
                "
              >
                Encore{" "}
                {Math.max(
                  nextLevelXP - xp,
                  0
                )}{" "}
                XP pour atteindre le niveau suivant.
              </p>

            </div>

          </div>

        </div>


        {/* ============================================
            STATISTIQUES
        ============================================ */}

        <div
          className="
            grid
            grid-cols-2
            lg:grid-cols-4
            gap-4
          "
        >

          {/* LEÇONS */}

          <div
            className="
              bg-white
              rounded-2xl
              border
              border-gray-100
              shadow-sm
              p-5
            "
          >

            <div
              className="
                w-10
                h-10
                rounded-xl
                bg-blue-50
                text-blue-600
                flex
                items-center
                justify-center
                mb-4
              "
            >

              <BookOpen
                size={21}
              />

            </div>


            <p
              className="
                text-sm
                text-gray-500
              "
            >
              Leçons terminées
            </p>


            <p
              className="
                text-2xl
                font-extrabold
                text-gray-900
                mt-1
              "
            >
              {stats.lessons}
            </p>

          </div>


          {/* SCORE */}

          <div
            className="
              bg-white
              rounded-2xl
              border
              border-gray-100
              shadow-sm
              p-5
            "
          >

            <div
              className="
                w-10
                h-10
                rounded-xl
                bg-yellow-50
                text-yellow-600
                flex
                items-center
                justify-center
                mb-4
              "
            >

              <Star
                size={21}
              />

            </div>


            <p
              className="
                text-sm
                text-gray-500
              "
            >
              Score moyen
            </p>


            <p
              className="
                text-2xl
                font-extrabold
                text-gray-900
                mt-1
              "
            >
              {stats.score}%
            </p>

          </div>


          {/* BADGES */}

          <div
            className="
              bg-white
              rounded-2xl
              border
              border-gray-100
              shadow-sm
              p-5
            "
          >

            <div
              className="
                w-10
                h-10
                rounded-xl
                bg-purple-50
                text-purple-600
                flex
                items-center
                justify-center
                mb-4
              "
            >

              <Award
                size={21}
              />

            </div>


            <p
              className="
                text-sm
                text-gray-500
              "
            >
              Badges
            </p>


            <p
              className="
                text-2xl
                font-extrabold
                text-gray-900
                mt-1
              "
            >
              {stats.badges}
            </p>

          </div>


          {/* QUIZ */}

          <div
            className="
              bg-white
              rounded-2xl
              border
              border-gray-100
              shadow-sm
              p-5
            "
          >

            <div
              className="
                w-10
                h-10
                rounded-xl
                bg-green-50
                text-green-600
                flex
                items-center
                justify-center
                mb-4
              "
            >

              <Target
                size={21}
              />

            </div>


            <p
              className="
                text-sm
                text-gray-500
              "
            >
              Quiz réalisés
            </p>


            <p
              className="
                text-2xl
                font-extrabold
                text-gray-900
                mt-1
              "
            >
              {stats.attempts}
            </p>

          </div>

        </div>


        {/* ============================================
            PROGRESSION PAR MATIÈRE
        ============================================ */}

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
                bg-blue-50
                text-blue-600
                flex
                items-center
                justify-center
              "
            >

              <TrendingUp
                size={20}
              />

            </div>


            <div>

              <h2
                className="
                  text-xl
                  font-bold
                  text-gray-900
                "
              >
                Progression par matière
              </h2>


              <p
                className="
                  text-sm
                  text-gray-500
                "
              >
                Suis ton avancement dans chaque matière.
              </p>

            </div>

          </div>


          {Object.keys(
            subjects
          ).length === 0 ? (

            <div
              className="
                bg-white
                rounded-2xl
                border
                border-gray-100
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
                  text-gray-500
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

              {Object.entries(
                subjects
              ).map(
                (
                  [
                    name,
                    data
                  ]
                ) => (

                  <div
                    key={name}
                    className="
                      bg-white
                      rounded-2xl
                      border
                      border-gray-100
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
                          text-gray-900
                          truncate
                        "
                      >
                        {name}
                      </h3>


                      <span
                        className="
                          text-sm
                          font-bold
                          text-blue-600
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
                          bg-blue-600
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
                        text-gray-500
                        mt-2
                      "
                    >
                      {data.completed} leçon
                      {data.completed > 1 ? "s" : ""}
                      {" "}terminée
                      {data.completed > 1 ? "s" : ""}
                      {" "}sur{" "}
                      {data.total}
                    </p>

                  </div>

                )
              )}

            </div>

          )}

        </section>


        {/* ============================================
            BADGES
        ============================================ */}

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
                bg-yellow-50
                text-yellow-600
                flex
                items-center
                justify-center
              "
            >

              <Trophy
                size={21}
              />

            </div>


            <div>

              <h2
                className="
                  text-xl
                  font-bold
                  text-gray-900
                "
              >
                Mes badges
              </h2>


              <p
                className="
                  text-sm
                  text-gray-500
                "
              >
                Les récompenses que tu as obtenues.
              </p>

            </div>

          </div>


          {badges.length === 0 ? (

            <div
              className="
                bg-white
                rounded-2xl
                border
                border-gray-100
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
                  text-gray-500
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

              {badges.map(
                item => {

                  const badge =
                    item.badges;


                  return (

                    <div
                      key={item.id}
                      className="
                        bg-white
                        rounded-2xl
                        border
                        border-gray-100
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
                            bg-yellow-50
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

                            <span
                              className="
                                text-3xl
                              "
                            >
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
                              text-gray-900
                            "
                          >
                            {badge?.name ||
                              "Badge"}
                          </h3>


                          <p
                            className="
                              text-sm
                              text-gray-500
                              mt-1
                            "
                          >
                            {badge?.description ||
                              "Badge obtenu sur Kalan Academy."}
                          </p>


                          {badge?.xp_reward ? (

                            <p
                              className="
                                text-sm
                                font-semibold
                                text-yellow-600
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

                }
              )}

            </div>

          )}

        </section>


      </div>

    </div>

  );

}