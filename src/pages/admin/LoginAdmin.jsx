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

    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    const admin = await getCurrentAdmin();

    if (!admin) {
      await supabase.auth.signOut();
      setError("Accès administrateur refusé.");
      setLoading(false);
      return;
    }

    navigate("/admin");
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
        />

        <input
          type="password"
          className="border w-full p-3 rounded mb-4"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <div className="text-red-500 mb-4">
            {error}
          </div>
        )}

        <button
          className="bg-indigo-600 text-white w-full p-3 rounded"
          disabled={loading}
        >
          {loading ? "Connexion..." : "Connexion"}
        </button>

      </form>

    </div>
  );
}