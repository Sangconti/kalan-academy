export default function UserFilters({
  search,
  setSearch,
  role,
  setRole
}) {
  return (
    <div
      className="
        flex
        flex-col
        sm:flex-row

        gap-3
        sm:gap-4

        mb-6
      "
    >
      <input
        className="
          w-full

          border
          theme-border

          rounded-2xl

          p-3

          flex-1

          theme-surface
          theme-text

          placeholder:text-gray-400
          dark:placeholder:text-gray-500

          outline-none

          focus:border-accent
          focus:ring-2
          focus:ring-accent-soft

          transition
        "
        placeholder="Rechercher un élève..."
        value={search}
        onChange={(e) =>
          setSearch(e.target.value)
        }
      />

      <select
        className="
          w-full
          sm:w-auto

          border
          theme-border

          rounded-2xl

          p-3

          theme-surface
          theme-text

          outline-none

          focus:border-accent
          focus:ring-2
          focus:ring-accent-soft

          transition
        "
        value={role}
        onChange={(e) =>
          setRole(e.target.value)
        }
      >
        <option value="">
          Tous les rôles
        </option>

        <option value="student">
          Élève
        </option>

        <option value="teacher">
          Enseignant
        </option>

        <option value="editor">
          Éditeur
        </option>

        <option value="admin">
          Admin
        </option>

        <option value="super_admin">
          Super Admin
        </option>
      </select>
    </div>
  );
}