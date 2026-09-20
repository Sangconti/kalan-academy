// src/pages/admin/AdminLessonBlocks.jsx

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  ArrowLeft,
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  GripVertical
} from "lucide-react";

import {
  getLessonBlocks,
  createLessonBlock,
  updateLessonBlock,
  deleteLessonBlock
} from "../../services/educationAdminService";

export default function AdminLessonBlocks() {
  const { lessonId } = useParams();

  const navigate = useNavigate();

  const [blocks, setBlocks] = useState([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState({
    block_type: "text",
    title: "",
    content: "",
    order_number: 1
  });

  // =====================================
  // CHARGER LES BLOCS
  // =====================================

  async function loadBlocks() {
    if (!lessonId) {
      setBlocks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const data =
        await getLessonBlocks(lessonId);

      setBlocks(data || []);
    } catch (error) {
      console.error(
        "Erreur chargement blocs :",
        error
      );

      alert(
        "❌ Impossible de charger les blocs.\n\n" +
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
    loadBlocks();
  }, [lessonId]);

  // =====================================
  // RESET FORMULAIRE
  // =====================================

  function resetForm() {
    setEditing(null);

    setForm({
      block_type: "text",
      title: "",
      content: "",
      order_number:
        blocks.length + 1
    });
  }

  // =====================================
  // CREER / MODIFIER
  // =====================================

  async function handleSubmit(e) {
    e.preventDefault();

    if (!lessonId) {
      alert(
        "Aucune leçon sélectionnée."
      );

      return;
    }

    if (!form.title.trim()) {
      alert(
        "Veuillez saisir le titre du bloc."
      );

      return;
    }

    if (!form.content.trim()) {
      alert(
        "Veuillez saisir le contenu du bloc."
      );

      return;
    }

    try {
      setSaving(true);

      if (editing) {
        await updateLessonBlock(
          editing.id,
          form
        );
      } else {
        await createLessonBlock({
          ...form,
          lesson_id: lessonId
        });
      }

      resetForm();

      await loadBlocks();
    } catch (error) {
      console.error(
        "Erreur sauvegarde bloc :",
        error
      );

      alert(
        "❌ Impossible d'enregistrer le bloc.\n\n" +
        (error.message || "")
      );
    } finally {
      setSaving(false);
    }
  }

  // =====================================
  // MODIFIER
  // =====================================

  function editBlock(block) {
    setEditing(block);

    setForm({
      block_type:
        block.block_type ||
        "text",

      title:
        block.title || "",

      content:
        block.content || "",

      order_number:
        block.order_number || 1
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  // =====================================
  // SUPPRIMER
  // =====================================

  async function handleDelete(id) {
    const confirmed = confirm(
      "Supprimer ce bloc ?\n\nCette action est irréversible."
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteLessonBlock(id);

      if (editing?.id === id) {
        resetForm();
      }

      await loadBlocks();
    } catch (error) {
      console.error(
        "Erreur suppression bloc :",
        error
      );

      alert(
        "❌ Impossible de supprimer le bloc.\n\n" +
        (error.message || "")
      );
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
            md:flex-row
            md:items-center
            md:justify-between
            gap-5
          ">

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

                Blocs pédagogiques
              </h1>

              <p className="
                theme-text-secondary
                mt-3
                leading-relaxed
              ">
                Gérez le contenu pédagogique
                de la leçon, bloc par bloc.
              </p>

            </div>

            <div
              className="
                inline-flex
                items-center
                gap-2
                px-4
                py-2.5
                rounded-xl
                bg-white/70
                dark:bg-gray-950/30
                theme-text
                border
                border-white/50
                dark:border-white/10
                font-semibold
                text-sm
                shrink-0
              "
            >
              <BookOpen
                size={17}
                className="text-accent"
              />

              {blocks.length} bloc
              {blocks.length !== 1
                ? "s"
                : ""}
            </div>

          </div>

        </div>
      </div>

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

            <h2 className="
              font-bold
              text-lg
              theme-text
            ">
              {editing
                ? "Modifier le bloc"
                : "Nouveau bloc"}
            </h2>

            <p className="
              text-sm
              theme-text-secondary
              mt-0.5
            ">
              {editing
                ? "Modifiez le contenu de ce bloc pédagogique."
                : "Ajoutez un nouveau bloc au contenu de la leçon."}
            </p>

          </div>

        </div>

        <div className="p-5 md:p-6">

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >

            {/* TYPE */}

            <div>

              <label className="
                block
                font-medium
                theme-text
                mb-2
              ">
                Type de bloc
              </label>

              <select
                className="
                  w-full
                  theme-surface
                  theme-text
                  theme-border
                  border
                  p-3
                  rounded-xl
                  outline-none
                  focus:ring-2
                  focus:ring-accent
                  focus:border-accent
                "
                value={form.block_type}
                onChange={(e) =>
                  setForm({
                    ...form,
                    block_type:
                      e.target.value
                  })
                }
              >

                <option value="text">
                  Texte
                </option>

              </select>

            </div>

            {/* TITRE */}

            <div>

              <label className="
                block
                font-medium
                theme-text
                mb-2
              ">
                Titre du bloc
              </label>

              <input
                className="
                  w-full
                  theme-surface
                  theme-text
                  theme-border
                  border
                  p-3
                  rounded-xl
                  outline-none
                  focus:ring-2
                  focus:ring-accent
                  focus:border-accent
                "
                placeholder="Titre du bloc"
                value={form.title}
                onChange={(e) =>
                  setForm({
                    ...form,
                    title: e.target.value
                  })
                }
              />

            </div>

            {/* CONTENU */}

            <div>

              <label className="
                block
                font-medium
                theme-text
                mb-2
              ">
                Contenu
              </label>

              <textarea
                rows={8}
                className="
                  w-full
                  theme-surface
                  theme-text
                  theme-border
                  border
                  p-3
                  rounded-xl
                  outline-none
                  focus:ring-2
                  focus:ring-accent
                  focus:border-accent
                  resize-y
                "
                placeholder="Contenu pédagogique du bloc..."
                value={form.content}
                onChange={(e) =>
                  setForm({
                    ...form,
                    content:
                      e.target.value
                  })
                }
              />

            </div>

            {/* ORDRE */}

            <div>

              <label className="
                block
                font-medium
                theme-text
                mb-2
              ">
                Ordre du bloc
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
                  p-3
                  rounded-xl
                  outline-none
                  focus:ring-2
                  focus:ring-accent
                  focus:border-accent
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
                  transition
                  shadow-md
                "
              >

                {editing ? (
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
                      : "Créer le bloc"}
                  </>
                )}

              </button>

              {editing && (

                <button
                  type="button"
                  onClick={resetForm}
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
      {/* LISTE DES BLOCS */}
      {/* ================================= */}

      <div>

        <div className="
          flex
          items-center
          justify-between
          mb-4
        ">

          <div>

            <h2 className="
              text-xl
              font-bold
              theme-text
            ">
              Blocs de la leçon
            </h2>

            <p className="
              text-sm
              theme-text-secondary
              mt-1
            ">
              Les blocs sont affichés dans
              leur ordre pédagogique.
            </p>

          </div>

        </div>

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
              className="
                mx-auto
                text-accent
                mb-3
                animate-pulse
              "
            />

            <p className="theme-text-secondary">
              Chargement des blocs...
            </p>

          </div>

        ) : blocks.length === 0 ? (

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
              Aucun bloc pédagogique.
            </p>

            <p className="
              text-sm
              theme-text-secondary
              mt-1
            ">
              Créez le premier bloc ci-dessus.
            </p>

          </div>

        ) : (

          <div className="space-y-4">

            {blocks.map((block) => (

              <div
                key={block.id}
                className="
                  theme-surface
                  shadow-sm
                  border
                  theme-border
                  rounded-3xl
                  p-5
                  hover:shadow-md
                  transition
                "
              >

                <div className="
                  flex
                  flex-col
                  md:flex-row
                  md:items-start
                  md:justify-between
                  gap-4
                ">

                  <div className="flex-1 min-w-0">

                    <div className="
                      flex
                      items-start
                      gap-3
                    ">

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
                        {block.order_number}
                      </div>

                      <div className="flex-1 min-w-0">

                        <div className="
                          flex
                          items-center
                          gap-2
                          flex-wrap
                        ">

                          <GripVertical
                            size={17}
                            className="
                              theme-text-secondary
                            "
                          />

                          <span
                            className="
                              text-xs
                              font-semibold
                              uppercase
                              text-accent
                              bg-accent-soft
                              border
                              border-accent
                              px-2
                              py-1
                              rounded-lg
                            "
                          >
                            {block.block_type ||
                              "text"}
                          </span>

                        </div>

                        <h3 className="
                          font-bold
                          theme-text
                          mt-2
                        ">
                          {block.title ||
                            "Bloc sans titre"}
                        </h3>

                        <div className="
                          text-sm
                          theme-text-secondary
                          mt-2
                          whitespace-pre-wrap
                          leading-relaxed
                        ">
                          {block.content}
                        </div>

                      </div>

                    </div>

                  </div>

                  <div className="
                    flex
                    gap-2
                    shrink-0
                  ">

                    <button
                      type="button"
                      onClick={() =>
                        editBlock(block)
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

                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(
                          block.id
                        )
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

                  </div>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>

    </div>
  );
}