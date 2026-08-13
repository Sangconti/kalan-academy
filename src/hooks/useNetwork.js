import { useState, useEffect, useCallback } from "react";

const CHECK_INTERVAL = 15000;
const CHECK_TIMEOUT = 5000;

export function useNetwork() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined"
      ? navigator.onLine
      : true
  );

  const checkInternetConnection = useCallback(
    async () => {
      if (
        typeof navigator !== "undefined" &&
        !navigator.onLine
      ) {
        setIsOnline(false);
        return false;
      }

      const supabaseUrl =
        import.meta.env.VITE_SUPABASE_URL;

      if (!supabaseUrl) {
        setIsOnline(
          typeof navigator !== "undefined"
            ? navigator.onLine
            : true
        );

        return (
          typeof navigator !== "undefined"
            ? navigator.onLine
            : true
        );
      }

      const controller = new AbortController();

      const timeout = setTimeout(() => {
        controller.abort();
      }, CHECK_TIMEOUT);

      try {
        /*
         * On vérifie réellement l'accès au serveur Supabase.
         *
         * Même si Supabase retourne une réponse HTTP comme
         * 401 ou 404, cela signifie que l'Internet est accessible.
         *
         * Ce qui nous intéresse ici est l'existence ou non
         * d'une connexion réseau.
         */
        await fetch(
          `${supabaseUrl}/rest/v1/`,
          {
            method: "HEAD",
            cache: "no-store",
            signal: controller.signal
          }
        );

        setIsOnline(true);

        return true;
      } catch (error) {
        /*
         * AbortError = délai dépassé.
         * Dans les deux cas, on considère la connexion
         * Internet comme indisponible.
         */
        console.warn(
          "🌐 Vérification réseau échouée :",
          error?.message || error
        );

        setIsOnline(false);

        return false;
      } finally {
        clearTimeout(timeout);
      }
    },
    []
  );

  useEffect(() => {
    // Vérification immédiate
    checkInternetConnection();

    // ================================================
    // ÉVÉNEMENT ONLINE
    // ================================================

    function handleOnline() {
      /*
       * navigator.onLine vient de repasser à true.
       * On vérifie quand même l'accès Internet réel.
       */
      checkInternetConnection();
    }

    // ================================================
    // ÉVÉNEMENT OFFLINE
    // ================================================

    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener(
      "online",
      handleOnline
    );

    window.addEventListener(
      "offline",
      handleOffline
    );

    // ================================================
    // VÉRIFICATION PÉRIODIQUE
    // ================================================

    const interval = setInterval(() => {
      checkInternetConnection();
    }, CHECK_INTERVAL);

    return () => {
      window.removeEventListener(
        "online",
        handleOnline
      );

      window.removeEventListener(
        "offline",
        handleOffline
      );

      clearInterval(interval);
    };
  }, [checkInternetConnection]);

  return {
    isOnline,
    checkInternetConnection
  };
}