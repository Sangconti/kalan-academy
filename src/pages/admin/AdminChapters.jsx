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
              theme-text
              hover:text-accent
              mb-5
              transition
              font-medium
            "
          >
            <ArrowLeft size={18} />
            Retour
          </button>

          <div className="
            flex
            flex-col
            lg:flex-row
            lg:items-center
            lg:justify-between
            gap-5
          ">

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

              <h1 className="
                text-2xl
                md:text-3xl
                font-bold
                leading-tight
                theme-text
                flex
                items-center
                gap-3
              ">
                <BookOpen
                  size={28}
                  className="text-accent shrink-0"
                />

                Gestion des chapitres
              </h1>

              <p className="
                theme-text-secondary
                mt-3
                leading-relaxed
              ">
                Gérez les chapitres et leur contenu
                pédagogique pour cette matière.
              </p>

              <div className="
                flex
                flex-wrap
                gap-2
                mt-5
              ">

                <div
                  className="
                    inline-flex
                    items-center
                    gap-2
                    px-3
                    py-2
                    rounded-xl
                    bg-white/70
                    dark:bg-gray-950/30
                    theme-text
                    text-sm
                    font-medium
                    border
                    border-white/50
                    dark:border-white/10
                  "
                >
                  <GraduationCap
                    size={16}
                    className="text-accent"
                  />

                  {contextLoading
                    ? "Chargement..."
                    : subject?.classes?.name ||
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
                    bg-white/70
                    dark:bg-gray-950/30
                    theme-text
                    text-sm
                    font-medium
                    border
                    border-white/50
                    dark:border-white/10
                  "
                >
                  <Library
                    size={16}
                    className="text-accent"
                  />

                  {contextLoading
                    ? "Chargement..."
                    : subject?.name ||
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
                    bg-white/70
                    dark:bg-gray-950/30
                    theme-text
                    text-sm
                    font-medium
                    border
                    border-white/50
                    dark:border-white/10
                  "
                >
                  <BookOpen
                    size={16}
                    className="text-accent"
                  />

                  {chapters.length} chapitre
                  {chapters.length !== 1
                    ? "s"
                    : ""}
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
                transition
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
        <div className="text-sm theme-text-secondary">

          Administration

          <span className="mx-2">
            ›
          </span>

          Matières

          <span className="mx-2">
            ›
          </span>

          <span className="font-semibold theme-text">
            {subject?.name || "Matière"}
          </span>

          <span className="mx-2">
            ›
          </span>

          <span className="font-semibold text-accent">
            Chapitres
          </span>

        </div>
      </div>

      {/* ================================= */}
      {/* AUCUN CHAPITRE */}
      {/* ================================= */}

      {!subjectId && (

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
          <p className="
            font-semibold
            text-yellow-800
            dark:text-yellow-300
          ">
            Aucun chapitre sélectionné
          </p>

          <p className="
            text-sm
            text-yellow-700
            dark:text-yellow-400
            mt-1
          ">
            Utilisez la navigation des matières
            pour accéder aux chapitres.
          </p>
        </div>

      )}

      {/* ================================= */}
      {/* FORMULAIRE */}
      {/* ================================= */}

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

        <div className="
          p-5
          md:p-6
          border-b
          border-accent
          flex
          items-center
          gap-3
        ">

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
              shrink-0
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
                ? "Modifier chapitre"
                : "Nouveau chapitre"}
            </h2>

            <p className="
              text-sm
              theme-text-secondary
              mt-0.5
            ">
              {editing
                ? "Modifiez les informations du chapitre."
                : "Ajoutez un nouveau chapitre à cette matière."}
            </p>

          </div>

        </div>

        <div className="p-5 md:p-6">

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >

            <input
              className="
                w-full
                theme-surface
                theme-text
                theme-border
                border
                rounded-xl
                px-4
                py-3
                outline-none
                focus:ring-2
                focus:ring-accent
                focus:border-accent
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
                theme-surface
                theme-text
                theme-border
                border
                rounded-xl
                px-4
                py-3
                outline-none
                focus:ring-2
                focus:ring-accent
                focus:border-accent
                resize-y
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

              <label className="
                block
                font-medium
                theme-text
                mb-2
              ">
                Ordre du chapitre
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
                  rounded-xl
                  px-4
                  py-3
                  outline-none
                  focus:ring-2
                  focus:ring-accent
                  focus:border-accent
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
                  transition
                  shadow-md
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
                    theme-surface
                    theme-border
                    border
                    theme-text
                    font-semibold
                    hover:bg-accent-soft
                    transition
                  "
                >
                  Annuler
                </button>
              )}

            </div>

          </form>

        </div>
      </div>

      {/* ================================= */}
      {/* LISTE DES CHAPITRES */}
      {/* ================================= */}

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

            <h2 className="
              text-xl
              font-bold
              theme-text
            ">
              Chapitres
            </h2>

            <p className="
              text-sm
              theme-text-secondary
              mt-1
            ">
              {subject?.name || "Matière"}
              {" · "}
              {subject?.classes?.name ||
                "Classe inconnue"}
            </p>

          </div>

          {/* RECHERCHE */}

          <div className="
            relative
            w-full
            md:w-80
          ">

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
                setSearchTerm(e.target.value)
              }
              placeholder="Rechercher un chapitre..."
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

        {filteredChapters.length > 0 && (
          <div
            className="
              theme-surface
              theme-border
              rounded-3xl
              shadow-sm
              border
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

            <label className="
              flex
              items-center
              gap-3
              cursor-pointer
            ">

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

              <span className="
                font-medium
                theme-text
              ">
                Tout sélectionner
              </span>

            </label>

            <div className="
              flex
              items-center
              gap-3
            ">

              {selectedChapters.length > 0 && (
                <>

                  <span className="
                    text-sm
                    theme-text-secondary
                  ">
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
                      shadow-sm
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

          <div
            className="
              theme-surface
              theme-border
              border
              rounded-3xl
              p-8
              text-center
              shadow-sm
            "
          >

            <BookOpen
              size={34}
              className="mx-auto text-accent mb-3 animate-pulse"
            />

            <p className="theme-text-secondary">
              Chargement des chapitres...
            </p>

          </div>

        ) : chapters.length === 0 ? (

          <div
            className="
              theme-surface
              theme-border
              border
              rounded-3xl
              p-8
              text-center
              shadow-sm
            "
          >

            <div
              className="
                w-14
                h-14
                rounded-2xl
                bg-accent-soft
                border
                border-accent
                text-accent
                flex
                items-center
                justify-center
                mx-auto
                mb-4
              "
            >
              <BookOpen size={28} />
            </div>

            <p className="
              font-semibold
              theme-text
            ">
              Aucun chapitre disponible.
            </p>

            <p className="
              text-sm
              theme-text-secondary
              mt-1
            ">
              Créez votre premier chapitre
              ci-dessus.
            </p>

          </div>

        ) : filteredChapters.length === 0 ? (

          <div
            className="
              theme-surface
              theme-border
              border
              rounded-3xl
              p-8
              text-center
              shadow-sm
            "
          >

            <div
              className="
                w-14
                h-14
                rounded-2xl
                bg-accent-soft
                border
                border-accent
                text-accent
                flex
                items-center
                justify-center
                mx-auto
                mb-4
              "
            >
              <Search size={28} />
            </div>

            <p className="
              font-semibold
              theme-text
            ">
              Aucun chapitre trouvé.
            </p>

            <p className="
              text-sm
              theme-text-secondary
              mt-1
            ">
              Essayez avec un autre mot-clé.
            </p>

            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="
                mt-4
                text-accent
                hover:opacity-80
                font-semibold
                transition
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
                    theme-surface
                    shadow-sm
                    border
                    rounded-3xl
                    p-5
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

                    <div className="
                      flex
                      items-center
                      gap-3
                    ">

                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() =>
                          toggleChapterSelection(
                            chapter.id
                          )
                        }
                        className="
                          w-4
                          h-4
                          flex-shrink-0
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
                          flex-shrink-0
                        "
                      >
                        {chapter.order_number}
                      </div>

                      <div className="min-w-0">

                        <h3 className="
                          font-bold
                          theme-text
                          truncate
                        ">
                          {chapter.title}
                        </h3>

                        {chapter.description && (
                          <p className="
                            text-sm
                            theme-text-secondary
                            mt-1
                          ">
                            {chapter.description}
                          </p>
                        )}

                        {importDate && (
                          <p className="
                            text-xs
                            theme-text-secondary
                            mt-2
                          ">
                            📅 Importé le {importDate}
                          </p>
                        )}

                      </div>

                    </div>

                  </div>

                  <div className="
                    flex
                    flex-wrap
                    gap-2
                  ">

                    {/* MODIFIER */}

                    <button
                      type="button"
                      onClick={() =>
                        editChapter(chapter)
                      }
                      className="
                        p-2.5
                        bg-yellow-100
                        dark:bg-yellow-950/30
                        hover:bg-yellow-200
                        dark:hover:bg-yellow-900/40
                        text-yellow-700
                        dark:text-yellow-300
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
                        handleDelete(chapter.id)
                      }
                      className="
                        p-2.5
                        bg-red-100
                        dark:bg-red-950/30
                        hover:bg-red-200
                        dark:hover:bg-red-900/40
                        text-red-700
                        dark:text-red-300
                        rounded-xl
                        transition
                      "
                      title="Supprimer"
                    >
                      <Trash2 size={18} />
                    </button>

                    {/* LEÇONS */}

                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/admin/lessons/${chapter.id}`
                        )
                      }
                      className="
                        bg-accent
                        hover:opacity-90
                        hover:-translate-y-0.5
                        text-white
                        px-4
                        py-2.5
                        rounded-xl
                        font-semibold
                        transition
                        shadow-sm
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