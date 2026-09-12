import { useEffect, useState } from "react";

import StatCard from "../../components/admin/StatCard";

import {
  getAdminStats
} from "../../services/adminService";

import {
  generateUserDeviceRecoveryCode
} from "../../services/deviceService";

import { supabase } from "../../lib/supabase";


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

      const {
        data,
        error: studentsError
      } = await supabase
        .from("profiles")
        .select(
          "id, full_name, role"
        )
        .eq(
          "role",
          "student"
        )
        .order(
          "full_name",
          {
            ascending: true
          }
        );


      if (studentsError) {

        console.error(
          "❌ [ADMIN] Erreur chargement élèves =",
          studentsError
        );

        throw studentsError;
      }


      console.log(
        "👨‍🎓 [ADMIN] Élèves récupérés =",
        data
      );


      setStudents(
        data || []
      );


      // ======================================
      // SI L'ÉLÈVE SÉLECTIONNÉ N'EXISTE PLUS
      // ======================================

      if (
        selectedStudentId &&
        !(data || []).some(
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


    // ========================================
    // EFFACER L'ANCIEN CODE
    // ========================================

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
          EN-TÊTE DU DASHBOARD
      ========================================== */}

      <div
        className="
          flex
          flex-col
          md:flex-row
          md:items-center
          md:justify-between

          gap-4

          mb-8

          min-w-0
        "
      >

        {/* TITRE */}

        <div className="min-w-0">

          <h1
            className="
              text-2xl
              sm:text-3xl
              font-bold
              theme-text
              break-words
            "
          >
            Dashboard Kalan Academy
          </h1>


          <p
            className="
              theme-text-secondary
              mt-1
              text-sm
              sm:text-base
            "
          >
            Vue générale de la plateforme
          </p>

        </div>


        {/* ACTUALISER */}

        <button
          type="button"
          onClick={() => {
            loadStats();
            loadStudents();
          }}
          disabled={
            loading ||
            studentsLoading
          }
          className="
            w-full
            md:w-auto

            px-4
            py-2

            rounded-lg

            bg-slate-900
            text-white

            hover:bg-slate-700

            disabled:opacity-50
            disabled:cursor-not-allowed

            transition

            whitespace-nowrap
          "
        >

          {loading || studentsLoading
            ? "Actualisation..."
            : "Actualiser"
          }

        </button>

      </div>


      {/* ==========================================
          ERREUR
      ========================================== */}

      {error && (

        <div
          className="
            mb-6

            bg-red-50
            dark:bg-red-950/40

            border
            border-red-200
            dark:border-red-900

            text-red-700
            dark:text-red-300

            rounded-xl

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
          mb-8

          bg-orange-50
          dark:bg-orange-950/40

          border
          border-orange-200
          dark:border-orange-900

          rounded-2xl

          p-5

          w-full
          min-w-0
        "
      >

        {/* ========================================
            TITRE
        ======================================== */}

        <div className="mb-5">

          <h2
            className="
              text-lg
              font-bold
              theme-text
            "
          >
            🔐 Récupération d'un appareil
          </h2>


          <p
            className="
              text-sm
              theme-text-secondary
              mt-1
              leading-relaxed
            "
          >
            Génère un code de récupération pour
            transférer le compte d'un élève vers
            un nouveau téléphone.
          </p>

        </div>


        {/* ========================================
            SÉLECTION DE L'ÉLÈVE
        ======================================== */}

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

                focus:border-orange-500
                focus:ring-4
                focus:ring-orange-100
                dark:focus:ring-orange-950/40

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


          {/* ======================================
              BOUTON GÉNÉRER
          ====================================== */}

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

              px-5
              py-3

              rounded-xl

              bg-orange-500
              text-white

              font-semibold

              hover:bg-orange-600

              active:bg-orange-700

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


        {/* ========================================
            CODE GÉNÉRÉ
        ======================================== */}

        {recoveryCode && (

          <div
            className="
              mt-5

              theme-surface

              border
              border-orange-200
              dark:border-orange-900

              rounded-xl

              p-4
            "
          >

            {/* UTILISATEUR */}

            <div className="mb-4">

              <p
                className="
                  text-sm
                  font-semibold
                  theme-text
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

                  bg-gray-50
                  dark:bg-gray-800

                  border
                  theme-border

                  text-center

                  font-mono
                  font-bold

                  tracking-widest

                  text-lg

                  theme-text

                  select-all

                  min-w-0
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

                  bg-gray-900
                  text-white

                  font-semibold

                  hover:bg-gray-700

                  transition

                  whitespace-nowrap
                "
              >
                📋 Copier
              </button>

            </div>


            {/* AVERTISSEMENT */}

            <p
              className="
                text-xs
                text-orange-700
                dark:text-orange-300
                mt-3
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

        )}

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

          rounded-2xl

          shadow

          p-4
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

            mb-4

            min-w-0
          "
        >

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


          <span
            className="
              inline-flex
              items-center
              justify-center

              w-fit

              px-3
              py-1

              rounded-full

              text-sm

              bg-green-100
              dark:bg-green-950/40

              text-green-700
              dark:text-green-300

              whitespace-nowrap
            "
          >
            Système opérationnel
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
              rounded-xl
              p-4
              min-w-0
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
              rounded-xl
              p-4
              min-w-0
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
              rounded-xl
              p-4
              min-w-0
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
              rounded-xl
              p-4
              min-w-0
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

          rounded-2xl

          shadow

          p-4
          sm:p-6

          w-full
          min-w-0
        "
      >

        <h2
          className="
            text-lg
            sm:text-xl

            font-bold

            mb-4

            theme-text
          "
        >
          Activité récente
        </h2>


        <p
          className="
            theme-text-secondary

            text-sm
            sm:text-base

            break-words
          "
        >
          Le journal d'activité pourra être connecté
          à une table d'administration dédiée.
        </p>

      </div>


    </div>

  );

}