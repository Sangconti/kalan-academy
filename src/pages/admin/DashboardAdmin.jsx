import { useEffect, useState } from "react";

import StatCard from "../../components/admin/StatCard";

import {
  getAdminStats
} from "../../services/adminService";


export default function DashboardAdmin() {

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


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


  useEffect(() => {

    loadStats();

  }, []);


  return (

    <>

      <div className="
        flex
        flex-col
        md:flex-row
        md:items-center
        md:justify-between
        gap-4
        mb-8
      ">

        <div>

          <h1 className="
            text-3xl
            font-bold
          ">
            Dashboard Kalan Academy
          </h1>

          <p className="
            text-gray-500
            mt-1
          ">
            Vue générale de la plateforme
          </p>

        </div>


        <button
          onClick={loadStats}
          disabled={loading}
          className="
            px-4
            py-2
            rounded-lg
            bg-slate-900
            text-white
            hover:bg-slate-700
            disabled:opacity-50
            disabled:cursor-not-allowed
            transition
          "
        >

          {loading
            ? "Actualisation..."
            : "Actualiser"
          }

        </button>

      </div>


      {error && (

        <div className="
          mb-6
          bg-red-50
          border
          border-red-200
          text-red-700
          rounded-xl
          p-4
        ">

          <p className="font-semibold">
            Erreur
          </p>

          <p className="text-sm mt-1">
            {error}
          </p>

        </div>

      )}


      <div className="
        grid
        grid-cols-1
        md:grid-cols-2
        xl:grid-cols-4
        gap-6
      ">


        <StatCard
          title="Élèves"
          value={loading ? "..." : stats?.students ?? 0}
          icon="👨‍🎓"
          description="Comptes étudiants actifs"
        />


        <StatCard
          title="Premium"
          value={loading ? "..." : stats?.premium ?? 0}
          icon="⭐"
          description="Abonnements premium"
        />


        <StatCard
          title="Cours"
          value={loading ? "..." : stats?.lessons ?? 0}
          icon="📚"
          description="Leçons disponibles"
        />


        <StatCard
          title="Quiz"
          value={loading ? "..." : stats?.quizzes ?? 0}
          icon="📝"
          description="Évaluations"
        />


        <StatCard
          title="XP distribuée"
          value={loading ? "..." : stats?.totalXP ?? 0}
          icon="🏆"
          description="Expérience totale"
        />


        <StatCard
          title="Classes"
          value={loading ? "..." : stats?.classes ?? 0}
          icon="🏫"
          description="Niveaux scolaires"
        />


        <StatCard
          title="Matières"
          value={loading ? "..." : stats?.subjects ?? 0}
          icon="📖"
          description="Programmes"
        />

      </div>


      <div className="
        mt-10
        bg-white
        rounded-2xl
        shadow
        p-6
      ">


        <div className="
          flex
          items-center
          justify-between
          mb-4
        ">

          <h2 className="
            text-xl
            font-bold
          ">
            État de la plateforme
          </h2>

          <span className="
            px-3
            py-1
            rounded-full
            text-sm
            bg-green-100
            text-green-700
          ">
            Système opérationnel
          </span>

        </div>


        <div className="
          grid
          grid-cols-1
          md:grid-cols-2
          lg:grid-cols-4
          gap-4
        ">


          <div className="
            border
            rounded-xl
            p-4
          ">

            <p className="
              text-sm
              text-gray-500
            ">
              Contenu pédagogique
            </p>

            <p className="
              text-lg
              font-semibold
              mt-1
            ">

              {loading
                ? "..."
                : `${stats?.lessons ?? 0} leçons`
              }

            </p>

          </div>


          <div className="
            border
            rounded-xl
            p-4
          ">

            <p className="
              text-sm
              text-gray-500
            ">
              Évaluations
            </p>

            <p className="
              text-lg
              font-semibold
              mt-1
            ">

              {loading
                ? "..."
                : `${stats?.quizzes ?? 0} quiz`
              }

            </p>

          </div>


          <div className="
            border
            rounded-xl
            p-4
          ">

            <p className="
              text-sm
              text-gray-500
            ">
              Utilisateurs premium
            </p>

            <p className="
              text-lg
              font-semibold
              mt-1
            ">

              {loading
                ? "..."
                : `${stats?.premium ?? 0} abonnés`
              }

            </p>

          </div>


          <div className="
            border
            rounded-xl
            p-4
          ">

            <p className="
              text-sm
              text-gray-500
            ">
              XP distribuée
            </p>

            <p className="
              text-lg
              font-semibold
              mt-1
            ">

              {loading
                ? "..."
                : `${stats?.totalXP ?? 0} XP`
              }

            </p>

          </div>


        </div>

      </div>


      <div className="
        mt-6
        bg-white
        rounded-2xl
        shadow
        p-6
      ">


        <h2 className="
          text-xl
          font-bold
          mb-4
        ">
          Activité récente
        </h2>


        <p className="text-gray-500">

          Le journal d'activité pourra être connecté
          à une table d'administration dédiée.

        </p>


      </div>


    </>

  );

}