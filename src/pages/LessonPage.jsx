// src/pages/LessonPage.jsx

import {
  useEffect,
  useState
} from "react";

import {
  useParams,
  useNavigate,
  useLocation
} from "react-router-dom";

import {
  supabase
} from "../lib/supabase";

import {
  cacheLesson,
  getCachedLesson,
  cacheLessonBlocks,
  getCachedLessonBlocks
} from "../offline/db";

import {
  ArrowLeft,
  PlayCircle,
  BookOpen,
  Clock,
  CheckCircle2,
  Trophy
} from "lucide-react";


export default function LessonPage({
  consultationMode = false
}) {

  const {
    lessonId,
    studentId
  } = useParams();

  const navigate =
    useNavigate();

  const location =
    useLocation();


  // =====================================================
  // 🌐 ÉTAT RÉSEAU DU NAVIGATEUR
  // =====================================================

  const [isOnline, setIsOnline] =
    useState(
      typeof navigator !== "undefined"
        ? navigator.onLine
        : true
    );


  useEffect(() => {

    const handleOnline = () => {
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };


    window.addEventListener(
      "online",
      handleOnline
    );

    window.addEventListener(
      "offline",
      handleOffline
    );


    return () => {

      window.removeEventListener(
        "online",
        handleOnline
      );

      window.removeEventListener(
        "offline",
        handleOffline
      );

    };

  }, []);


  // =====================================================
  // 👁️ MODE CONSULTATION
  // =====================================================

  const isConsultation =
    consultationMode ||
    location.state?.consultationMode === true ||
    (
      location.pathname.includes("/admin/student/") &&
      location.pathname.includes("/consultation") &&
      Boolean(studentId)
    );


  // =====================================================
  // 👁️ MODE APERÇU APPLICATION ÉLÈVE
  // =====================================================

  const isStudentPreview =
    location.pathname.startsWith(
      "/admin/student-preview"
    );


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

    let cancelled = false;


    async function loadLesson() {

      try {

        setLoading(true);
        setError(null);


        let lessonData = null;
        let blockData = [];


        // =================================================
        // IDENTIFICATION DU MODE
        // =================================================

        const modeLabel =
          isConsultation
            ? "[CONSULTATION]"
            : isStudentPreview
              ? "[APERÇU]"
              : "[ÉLÈVE]";


        // =================================================
        // 📦 DEXIE TOUJOURS EN PREMIER
        // =================================================
        //
        // Même avec Internet :
        //
        // 1. Leçon depuis Dexie
        // 2. Blocs depuis Dexie
        // 3. Si le cache est complet → aucun réseau
        // 4. Si le cache est incomplet :
        //      - hors ligne → Dexie uniquement
        //      - en ligne → Supabase uniquement pour
        //        les données manquantes
        //
        // Aucun appel à educationService.isOnline()
        // Aucun HEAD /rest/v1/.
        // =================================================

        console.log(
          `📦 ${modeLabel} Recherche leçon dans Dexie :`,
          lessonId
        );


        lessonData =
          await getCachedLesson(
            lessonId
          );


        blockData =
          await getCachedLessonBlocks(
            lessonId
          );


        const hasLesson =
          Boolean(lessonData);


        const hasBlocks =
          Array.isArray(blockData) &&
          blockData.length > 0;


        // =================================================
        // 📦 CACHE COMPLET
        // =================================================

        if (
          hasLesson &&
          hasBlocks
        ) {

          console.log(
            `📦 ${modeLabel} Leçon et blocs trouvés dans Dexie`
          );

        }


        // =================================================
        // ⚠️ CACHE INCOMPLET
        // =================================================

        else {

          // -------------------------------------------------
          // 📴 HORS LIGNE
          // -------------------------------------------------

          if (!isOnline) {

            console.log(
              `📴 ${modeLabel} Cache leçon incomplet mais appareil hors ligne → Dexie uniquement`
            );

          }


          // -------------------------------------------------
          // 🌐 EN LIGNE
          // -------------------------------------------------

          else {

            console.log(
              `🌐 ${modeLabel} Cache leçon incomplet → Supabase direct`
            );


            // -------------------------------------------------
            // LEÇON MANQUANTE
            // -------------------------------------------------

            if (!hasLesson) {

              try {

                const {
                  data,
                  error: lessonError
                } = await supabase
                  .from("lessons")
                  .select("*")
                  .eq("id", lessonId)
                  .maybeSingle();


                if (lessonError) {
                  throw lessonError;
                }


                lessonData =
                  data || null;


                if (lessonData) {

                  await cacheLesson(
                    lessonData
                  );


                  console.log(
                    `📥 ${modeLabel} Leçon récupérée depuis Supabase`
                  );

                }

              } catch (lessonError) {

                console.warn(
                  `⚠️ ${modeLabel} Leçon Supabase indisponible → conservation du cache :`,
                  lessonError
                );

              }

            }


            // -------------------------------------------------
            // BLOCS MANQUANTS
            // -------------------------------------------------

            if (!hasBlocks) {

              try {

                const {
                  data,
                  error: blocksError
                } = await supabase
                  .from("lesson_blocks")
                  .select("*")
                  .eq("lesson_id", lessonId)
                  .order(
                    "order_number",
                    {
                      ascending: true
                    }
                  );


                if (blocksError) {
                  throw blocksError;
                }


                blockData =
                  data || [];


                if (blockData.length > 0) {

                  await cacheLessonBlocks(
                    blockData
                  );


                  console.log(
                    `📥 ${modeLabel} Blocs récupérés depuis Supabase :`,
                    blockData.length
                  );

                }

              } catch (blocksError) {

                console.warn(
                  `⚠️ ${modeLabel} Blocs Supabase indisponibles → conservation du cache :`,
                  blocksError
                );

              }

            }

          }

        }


        // =================================================
        // APPLICATION DES DONNÉES
        // =================================================

        if (cancelled) {
          return;
        }


        setLesson(
          lessonData || null
        );


        setBlocks(
          blockData || []
        );


      } catch (err) {

        if (cancelled) {
          return;
        }


        console.error(
          "Erreur LessonPage:",
          err
        );


        // -------------------------------------------------
        // FALLBACK DEXIE
        // -------------------------------------------------
        // Si une erreur inattendue survient, on tente
        // toujours le cache.
        // -------------------------------------------------

        try {

          const cachedLesson =
            await getCachedLesson(
              lessonId
            );


          const cachedBlocks =
            await getCachedLessonBlocks(
              lessonId
            );


          if (
            cachedLesson ||
            (
              Array.isArray(cachedBlocks) &&
              cachedBlocks.length > 0
            )
          ) {

            console.log(
              "📦 [FALLBACK] Leçon récupérée depuis Dexie"
            );


            if (!cancelled) {

              setLesson(
                cachedLesson || null
              );


              setBlocks(
                cachedBlocks || []
              );


              setError(
                null
              );

            }


            return;

          }

        } catch (cacheError) {

          console.error(
            "Erreur fallback Dexie:",
            cacheError
          );

        }


        if (!cancelled) {

          setError(
            err?.message ||
            "Impossible de charger la leçon"
          );

        }

      } finally {

        if (!cancelled) {
          setLoading(false);
        }

      }

    }


    if (lessonId) {
      loadLesson();
    }


    return () => {
      cancelled = true;
    };

  }, [
    lessonId,
    isOnline,
    isConsultation,
    isStudentPreview
  ]);


  // =====================================================
  // OUVRIR LA VIDÉO
  // =====================================================

  function openVideo() {

    if (!lesson?.id) {
      return;
    }


    // ---------------------------------------------------
    // 👁️ CONSULTATION ADMIN
    // ---------------------------------------------------

    if (isConsultation && studentId) {

      console.log(
        "👁️ [CONSULTATION] Ouverture vidéo :",
        lesson.id
      );


      navigate(
        `/admin/student/${studentId}/consultation/video/${lesson.id}`,
        {
          state: {
            consultationMode: true
          }
        }
      );

      return;

    }


    // ---------------------------------------------------
    // 👁️ APERÇU APPLICATION ÉLÈVE
    // ---------------------------------------------------

    if (isStudentPreview) {

      console.log(
        "👁️ [APERÇU] Ouverture vidéo :",
        lesson.id
      );


      navigate(
        `/admin/student-preview/video/${lesson.id}`,
        {
          state: {
            previewMode: true
          }
        }
      );

      return;

    }


    // ---------------------------------------------------
    // 👨‍🎓 ÉLÈVE NORMAL
    // ---------------------------------------------------

    navigate(
      `/video/${lesson.id}`,
      {
        state: {
          consultationMode: false
        }
      }
    );

  }


  // =====================================================
  // OUVRIR LE QUIZ
  // =====================================================

  function openExercise() {

    if (!lesson?.id) {
      return;
    }


    // ---------------------------------------------------
    // 👁️ CONSULTATION ADMIN
    // ---------------------------------------------------

    if (isConsultation && studentId) {

      console.log(
        "👁️ [CONSULTATION] Ouverture quiz :",
        lesson.id
      );


      navigate(
        `/admin/student/${studentId}/consultation/exercise/${lesson.id}`,
        {
          state: {
            consultationMode: true
          }
        }
      );

      return;

    }


    // ---------------------------------------------------
    // 👁️ APERÇU APPLICATION ÉLÈVE
    // ---------------------------------------------------

    if (isStudentPreview) {

      console.log(
        "👁️ [APERÇU] Ouverture quiz :",
        lesson.id
      );


      navigate(
        `/admin/student-preview/exercise/${lesson.id}`,
        {
          state: {
            previewMode: true
          }
        }
      );

      return;

    }


    // ---------------------------------------------------
    // 👨‍🎓 ÉLÈVE NORMAL
    // ---------------------------------------------------

    navigate(
      `/exercise/${lesson.id}`,
      {
        state: {
          consultationMode: false
        }
      }
    );

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
          theme-bg
          theme-text
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
              theme-text-secondary
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
          theme-bg
          theme-text
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
              dark:text-red-400
              mb-4
            "
          >
            {error}
          </p>


          <button
            type="button"
            onClick={() => {
              window.location.reload();
            }}
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
          theme-bg
          theme-text
          p-6
          text-center
        "
      >

        <p
          className="
            theme-text-secondary
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
        theme-bg
        theme-text
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
        onClick={() => {

          if (isConsultation) {
            navigate(-1);
            return;
          }

          if (isStudentPreview) {

            if (lesson?.chapter_id) {

              navigate(
                `/admin/student-preview/chapter/${lesson.chapter_id}`
              );

              return;

            }

            navigate(
              "/admin/student-preview"
            );

            return;

          }

          navigate(-1);

        }}
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

            {isConsultation
              ? "Leçon en consultation"
              : isStudentPreview
                ? "Aperçu de la leçon"
                : "Leçon"
            }

          </div>


          <h1
            className="
              text-2xl
              md:text-3xl
              font-bold
              leading-tight
              theme-text
            "
          >

            {lesson.title}

          </h1>


          {lesson.description && (

            <p
              className="
                theme-text-secondary
                mt-3
                leading-relaxed
              "
            >

              {lesson.description}

            </p>

          )}


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
                  theme-text
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
                  theme-text
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


          {lesson.video_url && (

            <button
              type="button"
              onClick={openVideo}
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
                theme-text
              "
            >
              Cours
            </h2>


            <p
              className="
                text-sm
                theme-text-secondary
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
                theme-text-secondary
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
                              theme-text
                            "
                          >

                            {block.title || "Cours"}

                          </h3>


                          <p
                            className="
                              theme-text-secondary
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

              {isConsultation
                ? "Quiz en consultation"
                : isStudentPreview
                  ? "Aperçu du quiz"
                  : "Quiz de validation"}

            </p>


            <h2
              className="
                text-xl
                font-bold
                theme-text
              "
            >

              Vérifie ce que tu as appris

            </h2>


            <p
              className="
                theme-text-secondary
                text-sm
                mt-1
              "
            >

              {isConsultation
                ? "Consulte les questions et le résultat sans modifier les données de l'élève."
                : isStudentPreview
                  ? "Aperçu des questions du quiz sans modifier les données d'un élève."
                  : "Teste tes connaissances sur cette leçon et gagne de l'XP."}

            </p>


            <button
              type="button"
              onClick={openExercise}
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

              {isConsultation
                ? "Voir le quiz"
                : isStudentPreview
                  ? "Voir le quiz"
                  : "Commencer le quiz"}

            </button>

          </div>

        </div>

      </div>

    </div>

  );

}
