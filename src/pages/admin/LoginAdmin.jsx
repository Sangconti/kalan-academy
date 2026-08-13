import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

    console.log("🔐 [LOGIN ADMIN] Tentative de connexion :", email);

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
    <div className="min-h-screen flex items-center justify-center bg-gray-100">

      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md"
      >

        <h1 className="text-2xl font-bold mb-6 text-center">
          Administration Kalan Academy
        </h1>

        <input
          className="border w-full p-3 rounded mb-4"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          required
        />

        <input
          type="password"
          className="border w-full p-3 rounded mb-4"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          required
        />

        {error && (
          <div className="text-red-500 mb-4">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="bg-indigo-600 text-white w-full p-3 rounded disabled:opacity-60"
          disabled={loading}
        >
          {loading
            ? "Connexion..."
            : "Connexion"}
        </button>

      </form>

    </div>
  );
}