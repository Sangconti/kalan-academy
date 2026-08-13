import { useEffect, useState } from "react";
import {
  Plus,
  RefreshCw,
  School,
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
          EN-TÊTE
      ================================================= */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

        <div className="flex items-center gap-3">

          <div className="p-3 bg-blue-100 text-blue-700 rounded-xl">
            <School size={28} />
          </div>

          <div>

            <h1 className="text-3xl font-bold text-gray-900">
              Gestion des classes
            </h1>

            <p className="text-gray-500 mt-1">
              Gérez les classes scolaires de Kalan Academy.
            </p>

          </div>

        </div>


        <div className="flex items-center gap-2">

          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="
              flex
              items-center
              gap-2
              px-4
              py-2
              rounded-lg
              border
              bg-white
              text-gray-700
              hover:bg-gray-50
              disabled:opacity-50
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
              flex
              items-center
              gap-2
              px-4
              py-2
              rounded-lg
              bg-blue-600
              text-white
              hover:bg-blue-700
            "
          >

            <Plus size={18} />

            Nouvelle classe

          </button>

        </div>

      </div>


      {/* =================================================
          ERREUR
      ================================================= */}

      {error && (

        <div
          className="
            rounded-lg
            border
            border-red-200
            bg-red-50
            text-red-700
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
            bg-white
            rounded-xl
            shadow-sm
            border
            p-5
          "
        >

          <h2 className="text-xl font-bold mb-4">
            Nouvelle classe
          </h2>

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

        <div className="bg-white border rounded-xl p-4">

          <p className="text-sm text-gray-500">
            Total des classes
          </p>

          <p className="text-2xl font-bold mt-1">
            {classes.length}
          </p>

        </div>


        <div className="bg-white border rounded-xl p-4">

          <p className="text-sm text-gray-500">
            Organisation
          </p>

          <p className="text-sm text-gray-600 mt-2">
            Classe → Matières → Chapitres
          </p>

        </div>


        <div className="bg-white border rounded-xl p-4">

          <p className="text-sm text-gray-500">
            Contenu
          </p>

          <p className="text-sm text-gray-600 mt-2">
            Leçons → Quiz → Questions
          </p>

        </div>

      </div>


      {/* =================================================
          TABLEAU
      ================================================= */}

      <div
        className="
          bg-white
          rounded-xl
          shadow-sm
          border
          overflow-hidden
        "
      >

        <div className="p-5 border-b">

          <h2 className="text-xl font-bold">
            Classes disponibles
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Organisation des niveaux scolaires.
          </p>

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
