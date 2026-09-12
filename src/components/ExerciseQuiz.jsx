// src/components/ExerciseQuiz.jsx

import {
  useEffect,
  useState
} from "react";

import {
  useLocation
} from "react-router-dom";

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
  lessonId,
  consultationMode = false
}) {

  const location =
    useLocation();


  // ====================================
  // 👁️ MODE APERÇU DE L'APPLICATION
  // ====================================

  const isStudentPreview =
    location.pathname.startsWith(
      "/admin/student-preview"
    );


  // ====================================
  // STATE
  // ====================================

  const [answers, setAnswers] =
    useState({});

  const [result, setResult] =
    useState(null);

  const [questions, setQuestions] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [validating, setValidating] =
    useState(false);


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
        await getQuizQuestions(
          quizId
        );


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


      setQuestions(
        formatted
      );

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

    if (
      validating ||
      result
    ) {
      return;
    }


    setAnswers(
      previous => ({

        ...previous,

        [questionIndex]:
          answerIndex

      })
    );

  }


  // ====================================
  // CORRECTION LOCALE
  // ====================================
  //
  // Utilisée en mode :
  // - consultation
  // - aperçu
  //
  // IMPORTANT :
  // aucune sauvegarde Dexie,
  // aucune écriture Supabase,
  // aucun XP réel,
  // aucune progression,
  // aucun badge,
  // aucune syncQueue.
  //
  // ====================================

  function calculateReadonlyResult() {

    let correct = 0;


    questions.forEach(
      (question, index) => {

        const userAnswer =
          answers?.[index];

        const correctIndex =
          Number(
            question.correct_index
          );


        const isCorrect =
          Number(userAnswer) ===
          correctIndex;


        console.log(
          isStudentPreview
            ? `👁️ [APERÇU] QUESTION ${index + 1}`
            : `👁️ [CONSULTATION] QUESTION ${index + 1}`,
          {
            userAnswer,
            userAnswerText:
              question.choices?.[
                Number(userAnswer)
              ],

            correctIndex,

            correctAnswerText:
              question.choices?.[
                correctIndex
              ],

            isCorrect
          }
        );


        if (isCorrect) {
          correct++;
        }

      }
    );


    const total =
      questions.length;


    const score =
      total > 0

        ? Math.round(
            (correct / total) * 100
          )

        : 0;


    const passed =
      score >= 80;


    let xp = 20;


    if (score >= 80) {

      xp = 100;

    }
    else if (score >= 50) {

      xp = 50;

    }


    return {

      score,
      correct,
      total,
      passed,
      xp

    };

  }


  // ====================================
  // VALIDATION
  // ====================================

  async function validateQuiz() {

    if (validating) {
      return;
    }


    if (questions.length === 0) {
      return;
    }


    setValidating(true);


    try {

      // ==================================
      // 👁️ MODE CONSULTATION
      // ==================================

      if (consultationMode && !isStudentPreview) {

        console.log(
          "👁️ [CONSULTATION] Correction locale du quiz"
        );


        const quizResult =
          calculateReadonlyResult();


        setResult({

          score:
            quizResult.score,

          xp:
            quizResult.xp,

          correct:
            quizResult.correct,

          synced:
            false,

          pendingXP:
            false,

          consultation:
            true,

          preview:
            false

        });


        return;

      }


      // ==================================
      // 👁️ MODE APERÇU
      // ==================================

      if (isStudentPreview) {

        console.log(
          "👁️ [APERÇU] Correction locale du quiz"
        );


        const quizResult =
          calculateReadonlyResult();


        setResult({

          score:
            quizResult.score,

          xp:
            quizResult.xp,

          correct:
            quizResult.correct,

          synced:
            false,

          pendingXP:
            false,

          consultation:
            false,

          preview:
            true

        });


        return;

      }


      // ==================================
      // MODE ÉLÈVE NORMAL
      // ==================================

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


      await saveLessonProgress({

        userId:
          user.id,

        lessonId,

        score:
          quizResult.score

      });


      if (
        quizResult.score >= 80
      ) {

        await giveBadge(

          user.id,

          "Élève brillant"

        );

      }


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
          xpResult?.pending ||
          false,

        consultation:
          false,

        preview:
          false

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

        <Loader2
          size={28}
          className="
            mx-auto
            mb-3
            animate-spin
            text-accent
          "
        />


        <p
          className="
            theme-text-secondary
          "
        >

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

        <p
          className="
            theme-text-secondary
          "
        >

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

      <div
        className="
          space-y-5
        "
      >

        {/* TITRE */}

        <div>

          <p
            className="
              text-sm
              font-semibold
              text-accent
              mb-1
            "
          >

            {result.preview
              ? "Quiz aperçu"
              : result.consultation
                ? "Quiz consulté"
                : "Quiz terminé"}

          </p>


          <h2
            className="
              text-2xl
              font-bold
              theme-text
            "
          >

            {result.preview
              ? "Résultat de l'aperçu"
              : result.consultation
                ? "Résultat de la consultation"
                : "Ton résultat"}

          </h2>

        </div>


        {/* =================================================
            CARTE RÉSULTAT
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
          "
        >

          {/* CERCLES */}

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
              text-center
            "
          >

            {/* ICÔNE */}

            <div
              className="
                w-16
                h-16
                mx-auto
                mb-4
                rounded-2xl
                bg-accent
                text-white
                flex
                items-center
                justify-center
              "
            >

              <Trophy
                size={30}
              />

            </div>


            {/* MESSAGE */}

            <h3
              className="
                text-xl
                font-bold
                theme-text
              "
            >

              {getResultMessage(
                result.score
              )}

            </h3>


            <p
              className="
                theme-text-secondary
                mt-1
              "
            >

              Tu as obtenu

            </p>


            {/* SCORE */}

            <div
              className="
                text-4xl
                md:text-5xl
                font-extrabold
                text-accent
                mt-2
              "
            >

              {result.score}%

            </div>


            {/* INFOS */}

            <div
              className="
                grid
                grid-cols-2
                gap-3
                mt-6
              "
            >

              <div
                className="
                  theme-surface
                  rounded-2xl
                  border
                  theme-border
                  p-4
                "
              >

                <p
                  className="
                    text-xs
                    theme-text-secondary
                  "
                >
                  Bonnes réponses
                </p>


                <p
                  className="
                    font-extrabold
                    theme-text
                    text-lg
                    mt-1
                  "
                >

                  {result.correct}/
                  {questions.length}

                </p>

              </div>


              <div
                className="
                  theme-surface
                  rounded-2xl
                  border
                  theme-border
                  p-4
                "
              >

                <p
                  className="
                    text-xs
                    theme-text-secondary
                  "
                >

                  {result.preview ||
                  result.consultation
                    ? "XP théoriques"
                    : "XP gagnés"}

                </p>


                <p
                  className="
                    font-extrabold
                    theme-text
                    text-lg
                    mt-1
                  "
                >

                  +{result.xp} XP

                </p>

              </div>

            </div>


            {/* SYNCHRONISATION / CONSULTATION / APERÇU */}

            <div
              className="
                mt-5
                text-sm
                font-medium
                text-accent
              "
            >

              {result.preview ? (

                <p>
                  👁️ Mode aperçu — aucune donnée d'élève n'a été modifiée
                </p>

              ) : result.consultation ? (

                <p>
                  👁️ Mode consultation — aucune donnée élève modifiée
                </p>

              ) : result.synced ? (

                <p>
                  ☁️ Résultat synchronisé
                </p>

              ) : (

                <p>
                  💾 Résultat sauvegardé hors ligne
                </p>

              )}

            </div>


            {/* CONTINUER */}

            <button
              type="button"
              onClick={continueQuiz}
              className="
                w-full
                mt-6
                flex
                items-center
                justify-center
                gap-2
                bg-accent
                text-white
                font-bold
                px-5
                py-3
                rounded-xl
                shadow-md
                hover:opacity-90
                hover:-translate-y-0.5
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

    <div
      className="
        space-y-6
      "
    >

      {/* ====================================
          EN-TÊTE
      ==================================== */}

      <div
        className="
          theme-surface
          rounded-3xl
          border
          theme-border
          shadow-sm
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
              w-12
              h-12
              shrink-0
              rounded-2xl
              bg-accent-soft
              text-accent
              flex
              items-center
              justify-center
            "
          >

            <Trophy
              size={24}
            />

          </div>


          <div>

            <p
              className="
                text-sm
                font-semibold
                text-accent
                mb-1
              "
            >

              {isStudentPreview
                ? "Quiz aperçu"
                : consultationMode
                  ? "Quiz en consultation"
                  : "Quiz de validation"}

            </p>


            <h2
              className="
                text-2xl
                font-bold
                theme-text
              "
            >

              {isStudentPreview
                ? "Aperçu du quiz"
                : consultationMode
                  ? "Consulte les connaissances de l'élève"
                  : "Vérifie tes connaissances"}

            </h2>


            <p
              className="
                theme-text-secondary
                mt-1
              "
            >

              {isStudentPreview
                ? "Réponds aux questions pour visualiser le résultat. Aucune donnée élève ne sera modifiée."
                : "Choisis une réponse pour chaque question."}

            </p>

          </div>

        </div>

      </div>


      {/* ====================================
          PROGRESSION
      ==================================== */}

      <div
        className="
          theme-surface
          rounded-2xl
          shadow-sm
          border
          theme-border
          p-4
        "
      >

        <div
          className="
            flex
            items-center
            justify-between
            text-sm
            mb-2
          "
        >

          <span
            className="
              font-medium
              theme-text
            "
          >
            Progression
          </span>


          <span
            className="
              theme-text-secondary
            "
          >

            {answeredCount}/{questions.length}

          </span>

        </div>


        <div
          className="
            h-2
            bg-gray-100
            dark:bg-gray-800
            rounded-full
            overflow-hidden
          "
        >

          <div
            className="
              h-full
              bg-accent
              rounded-full
              transition-all
            "
            style={{
              width: `${progress}%`
            }}
          />

        </div>

      </div>


      {/* ====================================
          QUESTIONS
      ==================================== */}

      <div
        className="
          space-y-4
        "
      >

        {questions.map(
          (
            question,
            index
          ) => (

            <div
              key={question.id}
              className="
                theme-surface
                rounded-2xl
                shadow-sm
                border
                theme-border
                p-5
              "
            >

              <div
                className="
                  flex
                  items-start
                  gap-3
                  mb-4
                "
              >

                <div
                  className="
                    shrink-0
                    w-8
                    h-8
                    rounded-full
                    bg-accent-soft
                    text-accent
                    flex
                    items-center
                    justify-center
                    text-sm
                    font-bold
                  "
                >

                  {index + 1}

                </div>


                <p
                  className="
                    font-semibold
                    theme-text
                    leading-6
                  "
                >

                  {question.question}

                </p>

              </div>


              <div
                className="
                  space-y-2
                "
              >

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
                                bg-accent-soft
                                border-accent
                                text-accent
                              `
                              : `
                                theme-surface
                                theme-border
                                theme-text
                                hover:bg-gray-50
                                dark:hover:bg-gray-800
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

                        <span
                          className={`
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
                                  bg-accent
                                  text-white
                                `
                                : `
                                  bg-gray-100
                                  dark:bg-gray-800
                                  theme-text-secondary
                                `
                            }
                          `}
                        >

                          {String.fromCharCode(
                            65 + choiceIndex
                          )}

                        </span>


                        <span
                          className="
                            flex-1
                          "
                        >

                          {choice}

                        </span>


                        {selected && (

                          <CheckCircle2
                            size={18}
                            className="
                              text-accent
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


      {/* ====================================
          BOUTON VALIDATION
      ==================================== */}

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
          bg-accent
          text-white
          font-semibold
          px-6
          py-3.5
          rounded-xl
          shadow-sm
          hover:opacity-90
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

            {isStudentPreview
              ? "Voir le résultat"
              : consultationMode
                ? "Voir le résultat"
                : "Valider le quiz"}

          </>

        )}

      </button>

    </div>

  );

}