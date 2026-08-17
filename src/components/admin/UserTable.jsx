import { supabase } from "../../lib/supabase";

export default function UserTable({
  users,
  onRoleChange,
  onAccessStatusChange,
  onDelete
}) {

  async function handleDelete(user) {

    // =====================================
    // VÉRIFIER L'UTILISATEUR CONNECTÉ
    // =====================================

    const {
      data: { user: currentUser }
    } = await supabase.auth.getUser();

    // =====================================
    // PROTECTION AUTO-SUPPRESSION
    // =====================================

    if (currentUser?.id === user.id) {
      alert(
        "Vous ne pouvez pas supprimer votre propre compte."
      );

      return;
    }

    // =====================================
    // CONFIRMATION
    // =====================================

    const confirmed = window.confirm(
      `Voulez-vous vraiment supprimer définitivement ${
        user.full_name || "cet utilisateur"
      } ?\n\nCette action supprimera son compte et ses données de profil.`
    );

    if (!confirmed) {
      return;
    }

    // =====================================
    // SUPPRESSION
    // =====================================

    try {

      await onDelete(user.id);

    } catch (error) {

      console.error(
        "Erreur suppression utilisateur :",
        error
      );

      alert(
        error?.message ||
        "Impossible de supprimer cet utilisateur."
      );

    }

  }


  return (

    <div className="
      bg-white
      rounded-xl
      shadow
      overflow-hidden
    ">

      <table className="
        w-full
      ">

        <thead className="
          bg-gray-100
        ">

          <tr>

            <th className="p-4 text-left">
              Nom
            </th>

            <th className="p-4">
              Rôle
            </th>

            <th className="p-4">
              Accès
            </th>

            <th className="p-4">
              Premium
            </th>

            <th className="p-4">
              XP
            </th>

            <th className="p-4">
              Niveau
            </th>

            <th className="p-4">
              Actions
            </th>

          </tr>

        </thead>


        <tbody>

          {users.map((user) => (

            <tr
              key={user.id}
              className="
                border-t
                hover:bg-gray-50
                transition
              "
            >

              {/* ==========================
                  NOM
              ========================== */}

              <td className="
                p-4
                font-medium
                text-gray-900
              ">

                {user.full_name || "Sans nom"}

              </td>


              {/* ==========================
                  RÔLE
              ========================== */}

              <td className="p-4">

                <select
                  value={user.role || "student"}
                  onChange={(e) =>
                    onRoleChange(
                      user.id,
                      e.target.value
                    )
                  }
                  className="
                    border
                    border-gray-200
                    rounded-lg
                    p-2
                    bg-white
                    text-gray-700
                    outline-none
                    focus:border-blue-500
                    focus:ring-2
                    focus:ring-blue-100
                  "
                >

                  <option value="student">
                    student
                  </option>

                  <option value="teacher">
                    teacher
                  </option>

                  <option value="editor">
                    editor
                  </option>

                  <option value="admin">
                    admin
                  </option>

                  <option value="super_admin">
                    super_admin
                  </option>

                </select>

              </td>


              {/* ==========================
                  ACCÈS
              ========================== */}

              <td className="p-4">

                {user.access_status === "active" ? (

                  <button
                    type="button"
                    onClick={() =>
                      onAccessStatusChange(
                        user.id,
                        "pending"
                      )
                    }
                    className="
                      px-3
                      py-2
                      rounded-lg
                      bg-green-100
                      text-green-700
                      hover:bg-green-200
                      transition
                      font-medium
                      text-sm
                    "
                  >
                    ✅ Actif
                  </button>

                ) : (

                  <button
                    type="button"
                    onClick={() =>
                      onAccessStatusChange(
                        user.id,
                        "active"
                      )
                    }
                    className="
                      px-3
                      py-2
                      rounded-lg
                      bg-yellow-100
                      text-yellow-700
                      hover:bg-yellow-200
                      transition
                      font-medium
                      text-sm
                    "
                  >
                    🔒 Activer
                  </button>

                )}

              </td>


              {/* ==========================
                  PREMIUM
              ========================== */}

              <td className="
                p-4
                text-center
              ">

                {user.is_premium
                  ? "⭐"
                  : "-"
                }

              </td>


              {/* ==========================
                  XP
              ========================== */}

              <td className="
                p-4
                text-center
              ">

                {user.xp || 0}

              </td>


              {/* ==========================
                  NIVEAU
              ========================== */}

              <td className="
                p-4
                text-center
              ">

                {user.level || 1}

              </td>


              {/* ==========================
                  ACTIONS
              ========================== */}

              <td className="
                p-4
                text-center
              ">

                <button
                  type="button"
                  onClick={() =>
                    handleDelete(user)
                  }
                  className="
                    px-3
                    py-2
                    rounded-lg
                    bg-red-100
                    text-red-700
                    hover:bg-red-200
                    transition
                    font-medium
                    text-sm
                  "
                >
                  🗑️ Supprimer
                </button>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>

  );
}