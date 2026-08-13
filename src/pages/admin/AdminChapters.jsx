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
  Search,
  X
} from "lucide-react";

import {
  getChapters,
  createChapter,
  updateChapter,
  deleteChapter,
  importAdminLessonPack,
  getAllSubjects
} from "../../services/educationAdminService";

export default function AdminChapters() {
  const { subjectId } = useParams();
  const navigate = useNavigate();

  const [chapters, setChapters] = useState([]);

  const [loading, setLoading] = useState(true);

  const [contextLoading, setContextLoading] =
    useState(true);

  const [subject, setSubject] = useState(null);

  const [editing, setEditing] = useState(null);

  const [selectedChapters, setSelectedChapters] =
    useState([]);

  const [searchTerm, setSearchTerm] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    order_number: 1
  });

  // =====================================
  // CHARGER LE CONTEXTE MATIÈRE / CLASSE
  // =====================================

  async function loadSubjectContext() {
    try {
      setContextLoading(true);

      const subjects = await getAllSubjects();

      const currentSubject = (subjects || []).find(
        (item) => item.id === subjectId
      );

      setSubject(currentSubject || null);
    } catch (error) {
      console.error(
        "Erreur chargement contexte matière :",
        error
      );

      setSubject(null);
    } finally {
      setContextLoading(false);
    }
  }

  // =====================================
  // CHARGER LES CHAPITRES
  // =====================================

  async function loadChapters() {
    try {
      setLoading(true);

      const result = await getChapters(subjectId);

      setChapters(result || []);

      setSelectedChapters((previous) =>
        previous.filter((id) =>
          (result || []).some(
            (chapter) => chapter.id === id
          )
        )
      );
    } catch (error) {
      console.error(
        "Erreur chargement chapitres :",
        error
      );
    } finally {
      setLoading(false);
    }
  }

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

      const created = result?.created || {};
      const skipped = result?.skipped || {};
      const updated = result?.updated || {};

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

      await loadChapters();
      await loadSubjectContext();

      setSelectedChapters([]);

      e.target.value = "";
    } catch (error) {
      console.error(
        "Erreur import JSON :",
        error
      );

      alert(
        "❌ Erreur import JSON :\n\n" +
        (error.message ||
          "Une erreur inconnue est survenue.")
      );

      e.target.value = "";
    }
  }

  // =====================================
  // INITIALISATION
  // =====================================

  useEffect(() => {
    if (!subjectId) {
      return;
    }

    loadSubjectContext();
    loadChapters();
  }, [subjectId]);

  // =====================================
  // RECHERCHE
  // =====================================

  const normalizedSearch = searchTerm
    .trim()
    .toLowerCase();

  const filteredChapters = chapters.filter(
    (chapter) => {
      if (!normalizedSearch) {
        return true;
      }

      const title =
        chapter?.title?.toLowerCase() || "";

      const description =
        chapter?.description?.toLowerCase() || "";

      const order = String(
        chapter?.order_number ?? ""
      );

      return (
        title.includes(normalizedSearch) ||
        description.includes(normalizedSearch) ||
        order.includes(normalizedSearch)
      );
    }
  );

  // =====================================
  // CREER / MODIFIER
  // =====================================

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      if (!form.title.trim()) {
        alert("Veuillez saisir le titre du chapitre.");
        return;
      }

      if (editing) {
        await updateChapter(
          editing.id,
          form
        );
      } else {
        await createChapter({
          ...form,
          subject_id: subjectId
        });
      }

      setForm({
        title: "",
        description: "",
        order_number: 1
      });

      setEditing(null);

      await loadChapters();
    } catch (error) {
      console.error(
        "Erreur sauvegarde chapitre :",
        error
      );

      alert(
        "❌ Impossible d'enregistrer le chapitre.\n\n" +
        (error.message || "")
      );
    }
  }

  // =====================================
  // MODIFIER
  // =====================================

  function editChapter(chapter) {
    setEditing(chapter);

    setForm({
      title: chapter.title || "",

      description:
        chapter.description || "",

      order_number:
        chapter.order_number || 1
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  // =====================================
  // SELECTIONNER UN CHAPITRE
  // =====================================

  function toggleChapterSelection(id) {
    setSelectedChapters((previous) => {
      if (previous.includes(id)) {
        return previous.filter(
          (chapterId) => chapterId !== id
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
      selectedChapters.length ===
      filteredChapters.length
    ) {
      setSelectedChapters([]);
      return;
    }

    setSelectedChapters(
      filteredChapters.map(
        (chapter) => chapter.id
      )
    );
  }

  // =====================================
  // SUPPRIMER
  // =====================================

  async function handleDelete(id) {
    if (
      !confirm(
        "Supprimer ce chapitre ?\n\nToutes ses leçons, blocs et quiz associés seront également supprimés."
      )
    ) {
      return;
    }

    try {
      await deleteChapter(id);

      setSelectedChapters((previous) =>
        previous.filter(
          (chapterId) => chapterId !== id
        )
      );

      await loadChapters();
    } catch (error) {
      console.error(
        "Erreur suppression chapitre :",
        error
      );

      alert(
        "❌ Impossible de supprimer le chapitre.\n\n" +
        (error.message || "")
      );
    }
  }

  // =====================================
  // SUPPRESSION MULTIPLE
  // =====================================

  async function handleDeleteSelected() {
    if (selectedChapters.length === 0) {
      return;
    }

    const confirmed = confirm(
      `Supprimer ${selectedChapters.length} chapitre(s) sélectionné(s) ?\n\nToutes les leçons, blocs et quiz associés seront également supprimés.\n\nCette action est irréversible.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);

      for (const chapterId of selectedChapters) {
        await deleteChapter(chapterId);
      }

      setSelectedChapters([]);

      await loadChapters();
    } catch (error) {
      console.error(
        "Erreur suppression multiple chapitres :",
        error
      );

      alert(
        "❌ La suppression multiple a rencontré une erreur.\n\n" +
        (error.message || "")
      );

      await loadChapters();
    } finally {
      setLoading(false);
    }
  }

  // =====================================
  // DATE D'IMPORT / CREATION
  // =====================================

  function formatImportDate(chapter) {
    const dateValue =
      chapter?.imported_at ||
      chapter?.created_at;

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
  // AFFICHAGE
  // =====================================

  const allSelected =
    filteredChapters.length > 0 &&
    selectedChapters.length ===
      filteredChapters.length;

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

              Gestion des chapitres

            </h1>

            <div className="flex flex-wrap gap-2 mt-4">

              <div className="
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
              ">
                <GraduationCap size={16} />

                {contextLoading
                  ? "Chargement..."
                  : subject?.classes?.name ||
                    "Classe inconnue"}
              </div>

              <div className="
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
              ">
                <Library size={16} />

                {contextLoading
                  ? "Chargement..."
                  : subject?.name ||
                    "Matière inconnue"}
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

      <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">

        <div className="text-sm text-gray-500">

          Administration

          <span className="mx-2">›</span>

          Matières

          <span className="mx-2">›</span>

          <span className="font-semibold text-gray-700">
            {subject?.name || "Matière"}
          </span>

          <span className="mx-2">›</span>

          <span className="font-semibold text-blue-600">
            Chapitres
          </span>

        </div>

      </div>

      {/* FORMULAIRE */}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">

        <div className="flex items-center gap-2 mb-4">

          <Plus
            size={20}
            className="text-blue-600"
          />

          <h2 className="font-bold text-lg text-gray-900">
            {editing
              ? "Modifier chapitre"
              : "Nouveau chapitre"}
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
              rounded-xl
              p-3
              focus:outline-none
              focus:ring-2
              focus:ring-blue-500
            "
            placeholder="Titre du chapitre"
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
              rounded-xl
              p-3
              focus:outline-none
              focus:ring-2
              focus:ring-blue-500
            "
            placeholder="Description du chapitre"
            value={form.description}
            onChange={(e) =>
              setForm({
                ...form,
                description: e.target.value
              })
            }
          />

          <div>

            <label className="block font-medium text-gray-700 mb-2">
              Ordre du chapitre
            </label>

            <input
              type="number"
              min="1"
              className="
                w-full
                border
                border-gray-200
                rounded-xl
                p-3
                focus:outline-none
                focus:ring-2
                focus:ring-blue-500
              "
              value={form.order_number}
              onChange={(e) =>
                setForm({
                  ...form,
                  order_number:
                    Number(e.target.value)
                })
              }
            />

          </div>

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
                transition
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
                  Créer le chapitre
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

      {/* LISTE DES CHAPITRES */}

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
              Chapitres
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              {subject?.name || "Matière"}
              {" · "}
              {subject?.classes?.name ||
                "Classe inconnue"}
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
              placeholder="Rechercher un chapitre..."
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

        {filteredChapters.length > 0 && (
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

              {selectedChapters.length > 0 && (
                <>

                  <span className="text-sm text-gray-500">
                    {selectedChapters.length} sélectionné
                    {selectedChapters.length !== 1
                      ? "s"
                      : ""}
                  </span>

                  <button
                    type="button"
                    onClick={handleDeleteSelected}
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
              Chargement des chapitres...
            </p>

          </div>

        ) : chapters.length === 0 ? (

          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">

            <BookOpen
              size={42}
              className="mx-auto text-gray-300 mb-3"
            />

            <p className="text-gray-500">
              Aucun chapitre disponible.
            </p>

          </div>

        ) : filteredChapters.length === 0 ? (

          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">

            <Search
              size={42}
              className="mx-auto text-gray-300 mb-3"
            />

            <p className="font-semibold text-gray-700">
              Aucun chapitre trouvé.
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

            {filteredChapters.map((chapter) => {

              const importDate =
                formatImportDate(chapter);

              const isSelected =
                selectedChapters.includes(
                  chapter.id
                );

              return (
                <div
                  key={chapter.id}
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
                          toggleChapterSelection(
                            chapter.id
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
                        {chapter.order_number}
                      </div>

                      <div>

                        <h3 className="font-bold text-gray-900">
                          {chapter.title}
                        </h3>

                        {chapter.description && (
                          <p className="text-sm text-gray-500 mt-1">
                            {chapter.description}
                          </p>
                        )}

                        {importDate && (
                          <p className="text-xs text-gray-400 mt-2">
                            📅 Importé le {importDate}
                          </p>
                        )}

                      </div>

                    </div>

                  </div>

                  <div className="flex gap-2">

                    <button
                      onClick={() =>
                        editChapter(chapter)
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

                    <button
                      onClick={() =>
                        handleDelete(chapter.id)
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

                    <button
                      onClick={() =>
                        navigate(
                          `/admin/lessons/${chapter.id}`
                        )
                      }
                      className="
                        bg-green-600
                        hover:bg-green-700
                        text-white
                        px-4
                        py-2.5
                        rounded-xl
                        font-semibold
                        transition
                      "
                    >
                      Leçons
                    </button>

                  </div>

                </div>
              );
            })}

          </div>

        )}

      </div>

    </div>
  );
}