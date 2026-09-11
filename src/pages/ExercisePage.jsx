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
  getQuizByLesson
} from "../services/educationService";

import {
  useNetwork
} from "../hooks/useNetwork";

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

  const {
    isOnline
  } = useNetwork();


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
  // STATE
  // =====================================================

  const [
    quiz,
    setQuiz
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

    if (!lessonId) {

      setQuiz(null);

      setError(
        "Identifiant de leçon introuvable."
      );

      setLoading(false);

      return;

    }

    loadQuiz();

  }, [
    lessonId,
    isOnline
  ]);


  async function loadQuiz() {

    try {

      setLoading(true);
      setError(null);


      const data =
        await getQuizByLesson(
          lessonId
        );


      setQuiz(
        data || null
      );


    } catch (err) {

      console.error(
        "Erreur chargement quiz :",
        err
      );


      setQuiz(null);

      setError(
        err?.message ||
        "Impossible de charger le quiz."
      );


    } finally {

      setLoading(false);

    }

  }


  // =====================================================
  // RETOUR
  // =====================================================

  function handleBack() {

    navigate(-1);

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

          {/* =================================================
              RETOUR
          ================================================= */}

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


          {/* =================================================
              CARTE ERREUR
          ================================================= */}

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

              {/* RETOUR */}

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


              {/* RÉESSAYER */}

              <button
                type="button"
                onClick={loadQuiz}
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

          {/* =================================================
              RETOUR
          ================================================= */}

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


          {/* =================================================
              CARTE AUCUN QUIZ
          ================================================= */}

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

            {/* CERCLE HAUT DROIT */}

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


            {/* CERCLE BAS GAUCHE */}

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


            {/* CONTENU */}

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

        {/* =================================================
            RETOUR
        ================================================= */}

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

          Retour

        </button>


        {/* =================================================
            EN-TÊTE DU QUIZ
        ================================================= */}

        <div
          className="
            relative
            overflow-hidden
            theme-surface
            rounded-3xl
            border
            theme-border
            shadow-sm
            p-6
            md:p-7
          "
        >

          {/* =================================================
              CERCLE DÉCORATIF HAUT DROIT
          ================================================= */}

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


          {/* =================================================
              CERCLE DÉCORATIF BAS GAUCHE
          ================================================= */}

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


          {/* =================================================
              CONTENU
          ================================================= */}

          <div
            className="
              relative
              z-10
            "
          >

            <div
              className="
                flex
                items-start
                gap-4
              "
            >

              {/* =================================================
                  ICÔNE
              ================================================= */}

              <div
                className="
                  w-12
                  h-12
                  rounded-2xl
                  bg-accent-soft
                  text-accent
                  flex
                  items-center
                  justify-center
                  flex-shrink-0
                "
              >

                <ClipboardCheck
                  size={25}
                />

              </div>


              {/* =================================================
                  TITRE
              ================================================= */}

              <div
                className="
                  min-w-0
                  flex-1
                "
              >

                <div
                  className="
                    flex
                    flex-wrap
                    items-center
                    gap-2
                  "
                >

                  <p
                    className="
                      text-sm
                      font-bold
                      text-accent
                    "
                  >

                    {isConsultation
                      ? "Quiz en consultation"
                      : "Quiz de validation"}

                  </p>


                  {!isOnline && (

                    <span
                      className="
                        inline-flex
                        items-center
                        gap-1.5
                        px-2.5
                        py-1
                        rounded-full
                        bg-accent-soft
                        text-accent
                        text-xs
                        font-semibold
                      "
                    >

                      <WifiOff
                        size={13}
                      />

                      Hors ligne

                    </span>

                  )}

                </div>


                <h1
                  className="
                    text-2xl
                    md:text-3xl
                    font-extrabold
                    theme-text
                    mt-1
                    leading-tight
                  "
                >

                  {quiz.title || "Quiz"}

                </h1>

              </div>

            </div>


            {/* =================================================
                DESCRIPTION
            ================================================= */}

            {quiz.description && (

              <p
                className="
                  theme-text-secondary
                  leading-relaxed
                  mt-5
                "
              >

                {quiz.description}

              </p>

            )}

          </div>

        </div>


        {/* =================================================
            CARTE DU QUIZ
        ================================================= */}

        <div
          className="
            relative
            overflow-hidden
            theme-surface
            rounded-3xl
            border
            theme-border
            shadow-sm
            p-5
            md:p-7
          "
        >

          {/* =================================================
              CERCLE DÉCORATIF HAUT DROIT
          ================================================= */}

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


          {/* =================================================
              CERCLE DÉCORATIF BAS GAUCHE
          ================================================= */}

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


          {/* =================================================
              CONTENU QUIZ
          ================================================= */}

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

              consultationMode={
                isConsultation
              }

            />

          </div>

        </div>


      </div>

    </div>

  );

}