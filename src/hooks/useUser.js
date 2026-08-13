import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export const useUser = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("🟢 [USE USER] useEffect démarré");

    let mounted = true;

    // ==========================================
    // SESSION INITIALE
    // ==========================================

    supabase.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        console.log("🔐 [USE USER] getSession terminé");
        console.log("👤 [USE USER] session =", session);
        console.log("❌ [USE USER] getSession error =", error);

        if (!mounted) {
          return;
        }

        setUser(session?.user ?? null);
        setLoading(false);

        console.log(
          "✅ [USE USER] état initial appliqué"
        );
      })
      .catch((error) => {
        console.error(
          "💥 [USE USER] getSession exception =",
          error
        );

        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      });

    // ==========================================
    // ÉCOUTE AUTH
    // ==========================================

    const {
      data: { subscription }
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

        setUser(session?.user ?? null);
        setLoading(false);

        console.log(
          "✅ [USE USER] user mis à jour"
        );
      }
    );

    console.log(
      "👂 [USE USER] listener auth installé"
    );

    return () => {
      console.log(
        "🧹 [USE USER] nettoyage listener"
      );

      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  console.log("📊 [USE USER] state =", {
    loading,
    user
  });

  return {
    user,
    loading
  };
};
