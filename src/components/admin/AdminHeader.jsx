import useAdmin from "../../hooks/useAdmin";
import { supabase } from "../../lib/supabase";
import { useNavigate } from "react-router-dom";

export default function AdminHeader() {
  const { admin } = useAdmin();
  const navigate = useNavigate();

  async function logout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error(
        "❌ [ADMIN LOGOUT] Erreur déconnexion =",
        error
      );
      return;
    }

    console.log(
      "✅ [ADMIN LOGOUT] Déconnexion réussie"
    );

    navigate("/login", {
      replace: true
    });
  }

  return (
    <header
      className="
        min-h-16
        w-full

        theme-surface
        theme-border
        border-b

        flex
        items-center
        justify-between

        gap-3

        px-4
        sm:px-6

        py-3

        shadow-sm
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
        <div
          className="
            inline-flex
            items-center
            gap-2
            px-3
            py-1.5
            rounded-full
            bg-accent-soft
            border
            border-accent
          "
        >
          <span
            className="
              w-2
              h-2
              rounded-full
              bg-accent
              shrink-0
            "
          />

          <h2
            className="
              text-sm
              sm:text-base
              font-semibold
              theme-text
              truncate
            "
          >
            Administration
          </h2>
        </div>
      </div>

      {/* ==========================================
          ADMIN + DÉCONNEXION
      ========================================== */}

      <div
        className="
          flex
          items-center
          gap-2
          sm:gap-4

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

            px-3
            py-2

            rounded-xl

            bg-accent-soft
            border
            border-accent
          "
        >
          <p
            className="
              text-sm
              font-semibold
              theme-text

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
              theme-text-secondary
              truncate
              mt-0.5
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

            rounded-xl

            text-sm
            sm:text-base
            font-semibold

            whitespace-nowrap

            shadow-sm

            hover:bg-red-600
            hover:-translate-y-0.5
            active:scale-95

            transition-all
          "
        >
          Déconnexion
        </button>
      </div>
    </header>
  );
}