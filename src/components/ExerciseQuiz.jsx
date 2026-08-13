// src/components/ExerciseQuiz.jsx

import {
useEffect,
useState
} from "react";

import {
addXP
} from "../services/xpService";

import {
saveLessonProgress
} from "../services/progressService";

import {
submitQuizAttempt,
getQuizQuestions,
giveBadge
} from "../services/quizService";

import {
CheckCircle2,
Trophy,
ArrowRight,
Loader2
} from "lucide-react";

export default function ExerciseQuiz({
quizId,
lessonId
}) {

// ====================================
// STATE
// ====================================

const [answers, setAnswers] = useState({});
const [result, setResult] = useState(null);
const [questions, setQuestions] = useState([]);
const [loading, setLoading] = useState(true);
const [validating, setValidating] = useState(false);

// ====================================
// CHARGEMENT QUESTIONS
// ====================================

useEffect(() => {

if (!quizId) return;

loadQuestions();

}, [quizId]);

async function loadQuestions() {

setLoading(true);

try {

  const data =
    await getQuizQuestions(quizId);

  const formatted =
    (data || []).map(
      question => ({

        ...question,

        choices:
          question.choices ||
          question.options ||
          []

      })
    );

  console.log(
    "QUESTIONS CHARGEES",
    formatted
  );

console.table(
  formatted.map((q, index) => ({
    question: index + 1,
    texte: q.question,
    choix: q.choices.join(" | "),
    correct_index: q.correct_index,
    correct_reponse:
      q.choices[q.correct_index]
  }))
);

  setQuestions(formatted);

}

catch (error) {

  console.error(
    "Erreur chargement questions",
    error
  );

  setQuestions([]);

}

finally {

  setLoading(false);

}

}

// ====================================
// CHOIX RÉPONSE
// ====================================

function chooseAnswer(
questionIndex,
answerIndex
) {

if (validating || result) return;

setAnswers(
  previous => ({

    ...previous,

    [questionIndex]:
      answerIndex

  })
);

}

// ====================================
// VALIDATION
// ====================================

async function validateQuiz() {

if (validating) return;

if (questions.length === 0) {
  return;
}

setValidating(true);

try {

  /*
    Vérifier utilisateur connecté.

    Le quiz lui-même peut fonctionner
    offline. La session sert uniquement
    à récupérer user.id.
  */

  const {
    data: {
      session
    }
  } =
    await import(
      "../lib/supabase"
    ).then(
      module =>
        module.supabase.auth.getSession()
    );

  const user =
    session?.user;

  if (!user) {

    console.error(
      "Utilisateur non connecté"
    );

    return;

  }

  console.log(
    "REPONSES UTILISATEUR",
    answers
  );

  // ====================================
  // CORRECTION + SAUVEGARDE
  // ====================================

  const quizResult =
    await submitQuizAttempt(

      user.id,

      quizId,

      lessonId,

      answers,

      questions

    );

  if (!quizResult) {

    throw new Error(
      "Résultat quiz indisponible."
    );

  }

  console.log(
    "RÉSULTAT QUIZ",
    quizResult
  );

  // ====================================
  // XP
  // ====================================

  let xpResult = null;

  if (
    quizResult.xp > 0
  ) {

    xpResult =
      await addXP(

        user.id,

        quizResult.xp

      );

  }

  // ====================================
  // PROGRESSION
  // ====================================

  await saveLessonProgress({

    userId:
      user.id,

    lessonId,

    score:
      quizResult.score

  });

  // ====================================
  // BADGE
  // ====================================

  if (
    quizResult.score >= 80
  ) {

    await giveBadge(

      user.id,

      "Élève brillant"

    );

  }

  // ====================================
  // RÉSULTAT UI
  // ====================================

  setResult({

    score:
      quizResult.score,

    xp:
      quizResult.xp,

    correct:
      quizResult.correct,

    synced:
      quizResult.synced,

    pendingXP:
      xpResult?.pending || false

  });

}

catch (error) {

  console.error(
    "Erreur validation quiz :",
    error
  );

}

finally {

  setValidating(false);

}

}

// ====================================
// CONTINUER
// ====================================

function continueQuiz() {

window.history.back();

}

// ====================================
// TEXTE DU SCORE
// ====================================

function getResultMessage(score) {

if (score >= 80) {
  return "Excellent travail !";
}

if (score >= 50) {
  return "Bon travail ! Continue tes efforts.";
}

return "Continue à apprendre, tu vas progresser !";

}

// ====================================
// LOADING
// ====================================

if (loading) {

return (

  <div className="
    bg-white
    rounded-2xl
    shadow-sm
    p-8
    text-center
  ">

    <Loader2
      size={28}
      className="
        mx-auto
        mb-3
        animate-spin
        text-blue-600
      "
    />

    <p className="
      text-gray-500
    ">

      Chargement du quiz...

    </p>

  </div>

);

}

// ====================================
// AUCUNE QUESTION
// ====================================

if (
questions.length === 0
) {

return (

  <div className="
    bg-white
    rounded-2xl
    shadow-sm
    p-8
    text-center
  ">

    <p className="
      text-gray-500
    ">

      Aucune question trouvée.

    </p>

  </div>

);

}

// ====================================
// RÉSULTAT
// ====================================

if (result) {

return (

  <div className="
    space-y-5
  ">

    {/* TITRE */}

    <div>

      <p className="
        text-sm
        font-medium
        text-blue-600
        mb-1
      ">

        Quiz terminé

      </p>

      <h2 className="
        text-2xl
        font-bold
        text-gray-900
      ">

        Ton résultat

      </h2>

    </div>


    {/* CARTE RÉSULTAT */}

    <div className="
      bg-white
      rounded-2xl
      shadow-sm
      border
      border-gray-100
      p-6
      text-center
    ">

      <div className="
        w-16
        h-16
        mx-auto
        mb-4
        rounded-full
        bg-blue-50
        flex
        items-center
        justify-center
      ">

        <Trophy
          size={30}
          className="text-blue-600"
        />

      </div>


      <h3 className="
        text-xl
        font-bold
        text-gray-900
      ">

        {getResultMessage(
          result.score
        )}

      </h3>


      <p className="
        text-gray-500
        mt-1
      ">

        Tu as obtenu

      </p>


      {/* SCORE */}

      <div className="
        text-4xl
        font-bold
        text-blue-600
        mt-2
      ">

        {result.score}%

      </div>


      {/* INFOS */}

      <div className="
        grid
        grid-cols-2
        gap-3
        mt-6
      ">

        <div className="
          rounded-xl
          bg-gray-50
          p-3
        ">

          <p className="
            text-xs
            text-gray-500
          ">

            Bonnes réponses

          </p>

          <p className="
            font-bold
            text-gray-900
            mt-1
          ">

            {result.correct}/{questions.length}

          </p>

        </div>


        <div className="
          rounded-xl
          bg-gray-50
          p-3
        ">

          <p className="
            text-xs
            text-gray-500
          ">

            XP gagnés

          </p>

          <p className="
            font-bold
            text-gray-900
            mt-1
          ">

            +{result.xp} XP

          </p>

        </div>

      </div>


      {/* SYNCHRONISATION */}

      <div className="
        mt-5
        text-sm
      ">

        {result.synced ? (

          <p className="
            text-green-600
          ">

            ☁️ Résultat synchronisé

          </p>

        ) : (

          <p className="
            text-orange-600
          ">

            💾 Résultat sauvegardé hors ligne

          </p>

        )}

      </div>


      {/* CONTINUER */}

      <button

        type="button"

        onClick={
          continueQuiz
        }

        className="
          w-full
          mt-6
          flex
          items-center
          justify-center
          gap-2
          bg-blue-600
          text-white
          font-semibold
          px-5
          py-3
          rounded-xl
          hover:bg-blue-700
          transition
        "

      >

        Continuer

        <ArrowRight
          size={18}
        />

      </button>

    </div>

  </div>

);

}

// ====================================
// INTERFACE QUIZ
// ====================================

const answeredCount =
Object.keys(answers).length;

const progress =
Math.round(
(
answeredCount /
questions.length
) * 100
);

return (

<div className="
  space-y-6
">

  {/* EN-TÊTE */}

  <div>

    <p className="
      text-sm
      font-medium
      text-blue-600
      mb-1
    ">




    </p>

    <h2 className="
      text-2xl
      font-bold
      text-gray-900
    ">

      Vérifie tes connaissances

    </h2>

    <p className="
      text-gray-500
      mt-1
    ">

      Choisis une réponse pour chaque question.

    </p>

  </div>


  {/* PROGRESSION */}

  <div className="
    bg-white
    rounded-2xl
    shadow-sm
    border
    border-gray-100
    p-4
  ">

    <div className="
      flex
      items-center
      justify-between
      text-sm
      mb-2
    ">

      <span className="
        font-medium
        text-gray-700
      ">

        Progression

      </span>

      <span className="
        text-gray-500
      ">

        {answeredCount}/{questions.length}

      </span>

    </div>


    <div className="
      h-2
      bg-gray-100
      rounded-full
      overflow-hidden
    ">

      <div
        className="
          h-full
          bg-blue-600
          rounded-full
          transition-all
        "
        style={{
          width: `${progress}%`
        }}
      />

    </div>

  </div>


  {/* QUESTIONS */}

  <div className="
    space-y-4
  ">

    {questions.map(
      (question, index) => (

        <div
          key={question.id}
          className="
            bg-white
            rounded-2xl
            shadow-sm
            border
            border-gray-100
            p-5
          "
        >

          {/* NUMÉRO */}

          <div className="
            flex
            items-start
            gap-3
            mb-4
          ">

            <div className="
              shrink-0
              w-8
              h-8
              rounded-full
              bg-blue-50
              text-blue-600
              flex
              items-center
              justify-center
              text-sm
              font-bold
            ">

              {index + 1}

            </div>


            <p className="
              font-semibold
              text-gray-900
              leading-6
            ">

              {question.question}

            </p>

          </div>


          {/* RÉPONSES */}

          <div className="
            space-y-2
          ">

            {question.choices.map(
              (
                choice,
                choiceIndex
              ) => {

                const selected =
                  answers[index] ===
                  choiceIndex;

                return (

                  <button

                    key={choiceIndex}

                    type="button"

                    onClick={() =>
                      chooseAnswer(
                        index,
                        choiceIndex
                      )
                    }

                    disabled={
                      validating
                    }

                    className={`
                      w-full
                      flex
                      items-center
                      gap-3
                      text-left
                      px-4
                      py-3
                      rounded-xl
                      border
                      transition
                      ${
                        selected
                          ? `
                            bg-blue-50
                            border-blue-500
                            text-blue-700
                          `
                          : `
                            bg-white
                            border-gray-200
                            text-gray-700
                            hover:bg-gray-50
                            hover:border-gray-300
                          `
                      }
                      ${
                        validating
                          ? `
                            opacity-60
                            cursor-not-allowed
                          `
                          : ""
                      }
                    `}

                  >

                    <span className={`
                      shrink-0
                      w-7
                      h-7
                      rounded-full
                      flex
                      items-center
                      justify-center
                      text-xs
                      font-semibold
                      ${
                        selected
                          ? `
                            bg-blue-600
                            text-white
                          `
                          : `
                            bg-gray-100
                            text-gray-500
                          `
                      }
                    `}>

                      {String.fromCharCode(
                        65 + choiceIndex
                      )}

                    </span>


                    <span className="
                      flex-1
                    ">

                      {choice}

                    </span>


                    {selected && (

                      <CheckCircle2
                        size={18}
                        className="
                          text-blue-600
                        "
                      />

                    )}

                  </button>

                );

              }

            )}

          </div>

        </div>

      )

    )}

  </div>


  {/* BOUTON VALIDATION */}

  <button

    type="button"

    onClick={
      validateQuiz
    }

    disabled={
      validating ||
      answeredCount <
      questions.length
    }

    className="
      w-full
      flex
      items-center
      justify-center
      gap-2
      bg-blue-600
      text-white
      font-semibold
      px-6
      py-3.5
      rounded-xl
      shadow-sm
      hover:bg-blue-700
      transition
      disabled:opacity-50
      disabled:cursor-not-allowed
    "

  >

    {validating ? (

      <>
        <Loader2
          size={19}
          className="
            animate-spin
          "
        />

        Validation...

      </>

    ) : (

      <>
        <CheckCircle2
          size={19}
        />

        Valider le quiz

      </>

    )}

  </button>

</div>

);

}
