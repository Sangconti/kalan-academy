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

import { supabase } from "../lib/supabase";

import {
  cacheChapter,
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


  // =====================================================
  // MODE APERÇU APPLICATION ÉLÈVE
  // =====================================================

  const isStudentPreview =
    location.pathname.startsWith(
      "/admin/student-preview"
    );


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
        // 1. DEXIE PRIORITAIRE — TOUS LES MODES
        // =================================================

        chapterData =
          await getCachedChapter(
            chapterId
          );


        lessonsData =
          await getCachedLessons(
            chapterId
          );


        const hasCachedChapter =
          Boolean(chapterData);


        const hasCachedLessons =
          Array.isArray(lessonsData) &&
          lessonsData.length > 0;


        // =================================================
        // CACHE COMPLET
        // =================================================

        if (
          hasCachedChapter &&
          hasCachedLessons
        ) {

          if (isConsultation) {

            console.log(
              "📦 [CONSULTATION] Chapitre et leçons trouvés dans Dexie"
            );

          } else if (isStudentPreview) {

            console.log(
              "📦 [APERÇU] Chapitre et leçons trouvés dans Dexie"
            );

          } else {

            console.log(
              "📦 [CHAPTER] Chapitre et leçons trouvés dans Dexie"
            );

          }

        }


        // =================================================
        // CACHE INCOMPLET
        // =================================================

        else {

          const modeLabel =
            isConsultation
              ? "[CONSULTATION]"
              : isStudentPreview
                ? "[APERÇU]"
                : "[CHAPTER]";


          // -------------------------------------------------
          // HORS LIGNE
          // -------------------------------------------------

          if (!isOnline) {

            console.log(
              `📴 ${modeLabel} Cache incomplet mais appareil hors ligne → Dexie uniquement`
            );

          }


          // -------------------------------------------------
          // EN LIGNE → SUPABASE DIRECT
          // -------------------------------------------------

          else {

            console.log(
              `🌐 ${modeLabel} Cache incomplet → Supabase direct`
            );


            // ===============================================
            // CHAPITRE
            // ===============================================

            if (!hasCachedChapter) {

              try {

                const {
                  data,
                  error
                } = await supabase
                  .from("chapters")
                  .select("*")
                  .eq(
                    "id",
                    chapterId
                  )
                  .maybeSingle();


                if (error) {

                  throw error;

                }


                chapterData =
                  data || null;


                if (chapterData) {

                  await cacheChapter(
                    chapterData
                  );


                  console.log(
                    `📥 ${modeLabel} Chapitre récupéré depuis Supabase`
                  );

                }

              } catch (chapterError) {

                console.warn(
                  `⚠️ ${modeLabel} Chapitre Supabase indisponible → conservation du cache :`,
                  chapterError
                );

              }

            }


            // ===============================================
            // LEÇONS
            // ===============================================

            if (!hasCachedLessons) {

              try {

                const {
                  data,
                  error
                } = await supabase
                  .from("lessons")
                  .select("*")
                  .eq(
                    "chapter_id",
                    chapterId
                  )
                  .order(
                    "order_number",
                    {
                      ascending: true
                    }
                  );


                if (error) {

                  throw error;

                }


                lessonsData =
                  data || [];


                if (
                  lessonsData.length > 0
                ) {

                  await cacheLessons(
                    lessonsData
                  );


                  console.log(
                    `📥 ${modeLabel} Leçons récupérées depuis Supabase :`,
                    lessonsData.length
                  );

                }

              } catch (lessonsError) {

                console.warn(
                  `⚠️ ${modeLabel} Leçons Supabase indisponibles → conservation du cache :`,
                  lessonsError
                );

              }

            }

          }

        }


        if (cancelled) {

          return;

        }


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
    isOnline,
    isConsultation,
    isStudentPreview
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
    // MODE APERÇU APPLICATION ÉLÈVE
    // ---------------------------------------------------

    if (isStudentPreview) {

      if (chapter?.subject_id) {

        navigate(
          `/admin/student-preview/subject/${chapter.subject_id}`,
          {
            state: {
              subject_id: chapter.subject_id,
              class_id: chapter.class_id,
              chapter_id: chapterId
            }
          }
        );

        return;

      }


      navigate(
        "/admin/student-preview"
      );

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
    // MODE APERÇU APPLICATION ÉLÈVE
    // ---------------------------------------------------

    if (isStudentPreview) {

      console.log(
        "👁️ [APERÇU] Ouverture leçon :",
        lesson.id
      );


      navigate(
        `/admin/student-preview/lesson/${lesson.id}`,
        {
          state: {
            chapter_id: chapterId,
            subject_id: chapter?.subject_id,
            class_id: chapter?.class_id
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
            theme-text
            font-medium
            hover:text-accent
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
          theme-text
          font-medium
          hover:text-accent
          transition
        "
      >

        <ArrowLeft
          size={18}
        />

        Retour aux chapitres

      </button>


      {/* =================================================
          EN-TÊTE DU CHAPITRE
      ================================================= */}

      <div className="
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
      ">


        {/* CERCLES DÉCORATIFS */}

        <div className="
          absolute
          -right-10
          -top-10
          w-40
          h-40
          rounded-full
          bg-accent
          opacity-10
        " />


        <div className="
          absolute
          -left-16
          -bottom-20
          w-48
          h-48
          rounded-full
          bg-accent
          opacity-10
        " />


        <div className="
          absolute
          right-16
          -bottom-24
          w-56
          h-56
          rounded-full
          bg-accent
          opacity-5
        " />


        <div className="
          relative
          z-10
        ">


          {/* BADGE */}

          <div className="
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
          ">

            <BookOpen
              size={14}
            />

            Chapitre

          </div>


          {/* TITRE */}

          <h1 className="
            text-2xl
            md:text-3xl
            font-bold
            leading-tight
            theme-text
          ">

            {chapter?.title}

          </h1>


          {/* DESCRIPTION */}

          {chapter?.description && (

            <p className="
              theme-text-secondary
              mt-3
              leading-relaxed
              max-w-3xl
            ">

              {chapter.description}

            </p>

          )}


          {/* INFORMATIONS */}

          <div className="
            flex
            flex-wrap
            items-center
            gap-3
            mt-6
          ">


            <div className="
              inline-flex
              items-center
              gap-2
              px-3
              py-2
              rounded-xl
              bg-white/70
              dark:bg-gray-950/30
              theme-text
              text-sm
              font-medium
              border
              border-white/50
              dark:border-white/10
            ">

              <BookOpen
                size={16}
                className="text-accent"
              />

              Contenu du chapitre

            </div>


            <div className="
              inline-flex
              items-center
              gap-2
              px-3
              py-2
              rounded-xl
              bg-white/70
              dark:bg-gray-950/30
              theme-text
              text-sm
              font-medium
              border
              border-white/50
              dark:border-white/10
            ">

              <PlayCircle
                size={16}
                className="text-accent"
              />

              {lessons.length} leçon
              {lessons.length > 1 ? "s" : ""}

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
