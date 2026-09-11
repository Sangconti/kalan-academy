// src/pages/HomePage.jsx

import { useEffect, useState } from "react";
import {
  useLocation,
  useNavigate,
  useParams
} from "react-router-dom";

import { getClasses } from "../services/educationService";

import {
  GraduationCap,
  ArrowRight,
  BookOpen
} from "lucide-react";

export default function HomePage() {

  const navigate = useNavigate();
  const location = useLocation();
  const { studentId } = useParams();

  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);


  // =====================================================
  // MODE CONSULTATION
  // =====================================================

  const isConsultation =
    location.pathname.includes("/admin/student/") &&
    location.pathname.includes("/consultation") &&
    Boolean(studentId);


  // =====================================================
  // NAVIGATION VERS UNE CLASSE
  // =====================================================

  function openClass(classId) {

    if (isConsultation) {

      navigate(
        `/admin/student/${studentId}/consultation/class/${classId}`
      );

      return;
    }

    navigate(`/class/${classId}`);
  }


  // =====================================================
  // CHARGEMENT DES CLASSES
  // =====================================================

  useEffect(() => {

    let mounted = true;

    async function loadClasses() {

      try {

        const data = await getClasses();

        if (!mounted) return;

        setClasses(
          Array.isArray(data)
            ? data
            : []
        );

      } catch (error) {

        console.error(
          "Erreur classes :",
          error
        );

        if (!mounted) return;

        setClasses([]);

      } finally {

        if (mounted) {
          setLoading(false);
        }

      }

    }

    loadClasses();

    return () => {
      mounted = false;
    };

  }, []);


  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {

    return (

      <div
        className="
          min-h-[60vh]
          flex
          items-center
          justify-center
        "
      >

        <div className="text-center">

          <div
            className="
              w-12
              h-12
              mx-auto
              mb-4
              rounded-full
              border-4
              border-accent-soft
              border-t-accent
              animate-spin
            "
          />

          <p
            className="
              theme-text-secondary
              font-medium
            "
          >
            Chargement...
          </p>

        </div>

      </div>

    );

  }


  // =====================================================
  // PAGE
  // =====================================================

  return (

    <div
      className="
        pb-10
      "
    >

      {/* =================================================
          HERO
      ================================================= */}

      <section
        className="
          relative
          overflow-hidden
          rounded-3xl
          bg-accent-soft
          border
          border-accent-soft
          px-6
          py-8
          md:px-8
          md:py-10
          mb-8
        "
      >

        {/* Décoration */}

        <div
          className="
            absolute
            -right-12
            -top-12
            w-36
            h-36
            rounded-full
            bg-accent
            opacity-10
          "
        />

        <div
          className="
            absolute
            -left-10
            -bottom-16
            w-32
            h-32
            rounded-full
            bg-accent
            opacity-10
          "
        />


        <div
          className="
            relative
            z-10
          "
        >

          {/* BIENVENUE */}

          <p
            className="
              text-sm
              md:text-base
              font-semibold
              mb-2
              text-accent
            "
          >
            Bienvenue sur
          </p>


          {/* NOM */}

          <h1
            className="
              text-3xl
              md:text-4xl
              font-extrabold
              tracking-tight
              text-accent
            "
          >
            Kalan Academy
          </h1>


          {/* SLOGAN */}

          <h2
            className="
              text-xl
              md:text-2xl
              font-bold
              mt-2
              text-accent
            "
          >
            Apprends. Progresse. Réussis.
          </h2>


          {/* DESCRIPTION */}

          <p
            className="
              theme-text-secondary
              mt-3
              max-w-2xl
              leading-relaxed
            "
          >
            Choisis ta classe et commence à apprendre
            les matières de ton programme scolaire.
          </p>

        </div>

      </section>


      {/* =================================================
          TITRE DES CLASSES
      ================================================= */}

      <div
        className="
          flex
          items-center
          justify-between
          mb-5
        "
      >

        <div>

          <h2
            className="
              text-xl
              md:text-2xl
              font-bold
              theme-text
            "
          >
            Choisis ta classe
          </h2>

          <p
            className="
              text-sm
              theme-text-secondary
              mt-1
            "
          >
            Sélectionne ton niveau pour continuer.
          </p>

        </div>


        <div
          className="
            hidden
            sm:flex
            w-11
            h-11
            rounded-xl
            bg-accent-soft
            items-center
            justify-center
          "
        >

          <BookOpen
            size={21}
            className="text-accent"
          />

        </div>

      </div>


      {/* =================================================
          CLASSES
      ================================================= */}

      {classes.length === 0 ? (

        <div
          className="
            theme-surface
            rounded-3xl
            border
            theme-border
            shadow-sm
            p-8
            text-center
          "
        >

          <GraduationCap
            size={42}
            className="
              mx-auto
              text-gray-300
              dark:text-gray-600
              mb-4
            "
          />

          <p
            className="
              theme-text-secondary
            "
          >
            Aucune classe disponible.
          </p>

        </div>

      ) : (

        <div
          className="
            grid
            grid-cols-1
            sm:grid-cols-2
            lg:grid-cols-3
            gap-4
          "
        >

          {classes.map((classe) => (

            <button
              key={classe.id}
              onClick={() => openClass(classe.id)}
              className="
                group
                relative
                overflow-hidden

                theme-surface

                rounded-3xl

                border
                theme-border

                p-5
                md:p-6

                text-left

                shadow-sm

                hover:shadow-xl
                hover:-translate-y-1

                transition-all

                hover:border-accent
              "
            >

              {/* BARRE ACCENT */}

              <div
                className="
                  absolute
                  left-0
                  top-0
                  right-0
                  h-1.5
                  bg-accent
                "
              />


              <div
                className="
                  flex
                  items-start
                  justify-between
                  gap-4
                "
              >

                {/* ICÔNE */}

                <div
                  className="
                    w-14
                    h-14
                    rounded-2xl
                    flex
                    items-center
                    justify-center
                    bg-accent-soft
                    text-accent
                  "
                >

                  <GraduationCap size={28} />

                </div>


                {/* FLÈCHE */}

                <ArrowRight
                  size={21}
                  className="
                    text-gray-300
                    dark:text-gray-600
                    group-hover:text-accent
                    group-hover:translate-x-1
                    transition
                  "
                />

              </div>


              {/* NOM CLASSE */}

              <h3
                className="
                  mt-5
                  text-xl
                  font-bold
                  theme-text
                "
              >
                {classe.name}
              </h3>


              {/* DESCRIPTION */}

              {classe.description && (

                <p
                  className="
                    text-sm
                    theme-text-secondary
                    mt-2
                    line-clamp-2
                  "
                >
                  {classe.description}
                </p>

              )}


              {/* COMMENCER */}

              <div
                className="
                  mt-5
                  text-sm
                  font-semibold
                  text-accent
                "
              >
                Commencer →
              </div>

            </button>

          ))}

        </div>

      )}

    </div>

  );

}