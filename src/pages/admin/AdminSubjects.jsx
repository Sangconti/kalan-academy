import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  ArrowLeft,
  GraduationCap,
  Layers,
  Search,
  X,
} from "lucide-react";

import {
  getAllSubjects,
  getAdminClasses,
  createSubject,
  updateSubject,
  deleteSubject,
  getChapters,
} from "../../services/educationAdminService";
import { logAdminActivity } from "../../services/adminService";

export default function AdminSubjects() {
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingClasses, setLoadingClasses] = useState(true);

  const [chapterCounts, setChapterCounts] = useState({});

  const [searchTerm, setSearchTerm] = useState("");

  const [form, setForm] = useState({
    name: "",
    code: "",
    class_id: "",
    order_number: 1,
  });

  const [editing, setEditing] = useState(null);

  // =====================================
  // CHARGEMENT DES MATIÈRES
  // =====================================

  async function loadSubjects() {
    try {
      setLoading(true);

      const data = await getAllSubjects();

      setSubjects(data || []);

      const counts = {};

      await Promise.all(
        (data || []).map(async (subject) => {
          try {
            const chapters = await getChapters(subject.id);

            counts[subject.id] = chapters?.length || 0;
          } catch (error) {
            console.error(
              `Erreur chapitres matière ${subject.id}:`,
              error
            );

            counts[subject.id] = 0;
          }
        })
      );

      setChapterCounts(counts);
    } catch (error) {
      console.error("Erreur chargement matières", error);
    } finally {
      setLoading(false);
    }
  }

  // =====================================
  // CHARGEMENT DES CLASSES
  // =====================================

  async function loadClasses() {
    try {
      setLoadingClasses(true);

      const data = await getAdminClasses();

      setClasses(data || []);
    } catch (error) {
      console.error("Erreur chargement classes", error);
    } finally {
      setLoadingClasses(false);
    }
  }

  // =====================================
  // INITIALISATION
  // =====================================

  useEffect(() => {
    loadSubjects();
    loadClasses();
  }, []);

  // =====================================
  // RECHERCHE
  // =====================================

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredSubjects = subjects.filter((subject) => {
    if (!normalizedSearch) {
      return true;
    }

    const name = subject?.name?.toLowerCase() || "";
    const code = subject?.code?.toLowerCase() || "";
    const className = subject?.classes?.name?.toLowerCase() || "";

    return (
      name.includes(normalizedSearch) ||
      code.includes(normalizedSearch) ||
      className.includes(normalizedSearch)
    );
  });

  // =====================================
  // FORMULAIRE
  // =====================================

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.name.trim()) {
      alert("Veuillez saisir le nom de la matière.");
      return;
    }

    if (!form.class_id) {
      alert("Veuillez sélectionner une classe.");
      return;
    }

    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim() || null,
        class_id: form.class_id,
        order_number: Number(form.order_number) || 1,
      };

      if (editing) {
        const updatedSubject =
          await updateSubject(
            editing.id,
            payload
          );

        await logAdminActivity({
          action: "subject_updated",
          details: {
            subject_id: updatedSubject?.id || editing.id,
            subject_name:
              updatedSubject?.name ||
              payload.name,
            subject_code:
              updatedSubject?.code ||
              payload.code,
            class_id:
              updatedSubject?.class_id ||
              payload.class_id,
            order_number:
              updatedSubject?.order_number ??
              payload.order_number,
          },
        });
      } else {
        const createdSubject =
          await createSubject(payload);

        await logAdminActivity({
          action: "subject_created",
          details: {
            subject_id:
              createdSubject?.id || null,
            subject_name:
              createdSubject?.name ||
              payload.name,
            subject_code:
              createdSubject?.code ||
              payload.code,
            class_id:
              createdSubject?.class_id ||
              payload.class_id,
            order_number:
              createdSubject?.order_number ??
              payload.order_number,
          },
        });
      }

      resetForm();

      await loadSubjects();
    } catch (error) {
      console.error(
        "Erreur sauvegarde matière",
        error
      );

      alert(
        error?.message ||
          "Impossible de sauvegarder la matière."
      );
    }
  }

  // =====================================
  // RESET
  // =====================================

  function resetForm() {
    setForm({
      name: "",
      code: "",
      class_id: "",
      order_number: 1,
    });

    setEditing(null);
  }

  // =====================================
  // SUPPRESSION
  // =====================================

  async function handleDelete(id) {
    const subject = subjects.find(
      (item) => item.id === id
    );

    const confirmed = confirm(
      `Supprimer la matière "${subject?.name || ""}" ?\n\n` +
        "Cette action peut supprimer les éléments liés à cette matière."
    );

    if (!confirmed) return;

    try {
      await deleteSubject(id);

      await logAdminActivity({
        action: "subject_deleted",
        details: {
          subject_id: id,
          subject_name: subject?.name || null,
          subject_code: subject?.code || null,
          class_id: subject?.class_id || null,
        },
      });

      await loadSubjects();
    } catch (error) {
      console.error("Erreur suppression matière", error);

      alert(
        error?.message ||
          "Impossible de supprimer la matière."
      );
    }
  }

  // =====================================
  // MODIFICATION
  // =====================================

  function editSubject(subject) {
    setEditing(subject);

    setForm({
      name: subject.name || "",
      code: subject.code || "",
      class_id: subject.class_id || "",
      order_number: subject.order_number || 1,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // =====================================
  // LOADING
  // =====================================

  if (loading || loadingClasses) {
    return (
      <div className="p-4 md:p-6">
        <div className="theme-surface theme-border border rounded-3xl shadow-sm p-8 text-center">
          <BookOpen
            size={34}
            className="mx-auto text-accent mb-3"
          />

          <p className="theme-text font-semibold">
            Chargement des matières...
          </p>

          <p className="theme-text-secondary text-sm mt-1">
            Préparation des données pédagogiques.
          </p>
        </div>
      </div>
    );
  }

  // =====================================
  // AFFICHAGE
  // =====================================

  return (
    <div className="p-4 md:p-6 space-y-7">
      {/* RETOUR */}

      <button
        onClick={() => navigate(-1)}
        className="
          inline-flex
          items-center
          gap-2
          theme-text-secondary
          hover:text-accent
          font-semibold
          transition
        "
      >
        <ArrowLeft size={18} />
        Retour
      </button>

      {/* HEADER */}

      <div
        className="
          relative
          overflow-hidden
          rounded-3xl
          bg-accent-soft
          border
          border-accent
          p-6
          md:p-8
          shadow-lg
        "
      >
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-accent opacity-10" />
        <div className="absolute -left-16 -bottom-20 w-48 h-48 rounded-full bg-accent opacity-10" />
        <div className="absolute right-16 -bottom-24 w-56 h-56 rounded-full bg-accent opacity-5" />

        <div className="relative z-10">
          <div className="flex items-start gap-4">
            <div
              className="
                w-14
                h-14
                shrink-0
                rounded-2xl
                bg-white/70
                dark:bg-gray-950/30
                border
                border-white/50
                dark:border-white/10
                flex
                items-center
                justify-center
              "
            >
              <BookOpen
                size={26}
                className="text-accent"
              />
            </div>

            <div className="flex-1 min-w-0">
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
                Gestion pédagogique
              </div>

              <h1 className="text-2xl md:text-3xl font-bold leading-tight theme-text">
                Gestion des matières
              </h1>

              <p className="theme-text-secondary mt-3 leading-relaxed">
                Organisez les matières par classe et gérez leur ordre
                d'affichage.
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/70 dark:bg-gray-950/30 theme-text text-sm font-medium border border-white/50 dark:border-white/10">
              <BookOpen size={16} className="text-accent" />
              {subjects.length} matière
              {subjects.length > 1 ? "s" : ""}
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/70 dark:bg-gray-950/30 theme-text text-sm font-medium border border-white/50 dark:border-white/10">
              <GraduationCap size={16} className="text-accent" />
              {classes.length} classe
              {classes.length > 1 ? "s" : ""}
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/70 dark:bg-gray-950/30 theme-text text-sm font-medium border border-white/50 dark:border-white/10">
              <Layers size={16} className="text-accent" />
              {filteredSubjects.length} affichée
              {filteredSubjects.length > 1 ? "s" : ""}
            </div>
          </div>
        </div>
      </div>

      {/* FORMULAIRE */}

      <div className="theme-surface theme-border border rounded-3xl shadow-sm p-5 md:p-6">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-accent-soft border border-accent flex items-center justify-center">
              {editing ? (
                <Pencil size={20} className="text-accent" />
              ) : (
                <Plus size={20} className="text-accent" />
              )}
            </div>

            <div>
              <h2 className="text-lg font-bold theme-text">
                {editing
                  ? "Modifier la matière"
                  : "Nouvelle matière"}
              </h2>

              <p className="text-sm theme-text-secondary mt-0.5">
                {editing
                  ? "Modifiez les informations de la matière."
                  : "Ajoutez une nouvelle matière à une classe."}
              </p>
            </div>
          </div>

          {editing && (
            <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-accent-soft border border-accent text-accent text-xs font-semibold">
              Modification
            </span>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {/* NOM */}

          <div>
            <label className="block text-sm font-semibold theme-text mb-1.5">
              Nom de la matière
            </label>

            <input
              className="
                w-full
                theme-surface
                theme-text
                theme-border
                border
                rounded-xl
                p-3
                outline-none
                focus:ring-2
                focus:ring-accent
                focus:border-accent
                placeholder:theme-text-secondary
              "
              placeholder="Ex : Mathématiques"
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name: e.target.value,
                })
              }
            />
          </div>

          {/* CLASSE */}

          <div>
            <label className="block text-sm font-semibold theme-text mb-1.5">
              Classe
            </label>

            <select
              className="
                w-full
                theme-surface
                theme-text
                theme-border
                border
                rounded-xl
                p-3
                outline-none
                focus:ring-2
                focus:ring-accent
                focus:border-accent
              "
              value={form.class_id}
              onChange={(e) =>
                setForm({
                  ...form,
                  class_id: e.target.value,
                })
              }
            >
              <option value="">
                Sélectionner une classe
              </option>

              {classes.map((classItem) => (
                <option
                  key={classItem.id}
                  value={classItem.id}
                >
                  {classItem.name}
                </option>
              ))}
            </select>
          </div>

          {/* CODE */}

          <div>
            <label className="block text-sm font-semibold theme-text mb-1.5">
              Code
            </label>

            <input
              className="
                w-full
                theme-surface
                theme-text
                theme-border
                border
                rounded-xl
                p-3
                outline-none
                focus:ring-2
                focus:ring-accent
                focus:border-accent
              "
              placeholder="Ex : MATH"
              value={form.code}
              onChange={(e) =>
                setForm({
                  ...form,
                  code: e.target.value,
                })
              }
            />
          </div>

          {/* ORDRE */}

          <div>
            <label className="block text-sm font-semibold theme-text mb-1.5">
              Ordre d'affichage
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
                p-3
                outline-none
                focus:ring-2
                focus:ring-accent
                focus:border-accent
              "
              value={form.order_number}
              onChange={(e) =>
                setForm({
                  ...form,
                  order_number: Number(e.target.value),
                })
              }
            />
          </div>

          {/* ACTIONS */}

          <div className="md:col-span-2 flex flex-wrap gap-3">
            <button
              type="submit"
              className="
                bg-accent
                text-white
                rounded-xl
                px-5
                py-3
                font-bold
                flex
                items-center
                gap-2
                shadow-md
                hover:opacity-90
                hover:-translate-y-0.5
                transition
              "
            >
              {editing ? (
                <Pencil size={18} />
              ) : (
                <Plus size={18} />
              )}

              {editing
                ? "Mettre à jour"
                : "Créer la matière"}
            </button>

            {editing && (
              <button
                type="button"
                onClick={resetForm}
                className="
                  theme-surface
                  theme-text
                  theme-border
                  border
                  rounded-xl
                  px-5
                  py-3
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

      {/* LISTE */}

      <div>
        <div
          className="
            theme-surface
            theme-border
            border
            rounded-3xl
            shadow-sm
            p-5
            md:p-6
            mb-5
          "
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-accent-soft border border-accent flex items-center justify-center">
                  <Layers
                    size={18}
                    className="text-accent"
                  />
                </div>

                <h2 className="text-xl font-bold theme-text">
                  Matières
                </h2>
              </div>

              <p className="text-sm theme-text-secondary mt-2">
                {normalizedSearch
                  ? `${filteredSubjects.length} résultat(s) sur ${subjects.length} matière(s)`
                  : `${subjects.length} matière(s)`}
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
                  setSearchTerm(e.target.value)
                }
                placeholder="Rechercher une matière..."
                className="
                  w-full
                  theme-surface
                  theme-text
                  theme-border
                  border
                  rounded-xl
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
        </div>

        {subjects.length === 0 ? (
          <div className="theme-surface theme-border border rounded-3xl p-8 text-center shadow-sm">
            <BookOpen
              size={40}
              className="mx-auto text-accent mb-3"
            />

            <p className="theme-text font-semibold">
              Aucune matière disponible.
            </p>
          </div>
        ) : filteredSubjects.length === 0 ? (
          <div className="theme-surface theme-border border rounded-3xl p-8 text-center shadow-sm">
            <Search
              size={40}
              className="mx-auto text-accent mb-3"
            />

            <p className="font-semibold theme-text">
              Aucune matière trouvée.
            </p>

            <p className="text-sm theme-text-secondary mt-1">
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
              "
            >
              Effacer la recherche
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filteredSubjects.map((subject) => (
              <div
                key={subject.id}
                className="
                  theme-surface
                  theme-border
                  border
                  rounded-3xl
                  shadow-sm
                  p-5
                  hover:shadow-lg
                  hover:-translate-y-0.5
                  transition
                "
              >
                {/* TOP */}

                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-accent-soft border border-accent flex items-center justify-center flex-shrink-0">
                      <BookOpen
                        size={21}
                        className="text-accent"
                      />
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-lg font-bold theme-text truncate">
                        {subject.name}
                      </h3>

                      {subject.code && (
                        <p className="text-sm theme-text-secondary mt-0.5">
                          Code : {subject.code}
                        </p>
                      )}
                    </div>
                  </div>

                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-accent-soft text-accent border border-accent shrink-0">
                    #{subject.order_number}
                  </span>
                </div>

                {/* CLASSE */}

                <div className="mt-4 flex items-center gap-2 rounded-2xl bg-accent-soft border border-accent px-3 py-3">
                  <GraduationCap
                    size={18}
                    className="text-accent shrink-0"
                  />

                  <div>
                    <p className="text-xs theme-text-secondary">
                      Classe
                    </p>

                    <p className="text-sm font-bold theme-text">
                      {subject.classes?.name ||
                        "Classe non renseignée"}
                    </p>
                  </div>
                </div>

                {/* CHAPITRES */}

                <div className="mt-3 flex items-center gap-2 text-sm theme-text-secondary">
                  <Layers
                    size={17}
                    className="text-accent"
                  />

                  <span>
                    {chapterCounts[subject.id] ?? 0} chapitre(s)
                  </span>
                </div>

                {/* ACTIONS */}

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    onClick={() =>
                      navigate(
                        `/admin/chapters/${subject.id}`
                      )
                    }
                    className="
                      flex-1
                      min-w-[150px]
                      px-4
                      py-2.5
                      bg-accent
                      hover:opacity-90
                      text-white
                      rounded-xl
                      font-semibold
                      flex
                      items-center
                      justify-center
                      gap-2
                      shadow-sm
                      transition
                    "
                  >
                    <Layers size={17} />
                    Voir les chapitres
                  </button>

                  <button
                    onClick={() => editSubject(subject)}
                    className="
                      px-3
                      py-2.5
                      rounded-xl
                      bg-yellow-50
                      dark:bg-yellow-950/30
                      text-yellow-700
                      dark:text-yellow-300
                      border
                      border-yellow-200
                      dark:border-yellow-900/50
                      hover:bg-yellow-100
                      dark:hover:bg-yellow-950/50
                      transition
                    "
                    title="Modifier"
                  >
                    <Pencil size={18} />
                  </button>

                  <button
                    onClick={() =>
                      handleDelete(subject.id)
                    }
                    className="
                      px-3
                      py-2.5
                      rounded-xl
                      bg-red-50
                      dark:bg-red-950/30
                      text-red-700
                      dark:text-red-300
                      border
                      border-red-200
                      dark:border-red-900/50
                      hover:bg-red-100
                      dark:hover:bg-red-950/50
                      transition
                    "
                    title="Supprimer"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}