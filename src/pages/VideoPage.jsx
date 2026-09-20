// src/pages/VideoPage.jsx

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
  CircleHelp,
  GraduationCap
} from "lucide-react";


export default function VideoPage({
  consultationMode = false
}) {

  const {
    lessonId,
    studentId
  } = useParams();

  const navigate = useNavigate();

  const location = useLocation();


  // ==========================================
  // MODE CONSULTATION ADMIN
  // ==========================================

  const isConsultation =
    consultationMode ||
    location.state?.consultationMode === true ||
    (
      Boolean(studentId) &&
      location.pathname.includes("/admin/student/") &&
      location.pathname.includes("/consultation")
    );


  // ==========================================
  // MODE APERÇU APPLICATION ÉLÈVE
  // ==========================================

  const isStudentPreview =
    location.pathname.startsWith(
      "/admin/student-preview"
    );


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

  }, [
    lessonId,
    isConsultation,
    isStudentPreview
  ]);


  async function loadData() {

    try {

      setLoading(true);


      // ========================================
      // UTILISATEUR
      // ========================================

      if (
        !isConsultation &&
        !isStudentPreview
      ) {

        const {
          data: {
            user
          }
        } = await supabase.auth.getUser();


        setUser(user);

      } else {

        if (isStudentPreview) {

          console.log(
            "👁️ [APERÇU] VideoPage — aucune donnée élève ne sera modifiée."
          );

        } else {

          console.log(
            "👁️ [CONSULTATION] VideoPage — aucune donnée élève ne sera modifiée."
          );

        }


        setUser(null);

      }


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
  // CALCUL RÉSULTAT LECTURE SEULE
  // ==========================================

  function calculateReadonlyResult() {

    let goodAnswers = 0;


    questions.forEach(
      question => {

        const selectedAnswer =
          answers[question.id];


        const correctIndex =
          Number(
            question.correct_index
          );


        if (
          Number(selectedAnswer) ===
          correctIndex
        ) {

          goodAnswers++;

        }

      }
    );


    const total =
      questions.length;


    const score =
      total > 0
        ? Math.round(
            (
              goodAnswers /
              total
            ) * 100
          )
        : 0;


    let xpGain = 20;


    if (score >= 80) {

      xpGain = 100;

    } else if (score >= 50) {

      xpGain = 50;

    }


    return {
      score,
      goodAnswers,
      total,
      xp: xpGain
    };

  }


  // ==========================================
  // VALIDATION QUIZ
  // ==========================================

  async function validateQuiz() {

    if (
      validating ||
      result ||
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

      // ======================================
      // MODE CONSULTATION
      // ======================================

      if (isConsultation) {

        const consultationResult =
          calculateReadonlyResult();


        console.log(
          "👁️ [CONSULTATION] Résultat local :",
          consultationResult
        );


        setResult({
          score:
            consultationResult.score,

          goodAnswers:
            consultationResult.goodAnswers,

          total:
            consultationResult.total,

          xp:
            consultationResult.xp,

          level:
            null,

          consultation:
            true,

          preview:
            false
        });


        return;

      }


      // ======================================
      // MODE APERÇU APPLICATION ÉLÈVE
      // ======================================

      if (isStudentPreview) {

        const previewResult =
          calculateReadonlyResult();


        console.log(
          "👁️ [APERÇU] Résultat local :",
          previewResult
        );


        setResult({
          score:
            previewResult.score,

          goodAnswers:
            previewResult.goodAnswers,

          total:
            previewResult.total,

          xp:
            previewResult.xp,

          level:
            null,

          consultation:
            false,

          preview:
            true
        });


        return;

      }


      // ======================================
      // MODE ÉLÈVE NORMAL
      // ======================================

      if (!user) {

        return;

      }


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
          null,

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
      <div className="min-h-[60vh] theme-bg theme-text flex flex-col items-center justify-center px-6">

        <div className="w-14 h-14 rounded-2xl bg-accent-soft border border-accent flex items-center justify-center mb-4">
          <Loader2
            size={28}
            className="text-accent animate-spin"
          />
        </div>

        <p className="theme-text font-medium">
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
      <div className="min-h-screen theme-bg theme-text max-w-3xl mx-auto px-5 py-10 text-center">

        <div className="theme-surface rounded-3xl border theme-border shadow-sm p-8">

          <div className="w-16 h-16 rounded-2xl bg-accent-soft border border-accent mx-auto mb-4 flex items-center justify-center">
            <BookOpen
              size={40}
              className="text-accent"
            />
          </div>

          <h1 className="text-xl font-bold theme-text">
            Leçon introuvable
          </h1>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mt-5 inline-flex items-center gap-2 bg-accent text-white px-5 py-3 rounded-xl font-semibold shadow-md hover:opacity-90 hover:-translate-y-0.5 transition"
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
    <div className="min-h-screen theme-bg theme-text pb-10">

      {/* =====================================
          HEADER
      ====================================== */}

      <div className="theme-surface theme-border border-b shadow-sm px-5 py-4">

        <div className="max-w-4xl mx-auto">

          <button
            type="button"
            onClick={() => {

              if (isConsultation) {

                navigate(
                  `/admin/student/${studentId}/consultation`
                );

                return;

              }


              if (isStudentPreview) {

                navigate(
                  "/admin/student-preview"
                );

                return;

              }


              navigate("/");

            }}
            className="inline-flex items-center gap-3 text-xl font-bold theme-text hover:text-accent transition"
          >

            <span className="w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center shadow-sm">
              <GraduationCap size={23} />
            </span>

            Kalan Academy

          </button>

        </div>

      </div>


      {/* =====================================
          CONTENU
      ====================================== */}

      <div className="max-w-4xl mx-auto px-5 py-6">

        {/* ===================================
            NAVIGATION
        ==================================== */}

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl theme-surface border theme-border shadow-sm text-sm font-medium theme-text hover:text-accent transition mb-5"
        >
          <ArrowLeft size={18} />
          Retour à la leçon
        </button>


        {/* ===================================
            TITRE
        ==================================== */}

        <div className="relative overflow-hidden rounded-3xl bg-accent-soft border border-accent shadow-lg p-6 md:p-8 mb-7">

          <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-accent opacity-10" />

          <div className="absolute -left-16 -bottom-20 w-48 h-48 rounded-full bg-accent opacity-10" />

          <div className="absolute right-16 -bottom-24 w-56 h-56 rounded-full bg-accent opacity-5" />

          <div className="relative z-10">

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent text-white text-xs font-semibold mb-4">

              <PlayCircle size={14} />

              {isConsultation
                ? "Vidéo en consultation"
                : isStudentPreview
                  ? "Aperçu de la vidéo"
                  : "Vidéo de cours"
              }

            </div>


            <h1 className="text-2xl md:text-3xl font-bold leading-tight theme-text">
              {lesson.title}
            </h1>


            {lesson.description && (

              <p className="theme-text-secondary mt-3 leading-relaxed">
                {lesson.description}
              </p>

            )}


            <div className="flex flex-wrap items-center gap-3 mt-5">

              {lesson.duration_minutes && (

                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/70 dark:bg-gray-950/30 theme-text text-sm font-medium border border-white/50 dark:border-white/10">

                  <BookOpen
                    size={16}
                    className="text-accent"
                  />

                  {lesson.duration_minutes} min

                </div>

              )}


              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/70 dark:bg-gray-950/30 theme-text text-sm font-medium border border-white/50 dark:border-white/10">

                <PlayCircle
                  size={16}
                  className="text-accent"
                />

                Vidéo

              </div>

            </div>

          </div>

        </div>


        {/* ===================================
            VIDÉO
        ==================================== */}

        <div className="bg-black rounded-3xl overflow-hidden shadow-xl mb-6 aspect-video">

          {lesson.video_url ? (

            <video
              controls
              playsInline
              preload="metadata"
              src={lesson.video_url}
              className="w-full h-full object-contain"
            />

          ) : (

            <div className="w-full h-full flex flex-col items-center justify-center text-white px-6 text-center">

              <PlayCircle
                size={50}
                className="text-gray-500 mb-4"
              />

              <p className="font-semibold">
                Vidéo indisponible
              </p>

              <p className="text-sm text-gray-400 mt-1">
                Cette leçon ne contient pas encore
                de vidéo.
              </p>

            </div>

          )}

        </div>


        {/* ===================================
            INFORMATIONS LEÇON
        ==================================== */}

        <div className="theme-surface rounded-3xl border theme-border shadow-sm p-5 md:p-6 mb-8">

          <div className="flex items-center gap-3">

            <div className="w-11 h-11 rounded-2xl bg-accent-soft border border-accent flex items-center justify-center shrink-0">

              <BookOpen
                size={22}
                className="text-accent"
              />

            </div>


            <div>

              <p className="text-sm theme-text-secondary">
                Leçon
              </p>

              <p className="font-semibold theme-text">

                {isConsultation
                  ? "Consultation en lecture seule."
                  : isStudentPreview
                    ? "Aperçu en lecture seule. Aucune donnée élève ne sera modifiée."
                    : "Apprends la leçon puis vérifie tes connaissances."
                }

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

            <div className="relative overflow-hidden rounded-3xl bg-accent-soft border border-accent shadow-lg p-6 md:p-7 mb-6">

              <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-accent opacity-10" />

              <div className="absolute -left-16 -bottom-20 w-48 h-48 rounded-full bg-accent opacity-10" />

              <div className="absolute right-16 -bottom-24 w-56 h-56 rounded-full bg-accent opacity-5" />

              <div className="relative z-10">

                <div className="flex items-center gap-3">

                  <div className="w-12 h-12 rounded-2xl bg-accent text-white flex items-center justify-center shrink-0 shadow-sm">

                    <CircleHelp size={24} />

                  </div>


                  <div>

                    <p className="text-sm font-semibold text-accent">

                      {isConsultation
                        ? "Quiz en consultation"
                        : isStudentPreview
                          ? "Quiz en aperçu"
                          : "Quiz de validation"
                      }

                    </p>


                    <h2 className="text-xl md:text-2xl font-bold theme-text">

                      {isConsultation ||
                      isStudentPreview
                        ? "Voir le quiz"
                        : "Vérifie tes connaissances"
                      }

                    </h2>

                  </div>

                </div>


                <p className="theme-text-secondary text-sm mt-4 leading-relaxed">

                  {isConsultation
                    ? "Réponds aux questions pour voir le résultat. Aucune donnée de l'élève ne sera modifiée."
                    : isStudentPreview
                      ? "Réponds aux questions pour voir le résultat. L'aperçu ne modifie aucune donnée d'élève."
                      : "Réponds à toutes les questions pour valider le quiz."
                  }

                </p>

              </div>

            </div>


            {/* PROGRESSION */}

            {!result && (

              <div className="theme-surface rounded-3xl border theme-border shadow-sm p-5 mb-5">

                <div className="flex items-center justify-between text-sm mb-2">

                  <span className="font-medium theme-text">
                    Progression
                  </span>

                  <span className="theme-text-secondary">
                    {answeredCount}/{questions.length}
                  </span>

                </div>


                <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">

                  <div
                    className="h-full bg-accent rounded-full transition-all"
                    style={{
                      width: `${progress}%`
                    }}
                  />

                </div>

              </div>

            )}


            {/* =================================
                RÉSULTAT
            ================================== */}

            {result ? (

              <div className="relative overflow-hidden rounded-3xl bg-accent-soft border border-accent shadow-lg p-6 md:p-8 text-center">

                <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-accent opacity-10" />

                <div className="absolute -left-16 -bottom-20 w-48 h-48 rounded-full bg-accent opacity-10" />

                <div className="absolute right-16 -bottom-24 w-56 h-56 rounded-full bg-accent opacity-5" />


                <div className="relative z-10">

                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent text-white flex items-center justify-center shadow-md">

                    <Trophy size={32} />

                  </div>


                  <p className="text-sm font-semibold text-accent">

                    {result.preview
                      ? "Quiz aperçu"
                      : result.consultation
                        ? "Quiz consulté"
                        : "Quiz terminé"
                    }

                  </p>


                  <h2 className="text-2xl font-bold theme-text mt-1">

                    {getResultMessage(
                      result.score
                    )}

                  </h2>


                  <div className="text-5xl font-bold text-accent mt-4">

                    {result.score}%

                  </div>


                  <p className="theme-text-secondary mt-2">

                    {result.goodAnswers}
                    /
                    {result.total}
                    {" "}
                    bonnes réponses

                  </p>


                  <div className="grid grid-cols-2 gap-3 mt-6">

                    <div className="theme-surface border theme-border rounded-2xl p-4">

                      <Award
                        size={20}
                        className="mx-auto text-yellow-500 mb-2"
                      />

                      <p className="text-xs theme-text-secondary">

                        {result.preview ||
                        result.consultation
                          ? "XP théoriques"
                          : "XP gagnés"
                        }

                      </p>


                      <p className="font-bold theme-text mt-1">
                        +{result.xp} XP
                      </p>

                    </div>


                    <div className="theme-surface border theme-border rounded-2xl p-4">

                      <Trophy
                        size={20}
                        className="mx-auto text-accent mb-2"
                      />

                      <p className="text-xs theme-text-secondary">
                        Niveau
                      </p>


                      <p className="font-bold theme-text mt-1">
                        {result.level || "-"}
                      </p>

                    </div>

                  </div>


                  {(result.consultation ||
                    result.preview) && (

                    <div className="mt-5 px-4 py-3 rounded-xl bg-accent-soft border border-accent text-accent text-sm font-medium">

                      {result.preview
                        ? "👁️ Mode aperçu — aucune donnée d'élève n'a été modifiée."
                        : "👁️ Mode consultation — aucune donnée de l'élève n'a été modifiée."
                      }

                    </div>

                  )}


                  <button
                    type="button"
                    onClick={() => {

                      if (
                        isConsultation ||
                        isStudentPreview
                      ) {

                        navigate(-1);

                        return;

                      }


                      navigate(
                        `/lesson/${lessonId}`
                      );

                    }}
                    className="w-full mt-6 flex items-center justify-center gap-2 bg-accent text-white font-semibold px-5 py-3 rounded-xl shadow-md hover:opacity-90 hover:-translate-y-0.5 transition"
                  >

                    <ArrowLeft size={18} />

                    Retour à la leçon

                  </button>

                </div>

              </div>

            ) : (

              <>

                {/* QUESTIONS */}

                <div className="space-y-4">

                  {questions.map(
                    (
                      question,
                      index
                    ) => (

                      <div
                        key={question.id}
                        className="theme-surface rounded-3xl border theme-border shadow-sm p-5 md:p-6"
                      >

                        <div className="flex items-start gap-3 mb-4">

                          <div className="shrink-0 w-8 h-8 rounded-full bg-accent-soft border border-accent text-accent flex items-center justify-center text-sm font-bold">

                            {index + 1}

                          </div>


                          <p className="font-semibold theme-text leading-6">

                            {question.question}

                          </p>

                        </div>


                        <div className="space-y-2">

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
                                  key={choiceIndex}
                                  type="button"
                                  onClick={() =>
                                    chooseAnswer(
                                      question.id,
                                      choiceIndex
                                    )
                                  }
                                  disabled={validating}
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
                                        ? "bg-accent-soft border-accent text-accent"
                                        : "theme-surface theme-border theme-text hover:bg-accent-soft"
                                    }
                                    ${
                                      validating
                                        ? "opacity-60 cursor-not-allowed"
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
                                          ? "bg-accent text-white"
                                          : "bg-accent-soft text-accent border border-accent"
                                      }
                                    `}
                                  >

                                    {String.fromCharCode(
                                      65 +
                                      choiceIndex
                                    )}

                                  </span>


                                  <span className="flex-1">
                                    {choice}
                                  </span>


                                  {selected && (

                                    <CheckCircle2
                                      size={18}
                                      className="text-accent"
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
                  onClick={validateQuiz}
                  disabled={
                    validating ||
                    answeredCount <
                      questions.length
                  }
                  className="w-full mt-6 flex items-center justify-center gap-2 bg-accent text-white font-semibold px-6 py-3.5 rounded-xl shadow-md hover:opacity-90 hover:-translate-y-0.5 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >

                  {validating ? (

                    <>

                      <Loader2
                        size={19}
                        className="animate-spin"
                      />

                      Validation...

                    </>

                  ) : (

                    <>

                      <CheckCircle2 size={19} />

                      {isConsultation ||
                      isStudentPreview
                        ? "Voir le résultat"
                        : "Valider le quiz"
                      }

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
