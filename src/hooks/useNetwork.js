import {
  useState,
  useEffect,
  useCallback
} from "react";


const CHECK_INTERVAL = 15000;
const CHECK_TIMEOUT = 5000;


// =====================================================
// HOOK NETWORK
// =====================================================

export function useNetwork() {

  const [isOnline, setIsOnline] =
    useState(
      typeof navigator !== "undefined"
        ? navigator.onLine
        : true
    );


  // ===================================================
  // VÉRIFICATION INTERNET RÉEL
  // ===================================================

  const checkInternetConnection =
    useCallback(
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

          const status =
            typeof navigator !== "undefined"
              ? navigator.onLine
              : true;

          setIsOnline(status);

          return status;
        }


        const controller =
          new AbortController();


        const timeout =
          setTimeout(
            () => controller.abort(),
            CHECK_TIMEOUT
          );


        try {

          const response =
            await fetch(
              `${supabaseUrl}/rest/v1/`,
              {
                method: "HEAD",
                cache: "no-store",
                signal: controller.signal
              }
            );


          /*
           * Une réponse HTTP signifie que le réseau
           * est accessible.
           *
           * 200, 401, 403, 404, etc. :
           * Internet fonctionne.
           */

          if (
            response ||
            response === null
          ) {

            setIsOnline(true);

            return true;
          }


          setIsOnline(true);

          return true;

        } catch (error) {

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


  // ===================================================
  // EVENTS
  // ===================================================

  useEffect(() => {

    let mounted = true;


    const initialCheck =
      async () => {

        const result =
          await checkInternetConnection();

        if (!mounted) {
          return;
        }

        setIsOnline(result);
      };


    initialCheck();


    function handleOnline() {

      checkInternetConnection();
    }


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


    const interval =
      setInterval(
        () => {
          checkInternetConnection();
        },
        CHECK_INTERVAL
      );


    return () => {

      mounted = false;


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

  }, [
    checkInternetConnection
  ]);


  return {
    isOnline,
    checkInternetConnection
  };
}