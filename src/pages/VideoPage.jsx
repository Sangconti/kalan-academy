// src/pages/VideoPage.jsx

import {
  useEffect,
  useState
} from "react";

import {
  useParams,
  useNavigate
} from "react-router-dom";

import {
  supabase
} from "../lib/supabase";

import {
  getLesson
} from "../services/educationService";

import {
  addXP
} from "../services/xpService";

import {
  unlockBadge
} from "../services/badgeService";

import {
  ArrowLeft,
  PlayCircle,
  CheckCircle2,
  Trophy,
  Award,
  BookOpen,
  Loader2,
  CircleHelp
} from "lucide-react";

export default function VideoPage() {

  const { lessonId } = useParams();

  const navigate = useNavigate();

  const [lesson, setLesson] = useState(null);

  const [quiz, setQuiz] = useState(null);

  const [questions, setQuestions] = useState([]);

  const [answers, setAnswers] = useState({});

  const [result, setResult] = useState(null);

  const [loading, setLoading] = useState(true);

  const [validating, setValidating] = useState(false);

  const [user, setUser] = useState(null);


  // ==========================================
  // CHARGEMENT
  // ==========================================

  useEffect(() => {

    loadData();

  }, [lessonId]);


  async function loadData() {

    try {

      setLoading(true);


      // ========================================
      // UTILISATEUR
      // ========================================

      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();


      setUser(user);


      // ========================================
      // LEÇON
      // ========================================

      const lessonData =
        await getLesson(lessonId);


      setLesson(lessonData);


      if (!lessonData) {

        return;

      }


      // ========================================
      // QUIZ
      // ========================================

      const {
        data: quizData,
        error: quizError
      } = await supabase

        .from("quizzes")

        .select("*")

        .eq(
          "lesson_id",
          lessonId
        )

        .maybeSingle();


      if (quizError) {

        console.warn(
          "Erreur chargement quiz :",
          quizError
        );

        return;

      }


      if (!quizData) {

        return;

      }


      setQuiz(quizData);


      // ========================================
      // QUESTIONS
      // ========================================

      const {
        data: questionsData,
        error: questionsError
      } = await supabase

        .from("quiz_questions")

        .select("*")

        .eq(
          "quiz_id",
          quizData.id
        )

        .order(
          "order_number",
          {
            ascending: true
          }
        );


      if (questionsError) {

        throw questionsError;

      }


      setQuestions(
        (questionsData || []).map(
          question => ({

            ...question,

            choices:
              question.choices ||
              question.options ||
              []

          })
        )
      );


    }

    catch (error) {

      console.error(
        "Chargement VideoPage :",
        error
      );

    }

    finally {

      setLoading(false);

    }

  }


  // ==========================================
  // CHOIX RÉPONSE
  // ==========================================

  function chooseAnswer(
    questionId,
    index
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

        [questionId]: index

      })
    );

  }


  // ==========================================
  // VALIDATION QUIZ
  // ==========================================

  async function validateQuiz() {

    if (
      validating ||
      result ||
      !user ||
      !quiz ||
      questions.length === 0
    ) {

      return;

    }


    if (
      Object.keys(answers).length <
      questions.length
    ) {

      return;

    }


    setValidating(true);


    try {

      let goodAnswers = 0;


      // ======================================
      // CORRECTION
      // ======================================

      questions.forEach(
        question => {

          if (
            answers[question.id] ===
            question.correct_index
          ) {

            goodAnswers++;

          }

        }
      );


      const score =
        Math.round(
          (
            goodAnswers /
            questions.length
          ) * 100
        );


      // ======================================
      // SAUVEGARDE TENTATIVE
      // ======================================

      const {
        error: attemptError
      } = await supabase

        .from("quiz_attempts")

        .insert({

          user_id:
            user.id,

          quiz_id:
            quiz.id,

          score

        });


      if (attemptError) {

        console.warn(
          "Erreur sauvegarde tentative :",
          attemptError
        );

      }


      // ======================================
      // PROGRESSION
      // ======================================

      const {
        error: progressError
      } = await supabase

        .from("user_progress")

        .upsert({

          user_id:
            user.id,

          lesson_id:
            lessonId,

          last_score:
            score,

          completion_percentage:
            score,

          completed:
            score >= 80,

          completed_at:
            score >= 80
              ? new Date().toISOString()
              : null

        });


      if (progressError) {

        console.warn(
          "Erreur progression :",
          progressError
        );

      }


      // ======================================
      // XP
      // ======================================

      let xpGain = 50;


      if (score >= 80) {

        xpGain = 100;


        try {

          await unlockBadge(
            user.id,
            "Élève brillant"
          );

        }

        catch (badgeError) {

          console.warn(
            "Badge non attribué :",
            badgeError
          );

        }

      }


      // ======================================
      // AJOUT XP
      // ======================================

      const levelData =
        await addXP(
          user.id,
          xpGain
        );


      // ======================================
      // RÉSULTAT
      // ======================================

      setResult({

        score,

        goodAnswers,

        total:
          questions.length,

        xp:
          xpGain,

        level:
          levelData?.level ||
          null

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


  // ==========================================
  // MESSAGE SCORE
  // ==========================================

  function getResultMessage(score) {

    if (score >= 80) {

      return "Excellent travail !";

    }

    if (score >= 50) {

      return "Bon travail !";

    }

    return "Continue tes efforts !";

  }


  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {

    return (

      <div className="
        min-h-[60vh]
        flex
        flex-col
        items-center
        justify-center
        px-6
      ">

        <div className="
          w-14
          h-14
          rounded-2xl
          bg-blue-100
          flex
          items-center
          justify-center
          mb-4
        ">

          <Loader2
            size={28}
            className="
              text-blue-600
              animate-spin
            "
          />

        </div>


        <p className="
          text-gray-600
          font-medium
        ">

          Chargement de la vidéo...

        </p>

      </div>

    );

  }


  // ==========================================
  // LEÇON INTROUVABLE
  // ==========================================

  if (!lesson) {

    return (

      <div className="
        max-w-3xl
        mx-auto
        px-5
        py-10
        text-center
      ">

        <div className="
          bg-white
          rounded-2xl
          border
          border-gray-100
          shadow-sm
          p-8
        ">

          <BookOpen
            size={40}
            className="
              mx-auto
              mb-4
              text-gray-300
            "
          />

          <h1 className="
            text-xl
            font-bold
            text-gray-900
          ">

            Leçon introuvable

          </h1>


          <button
            onClick={() =>
              navigate(-1)
            }
            className="
              mt-5
              inline-flex
              items-center
              gap-2
              bg-blue-600
              text-white
              px-5
              py-3
              rounded-xl
              font-semibold
              hover:bg-blue-700
              transition
            "
          >

            <ArrowLeft size={18} />

            Retour

          </button>

        </div>

      </div>

    );

  }


  // ==========================================
  // PROGRESSION QUESTIONS
  // ==========================================

  const answeredCount =
    Object.keys(answers).length;


  const progress =
    questions.length > 0
      ? Math.round(
          (
            answeredCount /
            questions.length
          ) * 100
        )
      : 0;


  // ==========================================
  // INTERFACE
  // ==========================================

  return (

    <div className="
      min-h-screen
      bg-gray-50
      pb-10
    ">


      {/* =====================================
          HEADER
      ====================================== */}

      <div className="
        bg-white
        border-b
        border-gray-100
        px-5
        py-4
      ">

        <button
          onClick={() =>
            navigate("/")
          }
          className="
            flex
            items-center
            gap-3
            text-xl
            font-bold
            text-gray-900
            hover:text-blue-600
            transition
          "
        >

          <span className="
            w-9
            h-9
            rounded-xl
            bg-blue-600
            text-white
            flex
            items-center
            justify-center
          ">

            🎓

          </span>

          Kalan Academy

        </button>

      </div>


      {/* =====================================
          CONTENU
      ====================================== */}

      <div className="
        max-w-4xl
        mx-auto
        px-5
        py-6
      ">


        {/* ===================================
            NAVIGATION
        ==================================== */}

        <button
          onClick={() =>
            navigate(-1)
          }
          className="
            inline-flex
            items-center
            gap-2
            text-sm
            font-medium
            text-gray-600
            hover:text-blue-600
            transition
            mb-5
          "
        >

          <ArrowLeft size={18} />

          Retour à la leçon

        </button>


        {/* ===================================
            TITRE
        ==================================== */}

        <div className="mb-5">

          <p className="
            text-sm
            font-medium
            text-blue-600
            mb-1
          ">

            🎬 Vidéo de cours

          </p>


          <h1 className="
            text-2xl
            md:text-3xl
            font-bold
            text-gray-900
          ">

            {lesson.title}

          </h1>


          {lesson.description && (

            <p className="
              text-gray-500
              mt-2
              leading-relaxed
            ">

              {lesson.description}

            </p>

          )}

        </div>


        {/* ===================================
            VIDÉO
        ==================================== */}

        <div className="
          bg-black
          rounded-3xl
          overflow-hidden
          shadow-xl
          mb-6
          aspect-video
        ">

          {lesson.video_url ? (

            <video
              controls
              playsInline
              preload="metadata"
              src={lesson.video_url}
              className="
                w-full
                h-full
                object-contain
              "
            />

          ) : (

            <div className="
              w-full
              h-full
              flex
              flex-col
              items-center
              justify-center
              text-white
              px-6
              text-center
            ">

              <PlayCircle
                size={50}
                className="
                  text-gray-500
                  mb-4
                "
              />

              <p className="
                font-semibold
              ">

                Vidéo indisponible

              </p>


              <p className="
                text-sm
                text-gray-400
                mt-1
              ">

                Cette leçon ne contient pas encore
                de vidéo.

              </p>

            </div>

          )}

        </div>


        {/* ===================================
            INFORMATIONS LEÇON
        ==================================== */}

        <div className="
          bg-white
          rounded-2xl
          border
          border-gray-100
          shadow-sm
          p-5
          mb-8
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
              bg-blue-50
              flex
              items-center
              justify-center
            ">

              <BookOpen
                size={22}
                className="text-blue-600"
              />

            </div>


            <div>

              <p className="
                text-sm
                text-gray-500
              ">

                Leçon

              </p>

              <p className="
                font-semibold
                text-gray-900
              ">

                Apprends la leçon puis
                vérifie tes connaissances.

              </p>

            </div>

          </div>

        </div>


        {/* ===================================
            QUIZ
        ==================================== */}

        {questions.length > 0 && (

          <div>

            {/* TITRE QUIZ */}

            <div className="
              mb-5
            ">

              <div className="
                flex
                items-center
                gap-3
                mb-2
              ">

                <div className="
                  w-11
                  h-11
                  rounded-xl
                  bg-purple-50
                  flex
                  items-center
                  justify-center
                ">

                  <CircleHelp
                    size={23}
                    className="text-purple-600"
                  />

                </div>


                <div>

                  <p className="
                    text-sm
                    font-medium
                    text-purple-600
                  ">

                  </p>

                  <h2 className="
                    text-xl
                    font-bold
                    text-gray-900
                  ">

                    Vérifie tes connaissances

                  </h2>

                </div>

              </div>


              <p className="
                text-sm
                text-gray-500
                mt-2
              ">

                Réponds à toutes les questions
                pour valider le quiz.

              </p>

            </div>


            {/* PROGRESSION */}

            {!result && (

              <div className="
                mb-5
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

                    {answeredCount}/
                    {questions.length}

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
                      width:
                        `${progress}%`
                    }}
                  />

                </div>

              </div>

            )}


            {/* =================================
                RÉSULTAT
            ================================== */}

            {result ? (

              <div className="
                bg-white
                rounded-3xl
                border
                border-gray-100
                shadow-sm
                p-6
                md:p-8
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
                    size={32}
                    className="text-blue-600"
                  />

                </div>


                <p className="
                  text-sm
                  font-medium
                  text-blue-600
                ">

                  Quiz terminé

                </p>


                <h2 className="
                  text-2xl
                  font-bold
                  text-gray-900
                  mt-1
                ">

                  {getResultMessage(
                    result.score
                  )}

                </h2>


                <div className="
                  text-5xl
                  font-bold
                  text-blue-600
                  mt-4
                ">

                  {result.score}%

                </div>


                <p className="
                  text-gray-500
                  mt-2
                ">

                  {result.goodAnswers}
                  /
                  {result.total}
                  {" "}
                  bonnes réponses

                </p>


                <div className="
                  grid
                  grid-cols-2
                  gap-3
                  mt-6
                ">

                  <div className="
                    bg-gray-50
                    rounded-xl
                    p-4
                  ">

                    <Award
                      size={20}
                      className="
                        mx-auto
                        text-yellow-500
                        mb-2
                      "
                    />

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


                  <div className="
                    bg-gray-50
                    rounded-xl
                    p-4
                  ">

                    <Trophy
                      size={20}
                      className="
                        mx-auto
                        text-blue-600
                        mb-2
                      "
                    />

                    <p className="
                      text-xs
                      text-gray-500
                    ">

                      Niveau

                    </p>


                    <p className="
                      font-bold
                      text-gray-900
                      mt-1
                    ">

                      {result.level || "-"}

                    </p>

                  </div>

                </div>


                <button
                  onClick={() =>
                    navigate(
                      `/lesson/${lessonId}`
                    )
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

                  <ArrowLeft
                    size={18}
                  />

                  Retour à la leçon

                </button>

              </div>

            ) : (

              <>
                {/* QUESTIONS */}

                <div className="
                  space-y-4
                ">

                  {questions.map(
                    (
                      question,
                      index
                    ) => (

                      <div
                        key={question.id}
                        className="
                          bg-white
                          rounded-2xl
                          border
                          border-gray-100
                          shadow-sm
                          p-5
                        "
                      >

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


                        <div className="
                          space-y-2
                        ">

                          {question.choices.map(
                            (
                              choice,
                              choiceIndex
                            ) => {

                              const selected =
                                answers[
                                  question.id
                                ] ===
                                choiceIndex;


                              return (

                                <button
                                  key={
                                    choiceIndex
                                  }
                                  type="button"
                                  onClick={() =>
                                    chooseAnswer(
                                      question.id,
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
                                            bg-blue-600
                                            text-white
                                          `
                                          : `
                                            bg-gray-100
                                            text-gray-500
                                          `
                                      }
                                    `}
                                  >

                                    {String.fromCharCode(
                                      65 +
                                      choiceIndex
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


                {/* VALIDATION */}

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
                    mt-6
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

              </>

            )}

          </div>

        )}

      </div>

    </div>

  );

}