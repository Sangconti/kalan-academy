import { useNavigate } from "react-router-dom";
import { Clock, LogOut } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function AccessPendingPage() {
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

        <div className="w-16 h-16 mx-auto rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center">
          <Clock size={30} />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mt-6">
          Compte en attente
        </h1>

        <p className="text-gray-500 mt-3 leading-relaxed">
          Ton compte a bien été créé.
          <br />
          Un administrateur doit maintenant
          valider ton accès à Kalan Academy.
        </p>

        <p className="text-sm text-gray-400 mt-4">
          Tu pourras accéder aux cours dès que
          ton compte sera activé.
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