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
  X
} from "lucide-react";

import {
  getLessons,
  createLesson,
  updateLesson,
  deleteLesson,
  importAdminLessonPack,
  getChapterContext
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
    order_number: 1
  });

  // =====================================
  // CHARGER LE CONTEXTE
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
        hard: "difficile"
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
          chapter_id: chapterId
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
        order_number: 1
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
        lesson.order_number || 1
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth"
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
      year: "numeric"
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
    <div className="space-y-6">

      {/* HEADER */}

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

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

          <div>

            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">

              <BookOpen
                size={27}
                className="text-blue-600"
              />

              Gestion des leçons

            </h1>

            <div className="flex flex-wrap gap-2 mt-4">

              <div
                className="
                  inline-flex
                  items-center
                  gap-2
                  px-3
                  py-2
                  rounded-xl
                  bg-blue-50
                  text-blue-700
                  text-sm
                  font-semibold
                "
              >
                <GraduationCap size={16} />

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
                  bg-green-50
                  text-green-700
                  text-sm
                  font-semibold
                "
              >
                <Library size={16} />

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
                  bg-purple-50
                  text-purple-700
                  text-sm
                  font-semibold
                "
              >
                <BookOpen size={16} />

                {contextLoading
                  ? "Chargement..."
                  : chapter?.title ||
                    "Chapitre inconnu"}

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
              bg-green-600
              hover:bg-green-700
              text-white
              px-5
              py-3
              rounded-xl
              font-semibold
              transition
              shadow-sm
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

      {/* FIL D'ARIANE */}

      <div
        className="
          bg-gray-50
          border
          border-gray-100
          rounded-xl
          px-4
          py-3
        "
      >

        <div className="text-sm text-gray-500">

          Administration

          <span className="mx-2">
            ›
          </span>

          Matières

          <span className="mx-2">
            ›
          </span>

          <span className="font-semibold text-gray-700">
            {chapter?.subjects?.name ||
              "Matière"}
          </span>

          <span className="mx-2">
            ›
          </span>

          <span className="font-semibold text-gray-700">
            {chapter?.title ||
              "Chapitre"}
          </span>

          <span className="mx-2">
            ›
          </span>

          <span className="font-semibold text-blue-600">
            Leçons
          </span>

        </div>

      </div>

      {/* AUCUN CHAPITRE */}

      {!chapterId && (

        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5">

          <p className="font-semibold text-yellow-800">
            Aucun chapitre sélectionné
          </p>

          <p className="text-sm text-yellow-700 mt-1">
            Utilisez la navigation des chapitres
            pour accéder aux leçons.
          </p>

        </div>

      )}

      {/* FORMULAIRE */}

      {chapterId && (

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">

          <div className="flex items-center gap-2 mb-4">

            <Plus
              size={20}
              className="text-blue-600"
            />

            <h2 className="font-bold text-lg text-gray-900">

              {editing
                ? "Modifier leçon"
                : "Nouvelle leçon"}

            </h2>

          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >

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
              placeholder="Titre de la leçon"
              value={form.title}
              onChange={(e) =>
                setForm({
                  ...form,
                  title: e.target.value
                })
              }
            />

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
              "
              placeholder="Description"
              value={form.description}
              onChange={(e) =>
                setForm({
                  ...form,
                  description:
                    e.target.value
                })
              }
            />

            <div>

              <label className="block font-medium text-gray-700 mb-2">
                Durée en minutes
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
                  form.duration_minutes
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    duration_minutes:
                      Number(
                        e.target.value
                      )
                  })
                }
              />

            </div>

            <div>

              <label className="block font-medium text-gray-700 mb-2">
                Difficulté
              </label>

              <select
                className="
                  w-full
                  border
                  border-gray-200
                  p-3
                  rounded-xl
                "
                value={form.difficulty}
                onChange={(e) =>
                  setForm({
                    ...form,
                    difficulty:
                      e.target.value
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

            <input
              className="
                w-full
                border
                border-gray-200
                p-3
                rounded-xl
              "
              placeholder="URL vidéo"
              value={form.video_url}
              onChange={(e) =>
                setForm({
                  ...form,
                  video_url:
                    e.target.value
                })
              }
            />

            <input
              className="
                w-full
                border
                border-gray-200
                p-3
                rounded-xl
              "
              placeholder="URL miniature"
              value={
                form.thumbnail_url
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  thumbnail_url:
                    e.target.value
                })
              }
            />

            <div>

              <label className="block font-medium text-gray-700 mb-2">
                Ordre de la leçon
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
                  form.order_number
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    order_number:
                      Number(
                        e.target.value
                      )
                  })
                }
              />

            </div>

            <label className="flex items-center gap-3">

              <input
                type="checkbox"
                checked={
                  form.is_premium
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    is_premium:
                      e.target.checked
                  })
                }
              />

              <span className="font-medium text-gray-700">
                Leçon Premium
              </span>

            </label>

            <div className="flex gap-3">

              <button
                type="submit"
                className="
                  bg-blue-600
                  hover:bg-blue-700
                  text-white
                  px-5
                  py-3
                  rounded-xl
                  font-semibold
                  flex
                  items-center
                  gap-2
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
                      order_number: 1
                    });

                  }}
                  className="
                    px-5
                    py-3
                    rounded-xl
                    border
                    border-gray-200
                    text-gray-600
                    font-semibold
                  "
                >
                  Annuler
                </button>

              )}

            </div>

          </form>

        </div>

      )}

      {/* LISTE */}

      {chapterId && (

        <div>

          <div className="
            flex
            flex-col
            md:flex-row
            md:items-center
            md:justify-between
            gap-4
            mb-4
          ">

            <div>

              <h2 className="text-xl font-bold text-gray-900">
                Leçons
              </h2>

              <p className="text-sm text-gray-500 mt-1">

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
                  text-gray-400
                "
              />

              <input
                type="text"
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm(e.target.value)
                }
                placeholder="Rechercher une leçon..."
                className="
                  w-full
                  border
                  border-gray-200
                  rounded-xl
                  pl-10
                  pr-10
                  py-3
                  outline-none
                  focus:ring-2
                  focus:ring-blue-500
                  focus:border-blue-300
                  bg-white
                "
              />

              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="
                    absolute
                    right-3
                    top-1/2
                    -translate-y-1/2
                    text-gray-400
                    hover:text-gray-700
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
                bg-white
                rounded-2xl
                shadow-sm
                border
                border-gray-100
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
                  className="w-4 h-4"
                />

                <span className="font-medium text-gray-700">
                  Tout sélectionner
                </span>

              </label>

              <div className="flex items-center gap-3">

                {selectedLessons.length > 0 && (
                  <>

                    <span className="text-sm text-gray-500">
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
                        bg-red-600
                        hover:bg-red-700
                        text-white
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

          {loading ? (

            <div className="bg-white rounded-2xl p-8 text-center shadow-sm">

              <p className="text-gray-500">
                Chargement des leçons...
              </p>

            </div>

          ) : lessons.length === 0 ? (

            <div className="bg-white rounded-2xl p-8 text-center shadow-sm">

              <BookOpen
                size={42}
                className="mx-auto text-gray-300 mb-3"
              />

              <p className="text-gray-500">
                Aucune leçon disponible.
              </p>

            </div>

          ) : filteredLessons.length === 0 ? (

            <div className="bg-white rounded-2xl p-8 text-center shadow-sm">

              <Search
                size={42}
                className="mx-auto text-gray-300 mb-3"
              />

              <p className="font-semibold text-gray-700">
                Aucune leçon trouvée.
              </p>

              <p className="text-sm text-gray-500 mt-1">
                Essayez avec un autre mot-clé.
              </p>

              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="
                  mt-4
                  text-blue-600
                  hover:text-blue-700
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
                      bg-white
                      shadow-sm
                      border
                      rounded-2xl
                      p-5
                      flex
                      flex-col
                      md:flex-row
                      md:items-center
                      md:justify-between
                      gap-4
                      ${
                        isSelected
                          ? "border-blue-300 bg-blue-50/30"
                          : "border-gray-100"
                      }
                    `}
                  >

                    <div className="flex-1">

                      <div className="flex items-center gap-3">

                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() =>
                            toggleLessonSelection(
                              lesson.id
                            )
                          }
                          className="w-4 h-4 flex-shrink-0"
                        />

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
                          "
                        >
                          {lesson.order_number}
                        </div>

                        <div>

                          <h3 className="font-bold text-gray-900">
                            {lesson.title}
                          </h3>

                          {lesson.description && (
                            <p className="text-sm text-gray-500 mt-1">
                              {lesson.description}
                            </p>
                          )}

                          {importDate && (
                            <p className="text-xs text-gray-400 mt-2">
                              📅 Importée le {importDate}
                            </p>
                          )}

                        </div>

                      </div>

                    </div>

                    <div className="flex flex-wrap gap-2">

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
                          bg-green-100
                          hover:bg-green-200
                          text-green-700
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
                          bg-blue-100
                          hover:bg-blue-200
                          text-blue-700
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
                          bg-yellow-100
                          hover:bg-yellow-200
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
                          bg-red-100
                          hover:bg-red-200
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
  );
}