import useAdmin from "../../hooks/useAdmin";
import { supabase } from "../../lib/supabase";

export default function AdminHeader() {
  const { admin } = useAdmin();

  async function logout() {
    await supabase.auth.signOut();

    window.location.href = "/admin/login";
  }

  return (
    <header
      className="
        min-h-16
        w-full

        bg-white
        border-b

        flex
        items-center
        justify-between

        gap-3

        px-4
        sm:px-6

        py-3
      "
    >

      {/* ==========================================
          TITRE
      ========================================== */}

      <div
        className="
          min-w-0
          pl-12
          md:pl-0
        "
      >
        <h2
          className="
            font-semibold
            text-gray-900
            truncate
          "
        >
          Administration
        </h2>
      </div>


      {/* ==========================================
          ADMIN + DÉCONNEXION
      ========================================== */}

      <div
        className="
          flex
          items-center
          gap-2
          sm:gap-5

          min-w-0
        "
      >

        {/* ========================================
            INFORMATIONS ADMIN
        ======================================== */}

        <div
          className="
            text-right
            min-w-0
            hidden
            xs:block
          "
        >

          <p
            className="
              font-medium
              text-gray-900

              truncate
              max-w-[120px]
              sm:max-w-[180px]
            "
          >
            {admin?.profile?.full_name || "Administrateur"}
          </p>

          <p
            className="
              text-xs
              text-gray-500
              truncate
            "
          >
            {admin?.profile?.role || ""}
          </p>

        </div>


        {/* ========================================
            DÉCONNEXION
        ======================================== */}

        <button
          type="button"
          onClick={logout}
          className="
            bg-red-500
            text-white

            px-3
            sm:px-4

            py-2

            rounded-lg

            text-sm
            sm:text-base

            whitespace-nowrap

            hover:bg-red-600
            active:scale-95

            transition
          "
        >
          Déconnexion
        </button>

      </div>

    </header>
  );
}