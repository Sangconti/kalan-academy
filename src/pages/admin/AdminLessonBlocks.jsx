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

              <BookOpen
                size={27}
                className="text-blue-600"
              />

              Blocs pédagogiques

            </h1>

            <p className="text-sm text-gray-500 mt-2">
              Gestion du contenu pédagogique
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
              bg-blue-50
              text-blue-700
              font-semibold
              text-sm
            "
          >
            <BookOpen size={17} />

            {blocks.length} bloc
            {blocks.length !== 1
              ? "s"
              : ""}
          </div>

        </div>

      </div>

      {/* ================================= */}
      {/* FORMULAIRE */}
      {/* ================================= */}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">

        <div className="flex items-center gap-2 mb-5">

          {editing ? (
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

            {editing
              ? "Modifier le bloc"
              : "Nouveau bloc"}

          </h2>

        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >

          {/* TYPE */}

          <div>

            <label className="block font-medium text-gray-700 mb-2">
              Type de bloc
            </label>

            <select
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

            <label className="block font-medium text-gray-700 mb-2">
              Titre du bloc
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

            <label className="block font-medium text-gray-700 mb-2">
              Contenu
            </label>

            <textarea
              rows={8}
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

            <label className="block font-medium text-gray-700 mb-2">
              Ordre du bloc
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
                focus:outline-none
                focus:ring-2
                focus:ring-blue-500
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

      {/* ================================= */}
      {/* LISTE DES BLOCS */}
      {/* ================================= */}

      <div>

        <div className="flex items-center justify-between mb-4">

          <div>

            <h2 className="text-xl font-bold text-gray-900">
              Blocs de la leçon
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Les blocs sont affichés dans
              leur ordre pédagogique.
            </p>

          </div>

        </div>

        {loading ? (

          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">

            <p className="text-gray-500">
              Chargement des blocs...
            </p>

          </div>

        ) : blocks.length === 0 ? (

          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">

            <BookOpen
              size={42}
              className="mx-auto text-gray-300 mb-3"
            />

            <p className="text-gray-500">
              Aucun bloc pédagogique.
            </p>

            <p className="text-sm text-gray-400 mt-1">
              Créez le premier bloc
              ci-dessus.
            </p>

          </div>

        ) : (

          <div className="space-y-4">

            {blocks.map((block) => (

              <div
                key={block.id}
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
                        {block.order_number}
                      </div>

                      <div className="flex-1">

                        <div className="flex items-center gap-2">

                          <GripVertical
                            size={17}
                            className="text-gray-300"
                          />

                          <span
                            className="
                              text-xs
                              font-semibold
                              uppercase
                              text-blue-600
                              bg-blue-50
                              px-2
                              py-1
                              rounded-lg
                            "
                          >
                            {block.block_type ||
                              "text"}
                          </span>

                        </div>

                        <h3 className="font-bold text-gray-900 mt-2">
                          {block.title ||
                            "Bloc sans titre"}
                        </h3>

                        <div className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">
                          {block.content}
                        </div>

                      </div>

                    </div>

                  </div>

                  <div className="flex gap-2">

                    <button
                      type="button"
                      onClick={() =>
                        editBlock(block)
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
                      type="button"
                      onClick={() =>
                        handleDelete(
                          block.id
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

              </div>

            ))}

          </div>

        )}

      </div>

    </div>
  );
}