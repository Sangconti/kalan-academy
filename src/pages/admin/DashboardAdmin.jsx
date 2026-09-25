import { useEffect, useState } from "react";

import StatCard from "../../components/admin/StatCard";

import {
  getAdminStats,
  getAdminUsers,
  getAdminActivityLogs
} from "../../services/adminService";

import {
  generateUserDeviceRecoveryCode
} from "../../services/deviceService";


export default function DashboardAdmin() {

  const [stats, setStats] = useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(null);

  // ==========================================
  // RÉCUPÉRATION APPAREIL
  // ==========================================

  const [students, setStudents] =
    useState([]);

  const [studentsLoading, setStudentsLoading] =
    useState(true);

  const [selectedStudentId, setSelectedStudentId] =
    useState("");

  const [recoveryCode, setRecoveryCode] =
    useState("");

  const [recoveryStudent, setRecoveryStudent] =
    useState(null);

  const [generatingRecoveryCode, setGeneratingRecoveryCode] =
    useState(false);


  // ==========================================
  // JOURNAL D'ACTIVITÉ
  // ==========================================

  const [activityLogs, setActivityLogs] =
    useState([]);

  const [activityLoading, setActivityLoading] =
    useState(true);

  const [activityError, setActivityError] =
    useState(null);

  const [activityRefreshing, setActivityRefreshing] =
    useState(false);


  // ==========================================
  // CHARGER LES STATISTIQUES
  // ==========================================

  async function loadStats() {

    try {

      setLoading(true);
      setError(null);

      const data =
        await getAdminStats();

      setStats(data);

    } catch (err) {

      console.error(
        "Erreur chargement statistiques admin :",
        err
      );

      setError(
        "Impossible de charger les statistiques."
      );

    } finally {

      setLoading(false);

    }

  }


  // ==========================================
  // CHARGER LES ÉLÈVES
  // ==========================================

  async function loadStudents() {

    console.log(
      "👨‍🎓 [ADMIN] Chargement des élèves..."
    );

    try {

      setStudentsLoading(true);

      const data =
        await getAdminUsers();

      console.log(
        "👨‍🎓 [ADMIN] Utilisateurs récupérés =",
        data
      );

      const studentList =
        (data || []).filter(
          (user) =>
            user?.role === "student"
        );

      console.log(
        "👨‍🎓 [ADMIN] Élèves récupérés =",
        studentList
      );

      setStudents(
        studentList
      );


      // ======================================
      // SI L'ÉLÈVE SÉLECTIONNÉ N'EXISTE PLUS
      // ======================================

      if (
        selectedStudentId &&
        !studentList.some(
          (student) =>
            student.id === selectedStudentId
        )
      ) {

        setSelectedStudentId("");
        setRecoveryCode("");
        setRecoveryStudent(null);

      }

    } catch (err) {

      console.error(
        "💥 [ADMIN] Exception chargement élèves =",
        err
      );

      setError(
        "Impossible de charger la liste des élèves."
      );

    } finally {

      setStudentsLoading(false);

    }

  }


  // ==========================================
  // CHARGER LE JOURNAL D'ACTIVITÉ
  // ==========================================

  async function loadActivityLogs(
    showRefreshState = false
  ) {

    console.log(
      "🕘 [ADMIN ACTIVITY] Chargement du journal..."
    );

    try {

      if (showRefreshState) {
        setActivityRefreshing(true);
      } else {
        setActivityLoading(true);
      }

      setActivityError(null);

      const data =
        await getAdminActivityLogs(10);

      console.log(
        "🕘 [ADMIN ACTIVITY] Activités récupérées =",
        data
      );

      setActivityLogs(
        data || []
      );

    } catch (err) {

      console.error(
        "❌ [ADMIN ACTIVITY] Erreur chargement journal =",
        err
      );

      setActivityError(
        "Impossible de charger le journal d'activité."
      );

    } finally {

      setActivityLoading(false);
      setActivityRefreshing(false);

    }

  }


  // ==========================================
  // LIBELLÉS DU JOURNAL
  // ==========================================

  function getActivityMeta(action) {

    const actions = {

      progress_reset: {
        icon: "🔄",
        label: "Progression réinitialisée"
      },

      device_recovery_code_generated: {
        icon: "🔑",
        label: "Code de récupération généré"
      },

      device_reset: {
        icon: "📱",
        label: "Appareil réinitialisé"
      },

      user_role_updated: {
        icon: "👤",
        label: "Rôle utilisateur modifié"
      },

      user_access_updated: {
        icon: "🔐",
        label: "Accès utilisateur modifié"
      },

      user_premium_updated: {
        icon: "⭐",
        label: "Statut Premium modifié"
      },

      user_class_updated: {
        icon: "🎓",
        label: "Classe utilisateur modifiée"
      },

      user_orange_money_updated: {
        icon: "💰",
        label: "Identifiant Orange Money modifié"
      },

      user_deleted: {
        icon: "🗑️",
        label: "Utilisateur supprimé"
      },

      class_created: {
        icon: "➕",
        label: "Classe créée"
      },

      class_updated: {
        icon: "✏️",
        label: "Classe modifiée"
      },

      class_deleted: {
        icon: "🗑️",
        label: "Classe supprimée"
      }

    };

    return (
      actions[action] || {
        icon: "📌",
        label: action || "Activité administrative"
      }
    );

  }


  // ==========================================
  // TEMPS RELATIF
  // ==========================================

  function formatRelativeTime(dateValue) {

    if (!dateValue) {
      return "";
    }

    const date =
      new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    const now =
      new Date();

    const difference =
      Math.max(
        0,
        now.getTime() - date.getTime()
      );

    const seconds =
      Math.floor(
        difference / 1000
      );

    if (seconds < 10) {
      return "À l'instant";
    }

    if (seconds < 60) {
      return `Il y a ${seconds} sec`;
    }

    const minutes =
      Math.floor(
        seconds / 60
      );

    if (minutes < 60) {
      return `Il y a ${minutes} min`;
    }

    const hours =
      Math.floor(
        minutes / 60
      );

    if (hours < 24) {
      return `Il y a ${hours} h`;
    }

    const days =
      Math.floor(
        hours / 24
      );

    if (days < 7) {
      return `Il y a ${days} j`;
    }

    return date.toLocaleDateString(
      "fr-FR",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      }
    );

  }


  // ==========================================
  // NOM DE LA CIBLE
  // ==========================================

  function getActivityTarget(activity) {

    const action =
      activity?.action;

    const details =
      activity?.details || {};

    const targetName =
      activity?.target_user?.full_name ||
      details?.full_name;

    // ----------------------------------------
    // UTILISATEUR / ÉLÈVE
    // ----------------------------------------

    if (targetName) {
      return targetName;
    }

    // ----------------------------------------
    // ACTION SUR UNE CLASSE
    // ----------------------------------------

    if (
      action === "class_created" ||
      action === "class_updated" ||
      action === "class_deleted"
    ) {

      if (details?.name) {
        return details.name;
      }

      return "une classe";
    }

    return null;

  }


  // ==========================================
  // GÉNÉRER LE CODE DE RÉCUPÉRATION
  // POUR L'ÉLÈVE SÉLECTIONNÉ
  // ==========================================

  async function handleGenerateRecoveryCode() {

    console.log(
      "🔐 [ADMIN] Demande de génération du code..."
    );


    // ========================================
    // VÉRIFIER LA SÉLECTION
    // ========================================

    if (!selectedStudentId) {

      setError(
        "Sélectionne d'abord un élève."
      );

      return;
    }


    const selectedStudent =
      students.find(
        (student) =>
          student.id === selectedStudentId
      );


    if (!selectedStudent) {

      setError(
        "L'élève sélectionné est introuvable."
      );

      return;
    }


    console.log(
      "👤 [ADMIN] Élève sélectionné =",
      selectedStudent
    );

    console.log(
      "🆔 [ADMIN] ID élève =",
      selectedStudent.id
    );


    setGeneratingRecoveryCode(true);

    setError(null);

    setRecoveryCode("");

    setRecoveryStudent(null);


    try {

      // ======================================
      // APPEL DE LA FONCTION ADMIN
      // ======================================

      const result =
        await generateUserDeviceRecoveryCode(
          selectedStudent.id
        );


      console.log(
        "📱 [ADMIN] Résultat génération code =",
        result
      );


      // ======================================
      // ERREUR
      // ======================================

      if (!result?.success) {

        let message =
          result?.message ||
          `Impossible de générer le code. Statut : ${
            result?.status ||
            "inconnu"
          }`;


        if (
          result?.status ===
          "not_authenticated"
        ) {

          message =
            "Ta session administrateur a expiré. Reconnecte-toi.";

        }


        if (
          result?.status ===
          "not_authorized"
        ) {

          message =
            "Tu n'es pas autorisé à générer un code de récupération.";

        }


        if (
          result?.status ===
          "user_not_found"
        ) {

          message =
            "Cet élève n'existe plus.";

        }


        setError(message);

        return;
      }


      // ======================================
      // CODE GÉNÉRÉ
      // ======================================

      if (
        result?.status ===
        "code_generated"
      ) {

        console.log(
          "✅ [ADMIN] CODE DE RÉCUPÉRATION =",
          result.code
        );


        setRecoveryCode(
          result.code
        );


        setRecoveryStudent(
          selectedStudent
        );

        // ------------------------------------
        // ACTUALISER LE JOURNAL
        // ------------------------------------

        await loadActivityLogs(true);

        return;
      }


      // ======================================
      // RÉPONSE INATTENDUE
      // ======================================

      setError(
        "Réponse inattendue du serveur."
      );


    } catch (err) {

      console.error(
        "💥 [ADMIN] Erreur génération code =",
        err
      );


      setError(
        err?.message ||
        "Impossible de générer le code de récupération."
      );


    } finally {

      setGeneratingRecoveryCode(false);


      console.log(
        "🏁 [ADMIN] Génération du code terminée."
      );

    }

  }


  // ==========================================
  // COPIER LE CODE
  // ==========================================

  async function handleCopyRecoveryCode() {

    if (!recoveryCode) {
      return;
    }


    try {

      await navigator.clipboard.writeText(
        recoveryCode
      );


      console.log(
        "📋 [ADMIN] Code copié"
      );


      setError(null);


    } catch (err) {

      console.error(
        "❌ [ADMIN] Impossible de copier le code =",
        err
      );


      setError(
        "Impossible de copier le code automatiquement."
      );

    }

  }


  // ==========================================
  // CHANGEMENT D'ÉLÈVE
  // ==========================================

  function handleStudentChange(event) {

    const userId =
      event.target.value;


    console.log(
      "👤 [ADMIN] Nouvel élève sélectionné =",
      userId
    );


    setSelectedStudentId(
      userId
    );


    setRecoveryCode("");

    setRecoveryStudent(null);

    setError(null);

  }


  // ==========================================
  // CHARGEMENT INITIAL
  // ==========================================

  useEffect(() => {

    loadStats();

    loadStudents();

    loadActivityLogs();

  }, []);


  // ==========================================
  // INTERFACE
  // ==========================================

  return (

    <div
      className="
        w-full
        max-w-full
        min-w-0
        overflow-x-hidden
      "
    >

      {/* ==========================================
          HERO DASHBOARD
      ========================================== */}

      <div
        className="
          relative
          overflow-hidden
          rounded-3xl
          bg-accent-soft
          border
          border-accent
          shadow-lg
          p-6
          md:p-8
          mb-8
        "
      >

        {/* CERCLES DÉCORATIFS */}

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

          <div
            className="
              flex
              flex-col
              lg:flex-row
              lg:items-end
              lg:justify-between
              gap-6
            "
          >

            {/* TITRE */}

            <div className="min-w-0">

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

                <span>
                  📊
                </span>

                Administration

              </div>


              <h1
                className="
                  text-2xl
                  md:text-3xl
                  font-bold
                  leading-tight
                  theme-text
                  break-words
                "
              >
                Dashboard Kalan Academy
              </h1>


              <p
                className="
                  theme-text-secondary
                  mt-3
                  leading-relaxed
                  max-w-2xl
                "
              >
                Vue générale de la plateforme,
                des élèves et du contenu pédagogique.
              </p>

            </div>


            {/* ACTUALISER */}

            <button
              type="button"
              onClick={() => {
                loadStats();
                loadStudents();
                loadActivityLogs(true);
              }}
              disabled={
                loading ||
                studentsLoading ||
                activityRefreshing
              }
              className="
                w-full
                lg:w-auto
                inline-flex
                items-center
                justify-center
                gap-2
                bg-accent
                text-white
                font-bold
                px-5
                py-3
                rounded-xl
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
                {loading ||
                studentsLoading ||
                activityRefreshing
                  ? "Actualisation..."
                  : "↻ Actualiser"
                }
              </span>

            </button>

          </div>


          {/* MÉTADONNÉES */}

          <div
            className="
              mt-6
              flex
              flex-wrap
              items-center
              gap-3
            "
          >

            <div
              className="
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
              "
            >

              👨‍🎓

              {loading
                ? "..."
                : `${stats?.students ?? 0} élèves`
              }

            </div>


            <div
              className="
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
              "
            >

              📚

              {loading
                ? "..."
                : `${stats?.lessons ?? 0} leçons`
              }

            </div>


            <div
              className="
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
              "
            >

              📝

              {loading
                ? "..."
                : `${stats?.quizzes ?? 0} quiz`
              }

            </div>

          </div>

        </div>

      </div>


      {/* ==========================================
          ERREUR
      ========================================== */}

      {error && (

        <div
          className="
            mb-8
            bg-red-50
            dark:bg-red-950/40
            border
            border-red-200
            dark:border-red-900
            text-red-700
            dark:text-red-300
            rounded-3xl
            p-4
            w-full
            min-w-0
          "
        >

          <p className="font-semibold">
            Erreur
          </p>


          <p
            className="
              text-sm
              mt-1
              break-words
            "
          >
            {error}
          </p>

        </div>

      )}


      {/* ==========================================
          RÉCUPÉRATION APPAREIL
      ========================================== */}

      <div
        className="
          relative
          overflow-hidden
          rounded-3xl
          bg-accent-soft
          border
          border-accent
          shadow-lg
          p-6
          md:p-8
          mb-8
        "
      >

        {/* CERCLES DÉCORATIFS */}

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

          {/* TITRE */}

          <div className="mb-6">

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
                mb-3
              "
            >

              🔐

              Sécurité

            </div>


            <h2
              className="
                text-xl
                md:text-2xl
                font-bold
                theme-text
              "
            >
              Récupération d'un appareil
            </h2>


            <p
              className="
                text-sm
                md:text-base
                theme-text-secondary
                mt-2
                leading-relaxed
                max-w-3xl
              "
            >
              Génère un code de récupération pour
              transférer le compte d'un élève vers
              un nouveau téléphone.
            </p>

          </div>


          {/* SÉLECTION */}

          <div
            className="
              flex
              flex-col
              lg:flex-row
              gap-4
              lg:items-end
            "
          >

            <div className="flex-1 min-w-0">

              <label
                htmlFor="recovery-student"
                className="
                  block
                  text-sm
                  font-semibold
                  theme-text
                  mb-2
                "
              >
                Élève concerné
              </label>


              <select
                id="recovery-student"
                value={selectedStudentId}
                onChange={
                  handleStudentChange
                }
                disabled={
                  studentsLoading ||
                  generatingRecoveryCode
                }
                className="
                  w-full
                  px-4
                  py-3
                  rounded-xl
                  border
                  theme-border
                  theme-surface
                  theme-text
                  outline-none
                  focus:border-accent
                  focus:ring-4
                  focus:ring-blue-100
                  dark:focus:ring-blue-950/40
                  disabled:bg-gray-100
                  dark:disabled:bg-gray-800
                  disabled:cursor-not-allowed
                  transition
                "
              >

                <option value="">
                  {studentsLoading
                    ? "Chargement des élèves..."
                    : students.length === 0
                      ? "Aucun élève disponible"
                      : "Sélectionner un élève"
                  }
                </option>


                {students.map(
                  (student) => (

                    <option
                      key={student.id}
                      value={student.id}
                    >
                      {student.full_name ||
                        "Élève sans nom"}
                    </option>

                  )
                )}

              </select>

            </div>


            {/* BOUTON GÉNÉRER */}

            <button
              type="button"
              onClick={
                handleGenerateRecoveryCode
              }
              disabled={
                studentsLoading ||
                generatingRecoveryCode ||
                !selectedStudentId
              }
              className="
                w-full
                lg:w-auto
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
                transition
                disabled:opacity-60
                disabled:cursor-not-allowed
                whitespace-nowrap
              "
            >

              {generatingRecoveryCode
                ? "Génération..."
                : "🔐 Générer le code"
              }

            </button>

          </div>


          {/* CODE GÉNÉRÉ */}

          {recoveryCode && (

            <div
              className="
                mt-6
                theme-surface
                border
                theme-border
                rounded-3xl
                p-5
                shadow-sm
              "
            >

              {/* UTILISATEUR */}

              <div className="mb-4">

                <p
                  className="
                    text-sm
                    font-semibold
                    theme-text-secondary
                  "
                >
                  Code généré pour :
                </p>


                <p
                  className="
                    text-base
                    font-bold
                    theme-text
                    mt-1
                  "
                >
                  👤{" "}
                  {recoveryStudent?.full_name ||
                    "Élève sélectionné"}
                </p>

              </div>


              {/* CODE + COPIER */}

              <div
                className="
                  flex
                  flex-col
                  sm:flex-row
                  gap-3
                  sm:items-center
                "
              >

                <div
                  className="
                    flex-1
                    px-4
                    py-3
                    rounded-xl
                    bg-accent-soft
                    border
                    border-accent
                    text-center
                    font-mono
                    font-bold
                    tracking-widest
                    text-lg
                    text-accent
                    select-all
                    min-w-0
                    overflow-x-auto
                  "
                >
                  {recoveryCode}
                </div>


                <button
                  type="button"
                  onClick={
                    handleCopyRecoveryCode
                  }
                  className="
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
                    whitespace-nowrap
                  "
                >
                  📋 Copier
                </button>

              </div>


              {/* AVERTISSEMENT */}

              <div
                className="
                  mt-4
                  px-4
                  py-3
                  rounded-xl
                  bg-orange-50
                  dark:bg-orange-950/30
                  border
                  border-orange-200
                  dark:border-orange-900
                "
              >

                <p
                  className="
                    text-xs
                    text-orange-700
                    dark:text-orange-300
                    leading-relaxed
                  "
                >
                  ⚠️ Ce code permet à l'élève de
                  récupérer son compte sur un nouveau
                  téléphone. Conserve-le dans un endroit
                  sûr et transmets-le uniquement à
                  l'élève concerné.
                </p>

              </div>

            </div>

          )}

        </div>

      </div>


      {/* ==========================================
          CARTES STATISTIQUES
      ========================================== */}

      <div
        className="
          grid
          grid-cols-1
          sm:grid-cols-2
          xl:grid-cols-4
          gap-4
          sm:gap-6
          w-full
          min-w-0
        "
      >

        <StatCard
          title="Élèves"
          value={
            loading
              ? "..."
              : stats?.students ?? 0
          }
          icon="👨‍🎓"
          description="Comptes étudiants actifs"
        />


        <StatCard
          title="Premium"
          value={
            loading
              ? "..."
              : stats?.premium ?? 0
          }
          icon="⭐"
          description="Abonnements premium"
        />


        <StatCard
          title="Cours"
          value={
            loading
              ? "..."
              : stats?.lessons ?? 0
          }
          icon="📚"
          description="Leçons disponibles"
        />


        <StatCard
          title="Quiz"
          value={
            loading
              ? "..."
              : stats?.quizzes ?? 0
          }
          icon="📝"
          description="Évaluations"
        />


        <StatCard
          title="XP distribuée"
          value={
            loading
              ? "..."
              : stats?.totalXP ?? 0
          }
          icon="🏆"
          description="Expérience totale"
        />


        <StatCard
          title="Classes"
          value={
            loading
              ? "..."
              : stats?.classes ?? 0
          }
          icon="🏫"
          description="Niveaux scolaires"
        />


        <StatCard
          title="Matières"
          value={
            loading
              ? "..."
              : stats?.subjects ?? 0
          }
          icon="📖"
          description="Programmes"
        />

      </div>


      {/* ==========================================
          ÉTAT DE LA PLATEFORME
      ========================================== */}

      <div
        className="
          mt-8
          sm:mt-10
          theme-surface
          theme-border
          border
          rounded-3xl
          shadow-sm
          p-5
          sm:p-6
          w-full
          min-w-0
        "
      >

        {/* EN-TÊTE */}

        <div
          className="
            flex
            flex-col
            sm:flex-row
            sm:items-center
            sm:justify-between
            gap-3
            mb-5
            min-w-0
          "
        >

          <div>

            <div
              className="
                inline-flex
                items-center
                gap-2
                px-3
                py-1.5
                rounded-full
                bg-accent-soft
                border
                border-accent
                text-accent
                text-xs
                font-semibold
                mb-2
              "
            >

              ⚙️

              Système

            </div>


            <h2
              className="
                text-lg
                sm:text-xl
                font-bold
                theme-text
              "
            >
              État de la plateforme
            </h2>

          </div>


          <span
            className="
              inline-flex
              items-center
              justify-center
              w-fit
              px-3
              py-1.5
              rounded-full
              text-sm
              font-semibold
              bg-green-100
              dark:bg-green-950/40
              text-green-700
              dark:text-green-300
              whitespace-nowrap
            "
          >
            ● Système opérationnel
          </span>

        </div>


        {/* INFORMATIONS */}

        <div
          className="
            grid
            grid-cols-1
            sm:grid-cols-2
            lg:grid-cols-4
            gap-4
            w-full
            min-w-0
          "
        >

          {/* CONTENU */}

          <div
            className="
              border
              theme-border
              rounded-2xl
              p-4
              min-w-0
              bg-accent-soft
            "
          >

            <p
              className="
                text-sm
                theme-text-secondary
              "
            >
              Contenu pédagogique
            </p>


            <p
              className="
                text-base
                sm:text-lg
                font-semibold
                theme-text
                mt-1
                break-words
              "
            >

              {loading
                ? "..."
                : `${stats?.lessons ?? 0} leçons`
              }

            </p>

          </div>


          {/* ÉVALUATIONS */}

          <div
            className="
              border
              theme-border
              rounded-2xl
              p-4
              min-w-0
              bg-accent-soft
            "
          >

            <p
              className="
                text-sm
                theme-text-secondary
              "
            >
              Évaluations
            </p>


            <p
              className="
                text-base
                sm:text-lg
                font-semibold
                theme-text
                mt-1
                break-words
              "
            >

              {loading
                ? "..."
                : `${stats?.quizzes ?? 0} quiz`
              }

            </p>

          </div>


          {/* PREMIUM */}

          <div
            className="
              border
              theme-border
              rounded-2xl
              p-4
              min-w-0
              bg-accent-soft
            "
          >

            <p
              className="
                text-sm
                theme-text-secondary
              "
            >
              Utilisateurs premium
            </p>


            <p
              className="
                text-base
                sm:text-lg
                font-semibold
                theme-text
                mt-1
                break-words
              "
            >

              {loading
                ? "..."
                : `${stats?.premium ?? 0} abonnés`
              }

            </p>

          </div>


          {/* XP */}

          <div
            className="
              border
              theme-border
              rounded-2xl
              p-4
              min-w-0
              bg-accent-soft
            "
          >

            <p
              className="
                text-sm
                theme-text-secondary
              "
            >
              XP distribuée
            </p>


            <p
              className="
                text-base
                sm:text-lg
                font-semibold
                theme-text
                mt-1
                break-words
              "
            >

              {loading
                ? "..."
                : `${stats?.totalXP ?? 0} XP`
              }

            </p>

          </div>

        </div>

      </div>


      {/* ==========================================
          ACTIVITÉ RÉCENTE
      ========================================== */}

      <div
        className="
          mt-6
          theme-surface
          theme-border
          border
          rounded-3xl
          shadow-sm
          p-5
          sm:p-6
          w-full
          min-w-0
        "
      >

        {/* EN-TÊTE DU JOURNAL */}

        <div
          className="
            flex
            flex-col
            sm:flex-row
            sm:items-start
            sm:justify-between
            gap-4
            mb-5
          "
        >

          <div>

            <div
              className="
                inline-flex
                items-center
                gap-2
                px-3
                py-1.5
                rounded-full
                bg-accent-soft
                border
                border-accent
                text-accent
                text-xs
                font-semibold
                mb-3
              "
            >

              🕘

              Journal

            </div>


            <h2
              className="
                text-lg
                sm:text-xl
                font-bold
                theme-text
              "
            >
              Activité récente
            </h2>


            <p
              className="
                theme-text-secondary
                text-sm
                mt-1
              "
            >
              Les dernières actions effectuées par les administrateurs.
            </p>

          </div>


          {/* ACTUALISER LE JOURNAL */}

          <button
            type="button"
            onClick={() =>
              loadActivityLogs(true)
            }
            disabled={
              activityLoading ||
              activityRefreshing
            }
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              px-4
              py-2.5
              rounded-xl
              border
              theme-border
              theme-surface
              theme-text
              font-semibold
              text-sm
              hover:bg-accent-soft
              transition
              disabled:opacity-50
              disabled:cursor-not-allowed
              whitespace-nowrap
              w-full
              sm:w-auto
            "
          >

            {activityRefreshing
              ? "Actualisation..."
              : "↻ Actualiser"
            }

          </button>

        </div>


        {/* ERREUR DU JOURNAL */}

        {activityError && (

          <div
            className="
              rounded-2xl
              border
              border-red-200
              dark:border-red-900
              bg-red-50
              dark:bg-red-950/30
              text-red-700
              dark:text-red-300
              p-4
            "
          >

            <p className="text-sm font-semibold">
              Journal indisponible
            </p>


            <p className="text-sm mt-1">
              {activityError}
            </p>

          </div>

        )}


        {/* CHARGEMENT */}

        {activityLoading && !activityError && (

          <div className="space-y-3">

            {Array.from(
              { length: 3 }
            ).map(
              (_, index) => (

                <div
                  key={index}
                  className="
                    flex
                    items-center
                    gap-4
                    p-4
                    rounded-2xl
                    border
                    theme-border
                    bg-accent-soft
                    animate-pulse
                  "
                >

                  <div
                    className="
                      w-11
                      h-11
                      rounded-xl
                      bg-gray-200
                      dark:bg-gray-700
                      shrink-0
                    "
                  />

                  <div
                    className="
                      flex-1
                      min-w-0
                      space-y-2
                    "
                  >

                    <div
                      className="
                        h-4
                        w-2/3
                        rounded
                        bg-gray-200
                        dark:bg-gray-700
                      "
                    />

                    <div
                      className="
                        h-3
                        w-1/2
                        rounded
                        bg-gray-200
                        dark:bg-gray-700
                      "
                    />

                  </div>

                </div>

              )
            )}

          </div>

        )}


        {/* AUCUNE ACTIVITÉ */}

        {!activityLoading &&
        !activityError &&
        activityLogs.length === 0 && (

          <div
            className="
              rounded-2xl
              border
              theme-border
              bg-accent-soft
              p-6
              text-center
            "
          >

            <div
              className="
                text-3xl
                mb-3
              "
            >
              🕘
            </div>


            <p
              className="
                font-semibold
                theme-text
              "
            >
              Aucune activité enregistrée
            </p>


            <p
              className="
                text-sm
                theme-text-secondary
                mt-1
              "
            >
              Les prochaines actions administratives apparaîtront ici.
            </p>

          </div>

        )}


        {/* LISTE DES ACTIVITÉS */}

        {!activityLoading &&
        !activityError &&
        activityLogs.length > 0 && (

          <div className="space-y-3">

            {activityLogs.map(
              (activity) => {

                const meta =
                  getActivityMeta(
                    activity?.action
                  );

                const target =
                  getActivityTarget(
                    activity
                  );

                const adminName =
                  activity?.admin?.full_name ||
                  "Administrateur";

                const details =
                  activity?.details || {};

                return (

                  <div
                    key={activity.id}
                    className="
                      flex
                      items-start
                      gap-3
                      sm:gap-4
                      p-4
                      rounded-2xl
                      border
                      theme-border
                      theme-surface
                      hover:bg-accent-soft
                      transition
                      min-w-0
                    "
                  >

                    {/* ICÔNE */}

                    <div
                      className="
                        w-11
                        h-11
                        rounded-xl
                        bg-accent-soft
                        border
                        border-accent
                        flex
                        items-center
                        justify-center
                        text-lg
                        shrink-0
                      "
                    >
                      {meta.icon}
                    </div>


                    {/* CONTENU */}

                    <div
                      className="
                        flex-1
                        min-w-0
                      "
                    >

                      <div
                        className="
                          flex
                          flex-col
                          sm:flex-row
                          sm:items-start
                          sm:justify-between
                          gap-1
                        "
                      >

                        <p
                          className="
                            font-semibold
                            theme-text
                            text-sm
                            sm:text-base
                            break-words
                          "
                        >
                          {meta.label}
                        </p>


                        <span
                          className="
                            text-xs
                            theme-text-secondary
                            whitespace-nowrap
                            shrink-0
                          "
                        >
                          {formatRelativeTime(
                            activity.created_at
                          )}
                        </span>

                      </div>


                      {/* ADMINISTRATEUR */}

                      <p
                        className="
                          text-xs
                          sm:text-sm
                          theme-text-secondary
                          mt-1
                          break-words
                        "
                      >
                        Par{" "}
                        <span
                          className="
                            font-medium
                            theme-text
                          "
                        >
                          {adminName}
                        </span>
                      </p>


                      {/* CIBLE */}

                      {target && (

                        <p
                          className="
                            text-xs
                            sm:text-sm
                            theme-text-secondary
                            mt-1
                            break-words
                          "
                        >
                          {(
                            activity?.action ===
                              "class_created" ||
                            activity?.action ===
                              "class_updated" ||
                            activity?.action ===
                              "class_deleted"
                          )
                            ? "Classe : "
                            : "Utilisateur : "
                          }

                          <span
                            className="
                              font-medium
                              theme-text
                            "
                          >
                            {target}
                          </span>

                        </p>

                      )}


                      {/* INFORMATIONS COMPLÉMENTAIRES */}

                      {activity?.action ===
                        "user_role_updated" &&
                        details?.new_role && (

                        <p
                          className="
                            text-xs
                            theme-text-secondary
                            mt-1
                          "
                        >
                          Nouveau rôle :{" "}
                          <span
                            className="
                              font-medium
                              theme-text
                            "
                          >
                            {details.new_role}
                          </span>
                        </p>

                      )}


                      {activity?.action ===
                        "user_access_updated" &&
                        details?.access_status && (

                        <p
                          className="
                            text-xs
                            theme-text-secondary
                            mt-1
                          "
                        >
                          Statut d'accès :{" "}
                          <span
                            className="
                              font-medium
                              theme-text
                            "
                          >
                            {details.access_status}
                          </span>
                        </p>

                      )}


                      {activity?.action ===
                        "user_premium_updated" &&
                        typeof details?.is_premium ===
                          "boolean" && (

                        <p
                          className="
                            text-xs
                            theme-text-secondary
                            mt-1
                          "
                        >
                          Premium :{" "}
                          <span
                            className="
                              font-medium
                              theme-text
                            "
                          >
                            {details.is_premium
                              ? "Activé"
                              : "Désactivé"
                            }
                          </span>
                        </p>

                      )}


                      {activity?.action ===
                        "progress_reset" &&
                        details?.progress_reset_version !==
                          null &&
                        details?.progress_reset_version !==
                          undefined && (

                        <p
                          className="
                            text-xs
                            theme-text-secondary
                            mt-1
                          "
                        >
                          Version de réinitialisation :{" "}
                          <span
                            className="
                              font-medium
                              theme-text
                            "
                          >
                            {details.progress_reset_version}
                          </span>
                        </p>

                      )}

                    </div>

                  </div>

                );

              }
            )}

          </div>

        )}

      </div>


    </div>

  );

}