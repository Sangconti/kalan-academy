// src/pages/admin/AdminQuiz.jsx

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  ArrowLeft,
  ClipboardCheck,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2
} from "lucide-react";

import {
  getLessonQuiz,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  getQuizQuestions,
  createQuizQuestion,
  updateQuizQuestion,
  deleteQuizQuestion
} from "../../services/educationAdminService";

export default function AdminQuiz() {
  const { lessonId } = useParams();

  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);

  const [questions, setQuestions] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [editingQuestion, setEditingQuestion] =
    useState(null);

  const [quizTitle, setQuizTitle] =
    useState("Quiz");

  const [questionForm, setQuestionForm] =
    useState({
      question: "",
      choices: ["", "", "", ""],
      correct_index: 0,
      explanation: "",
      order_number: 1
    });

  // =====================================
  // CHARGER LE QUIZ
  // =====================================

  async function loadQuiz() {
    if (!lessonId) {
      setQuiz(null);
      setQuestions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const quizData =
        await getLessonQuiz(lessonId);

      setQuiz(quizData);

      if (!quizData) {
        setQuestions([]);
        return;
      }

      setQuizTitle(
        quizData.title || "Quiz"
      );

      const questionData =
        await getQuizQuestions(
          quizData.id
        );

      setQuestions(
        questionData || []
      );
    } catch (error) {
      console.error(
        "Erreur chargement quiz :",
        error
      );

      alert(
        "❌ Impossible de charger le quiz.\n\n" +
        (error.message || "")
      );
    } finally {
      setLoading(false);
    }
  }

  // =====================================
  // INITIALISATION
  // =====================================

  useEffect(() => {
    loadQuiz();
  }, [lessonId]);

  // =====================================
  // CREER LE QUIZ
  // =====================================

  async function handleCreateQuiz() {
    if (!lessonId) {
      alert(
        "Aucune leçon sélectionnée."
      );

      return;
    }

    if (!quizTitle.trim()) {
      alert(
        "Veuillez saisir le titre du quiz."
      );

      return;
    }

    try {
      setSaving(true);

      const createdQuiz =
        await createQuiz({
          lesson_id: lessonId,
          title: quizTitle
        });

      setQuiz(createdQuiz);

      setQuestions([]);

      setQuizTitle(
        createdQuiz.title || "Quiz"
      );
    } catch (error) {
      console.error(
        "Erreur création quiz :",
        error
      );

      alert(
        "❌ Impossible de créer le quiz.\n\n" +
        (error.message || "")
      );
    } finally {
      setSaving(false);
    }
  }

  // =====================================
  // MODIFIER LE TITRE
  // =====================================

  async function handleUpdateQuiz() {
    if (!quiz) {
      return;
    }

    if (!quizTitle.trim()) {
      alert(
        "Veuillez saisir le titre du quiz."
      );

      return;
    }

    try {
      setSaving(true);

      const updatedQuiz =
        await updateQuiz(
          quiz.id,
          {
            title: quizTitle
          }
        );

      setQuiz(updatedQuiz);
    } catch (error) {
      console.error(
        "Erreur modification quiz :",
        error
      );

      alert(
        "❌ Impossible de modifier le quiz.\n\n" +
        (error.message || "")
      );
    } finally {
      setSaving(false);
    }
  }

  // =====================================
  // SUPPRIMER LE QUIZ
  // =====================================

  async function handleDeleteQuiz() {
    if (!quiz) {
      return;
    }

    const confirmed = confirm(
      "Supprimer ce quiz ?\n\nToutes ses questions seront également supprimées.\n\nCette action est irréversible."
    );

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);

      await deleteQuiz(quiz.id);

      setQuiz(null);

      setQuestions([]);

      resetQuestionForm();
    } catch (error) {
      console.error(
        "Erreur suppression quiz :",
        error
      );

      alert(
        "❌ Impossible de supprimer le quiz.\n\n" +
        (error.message || "")
      );
    } finally {
      setSaving(false);
    }
  }

  // =====================================
  // RESET QUESTION
  // =====================================

  function resetQuestionForm() {
    setEditingQuestion(null);

    setQuestionForm({
      question: "",
      choices: ["", "", "", ""],
      correct_index: 0,
      explanation: "",
      order_number:
        questions.length + 1
    });
  }

  // =====================================
  // MODIFIER UNE CHOIX
  // =====================================

  function updateChoice(index, value) {
    setQuestionForm((previous) => {
      const choices = [
        ...previous.choices
      ];

      choices[index] = value;

      return {
        ...previous,
        choices
      };
    });
  }

  // =====================================
  // CREER / MODIFIER QUESTION
  // =====================================

  async function handleQuestionSubmit(
    e
  ) {
    e.preventDefault();

    if (!quiz) {
      alert(
        "Créez d'abord le quiz."
      );

      return;
    }

    if (
      !questionForm.question.trim()
    ) {
      alert(
        "Veuillez saisir la question."
      );

      return;
    }

    const choices =
      questionForm.choices.map(
        (choice) =>
          choice.trim()
      );

    if (
      choices.some(
        (choice) => !choice
      )
    ) {
      alert(
        "Veuillez remplir les 4 choix de réponse."
      );

      return;
    }

    if (
      questionForm.correct_index < 0 ||
      questionForm.correct_index >
        choices.length - 1
    ) {
      alert(
        "La bonne réponse est invalide."
      );

      return;
    }

    try {
      setSaving(true);

      if (editingQuestion) {
        await updateQuizQuestion(
          editingQuestion.id,
          {
            ...questionForm,
            choices
          }
        );
      } else {
        await createQuizQuestion({
          ...questionForm,
          quiz_id: quiz.id,
          choices
        });
      }

      resetQuestionForm();

      const updatedQuestions =
        await getQuizQuestions(
          quiz.id
        );

      setQuestions(
        updatedQuestions || []
      );
    } catch (error) {
      console.error(
        "Erreur sauvegarde question :",
        error
      );

      alert(
        "❌ Impossible d'enregistrer la question.\n\n" +
        (error.message || "")
      );
    } finally {
      setSaving(false);
    }
  }

  // =====================================
  // MODIFIER QUESTION
  // =====================================

  function editQuestion(question) {
    setEditingQuestion(question);

    const existingChoices =
      Array.isArray(question.choices)
        ? question.choices
        : [];

    setQuestionForm({
      question:
        question.question || "",

      choices: [
        existingChoices[0] || "",
        existingChoices[1] || "",
        existingChoices[2] || "",
        existingChoices[3] || ""
      ],

      correct_index:
        Number(
          question.correct_index ?? 0
        ),

      explanation:
        question.explanation || "",

      order_number:
        question.order_number || 1
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  // =====================================
  // SUPPRIMER QUESTION
  // =====================================

  async function handleDeleteQuestion(
    questionId
  ) {
    const confirmed = confirm(
      "Supprimer cette question ?\n\nCette action est irréversible."
    );

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);

      await deleteQuizQuestion(
        questionId
      );

      if (
        editingQuestion?.id ===
        questionId
      ) {
        resetQuestionForm();
      }

      if (quiz) {
        const updatedQuestions =
          await getQuizQuestions(
            quiz.id
          );

        setQuestions(
          updatedQuestions || []
        );
      }
    } catch (error) {
      console.error(
        "Erreur suppression question :",
        error
      );

      alert(
        "❌ Impossible de supprimer la question.\n\n" +
        (error.message || "")
      );
    } finally {
      setSaving(false);
    }
  }

  // =====================================
  // RENDU
  // =====================================

  return (
    <div className="space-y-6">

      {/* ================================= */}
      {/* HEADER */}
      {/* ================================= */}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">

        <button
          onClick={() => navigate(-1)}
          className="
            flex
            items-center
            gap-2
            text-gray-600
            hover:text-blue-600
            mb-5
            transition
          "
        >
          <ArrowLeft size={18} />

          Retour
        </button>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          <div>

            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">

              <ClipboardCheck
                size={27}
                className="text-blue-600"
              />

              Gestion du quiz

            </h1>

            <p className="text-sm text-gray-500 mt-2">
              Gestion du quiz et des questions
              de la leçon.
            </p>

          </div>

          <div
            className="
              inline-flex
              items-center
              gap-2
              px-4
              py-2
              rounded-xl
              bg-green-50
              text-green-700
              font-semibold
              text-sm
            "
          >
            <ClipboardCheck
              size={17}
            />

            {questions.length} question
            {questions.length !== 1
              ? "s"
              : ""}
          </div>

        </div>

      </div>

      {/* ================================= */}
      {/* CHARGEMENT */}
      {/* ================================= */}

      {loading ? (

        <div className="bg-white rounded-2xl p-8 text-center shadow-sm">

          <p className="text-gray-500">
            Chargement du quiz...
          </p>

        </div>

      ) : (

        <>

          {/* ============================= */}
          {/* QUIZ */}
          {/* ============================= */}

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">

            <div className="flex items-center gap-2 mb-5">

              <ClipboardCheck
                size={20}
                className="text-blue-600"
              />

              <h2 className="font-bold text-lg text-gray-900">
                {quiz
                  ? "Quiz"
                  : "Créer le quiz"}
              </h2>

            </div>

            <div className="space-y-4">

              <div>

                <label className="block font-medium text-gray-700 mb-2">
                  Titre du quiz
                </label>

                <input
                  className="
                    w-full
                    border
                    border-gray-200
                    p-3
                    rounded-xl
                    focus:outline-none
                    focus:ring-2
                    focus:ring-blue-500
                  "
                  placeholder="Titre du quiz"
                  value={quizTitle}
                  onChange={(e) =>
                    setQuizTitle(
                      e.target.value
                    )
                  }
                />

              </div>

              <div className="flex gap-3">

                <button
                  type="button"
                  onClick={
                    quiz
                      ? handleUpdateQuiz
                      : handleCreateQuiz
                  }
                  disabled={saving}
                  className="
                    bg-blue-600
                    hover:bg-blue-700
                    disabled:bg-blue-300
                    text-white
                    px-5
                    py-3
                    rounded-xl
                    font-semibold
                    flex
                    items-center
                    gap-2
                    transition
                  "
                >

                  {quiz ? (
                    <>
                      <Pencil size={18} />

                      {saving
                        ? "Mise à jour..."
                        : "Mettre à jour"}
                    </>
                  ) : (
                    <>
                      <Plus size={18} />

                      {saving
                        ? "Création..."
                        : "Créer le quiz"}
                    </>
                  )}

                </button>

                {quiz && (

                  <button
                    type="button"
                    onClick={
                      handleDeleteQuiz
                    }
                    disabled={saving}
                    className="
                      px-5
                      py-3
                      rounded-xl
                      bg-red-100
                      hover:bg-red-200
                      text-red-700
                      font-semibold
                      flex
                      items-center
                      gap-2
                      transition
                    "
                  >

                    <Trash2 size={18} />

                    Supprimer le quiz

                  </button>

                )}

              </div>

            </div>

          </div>


          {/* ============================= */}
          {/* FORMULAIRE QUESTION */}
          {/* ============================= */}

          {quiz && (

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">

              <div className="flex items-center gap-2 mb-5">

                {editingQuestion ? (
                  <Pencil
                    size={20}
                    className="text-yellow-600"
                  />
                ) : (
                  <Plus
                    size={20}
                    className="text-blue-600"
                  />
                )}

                <h2 className="font-bold text-lg text-gray-900">

                  {editingQuestion
                    ? "Modifier la question"
                    : "Nouvelle question"}

                </h2>

              </div>

              <form
                onSubmit={
                  handleQuestionSubmit
                }
                className="space-y-5"
              >

                {/* QUESTION */}

                <div>

                  <label className="block font-medium text-gray-700 mb-2">
                    Question
                  </label>

                  <textarea
                    rows={3}
                    className="
                      w-full
                      border
                      border-gray-200
                      p-3
                      rounded-xl
                      focus:outline-none
                      focus:ring-2
                      focus:ring-blue-500
                      resize-y
                    "
                    placeholder="Saisissez la question..."
                    value={
                      questionForm.question
                    }
                    onChange={(e) =>
                      setQuestionForm({
                        ...questionForm,
                        question:
                          e.target.value
                      })
                    }
                  />

                </div>


                {/* CHOIX */}

                <div>

                  <label className="block font-medium text-gray-700 mb-3">
                    Choix de réponse
                  </label>

                  <div className="space-y-3">

                    {questionForm.choices.map(
                      (
                        choice,
                        index
                      ) => (

                        <div
                          key={index}
                          className="flex items-center gap-3"
                        >

                          <input
                            type="radio"
                            name="correct_answer"
                            checked={
                              questionForm.correct_index ===
                              index
                            }
                            onChange={() =>
                              setQuestionForm({
                                ...questionForm,
                                correct_index:
                                  index
                              })
                            }
                            className="
                              w-4
                              h-4
                            "
                            title="Bonne réponse"
                          />

                          <span
                            className="
                              w-8
                              h-8
                              rounded-lg
                              bg-blue-50
                              text-blue-700
                              flex
                              items-center
                              justify-center
                              font-bold
                              flex-shrink-0
                            "
                          >
                            {String.fromCharCode(
                              65 + index
                            )}
                          </span>

                          <input
                            className="
                              flex-1
                              border
                              border-gray-200
                              p-3
                              rounded-xl
                              focus:outline-none
                              focus:ring-2
                              focus:ring-blue-500
                            "
                            placeholder={
                              `Choix ${
                                String.fromCharCode(
                                  65 + index
                                )
                              }`
                            }
                            value={choice}
                            onChange={(e) =>
                              updateChoice(
                                index,
                                e.target.value
                              )
                            }
                          />

                        </div>

                      )
                    )}

                  </div>

                  <p className="text-xs text-gray-400 mt-2">
                    Sélectionnez le bouton à gauche
                    de la bonne réponse.
                  </p>

                </div>


                {/* EXPLICATION */}

                <div>

                  <label className="block font-medium text-gray-700 mb-2">
                    Explication
                  </label>

                  <textarea
                    rows={4}
                    className="
                      w-full
                      border
                      border-gray-200
                      p-3
                      rounded-xl
                      focus:outline-none
                      focus:ring-2
                      focus:ring-blue-500
                      resize-y
                    "
                    placeholder="Explication de la bonne réponse..."
                    value={
                      questionForm.explanation
                    }
                    onChange={(e) =>
                      setQuestionForm({
                        ...questionForm,
                        explanation:
                          e.target.value
                      })
                    }
                  />

                </div>


                {/* ORDRE */}

                <div>

                  <label className="block font-medium text-gray-700 mb-2">
                    Ordre de la question
                  </label>

                  <input
                    type="number"
                    min="1"
                    className="
                      w-full
                      border
                      border-gray-200
                      p-3
                      rounded-xl
                    "
                    value={
                      questionForm.order_number
                    }
                    onChange={(e) =>
                      setQuestionForm({
                        ...questionForm,
                        order_number:
                          Number(
                            e.target.value
                          )
                      })
                    }
                  />

                </div>


                {/* BOUTONS */}

                <div className="flex gap-3">

                  <button
                    type="submit"
                    disabled={saving}
                    className="
                      bg-blue-600
                      hover:bg-blue-700
                      disabled:bg-blue-300
                      text-white
                      px-5
                      py-3
                      rounded-xl
                      font-semibold
                      flex
                      items-center
                      gap-2
                      transition
                    "
                  >

                    {editingQuestion ? (
                      <>
                        <Pencil size={18} />

                        {saving
                          ? "Mise à jour..."
                          : "Mettre à jour"}
                      </>
                    ) : (
                      <>
                        <Plus size={18} />

                        {saving
                          ? "Création..."
                          : "Créer la question"}
                      </>
                    )}

                  </button>

                  {editingQuestion && (

                    <button
                      type="button"
                      onClick={
                        resetQuestionForm
                      }
                      className="
                        px-5
                        py-3
                        rounded-xl
                        border
                        border-gray-200
                        text-gray-600
                        font-semibold
                        hover:bg-gray-50
                        transition
                      "
                    >
                      Annuler
                    </button>

                  )}

                </div>

              </form>

            </div>

          )}


          {/* ============================= */}
          {/* LISTE QUESTIONS */}
          {/* ============================= */}

          {quiz && (

            <div>

              <div className="flex items-center justify-between mb-4">

                <div>

                  <h2 className="text-xl font-bold text-gray-900">
                    Questions du quiz
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">
                    Les questions sont affichées
                    dans leur ordre pédagogique.
                  </p>

                </div>

              </div>


              {questions.length === 0 ? (

                <div className="bg-white rounded-2xl p-8 text-center shadow-sm">

                  <ClipboardCheck
                    size={42}
                    className="mx-auto text-gray-300 mb-3"
                  />

                  <p className="text-gray-500">
                    Aucune question disponible.
                  </p>

                  <p className="text-sm text-gray-400 mt-1">
                    Créez la première question
                    ci-dessus.
                  </p>

                </div>

              ) : (

                <div className="space-y-4">

                  {questions.map(
                    (question) => {

                      const choices =
                        Array.isArray(
                          question.choices
                        )
                          ? question.choices
                          : [];

                      return (

                        <div
                          key={question.id}
                          className="
                            bg-white
                            shadow-sm
                            border
                            border-gray-100
                            rounded-2xl
                            p-5
                          "
                        >

                          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">

                            <div className="flex-1">

                              <div className="flex items-start gap-3">

                                <div
                                  className="
                                    w-10
                                    h-10
                                    rounded-xl
                                    bg-blue-50
                                    text-blue-600
                                    flex
                                    items-center
                                    justify-center
                                    font-bold
                                    flex-shrink-0
                                  "
                                >
                                  {
                                    question.order_number
                                  }
                                </div>

                                <div className="flex-1">

                                  <h3 className="font-bold text-gray-900">
                                    {
                                      question.question
                                    }
                                  </h3>

                                  <div className="space-y-2 mt-4">

                                    {choices.map(
                                      (
                                        choice,
                                        index
                                      ) => {

                                        const isCorrect =
                                          Number(
                                            question.correct_index
                                          ) ===
                                          index;

                                        return (

                                          <div
                                            key={
                                              index
                                            }
                                            className={`
                                              flex
                                              items-center
                                              gap-3
                                              p-3
                                              rounded-xl
                                              border
                                              ${
                                                isCorrect
                                                  ? "bg-green-50 border-green-200"
                                                  : "bg-gray-50 border-gray-100"
                                              }
                                            `}
                                          >

                                            <span
                                              className="
                                                w-8
                                                h-8
                                                rounded-lg
                                                bg-white
                                                flex
                                                items-center
                                                justify-center
                                                font-bold
                                                text-gray-700
                                                flex-shrink-0
                                              "
                                            >
                                              {String.fromCharCode(
                                                65 +
                                                  index
                                              )}
                                            </span>

                                            <span className="flex-1 text-sm text-gray-700">
                                              {choice}
                                            </span>

                                            {isCorrect && (

                                              <CheckCircle2
                                                size={
                                                  18
                                                }
                                                className="
                                                  text-green-600
                                                  flex-shrink-0
                                                "
                                              />

                                            )}

                                          </div>

                                        );
                                      }
                                    )}

                                  </div>

                                  {question.explanation && (

                                    <div className="mt-4 p-3 bg-blue-50 rounded-xl">

                                      <p className="text-xs font-semibold text-blue-700 mb-1">
                                        Explication
                                      </p>

                                      <p className="text-sm text-blue-900 whitespace-pre-wrap">
                                        {
                                          question.explanation
                                        }
                                      </p>

                                    </div>

                                  )}

                                </div>

                              </div>

                            </div>

                            <div className="flex gap-2">

                              <button
                                type="button"
                                onClick={() =>
                                  editQuestion(
                                    question
                                  )
                                }
                                className="
                                  p-2.5
                                  bg-yellow-100
                                  hover:bg-yellow-200
                                  rounded-xl
                                  transition
                                "
                                title="Modifier"
                              >
                                <Pencil
                                  size={18}
                                />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteQuestion(
                                    question.id
                                  )
                                }
                                className="
                                  p-2.5
                                  bg-red-100
                                  hover:bg-red-200
                                  rounded-xl
                                  transition
                                "
                                title="Supprimer"
                              >
                                <Trash2
                                  size={18}
                                />
                              </button>

                            </div>

                          </div>

                        </div>

                      );
                    }
                  )}

                </div>

              )}

            </div>

          )}

        </>

      )}

    </div>
  );
}