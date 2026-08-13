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
  X
} from "lucide-react";

import {
  getAllSubjects,
  getAdminClasses,
  createSubject,
  updateSubject,
  deleteSubject,
  getChapters
} from "../../services/educationAdminService";

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
    order_number: 1
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
      console.error(
        "Erreur chargement matières",
        error
      );
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
      console.error(
        "Erreur chargement classes",
        error
      );
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

  const normalizedSearch = searchTerm
    .trim()
    .toLowerCase();

  const filteredSubjects = subjects.filter((subject) => {
    if (!normalizedSearch) {
      return true;
    }

    const name =
      subject?.name?.toLowerCase() || "";

    const code =
      subject?.code?.toLowerCase() || "";

    const className =
      subject?.classes?.name?.toLowerCase() || "";

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
        order_number: Number(form.order_number) || 1
      };

      if (editing) {
        await updateSubject(
          editing.id,
          payload
        );
      } else {
        await createSubject(payload);
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
      order_number: 1
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

      await loadSubjects();
    } catch (error) {
      console.error(
        "Erreur suppression matière",
        error
      );

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
      order_number:
        subject.order_number || 1
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  // =====================================
  // LOADING
  // =====================================

  if (loading || loadingClasses) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <p className="text-gray-500 font-medium">
            Chargement des matières...
          </p>
        </div>
      </div>
    );
  }

  // =====================================
  // AFFICHAGE
  // =====================================

  return (
    <div className="p-4 md:p-6 space-y-6">

      {/* RETOUR */}

      <button
        onClick={() => navigate(-1)}
        className="
          inline-flex
          items-center
          gap-2
          text-gray-600
          hover:text-blue-600
          font-medium
          transition
        "
      >
        <ArrowLeft size={18} />
        Retour
      </button>

      {/* HEADER */}

      <div>
        <div className="flex items-center gap-3">

          <div className="
            w-12
            h-12
            rounded-2xl
            bg-blue-50
            flex
            items-center
            justify-center
          ">
            <BookOpen
              size={24}
              className="text-blue-600"
            />
          </div>

          <div>
            <h1 className="
              text-2xl
              md:text-3xl
              font-bold
              text-gray-900
            ">
              Gestion des matières
            </h1>

            <p className="text-gray-500 mt-1">
              Organisez les matières par classe.
            </p>
          </div>

        </div>
      </div>

      {/* FORMULAIRE */}

      <div className="
        bg-white
        rounded-2xl
        border
        border-gray-100
        shadow-sm
        p-5
        md:p-6
      ">

        <div className="flex items-center gap-2 mb-5">

          <Plus
            size={20}
            className="text-blue-600"
          />

          <h2 className="
            text-lg
            font-bold
            text-gray-900
          ">
            {editing
              ? "Modifier la matière"
              : "Nouvelle matière"}
          </h2>

        </div>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >

          {/* NOM */}

          <div>
            <label className="
              block
              text-sm
              font-semibold
              text-gray-700
              mb-1.5
            ">
              Nom de la matière
            </label>

            <input
              className="
                w-full
                border
                border-gray-200
                rounded-xl
                p-3
                outline-none
                focus:ring-2
                focus:ring-blue-500
              "
              placeholder="Ex : Mathématiques"
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name: e.target.value
                })
              }
            />
          </div>

          {/* CLASSE */}

          <div>
            <label className="
              block
              text-sm
              font-semibold
              text-gray-700
              mb-1.5
            ">
              Classe
            </label>

            <select
              className="
                w-full
                border
                border-gray-200
                rounded-xl
                p-3
                bg-white
                outline-none
                focus:ring-2
                focus:ring-blue-500
              "
              value={form.class_id}
              onChange={(e) =>
                setForm({
                  ...form,
                  class_id: e.target.value
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
            <label className="
              block
              text-sm
              font-semibold
              text-gray-700
              mb-1.5
            ">
              Code
            </label>

            <input
              className="
                w-full
                border
                border-gray-200
                rounded-xl
                p-3
                outline-none
                focus:ring-2
                focus:ring-blue-500
              "
              placeholder="Ex : MATH"
              value={form.code}
              onChange={(e) =>
                setForm({
                  ...form,
                  code: e.target.value
                })
              }
            />
          </div>

          {/* ORDRE */}

          <div>
            <label className="
              block
              text-sm
              font-semibold
              text-gray-700
              mb-1.5
            ">
              Ordre d'affichage
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
                outline-none
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

          {/* ACTIONS */}

          <div className="
            md:col-span-2
            flex
            flex-wrap
            gap-3
          ">

            <button
              type="submit"
              className="
                bg-blue-600
                hover:bg-blue-700
                text-white
                rounded-xl
                px-5
                py-3
                font-semibold
                flex
                items-center
                gap-2
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
                  bg-gray-100
                  hover:bg-gray-200
                  text-gray-700
                  rounded-xl
                  px-5
                  py-3
                  font-semibold
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
              text-gray-900
            ">
              Matières
            </h2>

            <p className="text-sm text-gray-500">
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
                text-gray-400
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

        {subjects.length === 0 ? (

          <div className="
            bg-white
            rounded-2xl
            border
            border-gray-100
            p-8
            text-center
          ">
            <BookOpen
              size={40}
              className="
                mx-auto
                text-gray-300
                mb-3
              "
            />

            <p className="text-gray-500">
              Aucune matière disponible.
            </p>
          </div>

        ) : filteredSubjects.length === 0 ? (

          <div className="
            bg-white
            rounded-2xl
            border
            border-gray-100
            p-8
            text-center
          ">
            <Search
              size={40}
              className="
                mx-auto
                text-gray-300
                mb-3
              "
            />

            <p className="font-semibold text-gray-700">
              Aucune matière trouvée.
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

          <div className="
            grid
            grid-cols-1
            lg:grid-cols-2
            gap-4
          ">

            {filteredSubjects.map((subject) => (

              <div
                key={subject.id}
                className="
                  bg-white
                  border
                  border-gray-100
                  rounded-2xl
                  shadow-sm
                  p-5
                  hover:shadow-md
                  transition
                "
              >

                {/* TOP */}

                <div className="
                  flex
                  items-start
                  justify-between
                  gap-4
                ">

                  <div className="
                    flex
                    items-start
                    gap-3
                  ">

                    <div className="
                      w-11
                      h-11
                      rounded-xl
                      bg-blue-50
                      flex
                      items-center
                      justify-center
                      flex-shrink-0
                    ">
                      <BookOpen
                        size={21}
                        className="text-blue-600"
                      />
                    </div>

                    <div>

                      <h3 className="
                        text-lg
                        font-bold
                        text-gray-900
                      ">
                        {subject.name}
                      </h3>

                      {subject.code && (
                        <p className="
                          text-sm
                          text-gray-500
                          mt-0.5
                        ">
                          Code : {subject.code}
                        </p>
                      )}

                    </div>

                  </div>

                  <span className="
                    text-xs
                    font-bold
                    px-2.5
                    py-1
                    rounded-full
                    bg-blue-50
                    text-blue-700
                  ">
                    #{subject.order_number}
                  </span>

                </div>

                {/* CLASSE */}

                <div className="
                  mt-4
                  flex
                  items-center
                  gap-2
                  rounded-xl
                  bg-gray-50
                  px-3
                  py-2.5
                ">

                  <GraduationCap
                    size={18}
                    className="text-gray-600"
                  />

                  <div>
                    <p className="
                      text-xs
                      text-gray-500
                    ">
                      Classe
                    </p>

                    <p className="
                      text-sm
                      font-bold
                      text-gray-800
                    ">
                      {subject.classes?.name ||
                        "Classe non renseignée"}
                    </p>
                  </div>

                </div>

                {/* CHAPITRES */}

                <div className="
                  mt-3
                  flex
                  items-center
                  gap-2
                  text-sm
                  text-gray-600
                ">

                  <Layers size={17} />

                  <span>
                    {chapterCounts[subject.id] ?? 0}
                    {" "}
                    chapitre(s)
                  </span>

                </div>

                {/* ACTIONS */}

                <div className="
                  mt-5
                  flex
                  flex-wrap
                  gap-2
                ">

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
                      bg-green-600
                      hover:bg-green-700
                      text-white
                      rounded-xl
                      font-semibold
                      flex
                      items-center
                      justify-center
                      gap-2
                      transition
                    "
                  >
                    <Layers size={17} />
                    Voir les chapitres
                  </button>

                  <button
                    onClick={() =>
                      editSubject(subject)
                    }
                    className="
                      px-3
                      py-2.5
                      rounded-xl
                      bg-yellow-50
                      text-yellow-700
                      hover:bg-yellow-100
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
                      text-red-700
                      hover:bg-red-100
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