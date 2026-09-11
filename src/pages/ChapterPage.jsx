// src/pages/ChapterPage.jsx

import {
  useEffect,
  useState
} from "react";

import {
  useNavigate,
  useParams,
  useLocation
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

  const {
    chapterId,
    studentId
  } = useParams();

  const navigate = useNavigate();

  const location = useLocation();

  const { isOnline } = useNetwork();


  // =====================================================
  // MODE CONSULTATION ADMIN
  // =====================================================

  const isConsultation =
    location.pathname.includes("/admin/student/") &&
    location.pathname.includes("/consultation") &&
    Boolean(studentId);


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

  }, [
    chapterId,
    isOnline
  ]);


  // =====================================================
  // RETOUR
  // =====================================================

  function goBack() {

    // ---------------------------------------------------
    // MODE CONSULTATION
    // ---------------------------------------------------

    if (isConsultation) {

      if (chapter?.subject_id) {

        navigate(
          `/admin/student/${studentId}/consultation/subject/${chapter.subject_id}`,
          {
            state: {
              subject_id: chapter.subject_id,
              class_id: chapter.class_id,
              chapter_id: chapterId,
              consultationMode: true
            }
          }
        );

        return;

      }


      navigate(-1);

      return;

    }


    // ---------------------------------------------------
    // MODE ÉLÈVE NORMAL
    // ---------------------------------------------------

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


    // ---------------------------------------------------
    // MODE CONSULTATION
    // ---------------------------------------------------

    if (isConsultation) {

      console.log(
        "👁️ [CONSULTATION] Ouverture leçon :",
        lesson.id
      );


      navigate(
        `/admin/student/${studentId}/consultation/lesson/${lesson.id}`,
        {
          state: {
            chapter_id: chapterId,
            subject_id: chapter?.subject_id,
            class_id: chapter?.class_id,
            consultationMode: true
          }
        }
      );

      return;

    }


    // ---------------------------------------------------
    // MODE ÉLÈVE NORMAL
    // ---------------------------------------------------

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

        <div className="
          text-center
        ">

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

      <div className="
        p-4
        md:p-6
      ">

        <button
          onClick={goBack}
          className="
            flex
            items-center
            gap-2
            theme-text-secondary
            hover:text-accent
            mb-5
            transition
          "
        >

          <ArrowLeft
            size={18}
          />

          Retour

        </button>


        <div className="
          bg-red-50
          dark:bg-red-950/40
          border
          border-red-200
          dark:border-red-900
          rounded-3xl
          p-6
          text-center
        ">

          <p className="
            text-red-600
            dark:text-red-400
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
              bg-red-600
              text-white
              rounded-xl
              font-medium
              hover:bg-red-700
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
      theme-bg
      px-4
      py-5
      pb-24
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
          theme-text-secondary
          hover:text-accent
          mb-5
          transition
          font-medium
        "
      >

        <div className="
          w-9
          h-9
          rounded-full
          theme-surface
          border
          theme-border
          shadow-sm
          flex
          items-center
          justify-center
        ">

          <ArrowLeft
            size={18}
          />

        </div>


        Retour aux chapitres

      </button>


      {/* =================================================
          EN-TÊTE DU CHAPITRE
      ================================================= */}

      <div className="
        relative
        overflow-hidden
        theme-surface
        rounded-3xl
        shadow-sm
        border
        theme-border
        p-6
        md:p-7
        mb-7
      ">


        {/* CERCLES DÉCORATIFS */}

        <div className="
          absolute
          -right-12
          -top-12
          w-36
          h-36
          rounded-full
          bg-accent
          opacity-10
        " />


        <div className="
          absolute
          -left-10
          -bottom-14
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
            flex
            items-start
            gap-4
          ">


            {/* ICÔNE */}

            <div className="
              w-14
              h-14
              md:w-16
              md:h-16
              shrink-0
              rounded-2xl
              bg-accent-soft
              flex
              items-center
              justify-center
            ">

              <BookOpen
                size={30}
                className="text-accent"
              />

            </div>


            {/* TITRE */}

            <div className="
              min-w-0
            ">

              <p className="
                text-sm
                font-medium
                text-accent
                mb-1
              ">

                Chapitre

              </p>


              <h1 className="
                text-2xl
                md:text-3xl
                font-bold
                theme-text
                leading-tight
              ">

                {chapter?.title}

              </h1>


              {chapter?.description && (

                <p className="
                  mt-2
                  theme-text-secondary
                  leading-relaxed
                ">

                  {chapter.description}

                </p>

              )}

            </div>

          </div>


          {/* INFORMATIONS */}

          <div className="
            mt-6
            pt-4
            border-t
            theme-border
            flex
            items-center
            justify-between
          ">

            <div>

              <p className="
                text-xs
                theme-text-secondary
                font-medium
                uppercase
                tracking-wide
              ">

                Contenu

              </p>


              <p className="
                theme-text
                font-bold
                mt-1
              ">

                Leçons disponibles

              </p>

            </div>


            <div className="
              text-right
            ">

              <p className="
                text-xs
                theme-text-secondary
                font-medium
                uppercase
                tracking-wide
              ">

                Leçons

              </p>


              <p className="
                text-lg
                font-bold
                text-accent
                mt-1
              ">

                {lessons.length}

              </p>

            </div>

          </div>

        </div>

      </div>


      {/* =================================================
          TITRE LEÇONS
      ================================================= */}

      <div className="
        flex
        items-center
        justify-between
        mb-5
      ">

        <div className="
          flex
          items-center
          gap-3
        ">

          <div className="
            w-11
            h-11
            rounded-xl
            bg-accent-soft
            flex
            items-center
            justify-center
          ">

            <BookOpen
              size={21}
              className="text-accent"
            />

          </div>


          <div>

            <h2 className="
              text-xl
              md:text-2xl
              font-bold
              theme-text
            ">

              Leçons

            </h2>


            <p className="
              text-sm
              theme-text-secondary
              mt-1
            ">

              Choisis une leçon pour apprendre.

            </p>

          </div>

        </div>


        {lessons.length > 0 && (

          <span className="
            shrink-0
            ml-3
            px-3
            py-1.5
            rounded-full
            bg-accent-soft
            text-accent
            text-xs
            font-bold
          ">

            {lessons.length}

          </span>

        )}

      </div>


      {/* =================================================
          AUCUNE LEÇON
      ================================================= */}

      {lessons.length === 0 ? (

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
            w-14
            h-14
            mx-auto
            mb-4
            rounded-2xl
            bg-accent-soft
            flex
            items-center
            justify-center
          ">

            <BookOpen
              size={28}
              className="text-accent"
            />

          </div>


          <p className="
            theme-text-secondary
          ">

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
            (lesson, index) => (

              <button
                key={lesson.id}
                onClick={() =>
                  openLesson(lesson)
                }
                className="
                  group
                  relative
                  w-full
                  text-left
                  overflow-hidden
                  theme-surface
                  rounded-3xl
                  border
                  theme-border
                  p-5
                  shadow-sm
                  hover:shadow-lg
                  hover:-translate-y-1
                  hover:border-accent
                  transition-all
                  duration-200
                  focus:outline-none
                  focus:ring-2
                  focus:ring-accent
                "
              >


                {/* BARRE ACCENT */}

                <div className="
                  absolute
                  left-0
                  top-0
                  right-0
                  h-1
                  bg-accent
                " />


                {/* CERCLE DÉCORATIF */}

                <div className="
                  absolute
                  -right-8
                  -top-8
                  w-24
                  h-24
                  rounded-full
                  bg-accent
                  opacity-[0.06]
                  group-hover:opacity-10
                  transition
                " />


                {/* ICÔNE + FLÈCHE */}

                <div className="
                  relative
                  z-10
                  flex
                  items-center
                  justify-between
                  mb-5
                ">


                  <div className="
                    w-12
                    h-12
                    rounded-2xl
                    bg-accent-soft
                    flex
                    items-center
                    justify-center
                  ">

                    <PlayCircle
                      size={27}
                      className="text-accent"
                    />

                  </div>


                  <div className="
                    w-10
                    h-10
                    rounded-full
                    bg-accent-soft
                    text-accent
                    flex
                    items-center
                    justify-center
                    group-hover:bg-accent
                    group-hover:text-white
                    group-hover:translate-x-1
                    transition
                  ">

                    <ChevronRight
                      size={21}
                    />

                  </div>

                </div>


                {/* TITRE */}

                <h3 className="
                  relative
                  z-10
                  font-bold
                  theme-text
                  text-lg
                  leading-snug
                  mb-4
                ">

                  {lesson.title}

                </h3>


                {/* INFORMATIONS */}

                <div className="
                  relative
                  z-10
                  flex
                  flex-wrap
                  gap-3
                  text-sm
                  theme-text-secondary
                ">


                  <span className="
                    flex
                    items-center
                    gap-1.5
                  ">

                    <Clock
                      size={15}
                      className="text-accent"
                    />

                    {lesson.duration_minutes || 0}
                    {" "}min

                  </span>


                  <span className="
                    flex
                    items-center
                    gap-1.5
                  ">

                    <BookOpen
                      size={15}
                      className="text-accent"
                    />

                    Leçon {index + 1}

                  </span>

                </div>

              </button>

            )
          )}

        </div>

      )}

    </div>

  );

}