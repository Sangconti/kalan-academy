import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

// =====================================================
// HOOK UTILISATEUR
// =====================================================

export function useUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // =================================================
    // CHARGEMENT INITIAL DE LA SESSION
    // =================================================

    async function loadSession() {
      console.log("🔄 [USE USER] Chargement de la session...");

      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        console.log(
          "🔐 [USE USER] Session initiale =",
          session
        );

        console.log(
          "❌ [USE USER] Session error =",
          error
        );

        if (!mounted) {
          return;
        }

        if (error) {
          console.error(
            "❌ [USE USER] Erreur récupération session =",
            error
          );

          setUser(null);
          setLoading(false);

          return;
        }

        if (session?.user) {
          console.log(
            "👤 [USE USER] Utilisateur session =",
            session.user.id
          );

          setUser(session.user);
        } else {
          console.log(
            "🚫 [USE USER] Aucune session utilisateur"
          );

          setUser(null);
        }

        setLoading(false);

      } catch (error) {
        console.error(
          "💥 [USE USER] Exception chargement session =",
          error
        );

        if (!mounted) {
          return;
        }

        setUser(null);
        setLoading(false);
      }
    }

    // =================================================
    // ÉCOUTE DES CHANGEMENTS D'AUTHENTIFICATION
    // =================================================

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, session) => {

        console.log(
          "🔄 [USE USER] auth event =",
          event
        );

        console.log(
          "👤 [USE USER] auth session =",
          session
        );

        if (!mounted) {
          return;
        }

        // =============================================
        // SESSION ACTIVE
        // =============================================

        if (
          event === "INITIAL_SESSION" ||
          event === "SIGNED_IN" ||
          event === "TOKEN_REFRESHED" ||
          event === "USER_UPDATED"
        ) {

          if (session?.user) {

            console.log(
              "👤 [USE USER] user mis à jour =",
              session.user.id
            );

            setUser(session.user);

          } else {

            console.log(
              "🚫 [USE USER] Aucun utilisateur dans la session"
            );

            setUser(null);
          }

          setLoading(false);

          return;
        }

        // =============================================
        // DÉCONNEXION
        // =============================================

        if (event === "SIGNED_OUT") {

          console.log(
            "🚪 [USE USER] SIGNED_OUT → user = null"
          );

          setUser(null);
          setLoading(false);

          return;
        }

        // =============================================
        // SÉCURITÉ
        // =============================================

        if (!session?.user) {

          console.log(
            "🚫 [USE USER] Pas de session → user = null"
          );

          setUser(null);

        } else {

          console.log(
            "👤 [USE USER] Session active → user =",
            session.user.id
          );

          setUser(session.user);
        }

        setLoading(false);
      }
    );

    // =================================================
    // LANCER LE CHARGEMENT INITIAL
    // =================================================

    loadSession();

    // =================================================
    // NETTOYAGE
    // =================================================

    return () => {

      mounted = false;

      console.log(
        "🧹 [USE USER] Nettoyage auth listener"
      );

      subscription.unsubscribe();
    };

  }, []);

  // ===================================================
  // LOG ÉTAT
  // ===================================================

  console.log(
    "📊 [USE USER] state =",
    {
      loading,
      user,
    }
  );

  // ===================================================
  // RETOUR
  // ===================================================

  return {
    user,
    loading,
  };
}

export default useUser;