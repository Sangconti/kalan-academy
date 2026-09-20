import {
  useEffect,
  useState
} from "react";

import { useNavigate } from "react-router-dom";

import { supabase } from "../../lib/supabase";

import UserTable from "../../components/admin/UserTable";
import UserFilters from "../../components/admin/UserFilters";

import {
  getAdminUsers,
  updateUserRole,
  updateUserAccess,
  deleteAdminUser,
  updateUserAccessStatus
} from "../../services/adminService";

export default function UsersAdmin() {
  const navigate = useNavigate();

  // =====================================================
  // NAVIGATION CONSULTATION
  // =====================================================

  function viewStudent(studentId) {
    console.log(
      "👁️ [ADMIN] Ouverture du mode consultation :",
      studentId
    );

    navigate(
      `/admin/student/${studentId}/consultation`
    );
  }

  // =====================================================
  // NAVIGATION GESTION
  // =====================================================

  function manageStudent(studentId) {
    console.log(
      "⚙️ [ADMIN] Ouverture de la gestion de l'élève :",
      studentId
    );

    navigate(
      `/admin/student/${studentId}`
    );
  }

  // =====================================================
  // SUPPRESSION UTILISATEUR
  // =====================================================

  async function deleteUser(id) {
    try {
      await deleteAdminUser(id);

      await load();
    } catch (error) {
      console.error(
        "Erreur suppression utilisateur :",
        error
      );

      throw error;
    }
  }

  // =====================================================
  // RÉINITIALISATION APPAREIL
  // =====================================================

  async function resetUserDevice(id) {
    try {
      const {
        data,
        error
      } = await supabase.rpc(
        "reset_user_device",
        {
          p_user_id: id
        }
      );

      if (error) {
        console.error(
          "❌ [ADMIN] Erreur RPC reset appareil :",
          error
        );

        throw error;
      }

      if (!data?.success) {
        throw new Error(
          data?.status === "not_authorized"
            ? "Vous n'êtes pas autorisé à réinitialiser cet appareil."
            : data?.status === "not_authenticated"
              ? "Votre session administrateur n'est plus valide."
              : "Impossible de réinitialiser l'appareil."
        );
      }

      await load();
    } catch (error) {
      console.error(
        "Erreur réinitialisation appareil :",
        error
      );

      throw error;
    }
  }

  // =====================================================
  // ÉTAT
  // =====================================================

  const [users, setUsers] = useState([]);

  const [search, setSearch] = useState("");

  const [role, setRole] = useState("");

  // =====================================================
  // CHARGEMENT
  // =====================================================

  async function load() {
    const data = await getAdminUsers();

    setUsers(data);
  }

  useEffect(() => {
    load();
  }, []);

  // =====================================================
  // CHANGEMENT RÔLE
  // =====================================================

  async function changeRole(
    id,
    newRole
  ) {
    await updateUserRole(
      id,
      newRole
    );

    load();
  }

  // =====================================================
  // CHANGEMENT ACCÈS
  // =====================================================

  async function changeAccess(
    id,
    newStatus
  ) {
    await updateUserAccess(
      id,
      newStatus
    );

    load();
  }

  // =====================================================
  // CHANGEMENT STATUT ACCÈS
  // =====================================================

  async function changeAccessStatus(
    id,
    newStatus
  ) {
    try {
      await updateUserAccessStatus(
        id,
        newStatus
      );

      await load();
    } catch (error) {
      console.error(
        "Erreur changement accès utilisateur :",
        error
      );
    }
  }

  // =====================================================
  // FILTRAGE
  // =====================================================

  const filtered =
    users.filter((user) => {
      const matchName =
        (user.full_name || "")
          .toLowerCase()
          .includes(
            search.toLowerCase()
          );

      const matchRole =
        role === "" ||
        user.role === role;

      return matchName && matchRole;
    });

  // =====================================================
  // AFFICHAGE
  // =====================================================

  return (
    <>
      {/* ==================================================
          EN-TÊTE
      ================================================== */}

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

          mb-7
        "
      >
        {/* Décorations */}

        <div
          className="
            absolute
            -right-10
            -top-10

            w-40
            h-40

            rounded-full

            bg-accent
            opacity-10
          "
        />

        <div
          className="
            absolute
            -left-16
            -bottom-20

            w-48
            h-48

            rounded-full

            bg-accent
            opacity-10
          "
        />

        <div
          className="
            absolute
            right-16
            -bottom-24

            w-56
            h-56

            rounded-full

            bg-accent
            opacity-5
          "
        />

        <div className="relative z-10">
          {/* Badge */}

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

              mb-4
            "
          >
            <span>👥</span>
            Gestion des utilisateurs
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
            Gestion des utilisateurs
          </h1>

          <p
            className="
              theme-text-secondary

              mt-3

              leading-relaxed
            "
          >
            Consultez les comptes, gérez les rôles et les accès,
            et administrez les appareils associés aux utilisateurs.
          </p>

          {/* Informations */}

          <div
            className="
              mt-5

              flex
              flex-wrap
              items-center
              gap-3
            "
          >
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

                border
                border-white/50
                dark:border-white/10

                theme-text

                text-sm
                font-medium
              "
            >
              👤 {filtered.length} utilisateur
              {filtered.length > 1 ? "s" : ""}
            </div>

            {search && (
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

                  border
                  border-white/50
                  dark:border-white/10

                  theme-text

                  text-sm
                  font-medium
                "
              >
                🔎 Recherche active
              </div>
            )}

            {role && (
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

                  border
                  border-white/50
                  dark:border-white/10

                  theme-text

                  text-sm
                  font-medium
                "
              >
                🎯 Rôle : {role}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ==================================================
          FILTRES
      ================================================== */}

      <div
        className="
          theme-surface
          theme-border
          border

          rounded-3xl

          shadow-sm

          p-4
          sm:p-5
          md:p-6

          mb-6
        "
      >
        <div
          className="
            flex
            items-center
            gap-2

            mb-4
          "
        >
          <div
            className="
              w-9
              h-9

              rounded-xl

              bg-accent-soft
              text-accent

              flex
              items-center
              justify-center
            "
          >
            🔎
          </div>

          <div>
            <h2
              className="
                font-semibold
                theme-text
              "
            >
              Rechercher et filtrer
            </h2>

            <p
              className="
                text-xs
                theme-text-secondary
                mt-0.5
              "
            >
              Affinez la liste des utilisateurs.
            </p>
          </div>
        </div>

        <UserFilters
          search={search}
          setSearch={setSearch}
          role={role}
          setRole={setRole}
        />
      </div>

      {/* ==================================================
          TABLEAU
      ================================================== */}

      <UserTable
        users={filtered}
        onRoleChange={changeRole}
        onAccessChange={changeAccess}
        onAccessStatusChange={changeAccessStatus}
        onDelete={deleteUser}
        onDeviceReset={resetUserDevice}
        onViewStudent={viewStudent}
        onManageStudent={manageStudent}
      />
    </>
  );
}