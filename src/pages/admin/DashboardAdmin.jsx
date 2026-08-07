import { useEffect, useState } from "react";

import StatCard from "../../components/admin/StatCard";

import {
  getAdminStats
} from "../../services/adminService";


export default function DashboardAdmin() {

  const [stats, setStats] = useState(null);


  useEffect(() => {

    getAdminStats()
      .then(setStats);

  }, []);



  return (

    <>

      <h1 className="
        text-3xl
        font-bold
        mb-8
      ">
        Dashboard Kalan Academy
      </h1>



      <div className="
        grid
        grid-cols-1
        md:grid-cols-2
        xl:grid-cols-4
        gap-6
      ">


        <StatCard
          title="Élèves"
          value={stats?.students}
          icon="👨‍🎓"
          description="Comptes étudiants actifs"
        />


        <StatCard
          title="Premium"
          value={stats?.premium}
          icon="⭐"
          description="Abonnements premium"
        />


        <StatCard
          title="Cours"
          value={stats?.lessons}
          icon="📚"
          description="Leçons disponibles"
        />


        <StatCard
          title="Quiz"
          value={stats?.quizzes}
          icon="📝"
          description="Évaluations"
        />


        <StatCard
          title="XP distribuée"
          value={stats?.totalXP}
          icon="🏆"
          description="Expérience totale"
        />


        <StatCard
          title="Classes"
          value={stats?.classes}
          icon="🏫"
          description="Niveaux scolaires"
        />


        <StatCard
          title="Matières"
          value={stats?.subjects}
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


        <h2 className="
          text-xl
          font-bold
          mb-4
        ">
          Activité récente
        </h2>


        <p className="text-gray-500">
          Le journal d'activité sera connecté dans la prochaine étape.
        </p>


      </div>


    </>

  );

}