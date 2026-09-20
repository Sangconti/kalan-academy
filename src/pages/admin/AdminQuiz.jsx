// src/pages/admin/AdminQuiz.jsx

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  ArrowLeft,
  ClipboardCheck,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
} from "lucide-react";

import {
  getLessonQuiz,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  getQuizQuestions,
  createQuizQuestion,
  updateQuizQuestion,
  deleteQuizQuestion,
} from "../../services/educationAdminService";

export default function AdminQuiz() {
  const { lessonId } = useParams();

  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);

  const [questions, setQuestions] = useState([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [editingQuestion, setEditingQuestion] = useState(null);

  const [quizTitle, setQuizTitle] = useState("Quiz");

  const [questionForm, setQuestionForm] = useState({
    question: "",
    choices: ["", "", "", ""],
    correct_index: 0,
    explanation: "",
    order_number: 1,
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

      const quizData = await getLessonQuiz(lessonId);

      setQuiz(quizData);

      if (!quizData) {
        setQuestions([]);
        return;
      }

      setQuizTitle(quizData.title || "Quiz");

      const questionData = await getQuizQuestions(quizData.id);

      setQuestions(questionData || []);
    } catch (error) {
      console.error("Erreur chargement quiz :", error);

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
      alert("Aucune leçon sélectionnée.");

      return;
    }

    if (!quizTitle.trim()) {
      alert("Veuillez saisir le titre du quiz.");

      return;
    }

    try {
      setSaving(true);

      const createdQuiz = await createQuiz({
        lesson_id: lessonId,
        title: quizTitle,
      });

      setQuiz(createdQuiz);

      setQuestions([]);

      setQuizTitle(createdQuiz.title || "Quiz");
    } catch (error) {
      console.error("Erreur création quiz :", error);

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
      alert("Veuillez saisir le titre du quiz.");

      return;
    }

    try {
      setSaving(true);

      const updatedQuiz = await updateQuiz(quiz.id, {
        title: quizTitle,
      });

      setQuiz(updatedQuiz);
    } catch (error) {
      console.error("Erreur modification quiz :", error);

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
      console.error("Erreur suppression quiz :", error);

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
      order_number: questions.length + 1,
    });
  }

  // =====================================
  // MODIFIER UN CHOIX
  // =====================================

  function updateChoice(index, value) {
    setQuestionForm((previous) => {
      const choices = [...previous.choices];

      choices[index] = value;

      return {
        ...previous,
        choices,
      };
    });
  }

  // =====================================
  // CREER / MODIFIER QUESTION
  // =====================================

  async function handleQuestionSubmit(e) {
    e.preventDefault();

    if (!quiz) {
      alert("Créez d'abord le quiz.");

      return;
    }

    if (!questionForm.question.trim()) {
      alert("Veuillez saisir la question.");

      return;
    }

    const choices = questionForm.choices.map((choice) =>
      choice.trim()
    );

    if (choices.some((choice) => !choice)) {
      alert("Veuillez remplir les 4 choix de réponse.");

      return;
    }

    if (
      questionForm.correct_index < 0 ||
      questionForm.correct_index > choices.length - 1
    ) {
      alert("La bonne réponse est invalide.");

      return;
    }

    try {
      setSaving(true);

      if (editingQuestion) {
        await updateQuizQuestion(editingQuestion.id, {
          ...questionForm,
          choices,
        });
      } else {
        await createQuizQuestion({
          ...questionForm,
          quiz_id: quiz.id,
          choices,
        });
      }

      resetQuestionForm();

      const updatedQuestions = await getQuizQuestions(quiz.id);

      setQuestions(updatedQuestions || []);
    } catch (error) {
      console.error("Erreur sauvegarde question :", error);

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

    const existingChoices = Array.isArray(question.choices)
      ? question.choices
      : [];

    setQuestionForm({
      question: question.question || "",

      choices: [
        existingChoices[0] || "",
        existingChoices[1] || "",
        existingChoices[2] || "",
        existingChoices[3] || "",
      ],

      correct_index: Number(question.correct_index ?? 0),

      explanation: question.explanation || "",

      order_number: question.order_number || 1,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // =====================================
  // SUPPRIMER QUESTION
  // =====================================

  async function handleDeleteQuestion(questionId) {
    const confirmed = confirm(
      "Supprimer cette question ?\n\nCette action est irréversible."
    );

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);

      await deleteQuizQuestion(questionId);

      if (editingQuestion?.id === questionId) {
        resetQuestionForm();
      }

      if (quiz) {
        const updatedQuestions = await getQuizQuestions(quiz.id);

        setQuestions(updatedQuestions || []);
      }
    } catch (error) {
      console.error("Erreur suppression question :", error);

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
    <div className="theme-bg min-h-full px-4 md:px-6 py-6 md:py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* ================================= */}
        {/* HEADER */}
        {/* ================================= */}

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
          <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-accent opacity-10" />
          <div className="absolute -left-16 -bottom-20 w-48 h-48 rounded-full bg-accent opacity-10" />
          <div className="absolute right-16 -bottom-24 w-56 h-56 rounded-full bg-accent opacity-5" />

          <div className="relative z-10">
            <button
              onClick={() => navigate(-1)}
              className="
                inline-flex
                items-center
                gap-2
                px-3
                py-2
                rounded-xl
                theme-surface
                theme-border
                border
                theme-text
                hover:bg-accent-soft
                hover:text-accent
                transition
                mb-5
              "
            >
              <ArrowLeft size={18} />
              Retour
            </button>

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-start gap-4">
                <div
                  className="
                    w-16
                    h-16
                    shrink-0
                    rounded-2xl
                    bg-accent
                    text-white
                    flex
                    items-center
                    justify-center
                    shadow-md
                  "
                >
                  <ClipboardCheck size={28} />
                </div>

                <div>
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
                      mb-3
                    "
                  >
                    <ClipboardCheck size={14} />
                    Administration
                  </div>

                  <h1 className="text-2xl md:text-3xl font-bold leading-tight theme-text">
                    Gestion du quiz
                  </h1>

                  <p className="theme-text-secondary mt-3 leading-relaxed">
                    Gérez le quiz et les questions de validation de cette
                    leçon.
                  </p>
                </div>
              </div>

              <div
                className="
                  inline-flex
                  items-center
                  gap-2
                  px-4
                  py-3
                  rounded-xl
                  theme-surface
                  theme-border
                  border
                  theme-text
                  text-sm
                  font-semibold
                  shadow-sm
                "
              >
                <ClipboardCheck
                  size={18}
                  className="text-accent"
                />

                {questions.length} question
                {questions.length !== 1 ? "s" : ""}
              </div>
            </div>
          </div>
        </div>

        {/* ================================= */}
        {/* CHARGEMENT */}
        {/* ================================= */}

        {loading ? (
          <div
            className="
              theme-surface
              theme-border
              border
              rounded-3xl
              p-10
              text-center
              shadow-sm
            "
          >
            <ClipboardCheck
              size={34}
              className="mx-auto text-accent mb-3"
            />

            <p className="theme-text-secondary">
              Chargement du quiz...
            </p>
          </div>
        ) : (
          <>
            {/* ============================= */}
            {/* QUIZ */}
            {/* ============================= */}

            <div
              className="
                theme-surface
                theme-border
                border
                rounded-3xl
                shadow-sm
                overflow-hidden
              "
            >
              <div
                className="
                  p-5
                  md:p-6
                  border-b
                  border-accent
                  flex
                  items-center
                  gap-3
                "
              >
                <div
                  className="
                    w-11
                    h-11
                    rounded-2xl
                    bg-accent-soft
                    border
                    border-accent
                    text-accent
                    flex
                    items-center
                    justify-center
                  "
                >
                  <ClipboardCheck size={20} />
                </div>

                <div>
                  <h2 className="font-bold text-lg theme-text">
                    {quiz ? "Quiz" : "Créer le quiz"}
                  </h2>

                  <p className="text-sm theme-text-secondary mt-0.5">
                    Définissez le titre du quiz de validation.
                  </p>
                </div>
              </div>

              <div className="p-5 md:p-6 space-y-5">
                <div>
                  <label className="block font-semibold theme-text mb-2">
                    Titre du quiz
                  </label>

                  <input
                    className="
                      w-full
                      theme-surface
                      theme-text
                      theme-border
                      border
                      px-4
                      py-3
                      rounded-xl
                      outline-none
                      focus:ring-2
                      focus:ring-accent
                      focus:border-accent
                      transition
                    "
                    placeholder="Titre du quiz"
                    value={quizTitle}
                    onChange={(e) =>
                      setQuizTitle(e.target.value)
                    }
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={
                      quiz
                        ? handleUpdateQuiz
                        : handleCreateQuiz
                    }
                    disabled={saving}
                    className="
                      bg-accent
                      hover:opacity-90
                      hover:-translate-y-0.5
                      disabled:opacity-50
                      text-white
                      px-5
                      py-3
                      rounded-xl
                      font-semibold
                      flex
                      items-center
                      gap-2
                      shadow-md
                      transition-all
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
                      onClick={handleDeleteQuiz}
                      disabled={saving}
                      className="
                        px-5
                        py-3
                        rounded-xl
                        bg-red-50
                        dark:bg-red-950/30
                        border
                        border-red-200
                        dark:border-red-900
                        text-red-700
                        dark:text-red-300
                        font-semibold
                        flex
                        items-center
                        gap-2
                        hover:bg-red-100
                        dark:hover:bg-red-950/50
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
              <div
                className="
                  theme-surface
                  theme-border
                  border
                  rounded-3xl
                  shadow-sm
                  overflow-hidden
                "
              >
                <div
                  className="
                    p-5
                    md:p-6
                    border-b
                    border-accent
                    flex
                    items-center
                    gap-3
                  "
                >
                  <div
                    className="
                      w-11
                      h-11
                      rounded-2xl
                      bg-accent-soft
                      border
                      border-accent
                      text-accent
                      flex
                      items-center
                      justify-center
                    "
                  >
                    {editingQuestion ? (
                      <Pencil size={20} />
                    ) : (
                      <Plus size={20} />
                    )}
                  </div>

                  <div>
                    <h2 className="font-bold text-lg theme-text">
                      {editingQuestion
                        ? "Modifier la question"
                        : "Nouvelle question"}
                    </h2>

                    <p className="text-sm theme-text-secondary mt-0.5">
                      Ajoutez les choix, la bonne réponse et l'explication.
                    </p>
                  </div>
                </div>

                <form
                  onSubmit={handleQuestionSubmit}
                  className="p-5 md:p-6 space-y-6"
                >
                  {/* QUESTION */}

                  <div>
                    <label className="block font-semibold theme-text mb-2">
                      Question
                    </label>

                    <textarea
                      rows={3}
                      className="
                        w-full
                        theme-surface
                        theme-text
                        theme-border
                        border
                        px-4
                        py-3
                        rounded-xl
                        outline-none
                        focus:ring-2
                        focus:ring-accent
                        focus:border-accent
                        resize-y
                        transition
                      "
                      placeholder="Saisissez la question..."
                      value={questionForm.question}
                      onChange={(e) =>
                        setQuestionForm({
                          ...questionForm,
                          question: e.target.value,
                        })
                      }
                    />
                  </div>

                  {/* CHOIX */}

                  <div>
                    <label className="block font-semibold theme-text mb-3">
                      Choix de réponse
                    </label>

                    <div className="space-y-3">
                      {questionForm.choices.map(
                        (choice, index) => (
                          <div
                            key={index}
                            className="
                              flex
                              items-center
                              gap-3
                              p-3
                              rounded-2xl
                              bg-accent-soft
                              border
                              border-accent
                            "
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
                                  correct_index: index,
                                })
                              }
                              className="
                                w-4
                                h-4
                                accent-[var(--accent-primary)]
                                shrink-0
                              "
                              title="Bonne réponse"
                            />

                            <span
                              className="
                                w-9
                                h-9
                                rounded-xl
                                bg-accent
                                text-white
                                flex
                                items-center
                                justify-center
                                font-bold
                                shrink-0
                              "
                            >
                              {String.fromCharCode(65 + index)}
                            </span>

                            <input
                              className="
                                flex-1
                                min-w-0
                                theme-surface
                                theme-text
                                theme-border
                                border
                                px-4
                                py-3
                                rounded-xl
                                outline-none
                                focus:ring-2
                                focus:ring-accent
                                focus:border-accent
                                transition
                              "
                              placeholder={`Choix ${String.fromCharCode(
                                65 + index
                              )}`}
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

                    <p className="text-xs theme-text-secondary mt-2">
                      Sélectionnez le bouton à gauche de la bonne réponse.
                    </p>
                  </div>

                  {/* EXPLICATION */}

                  <div>
                    <label className="block font-semibold theme-text mb-2">
                      Explication
                    </label>

                    <textarea
                      rows={4}
                      className="
                        w-full
                        theme-surface
                        theme-text
                        theme-border
                        border
                        px-4
                        py-3
                        rounded-xl
                        outline-none
                        focus:ring-2
                        focus:ring-accent
                        focus:border-accent
                        resize-y
                        transition
                      "
                      placeholder="Explication de la bonne réponse..."
                      value={questionForm.explanation}
                      onChange={(e) =>
                        setQuestionForm({
                          ...questionForm,
                          explanation: e.target.value,
                        })
                      }
                    />
                  </div>

                  {/* ORDRE */}

                  <div>
                    <label className="block font-semibold theme-text mb-2">
                      Ordre de la question
                    </label>

                    <input
                      type="number"
                      min="1"
                      className="
                        w-full
                        theme-surface
                        theme-text
                        theme-border
                        border
                        px-4
                        py-3
                        rounded-xl
                        outline-none
                        focus:ring-2
                        focus:ring-accent
                        focus:border-accent
                        transition
                      "
                      value={questionForm.order_number}
                      onChange={(e) =>
                        setQuestionForm({
                          ...questionForm,
                          order_number: Number(
                            e.target.value
                          ),
                        })
                      }
                    />
                  </div>

                  {/* BOUTONS */}

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="submit"
                      disabled={saving}
                      className="
                        bg-accent
                        hover:opacity-90
                        hover:-translate-y-0.5
                        disabled:opacity-50
                        text-white
                        px-5
                        py-3
                        rounded-xl
                        font-semibold
                        flex
                        items-center
                        gap-2
                        shadow-md
                        transition-all
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
                        onClick={resetQuestionForm}
                        className="
                          px-5
                          py-3
                          rounded-xl
                          theme-surface
                          theme-border
                          border
                          theme-text
                          font-semibold
                          hover:bg-accent-soft
                          hover:text-accent
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
                    <h2 className="text-xl font-bold theme-text">
                      Questions du quiz
                    </h2>

                    <p className="text-sm theme-text-secondary mt-1">
                      Les questions sont affichées dans leur ordre
                      pédagogique.
                    </p>
                  </div>
                </div>

                {questions.length === 0 ? (
                  <div
                    className="
                      theme-surface
                      theme-border
                      border
                      rounded-3xl
                      p-10
                      text-center
                      shadow-sm
                    "
                  >
                    <div
                      className="
                        w-14
                        h-14
                        mx-auto
                        rounded-2xl
                        bg-accent-soft
                        border
                        border-accent
                        text-accent
                        flex
                        items-center
                        justify-center
                        mb-4
                      "
                    >
                      <ClipboardCheck size={28} />
                    </div>

                    <p className="theme-text font-semibold">
                      Aucune question disponible.
                    </p>

                    <p className="text-sm theme-text-secondary mt-1">
                      Créez la première question ci-dessus.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {questions.map((question) => {
                      const choices = Array.isArray(
                        question.choices
                      )
                        ? question.choices
                        : [];

                      return (
                        <div
                          key={question.id}
                          className="
                            theme-surface
                            theme-border
                            border
                            rounded-3xl
                            p-5
                            md:p-6
                            shadow-sm
                            hover:shadow-md
                            transition
                          "
                        >
                          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start gap-3">
                                <div
                                  className="
                                    w-10
                                    h-10
                                    rounded-xl
                                    bg-accent-soft
                                    border
                                    border-accent
                                    text-accent
                                    flex
                                    items-center
                                    justify-center
                                    font-bold
                                    shrink-0
                                  "
                                >
                                  {question.order_number}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <h3 className="font-bold theme-text">
                                    {question.question}
                                  </h3>

                                  <div className="space-y-2 mt-4">
                                    {choices.map(
                                      (choice, index) => {
                                        const isCorrect =
                                          Number(
                                            question.correct_index
                                          ) === index;

                                        return (
                                          <div
                                            key={index}
                                            className={`
                                              flex
                                              items-center
                                              gap-3
                                              p-3
                                              rounded-xl
                                              border
                                              ${
                                                isCorrect
                                                  ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900"
                                                  : "theme-surface theme-border"
                                              }
                                            `}
                                          >
                                            <span
                                              className={`
                                                w-8
                                                h-8
                                                rounded-lg
                                                flex
                                                items-center
                                                justify-center
                                                font-bold
                                                shrink-0
                                                ${
                                                  isCorrect
                                                    ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300"
                                                    : "bg-accent-soft text-accent border border-accent"
                                                }
                                              `}
                                            >
                                              {String.fromCharCode(
                                                65 + index
                                              )}
                                            </span>

                                            <span
                                              className={`
                                                flex-1
                                                text-sm
                                                ${
                                                  isCorrect
                                                    ? "text-green-800 dark:text-green-200"
                                                    : "theme-text"
                                                }
                                              `}
                                            >
                                              {choice}
                                            </span>

                                            {isCorrect && (
                                              <CheckCircle2
                                                size={18}
                                                className="
                                                  text-green-600
                                                  dark:text-green-400
                                                  shrink-0
                                                "
                                              />
                                            )}
                                          </div>
                                        );
                                      }
                                    )}
                                  </div>

                                  {question.explanation && (
                                    <div
                                      className="
                                        mt-4
                                        p-4
                                        rounded-2xl
                                        bg-accent-soft
                                        border
                                        border-accent
                                      "
                                    >
                                      <p className="text-xs font-semibold text-accent mb-1">
                                        Explication
                                      </p>

                                      <p className="text-sm theme-text whitespace-pre-wrap">
                                        {question.explanation}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() =>
                                  editQuestion(question)
                                }
                                className="
                                  p-2.5
                                  bg-yellow-50
                                  dark:bg-yellow-950/30
                                  border
                                  border-yellow-200
                                  dark:border-yellow-900
                                  text-yellow-700
                                  dark:text-yellow-300
                                  hover:bg-yellow-100
                                  dark:hover:bg-yellow-950/50
                                  rounded-xl
                                  transition
                                "
                                title="Modifier"
                              >
                                <Pencil size={18} />
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
                                  bg-red-50
                                  dark:bg-red-950/30
                                  border
                                  border-red-200
                                  dark:border-red-900
                                  text-red-700
                                  dark:text-red-300
                                  hover:bg-red-100
                                  dark:hover:bg-red-950/50
                                  rounded-xl
                                  transition
                                "
                                title="Supprimer"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}