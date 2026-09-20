// src/pages/admin/components/UserTable.jsx

import { supabase } from "../../lib/supabase";

export default function UserTable({
  users,
  onRoleChange,
  onAccessStatusChange,
  onDelete,
  onDeviceReset,
  onViewStudent,
  onManageStudent
}) {
  // ==========================================
  // SUPPRESSION UTILISATEUR
  // ==========================================

  async function handleDelete(user) {
    const {
      data: { user: currentUser }
    } = await supabase.auth.getUser();

    if (currentUser?.id === user.id) {
      alert(
        "Vous ne pouvez pas supprimer votre propre compte."
      );

      return;
    }

    const confirmed = window.confirm(
      `Voulez-vous vraiment supprimer définitivement ${
        user.full_name || "cet utilisateur"
      } ?\n\nCette action supprimera son compte et ses données de profil.`
    );

    if (!confirmed) {
      return;
    }

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

  // ==========================================
  // RÉINITIALISATION APPAREIL
  // ==========================================

  async function handleDeviceReset(user) {
    const {
      data: { user: currentUser }
    } = await supabase.auth.getUser();

    if (currentUser?.id === user.id) {
      alert(
        "Vous ne pouvez pas réinitialiser votre propre appareil depuis cette action."
      );

      return;
    }

    const confirmed = window.confirm(
      `Voulez-vous réinitialiser l'appareil de ${
        user.full_name || "cet utilisateur"
      } ?\n\n` +
      `Son téléphone actuellement associé sera désassocié. ` +
      `Il pourra ensuite connecter son compte sur un nouveau téléphone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      await onDeviceReset(user.id);

      alert(
        "📱 Appareil réinitialisé avec succès."
      );
    } catch (error) {
      console.error(
        "Erreur réinitialisation appareil :",
        error
      );

      alert(
        error?.message ||
        "Impossible de réinitialiser l'appareil."
      );
    }
  }

  return (
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
      {/* =====================================================
          CONTENEUR RESPONSIVE
      ===================================================== */}

      <div
        className="
          w-full
          overflow-x-auto
          overscroll-x-contain
        "
      >
        <table
          className="
            w-full
            min-w-[1450px]
          "
        >
          {/* =====================================================
              HEADER
          ===================================================== */}

          <thead
            className="
              bg-accent-soft
              border-b
              border-accent
            "
          >
            <tr>
              <th
                className="
                  p-4
                  text-left
                  whitespace-nowrap
                  font-semibold
                  theme-text
                "
              >
                Nom
              </th>

              <th
                className="
                  p-4
                  whitespace-nowrap
                  font-semibold
                  theme-text
                "
              >
                Rôle
              </th>

              <th
                className="
                  p-4
                  whitespace-nowrap
                  font-semibold
                  theme-text
                "
              >
                Accès
              </th>

              <th
                className="
                  p-4
                  whitespace-nowrap
                  font-semibold
                  theme-text
                "
              >
                Premium
              </th>

              <th
                className="
                  p-4
                  whitespace-nowrap
                  font-semibold
                  theme-text
                "
              >
                XP
              </th>

              <th
                className="
                  p-4
                  whitespace-nowrap
                  font-semibold
                  theme-text
                "
              >
                Niveau
              </th>

              <th
                className="
                  p-4
                  whitespace-nowrap
                  font-semibold
                  theme-text
                "
              >
                Actions
              </th>
            </tr>
          </thead>

          {/* =====================================================
              CORPS
          ===================================================== */}

          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="
                  border-t
                  theme-border

                  hover:bg-accent-soft

                  transition-colors
                "
              >
                {/* =================================================
                    NOM
                ================================================= */}

                <td
                  className="
                    p-4
                    font-medium
                    theme-text
                    whitespace-nowrap
                  "
                >
                  {user.full_name || "Sans nom"}
                </td>

                {/* =================================================
                    RÔLE
                ================================================= */}

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
                      min-w-[135px]

                      border
                      theme-border

                      rounded-xl

                      p-2

                      theme-surface
                      theme-text

                      outline-none

                      focus:border-accent
                      focus:ring-2
                      focus:ring-accent-soft

                      transition
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

                {/* =================================================
                    ACCÈS
                ================================================= */}

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
                        min-w-[95px]

                        px-3
                        py-2

                        rounded-xl

                        bg-green-100
                        dark:bg-green-950/40

                        text-green-700
                        dark:text-green-300

                        hover:bg-green-200
                        dark:hover:bg-green-900/50

                        transition

                        font-medium
                        text-sm

                        whitespace-nowrap
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
                        min-w-[105px]

                        px-3
                        py-2

                        rounded-xl

                        bg-yellow-100
                        dark:bg-yellow-950/40

                        text-yellow-700
                        dark:text-yellow-300

                        hover:bg-yellow-200
                        dark:hover:bg-yellow-900/50

                        transition

                        font-medium
                        text-sm

                        whitespace-nowrap
                      "
                    >
                      🔒 Activer
                    </button>
                  )}
                </td>

                {/* =================================================
                    PREMIUM
                ================================================= */}

                <td
                  className="
                    p-4
                    text-center
                    whitespace-nowrap
                    theme-text
                  "
                >
                  {user.is_premium ? "⭐" : "-"}
                </td>

                {/* =================================================
                    XP
                ================================================= */}

                <td
                  className="
                    p-4
                    text-center
                    whitespace-nowrap
                    theme-text
                  "
                >
                  {user.xp || 0}
                </td>

                {/* =================================================
                    NIVEAU
                ================================================= */}

                <td
                  className="
                    p-4
                    text-center
                    whitespace-nowrap
                    theme-text
                  "
                >
                  {user.level || 1}
                </td>

                {/* =================================================
                    ACTIONS
                ================================================= */}

                <td
                  className="
                    p-4
                    text-center
                  "
                >
                  <div
                    className="
                      flex
                      flex-wrap
                      justify-center
                      gap-2
                    "
                  >
                    {/* VOIR LA PAGE DE L'ÉLÈVE */}

                    <button
                      type="button"
                      onClick={() =>
                        onViewStudent(user.id)
                      }
                      className="
                        min-w-[120px]

                        px-3
                        py-2

                        rounded-xl

                        bg-purple-100
                        dark:bg-purple-950/40

                        text-purple-700
                        dark:text-purple-300

                        hover:bg-purple-200
                        dark:hover:bg-purple-900/50

                        transition

                        font-medium
                        text-sm

                        whitespace-nowrap
                      "
                    >
                      👁️ Voir la page
                    </button>

                    {/* GÉRER L'ÉLÈVE */}

                    <button
                      type="button"
                      onClick={() =>
                        onManageStudent(user.id)
                      }
                      className="
                        min-w-[125px]

                        px-3
                        py-2

                        rounded-xl

                        bg-amber-100
                        dark:bg-amber-950/40

                        text-amber-700
                        dark:text-amber-300

                        hover:bg-amber-200
                        dark:hover:bg-amber-900/50

                        transition

                        font-medium
                        text-sm

                        whitespace-nowrap
                      "
                    >
                      ⚙️ Gérer l'élève
                    </button>

                    {/* RÉINITIALISER APPAREIL */}

                    <button
                      type="button"
                      onClick={() =>
                        handleDeviceReset(user)
                      }
                      className="
                        min-w-[125px]

                        px-3
                        py-2

                        rounded-xl

                        bg-blue-100
                        dark:bg-blue-950/40

                        text-blue-700
                        dark:text-blue-300

                        hover:bg-blue-200
                        dark:hover:bg-blue-900/50

                        transition

                        font-medium
                        text-sm

                        whitespace-nowrap
                      "
                    >
                      📱 Réinitialiser
                    </button>

                    {/* SUPPRIMER */}

                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(user)
                      }
                      className="
                        min-w-[120px]

                        px-3
                        py-2

                        rounded-xl

                        bg-red-100
                        dark:bg-red-950/40

                        text-red-700
                        dark:text-red-300

                        hover:bg-red-200
                        dark:hover:bg-red-900/50

                        transition

                        font-medium
                        text-sm

                        whitespace-nowrap
                      "
                    >
                      🗑️ Supprimer
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* =====================================================
          INDICATION MOBILE
      ===================================================== */}

      <div
        className="
          sm:hidden

          px-4
          py-3

          bg-accent-soft

          border-t
          border-accent

          text-xs
          theme-text-secondary

          text-center
        "
      >
        👉 Fais glisser le tableau horizontalement pour voir
        toutes les informations.
      </div>
    </div>
  );
}