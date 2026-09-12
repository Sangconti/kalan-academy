import { useState } from "react";
import {
  Save,
  X,
} from "lucide-react";

export default function ClassForm({
  onSubmit,
  onCancel,
  loading = false,
}) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [order, setOrder] = useState(1);
  const [error, setError] = useState("");

  // =====================================================
  // SOUMISSION
  // =====================================================

  async function submit(e) {
    e.preventDefault();

    setError("");

    const cleanName = name.trim();
    const cleanCode = code.trim().toUpperCase();

    if (!cleanName) {
      setError(
        "Le nom de la classe est obligatoire."
      );

      return;
    }

    try {
      await onSubmit({
        name: cleanName,
        code: cleanCode,
        order_number: Number(order) || 1,
      });

      setName("");
      setCode("");
      setOrder(1);

    } catch (err) {
      console.error(
        "Erreur formulaire classe :",
        err
      );

      setError(
        err?.message ||
          "Impossible d'enregistrer la classe."
      );
    }
  }

  return (
    <form
      onSubmit={submit}
      className="
        w-full
        max-w-full
        min-w-0
        space-y-4
      "
    >

      {/* =====================================================
          ERREUR
      ===================================================== */}

      {error && (
        <div
          className="
            w-full
            min-w-0

            bg-red-50
            dark:bg-red-950/40

            border
            border-red-200
            dark:border-red-900

            text-red-700
            dark:text-red-300

            rounded-lg

            px-4
            py-3

            text-sm

            break-words
          "
        >
          {error}
        </div>
      )}


      {/* =====================================================
          NOM
      ===================================================== */}

      <div className="w-full min-w-0">

        <label
          className="
            block
            text-sm
            font-medium
            theme-text
            mb-1
          "
        >
          Nom de la classe
        </label>

        <input
          type="text"
          placeholder="Exemple : 7ème année"
          value={name}
          onChange={(e) =>
            setName(e.target.value)
          }
          disabled={loading}
          className="
            w-full
            min-w-0

            border
            theme-border

            theme-surface
            theme-text

            p-3

            rounded-lg

            outline-none

            focus:ring-2
            focus:ring-accent
            focus:border-accent

            disabled:bg-gray-100
            disabled:dark:bg-gray-800
            disabled:cursor-not-allowed
            disabled:opacity-60

            transition
          "
        />

      </div>


      {/* =====================================================
          CODE
      ===================================================== */}

      <div className="w-full min-w-0">

        <label
          className="
            block
            text-sm
            font-medium
            theme-text
            mb-1
          "
        >
          Code de la classe
        </label>

        <input
          type="text"
          placeholder="Exemple : 7EME"
          value={code}
          onChange={(e) =>
            setCode(
              e.target.value.toUpperCase()
            )
          }
          disabled={loading}
          className="
            w-full
            min-w-0

            border
            theme-border

            theme-surface
            theme-text

            p-3

            rounded-lg

            uppercase

            outline-none

            focus:ring-2
            focus:ring-accent
            focus:border-accent

            disabled:bg-gray-100
            disabled:dark:bg-gray-800
            disabled:cursor-not-allowed
            disabled:opacity-60

            transition
          "
        />

      </div>


      {/* =====================================================
          ORDRE
      ===================================================== */}

      <div className="w-full min-w-0">

        <label
          className="
            block
            text-sm
            font-medium
            theme-text
            mb-1
          "
        >
          Ordre d'affichage
        </label>

        <input
          type="number"
          min="1"
          value={order}
          onChange={(e) =>
            setOrder(e.target.value)
          }
          disabled={loading}
          className="
            w-full
            sm:w-32

            border
            theme-border

            theme-surface
            theme-text

            p-3

            rounded-lg

            outline-none

            focus:ring-2
            focus:ring-accent
            focus:border-accent

            disabled:bg-gray-100
            disabled:dark:bg-gray-800
            disabled:cursor-not-allowed
            disabled:opacity-60

            transition
          "
        />

      </div>


      {/* =====================================================
          BOUTONS
      ===================================================== */}

      <div
        className="
          flex
          flex-col
          sm:flex-row

          gap-3

          pt-2

          w-full
        "
      >

        {/* AJOUTER */}

        <button
          type="submit"
          disabled={loading}
          className="
            w-full
            sm:w-auto

            flex
            items-center
            justify-center

            gap-2

            bg-accent
            hover:opacity-90

            text-white

            px-5
            py-3

            rounded-lg

            disabled:opacity-50
            disabled:cursor-not-allowed

            transition
          "
        >

          <Save size={18} />

          {loading
            ? "Enregistrement..."
            : "Ajouter"
          }

        </button>


        {/* ANNULER */}

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="
              w-full
              sm:w-auto

              flex
              items-center
              justify-center

              gap-2

              border
              theme-border

              theme-surface
              theme-text

              px-5
              py-3

              rounded-lg

              hover:bg-gray-50
              dark:hover:bg-gray-800

              disabled:opacity-50
              disabled:cursor-not-allowed

              transition
            "
          >

            <X size={18} />

            Annuler

          </button>
        )}

      </div>

    </form>
  );
}