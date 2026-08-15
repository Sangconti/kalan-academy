import { useNavigate } from "react-router-dom";
import { ShieldX, LogOut } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function AccessBlockedPage() {
  const navigate = useNavigate();

  async function handleLogout() {
    await supabase.auth.signOut();

    navigate("/login", {
      replace: true
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-5">

      <div className="w-full max-w-md bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center">

        <div className="w-16 h-16 mx-auto rounded-2xl bg-red-50 text-red-500 flex items-center justify-center">
          <ShieldX size={30} />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mt-6">
          Accès désactivé
        </h1>

        <p className="text-gray-500 mt-3 leading-relaxed">
          L'accès à ton compte Kalan Academy
          a été désactivé par un administrateur.
        </p>

        <p className="text-sm text-gray-400 mt-4">
          Si tu penses qu'il s'agit d'une erreur,
          contacte l'administration.
        </p>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-7 w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 rounded-xl transition"
        >
          <LogOut size={18} />
          Se déconnecter
        </button>

      </div>

    </div>
  );
}