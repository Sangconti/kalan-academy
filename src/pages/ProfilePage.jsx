// src/pages/ProfilePage.jsx

import {
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";

import {
  useNavigate,
  useLocation,
  useParams
} from "react-router-dom";

import { supabase } from "../lib/supabase";

import {
  generateDeviceRecoveryCode
} from "../services/deviceService";

import {
  User,
  Crown,
  Trophy,
  Star,
  Download,
  LogOut,
  Home,
  Award,
  KeyRound,
  Copy,
  Check
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
    const value = localStorage.getItem(key);

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

export default function ProfilePage({
  consultationMode = false
}) {

  const navigate =
    useNavigate();

  const location =
    useLocation();

  const {
    studentId
  } = useParams();


  // ===================================================
  // MODE CONSULTATION
  // ===================================================

  const isConsultation =
    consultationMode ||
    location.state?.consultationMode === true ||
    (
      Boolean(studentId) &&
      location.pathname.includes("/admin/student/") &&
      location.pathname.includes("/consultation")
    );


  // ===================================================
  // ÉTAT
  // ===================================================

  const [profile, setProfile] =
    useState(null);

  const [badges, setBadges] =
    useState([]);

  /*
    loading sert uniquement lorsqu'aucune
    donnée locale n'est encore disponible.
  */
  const [loading, setLoading] =
    useState(true);


  // ===================================================
  // PROTECTION DES REQUÊTES
  // ===================================================

  /*
    Évite les doubles chargements.

    C'est particulièrement utile avec React
    Strict Mode en développement, qui peut
    exécuter deux fois certains effets.
  */
  const loadingRequestRef =
    useRef(false);

  /*
    Empêche les setState après démontage
    de la page.
  */
  const mountedRef =
    useRef(false);


  // ===================================================
  // CODE DE RÉCUPÉRATION
  // ===================================================

  /*
    Le code reste uniquement en mémoire.

    Il n'est jamais enregistré dans :
    - localStorage
    - Dexie
    - cache ProfilePage
  */

  const [recoveryCode, setRecoveryCode] =
    useState("");

  const [recoveryLoading, setRecoveryLoading] =
    useState(false);

  const [recoveryMessage, setRecoveryMessage] =
    useState("");

  const [recoveryMessageType, setRecoveryMessageType] =
    useState("");

  const [recoveryCopied, setRecoveryCopied] =
    useState(false);


  // ===================================================
  // CHARGEMENT DES DONNÉES
  // ===================================================

  const loadProfile = useCallback(
    async ({
      background = false
    } = {}) => {

      /*
        Protection contre les doubles chargements.
      */
      if (loadingRequestRef.current) {
        return;
      }

      loadingRequestRef.current = true;


      try {

        // =================================================
        // 👁️ MODE CONSULTATION
        // =================================================

        if (
          isConsultation &&
          studentId
        ) {

          console.log(
            "👁️ [ADMIN] Chargement profil élève en consultation :",
            studentId
          );


          // -----------------------------------------------
          // CACHE ÉLÈVE CIBLÉ
          // -----------------------------------------------

          const cachedProfile =
            readLocalCache(
              getProfileCacheKey(studentId),
              null
            );

          const cachedBadges =
            readLocalCache(
              getBadgesCacheKey(studentId),
              []
            );


          /*
            Affichage immédiat du cache.
          */

          if (
            mountedRef.current &&
            cachedProfile
          ) {

            setProfile(
              cachedProfile
            );

            setLoading(false);

          }

          if (
            mountedRef.current &&
            Array.isArray(cachedBadges)
          ) {

            setBadges(
              cachedBadges
            );

          }


          if (
            !cachedProfile &&
            !background &&
            mountedRef.current
          ) {

            setLoading(true);

          }


          // -----------------------------------------------
          // HORS LIGNE
          // -----------------------------------------------

          /*
            Si l'appareil est clairement hors ligne,
            le cache est la seule source disponible.

            On évite donc une attente réseau inutile.
          */
          if (
            typeof navigator !== "undefined" &&
            navigator.onLine === false
          ) {

            if (mountedRef.current) {
              setLoading(false);
            }

            return;
          }


          // -----------------------------------------------
          // LECTURE SUPABASE
          // -----------------------------------------------

          const [
            profileResult,
            badgesResult
          ] = await Promise.all([

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
                studentId
              )
              .single(),


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
                studentId
              )

          ]);


          // -----------------------------------------------
          // PROFILE ÉLÈVE
          // -----------------------------------------------

          const {
            data: profileData,
            error: profileError
          } = profileResult;


          if (profileError) {

            console.error(
              "❌ PROFILE CONSULTATION ERROR :",
              profileError
            );

          }
          else if (
            profileData &&
            mountedRef.current
          ) {

            setProfile(
              profileData
            );

            writeLocalCache(
              getProfileCacheKey(studentId),
              profileData
            );

          }


          // -----------------------------------------------
          // BADGES ÉLÈVE
          // -----------------------------------------------

          const {
            data: badgeData,
            error: badgeError
          } = badgesResult;


          if (badgeError) {

            console.error(
              "❌ BADGES CONSULTATION ERROR :",
              badgeError
            );

            /*
              Le cache est conservé en cas d'erreur.
            */

            if (
              !cachedBadges &&
              mountedRef.current
            ) {

              setBadges([]);

            }

          }
          else {

            const safeBadges =
              badgeData || [];

            if (mountedRef.current) {

              setBadges(
                safeBadges
              );

            }

            writeLocalCache(
              getBadgesCacheKey(studentId),
              safeBadges
            );

          }


          return;
        }


        // =================================================
        // MODE NORMAL
        // =================================================

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

          if (
            !background &&
            mountedRef.current
          ) {

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
          Le cache est affiché immédiatement.
        */

        if (
          cachedProfile &&
          mountedRef.current
        ) {

          setProfile(
            cachedProfile
          );

          setLoading(false);

        }

        if (
          Array.isArray(cachedBadges) &&
          mountedRef.current
        ) {

          setBadges(
            cachedBadges
          );

        }


        // -----------------------------------------------
        // MODE PREMIER CHARGEMENT
        // -----------------------------------------------

        if (
          !cachedProfile &&
          !background &&
          mountedRef.current
        ) {

          setLoading(true);

        }


        // -----------------------------------------------
        // HORS LIGNE
        // -----------------------------------------------

        /*
          Si le téléphone est clairement hors ligne,
          inutile d'attendre les requêtes Supabase.

          Les données locales déjà affichées restent
          disponibles.
        */
        if (
          typeof navigator !== "undefined" &&
          navigator.onLine === false
        ) {

          if (mountedRef.current) {
            setLoading(false);
          }

          return;
        }


        // -----------------------------------------------
        // SUPABASE
        // -----------------------------------------------

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
        else if (
          profileData &&
          mountedRef.current
        ) {

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
            Le cache est conservé si Supabase
            ne répond pas.
          */

          if (
            !cachedBadges &&
            mountedRef.current
          ) {

            setBadges([]);

          }

        }
        else {

          const safeBadges =
            badgeData || [];

          if (mountedRef.current) {

            setBadges(
              safeBadges
            );

          }

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

        if (mountedRef.current) {

          /*
            Même en cas d'erreur réseau,
            la page ne reste jamais bloquée.
          */

          setLoading(false);

        }

        loadingRequestRef.current = false;

      }

    },
    [
      isConsultation,
      studentId
    ]
  );


  // ===================================================
  // INITIALISATION
  // ===================================================

  useEffect(() => {

    mountedRef.current = true;

    /*
      Une nouvelle route doit pouvoir déclencher
      un nouveau chargement.
    */
    loadingRequestRef.current = false;


    loadProfile();


    return () => {

      mountedRef.current = false;

    };

  }, [loadProfile]);


  // ===================================================
  // GÉNÉRER LE CODE DE RÉCUPÉRATION
  // ===================================================

  async function handleGenerateRecoveryCode() {

    /*
      Disponible uniquement pour l'élève connecté.
    */

    if (isConsultation) {
      return;
    }


    /*
      Générer un nouveau code invalide
      immédiatement l'ancien.
    */

    if (recoveryCode) {

      const confirmed =
        window.confirm(
          "Générer un nouveau code de récupération ?\n\n" +
          "L'ancien code deviendra immédiatement invalide."
        );

      if (!confirmed) {
        return;
      }

    }


    setRecoveryLoading(true);
    setRecoveryMessage("");
    setRecoveryMessageType("");
    setRecoveryCopied(false);


    try {

      const result =
        await generateDeviceRecoveryCode();


      /*
        Selon deviceService, le résultat peut être
        directement l'objet RPC ou être contenu
        dans result.data.
      */

      const payload =
        result?.data ?? result;


      const code =
        payload?.code;


      if (
        payload?.success &&
        code
      ) {

        /*
          Le code reste uniquement en mémoire.
        */

        setRecoveryCode(
          String(code)
            .trim()
            .toUpperCase()
        );

        setRecoveryMessage(
          "Nouveau code généré avec succès."
        );

        setRecoveryMessageType(
          "success"
        );

      }
      else {

        console.error(
          "❌ Génération du code de récupération échouée :",
          result
        );

        setRecoveryMessage(
          "Impossible de générer le code de récupération. Vérifie ta connexion Internet puis réessaie."
        );

        setRecoveryMessageType(
          "error"
        );

      }

    } catch (error) {

      console.error(
        "❌ Erreur génération code de récupération :",
        error
      );

      setRecoveryMessage(
        "Impossible de générer le code. Une connexion Internet est nécessaire."
      );

      setRecoveryMessageType(
        "error"
      );

    } finally {

      setRecoveryLoading(false);

    }

  }


  // ===================================================
  // COPIER LE CODE DE RÉCUPÉRATION
  // ===================================================

  async function handleCopyRecoveryCode() {

    if (!recoveryCode) {
      return;
    }


    try {

      if (
        navigator.clipboard &&
        typeof navigator.clipboard.writeText ===
          "function"
      ) {

        await navigator.clipboard.writeText(
          recoveryCode
        );

      }
      else {

        const textarea =
          document.createElement("textarea");

        textarea.value =
          recoveryCode;

        textarea.setAttribute(
          "readonly",
          ""
        );

        textarea.style.position =
          "fixed";

        textarea.style.opacity =
          "0";

        textarea.style.pointerEvents =
          "none";

        document.body.appendChild(
          textarea
        );

        textarea.select();

        document.execCommand(
          "copy"
        );

        document.body.removeChild(
          textarea
        );

      }


      setRecoveryCopied(true);

      setRecoveryMessage(
        "Code copié dans le presse-papiers."
      );

      setRecoveryMessageType(
        "success"
      );


      window.setTimeout(() => {

        setRecoveryCopied(false);

      }, 2500);

    } catch (error) {

      console.error(
        "❌ Impossible de copier le code :",
        error
      );

      setRecoveryMessage(
        "Impossible de copier automatiquement le code. Tu peux le recopier manuellement."
      );

      setRecoveryMessageType(
        "error"
      );

    }

  }


  // ===================================================
  // DÉCONNEXION
  // ===================================================

  async function handleLogout() {

    /*
      En consultation, l'administrateur
      ne doit jamais être déconnecté.
    */

    if (isConsultation) {
      return;
    }


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
  // NAVIGATION
  // ===================================================

  function goHome() {

    if (
      isConsultation &&
      studentId
    ) {

      navigate("/admin/users");

      return;
    }

    navigate("/");

  }


  function goDownloads() {

    if (
      isConsultation &&
      studentId
    ) {

      navigate(
        `/admin/student/${studentId}/consultation/downloads`,
        {
          state: {
            consultationMode: true
          }
        }
      );

      return;
    }

    navigate("/downloads");

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
          theme-bg
          theme-text
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

          <User
            size={28}
            className="text-accent"
          />

        </div>


        <p
          className="
            theme-text-secondary
            font-medium
          "
        >

          {isConsultation
            ? "Chargement du profil de l'élève..."
            : "Chargement du profil..."}

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
        theme-bg
        theme-text
        pb-8
      "
    >


      {/* =================================================
          HEADER
      ================================================= */}

      <div
        className="
          theme-surface
          border-b
          theme-border
          px-5
          py-4
        "
      >

        <button
          onClick={goHome}
          className="
            flex
            items-center
            gap-2
            text-xl
            font-bold
            theme-text
            hover:text-accent
            transition
          "
        >

          <span
            className="
              w-9
              h-9
              rounded-xl
              bg-accent
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
          BANDEAU CONSULTATION
      ================================================= */}

      {isConsultation && (

        <div
          className="
            bg-blue-600
            text-white
            px-5
            py-3
          "
        >

          <div
            className="
              max-w-3xl
              mx-auto
              flex
              flex-col
              sm:flex-row
              sm:items-center
              sm:justify-between
              gap-1
            "
          >

            <p
              className="
                text-sm
                font-bold
              "
            >
              👁️ MODE CONSULTATION
            </p>


            <p
              className="
                text-xs
                opacity-90
              "
            >
              Lecture seule — aucune donnée élève ne sera modifiée
            </p>

          </div>

        </div>

      )}


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
              theme-text
            "
          >

            {isConsultation
              ? "Profil de l'élève"
              : "Mon profil"}

          </h1>


          <p
            className="
              theme-text-secondary
              mt-1
            "
          >

            {isConsultation
              ? "Consultation du profil et des récompenses de l'élève."
              : "Consulte ton profil et tes récompenses."}

          </p>

        </div>


        {/* =================================================
            CARTE PROFIL
        ================================================= */}

        {profile && (

          <div
            className="
              theme-surface
              rounded-2xl
              shadow-sm
              border
              theme-border
              overflow-hidden
              mb-6
            "
          >

            <div
              className="
                h-24
                bg-accent
              "
            />


            <div className="relative">

              <div
                className="
                  pointer-events-none
                  absolute
                  inset-0
                  overflow-hidden
                "
                aria-hidden="true"
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
                    opacity-5
                  "
                />

              </div>

              <div
                className="
                  relative
                  z-10
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
                      theme-surface
                      border-4
                      border-white
                      dark:border-gray-700
                      shadow-sm
                      overflow-hidden
                      flex
                      items-center
                      justify-center
                    "
                  >

                    {profile.avatar_url ? (

                      <img
                        src={profile.avatar_url}
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
                        className="text-accent"
                      />

                    )}

                  </div>

                </div>


                {/* NOM */}

                <h2
                  className="
                    text-xl
                    font-bold
                    theme-text
                  "
                >
                  {profile.full_name ||
                    "Étudiant Kalan"}
                </h2>


                <p
                  className="
                    text-sm
                    theme-text-secondary
                    mt-1
                  "
                >
                  {isConsultation
                    ? "Profil élève — lecture seule"
                    : "Élève Kalan Academy"}
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
                      dark:bg-gray-800
                      p-4
                    "
                  >

                    <div
                      className="
                        w-9
                        h-9
                        rounded-xl
                        bg-yellow-50
                        dark:bg-yellow-950/40
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
                          className="theme-text-secondary"
                        />

                      )}

                    </div>


                    <p
                      className="
                        text-xs
                        theme-text-secondary
                      "
                    >
                      Statut
                    </p>


                    <p
                      className="
                        font-bold
                        theme-text
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
                      dark:bg-gray-800
                      p-4
                    "
                  >

                    <div
                      className="
                        w-9
                        h-9
                        rounded-xl
                        bg-accent-soft
                        flex
                        items-center
                        justify-center
                        mb-3
                      "
                    >

                      <Star
                        size={19}
                        className="text-accent"
                      />

                    </div>


                    <p
                      className="
                        text-xs
                        theme-text-secondary
                      "
                    >
                      Compte
                    </p>


                    <p
                      className="
                        font-bold
                        theme-text
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

          </div>

        )}


        {/* =================================================
            CODE DE RÉCUPÉRATION
        ================================================= */}

        {!isConsultation && (

          <div
            className="
              relative
              overflow-hidden
              theme-surface
              rounded-2xl
              border
              theme-border
              shadow-sm
              p-5
              mb-6
            "
          >

            <div
              className="
                pointer-events-none
                absolute
                -right-16
                -top-16
                w-40
                h-40
                rounded-full
                bg-accent
                opacity-5
              "
              aria-hidden="true"
            />

            <div
              className="
                pointer-events-none
                absolute
                -left-20
                -bottom-20
                w-48
                h-48
                rounded-full
                bg-accent
                opacity-5
              "
              aria-hidden="true"
            />


            <div
              className="
                relative
                z-10
              "
            >

              {/* EN-TÊTE */}

              <div
                className="
                  flex
                  items-start
                  gap-4
                "
              >

                <div
                  className="
                    w-12
                    h-12
                    rounded-2xl
                    bg-accent-soft
                    text-accent
                    flex
                    items-center
                    justify-center
                    shrink-0
                  "
                >

                  <KeyRound
                    size={23}
                  />

                </div>


                <div
                  className="
                    flex-1
                    min-w-0
                  "
                >

                  <h2
                    className="
                      font-bold
                      theme-text
                      text-lg
                    "
                  >
                    Code de récupération
                  </h2>


                  <p
                    className="
                      text-sm
                      theme-text-secondary
                      mt-1
                      leading-relaxed
                    "
                  >
                    Utilise ce code si tu dois récupérer
                    ton compte sur un autre téléphone.
                  </p>

                </div>

              </div>


              {/* AVERTISSEMENT */}

              <div
                className="
                  mt-4
                  rounded-xl
                  bg-yellow-50
                  dark:bg-yellow-950/30
                  border
                  border-yellow-200
                  dark:border-yellow-900
                  px-4
                  py-3
                "
              >

                <p
                  className="
                    text-xs
                    text-yellow-800
                    dark:text-yellow-200
                    leading-relaxed
                  "
                >
                  <strong>Important :</strong>{" "}
                  le code est affiché une seule fois.
                  Garde-le dans un endroit sûr.
                  Générer un nouveau code rendra
                  immédiatement l'ancien invalide.
                </p>

              </div>


              {/* CODE GÉNÉRÉ */}

              {recoveryCode && (

                <div className="mt-5">

                  <p
                    className="
                      text-xs
                      font-semibold
                      theme-text-secondary
                      mb-2
                    "
                  >
                    Ton code de récupération
                  </p>


                  <div
                    className="
                      flex
                      flex-col
                      sm:flex-row
                      gap-2
                    "
                  >

                    <div
                      className="
                        flex-1
                        min-w-0
                        rounded-xl
                        border
                        theme-border
                        bg-gray-50
                        dark:bg-gray-800
                        px-4
                        py-3
                        flex
                        items-center
                        justify-center
                      "
                    >

                      <span
                        className="
                          font-mono
                          text-lg
                          sm:text-xl
                          font-extrabold
                          tracking-wider
                          theme-text
                          select-text
                        "
                      >
                        {recoveryCode}
                      </span>

                    </div>


                    <button
                      type="button"
                      onClick={
                        handleCopyRecoveryCode
                      }
                      className="
                        inline-flex
                        items-center
                        justify-center
                        gap-2
                        rounded-xl
                        bg-accent
                        text-white
                        px-4
                        py-3
                        font-semibold
                        hover:opacity-90
                        transition
                        shrink-0
                      "
                    >

                      {recoveryCopied ? (

                        <Check
                          size={18}
                        />

                      ) : (

                        <Copy
                          size={18}
                        />

                      )}

                      {recoveryCopied
                        ? "Copié"
                        : "Copier le code"}

                    </button>

                  </div>

                </div>

              )}


              {/* MESSAGE */}

              {recoveryMessage && (

                <div
                  className={`
                    mt-4
                    rounded-xl
                    px-4
                    py-3
                    text-sm
                    font-medium
                    ${
                      recoveryMessageType ===
                      "success"
                        ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-300"
                        : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300"
                    }
                  `}
                >
                  {recoveryMessage}
                </div>

              )}


              {/* BOUTON GÉNÉRATION */}

              <button
                type="button"
                onClick={
                  handleGenerateRecoveryCode
                }
                disabled={
                  recoveryLoading
                }
                className="
                  w-full
                  mt-5
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  border
                  theme-border
                  theme-text
                  px-4
                  py-3
                  font-semibold
                  hover:bg-gray-100
                  dark:hover:bg-gray-800
                  transition
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                "
              >

                {recoveryLoading ? (

                  <>
                    <span
                      className="
                        w-4
                        h-4
                        rounded-full
                        border-2
                        border-current
                        border-t-transparent
                        animate-spin
                      "
                    />

                    Génération en cours...

                  </>

                ) : (

                  <>
                    <KeyRound
                      size={18}
                    />

                    {recoveryCode
                      ? "Générer un nouveau code"
                      : "Générer mon code"}

                  </>

                )}

              </button>


              <p
                className="
                  text-xs
                  theme-text-secondary
                  mt-3
                  text-center
                  leading-relaxed
                "
              >
                Une connexion Internet est nécessaire
                pour générer un nouveau code.
              </p>

            </div>

          </div>

        )}


        {/* =================================================
            TÉLÉCHARGEMENTS
        ================================================= */}

        <button
          onClick={goDownloads}
          className="
            w-full
            theme-surface
            rounded-2xl
            border
            theme-border
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
              bg-accent-soft
              flex
              items-center
              justify-center
            "
          >

            <Download
              size={23}
              className="text-accent"
            />

          </div>


          <div className="flex-1">

            <h2
              className="
                font-bold
                theme-text
              "
            >

              {isConsultation
                ? "Téléchargements de l'élève"
                : "Mes téléchargements"}

            </h2>


            <p
              className="
                text-sm
                theme-text-secondary
                mt-1
              "
            >

              {isConsultation
                ? "Consulter les vidéos disponibles hors ligne"
                : "Accéder à mes vidéos hors ligne"}

            </p>

          </div>


          <span
            className="
              theme-text-secondary
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
                theme-text
                flex
                items-center
                gap-2
              "
            >

              <Trophy
                size={21}
                className="text-yellow-500"
              />

              {isConsultation
                ? "Badges de l'élève"
                : "Mes badges"}

            </h2>


            <p
              className="
                text-sm
                theme-text-secondary
                mt-1
              "
            >

              {isConsultation
                ? "Récompenses obtenues par l'élève."
                : "Tes récompenses Kalan Academy."}

            </p>

          </div>


          {badges.length > 0 && (

            <div
              className="
                min-w-9
                h-9
                px-3
                rounded-full
                bg-accent-soft
                text-accent
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
                w-16
                h-16
                mx-auto
                mb-4
                rounded-2xl
                bg-gray-50
                dark:bg-gray-800
                flex
                items-center
                justify-center
              "
            >

              <Award
                size={30}
                className="theme-text-secondary"
              />

            </div>


            <p
              className="
                font-bold
                theme-text
              "
            >
              Aucun badge obtenu
            </p>


            <p
              className="
                text-sm
                theme-text-secondary
                mt-1
              "
            >

              {isConsultation
                ? "Cet élève n'a encore obtenu aucun badge."
                : "Continue tes leçons et tes quiz pour gagner des récompenses."}

            </p>

          </div>

        ) : (

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
                    theme-surface
                    rounded-2xl
                    border
                    theme-border
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
                      dark:bg-yellow-950/40
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
                        theme-text
                      "
                    >
                      {item.badges?.name ||
                        "Badge Kalan"}
                    </h3>


                    <p
                      className="
                        text-sm
                        theme-text-secondary
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
                        bg-accent-soft
                        text-accent
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
          onClick={goHome}
          className="
            w-full
            mt-6
            flex
            items-center
            justify-center
            gap-2
            theme-surface
            border
            theme-border
            theme-text
            px-5
            py-3
            rounded-xl
            font-semibold
            hover:bg-gray-100
            dark:hover:bg-gray-800
            transition
          "
        >

          <Home
            size={18}
          />

          {isConsultation
            ? "Retour à la consultation"
            : "Retour à l'accueil"}

        </button>


        {/* =================================================
            DÉCONNEXION
        ================================================= */}

        {!isConsultation && (

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
              dark:hover:bg-red-950/40
              transition
            "
          >

            <LogOut
              size={18}
            />

            Se déconnecter

          </button>

        )}

      </div>

    </div>

  );

}
