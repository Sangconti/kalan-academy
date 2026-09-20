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
    <div className="min-h-screen theme-bg theme-text flex items-center justify-center px-5 py-10">

      <div className="relative w-full max-w-md overflow-hidden bg-accent-soft border border-accent rounded-3xl shadow-lg p-8 text-center">

        <div className="absolute -right-12 -top-12 w-40 h-40 rounded-full bg-accent opacity-10" />

        <div className="absolute -left-16 -bottom-20 w-48 h-48 rounded-full bg-accent opacity-10" />

        <div className="absolute right-12 -bottom-24 w-56 h-56 rounded-full bg-accent opacity-5" />


        <div className="relative z-10">

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs font-semibold mb-5">

            <ShieldX size={14} />

            Accès désactivé

          </div>


          <div className="w-16 h-16 mx-auto rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900 flex items-center justify-center">

            <ShieldX
              size={30}
              className="text-red-500 dark:text-red-400"
            />

          </div>


          <h1 className="text-2xl font-bold theme-text mt-6">
            Accès désactivé
          </h1>


          <p className="theme-text-secondary mt-3 leading-relaxed">
            L'accès à ton compte Kalan Academy
            a été désactivé par un administrateur.
          </p>


          <p className="text-sm theme-text-secondary mt-4">
            Si tu penses qu'il s'agit d'une erreur,
            contacte l'administration.
          </p>


          <button
            type="button"
            onClick={handleLogout}
            className="mt-7 w-full flex items-center justify-center gap-2 bg-accent text-white font-semibold py-3 rounded-xl shadow-md hover:opacity-90 hover:-translate-y-0.5 transition"
          >

            <LogOut size={18} />

            Se déconnecter

          </button>

        </div>

      </div>

    </div>
  );
}