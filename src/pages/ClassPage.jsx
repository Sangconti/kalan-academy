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
  ArrowLeft
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
            w-10
            h-10
            mx-auto
            mb-4
            border-4
            border-blue-200
            border-t-blue-600
            rounded-full
            animate-spin
          " />

          <p className="
            text-gray-600
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

      <div className="p-4 md:p-6">

        <button
          onClick={() => navigate("/")}
          className="
            flex
            items-center
            gap-2
            text-gray-600
            hover:text-blue-600
            mb-5
            transition
          "
        >

          <ArrowLeft size={18} />

          Retour à l'accueil

        </button>


        <div className="
          bg-red-50
          border
          border-red-200
          rounded-2xl
          p-6
          text-center
        ">

          <div className="text-4xl mb-3">
            ⚠️
          </div>


          <h2 className="
            font-bold
            text-red-800
          ">
            Impossible de charger les matières
          </h2>


          <p className="
            text-sm
            text-red-700
            mt-1
          ">
            {error}
          </p>


          <button
            onClick={() =>
              window.location.reload()
            }
            className="
              mt-4
              w-full
              py-3
              rounded-xl
              bg-red-600
              text-white
              font-semibold
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
      min-h-screen
      bg-gray-50
    ">


      {/* =================================================
          RETOUR
      ================================================= */}

      <button
        onClick={() => navigate("/")}
        className="
          flex
          items-center
          gap-2
          text-gray-600
          hover:text-blue-600
          mb-5
          transition
        "
      >

        <ArrowLeft size={19} />

        Retour à l'accueil

      </button>


      {/* =================================================
          EN-TÊTE
      ================================================= */}

      <div className="mb-7">

        <p className="
          text-sm
          font-medium
          text-blue-600
          mb-1
        ">
          Kalan Academy
        </p>


        <h1 className="
          text-3xl
          font-extrabold
          text-gray-900
        ">
          Matières
        </h1>


        <p className="
          text-gray-500
          mt-2
        ">
          Choisis une matière pour commencer
          ton apprentissage.
        </p>

      </div>


      {/* =================================================
          LISTE DES MATIÈRES
      ================================================= */}

      {subjects.length === 0 ? (

        <div className="
          bg-white
          rounded-2xl
          border
          border-gray-200
          p-6
          text-center
          shadow-sm
        ">

          <div className="text-4xl mb-3">
            📚
          </div>


          <h2 className="
            font-bold
            text-gray-800
          ">
            Aucune matière disponible
          </h2>


          <p className="
            text-sm
            text-gray-500
            mt-1
          ">
            Aucune matière n'est disponible
            pour cette classe.
          </p>

        </div>

      ) : (

        <div className="grid gap-4">

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
                    w-full
                    bg-white
                    rounded-2xl
                    border
                    border-gray-100
                    shadow-sm
                    p-5
                    text-left
                    transition-all
                    duration-200
                    hover:shadow-lg
                    hover:-translate-y-0.5
                    active:scale-[0.98]
                  "
                >

                  <div className="
                    flex
                    items-center
                    gap-4
                  ">


                    {/* ICÔNE */}

                    <div className="
                      w-16
                      h-16
                      shrink-0
                      rounded-2xl
                      bg-blue-50
                      flex
                      items-center
                      justify-center
                      text-3xl
                    ">
                      {icon}
                    </div>


                    {/* CONTENU */}

                    <div className="
                      flex-1
                      min-w-0
                    ">

                      <div className="
                        flex
                        items-center
                        gap-2
                        mb-1
                      ">

                        <span className="
                          text-xs
                          font-bold
                          text-blue-600
                        ">
                          MATIÈRE {index + 1}
                        </span>

                      </div>


                      <h2 className="
                        text-lg
                        font-bold
                        text-gray-900
                        truncate
                      ">
                        {subject.name}
                      </h2>


                      {subject.description ? (

                        <p className="
                          text-sm
                          text-gray-500
                          mt-1
                          line-clamp-2
                        ">
                          {subject.description}
                        </p>

                      ) : (

                        <p className="
                          text-sm
                          text-gray-400
                          mt-1
                        ">
                          Découvre les chapitres
                          de cette matière.
                        </p>

                      )}

                    </div>


                    {/* FLÈCHE */}

                    <div className="
                      w-10
                      h-10
                      shrink-0
                      rounded-full
                      bg-gray-50
                      flex
                      items-center
                      justify-center
                      text-gray-400
                      group-hover:bg-blue-50
                      group-hover:text-blue-600
                      transition
                    ">

                      <span className="text-xl">
                        →
                      </span>

                    </div>

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