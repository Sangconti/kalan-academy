// src/pages/admin/AdminStudentPage.jsx

import {
  useEffect,
  useState
} from "react";

import {
  useNavigate,
  useParams
} from "react-router-dom";

import {
  ArrowLeft,
  Award,
  BookOpen,
  CreditCard,
  Mail,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Star,
  Target,
  Trophy,
  TrendingUp,
  User
} from "lucide-react";

import {
  getAdminStudentView,
  resetUserProgress
} from "../../services/adminService";

import {
  generateUserDeviceRecoveryCode,
  resetUserDevice
} from "../../services/deviceService";


// =====================================================
// CONSTANTES
// =====================================================

const XP_PER_LEVEL = 500;


// =====================================================
// OUTILS
// =====================================================

function formatDate(value) {

  if (!value) {
    return "—";
  }

  try {

    return new Intl.DateTimeFormat(
      "fr-FR",
      {
        dateStyle: "medium",
        timeStyle: "short"
      }
    ).format(new Date(value));

  } catch {

    return "—";

  }

}


function formatAccessStatus(status) {

  if (!status) {
    return "—";
  }

  const labels = {
    active: "Actif",
    pending: "En attente",
    suspended: "Suspendu",
    blocked: "Bloqué",
    inactive: "Inactif"
  };

  return labels[status] || status;

}


function getAccessStatusClass(status) {

  switch (status) {

    case "active":
      return "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800";

    case "suspended":
    case "blocked":
      return "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800";

    case "pending":
      return "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800";

    default:
      return "bg-gray-50 dark:bg-gray-950/30 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700";

  }

}


// =====================================================
// PAGE
// =====================================================

