// src/pages/LessonPage.jsx

import {
  useEffect,
  useState
} from "react";

import {
  useParams,
  useNavigate
} from "react-router-dom";

import {
  getLesson,
  getLessonBlocks
} from "../services/educationService";

import {
  cacheLesson,
  getCachedLesson,
  cacheLessonBlocks,
  getCachedLessonBlocks
} from "../offline/db";

import {
  useNetwork
} from "../hooks/useNetwork";

import {
  ArrowLeft,
  PlayCircle,
  BookOpen,
  Clock,
  CheckCircle2,
  Trophy
} from "lucide-react";


export default function LessonPage() {

  const { lessonId } = useParams();

  const navigate =
    useNavigate();

  const { isOnline } =
    useNetwork();


  // =====================================================
  // 🔒 PROTECTION DU CONTENU PÉDAGOGIQUE
  // =====================================================

  useEffect(() => {

    const preventContextMenu = (event) => {
      event.preventDefault();
    };

    const preventCopy = (event) => {
      event.preventDefault();
    };

    const preventCut = (event) => {
      event.preventDefault();
    };

    const preventDrag = (event) => {
      event.preventDefault();
    };

    const preventKeyboardCopy = (event) => {

      const key =
        event.key?.toLowerCase();

      const isCopyShortcut =
        (event.ctrlKey || event.metaKey) &&
        ["c", "x", "a", "s", "u"].includes(key);

      if (isCopyShortcut) {
        event.preventDefault();
      }

    };


    document.addEventListener(
      "contextmenu",
      preventContextMenu
    );

    document.addEventListener(
      "copy",
      preventCopy
    );

    document.addEventListener(
      "cut",
      preventCut
    );

    document.addEventListener(
      "dragstart",
      preventDrag
    );

    document.addEventListener(
      "keydown",
      preventKeyboardCopy
    );


    return () => {

      document.removeEventListener(
        "contextmenu",
        preventContextMenu
      );

      document.removeEventListener(
        "copy",
        preventCopy
      );

      document.removeEventListener(
        "cut",
        preventCut
      );

      document.removeEventListener(
        "dragstart",
        preventDrag
      );

      document.removeEventListener(
        "keydown",
        preventKeyboardCopy
      );

    };

  }, []);

  const [lesson, setLesson] =
    useState(null);

  const [blocks, setBlocks] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(null);


  // =====================================================
  // CHARGEMENT
  // =====================================================

  useEffect(() => {

    loadLesson();

  }, [lessonId, isOnline]);


  async function loadLesson() {

    try {

      setLoading(true);
      setError(null);

      let lessonData = null;
      let blockData = [];


      if (isOnline) {

        lessonData =
          await getLesson(lessonId);

        blockData =
          await getLessonBlocks(lessonId);


        if (lessonData) {

          await cacheLesson(
            lessonData
          );

        }


        await cacheLessonBlocks(
          blockData || []
        );

      } else {

        lessonData =
          await getCachedLesson(
            lessonId
          );

        blockData =
          await getCachedLessonBlocks(
            lessonId
          );

      }


      setLesson(
        lessonData
      );

      setBlocks(
        blockData || []
      );

    } catch (err) {

      console.error(
        "Erreur LessonPage:",
        err
      );

      setError(
        err?.message ||
        "Impossible de charger la leçon"
      );

    } finally {

      setLoading(false);

    }

  }


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

        <div
          className="
            text-center
          "
        >

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
              text-gray-500
              dark:text-gray-400
              font-medium
            "
          >
            Chargement de la leçon...
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

      <div
        className="
          p-4
          md:p-6
        "
      >

        <div
          className="
            theme-surface
            rounded-3xl
            border
            border-red-100
            dark:border-red-900
            p-6
            text-center
          "
        >

          <p
            className="
              text-red-500
              mb-4
            "
          >
            {error}
          </p>


          <button
            type="button"
            onClick={loadLesson}
            className="
              px-5
              py-3
              rounded-xl
              bg-accent
              text-white
              font-semibold
              hover:opacity-90
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
  // LEÇON INTROUVABLE
  // =====================================================

  if (!lesson) {

    return (

      <div
        className="
          p-6
          text-center
        "
      >

        <p
          className="
            text-gray-500
            dark:text-gray-400
          "
        >
          Leçon introuvable.
        </p>

      </div>

    );

  }


  // =====================================================
  // AFFICHAGE
  // =====================================================

  return (

    <div
      className="
        min-h-screen
        bg-white
        dark:bg-gray-950
        p-4
        md:p-6
        pb-10
        max-w-5xl
        mx-auto
      "
      style={{
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none"
      }}
    >


      {/* =================================================
          RETOUR
      ================================================= */}

      <button
        type="button"
        onClick={() =>
          navigate(-1)
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
          text-gray-700
          dark:text-gray-200
          font-medium
          hover:text-accent
          transition
        "
      >

        <ArrowLeft
          size={18}
        />

        Retour aux leçons

      </button>


      {/* =================================================
          HEADER LEÇON
      ================================================= */}

      <div
        className="
          relative
          overflow-hidden
          rounded-3xl
          bg-accent-soft
          border
          border-accent
          p-6
          md:p-8
          shadow-lg
          mb-7
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

          {/* BADGE LEÇON */}

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

            <BookOpen
              size={14}
            />

            Leçon

          </div>


          {/* TITRE */}

          <h1
            className="
              text-2xl
              md:text-3xl
              font-bold
              leading-tight
              text-gray-950
              dark:text-white
            "
          >

            {lesson.title}

          </h1>


          {/* DESCRIPTION */}

          {lesson.description && (

            <p
              className="
                text-gray-700
                dark:text-gray-300
                mt-3
                leading-relaxed
              "
            >

              {lesson.description}

            </p>

          )}


          {/* INFORMATIONS */}

          <div
            className="
              flex
              flex-wrap
              items-center
              gap-3
              mt-5
            "
          >

            {lesson.duration_minutes && (

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
                  text-gray-800
                  dark:text-gray-200
                  text-sm
                  font-medium
                  border
                  border-white/50
                  dark:border-white/10
                "
              >

                <Clock
                  size={16}
                  className="text-accent"
                />

                {lesson.duration_minutes} min

              </div>

            )}


            {!isOnline && (

              <div
                className="
                  px-3
                  py-2
                  rounded-xl
                  bg-white/70
                  dark:bg-gray-950/30
                  text-gray-800
                  dark:text-gray-200
                  text-sm
                  font-medium
                  border
                  border-white/50
                  dark:border-white/10
                "
              >

                📱 Disponible hors ligne

              </div>

            )}

          </div>


          {/* VIDEO */}

          {lesson.video_url && (

            <button
              type="button"
              onClick={() =>
                navigate(
                  `/video/${lesson.id}`
                )
              }
              className="
                mt-6
                inline-flex
                items-center
                gap-2
                bg-accent
                text-white
                px-5
                py-3
                rounded-xl
                font-bold
                shadow-md
                hover:opacity-90
                hover:-translate-y-0.5
                transition
              "
            >

              <PlayCircle
                size={21}
              />

              Voir la vidéo

            </button>

          )}

        </div>

      </div>


      {/* =================================================
          COURS
      ================================================= */}

      <div
        className="
          mb-7
        "
      >

        <div
          className="
            flex
            items-center
            gap-3
            mb-5
          "
        >

          <div
            className="
              w-11
              h-11
              rounded-xl
              bg-accent-soft
              flex
              items-center
              justify-center
            "
          >

            <BookOpen
              size={22}
              className="text-accent"
            />

          </div>


          <div>

            <h2
              className="
                text-xl
                md:text-2xl
                font-bold
                text-gray-900
                dark:text-white
              "
            >
              Cours
            </h2>


            <p
              className="
                text-sm
                text-gray-500
                dark:text-gray-400
              "
            >
              Apprends étape par étape.
            </p>

          </div>

        </div>


        {blocks.length === 0 ? (

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

            <BookOpen
              size={38}
              className="
                mx-auto
                text-gray-300
                dark:text-gray-600
                mb-3
              "
            />


            <p
              className="
                text-gray-500
                dark:text-gray-400
              "
            >
              Aucun contenu disponible.
            </p>

          </div>

        ) : (

          <div
            className="
              space-y-4
            "
          >

            {blocks.map(
              (block, index) => {

                const content =
                  typeof block.content === "object"
                    ? block.content?.text
                    : block.content;


                return (

                  <article
                    key={block.id}
                    className="
                      theme-surface
                      rounded-3xl
                      border
                      theme-border
                      shadow-sm
                      overflow-hidden
                    "
                  >

                    <div
                      className="
                        p-5
                        md:p-6
                      "
                    >

                      <div
                        className="
                          flex
                          items-start
                          gap-4
                        "
                      >

                        <div
                          className="
                            w-10
                            h-10
                            rounded-xl
                            bg-accent-soft
                            text-accent
                            flex
                            items-center
                            justify-center
                            font-bold
                            flex-shrink-0
                          "
                        >

                          {index + 1}

                        </div>


                        <div
                          className="
                            flex-1
                          "
                        >

                          <h3
                            className="
                              font-bold
                              text-lg
                              text-gray-900
                              dark:text-white
                            "
                          >

                            {block.title || "Cours"}

                          </h3>


                          <p
                            className="
                              text-gray-700
                              dark:text-gray-300
                              mt-3
                              leading-7
                              whitespace-pre-line
                            "
                          >

                            {content}

                          </p>

                        </div>

                      </div>

                    </div>

                  </article>

                );

              }
            )}

          </div>

        )}

      </div>


      {/* =================================================
          QUIZ DE VALIDATION
      ================================================= */}

      <div
        className="
          relative
          overflow-hidden
          rounded-3xl
          bg-accent-soft
          border
          border-accent
          p-6
          md:p-7
          shadow-lg
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
            flex
            items-start
            gap-4
          "
        >

          <div
            className="
              w-12
              h-12
              rounded-2xl
              bg-accent
              text-white
              flex
              items-center
              justify-center
              flex-shrink-0
            "
          >

            <Trophy
              size={25}
            />

          </div>


          <div
            className="
              flex-1
            "
          >

            <p
              className="
                text-sm
                font-semibold
                text-accent
                mb-1
              "
            >
              Quiz de validation
            </p>


            <h2
              className="
                text-xl
                font-bold
                text-gray-950
                dark:text-white
              "
            >

              Vérifie ce que tu as appris

            </h2>


            <p
              className="
                text-gray-700
                dark:text-gray-300
                text-sm
                mt-1
              "
            >

              Teste tes connaissances sur cette leçon
              et gagne de l'XP.

            </p>


            <button
              type="button"
              onClick={() =>
                navigate(
                  `/exercise/${lesson.id}`
                )
              }
              className="
                mt-5
                inline-flex
                items-center
                gap-2
                bg-accent
                text-white
                px-5
                py-3
                rounded-xl
                font-bold
                shadow-md
                hover:opacity-90
                hover:-translate-y-0.5
                transition
              "
            >

              <CheckCircle2
                size={20}
              />

              Commencer le quiz

            </button>

          </div>

        </div>

      </div>

    </div>

  );

}