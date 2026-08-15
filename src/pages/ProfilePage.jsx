// src/pages/ProfilePage.jsx

import {
  useCallback,
  useEffect,
  useState
} from "react";

import { useNavigate } from "react-router-dom";

import { supabase } from "../lib/supabase";

import {
  User,
  Crown,
  Trophy,
  Star,
  Download,
  LogOut,
  Home,
  Award
} from "lucide-react";


// =====================================================
// CACHE LOCAL
// =====================================================

function getProfileCacheKey(userId) {
  return `kalan_profile_${userId}`;
}


function getBadgesCacheKey(userId) {
  return `kalan_badges_${userId}`;
}


function readLocalCache(key, fallback = null) {

  try {

    const value =
      localStorage.getItem(key);

    if (!value) {
      return fallback;
    }

    return JSON.parse(value);

  } catch (error) {

    console.warn(
      "⚠️ Impossible de lire le cache ProfilePage :",
      error
    );

    return fallback;
  }
}


function writeLocalCache(key, value) {

  try {

    localStorage.setItem(
      key,
      JSON.stringify(value)
    );

  } catch (error) {

    console.warn(
      "⚠️ Impossible d'enregistrer le cache ProfilePage :",
      error
    );

  }
}


// =====================================================
// COMPOSANT
// =====================================================

