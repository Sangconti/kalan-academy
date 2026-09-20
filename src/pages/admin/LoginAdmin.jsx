import { useState } from "react";

import { useNavigate } from "react-router-dom";

import {
  ShieldCheck,
  Mail,
  Lock,
  LogIn,
  Loader2,
} from "lucide-react";

import { supabase } from "../../lib/supabase";

import { getCurrentAdmin } from "../../services/adminAuthService";

export default function LoginAdmin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();

    console.log(
      "🔐 [LOGIN ADMIN] Tentative de connexion :",
      email
    );

    setLoading(true);
    setError("");

    try {
      // ==========================================
      // CONNEXION SUPABASE
      // ==========================================

      const {
        data,
        error: loginError,
      } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      console.log(
        "🔐 [LOGIN ADMIN] signIn data =",
        data
      );

      console.log(
        "❌ [LOGIN ADMIN] signIn error =",
        loginError
      );

      if (loginError) {
        setError(loginError.message);
        return;
      }

      console.log(
        "✅ [LOGIN ADMIN] Connexion Supabase réussie"
      );

      console.log(
        "👤 [LOGIN ADMIN] user =",
        data?.user
      );

      console.log(
        "🔑 [LOGIN ADMIN] session =",
        data?.session
      );

      // ==========================================
      // VÉRIFICATION ADMIN
      // ==========================================

      console.log(
        "👑 [LOGIN ADMIN] Vérification administrateur..."
      );

      const admin = await getCurrentAdmin();

      console.log(
        "👑 [LOGIN ADMIN] getCurrentAdmin =",
        admin
      );

      if (!admin) {
        console.log(
          "🚫 [LOGIN ADMIN] Accès administrateur refusé"
        );

        await supabase.auth.signOut();

        setError(
          "Accès administrateur refusé."
        );

        return;
      }

      // ==========================================
      // ADMIN VALIDÉ
      // ==========================================

      console.log(
        "✅ [LOGIN ADMIN] ADMIN VALIDÉ"
      );

      console.log(
        "👤 [LOGIN ADMIN] Admin =",
        admin
      );

      console.log(
        "➡️ [LOGIN ADMIN] Navigation vers /admin"
      );

      navigate("/admin", {
        replace: true,
      });
    } catch (err) {
      console.error(
        "💥 [LOGIN ADMIN] Exception =",
        err
      );

      setError(
        err?.message ||
        "Une erreur est survenue lors de la connexion."
      );
    } finally {
      setLoading(false);

      console.log(
        "🏁 [LOGIN ADMIN] handleLogin terminé"
      );
    }
  }

  return (
    <div
      className="
        min-h-screen
        theme-bg
        theme-text

        flex
        items-center
        justify-center

        p-4
        sm:p-6

        relative
        overflow-hidden
      "
    >
      {/* ==================================================
          DÉCORATIONS DE FOND
      ================================================== */}

      <div
        className="
          absolute
          -right-20
          -top-20

          w-72
          h-72

          rounded-full

          bg-accent

          opacity-10
        "
      />

      <div
        className="
          absolute
          -left-24
          -bottom-24

          w-80
          h-80

          rounded-full

          bg-accent

          opacity-10
        "
      />

      {/* ==================================================
          CARTE
      ================================================== */}

      <div
        className="
          relative
          z-10

          w-full
          max-w-md

          rounded-3xl

          bg-accent-soft
          border
          border-accent

          shadow-lg

          p-6
          sm:p-8
        "
      >
        {/* ==================================================
            EN-TÊTE
        ================================================== */}

        <div className="text-center">
          <div
            className="
              mx-auto

              w-16
              h-16

              rounded-2xl

              bg-accent
              text-white

              flex
              items-center
              justify-center

              shadow-md

              mb-5
            "
          >
            <ShieldCheck size={32} />
          </div>

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
            <LogIn size={14} />
            Espace administrateur
          </div>

          <h1
            className="
              text-2xl
              sm:text-3xl

              font-bold

              theme-text
            "
          >
            Administration
          </h1>

          <p
            className="
              theme-text-secondary

              mt-3

              leading-relaxed

              text-sm
              sm:text-base
            "
          >
            Connectez-vous pour accéder à
            l'administration de Kalan Academy.
          </p>
        </div>

        {/* ==================================================
            FORMULAIRE
        ================================================== */}

        <form
          onSubmit={handleLogin}
          className="mt-7"
        >
          {/* EMAIL */}

          <div className="mb-4">
            <label
              htmlFor="admin-email"
              className="
                block

                text-sm
                font-semibold

                theme-text

                mb-2
              "
            >
              Adresse e-mail
            </label>

            <div className="relative">
              <Mail
                size={18}
                className="
                  absolute
                  left-3
                  top-1/2
                  -translate-y-1/2

                  text-accent
                "
              />

              <input
                id="admin-email"
                type="email"
                className="
                  w-full

                  border
                  theme-border

                  rounded-xl

                  p-3
                  pl-10

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
                placeholder="admin@kalan-academy.com"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* MOT DE PASSE */}

          <div className="mb-5">
            <label
              htmlFor="admin-password"
              className="
                block

                text-sm
                font-semibold

                theme-text

                mb-2
              "
            >
              Mot de passe
            </label>

            <div className="relative">
              <Lock
                size={18}
                className="
                  absolute
                  left-3
                  top-1/2
                  -translate-y-1/2

                  text-accent
                "
              />

              <input
                id="admin-password"
                type="password"
                className="
                  w-full

                  border
                  theme-border

                  rounded-xl

                  p-3
                  pl-10

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
                placeholder="Votre mot de passe"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* ERREUR */}

          {error && (
            <div
              className="
                mb-5

                rounded-xl

                border
                border-red-200
                dark:border-red-900/50

                bg-red-50
                dark:bg-red-950/30

                px-4
                py-3

                text-sm

                text-red-700
                dark:text-red-300
              "
              role="alert"
            >
              {error}
            </div>
          )}

          {/* BOUTON */}

          <button
            type="submit"
            className="
              w-full

              inline-flex
              items-center
              justify-center
              gap-2

              bg-accent
              text-white

              px-5
              py-3

              rounded-xl

              font-bold

              shadow-md

              hover:opacity-90
              hover:-translate-y-0.5

              active:scale-[0.99]

              transition-all

              disabled:opacity-60
              disabled:hover:translate-y-0
              disabled:cursor-not-allowed
            "
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2
                  size={18}
                  className="animate-spin"
                />

                Connexion...
              </>
            ) : (
              <>
                <LogIn size={18} />

                Connexion
              </>
            )}
          </button>
        </form>

        {/* ==================================================
            PIED
        ================================================== */}

        <div
          className="
            mt-6
            pt-5

            border-t
            border-accent

            text-center

            text-xs
            theme-text-secondary
          "
        >
          Kalan Academy • Administration
        </div>
      </div>
    </div>
  );
}