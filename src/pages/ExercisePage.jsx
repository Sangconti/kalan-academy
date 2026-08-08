// src/pages/ExercisePage.jsx

import {
  useEffect,
  useState
} from "react";

import {
  useParams,
  useNavigate
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
  ClipboardCheck
} from "lucide-react";



export default function ExercisePage() {

  const {
    lessonId
  } = useParams();

  const navigate =
    useNavigate();

  const {
    isOnline
  } = useNetwork();


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
  // CHARGEMENT DU QUIZ
  // =====================================================

  useEffect(() => {

    if (!lessonId) {

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

      console.log(
        "===================================="
      );

      console.log(
        "EXERCISE PAGE"
      );

      console.log(
        "Lesson ID :",
        lessonId
      );

      console.log(
        "Online :",
        isOnline
      );

      console.log(
        "Chargement du quiz..."
      );



      const data =
        await getQuizByLesson(
          lessonId
        );



      console.log(
        "QUIZ REÇU :",
        data
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
          flex-col
          items-center
          justify-center
          px-6
        "
      >

        <div
          className="
            w-14
            h-14
            rounded-2xl
            bg-blue-50
            flex
            items-center
            justify-center
            mb-4
          "
        >

          <Loader2
            size={28}
            className="
              text-blue-600
              animate-spin
            "
          />

        </div>


        <p
          className="
            text-gray-600
            font-medium
          "
        >

          Chargement du quiz...

        </p>

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
          flex
          items-center
          justify-center
          px-5
        "
      >

        <div
          className="
            w-full
            max-w-md
            bg-white
            rounded-2xl
            border
            border-red-100
            shadow-sm
            p-6
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
              flex
              items-center
              justify-center
            "
          >

            <AlertCircle
              size={28}
              className="text-red-500"
            />

          </div>


          <h2
            className="
              text-lg
              font-bold
              text-gray-900
            "
          >

            Impossible de charger le quiz

          </h2>


          <p
            className="
              text-sm
              text-gray-500
              mt-2
            "
          >

            {error}

          </p>


          <div
            className="
              flex
              gap-3
              mt-6
            "
          >

            <button
              type="button"
              onClick={handleBack}
              className="
                flex-1
                py-3
                rounded-xl
                border
                border-gray-200
                text-gray-700
                font-semibold
                hover:bg-gray-50
                transition
              "
            >

              Retour

            </button>


            <button
              type="button"
              onClick={loadQuiz}
              className="
                flex-1
                py-3
                rounded-xl
                bg-blue-600
                text-white
                font-semibold
                hover:bg-blue-700
                transition
              "
            >

              Réessayer

            </button>

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
        "
      >

        <button
          type="button"
          onClick={handleBack}
          className="
            flex
            items-center
            gap-2
            text-gray-600
            hover:text-blue-600
            transition
            mb-6
          "
        >

          <ArrowLeft
            size={18}
          />

          Retour

        </button>


        <div
          className="
            bg-white
            rounded-2xl
            border
            border-gray-100
            shadow-sm
            p-8
            text-center
          "
        >

          <div
            className="
              w-16
              h-16
              mx-auto
              mb-4
              rounded-2xl
              bg-blue-50
              flex
              items-center
              justify-center
            "
          >

            <ClipboardCheck
              size={30}
              className="text-blue-600"
            />

          </div>


          <h2
            className="
              text-lg
              font-bold
              text-gray-900
            "
          >

            Aucun quiz disponible

          </h2>


          <p
            className="
              text-sm
              text-gray-500
              mt-2
            "
          >

            Cette leçon ne possède pas encore
            de quiz de validation.

          </p>

        </div>

      </div>

    );

  }



  // =====================================================
  // INTERFACE
  // =====================================================

  return (

    <div
      className="
        max-w-3xl
        mx-auto
        px-5
        py-6
        space-y-6
      "
    >

      {/* RETOUR */}

      <button
        type="button"
        onClick={handleBack}
        className="
          flex
          items-center
          gap-2
          text-gray-600
          hover:text-blue-600
          transition
        "
      >

        <ArrowLeft
          size={18}
        />

        Retour

      </button>



      {/* EN-TÊTE QUIZ */}

      <div>

        <div
          className="
            flex
            items-center
            gap-3
            mb-3
          "
        >

          <div
            className="
              w-12
              h-12
              rounded-2xl
              bg-blue-50
              flex
              items-center
              justify-center
            "
          >

            <ClipboardCheck
              size={25}
              className="text-blue-600"
            />

          </div>


          <div>

            <p
              className="
                text-sm
                font-medium
                text-blue-600
              "
            >

              Quiz de validation

            </p>


            <h1
              className="
                text-2xl
                font-bold
                text-gray-900
              "
            >

              {quiz.title ||
                "Quiz"}

            </h1>

          </div>

        </div>


        {quiz.description && (

          <p
            className="
              text-gray-500
              leading-relaxed
            "
          >

            {quiz.description}

          </p>

        )}

      </div>



      {/* QUIZ */}

      <ExerciseQuiz

        quizId={
          quiz.id
        }

        lessonId={
          lessonId
        }

      />

    </div>

  );

}