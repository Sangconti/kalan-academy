import { useEffect, useState } from "react";
import {
  Plus,
  RefreshCw,
  School,
  Layers3,
  BookOpen,
  GraduationCap,
} from "lucide-react";

import ClassTable from "../../components/admin/ClassTable";
import ClassForm from "../../components/admin/ClassForm";

import {
  getAdminClasses,
  createClass,
  deleteClass,
} from "../../services/adminService";

export default function ClassesAdmin() {
  const [classes, setClasses] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [saving, setSaving] = useState(false);

  // =====================================================
  // CHARGEMENT
  // =====================================================

  async function load() {
    try {
      setLoading(true);
      setError("");

      const data = await getAdminClasses();

      setClasses(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      console.error(
        "Erreur chargement classes :",
        err
      );

      setError(
        err?.message ||
          "Impossible de charger les classes."
      );
    } finally {
      setLoading(false);
    }
  }

  // =====================================================
  // INITIALISATION
  // =====================================================

  useEffect(() => {
    load();
  }, []);

  // =====================================================
  // CRÉATION
  // =====================================================

  async function add(data) {
    try {
      setSaving(true);
      setError("");

      await createClass(data);

      await load();

      setShowForm(false);
    } catch (err) {
      console.error(
        "Erreur création classe :",
        err
      );

      setError(
        err?.message ||
          "Impossible de créer la classe."
      );

      throw err;
    } finally {
      setSaving(false);
    }
  }

  // =====================================================
  // SUPPRESSION
  // =====================================================

  async function remove(id) {
    const classe = classes.find(
      (item) => item.id === id
    );

    const className =
      classe?.name ||
      "cette classe";

    const confirmed = window.confirm(
      `Voulez-vous vraiment supprimer "${className}" ?\n\n` +
        "Cette opération peut affecter " +
        "les matières, chapitres et contenus associés."
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await deleteClass(id);

      await load();
    } catch (err) {
      console.error(
        "Erreur suppression classe :",
        err
      );

      setError(
        err?.message ||
          "Impossible de supprimer la classe."
      );
    }
  }

  // =====================================================
  // RENDU
  // =====================================================

  return (
    <div className="space-y-6">

      {/* =================================================
          HERO
      ================================================= */}

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

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

            <div className="flex items-start gap-4">

              <div
                className="
                  w-16
                  h-16
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
                  text-accent
                "
              >
                <School size={30} />
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
                  <GraduationCap size={14} />

                  Administration
                </div>

                <h1
                  className="
                    text-2xl
                    md:text-3xl
                    font-bold
                    leading-tight
                    theme-text
                  "
                >
                  Gestion des classes
                </h1>

                <p className="theme-text-secondary mt-3 leading-relaxed">
                  Gérez les classes scolaires de Kalan Academy
                  et leur organisation pédagogique.
                </p>

                <div className="flex flex-wrap items-center gap-3 mt-5">

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
                    <School
                      size={16}
                      className="text-accent"
                    />

                    {classes.length} classe
                    {classes.length > 1 ? "s" : ""}
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
                    <Layers3
                      size={16}
                      className="text-accent"
                    />

                    Matières → Chapitres
                  </div>

                </div>

              </div>

            </div>


            <div className="flex flex-wrap items-center gap-2">

              <button
                type="button"
                onClick={load}
                disabled={loading}
                className="
                  inline-flex
                  items-center
                  justify-center
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
                  shadow-sm
                  hover:bg-white
                  dark:hover:bg-gray-900
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                  transition
                "
              >

                <RefreshCw
                  size={18}
                  className={
                    loading
                      ? "animate-spin"
                      : ""
                  }
                />

                Actualiser

              </button>


              <button
                type="button"
                onClick={() =>
                  setShowForm(
                    (value) => !value
                  )
                }
                className="
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  px-4
                  py-2.5
                  rounded-xl
                  bg-accent
                  text-white
                  font-bold
                  shadow-md
                  hover:opacity-90
                  hover:-translate-y-0.5
                  transition
                "
              >

                <Plus size={18} />

                Nouvelle classe

              </button>

            </div>

          </div>

        </div>

      </div>


      {/* =================================================
          ERREUR
      ================================================= */}

      {error && (

        <div
          className="
            rounded-2xl
            border
            border-red-200
            bg-red-50
            dark:bg-red-950/20
            text-red-700
            dark:text-red-300
            px-4
            py-3
          "
        >

          <strong>Erreur :</strong>{" "}

          {error}

        </div>

      )}


      {/* =================================================
          FORMULAIRE
      ================================================= */}

      {showForm && (

        <div
          className="
            theme-surface
            theme-border
            border
            rounded-3xl
            shadow-sm
            p-5
            md:p-6
          "
        >

          <div className="flex items-center gap-3 mb-5">

            <div
              className="
                w-10
                h-10
                rounded-xl
                bg-accent-soft
                border
                border-accent
                flex
                items-center
                justify-center
                text-accent
              "
            >
              <Plus size={20} />
            </div>

            <div>

              <h2 className="text-xl font-bold theme-text">
                Nouvelle classe
              </h2>

              <p className="text-sm theme-text-secondary mt-0.5">
                Ajoutez un nouveau niveau scolaire.
              </p>

            </div>

          </div>

          <ClassForm
            onSubmit={add}
            onCancel={() =>
              setShowForm(false)
            }
            loading={saving}
          />

        </div>

      )}


      {/* =================================================
          STATISTIQUES
      ================================================= */}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        <div
          className="
            relative
            overflow-hidden
            bg-accent-soft
            border
            border-accent
            rounded-3xl
            p-5
            shadow-sm
          "
        >

          <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-accent opacity-10" />

          <div className="relative z-10 flex items-center justify-between gap-4">

            <div>

              <p className="text-sm theme-text-secondary">
                Total des classes
              </p>

              <p className="text-3xl font-bold theme-text mt-2">
                {classes.length}
              </p>

            </div>

            <div
              className="
                w-12
                h-12
                rounded-2xl
                bg-white/70
                dark:bg-gray-950/30
                border
                border-white/50
                dark:border-white/10
                flex
                items-center
                justify-center
                text-accent
              "
            >
              <School size={23} />
            </div>

          </div>

        </div>


        <div
          className="
            theme-surface
            theme-border
            border
            rounded-3xl
            p-5
            shadow-sm
          "
        >

          <div className="flex items-center gap-3">

            <div
              className="
                w-12
                h-12
                rounded-2xl
                bg-accent-soft
                border
                border-accent
                flex
                items-center
                justify-center
                text-accent
              "
            >
              <Layers3 size={22} />
            </div>

            <div>

              <p className="text-sm theme-text-secondary">
                Organisation
              </p>

              <p className="text-sm font-semibold theme-text mt-1">
                Classe → Matières → Chapitres
              </p>

            </div>

          </div>

        </div>


        <div
          className="
            theme-surface
            theme-border
            border
            rounded-3xl
            p-5
            shadow-sm
          "
        >

          <div className="flex items-center gap-3">

            <div
              className="
                w-12
                h-12
                rounded-2xl
                bg-accent-soft
                border
                border-accent
                flex
                items-center
                justify-center
                text-accent
              "
            >
              <BookOpen size={22} />
            </div>

            <div>

              <p className="text-sm theme-text-secondary">
                Contenu
              </p>

              <p className="text-sm font-semibold theme-text mt-1">
                Leçons → Quiz → Questions
              </p>

            </div>

          </div>

        </div>

      </div>


      {/* =================================================
          TABLEAU
      ================================================= */}

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
            theme-border
            bg-accent-soft
          "
        >

          <div className="flex items-center gap-3">

            <div
              className="
                w-10
                h-10
                rounded-xl
                bg-white/70
                dark:bg-gray-950/30
                border
                border-white/50
                dark:border-white/10
                flex
                items-center
                justify-center
                text-accent
              "
            >
              <School size={20} />
            </div>

            <div>

              <h2 className="text-xl font-bold theme-text">
                Classes disponibles
              </h2>

              <p className="text-sm theme-text-secondary mt-1">
                Organisation des niveaux scolaires.
              </p>

            </div>

          </div>

        </div>


        <ClassTable
          classes={classes}
          loading={loading}
          onDelete={remove}
        />

      </div>

    </div>
  );
}