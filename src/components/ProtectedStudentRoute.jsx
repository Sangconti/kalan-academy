import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function ProtectedStudentRoute({
  user,
  children,
}) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function checkAccess() {
      console.log(
        "🛡️ [PROTECTED STUDENT] Vérification accès..."
      );

      // ==========================================
      // PAS CONNECTÉ
      // ==========================================

      if (!user) {
        console.log(
          "🚫 [PROTECTED STUDENT] Aucun utilisateur"
        );

        if (mounted) {
          setProfile(null);
          setLoading(false);
        }

        return;
      }

      console.log(
        "👤 [PROTECTED STUDENT] User ID =",
        user.id
      );

      // ==========================================
      // CACHE LOCAL DU PROFIL
      // ==========================================

      const profileCacheKey =
        `kalan_student_profile_${user.id}`;

      // ==========================================
      // HORS LIGNE
      // ==========================================

      if (!navigator.onLine) {
        console.log(
          "📴 [PROTECTED STUDENT] Hors ligne → utilisation du profil local"
        );

        try {
          const cachedProfile =
            localStorage.getItem(profileCacheKey);

          if (cachedProfile) {
            const parsedProfile =
              JSON.parse(cachedProfile);

            console.log(
              "📦 [PROTECTED STUDENT] Profil chargé depuis le cache local =",
              parsedProfile
            );

            if (mounted) {
              setProfile(parsedProfile);
              setLoading(false);
            }

            return;
          }

          console.log(
            "⚠️ [PROTECTED STUDENT] Aucun profil local disponible hors ligne"
          );
        } catch (cacheError) {
          console.error(
            "💥 [PROTECTED STUDENT] Erreur lecture profil local =",
            cacheError
          );
        }

        if (mounted) {
          setProfile(null);
          setLoading(false);
        }

        return;
      }

      // ==========================================
      // EN LIGNE → RÉCUPÉRER LE PROFIL SUPABASE
      // ==========================================

      try {
        const {
          data,
          error,
        } = await supabase
          .from("profiles")
          .select(
            "id, full_name, role, access_status"
          )
          .eq("id", user.id)
          .single();

        console.log(
          "👤 [PROTECTED STUDENT] Profil =",
          data
        );

        console.log(
          "❌ [PROTECTED STUDENT] Erreur profil =",
          error
        );

        if (!mounted) {
          return;
        }

        // ==========================================
        // PROFIL SUPABASE VALIDE
        // ==========================================

        if (!error && data) {
          // ========================================
          // SAUVEGARDER LE PROFIL LOCALEMENT
          // ========================================

          try {
            localStorage.setItem(
              profileCacheKey,
              JSON.stringify(data)
            );

            console.log(
              "💾 [PROTECTED STUDENT] Profil sauvegardé dans le cache local"
            );
          } catch (cacheError) {
            console.error(
              "⚠️ [PROTECTED STUDENT] Impossible de sauvegarder le profil local =",
              cacheError
            );
          }

          setProfile(data);
          setLoading(false);

          // ========================================
          // LOG DIAGNOSTIC
          // ========================================

          console.log(
            "🎭 [PROTECTED STUDENT] role =",
            data.role
          );

          console.log(
            "🔐 [PROTECTED STUDENT] access_status =",
            data.access_status
          );

          return;
        }

        // ==========================================
        // PROFIL NON TROUVÉ / ERREUR
        // ==========================================

        console.error(
          "🚫 [PROTECTED STUDENT] Profil introuvable"
        );

        setProfile(null);
        setLoading(false);

      } catch (error) {
        // ==========================================
        // ERREUR RÉSEAU
        // ==========================================

        console.error(
          "💥 [PROTECTED STUDENT] Exception =",
          error
        );

        // ==========================================
        // FALLBACK CACHE LOCAL
        //
        // Même si navigator.onLine indiquait
        // "en ligne", la connexion réelle peut
        // être indisponible.
        // ==========================================

        try {
          const cachedProfile =
            localStorage.getItem(profileCacheKey);

          if (cachedProfile) {
            const parsedProfile =
              JSON.parse(cachedProfile);

            console.log(
              "📦 [PROTECTED STUDENT] Erreur réseau → profil local utilisé =",
              parsedProfile
            );

            if (mounted) {
              setProfile(parsedProfile);
              setLoading(false);
            }

            return;
          }
        } catch (cacheError) {
          console.error(
            "💥 [PROTECTED STUDENT] Erreur lecture fallback local =",
            cacheError
          );
        }

        if (mounted) {
          setProfile(null);
          setLoading(false);
        }
      }
    }

    checkAccess();

    return () => {
      mounted = false;
    };
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
    console.log(
      "🚫 [PROTECTED STUDENT] Pas de user → /login"
    );

    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  // ==========================================
  // PROFIL INTROUVABLE
  // ==========================================

  if (!profile) {
    console.log(
      "🚫 [PROTECTED STUDENT] Profil absent → /login"
    );

    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  // ==========================================
  // ADMIN / SUPER ADMIN
  // ==========================================

  if (
    profile.role === "admin" ||
    profile.role === "super_admin"
  ) {
    console.log(
      "🛡️ [PROTECTED STUDENT] Compte administrateur détecté"
    );

    console.log(
      "➡️ [PROTECTED STUDENT] Redirection vers /admin"
    );

    return (
      <Navigate
        to="/admin"
        replace
      />
    );
  }

  // ==========================================
  // COMPTE BLOQUÉ
  // ==========================================

  if (
    profile.access_status === "blocked"
  ) {
    console.log(
      "🚫 [PROTECTED STUDENT] Compte bloqué"
    );

    return (
      <Navigate
        to="/access-blocked"
        replace
      />
    );
  }

  // ==========================================
  // ACCÈS NON ACTIF
  // ==========================================

  if (
    profile.access_status !== "active"
  ) {
    console.log(
      "⏳ [PROTECTED STUDENT] Accès non actif =",
      profile.access_status
    );

    return (
      <Navigate
        to="/access-pending"
        replace
      />
    );
  }

  // ==========================================
  // ÉLÈVE AUTORISÉ
  // ==========================================

  console.log(
    "✅ [PROTECTED STUDENT] Accès élève autorisé"
  );

  return children;
}