export default function AdminStudentPage() {

  const {
    studentId
  } = useParams();

  const navigate =
    useNavigate();

  const [data, setData] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");


  // ===================================================
  // GESTION APPAREIL
  // ===================================================

  const [deviceActionLoading, setDeviceActionLoading] =
    useState(false);

  const [deviceMessage, setDeviceMessage] =
    useState("");

  const [deviceMessageType, setDeviceMessageType] =
    useState("");


  // ===================================================
  // RÉINITIALISATION PROGRESSION
  // ===================================================

  const [progressResetLoading, setProgressResetLoading] =
    useState(false);

  const [progressResetMessage, setProgressResetMessage] =
    useState("");

  const [progressResetMessageType, setProgressResetMessageType] =
    useState("");


  // ===================================================
  // CHARGEMENT
  // ===================================================

  async function loadStudent(
    isRefresh = false
  ) {

    try {

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      console.log(
        "👁️ [ADMIN STUDENT] Chargement élève =",
        studentId
      );

      const result =
        await getAdminStudentView(
          studentId
        );

      setData(result);

      console.log(
        "✅ [ADMIN STUDENT] Données chargées =",
        result
      );

    } catch (error) {

      console.error(
        "❌ [ADMIN STUDENT] Erreur =",
        error
      );

      setError(
        error?.message ||
        "Impossible de charger les données de cet élève."
      );

    } finally {

      setLoading(false);
      setRefreshing(false);

    }

  }


  // ===================================================
  // GÉNÉRER UN CODE DE RÉCUPÉRATION
  // ===================================================

  async function handleGenerateRecoveryCode() {

    const studentName =
      data?.profile?.full_name ||
      "cet élève";

    const confirmed =
      window.confirm(
        `Générer un nouveau code de récupération pour ${studentName} ?\n\n` +
        "Tout ancien code de récupération deviendra immédiatement invalide."
      );

    if (!confirmed) {
      return;
    }

    try {

      setDeviceActionLoading(true);
      setDeviceMessage("");
      setDeviceMessageType("");

      console.log(
        "🔐 [ADMIN STUDENT DEVICE] Génération du code pour =",
        studentId
      );

      const result =
        await generateUserDeviceRecoveryCode(
          studentId
        );

      console.log(
        "📱 [ADMIN STUDENT DEVICE] Résultat =",
        result
      );

      if (!result?.success) {

        setDeviceMessage(
          result?.message ||
          "Impossible de générer le code de récupération."
        );

        setDeviceMessageType("error");

        return;
      }

      if (result?.status === "code_generated") {

        setDeviceMessage(
          `Code de récupération : ${result.code}`
        );

        setDeviceMessageType("success");

        return;
      }

      setDeviceMessage(
        "Réponse inattendue du serveur."
      );

      setDeviceMessageType("error");

    } catch (error) {

      console.error(
        "❌ [ADMIN STUDENT DEVICE] Erreur génération =",
        error
      );

      setDeviceMessage(
        error?.message ||
        "Impossible de générer le code."
      );

      setDeviceMessageType("error");

    } finally {

      setDeviceActionLoading(false);

    }

  }


  // ===================================================
  // RÉINITIALISER L'APPAREIL
  // ===================================================

  async function handleResetDevice() {

    const studentName =
      data?.profile?.full_name ||
      "cet élève";

    const confirmed =
      window.confirm(
        `Réinitialiser l'appareil de ${studentName} ?\n\n` +
        "L'appareil actuellement associé sera libéré. " +
        "L'élève pourra ensuite associer un nouveau téléphone."
      );

    if (!confirmed) {
      return;
    }

    try {

      setDeviceActionLoading(true);
      setDeviceMessage("");
      setDeviceMessageType("");

      console.log(
        "🔄 [ADMIN STUDENT DEVICE] Réinitialisation pour =",
        studentId
      );

      const result =
        await resetUserDevice(
          studentId
        );

      console.log(
        "📱 [ADMIN STUDENT DEVICE] Résultat reset =",
        result
      );

      if (!result?.success) {

        setDeviceMessage(
          result?.message ||
          "Impossible de réinitialiser l'appareil."
        );

        setDeviceMessageType("error");

        return;
      }

      setDeviceMessage(
        "L'appareil a été réinitialisé avec succès. L'élève peut maintenant associer un nouveau téléphone."
      );

      setDeviceMessageType("success");

      await loadStudent(true);

    } catch (error) {

      console.error(
        "❌ [ADMIN STUDENT DEVICE] Erreur réinitialisation =",
        error
      );

      setDeviceMessage(
        error?.message ||
        "Impossible de réinitialiser l'appareil."
      );

      setDeviceMessageType("error");

    } finally {

      setDeviceActionLoading(false);

    }

  }


  // ===================================================
  // RÉINITIALISER LA PROGRESSION
  // ===================================================

  async function handleResetProgress() {

    const studentName =
      data?.profile?.full_name ||
      "cet élève";

    const confirmed =
      window.confirm(
        `⚠️ Réinitialiser complètement la progression de ${studentName} ?\n\n` +
        "Cette action supprimera :\n" +
        "• les leçons terminées\n" +
        "• les résultats de quiz\n" +
        "• les badges obtenus\n" +
        "• l'XP\n" +
        "• le niveau\n\n" +
        "Cette action est irréversible."
      );

    if (!confirmed) {
      return;
    }

    try {

      setProgressResetLoading(true);
      setProgressResetMessage("");
      setProgressResetMessageType("");

      console.log(
        "🔄 [ADMIN STUDENT PROGRESS] Réinitialisation pour =",
        studentId
      );

      const result =
        await resetUserProgress(
          studentId
        );

      console.log(
        "📊 [ADMIN STUDENT PROGRESS] Résultat =",
        result
      );

      if (!result?.success) {

        setProgressResetMessage(
          result?.message ||
          "Impossible de réinitialiser la progression."
        );

        setProgressResetMessageType("error");

        return;
      }

      setProgressResetMessage(
        "La progression de l'élève a été entièrement réinitialisée."
      );

      setProgressResetMessageType("success");

      await loadStudent(true);

    } catch (error) {

      console.error(
        "❌ [ADMIN STUDENT PROGRESS] Erreur =",
        error
      );

      setProgressResetMessage(
        error?.message ||
        "Impossible de réinitialiser la progression."
      );

      setProgressResetMessageType("error");

    } finally {

      setProgressResetLoading(false);

    }

  }


  // ===================================================
  // INITIALISATION
  // ===================================================

  useEffect(() => {

    loadStudent();

  }, [studentId]);


  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {

    return (
      <div className="
        min-h-[60vh]
        flex
        flex-col
        items-center
        justify-center
        theme-bg
      ">

        <div className="
          w-14
          h-14
          rounded-2xl
          bg-accent-soft
          border
          border-accent
          flex
          items-center
          justify-center
          mb-4
        ">

          <TrendingUp
            size={28}
            className="text-accent"
          />

        </div>

        <p className="
          theme-text
          font-semibold
        ">
          Chargement de l'élève...
        </p>

      </div>
    );

  }


  // ===================================================
  // ERREUR
  // ===================================================

  if (error) {

    return (
      <div className="
        min-h-[60vh]
        theme-bg
        max-w-2xl
        mx-auto
        px-5
        py-10
      ">

        <div className="
          theme-surface
          theme-border
          border
          rounded-3xl
          shadow-sm
          p-8
          text-center
        ">

          <div className="
            w-14
            h-14
            mx-auto
            rounded-2xl
            bg-red-50
            dark:bg-red-950/30
            border
            border-red-200
            dark:border-red-800
            text-red-600
            dark:text-red-300
            flex
            items-center
            justify-center
            mb-4
          ">
            ⚠️
          </div>

          <h2 className="
            text-xl
            font-bold
            theme-text
          ">
            Impossible de charger l'élève
          </h2>

          <p className="
            text-sm
            theme-text-secondary
            mt-2
          ">
            {error}
          </p>

          <div className="
            flex
            flex-col
            sm:flex-row
            justify-center
            gap-3
            mt-6
          ">

            <button
              type="button"
              onClick={() =>
                navigate("/admin/users")
              }
              className="
                px-5
                py-3
                rounded-xl
                theme-surface
                theme-border
                border
                theme-text
                font-semibold
                hover:bg-accent-soft
                hover:text-accent
                transition
              "
            >
              Retour aux utilisateurs
            </button>

            <button
              type="button"
              onClick={() =>
                loadStudent(true)
              }
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
                font-semibold
                shadow-md
                hover:opacity-90
                hover:-translate-y-0.5
                transition
              "
            >
              <RefreshCw size={18} />
              Réessayer
            </button>

          </div>

        </div>

      </div>
    );

  }


  // ===================================================
  // PROFIL ABSENT
  // ===================================================

  if (!data?.profile) {

    return (
      <div className="
        min-h-[60vh]
        theme-bg
        flex
        items-center
        justify-center
        p-8
        text-center
      ">

        <div className="
          theme-surface
          theme-border
          border
          rounded-3xl
          shadow-sm
          p-8
        ">

          <User
            size={36}
            className="
              mx-auto
              text-accent
              mb-3
            "
          />

          <p className="
            theme-text
            font-bold
          ">
            Élève introuvable.
          </p>

        </div>

      </div>
    );

  }


  // ===================================================
  // DONNÉES
  // ===================================================

  const profile =
    data.profile;

  const stats =
    data.stats || {};

  const subjects =
    data.subjects || {};

  const badges =
    data.badges || [];

  const device =
    data.device || null;


  // ===================================================
  // INFORMATIONS PROFIL
  // ===================================================

  const studentName =
    profile.full_name ||
    "Élève";

  const studentEmail =
    profile.email ||
    "Non renseigné";

  const className =
    profile.classes?.name ||
    profile.class?.name ||
    profile.class_name ||
    "Classe non renseignée";

  const orangeMoneyId =
    profile.orange_money_id ||
    "Non renseigné";


  // ===================================================
  // XP
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
  // APPAREIL
  // ===================================================

  const hasDevice =
    Boolean(device);

  const deviceName =
    device?.device_name ||
    "Téléphone non identifié";

  const deviceManufacturer =
    device?.manufacturer ||
    "—";

  const deviceModel =
    device?.model ||
    "—";

  const devicePlatform =
    device?.platform ||
    "—";

  const deviceOS =
    device?.os_version ||
    "—";

  const deviceLastSeen =
    device?.last_seen_at
      ? formatDate(device.last_seen_at)
      : "—";


  // ===================================================
  // AFFICHAGE
  // ===================================================

  return (

    <div className="
      min-h-screen
      theme-bg
      px-5
      py-6
      md:px-8
      md:py-8
    ">

      <div className="
        max-w-6xl
        mx-auto
        space-y-7
      ">


        {/* =================================================
            HERO GESTION DE L'ÉLÈVE
        ================================================= */}

        <section className="
          relative
          overflow-hidden
          rounded-3xl
          bg-accent-soft
          border
          border-accent
          p-6
          md:p-8
          shadow-lg
        ">

          <div className="
            absolute
            -right-10
            -top-10
            w-40
            h-40
            rounded-full
            bg-accent
            opacity-10
          " />

          <div className="
            absolute
            -left-16
            -bottom-20
            w-48
            h-48
            rounded-full
            bg-accent
            opacity-10
          " />

          <div className="
            absolute
            right-16
            -bottom-24
            w-56
            h-56
            rounded-full
            bg-accent
            opacity-5
          " />

          <div className="
            relative
            z-10
          ">

            <div className="
              flex
              flex-col
              lg:flex-row
              lg:items-end
              lg:justify-between
              gap-6
            ">

              <div>

                <div className="
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
                ">
                  <ShieldCheck size={14} />
                  Gestion de l'élève
                </div>

                <h1 className="
                  text-2xl
                  md:text-3xl
                  font-bold
                  leading-tight
                  theme-text
                ">
                  Gestion de {studentName}
                </h1>

                <p className="
                  theme-text-secondary
                  mt-3
                  leading-relaxed
                  max-w-3xl
                ">
                  Consultez le profil, la progression, les résultats,
                  les badges et l'appareil associé à cet élève.
                </p>

              </div>

              <div className="
                flex
                flex-col
                sm:flex-row
                gap-3
              ">

                <button
                  type="button"
                  onClick={() =>
                    navigate("/admin/users")
                  }
                  className="
                    inline-flex
                    items-center
                    justify-center
                    gap-2
                    px-4
                    py-3
                    rounded-xl
                    theme-surface
                    theme-border
                    border
                    theme-text
                    font-semibold
                    shadow-sm
                    hover:bg-accent
                    hover:text-white
                    hover:border-accent
                    transition
                  "
                >
                  <ArrowLeft size={17} />
                  Retour
                </button>

                <button
                  type="button"
                  onClick={() =>
                    loadStudent(true)
                  }
                  disabled={refreshing}
                  className="
                    inline-flex
                    items-center
                    justify-center
                    gap-2
                    bg-accent
                    text-white
                    px-4
                    py-3
                    rounded-xl
                    font-semibold
                    shadow-md
                    hover:opacity-90
                    hover:-translate-y-0.5
                    transition
                    disabled:opacity-50
                    disabled:cursor-not-allowed
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

            </div>

            <div className="
              flex
              flex-wrap
              items-center
              gap-3
              mt-6
            ">

              <div className="
                inline-flex
                items-center
                gap-2
                px-3
                py-2
                rounded-xl
                bg-white/70
                dark:bg-gray-950/30
                theme-text
                text-sm
                font-medium
                border
                border-white/50
                dark:border-white/10
              ">
                <User
                  size={16}
                  className="text-accent"
                />
                {studentName}
              </div>

              <div className="
                inline-flex
                items-center
                gap-2
                px-3
                py-2
                rounded-xl
                bg-white/70
                dark:bg-gray-950/30
                theme-text
                text-sm
                font-medium
                border
                border-white/50
                dark:border-white/10
              ">
                <BookOpen
                  size={16}
                  className="text-accent"
                />
                {className}
              </div>

              <div className="
                inline-flex
                items-center
                gap-2
                px-3
                py-2
                rounded-xl
                bg-white/70
                dark:bg-gray-950/30
                theme-text
                text-sm
                font-medium
                border
                border-white/50
                dark:border-white/10
              ">
                <Star
                  size={16}
                  className="text-accent"
                />
                Niveau {level}
              </div>

              <div className="
                inline-flex
                items-center
                gap-2
                px-3
                py-2
                rounded-xl
                bg-white/70
                dark:bg-gray-950/30
                theme-text
                text-sm
                font-medium
                border
                border-white/50
                dark:border-white/10
              ">
                <TrendingUp
                  size={16}
                  className="text-accent"
                />
                {xp} XP
              </div>

            </div>

          </div>

        </section>


        {/* =================================================
            PROFIL RAPIDE
        ================================================= */}

        <section className="
          theme-surface
          theme-border
          rounded-3xl
          border
          shadow-sm
          p-6
        ">

          <div className="
            flex
            flex-col
            lg:flex-row
            lg:items-center
            gap-5
          ">

            <div className="
              w-20
              h-20
              rounded-2xl
              bg-accent-soft
              border
              border-accent
              overflow-hidden
              flex
              items-center
              justify-center
              shrink-0
            ">

              {profile.avatar_url ? (

                <img
                  src={profile.avatar_url}
                  alt={studentName}
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

            <div className="flex-1 min-w-0">

              <h2 className="
                text-xl
                font-bold
                theme-text
              ">
                {studentName}
              </h2>

              <p className="
                text-sm
                theme-text-secondary
                mt-1
              ">
                Élève Kalan Academy
              </p>

              <div className="
                flex
                flex-col
                gap-1
                mt-2
              ">

                <p className="
                  inline-flex
                  items-center
                  gap-2
                  text-sm
                  theme-text-secondary
                  break-all
                ">
                  <Mail
                    size={15}
                    className="shrink-0 text-accent"
                  />
                  {studentEmail}
                </p>

                <p className="
                  text-sm
                  theme-text-secondary
                ">
                  Classe :{" "}
                  <strong className="theme-text">
                    {className}
                  </strong>
                </p>

              </div>

            </div>

            <div className="
              flex
              flex-wrap
              gap-2
            ">

              <span className="
                px-3
                py-2
                rounded-xl
                bg-accent-soft
                text-accent
                border
                border-accent
                text-sm
                font-semibold
              ">
                {profile.is_premium
                  ? "⭐ Premium"
                  : "Compte gratuit"}
              </span>

              <span className={`
                px-3
                py-2
                rounded-xl
                border
                text-sm
                font-semibold
                ${getAccessStatusClass(
                  profile.access_status
                )}
              `}>
                {formatAccessStatus(
                  profile.access_status
                )}
              </span>

            </div>

          </div>

        </section>


        {/* =================================================
            INFORMATIONS ADMINISTRATIVES
        ================================================= */}

        <section className="
          theme-surface
          theme-border
          rounded-3xl
          border
          shadow-sm
          p-6
        ">

          <div className="
            flex
            items-center
            gap-3
            mb-5
          ">

            <div className="
              w-10
              h-10
              rounded-xl
              bg-accent-soft
              text-accent
              border
              border-accent
              flex
              items-center
              justify-center
            ">
              <ShieldCheck size={20} />
            </div>

            <div>

              <h2 className="
                text-xl
                font-bold
                theme-text
              ">
                Informations administratives
              </h2>

              <p className="
                text-sm
                theme-text-secondary
                mt-1
              ">
                Informations utiles à la gestion du compte.
              </p>

            </div>

          </div>

          <div className="
            grid
            sm:grid-cols-2
            lg:grid-cols-3
            gap-4
          ">

            {[
              {
                label: "Classe",
                value: className
              },
              {
                label: "Rôle",
                value: profile.role || "student"
              },
              {
                label: "Orange Money",
                value: orangeMoneyId,
                icon: CreditCard,
                iconClass: "text-orange-500"
              },
              {
                label: "Compte créé",
                value: formatDate(profile.created_at)
              },
              {
                label: "Dernière mise à jour",
                value: formatDate(profile.updated_at)
              },
              {
                label: "Identifiant élève",
                value: profile.id,
                mono: true
              }
            ].map(item => {

              const Icon =
                item.icon;

              return (
                <div
                  key={item.label}
                  className="
                    rounded-2xl
                    bg-accent-soft
                    border
                    border-accent
                    p-4
                  "
                >

                  <p className="
                    text-xs
                    uppercase
                    tracking-wide
                    font-bold
                    text-accent
                  ">
                    {item.label}
                  </p>

                  <p className={`
                    ${item.mono
                      ? "text-xs font-mono"
                      : "font-bold"
                    }
                    theme-text
                    mt-1
                    break-all
                    inline-flex
                    items-center
                    gap-2
                  `}>

                    {Icon ? (
                      <Icon
                        size={16}
                        className={`${item.iconClass || "text-accent"} shrink-0`}
                      />
                    ) : null}

                    {item.value}

                  </p>

                </div>
              );

            })}

          </div>

        </section>


        {/* =================================================
            XP
        ================================================= */}

        <section className="
          relative
          overflow-hidden
          rounded-3xl
          bg-accent-soft
          border
          border-accent
          p-6
          md:p-8
          shadow-lg
        ">

          <div className="
            absolute
            -right-10
            -top-10
            w-40
            h-40
            rounded-full
            bg-accent
            opacity-10
          "/>

          <div className="
            absolute
            -left-16
            -bottom-20
            w-48
            h-48
            rounded-full
            bg-accent
            opacity-10
          "/>

          <div className="
            absolute
            right-16
            -bottom-24
            w-56
            h-56
            rounded-full
            bg-accent
            opacity-5
          "/>

          <div className="
            relative
            z-10
          ">

            <div className="
              flex
              items-center
              gap-3
              mb-6
            ">

              <div className="
                w-12
                h-12
                rounded-2xl
                bg-accent
                text-white
                flex
                items-center
                justify-center
                shadow-md
              ">
                <Star size={25} />
              </div>

              <div>

                <p className="
                  text-accent
                  text-sm
                  font-medium
                ">
                  Progression
                </p>

                <h2 className="
                  text-2xl
                  md:text-3xl
                  font-extrabold
                  theme-text
                ">
                  Niveau {level}
                </h2>

              </div>

            </div>

            <div className="
              grid
              sm:grid-cols-2
              gap-6
            ">

              <div>

                <p className="
                  text-accent
                  text-sm
                  font-medium
                ">
                  XP total
                </p>

                <p className="
                  text-4xl
                  md:text-5xl
                  font-extrabold
                  mt-1
                  tracking-tight
                  theme-text
                ">
                  {xp}

                  <span className="
                    text-lg
                    font-semibold
                    text-accent
                    ml-2
                  ">
                    XP
                  </span>

                </p>

              </div>

              <div className="sm:text-right">

                <p className="
                  text-accent
                  text-sm
                  font-medium
                ">
                  Rang
                </p>

                <p className="
                  text-xl
                  md:text-2xl
                  font-extrabold
                  mt-1
                  theme-text
                ">
                  {rank}
                </p>

              </div>

            </div>

            <div className="mt-7">

              <div className="
                flex
                flex-col
                sm:flex-row
                sm:justify-between
                gap-1
                text-sm
                theme-text-secondary
                mb-2
              ">

                <span className="font-medium">
                  Progression vers le niveau {level + 1}
                </span>

                <span className="font-bold theme-text">
                  {xpInCurrentLevel} / {XP_PER_LEVEL} XP
                </span>

              </div>

              <div className="
                h-3
                bg-white/70
                dark:bg-gray-950/30
                rounded-full
                overflow-hidden
              ">

                <div
                  className="
                    h-full
                    bg-accent
                    rounded-full
                    transition-all
                  "
                  style={{
                    width: `${progressXP}%`
                  }}
                />

              </div>

              <div className="
                flex
                justify-between
                gap-2
                mt-2
                text-xs
                theme-text-secondary
              ">

                <span>
                  {xpInCurrentLevel} XP dans ce niveau
                </span>

                <span>
                  Encore {xpRemaining} XP
                </span>

              </div>

            </div>

          </div>

        </section>


        {/* =================================================
            STATISTIQUES
        ================================================= */}

        <section>

          <div className="
            flex
            items-center
            gap-3
            mb-4
          ">

            <div className="
              w-10
              h-10
              rounded-xl
              bg-accent-soft
              text-accent
              border
              border-accent
              flex
              items-center
              justify-center
            ">
              <Target size={20} />
            </div>

            <div>

              <h2 className="
                text-xl
                font-bold
                theme-text
              ">
                Statistiques
              </h2>

              <p className="
                text-sm
                theme-text-secondary
                mt-1
              ">
                Résumé de l'activité pédagogique de l'élève.
              </p>

            </div>

          </div>

          <div className="
            grid
            grid-cols-2
            lg:grid-cols-4
            gap-4
          ">

            {[
              {
                icon: BookOpen,
                label: "Leçons terminées",
                value: Number(stats.lessons || 0)
              },
              {
                icon: Star,
                label: "Score moyen",
                value: `${Number(stats.score || 0)}%`
              },
              {
                icon: Award,
                label: "Badges obtenus",
                value: Number(stats.badges || 0)
              },
              {
                icon: Target,
                label: "Quiz réalisés",
                value: Number(stats.attempts || 0)
              }
            ].map(
              ({
                icon: Icon,
                label,
                value
              }) => (

                <div
                  key={label}
                  className="
                    theme-surface
                    theme-border
                    rounded-3xl
                    border
                    shadow-sm
                    p-5
                    hover:shadow-lg
                    transition
                  "
                >

                  <div className="
                    w-11
                    h-11
                    rounded-2xl
                    bg-accent-soft
                    text-accent
                    border
                    border-accent
                    flex
                    items-center
                    justify-center
                    mb-4
                  ">
                    <Icon size={21} />
                  </div>

                  <p className="
                    text-sm
                    theme-text-secondary
                  ">
                    {label}
                  </p>

                  <p className="
                    text-2xl
                    font-extrabold
                    theme-text
                    mt-1
                  ">
                    {value}
                  </p>

                </div>

              )
            )}

          </div>

        </section>


        {/* =================================================
            PROGRESSION PAR MATIÈRE
        ================================================= */}

        <section>

          <div className="
            flex
            items-center
            gap-3
            mb-4
          ">

            <div className="
              w-10
              h-10
              rounded-xl
              bg-accent-soft
              text-accent
              border
              border-accent
              flex
              items-center
              justify-center
            ">
              <TrendingUp size={20} />
            </div>

            <div>

              <h2 className="
                text-xl
                font-bold
                theme-text
              ">
                Progression par matière
              </h2>

              <p className="
                text-sm
                theme-text-secondary
                mt-1
              ">
                Avancement réel de l'élève dans chaque matière.
              </p>

            </div>

          </div>

          {Object.keys(subjects).length === 0 ? (

            <div className="
              theme-surface
              theme-border
              rounded-3xl
              border
              shadow-sm
              p-8
              text-center
            ">

              <div className="
                w-14
                h-14
                mx-auto
                rounded-2xl
                bg-accent-soft
                border
                border-accent
                flex
                items-center
                justify-center
                mb-3
              ">

                <BookOpen
                  size={28}
                  className="text-accent"
                />

              </div>

              <h3 className="
                font-bold
                theme-text
              ">
                Pas encore de progression
              </h3>

              <p className="
                text-sm
                theme-text-secondary
                mt-1
              ">
                Cet élève n'a pas encore terminé de leçon.
              </p>

            </div>

          ) : (

            <div className="
              grid
              md:grid-cols-2
              lg:grid-cols-3
              gap-4
            ">

              {Object.entries(subjects).map(
                ([name, subject]) => {

                  const percent =
                    Math.min(
                      Math.max(
                        Number(subject?.percent || 0),
                        0
                      ),
                      100
                    );

                  const completed =
                    Number(
                      subject?.completed || 0
                    );

                  const total =
                    Number(
                      subject?.total || 0
                    );

                  return (

                    <div
                      key={
                        subject?.id ||
                        name
                      }
                      className="
                        theme-surface
                        theme-border
                        rounded-3xl
                        border
                        shadow-sm
                        p-5
                        hover:shadow-lg
                        transition
                      "
                    >

                      <div className="
                        flex
                        items-center
                        justify-between
                        gap-3
                      ">

                        <h3 className="
                          font-bold
                          theme-text
                          truncate
                        ">
                          {subject?.name || name}
                        </h3>

                        <span className="
                          text-sm
                          font-bold
                          text-accent
                        ">
                          {percent}%
                        </span>

                      </div>

                      <div className="
                        h-3
                        bg-accent-soft
                        border
                        border-accent
                        rounded-full
                        overflow-hidden
                        mt-4
                      ">

                        <div
                          className="
                            h-full
                            bg-accent
                            rounded-full
                            transition-all
                          "
                          style={{
                            width: `${percent}%`
                          }}
                        />

                      </div>

                      <p className="
                        text-xs
                        theme-text-secondary
                        mt-2
                      ">

                        {completed} leçon
                        {completed > 1 ? "s" : ""}
                        {" "}terminée
                        {completed > 1 ? "s" : ""}
                        {" "}sur{" "}
                        {total}

                      </p>

                    </div>

                  );

                }
              )}

            </div>

          )}

        </section>


        {/* =================================================
            BADGES
        ================================================= */}

        <section>

          <div className="
            flex
            items-center
            gap-3
            mb-4
          ">

            <div className="
              w-10
              h-10
              rounded-xl
              bg-accent-soft
              text-accent
              border
              border-accent
              flex
              items-center
              justify-center
            ">
              <Trophy size={21} />
            </div>

            <div>

              <h2 className="
                text-xl
                font-bold
                theme-text
              ">
                Badges de l'élève
              </h2>

              <p className="
                text-sm
                theme-text-secondary
              ">
                Les récompenses obtenues sur Kalan Academy.
              </p>

            </div>

          </div>

          {badges.length === 0 ? (

            <div className="
              theme-surface
              theme-border
              rounded-3xl
              border
              shadow-sm
              p-8
              text-center
            ">

              <div className="
                w-14
                h-14
                mx-auto
                rounded-2xl
                bg-accent-soft
                border
                border-accent
                flex
                items-center
                justify-center
                mb-3
              ">
                <Trophy
                  size={28}
                  className="text-accent"
                />
              </div>

              <h3 className="
                font-bold
                theme-text
              ">
                Aucun badge pour le moment
              </h3>

              <p className="
                text-sm
                theme-text-secondary
                mt-1
              ">
                Les badges obtenus par l'élève apparaîtront ici.
              </p>

            </div>

          ) : (

            <div className="
              grid
              sm:grid-cols-2
              lg:grid-cols-3
              gap-4
            ">

              {badges.map(item => {

                const badge =
                  item.badges;

                return (

                  <div
                    key={item.id}
                    className="
                      theme-surface
                      theme-border
                      rounded-3xl
                      border
                      shadow-sm
                      p-5
                      hover:shadow-lg
                      transition
                    "
                  >

                    <div className="
                      flex
                      items-start
                      gap-4
                    ">

                      <div className="
                        w-14
                        h-14
                        shrink-0
                        rounded-2xl
                        bg-accent-soft
                        border
                        border-accent
                        flex
                        items-center
                        justify-center
                        overflow-hidden
                      ">

                        {badge?.image_url ? (

                          <img
                            src={badge.image_url}
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

                      <div className="min-w-0">

                        <h3 className="
                          font-bold
                          theme-text
                        ">
                          {badge?.name || "Badge"}
                        </h3>

                        <p className="
                          text-sm
                          theme-text-secondary
                          mt-1
                        ">
                          {badge?.description ||
                            "Badge obtenu sur Kalan Academy."}
                        </p>

                        {badge?.xp_reward ? (

                          <p className="
                            text-sm
                            font-semibold
                            text-accent
                            mt-2
                          ">
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


        {/* =================================================
            GESTION DE L'APPAREIL
        ================================================= */}

        <section className="
          relative
          overflow-hidden
          rounded-3xl
          bg-accent-soft
          border
          border-accent
          shadow-lg
          p-6
        ">

          <div className="
            absolute
            -right-10
            -top-10
            w-40
            h-40
            rounded-full
            bg-accent
            opacity-10
          "/>

          <div className="
            relative
            z-10
            flex
            flex-col
            gap-5
          ">

            <div className="
              flex
              flex-col
              lg:flex-row
              lg:items-center
              lg:justify-between
              gap-5
            ">

              <div className="
                flex
                items-start
                gap-4
              ">

                <div className="
                  w-12
                  h-12
                  rounded-2xl
                  bg-accent
                  text-white
                  flex
                  items-center
                  justify-center
                  shrink-0
                  shadow-md
                ">
                  <Smartphone size={24} />
                </div>

                <div>

                  <div className="
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
                    mb-2
                  ">
                    <Smartphone size={13} />
                    Appareil
                  </div>

                  <h2 className="
                    text-xl
                    font-bold
                    theme-text
                  ">
                    Gestion de l'appareil
                  </h2>

                  <p className="
                    text-sm
                    theme-text-secondary
                    mt-1
                    max-w-2xl
                  ">
                    Gérez l'appareil actuellement associé au compte de cet élève.
                  </p>

                </div>

              </div>

              <div className="
                flex
                flex-col
                sm:flex-row
                gap-3
              ">

                <button
                  type="button"
                  onClick={
                    handleGenerateRecoveryCode
                  }
                  disabled={deviceActionLoading}
                  className="
                    inline-flex
                    items-center
                    justify-center
                    gap-2
                    px-4
                    py-3
                    rounded-xl
                    bg-accent
                    text-white
                    font-semibold
                    shadow-md
                    hover:opacity-90
                    hover:-translate-y-0.5
                    transition
                    disabled:opacity-50
                    disabled:cursor-not-allowed
                    whitespace-nowrap
                  "
                >

                  <span>
                    🔐
                  </span>

                  {deviceActionLoading
                    ? "Traitement..."
                    : "Générer un code"
                  }

                </button>

                <button
                  type="button"
                  onClick={
                    handleResetDevice
                  }
                  disabled={deviceActionLoading}
                  className="
                    inline-flex
                    items-center
                    justify-center
                    gap-2
                    px-4
                    py-3
                    rounded-xl
                    theme-surface
                    theme-border
                    border
                    theme-text
                    font-semibold
                    shadow-sm
                    hover:bg-accent
                    hover:text-white
                    hover:border-accent
                    transition
                    disabled:opacity-50
                    disabled:cursor-not-allowed
                    whitespace-nowrap
                  "
                >

                  🔄 Réinitialiser

                </button>

              </div>

            </div>


            {/* INFORMATIONS APPAREIL */}

            <div className="
              rounded-2xl
              bg-white/70
              dark:bg-gray-950/30
              border
              border-white/50
              dark:border-white/10
              p-5
            ">

              {!hasDevice ? (

                <div className="
                  flex
                  items-center
                  gap-3
                  theme-text
                ">

                  <div className="
                    w-10
                    h-10
                    rounded-xl
                    bg-accent-soft
                    border
                    border-accent
                    text-accent
                    flex
                    items-center
                    justify-center
                  ">
                    <Smartphone size={20} />
                  </div>

                  <div>

                    <p className="
                      font-bold
                      theme-text
                    ">
                      Aucun appareil associé
                    </p>

                    <p className="
                      text-sm
                      theme-text-secondary
                      mt-1
                    ">
                      Ce compte n'a actuellement aucun téléphone enregistré.
                    </p>

                  </div>

                </div>

              ) : (

                <div className="
                  grid
                  sm:grid-cols-2
                  lg:grid-cols-3
                  gap-4
                ">

                  {[
                    {
                      label: "Appareil",
                      value: deviceName
                    },
                    {
                      label: "Fabricant",
                      value: deviceManufacturer
                    },
                    {
                      label: "Modèle",
                      value: deviceModel
                    },
                    {
                      label: "Plateforme",
                      value: devicePlatform
                    },
                    {
                      label: "Version système",
                      value: deviceOS
                    },
                    {
                      label: "Dernière activité",
                      value: deviceLastSeen
                    }
                  ].map(item => (

                    <div
                      key={item.label}
                      className="
                        rounded-2xl
                        bg-accent-soft
                        border
                        border-accent
                        p-4
                      "
                    >

                      <p className="
                        text-xs
                        uppercase
                        tracking-wide
                        font-bold
                        text-accent
                      ">
                        {item.label}
                      </p>

                      <p className="
                        font-bold
                        theme-text
                        mt-1
                        break-words
                      ">
                        {item.value}
                      </p>

                    </div>

                  ))}

                </div>

              )}

            </div>


            {deviceMessage && (

              <div
                className={`
                  rounded-xl
                  border
                  p-4
                  ${
                    deviceMessageType === "success"
                      ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300"
                      : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300"
                  }
                `}
              >

                <p className="
                  text-sm
                  font-semibold
                  break-words
                ">
                  {deviceMessage}
                </p>

              </div>

            )}

          </div>

        </section>


        {/* =================================================
            ACTION ADMINISTRATIVE
        ================================================= */}

        <section className="
          theme-surface
          border
          border-red-200
          dark:border-red-800
          rounded-3xl
          shadow-sm
          p-6
        ">

          <div className="
            flex
            flex-col
            lg:flex-row
            lg:items-center
            lg:justify-between
            gap-5
          ">

            <div className="
              flex
              items-start
              gap-4
            ">

              <div className="
                w-12
                h-12
                rounded-2xl
                bg-red-50
                dark:bg-red-950/30
                border
                border-red-200
                dark:border-red-800
                text-red-600
                dark:text-red-300
                flex
                items-center
                justify-center
                shrink-0
              ">
                <RefreshCw size={23} />
              </div>

              <div>

                <div className="
                  inline-flex
                  items-center
                  gap-2
                  px-3
                  py-1.5
                  rounded-full
                  bg-red-50
                  dark:bg-red-950/30
                  border
                  border-red-200
                  dark:border-red-800
                  text-red-700
                  dark:text-red-300
                  text-xs
                  font-semibold
                  mb-2
                ">
                  <RefreshCw size={13} />
                  Action irréversible
                </div>

                <h2 className="
                  text-xl
                  font-bold
                  theme-text
                ">
                  Réinitialisation de la progression
                </h2>

                <p className="
                  text-sm
                  theme-text-secondary
                  mt-1
                  max-w-2xl
                ">
                  Remettre la progression pédagogique de cet élève à zéro.
                  Cette action supprime son XP, son niveau, ses leçons terminées,
                  ses tentatives de quiz et ses badges.
                </p>

              </div>

            </div>

            <button
              type="button"
              onClick={
                handleResetProgress
              }
              disabled={progressResetLoading}
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                px-5
                py-3
                rounded-xl
                bg-red-600
                text-white
                font-semibold
                shadow-md
                hover:bg-red-700
                hover:-translate-y-0.5
                transition
                disabled:opacity-50
                disabled:cursor-not-allowed
                whitespace-nowrap
              "
            >

              <RefreshCw
                size={18}
                className={
                  progressResetLoading
                    ? "animate-spin"
                    : ""
                }
              />

              {progressResetLoading
                ? "Réinitialisation..."
                : "Réinitialiser la progression"
              }

            </button>

          </div>


          {progressResetMessage && (

            <div
              className={`
                mt-5
                rounded-xl
                border
                p-4
                ${
                  progressResetMessageType === "success"
                    ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300"
                    : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300"
                }
              `}
            >

              <p className="
                text-sm
                font-semibold
              ">
                {progressResetMessage}
              </p>

            </div>

          )}

        </section>


      </div>

    </div>

  );

}