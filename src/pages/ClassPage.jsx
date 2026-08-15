// src/pages/ClassPage.jsx

import {
  useEffect,
  useState
} from "react";

import {
  useParams,
  useNavigate
} from "react-router-dom";

import {
  getSubjects
} from "../services/educationService";

import {
  ArrowLeft,
  ArrowRight,
  BookOpen
} from "lucide-react";


export default function ClassPage() {

  const { classId } = useParams();

  const navigate = useNavigate();

  const [subjects, setSubjects] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // =====================================================
  // CHARGEMENT DES MATIÈRES
  // =====================================================

  useEffect(() => {

    let cancelled = false;


    async function loadSubjects() {

      try {

        setLoading(true);
        setError("");


        if (!classId) {

          throw new Error(
            "Classe introuvable"
          );

        }


        const data =
          await getSubjects(classId);


        // Sécurité :
        // uniquement les matières de cette classe

        const filtered =
          (data || []).filter(
            subject =>
              String(subject.class_id) ===
              String(classId)
          );


        if (!cancelled) {

          setSubjects(filtered);

        }

      } catch (err) {

        console.error(
          "Erreur chargement matières :",
          err
        );


        if (!cancelled) {

          setError(
            err.message ||
            "Impossible de charger les matières"
          );

        }

      } finally {

        if (!cancelled) {

          setLoading(false);

        }

      }

    }


    loadSubjects();


    return () => {

      cancelled = true;

    };

  }, [classId]);


  // =====================================================
  // ICÔNE MATIÈRE
  // =====================================================

  function getSubjectIcon(subjectName) {

    const name =
      String(
        subjectName || ""
      ).toLowerCase();


    if (name.includes("math")) {

      return "📐";

    }


    if (
      name.includes("physique") ||
      name.includes("chimie")
    ) {

      return "⚗️";

    }


    if (
      name.includes("biologie") ||
      name.includes("bio")
    ) {

      return "🧬";

    }


    return "📚";

  }


  // =====================================================
  // OUVRIR MATIÈRE
  // =====================================================

  function openSubject(subject) {

    if (!subject?.id) {

      console.error(
        "Subject invalide :",
        subject
      );

      return;

    }


    console.log(
      "========== OPEN SUBJECT =========="
    );

    console.log(
      "CLASS ID :",
      classId
    );

    console.log(
      "SUBJECT ID :",
      subject.id
    );

    console.log(
      "SUBJECT NAME :",
      subject.name
    );

    console.log(
      "SUBJECT CLASS ID :",
      subject.class_id
    );

    console.log(
      "=================================="
    );


    navigate(
      `/subject/${subject.id}`,
      {
        state: {
          class_id: classId,
          subject_id: subject.id
        }
      }
    );

  }


  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {

    return (

      <div className="
        min-h-[60vh]
        flex
        items-center
        justify-center
      ">

        <div className="text-center">

          <div className="
            w-12
            h-12
            mx-auto
            mb-4
            rounded-full
            border-4
            border-accent-soft
            border-t-accent
            animate-spin
          " />

          <p className="
            theme-text-secondary
            font-medium
          ">
            Chargement des matières...
          </p>

        </div>

      </div>

    );

  }


  // =====================================================
  // ERROR
  // =====================================================

  if (error) {

    return (

      <div className="
        p-4
        md:p-6
      ">

        <button
          onClick={() =>
            navigate("/")
          }
          className="
            inline-flex
            items-center
            gap-2
            mb-5
            px-4
            py-2.5
            rounded-xl
            theme-surface
            border
            theme-border
            shadow-sm
            theme-text-secondary
            hover:text-accent
            transition
          "
        >

          <ArrowLeft size={18} />

          Retour à l'accueil

        </button>


        <div className="
          theme-surface
          rounded-3xl
          border
          border-red-200
          dark:border-red-900
          shadow-sm
          p-6
          md:p-8
          text-center
        ">

          <div className="
            w-14
            h-14
            mx-auto
            mb-4
            rounded-2xl
            bg-red-50
            dark:bg-red-950/40
            flex
            items-center
            justify-center
            text-2xl
          ">
            ⚠️
          </div>


          <h2 className="
            font-bold
            text-red-700
            dark:text-red-300
          ">
            Impossible de charger les matières
          </h2>


          <p className="
            text-sm
            text-red-600
            dark:text-red-400
            mt-2
          ">
            {error}
          </p>


          <button
            onClick={() =>
              window.location.reload()
            }
            className="
              mt-5
              px-5
              py-3
              rounded-xl
              bg-accent
              text-white
              font-semibold
              shadow-sm
              hover:opacity-90
              active:scale-[0.98]
              transition
            "
          >
            Réessayer
          </button>

        </div>

      </div>

    );

  }


  // =====================================================
  // AFFICHAGE
  // =====================================================

  return (

    <div className="
      pb-10
    ">


      {/* =================================================
          RETOUR
      ================================================= */}

      <button
        onClick={() =>
          navigate("/")
        }
        className="
          inline-flex
          items-center
          gap-2
          mb-6
          px-4
          py-2.5
          rounded-xl
          theme-surface
          border
          theme-border
          shadow-sm
          theme-text-secondary
          hover:text-accent
          transition
        "
      >

        <ArrowLeft size={18} />

        Retour à l'accueil

      </button>


      {/* =================================================
          EN-TÊTE
      ================================================= */}

      <section className="
        relative
        overflow-hidden
        rounded-3xl
        bg-accent-soft
        border
        border-accent-soft
        px-6
        py-7
        md:px-8
        md:py-8
        mb-8
      ">


        {/* DÉCORATION */}

        <div className="
          absolute
          -right-10
          -top-10
          w-32
          h-32
          rounded-full
          bg-accent
          opacity-10
        " />


        <div className="
          absolute
          -left-8
          -bottom-12
          w-28
          h-28
          rounded-full
          bg-accent
          opacity-10
        " />


        <div className="
          relative
          z-10
        ">

          <div className="
            inline-flex
            items-center
            gap-2
            text-sm
            font-semibold
            text-accent
            mb-2
          ">

            <BookOpen size={17} />

            Kalan Academy

          </div>


          <h1 className="
            text-3xl
            md:text-4xl
            font-extrabold
            tracking-tight
            theme-text
          ">
            Matières
          </h1>


          <p className="
            theme-text-secondary
            mt-2
            max-w-2xl
            leading-relaxed
          ">
            Choisis une matière pour commencer
            ton apprentissage.
          </p>

        </div>

      </section>


      {/* =================================================
          LISTE DES MATIÈRES
      ================================================= */}

      {subjects.length === 0 ? (

        <div className="
          theme-surface
          rounded-3xl
          border
          theme-border
          shadow-sm
          p-8
          text-center
        ">

          <div className="
            w-16
            h-16
            mx-auto
            mb-4
            rounded-2xl
            bg-accent-soft
            flex
            items-center
            justify-center
            text-3xl
          ">
            📚
          </div>


          <h2 className="
            font-bold
            text-lg
            theme-text
          ">
            Aucune matière disponible
          </h2>


          <p className="
            text-sm
            theme-text-secondary
            mt-2
          ">
            Aucune matière n'est disponible
            pour cette classe.
          </p>

        </div>

      ) : (

        <div className="
          grid
          grid-cols-1
          sm:grid-cols-2
          lg:grid-cols-3
          gap-4
        ">

          {subjects.map(
            (subject, index) => {

              const icon =
                getSubjectIcon(
                  subject.name
                );


              return (

                <button
                  key={subject.id}
                  onClick={() =>
                    openSubject(subject)
                  }
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

                  <div className="
                    absolute
                    left-0
                    top-0
                    right-0
                    h-1.5
                    bg-accent
                  " />


                  <div className="
                    flex
                    items-start
                    justify-between
                    gap-4
                  ">


                    {/* ICÔNE */}

                    <div className="
                      w-14
                      h-14
                      rounded-2xl
                      bg-accent-soft
                      flex
                      items-center
                      justify-center
                      text-3xl
                      shrink-0
                    ">
                      {icon}
                    </div>


                    {/* FLÈCHE */}

                    <div className="
                      w-10
                      h-10
                      rounded-full
                      theme-bg
                      flex
                      items-center
                      justify-center
                      theme-text-secondary
                      group-hover:bg-accent-soft
                      group-hover:text-accent
                      transition
                    ">

                      <ArrowRight
                        size={19}
                        className="
                          group-hover:translate-x-0.5
                          transition
                        "
                      />

                    </div>

                  </div>


                  {/* NUMÉRO */}

                  <div className="
                    mt-5
                    text-xs
                    font-bold
                    text-accent
                  ">
                    MATIÈRE {index + 1}
                  </div>


                  {/* NOM */}

                  <h2 className="
                    mt-1
                    text-xl
                    font-bold
                    theme-text
                    truncate
                  ">
                    {subject.name}
                  </h2>


                  {/* DESCRIPTION */}

                  {subject.description ? (

                    <p className="
                      text-sm
                      theme-text-secondary
                      mt-2
                      line-clamp-2
                      leading-relaxed
                    ">
                      {subject.description}
                    </p>

                  ) : (

                    <p className="
                      text-sm
                      theme-text-secondary
                      mt-2
                      line-clamp-2
                      leading-relaxed
                    ">
                      Découvre les chapitres
                      de cette matière.
                    </p>

                  )}


                  {/* ACTION */}

                  <div className="
                    mt-5
                    flex
                    items-center
                    gap-1.5
                    text-sm
                    font-semibold
                    text-accent
                  ">

                    Commencer

                    <ArrowRight
                      size={16}
                      className="
                        group-hover:translate-x-1
                        transition
                      "
                    />

                  </div>


                </button>

              );

            }
          )}

        </div>

      )}

    </div>

  );

}