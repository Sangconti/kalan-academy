// src/pages/ExercisePage.jsx

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
  cacheQuizzes,
  getCachedQuizzes,
  getCachedQuizQuestions
} from "../offline/db";

import ExerciseQuiz from "../components/ExerciseQuiz";

import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  ClipboardCheck,
  WifiOff
} from "lucide-react";


export default function ExercisePage({
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
  // 🌐 ÉTAT RÉSEAU LOCAL
  // =====================================================

  const [
    isOnline,
    setIsOnline
  ] = useState(
    typeof navigator !== "undefined"
      ? navigator.onLine
      : true
  );


  useEffect(() => {

    function handleOnline() {
      setIsOnline(true);
    }

    function handleOffline() {
      setIsOnline(false);
    }

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
      Boolean(studentId) &&
      location.pathname.includes("/admin/student/") &&
      location.pathname.includes("/consultation")
    );


  // =====================================================
  // 👁️ MODE APERÇU DE L'APPLICATION ÉLÈVE
  // =====================================================

  const isStudentPreview =
    location.pathname.startsWith(
      "/admin/student-preview"
    );


  // =====================================================
  // MODE APERÇU / CONSULTATION
  // =====================================================

  const isPreviewMode =
    isConsultation ||
    isStudentPreview;


  // =====================================================
  // STATE
  // =====================================================

  const [
    quiz,
    setQuiz
  ] = useState(null);

  const [
    initialQuestions,
    setInitialQuestions
  ] = useState(null);

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    error,
    setError
  ] = useState(null);


  // =====================================================
  // CHARGEMENT
  // =====================================================

  useEffect(() => {

    let cancelled = false;


    async function load() {

      if (!lessonId) {

        setQuiz(null);
        setInitialQuestions(null);

        setError(
          "Identifiant de leçon introuvable."
        );

        setLoading(false);

        return;

      }


      try {

        setLoading(true);
        setError(null);

        setQuiz(null);
        setInitialQuestions(null);


        // =================================================
        // 📦 1. DEXIE TOUJOURS EN PREMIER
        // =================================================

        console.log(
          isConsultation
            ? "👁️ [CONSULTATION] Recherche quiz dans Dexie :"
            : isStudentPreview
              ? "👁️ [APERÇU] Recherche quiz dans Dexie :"
              : "📦 [ÉLÈVE] Recherche quiz dans Dexie :",
          lessonId
        );


        const cachedQuizzes =
          await getCachedQuizzes(
            lessonId
          );


        if (cancelled) {
          return;
        }


        const cachedQuiz =
          Array.isArray(cachedQuizzes) &&
          cachedQuizzes.length > 0
            ? cachedQuizzes[0]
            : null;


        // =================================================
        // 📦 2. QUIZ TROUVÉ DANS DEXIE
        // =================================================

        if (cachedQuiz) {

          console.log(
            isConsultation
              ? "📦 [CONSULTATION] Quiz trouvé dans Dexie"
              : isStudentPreview
                ? "📦 [APERÇU] Quiz trouvé dans Dexie"
                : "📦 [ÉLÈVE] Quiz trouvé dans Dexie",
            cachedQuiz
          );


          // ===============================================
          // 📦 RECHERCHE DES QUESTIONS DANS DEXIE
          // ===============================================

          const cachedQuestions =
            await getCachedQuizQuestions(
              cachedQuiz.id
            );


          if (cancelled) {
            return;
          }


          const hasCachedQuestions =
            Array.isArray(cachedQuestions) &&
            cachedQuestions.length > 0;


          // ===============================================
          // 📦 QUIZ + QUESTIONS DISPONIBLES
          // ===============================================

          if (hasCachedQuestions) {

            console.log(
              isConsultation
                ? "📦 [CONSULTATION] Questions trouvées dans Dexie :"
                : isStudentPreview
                  ? "📦 [APERÇU] Questions trouvées dans Dexie :"
                  : "📦 [ÉLÈVE] Questions trouvées dans Dexie :",
              cachedQuestions.length
            );


            setInitialQuestions(
              cachedQuestions
            );

            setQuiz(
              cachedQuiz
            );

            return;

          }


          // ===============================================
          // 📭 QUIZ PRÉSENT MAIS QUESTIONS ABSENTES
          // ===============================================

          console.log(
            isConsultation
              ? "📭 [CONSULTATION] Aucune question en cache"
              : isStudentPreview
                ? "📭 [APERÇU] Aucune question en cache"
                : "📭 [ÉLÈVE] Aucune question en cache"
          );


          // ===============================================
          // 📴 HORS LIGNE
          // ===============================================

          if (!navigator.onLine) {

            console.log(
              isConsultation
                ? "📴 [CONSULTATION] Hors ligne, quiz disponible sans questions"
                : isStudentPreview
                  ? "📴 [APERÇU] Hors ligne, quiz disponible sans questions"
                  : "📴 [ÉLÈVE] Hors ligne, quiz disponible sans questions"
            );


            setQuiz(
              cachedQuiz
            );

            return;

          }


          // ===============================================
          // 🌐 QUESTIONS MANQUANTES → SUPABASE
          // ===============================================

          console.log(
            isConsultation
              ? "🌐 [CONSULTATION] Questions manquantes → Supabase"
              : isStudentPreview
                ? "🌐 [APERÇU] Questions manquantes → Supabase"
                : "🌐 [ÉLÈVE] Questions manquantes → Supabase"
          );


          const {
            data: networkQuestions,
            error: questionsError
          } = await supabase
            .from("quiz_questions")
            .select("*")
            .eq("quiz_id", cachedQuiz.id)
            .order("order_number", {
              ascending: true
            });


          if (cancelled) {
            return;
          }


          if (questionsError) {

            console.warn(
              "⚠️ Impossible de charger les questions du quiz",
              questionsError
            );

            setQuiz(
              cachedQuiz
            );

            return;

          }


          if (
            Array.isArray(networkQuestions) &&
            networkQuestions.length > 0
          ) {

            console.log(
              isConsultation
                ? "🌐 [CONSULTATION] Questions chargées depuis Supabase :"
                : isStudentPreview
                  ? "🌐 [APERÇU] Questions chargées depuis Supabase :"
                  : "🌐 [ÉLÈVE] Questions chargées depuis Supabase :",
              networkQuestions.length
            );


            // -------------------------------------------------
            // IMPORTANT :
            // Le cache des questions est géré par le système
            // existant. On ne modifie pas ici les autres
            // mécanismes de synchronisation.
            // -------------------------------------------------

            setInitialQuestions(
              networkQuestions
            );

          }


          setQuiz(
            cachedQuiz
          );

          return;

        }


        // =================================================
        // 📭 3. QUIZ ABSENT DE DEXIE
        // =================================================

        console.log(
          isConsultation
            ? "📭 [CONSULTATION] Aucun quiz dans Dexie"
            : isStudentPreview
              ? "📭 [APERÇU] Aucun quiz dans Dexie"
              : "📭 [ÉLÈVE] Aucun quiz dans Dexie"
        );


        // =================================================
        // 📴 4. HORS LIGNE → DEXIE UNIQUEMENT
        // =================================================

        if (!navigator.onLine) {

          console.log(
            isConsultation
              ? "📴 [CONSULTATION] Hors ligne, impossible de charger le quiz"
              : isStudentPreview
                ? "📴 [APERÇU] Hors ligne, impossible de charger le quiz"
                : "📴 [ÉLÈVE] Hors ligne, impossible de charger le quiz"
          );


          if (!cancelled) {

            setQuiz(null);
            setInitialQuestions(null);

            setError(
              "Le quiz n'est pas disponible hors ligne."
            );

          }

          return;

        }


        // =================================================
        // 🌐 5. QUIZ ABSENT + ONLINE → SUPABASE
        // =================================================

        console.log(
          isConsultation
            ? "🌐 [CONSULTATION] Quiz absent de Dexie → Supabase"
            : isStudentPreview
              ? "🌐 [APERÇU] Quiz absent de Dexie → Supabase"
              : "🌐 [ÉLÈVE] Quiz absent de Dexie → Supabase"
        );


        const {
          data: networkQuiz,
          error: quizError
        } = await supabase
          .from("quizzes")
          .select("*")
          .eq("lesson_id", lessonId)
          .maybeSingle();


        if (quizError) {
          throw quizError;
        }


        if (cancelled) {
          return;
        }


        if (!networkQuiz) {

          setQuiz(null);
          setInitialQuestions(null);

          return;

        }


        // =================================================
        // 💾 CACHE DU QUIZ
        // =================================================

        await cacheQuizzes([
          networkQuiz
        ]);


        if (cancelled) {
          return;
        }


        // =================================================
        // 🌐 QUESTIONS DU QUIZ MANQUANT EN CACHE
        // =================================================

        const {
          data: networkQuestions,
          error: questionsError
        } = await supabase
          .from("quiz_questions")
          .select("*")
          .eq("quiz_id", networkQuiz.id)
          .order("order_number", {
            ascending: true
          });


        if (questionsError) {

          console.warn(
            "⚠️ Impossible de précharger les questions du quiz",
            questionsError
          );

        } else if (
          Array.isArray(networkQuestions) &&
          networkQuestions.length > 0
        ) {

          console.log(
            isConsultation
              ? "🌐 [CONSULTATION] Questions chargées depuis Supabase :"
              : isStudentPreview
                ? "🌐 [APERÇU] Questions chargées depuis Supabase :"
                : "🌐 [ÉLÈVE] Questions chargées depuis Supabase :",
            networkQuestions.length
          );


          if (!cancelled) {

            setInitialQuestions(
              networkQuestions
            );

          }

        }


        if (!cancelled) {

          setQuiz(
            networkQuiz
          );

        }


      } catch (err) {

        if (cancelled) {
          return;
        }


        console.error(
          "Erreur chargement quiz :",
          err
        );


        // =================================================
        // 📦 DERNIER FALLBACK DEXIE
        // =================================================

        try {

          const cachedQuizzes =
            await getCachedQuizzes(
              lessonId
            );


          if (cancelled) {
            return;
          }


          const cachedQuiz =
            Array.isArray(cachedQuizzes) &&
            cachedQuizzes.length > 0
              ? cachedQuizzes[0]
              : null;


          if (cachedQuiz) {

            console.log(
              "📦 Fallback final : quiz récupéré depuis Dexie"
            );


            const cachedQuestions =
              await getCachedQuizQuestions(
                cachedQuiz.id
              );


            if (cancelled) {
              return;
            }


            if (
              Array.isArray(cachedQuestions) &&
              cachedQuestions.length > 0
            ) {

              setInitialQuestions(
                cachedQuestions
              );

            }


            setQuiz(
              cachedQuiz
            );

            return;

          }

        } catch (cacheError) {

          if (!cancelled) {

            console.error(
              "❌ Erreur fallback Dexie :",
              cacheError
            );

          }

        }


        if (!cancelled) {

          setQuiz(null);
          setInitialQuestions(null);

          setError(
            err?.message ||
            "Impossible de charger le quiz."
          );

        }

      } finally {

        if (!cancelled) {
          setLoading(false);
        }

      }

    }


    load();


    return () => {

      cancelled = true;

    };

  }, [
    lessonId,
    isConsultation,
    isStudentPreview
  ]);


  // =====================================================
  // RETOUR
  // =====================================================

  function handleBack() {

    // ---------------------------------------------------
    // MODE APERÇU APPLICATION ÉLÈVE
    // ---------------------------------------------------

    if (isStudentPreview) {

      navigate(
        `/admin/student-preview/lesson/${lessonId}`
      );

      return;

    }


    // ---------------------------------------------------
    // MODE NORMAL / CONSULTATION
    // ---------------------------------------------------

    navigate(-1);

  }


  // =====================================================
  // LOADING
  // =====================================================

  if (
    loading &&
    !isPreviewMode
  ) {

    return (

      <div
        className="
          min-h-[60vh]
          flex
          items-center
          justify-center
          px-5
          py-10
        "
      >

        <div
          className="
            text-center
          "
        >

          <div
            className="
              w-14
              h-14
              mx-auto
              mb-4
              rounded-2xl
              bg-accent-soft
              text-accent
              flex
              items-center
              justify-center
            "
          >

            <Loader2
              size={28}
              className="
                animate-spin
              "
            />

          </div>


          <p
            className="
              theme-text
              font-semibold
            "
          >
            Chargement du quiz...
          </p>


          {!isOnline && (

            <p
              className="
                text-xs
                theme-text-secondary
                mt-2
              "
            >
              Vérification du contenu hors ligne...
            </p>

          )}

        </div>

      </div>

    );

  }


  // =====================================================
  // ATTENTE SILENCIEUSE APERÇU / CONSULTATION
  // =====================================================

  if (
    loading &&
    isPreviewMode
  ) {

    return null;

  }


  // =====================================================
  // ERREUR
  // =====================================================

  if (error) {

    return (

      <div
        className="
          min-h-[60vh]
          px-5
          py-6
          md:px-6
          md:py-8
        "
      >

        <div
          className="
            max-w-2xl
            mx-auto
          "
        >

          <button
            type="button"
            onClick={handleBack}
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


          <div
            className="
              theme-surface
              rounded-3xl
              border
              border-red-100
              dark:border-red-900
              shadow-sm
              p-7
              md:p-8
              text-center
            "
          >

            <div
              className="
                w-14
                h-14
                mx-auto
                mb-4
                rounded-2xl
                bg-red-50
                dark:bg-red-950/30
                flex
                items-center
                justify-center
              "
            >

              <AlertCircle
                size={28}
                className="
                  text-red-500
                  dark:text-red-400
                "
              />

            </div>


            <h2
              className="
                text-xl
                font-bold
                theme-text
              "
            >
              Impossible de charger le quiz
            </h2>


            <p
              className="
                text-sm
                theme-text-secondary
                mt-2
                leading-relaxed
              "
            >
              {error}
            </p>


            <div
              className="
                flex
                flex-col
                sm:flex-row
                gap-3
                mt-6
                justify-center
              "
            >

              <button
                type="button"
                onClick={handleBack}
                className="
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  px-5
                  py-3
                  rounded-xl
                  border
                  theme-border
                  theme-text
                  font-semibold
                  hover:bg-accent-soft
                  hover:text-accent
                  transition
                "
              >

                <ArrowLeft
                  size={18}
                />

                Retour

              </button>


              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  setError(null);
                  setQuiz(null);
                  setInitialQuestions(null);
                  window.dispatchEvent(
                    new Event("kalan-reload-quiz")
                  );
                }}
                className="
                  inline-flex
                  items-center
                  justify-center
                  gap-2
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

                <ClipboardCheck
                  size={18}
                />

                Réessayer

              </button>

            </div>

          </div>

        </div>

      </div>

    );

  }


  // =====================================================
  // AUCUN QUIZ
  // =====================================================

  if (!quiz) {

    return (

      <div
        className="
          min-h-[60vh]
          px-5
          py-6
          md:px-6
          md:py-8
        "
      >

        <div
          className="
            max-w-3xl
            mx-auto
          "
        >

          <button
            type="button"
            onClick={handleBack}
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


          <div
            className="
              relative
              overflow-hidden
              theme-surface
              rounded-3xl
              border
              theme-border
              shadow-sm
              p-8
              md:p-10
              text-center
            "
          >

            <div
              className="
                pointer-events-none
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
                pointer-events-none
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

              <div
                className="
                  w-16
                  h-16
                  mx-auto
                  mb-5
                  rounded-2xl
                  bg-accent-soft
                  text-accent
                  flex
                  items-center
                  justify-center
                "
              >

                <ClipboardCheck
                  size={30}
                />

              </div>


              <h2
                className="
                  text-xl
                  md:text-2xl
                  font-bold
                  theme-text
                "
              >
                Aucun quiz disponible
              </h2>


              <p
                className="
                  max-w-md
                  mx-auto
                  text-sm
                  theme-text-secondary
                  mt-2
                  leading-relaxed
                "
              >
                Cette leçon ne possède pas encore
                de quiz de validation.
              </p>

            </div>

          </div>

        </div>

      </div>

    );

  }


  // =====================================================
  // INTERFACE QUIZ
  // =====================================================

  return (

    <div
      className="
        min-h-screen
        px-5
        py-6
        md:px-6
        md:py-8
        pb-10
      "
    >

      <div
        className="
          max-w-3xl
          mx-auto
          space-y-6
        "
      >

        <button
          type="button"
          onClick={handleBack}
          className="
            inline-flex
            items-center
            gap-2
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

          Retour aux cours

        </button>


        <div
          className="
            relative
            overflow-hidden
            rounded-3xl
            bg-accent-soft
            border
            border-accent
            shadow-lg
            p-6
            md:p-8
          "
        >

          <div
            className="
              pointer-events-none
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
              pointer-events-none
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
              pointer-events-none
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

              <ClipboardCheck
                size={14}
              />

              {isConsultation
                ? "Quiz en consultation"
                : isStudentPreview
                  ? "Quiz aperçu"
                  : "Quiz de validation"}

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

              {quiz.title || "Quiz"}

            </h1>


            {quiz.description && (

              <p
                className="
                  theme-text-secondary
                  mt-3
                  leading-relaxed
                  max-w-3xl
                "
              >

                {quiz.description}

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

                <ClipboardCheck
                  size={16}
                  className="text-accent"
                />

                Validation des connaissances

              </div>


              {!isOnline && (

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

                  <WifiOff
                    size={16}
                    className="text-accent"
                  />

                  Hors ligne

                </div>

              )}

            </div>

          </div>

        </div>


        <div
          className="
            relative
            overflow-hidden
            rounded-3xl
            bg-accent-soft
            border
            border-accent
            shadow-lg
            p-5
            md:p-7
          "
        >

          <div
            className="
              pointer-events-none
              absolute
              -right-16
              -top-16
              w-40
              h-40
              rounded-full
              bg-accent
              opacity-[0.07]
            "
          />


          <div
            className="
              pointer-events-none
              absolute
              -left-12
              -bottom-16
              w-36
              h-36
              rounded-full
              bg-accent
              opacity-[0.07]
            "
          />


          <div
            className="
              relative
              z-10
            "
          >

            <ExerciseQuiz
              quizId={
                quiz.id
              }

              lessonId={
                lessonId
              }

              initialQuestions={
                initialQuestions
              }

              consultationMode={
                isConsultation ||
                isStudentPreview
              }

            />

          </div>

        </div>


      </div>

    </div>

  );

}