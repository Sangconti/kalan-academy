import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function ProtectedStudentRoute({ user, children }) {
  const [loading, setLoading] = useState(true);
  const [accessStatus, setAccessStatus] = useState(null);

  useEffect(() => {
    async function checkAccess() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("role, access_status")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error(
            "❌ [PROTECTED STUDENT] Erreur profil =",
            error
          );

          setAccessStatus(null);
          setLoading(false);
          return;
        }

        console.log(
          "👤 [PROTECTED STUDENT] profil =",
          data
        );

        setAccessStatus(data?.access_status || null);
        setLoading(false);

      } catch (error) {
        console.error(
          "💥 [PROTECTED STUDENT] Exception =",
          error
        );

        setAccessStatus(null);
        setLoading(false);
      }
    }

    checkAccess();
  }, [user]);

  // ==========================================
  // CHARGEMENT
  // ==========================================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>

          <p className="text-gray-600">
            Vérification de ton accès...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // PAS CONNECTÉ
  // ==========================================

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  // ==========================================
  // ACCÈS REFUSÉ
  // ==========================================

  if (accessStatus !== "active") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-5">
        <div className="w-full max-w-md bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center">

          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-yellow-50 text-yellow-600 flex items-center justify-center text-3xl">
            🔒
          </div>

          <h1 className="text-2xl font-bold text-gray-900">
            Accès en attente
          </h1>

          <p className="text-gray-500 mt-3 leading-relaxed">
            Ton compte a bien été créé, mais ton accès à Kalan Academy
            doit encore être activé par un administrateur.
          </p>

          <p className="text-sm text-gray-400 mt-4">
            Tu pourras accéder aux cours dès que ton compte sera activé.
          </p>

          <button
            type="button"
            onClick={async () => {
              await supabase.auth.signOut();
            }}
            className="mt-6 w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 rounded-xl transition"
          >
            Se déconnecter
          </button>

        </div>
      </div>
    );
  }

  // ==========================================
  // ACCÈS AUTORISÉ
  // ==========================================

  return children;
}