// src/pages/admin/AdminLessons.jsx

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  ArrowLeft,
  GraduationCap,
  Library,
  ClipboardCheck,
  Search,
  X,
} from "lucide-react";

import {
  getLessons,
  createLesson,
  updateLesson,
  deleteLesson,
  importAdminLessonPack,
  getChapterContext,
} from "../../services/educationAdminService";

export default function AdminLessons() {
  const { chapterId } = useParams();

  const navigate = useNavigate();

  const [lessons, setLessons] = useState([]);

  const [loading, setLoading] = useState(false);

  const [contextLoading, setContextLoading] =
    useState(true);

  const [chapter, setChapter] = useState(null);

  const [editing, setEditing] = useState(null);

  const [selectedLessons, setSelectedLessons] =
    useState([]);

  const [searchTerm, setSearchTerm] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    duration_minutes: 10,
    difficulty: "easy",
    video_url: "",
    thumbnail_url: "",
    is_premium: false,
    order_number: 1,
  });

  // =====================================
  // CHARGER LE CONTEXTE CHAPITRE
  // =====================================

  async function loadChapterContext() {
    if (!chapterId) {
      setChapter(null);
      setContextLoading(false);
      return;
    }

    try {
      setContextLoading(true);

      const data =
        await getChapterContext(chapterId);

      setChapter(data);
    } catch (error) {
      console.error(
        "Erreur chargement contexte chapitre :",
        error
      );

      setChapter(null);
    } finally {
      setContextLoading(false);
    }
  }

  // =====================================
  // CHARGER LES LEÇONS
  // =====================================

  async function loadLessons() {
    if (!chapterId) {
      setLessons([]);
      return;
    }

    try {
      setLoading(true);

      const data =
        await getLessons(chapterId);

      setLessons(data || []);

      setSelectedLessons((previous) =>
        previous.filter((id) =>
          (data || []).some(
            (lesson) => lesson.id === id
          )
        )
      );
    } catch (error) {
      console.error(
        "Erreur chargement leçons :",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  // =====================================
  // INITIALISATION
  // =====================================

  useEffect(() => {
    if (!chapterId) {
      setLessons([]);
      setChapter(null);
      return;
    }

    loadChapterContext();
    loadLessons();
  }, [chapterId]);

  // =====================================
  // RECHERCHE
  // =====================================

  const normalizedSearch = searchTerm
    .trim()
    .toLowerCase();

  const filteredLessons = lessons.filter(
    (lesson) => {
      if (!normalizedSearch) {
        return true;
      }

      const title =
        lesson?.title?.toLowerCase() || "";

      const description =
        lesson?.description?.toLowerCase() || "";

      const difficulty =
        lesson?.difficulty?.toLowerCase() || "";

      const difficultyLabel = {
        easy: "facile",
        medium: "moyen",
        hard: "difficile",
      }[lesson?.difficulty] || "";

      const order = String(
        lesson?.order_number ?? ""
      );

      return (
        title.includes(normalizedSearch) ||
        description.includes(normalizedSearch) ||
        difficulty.includes(normalizedSearch) ||
        difficultyLabel.includes(normalizedSearch) ||
        order.includes(normalizedSearch)
      );
    }
  );

  // =====================================
  // IMPORT JSON
  // =====================================

  async function handleImportJSON(e) {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const json = JSON.parse(text);

      const result =
        await importAdminLessonPack(json);

      const created =
        result?.created || {};

      const skipped =
        result?.skipped || {};

      const updated =
        result?.updated || {};

      alert(
        `✅ Import terminé

📦 RÉSUMÉ

Créés :
📚 Chapitres : ${created.chapters ?? 0}
📖 Leçons : ${created.lessons ?? 0}
📝 Blocs : ${created.blocks ?? 0}
🎯 Quiz : ${created.quizzes ?? 0}
❓ Questions : ${created.questions ?? 0}

Déjà existants / ignorés :
📚 Chapitres : ${skipped.chapters ?? 0}
📖 Leçons : ${skipped.lessons ?? 0}
📝 Blocs : ${skipped.blocks ?? 0}
🎯 Quiz : ${skipped.quizzes ?? 0}
❓ Questions : ${skipped.questions ?? 0}

Mis à jour :
📝 Blocs : ${updated.blocks ?? 0}`
      );

      await loadLessons();
      await loadChapterContext();

      setSelectedLessons([]);

      e.target.value = "";
    } catch (error) {
      console.error(
        "Erreur import JSON :",
        error
      );

      alert(
        "❌ Erreur import JSON :\n\n" +
          (
            error.message ||
            "Une erreur inconnue est survenue."
          )
      );

      e.target.value = "";
    }
  }

  // =====================================
  // CREER / MODIFIER
  // =====================================

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      if (!form.title.trim()) {
        alert(
          "Veuillez saisir le titre de la leçon."
        );

        return;
      }

      if (!chapterId) {
        alert(
          "Aucun chapitre sélectionné."
        );

        return;
      }

      if (editing) {
        await updateLesson(
          editing.id,
          form
        );
      } else {
        await createLesson({
          ...form,
          chapter_id: chapterId,
        });
      }

      setEditing(null);

      setForm({
        title: "",
        description: "",
        duration_minutes: 10,
        difficulty: "easy",
        video_url: "",
        thumbnail_url: "",
        is_premium: false,
        order_number: 1,
      });

      await loadLessons();
    } catch (error) {
      console.error(
        "Erreur sauvegarde leçon :",
        error
      );

      alert(
        "❌ Impossible d'enregistrer la leçon.\n\n" +
          (error.message || "")
      );
    }
  }

  // =====================================
  // MODIFIER
  // =====================================

  function editLesson(lesson) {
    setEditing(lesson);

    setForm({
      title: lesson.title || "",

      description:
        lesson.description || "",

      duration_minutes:
        lesson.duration_minutes || 10,

      difficulty:
        lesson.difficulty || "easy",

      video_url:
        lesson.video_url || "",

      thumbnail_url:
        lesson.thumbnail_url || "",

      is_premium:
        lesson.is_premium || false,

      order_number:
        lesson.order_number || 1,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // =====================================
  // SELECTIONNER UNE LEÇON
  // =====================================

  function toggleLessonSelection(id) {
    setSelectedLessons((previous) => {
      if (previous.includes(id)) {
        return previous.filter(
          (lessonId) => lessonId !== id
        );
      }

      return [...previous, id];
    });
  }

  // =====================================
  // TOUT SELECTIONNER
  // =====================================

  function toggleSelectAll() {
    if (
      selectedLessons.length ===
      filteredLessons.length
    ) {
      setSelectedLessons([]);
      return;
    }

    setSelectedLessons(
      filteredLessons.map(
        (lesson) => lesson.id
      )
    );
  }

  // =====================================
  // SUPPRIMER
  // =====================================

  async function handleDelete(id) {
    if (
      !confirm(
        "Supprimer cette leçon ?\n\nSes blocs et son quiz seront également supprimés."
      )
    ) {
      return;
    }

    try {
      await deleteLesson(id);

      setSelectedLessons((previous) =>
        previous.filter(
          (lessonId) => lessonId !== id
        )
      );

      await loadLessons();
    } catch (error) {
      console.error(
        "Erreur suppression leçon :",
        error
      );

      alert(
        "❌ Impossible de supprimer la leçon.\n\n" +
          (error.message || "")
      );
    }
  }

  // =====================================
  // SUPPRESSION MULTIPLE
  // =====================================

  async function handleDeleteSelected() {
    if (selectedLessons.length === 0) {
      return;
    }

    const confirmed = confirm(
      `Supprimer ${selectedLessons.length} leçon(s) sélectionnée(s) ?\n\nLeurs blocs et leurs quiz seront également supprimés.\n\nCette action est irréversible.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);

      for (const lessonId of selectedLessons) {
        await deleteLesson(lessonId);
      }

      setSelectedLessons([]);

      await loadLessons();
    } catch (error) {
      console.error(
        "Erreur suppression multiple leçons :",
        error
      );

      alert(
        "❌ La suppression multiple a rencontré une erreur.\n\n" +
          (error.message || "")
      );

      await loadLessons();
    } finally {
      setLoading(false);
    }
  }

  // =====================================
  // DATE D'IMPORT / CREATION
  // =====================================

  function formatImportDate(lesson) {
    const dateValue =
      lesson?.imported_at ||
      lesson?.created_at;

    if (!dateValue) {
      return null;
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  // =====================================
  // RENDU
  // =====================================

  const allSelected =
    filteredLessons.length > 0 &&
    selectedLessons.length ===
      filteredLessons.length;

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
                  <BookOpen size={28} />
                </div>

                <div className="min-w-0">

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
                    <BookOpen size={14} />
                    Administration
                  </div>

                  <h1 className="text-2xl md:text-3xl font-bold leading-tight theme-text">
                    Gestion des leçons
                  </h1>

                  <p className="theme-text-secondary mt-3 leading-relaxed">
                    Gérez les leçons, leur contenu, leurs vidéos et leurs
                    quiz pour ce chapitre.
                  </p>

                  <div className="flex flex-wrap gap-2 mt-5">

                    <div
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
                        text-sm
                        font-medium
                      "
                    >
                      <GraduationCap
                        size={16}
                        className="text-accent"
                      />

                      {contextLoading
                        ? "Chargement..."
                        : chapter?.subjects?.classes?.name ||
                          "Classe inconnue"}
                    </div>

                    <div
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
                        text-sm
                        font-medium
                      "
                    >
                      <Library
                        size={16}
                        className="text-accent"
                      />

                      {contextLoading
                        ? "Chargement..."
                        : chapter?.subjects?.name ||
                          "Matière inconnue"}
                    </div>

                    <div
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
                        text-sm
                        font-medium
                      "
                    >
                      <BookOpen
                        size={16}
                        className="text-accent"
                      />

                      {contextLoading
                        ? "Chargement..."
                        : chapter?.title ||
                          "Chapitre inconnu"}
                    </div>

                  </div>
                </div>
              </div>

              <label
                className="
                  cursor-pointer
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  bg-accent
                  hover:opacity-90
                  hover:-translate-y-0.5
                  text-white
                  px-5
                  py-3
                  rounded-xl
                  font-semibold
                  transition-all
                  shadow-md
                  shrink-0
                "
              >
                📦 Importer pack JSON Mali

                <input
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={handleImportJSON}
                />
              </label>

            </div>
          </div>
        </div>

        {/* ================================= */}
        {/* FIL D'ARIANE */}
        {/* ================================= */}

        <div
          className="
            theme-surface
            theme-border
            border
            rounded-2xl
            px-4
            py-3
            shadow-sm
          "
        >
          <div className="flex flex-wrap items-center text-sm gap-y-1">

            <span className="theme-text-secondary">
              Administration
            </span>

            <span className="mx-2 theme-text-secondary">
              ›
            </span>

            <span className="theme-text-secondary">
              Matières
            </span>

            <span className="mx-2 theme-text-secondary">
              ›
            </span>

            <span className="font-semibold theme-text">
              {chapter?.subjects?.name ||
                "Matière"}
            </span>

            <span className="mx-2 theme-text-secondary">
              ›
            </span>

            <span className="font-semibold theme-text">
              {chapter?.title ||
                "Chapitre"}
            </span>

            <span className="mx-2 theme-text-secondary">
              ›
            </span>

            <span className="font-semibold text-accent">
              Leçons
            </span>

          </div>
        </div>

        {/* ================================= */}
        {/* AUCUN CHAPITRE */}
        {/* ================================= */}

        {!chapterId && (
          <div
            className="
              bg-yellow-50
              dark:bg-yellow-950/30
              border
              border-yellow-200
              dark:border-yellow-900
              rounded-2xl
              p-5
            "
          >
            <p className="font-semibold text-yellow-800 dark:text-yellow-200">
              Aucun chapitre sélectionné
            </p>

            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              Utilisez la navigation des chapitres
              pour accéder aux leçons.
            </p>
          </div>
        )}

        {/* ================================= */}
        {/* FORMULAIRE */}
        {/* ================================= */}

        {chapterId && (
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
                {editing ? (
                  <Pencil size={20} />
                ) : (
                  <Plus size={20} />
                )}
              </div>

              <div>
                <h2 className="font-bold text-lg theme-text">
                  {editing
                    ? "Modifier leçon"
                    : "Nouvelle leçon"}
                </h2>

                <p className="text-sm theme-text-secondary mt-0.5">
                  {editing
                    ? "Modifiez les informations de la leçon."
                    : "Créez une nouvelle leçon pour ce chapitre."}
                </p>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-5 md:p-6 space-y-5"
            >
              <div>
                <label className="block font-semibold theme-text mb-2">
                  Titre de la leçon
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
                  placeholder="Titre de la leçon"
                  value={form.title}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      title: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="block font-semibold theme-text mb-2">
                  Description
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
                  placeholder="Description"
                  value={form.description}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      description:
                        e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="block font-semibold theme-text mb-2">
                  Durée en minutes
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
                  value={form.duration_minutes}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      duration_minutes:
                        Number(
                          e.target.value
                        ),
                    })
                  }
                />
              </div>

              <div>
                <label className="block font-semibold theme-text mb-2">
                  Difficulté
                </label>

                <select
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
                  value={form.difficulty}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      difficulty:
                        e.target.value,
                    })
                  }
                >
                  <option value="easy">
                    Facile
                  </option>

                  <option value="medium">
                    Moyen
                  </option>

                  <option value="hard">
                    Difficile
                  </option>
                </select>
              </div>

              <div>
                <label className="block font-semibold theme-text mb-2">
                  URL vidéo
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
                  placeholder="URL vidéo"
                  value={form.video_url}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      video_url:
                        e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="block font-semibold theme-text mb-2">
                  URL miniature
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
                  placeholder="URL miniature"
                  value={form.thumbnail_url}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      thumbnail_url:
                        e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="block font-semibold theme-text mb-2">
                  Ordre de la leçon
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
                  value={form.order_number}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      order_number:
                        Number(
                          e.target.value
                        ),
                    })
                  }
                />
              </div>

              <label
                className="
                  flex
                  items-center
                  gap-3
                  p-4
                  rounded-2xl
                  theme-surface
                  theme-border
                  border
                  cursor-pointer
                  hover:bg-accent-soft
                  transition
                "
              >
                <input
                  type="checkbox"
                  checked={form.is_premium}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      is_premium:
                        e.target.checked,
                    })
                  }
                  className="
                    w-4
                    h-4
                    accent-[var(--accent-primary)]
                  "
                />

                <span className="font-medium theme-text">
                  Leçon Premium
                </span>
              </label>

              <div className="flex flex-wrap gap-3">

                <button
                  type="submit"
                  className="
                    bg-accent
                    hover:opacity-90
                    hover:-translate-y-0.5
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
                  {editing ? (
                    <>
                      <Pencil size={18} />
                      Mettre à jour
                    </>
                  ) : (
                    <>
                      <Plus size={18} />
                      Créer la leçon
                    </>
                  )}
                </button>

                {editing && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(null);

                      setForm({
                        title: "",
                        description: "",
                        duration_minutes: 10,
                        difficulty: "easy",
                        video_url: "",
                        thumbnail_url: "",
                        is_premium: false,
                        order_number: 1,
                      });
                    }}
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

        {/* ================================= */}
        {/* LISTE */}
        {/* ================================= */}

        {chapterId && (
          <div>
            <div
              className="
                flex
                flex-col
                md:flex-row
                md:items-center
                md:justify-between
                gap-4
                mb-4
              "
            >
              <div>
                <h2 className="text-xl font-bold theme-text">
                  Leçons
                </h2>

                <p className="text-sm theme-text-secondary mt-1">
                  {chapter?.subjects?.classes?.name ||
                    "Classe inconnue"}

                  {" · "}

                  {chapter?.subjects?.name ||
                    "Matière inconnue"}

                  {" · "}

                  {chapter?.title ||
                    "Chapitre inconnu"}
                </p>
              </div>

              {/* RECHERCHE */}

              <div className="relative w-full md:w-80">
                <Search
                  size={19}
                  className="
                    absolute
                    left-3
                    top-1/2
                    -translate-y-1/2
                    text-accent
                  "
                />

                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) =>
                    setSearchTerm(
                      e.target.value
                    )
                  }
                  placeholder="Rechercher une leçon..."
                  className="
                    w-full
                    theme-surface
                    theme-text
                    theme-border
                    border
                    rounded-2xl
                    pl-10
                    pr-10
                    py-3
                    outline-none
                    focus:ring-2
                    focus:ring-accent
                    focus:border-accent
                    transition
                  "
                />

                {searchTerm && (
                  <button
                    type="button"
                    onClick={() =>
                      setSearchTerm("")
                    }
                    className="
                      absolute
                      right-3
                      top-1/2
                      -translate-y-1/2
                      theme-text-secondary
                      hover:text-accent
                      transition
                    "
                    title="Effacer la recherche"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>

            {/* BARRE DE SELECTION */}

            {filteredLessons.length > 0 && (
              <div
                className="
                  theme-surface
                  theme-border
                  border
                  rounded-3xl
                  shadow-sm
                  p-4
                  mb-4
                  flex
                  flex-col
                  md:flex-row
                  md:items-center
                  md:justify-between
                  gap-3
                "
              >
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="
                      w-4
                      h-4
                      accent-[var(--accent-primary)]
                    "
                  />

                  <span className="font-medium theme-text">
                    Tout sélectionner
                  </span>
                </label>

                <div className="flex items-center gap-3">
                  {selectedLessons.length > 0 && (
                    <>
                      <span className="text-sm theme-text-secondary">
                        {selectedLessons.length} sélectionnée
                        {selectedLessons.length !== 1
                          ? "s"
                          : ""}
                      </span>

                      <button
                        type="button"
                        onClick={
                          handleDeleteSelected
                        }
                        className="
                          inline-flex
                          items-center
                          gap-2
                          bg-red-50
                          dark:bg-red-950/30
                          border
                          border-red-200
                          dark:border-red-900
                          text-red-700
                          dark:text-red-300
                          hover:bg-red-100
                          dark:hover:bg-red-950/50
                          px-4
                          py-2.5
                          rounded-xl
                          font-semibold
                          transition
                        "
                      >
                        <Trash2 size={17} />
                        Supprimer la sélection
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* CHARGEMENT */}

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
                <BookOpen
                  size={34}
                  className="mx-auto text-accent mb-3"
                />

                <p className="theme-text-secondary">
                  Chargement des leçons...
                </p>
              </div>
            ) : lessons.length === 0 ? (
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
                  <BookOpen size={28} />
                </div>

                <p className="theme-text font-semibold">
                  Aucune leçon disponible.
                </p>
              </div>
            ) : filteredLessons.length === 0 ? (
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
                  <Search size={28} />
                </div>

                <p className="font-semibold theme-text">
                  Aucune leçon trouvée.
                </p>

                <p className="text-sm theme-text-secondary mt-1">
                  Essayez avec un autre mot-clé.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setSearchTerm("")
                  }
                  className="
                    mt-4
                    text-accent
                    hover:opacity-80
                    font-semibold
                  "
                >
                  Effacer la recherche
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredLessons.map((lesson) => {
                  const importDate =
                    formatImportDate(lesson);

                  const isSelected =
                    selectedLessons.includes(
                      lesson.id
                    );

                  return (
                    <div
                      key={lesson.id}
                      className={`
                        theme-surface
                        shadow-sm
                        border
                        rounded-3xl
                        p-5
                        md:p-6
                        flex
                        flex-col
                        md:flex-row
                        md:items-center
                        md:justify-between
                        gap-4
                        transition
                        ${
                          isSelected
                            ? "border-accent bg-accent-soft"
                            : "theme-border hover:shadow-md"
                        }
                      `}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3">

                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() =>
                              toggleLessonSelection(
                                lesson.id
                              )
                            }
                            className="
                              w-4
                              h-4
                              mt-3
                              shrink-0
                              accent-[var(--accent-primary)]
                            "
                          />

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
                            {lesson.order_number}
                          </div>

                          <div className="min-w-0">
                            <h3 className="font-bold theme-text">
                              {lesson.title}
                            </h3>

                            {lesson.description && (
                              <p className="text-sm theme-text-secondary mt-1 leading-relaxed">
                                {lesson.description}
                              </p>
                            )}

                            <div className="flex flex-wrap items-center gap-2 mt-3">

                              {lesson.duration_minutes && (
                                <span
                                  className="
                                    inline-flex
                                    items-center
                                    px-2.5
                                    py-1
                                    rounded-lg
                                    bg-accent-soft
                                    border
                                    border-accent
                                    text-accent
                                    text-xs
                                    font-semibold
                                  "
                                >
                                  ⏱️ {lesson.duration_minutes} min
                                </span>
                              )}

                              {lesson.difficulty && (
                                <span
                                  className={`
                                    inline-flex
                                    items-center
                                    px-2.5
                                    py-1
                                    rounded-lg
                                    text-xs
                                    font-semibold
                                    ${
                                      lesson.difficulty ===
                                      "easy"
                                        ? "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-900"
                                        : lesson.difficulty ===
                                          "medium"
                                        ? "bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-900"
                                        : "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900"
                                    }
                                  `}
                                >
                                  {lesson.difficulty ===
                                  "easy"
                                    ? "Facile"
                                    : lesson.difficulty ===
                                      "medium"
                                    ? "Moyen"
                                    : "Difficile"}
                                </span>
                              )}

                              {lesson.is_premium && (
                                <span
                                  className="
                                    inline-flex
                                    items-center
                                    px-2.5
                                    py-1
                                    rounded-lg
                                    bg-yellow-50
                                    dark:bg-yellow-950/30
                                    border
                                    border-yellow-200
                                    dark:border-yellow-900
                                    text-yellow-700
                                    dark:text-yellow-300
                                    text-xs
                                    font-semibold
                                  "
                                >
                                  Premium
                                </span>
                              )}

                              {importDate && (
                                <span className="text-xs theme-text-secondary">
                                  📅 Importée le {importDate}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 md:justify-end">

                        {/* QUIZ */}

                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/admin/lesson/${lesson.id}/quiz`
                            )
                          }
                          className="
                            inline-flex
                            items-center
                            gap-2
                            px-3
                            py-2.5
                            bg-green-50
                            dark:bg-green-950/30
                            border
                            border-green-200
                            dark:border-green-900
                            hover:bg-green-100
                            dark:hover:bg-green-950/50
                            text-green-700
                            dark:text-green-300
                            rounded-xl
                            font-semibold
                            transition
                          "
                          title="Gérer le quiz"
                        >
                          <ClipboardCheck size={17} />

                          <span className="hidden sm:inline">
                            Quiz
                          </span>
                        </button>

                        {/* BLOCS */}

                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/admin/lesson/${lesson.id}/blocks`
                            )
                          }
                          className="
                            inline-flex
                            items-center
                            gap-2
                            px-3
                            py-2.5
                            bg-accent-soft
                            border
                            border-accent
                            hover:opacity-80
                            text-accent
                            rounded-xl
                            font-semibold
                            transition
                          "
                          title="Gérer les blocs"
                        >
                          <BookOpen size={17} />

                          <span className="hidden sm:inline">
                            Blocs
                          </span>
                        </button>

                        {/* MODIFIER */}

                        <button
                          type="button"
                          onClick={() =>
                            editLesson(lesson)
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

                        {/* SUPPRIMER */}

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(
                              lesson.id
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
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}