export default function ProfilePage() {

  const navigate =
    useNavigate();


  // ===================================================
  // ÉTAT
  // ===================================================

  const [profile, setProfile] =
    useState(null);

  const [badges, setBadges] =
    useState([]);

  /*
    Important :

    La page ne doit plus rester bloquée
    pendant les requêtes réseau.

    loading sert uniquement lorsqu'aucune
    donnée locale n'est encore disponible.
  */
  const [loading, setLoading] =
    useState(true);


  // ===================================================
  // CHARGEMENT DES DONNÉES
  // ===================================================

  const loadProfile = useCallback(
    async ({
      background = false
    } = {}) => {

      try {

        // -----------------------------------------------
        // SESSION
        // -----------------------------------------------

        const {
          data: {
            session
          }
        } = await supabase.auth.getSession();


        if (!session?.user) {

          console.log(
            "Utilisateur non connecté"
          );

          if (!background) {
            setProfile(null);
            setBadges([]);
            setLoading(false);
          }

          return;
        }


        const userId =
          session.user.id;


        // -----------------------------------------------
        // CACHE LOCAL
        // -----------------------------------------------

        const cachedProfile =
          readLocalCache(
            getProfileCacheKey(userId),
            null
          );

        const cachedBadges =
          readLocalCache(
            getBadgesCacheKey(userId),
            []
          );


        /*
          Si le cache existe, on l'affiche
          immédiatement.

          C'est le point principal de
          l'amélioration de vitesse.
        */

        if (cachedProfile) {

          setProfile(
            cachedProfile
          );

          setLoading(false);

        }

        if (
          Array.isArray(cachedBadges)
        ) {

          setBadges(
            cachedBadges
          );

        }


        // -----------------------------------------------
        // MODE PREMIER CHARGEMENT
        // -----------------------------------------------

        /*
          Si aucune donnée locale n'existe,
          on affiche le chargement.

          Si le cache existe déjà,
          on NE remet PAS loading à true.
        */

        if (
          !cachedProfile &&
          !background
        ) {

          setLoading(true);

        }


        // -----------------------------------------------
        // SUPABASE
        // -----------------------------------------------

        /*
          Profil + badges sont maintenant
          récupérés EN PARALLÈLE.

          Avant :
            profil
              ↓
            badges

          Maintenant :
            profil ─────┐
                        ├──→ Promise.all
            badges ─────┘
        */

        const [
          profileResult,
          badgesResult
        ] = await Promise.all([

          // ---------------------------------------------
          // PROFILE
          // ---------------------------------------------

          supabase
            .from("profiles")
            .select(`
              id,
              full_name,
              avatar_url,
              role,
              class_id,
              orange_money_id,
              is_premium
            `)
            .eq(
              "id",
              userId
            )
            .single(),


          // ---------------------------------------------
          // BADGES
          // ---------------------------------------------

          supabase
            .from("user_badges")
            .select(`
              id,
              badge_id,
              earned_at,
              badges(
                id,
                name,
                description,
                image_url,
                xp_reward
              )
            `)
            .eq(
              "user_id",
              userId
            )

        ]);


        // -----------------------------------------------
        // PROFILE RESULT
        // -----------------------------------------------

        const {
          data: profileData,
          error: profileError
        } = profileResult;


        if (profileError) {

          console.error(
            "❌ PROFILE ERROR :",
            profileError
          );

        }
        else if (profileData) {

          setProfile(
            profileData
          );

          writeLocalCache(
            getProfileCacheKey(userId),
            profileData
          );

        }


        // -----------------------------------------------
        // BADGES RESULT
        // -----------------------------------------------

        const {
          data: badgeData,
          error: badgeError
        } = badgesResult;


        if (badgeError) {

          console.error(
            "❌ BADGES ERROR :",
            badgeError
          );

          /*
            Si le réseau échoue mais que
            le cache existe, on conserve
            les badges locaux.
          */

          if (!cachedBadges) {

            setBadges([]);

          }

        }
        else {

          const safeBadges =
            badgeData || [];

          setBadges(
            safeBadges
          );

          writeLocalCache(
            getBadgesCacheKey(userId),
            safeBadges
          );

        }


      } catch (error) {

        console.error(
          "❌ Erreur ProfilePage :",
          error
        );

      } finally {

        /*
          Même en cas d'erreur réseau,
          la page ne doit pas rester
          bloquée indéfiniment.
        */

        setLoading(false);

      }

    },
    []
  );


  // ===================================================
  // INITIALISATION
  // ===================================================

  useEffect(() => {

    let mounted = true;


    async function initialize() {

      /*
        Première tentative.

        La fonction affiche d'abord
        le cache local si disponible,
        puis actualise depuis Supabase.
      */

      if (mounted) {

        await loadProfile();

      }

    }


    initialize();


    return () => {

      mounted = false;

    };

  }, [loadProfile]);


  // ===================================================
  // DÉCONNEXION
  // ===================================================

  async function handleLogout() {

    try {

      await supabase.auth.signOut();

      navigate("/");

    } catch (error) {

      console.error(
        "❌ Erreur déconnexion :",
        error
      );

    }

  }


  // ===================================================
  // LOADING INITIAL UNIQUEMENT
  // ===================================================

  if (
    loading &&
    !profile
  ) {

    return (

      <div
        className="
          min-h-[60vh]
          flex
          flex-col
          items-center
          justify-center
          px-6
          bg-gray-50
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

          <User
            size={28}
            className="text-blue-600"
          />

        </div>


        <p
          className="
            text-gray-600
            font-medium
          "
        >
          Chargement du profil...
        </p>

      </div>

    );

  }


  // ===================================================
  // AFFICHAGE
  // ===================================================

  return (

    <div
      className="
        min-h-screen
        bg-gray-50
        pb-8
      "
    >

      {/* =================================================
          HEADER
      ================================================= */}

      <div
        className="
          bg-white
          border-b
          border-gray-100
          px-5
          py-4
        "
      >

        <button
          onClick={() =>
            navigate("/")
          }
          className="
            flex
            items-center
            gap-2
            text-xl
            font-bold
            text-gray-900
            hover:text-blue-600
            transition
          "
        >

          <span
            className="
              w-9
              h-9
              rounded-xl
              bg-blue-600
              text-white
              flex
              items-center
              justify-center
            "
          >
            🎓
          </span>

          Kalan Academy

        </button>

      </div>


      {/* =================================================
          CONTENU
      ================================================= */}

      <div
        className="
          max-w-3xl
          mx-auto
          px-5
          py-6
        "
      >

        {/* =================================================
            TITRE
        ================================================= */}

        <div className="mb-6">

          <h1
            className="
              text-2xl
              md:text-3xl
              font-bold
              text-gray-900
            "
          >
            Mon profil
          </h1>


          <p
            className="
              text-gray-500
              mt-1
            "
          >
            Consulte ton profil et tes récompenses.
          </p>

        </div>


        {/* =================================================
            CARTE PROFIL
        ================================================= */}

        {profile && (

          <div
            className="
              bg-white
              rounded-2xl
              shadow-sm
              border
              border-gray-100
              overflow-hidden
              mb-6
            "
          >

            {/* BANDEAU */}

            <div
              className="
                h-24
                bg-blue-600
              "
            />


            <div
              className="
                px-5
                pb-6
              "
            >

              {/* AVATAR */}

              <div
                className="
                  -mt-10
                  mb-4
                "
              >

                <div
                  className="
                    w-20
                    h-20
                    rounded-2xl
                    bg-white
                    border-4
                    border-white
                    shadow-sm
                    overflow-hidden
                    flex
                    items-center
                    justify-center
                  "
                >

                  {profile.avatar_url ? (

                    <img
                      src={
                        profile.avatar_url
                      }
                      alt="Avatar"
                      className="
                        w-full
                        h-full
                        object-cover
                      "
                    />

                  ) : (

                    <User
                      size={34}
                      className="text-blue-600"
                    />

                  )}

                </div>

              </div>


              {/* NOM */}

              <h2
                className="
                  text-xl
                  font-bold
                  text-gray-900
                "
              >
                {profile.full_name ||
                  "Étudiant Kalan"}
              </h2>


              <p
                className="
                  text-sm
                  text-gray-500
                  mt-1
                "
              >
                Élève Kalan Academy
              </p>


              {/* INFORMATIONS */}

              <div
                className="
                  grid
                  grid-cols-2
                  gap-3
                  mt-5
                "
              >

                {/* STATUT */}

                <div
                  className="
                    rounded-2xl
                    bg-gray-50
                    p-4
                  "
                >

                  <div
                    className="
                      w-9
                      h-9
                      rounded-xl
                      bg-yellow-50
                      flex
                      items-center
                      justify-center
                      mb-3
                    "
                  >

                    {profile.is_premium ? (

                      <Crown
                        size={19}
                        className="text-yellow-500"
                      />

                    ) : (

                      <User
                        size={19}
                        className="text-gray-500"
                      />

                    )}

                  </div>


                  <p
                    className="
                      text-xs
                      text-gray-500
                    "
                  >
                    Statut
                  </p>


                  <p
                    className="
                      font-bold
                      text-gray-900
                      mt-1
                    "
                  >
                    {profile.is_premium
                      ? "Premium"
                      : "Gratuit"}
                  </p>

                </div>


                {/* COMPTE */}

                <div
                  className="
                    rounded-2xl
                    bg-gray-50
                    p-4
                  "
                >

                  <div
                    className="
                      w-9
                      h-9
                      rounded-xl
                      bg-blue-50
                      flex
                      items-center
                      justify-center
                      mb-3
                    "
                  >

                    <Star
                      size={19}
                      className="text-blue-600"
                    />

                  </div>


                  <p
                    className="
                      text-xs
                      text-gray-500
                    "
                  >
                    Compte
                  </p>


                  <p
                    className="
                      font-bold
                      text-gray-900
                      mt-1
                    "
                  >

                    {profile.role ===
                      "super_admin"

                      ? "Administrateur"

                      : profile.role ===
                        "admin"

                      ? "Administrateur"

                      : "Étudiant"}

                  </p>

                </div>

              </div>

            </div>

          </div>

        )}


        {/* =================================================
            TÉLÉCHARGEMENTS
        ================================================= */}

        <button
          onClick={() =>
            navigate("/downloads")
          }
          className="
            w-full
            bg-white
            rounded-2xl
            border
            border-gray-100
            shadow-sm
            p-4
            mb-6
            flex
            items-center
            gap-4
            text-left
            hover:shadow-md
            transition
          "
        >

          <div
            className="
              w-12
              h-12
              rounded-2xl
              bg-blue-100
              flex
              items-center
              justify-center
            "
          >

            <Download
              size={23}
              className="text-blue-600"
            />

          </div>


          <div
            className="
              flex-1
            "
          >

            <h2
              className="
                font-bold
                text-gray-900
              "
            >
              Mes téléchargements
            </h2>


            <p
              className="
                text-sm
                text-gray-500
                mt-1
              "
            >
              Accéder à mes vidéos hors ligne
            </p>

          </div>


          <span
            className="
              text-gray-400
              text-xl
            "
          >
            →
          </span>

        </button>


        {/* =================================================
            BADGES HEADER
        ================================================= */}

        <div
          className="
            flex
            items-center
            justify-between
            mb-4
          "
        >

          <div>

            <h2
              className="
                text-xl
                font-bold
                text-gray-900
                flex
                items-center
                gap-2
              "
            >

              <Trophy
                size={21}
                className="text-yellow-500"
              />

              Mes badges

            </h2>


            <p
              className="
                text-sm
                text-gray-500
                mt-1
              "
            >
              Tes récompenses Kalan Academy.
            </p>

          </div>


          {badges.length > 0 && (

            <div
              className="
                min-w-9
                h-9
                px-3
                rounded-full
                bg-blue-50
                text-blue-600
                flex
                items-center
                justify-center
                text-sm
                font-bold
              "
            >
              {badges.length}
            </div>

          )}

        </div>


        {/* =================================================
            AUCUN BADGE
        ================================================= */}

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
                w-16
                h-16
                mx-auto
                mb-4
                rounded-2xl
                bg-gray-50
                flex
                items-center
                justify-center
              "
            >

              <Award
                size={30}
                className="text-gray-400"
              />

            </div>


            <p
              className="
                font-bold
                text-gray-700
              "
            >
              Aucun badge obtenu
            </p>


            <p
              className="
                text-sm
                text-gray-500
                mt-1
              "
            >
              Continue tes leçons et tes quiz
              pour gagner des récompenses.
            </p>

          </div>

        ) : (

          /* =================================================
             BADGES
          ================================================= */

          <div
            className="
              space-y-3
            "
          >

            {badges.map(
              (item) => (

                <div
                  key={item.id}
                  className="
                    bg-white
                    rounded-2xl
                    border
                    border-gray-100
                    shadow-sm
                    p-4
                    flex
                    items-center
                    gap-4
                    hover:shadow-md
                    transition
                  "
                >

                  {/* ICÔNE */}

                  <div
                    className="
                      shrink-0
                      w-14
                      h-14
                      rounded-2xl
                      bg-yellow-50
                      flex
                      items-center
                      justify-center
                      overflow-hidden
                    "
                  >

                    {item.badges?.image_url ? (

                      <img
                        src={
                          item.badges.image_url
                        }
                        alt={
                          item.badges?.name ||
                          "Badge"
                        }
                        className="
                          w-10
                          h-10
                          object-contain
                        "
                      />

                    ) : (

                      <Trophy
                        size={27}
                        className="text-yellow-500"
                      />

                    )}

                  </div>


                  {/* CONTENU */}

                  <div
                    className="
                      flex-1
                      min-w-0
                    "
                  >

                    <h3
                      className="
                        font-bold
                        text-gray-900
                      "
                    >
                      {item.badges?.name ||
                        "Badge Kalan"}
                    </h3>


                    <p
                      className="
                        text-sm
                        text-gray-500
                        mt-1
                      "
                    >
                      {item.badges?.description}
                    </p>


                    <div
                      className="
                        inline-flex
                        items-center
                        gap-1
                        mt-2
                        px-2.5
                        py-1
                        rounded-full
                        bg-blue-50
                        text-blue-600
                        text-xs
                        font-bold
                      "
                    >

                      <Star
                        size={13}
                      />

                      +{item.badges?.xp_reward || 0} XP

                    </div>

                  </div>

                </div>

              )
            )}

          </div>

        )}


        {/* =================================================
            ACCUEIL
        ================================================= */}

        <button
          onClick={() =>
            navigate("/")
          }
          className="
            w-full
            mt-6
            flex
            items-center
            justify-center
            gap-2
            bg-white
            border
            border-gray-200
            text-gray-700
            px-5
            py-3
            rounded-xl
            font-semibold
            hover:bg-gray-100
            transition
          "
        >

          <Home
            size={18}
          />

          Retour à l'accueil

        </button>


        {/* =================================================
            DÉCONNEXION
        ================================================= */}

        <button
          onClick={handleLogout}
          className="
            w-full
            mt-3
            flex
            items-center
            justify-center
            gap-2
            text-red-500
            px-5
            py-3
            rounded-xl
            font-semibold
            hover:bg-red-50
            transition
          "
        >

          <LogOut
            size={18}
          />

          Se déconnecter

        </button>

      </div>

    </div>

  );

}