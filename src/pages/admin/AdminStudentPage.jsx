//src/pages/admin/AdminStudentPage.jsx`

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
  RefreshCw,
  Star,
  Target,
  Trophy,
  TrendingUp,
  User
} from "lucide-react";

import {
  getAdminStudentView
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

      // Actualiser les données de l'élève
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
      ">

        <div className="
          w-14
          h-14
          rounded-2xl
          bg-accent-soft
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
          text-gray-700
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
        max-w-2xl
        mx-auto
        px-5
        py-10
      ">

        <div className="
          bg-white
          rounded-3xl
          border
          border-gray-200
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
            text-gray-900
          ">
            Impossible de charger l'élève
          </h2>

          <p className="
            text-sm
            text-gray-600
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
                bg-gray-100
                text-gray-700
                font-semibold
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
        p-8
        text-center
      ">
        Élève introuvable.
      </div>
    );

  }


  // ===================================================
  // DONNÉES
  // ===================================================

  const profile =
    data.profile;

  const stats =
    data.stats;

  const subjects =
    data.subjects || {};

  const badges =
    data.badges || [];


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


  const studentName =
    profile.full_name ||
    "Élève";


  // ===================================================
  // AFFICHAGE
  // ===================================================

  return (

    <div className="
      min-h-screen
      bg-white
      px-5
      py-6
      md:px-8
      md:py-8
    ">

      <div className="
        max-w-6xl
        mx-auto
        space-y-6
      ">


        {/* =================================================
            BARRE MODE CONSULTATION
        ================================================= */}

        <div className="
          flex
          flex-col
          sm:flex-row
          sm:items-center
          sm:justify-between
          gap-3
          bg-purple-50
          border
          border-purple-200
          rounded-2xl
          px-4
          py-3
        ">

          <div className="
            flex
            items-center
            gap-3
          ">

            <div className="
              w-10
              h-10
              rounded-xl
              bg-purple-100
              text-purple-700
              flex
              items-center
              justify-center
            ">
              👁️
            </div>

            <div>

              <p className="
                text-xs
                font-bold
                uppercase
                tracking-wide
                text-purple-600
              ">
                Mode consultation
              </p>

              <p className="
                font-semibold
                text-purple-900
              ">
                Vous consultez la page de {studentName}
              </p>

            </div>

          </div>

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
              py-2.5
              rounded-xl
              bg-white
              border
              border-purple-200
              text-purple-700
              font-semibold
              hover:bg-purple-100
              transition
            "
          >
            <ArrowLeft size={17} />
            Retour aux utilisateurs
          </button>

        </div>


        {/* =================================================
            HEADER
        ================================================= */}

        <div className="
          flex
          flex-col
          sm:flex-row
          sm:items-center
          sm:justify-between
          gap-4
        ">

          <div>

            <p className="
              text-sm
              font-bold
              text-accent
            ">
              Kalan Academy
            </p>

            <h1 className="
              text-2xl
              md:text-3xl
              font-extrabold
              text-gray-950
              mt-1
            ">
              Bonjour {studentName} 👋
            </h1>

            <p className="
              text-gray-600
              mt-1
            ">
              Voici la progression et les résultats de cet élève.
            </p>

          </div>

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
              bg-white
              border
              border-gray-200
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
            GESTION DE L'APPAREIL
        ================================================= */}

        <section
          className="
            bg-white
            rounded-3xl
            border
            border-orange-200
            shadow-sm
            p-6
          "
        >

          <div className="
            flex
            flex-col
            lg:flex-row
            lg:items-center
            lg:justify-between
            gap-5
          ">

            {/* INFORMATIONS */}

            <div className="
              flex
              items-start
              gap-4
            ">

              <div className="
                w-12
                h-12
                rounded-2xl
                bg-orange-50
                text-orange-600
                flex
                items-center
                justify-center
                shrink-0
              ">
                📱
              </div>

              <div>

                <h2 className="
                  text-xl
                  font-bold
                  text-gray-950
                ">
                  Gestion de l'appareil
                </h2>

                <p className="
                  text-sm
                  text-gray-600
                  mt-1
                  max-w-2xl
                ">
                  Gérez la récupération du compte de cet élève
                  lorsqu'il change de téléphone.
                </p>

              </div>

            </div>


            {/* ACTIONS */}

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

                  bg-orange-500
                  text-white

                  font-semibold

                  hover:bg-orange-600

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

                  bg-gray-100
                  text-gray-800

                  border
                  border-gray-200

                  font-semibold

                  hover:bg-gray-200

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


          {/* MESSAGE */}

          {deviceMessage && (

            <div
              className={`
                mt-5
                rounded-xl
                border
                p-4

                ${
                  deviceMessageType === "success"
                    ? "bg-green-50 border-green-200 text-green-800"
                    : "bg-red-50 border-red-200 text-red-800"
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

        </section>


        {/* =================================================
            PROFIL RAPIDE
        ================================================= */}

        <div className="
          bg-white
          rounded-3xl
          border
          border-gray-200
          shadow-sm
          p-6
        ">

          <div className="
            flex
            flex-col
            sm:flex-row
            sm:items-center
            gap-5
          ">

            <div className="
              w-20
              h-20
              rounded-2xl
              bg-gray-100
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
                  className="text-gray-400"
                />

              )}

            </div>

            <div className="flex-1">

              <h2 className="
                text-xl
                font-bold
                text-gray-950
              ">
                {studentName}
              </h2>

              <p className="
                text-sm
                text-gray-500
                mt-1
              ">
                Élève Kalan Academy
              </p>

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
                bg-blue-50
                text-blue-700
                text-sm
                font-semibold
              ">
                {profile.is_premium
                  ? "⭐ Premium"
                  : "Compte gratuit"}
              </span>

              <span className="
                px-3
                py-2
                rounded-xl
                bg-green-50
                text-green-700
                text-sm
                font-semibold
              ">
                {profile.access_status}
              </span>

            </div>

          </div>

        </div>


        {/* =================================================
            XP
        ================================================= */}

        <div className="
          relative
          overflow-hidden
          rounded-3xl
          bg-accent-soft
          border
          border-accent
          p-6
          md:p-8
          shadow-xl
        ">

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
              ">
                <Star size={25} />
              </div>

              <div>

                <p className="
                  text-accent
                  text-sm
                  font-medium
                ">
                  Niveau de l'élève
                </p>

                <h2 className="
                  text-2xl
                  md:text-3xl
                  font-extrabold
                  text-gray-950
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
                  text-gray-950
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
                  text-gray-950
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
                text-gray-700
                mb-2
              ">

                <span className="font-medium">
                  Progression vers le niveau {level + 1}
                </span>

                <span className="font-bold">
                  {xpInCurrentLevel} / {XP_PER_LEVEL} XP
                </span>

              </div>

              <div className="
                h-3
                bg-white/70
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
                text-gray-600
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

        </div>


        {/* =================================================
            STATISTIQUES
        ================================================= */}

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
              value: stats.lessons
            },
            {
              icon: Star,
              label: "Score moyen",
              value: `${stats.score}%`
            },
            {
              icon: Award,
              label: "Badges",
              value: stats.badges
            },
            {
              icon: Target,
              label: "Quiz réalisés",
              value: stats.attempts
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
                  bg-white
                  rounded-2xl
                  border
                  border-gray-200
                  shadow-sm
                  p-5
                "
              >

                <div className="
                  w-10
                  h-10
                  rounded-xl
                  bg-accent-soft
                  text-accent
                  flex
                  items-center
                  justify-center
                  mb-4
                ">
                  <Icon size={21} />
                </div>

                <p className="
                  text-sm
                  text-gray-600
                ">
                  {label}
                </p>

                <p className="
                  text-2xl
                  font-extrabold
                  text-gray-950
                  mt-1
                ">
                  {value}
                </p>

              </div>

            )
          )}

        </div>


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
                text-gray-950
              ">
                Progression par matière
              </h2>

              <p className="
                text-sm
                text-gray-600
                mt-1
              ">
                Avancement de l'élève dans chaque matière.
              </p>

            </div>

          </div>


          {Object.keys(subjects).length === 0 ? (

            <div className="
              bg-white
              rounded-2xl
              border
              border-gray-200
              shadow-sm
              p-8
              text-center
            ">

              <BookOpen
                size={36}
                className="
                  mx-auto
                  text-gray-300
                  mb-3
                "
              />

              <h3 className="
                font-bold
                text-gray-800
              ">
                Pas encore de progression
              </h3>

              <p className="
                text-sm
                text-gray-600
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
                ([name, subject]) => (

                  <div
                    key={name}
                    className="
                      bg-white
                      rounded-2xl
                      border
                      border-gray-200
                      shadow-sm
                      p-5
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
                        text-gray-950
                        truncate
                      ">
                        {name}
                      </h3>

                      <span className="
                        text-sm
                        font-bold
                        text-accent
                      ">
                        {subject.percent}%
                      </span>

                    </div>

                    <div className="
                      h-3
                      bg-gray-100
                      rounded-full
                      overflow-hidden
                      mt-4
                    ">

                      <div
                        className="
                          h-full
                          bg-accent
                          rounded-full
                        "
                        style={{
                          width: `${subject.percent}%`
                        }}
                      />

                    </div>

                    <p className="
                      text-xs
                      text-gray-600
                      mt-2
                    ">
                      {subject.completed} leçon
                      {subject.completed > 1 ? "s" : ""}
                      {" "}terminée
                      {subject.completed > 1 ? "s" : ""}
                      {" "}sur{" "}
                      {subject.total}
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
                text-gray-950
              ">
                Badges de l'élève
              </h2>

              <p className="
                text-sm
                text-gray-600
              ">
                Les récompenses obtenues.
              </p>

            </div>

          </div>


          {badges.length === 0 ? (

            <div className="
              bg-white
              rounded-2xl
              border
              border-gray-200
              shadow-sm
              p-8
              text-center
            ">

              <div className="text-4xl mb-3">
                🏆
              </div>

              <h3 className="
                font-bold
                text-gray-800
              ">
                Aucun badge pour le moment
              </h3>

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
                      bg-white
                      rounded-2xl
                      border
                      border-gray-200
                      shadow-sm
                      p-5
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
                          text-gray-950
                        ">
                          {badge?.name || "Badge"}
                        </h3>

                        <p className="
                          text-sm
                          text-gray-600
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

      </div>

    </div>

  );

}