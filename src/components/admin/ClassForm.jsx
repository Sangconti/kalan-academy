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

    const cleanName =
      name.trim();

    const cleanCode =
      code.trim().toUpperCase();

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
        order_number:
          Number(order) || 1,
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
      className="space-y-4"
    >

      {/* ERREUR */}

      {error && (

        <div
          className="
            bg-red-50
            border
            border-red-200
            text-red-700
            rounded-lg
            px-4
            py-3
            text-sm
          "
        >
          {error}
        </div>

      )}


      {/* NOM */}

      <div>

        <label
          className="
            block
            text-sm
            font-medium
            text-gray-700
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
            border
            p-3
            rounded-lg
            outline-none
            focus:ring-2
            focus:ring-blue-500
            disabled:bg-gray-100
          "
        />

      </div>


      {/* CODE */}

      <div>

        <label
          className="
            block
            text-sm
            font-medium
            text-gray-700
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
            border
            p-3
            rounded-lg
            uppercase
            outline-none
            focus:ring-2
            focus:ring-blue-500
            disabled:bg-gray-100
          "
        />

      </div>


      {/* ORDRE */}

      <div>

        <label
          className="
            block
            text-sm
            font-medium
            text-gray-700
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
            setOrder(
              e.target.value
            )
          }
          disabled={loading}
          className="
            border
            p-3
            rounded-lg
            w-32
            outline-none
            focus:ring-2
            focus:ring-blue-500
            disabled:bg-gray-100
          "
        />

      </div>


      {/* BOUTONS */}

      <div className="flex gap-3 pt-2">

        <button
          type="submit"
          disabled={loading}
          className="
            flex
            items-center
            gap-2
            bg-blue-600
            hover:bg-blue-700
            text-white
            px-5
            py-3
            rounded-lg
            disabled:opacity-50
          "
        >

          <Save size={18} />

          {loading
            ? "Enregistrement..."
            : "Ajouter"}

        </button>


        {onCancel && (

          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="
              flex
              items-center
              gap-2
              border
              px-5
              py-3
              rounded-lg
              text-gray-700
              hover:bg-gray-50
              disabled:opacity-50
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
