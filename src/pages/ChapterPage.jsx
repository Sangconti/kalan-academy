// src/pages/ChapterPage.jsx

import {
  useEffect,
  useState
} from "react";

import {
  useNavigate,
  useParams
} from "react-router-dom";

import {
  getLessons,
  getChapter
} from "../services/educationService";

import {
  cacheLessons,
  getCachedLessons,
  getCachedChapter
} from "../offline/db";

import {
  useNetwork
} from "../hooks/useNetwork";

import {
  PlayCircle,
  Clock,
  BookOpen,
  ChevronRight,
  ArrowLeft
} from "lucide-react";


export default function ChapterPage() {

  const { chapterId } = useParams();

  const navigate = useNavigate();

  const { isOnline } = useNetwork();


  const [chapter, setChapter] =
    useState(null);

  const [lessons, setLessons] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(null);


  // =====================================================
  // CHARGEMENT
  // =====================================================

  useEffect(() => {

    let cancelled = false;


    async function loadLessons() {

      try {

        setLoading(true);
        setError(null);


        let chapterData = null;
        let lessonsData = [];


        // =================================================
        // ONLINE
        // =================================================

        if (isOnline) {

          try {

            chapterData =
              await getChapter(
                chapterId
              );


            lessonsData =
              await getLessons(
                chapterId
              );


            if (lessonsData?.length) {

              await cacheLessons(
                lessonsData
              );

            }

          } catch (onlineError) {

            console.warn(
              "⚠️ Erreur réseau, utilisation du cache :",
              onlineError
            );


            chapterData =
              await getCachedChapter(
                chapterId
              );


            lessonsData =
              await getCachedLessons(
                chapterId
              );

          }

        }


        // =================================================
        // OFFLINE
        // =================================================

        else {

          console.log(
            "📴 CHAPTER PAGE OFFLINE"
          );


          chapterData =
            await getCachedChapter(
              chapterId
            );


          lessonsData =
            await getCachedLessons(
              chapterId
            );

        }


        if (cancelled) return;


        setChapter(
          chapterData || null
        );


        setLessons(
          lessonsData || []
        );


      } catch (err) {

        console.error(
          "❌ Erreur ChapterPage :",
          err
        );


        if (!cancelled) {

          setError(
            err.message ||
            "Impossible de charger le chapitre"
          );

        }

      } finally {

        if (!cancelled) {

          setLoading(false);

        }

      }

    }


    if (chapterId) {

      loadLessons();

    }


    return () => {

      cancelled = true;

    };

  }, [chapterId, isOnline]);


  // =====================================================
  // RETOUR
  // =====================================================

  function goBack() {

    /*
      Si chapter.class_id existe,
      on retourne directement à la classe.

      Sinon, on utilise l'historique du navigateur.
    */

    if (chapter?.class_id) {

      navigate(
        `/class/${chapter.class_id}`
      );

      return;

    }


    navigate(-1);

  }


  // =====================================================
  // OUVRIR UNE LEÇON
  // =====================================================

  function openLesson(lesson) {

    if (!lesson?.id) {

      console.error(
        "❌ Leçon invalide :",
        lesson
      );

      return;

    }


    navigate(
      `/lesson/${lesson.id}`
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


          <p className="text-gray-500">
            Chargement des leçons...
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
          onClick={goBack}
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

          Retour

        </button>


        <div className="
          bg-red-50
          border
          border-red-200
          rounded-2xl
          p-6
          text-center
        ">

          <p className="
            text-red-600
            font-medium
            mb-4
          ">
            {error}
          </p>


          <button
            onClick={() =>
              window.location.reload()
            }
            className="
              px-5
              py-2.5
              bg-blue-600
              text-white
              rounded-xl
              font-medium
              hover:bg-blue-700
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
        onClick={goBack}
        className="
          flex
          items-center
          gap-2
          text-gray-600
          hover:text-blue-600
          mb-5
          transition
          font-medium
        "
      >

        <ArrowLeft size={19} />

        Retour aux chapitres

      </button>


      {/* =================================================
          EN-TÊTE DU CHAPITRE
      ================================================= */}

      <div className="
        bg-white
        rounded-3xl
        shadow-sm
        border
        border-gray-100
        p-5
        md:p-7
        mb-6
      ">

        <div className="
          flex
          items-start
          gap-4
        ">


          <div className="
            w-14
            h-14
            md:w-16
            md:h-16
            shrink-0
            rounded-2xl
            bg-blue-100
            flex
            items-center
            justify-center
          ">

            <BookOpen
              size={30}
              className="text-blue-600"
            />

          </div>


          <div className="min-w-0">

            <p className="
              text-sm
              font-medium
              text-blue-600
              mb-1
            ">
              Chapitre
            </p>


            <h1 className="
              text-2xl
              md:text-3xl
              font-bold
              text-gray-900
              leading-tight
            ">
              {chapter?.title}
            </h1>


            {chapter?.description && (

              <p className="
                mt-2
                text-gray-500
                leading-relaxed
              ">
                {chapter.description}
              </p>

            )}

          </div>

        </div>

      </div>


      {/* =================================================
          TITRE LEÇONS
      ================================================= */}

      <div className="
        mb-5
        px-1
      ">

        <div className="
          flex
          items-center
          gap-3
          mb-1
        ">

          <div className="
            w-10
            h-10
            rounded-xl
            bg-green-100
            flex
            items-center
            justify-center
          ">

            <BookOpen
              size={21}
              className="text-green-600"
            />

          </div>


          <h2 className="
            text-xl
            md:text-2xl
            font-bold
            text-gray-900
          ">
            Leçons
          </h2>

        </div>


        <p className="
          text-gray-500
          ml-[52px]
        ">
          Choisis une leçon pour apprendre.
        </p>

      </div>


      {/* =================================================
          AUCUNE LEÇON
      ================================================= */}

      {lessons.length === 0 ? (

        <div className="
          bg-white
          rounded-2xl
          border
          border-gray-100
          shadow-sm
          p-8
          text-center
        ">

          <BookOpen
            size={42}
            className="
              mx-auto
              mb-3
              text-gray-300
            "
          />


          <p className="text-gray-500">
            Aucune leçon disponible.
          </p>

        </div>

      ) : (

        /* =================================================
           LISTE DES LEÇONS
        ================================================= */

        <div className="
          grid
          grid-cols-1
          sm:grid-cols-2
          lg:grid-cols-3
          gap-4
        ">

          {lessons.map(
            (lesson, index) => {

              const backgrounds = [

                "bg-blue-50 border-blue-100",

                "bg-green-50 border-green-100",

                "bg-purple-50 border-purple-100"

              ];


              const iconBackgrounds = [

                "bg-blue-100",

                "bg-green-100",

                "bg-purple-100"

              ];


              const iconColors = [

                "text-blue-600",

                "text-green-600",

                "text-purple-600"

              ];


              const position =
                index % 3;


              return (

                <button
                  key={lesson.id}
                  onClick={() =>
                    openLesson(lesson)
                  }
                  className={`
                    group
                    w-full
                    text-left
                    rounded-2xl
                    border
                    ${backgrounds[position]}
                    p-5
                    shadow-sm
                    hover:shadow-lg
                    hover:-translate-y-1
                    transition-all
                    duration-200
                    focus:outline-none
                    focus:ring-2
                    focus:ring-blue-400
                  `}
                >

                  {/* ICÔNE + FLÈCHE */}

                  <div className="
                    flex
                    items-center
                    justify-between
                    mb-4
                  ">

                    <div className={`
                      w-12
                      h-12
                      rounded-xl
                      ${iconBackgrounds[position]}
                      flex
                      items-center
                      justify-center
                    `}>

                      <PlayCircle
                        size={27}
                        className={
                          iconColors[position]
                        }
                      />

                    </div>


                    <ChevronRight
                      size={22}
                      className="
                        text-gray-400
                        group-hover:text-gray-700
                        group-hover:translate-x-1
                        transition
                      "
                    />

                  </div>


                  {/* TITRE */}

                  <h3 className="
                    font-bold
                    text-gray-900
                    text-lg
                    leading-snug
                    mb-4
                  ">
                    {lesson.title}
                  </h3>


                  {/* INFORMATIONS */}

                  <div className="
                    flex
                    flex-wrap
                    gap-3
                    text-sm
                    text-gray-600
                  ">

                    <span className="
                      flex
                      items-center
                      gap-1.5
                    ">

                      <Clock size={15} />

                      {lesson.duration_minutes || 0}
                      {" "}min

                    </span>


                    <span className="
                      flex
                      items-center
                      gap-1.5
                    ">

                      <BookOpen size={15} />

                      Leçon {index + 1}

                    </span>

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