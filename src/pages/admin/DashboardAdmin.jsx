import { useEffect, useState } from "react";

import StatCard from "../../components/admin/StatCard";

import {
  getAdminStats
} from "../../services/adminService";


export default function DashboardAdmin() {

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  // ==========================================
  // CHARGER LES STATISTIQUES
  // ==========================================

  async function loadStats() {

    try {

      setLoading(true);
      setError(null);

      const data = await getAdminStats();

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
  // CHARGEMENT INITIAL
  // ==========================================

  useEffect(() => {

    loadStats();

  }, []);


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

        {/* ========================================
            TITRE
        ======================================== */}

        <div className="min-w-0">

          <h1
            className="
              text-2xl
              sm:text-3xl

              font-bold

              text-gray-900

              break-words
            "
          >
            Dashboard Kalan Academy
          </h1>

          <p
            className="
              text-gray-500
              mt-1

              text-sm
              sm:text-base
            "
          >
            Vue générale de la plateforme
          </p>

        </div>


        {/* ========================================
            BOUTON ACTUALISER
        ======================================== */}

        <button
          type="button"
          onClick={loadStats}
          disabled={loading}
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

          {loading
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
            border
            border-red-200

            text-red-700

            rounded-xl

            p-4

            w-full
            min-w-0
          "
        >

          <p className="font-semibold">
            Erreur
          </p>

          <p className="text-sm mt-1 break-words">
            {error}
          </p>

        </div>

      )}


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

          bg-white

          rounded-2xl

          shadow

          p-4
          sm:p-6

          w-full
          min-w-0
        "
      >

        {/* ========================================
            EN-TÊTE
        ======================================== */}

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

              text-gray-900
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
              text-green-700

              whitespace-nowrap
            "
          >
            Système opérationnel
          </span>

        </div>


        {/* ========================================
            INFORMATIONS PLATEFORME
        ======================================== */}

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

          {/* CONTENU PÉDAGOGIQUE */}

          <div
            className="
              border

              rounded-xl

              p-4

              min-w-0
            "
          >

            <p
              className="
                text-sm
                text-gray-500
              "
            >
              Contenu pédagogique
            </p>

            <p
              className="
                text-base
                sm:text-lg

                font-semibold

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

              rounded-xl

              p-4

              min-w-0
            "
          >

            <p
              className="
                text-sm
                text-gray-500
              "
            >
              Évaluations
            </p>

            <p
              className="
                text-base
                sm:text-lg

                font-semibold

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


          {/* UTILISATEURS PREMIUM */}

          <div
            className="
              border

              rounded-xl

              p-4

              min-w-0
            "
          >

            <p
              className="
                text-sm
                text-gray-500
              "
            >
              Utilisateurs premium
            </p>

            <p
              className="
                text-base
                sm:text-lg

                font-semibold

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

              rounded-xl

              p-4

              min-w-0
            "
          >

            <p
              className="
                text-sm
                text-gray-500
              "
            >
              XP distribuée
            </p>

            <p
              className="
                text-base
                sm:text-lg

                font-semibold

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

          bg-white

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

            text-gray-900
          "
        >
          Activité récente
        </h2>


        <p
          className="
            text-gray-500

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