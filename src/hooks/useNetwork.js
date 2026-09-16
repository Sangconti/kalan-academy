import {
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";

import {
  supabase,
} from "../lib/supabase";


// =====================================================
// CONFIGURATION
// =====================================================

const CHECK_INTERVAL = 5000;
const CHECK_TIMEOUT = 5000;


// =====================================================
// HOOK NETWORK
// =====================================================

export function useNetwork() {

  const [isOnline, setIsOnline] =
    useState(false);


  const checkingRef =
    useRef(false);


  // ===================================================
  // VÉRIFICATION RÉELLE DE LA CONNEXION SUPABASE
  // ===================================================

  const checkInternetConnection =
    useCallback(
      async () => {

        /*
         * Évite plusieurs vérifications simultanées.
         */
        if (checkingRef.current) {
          return isOnline;
        }


        checkingRef.current = true;


        /*
         * Si Android/WebView indique explicitement
         * qu'il n'y a pas de réseau, on considère
         * immédiatement l'application hors ligne.
         *
         * IMPORTANT :
         * navigator.onLine === true ne suffit PAS
         * pour déclarer l'application en ligne.
         */
        if (
          typeof navigator !== "undefined" &&
          navigator.onLine === false
        ) {

          setIsOnline(false);

          checkingRef.current = false;

          return false;
        }


        const controller =
          new AbortController();


        const timeout =
          setTimeout(
            () => {
              controller.abort();
            },
            CHECK_TIMEOUT
          );


        try {

          /*
           * ------------------------------------------------
           * TEST RÉEL SUPABASE
           * ------------------------------------------------
           *
           * On utilise le client Supabase déjà configuré
           * par Kalan Academy.
           *
           * Une petite requête vers "settings" permet de
           * vérifier que le serveur Supabase répond.
           *
           * Même si RLS empêche la lecture, une réponse
           * Supabase signifie que le réseau fonctionne.
           */

          const result =
            await Promise.race([

              supabase
                .from("settings")
                .select("id")
                .limit(1),

              new Promise((_, reject) => {

                setTimeout(
                  () => {

                    const error =
                      new Error(
                        "Timeout de vérification réseau"
                      );

                    error.name =
                      "NetworkTimeoutError";

                    reject(error);

                  },
                  CHECK_TIMEOUT
                );

              }),

            ]);


          /*
           * Supabase nous a répondu.
           *
           * Même si result.error existe, cela signifie
           * généralement que la requête a atteint le
           * serveur. Une erreur d'autorisation ou de RLS
           * n'est donc pas une perte d'Internet.
           */
          if (result) {

            setIsOnline(true);

            return true;
          }


          /*
           * Sécurité supplémentaire.
           */
          setIsOnline(false);

          return false;

        } catch (error) {

          /*
           * Timeout ou véritable erreur réseau.
           */
          console.warn(
            "🌐 Vérification Supabase échouée :",
            error?.message || error
          );


          setIsOnline(false);

          return false;

        } finally {

          clearTimeout(timeout);

          checkingRef.current = false;
        }
      },
      [isOnline]
    );


  // ===================================================
  // INITIALISATION + SURVEILLANCE
  // ===================================================

  useEffect(() => {

    let mounted = true;


    // =================================================
    // VÉRIFICATION INITIALE
    // =================================================

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


    // =================================================
    // ÉVÉNEMENT : CONNEXION
    // =================================================

    const handleOnline =
      () => {

        console.log(
          "🌐 Réseau détecté : vérification Supabase..."
        );


        checkInternetConnection();
      };


    // =================================================
    // ÉVÉNEMENT : DÉCONNEXION
    // =================================================

    const handleOffline =
      () => {

        console.log(
          "📴 Réseau perdu."
        );


        setIsOnline(false);
      };


    window.addEventListener(
      "online",
      handleOnline
    );


    window.addEventListener(
      "offline",
      handleOffline
    );


    // =================================================
    // VÉRIFICATION PÉRIODIQUE
    // =================================================

    const interval =
      setInterval(
        () => {

          checkInternetConnection();

        },
        CHECK_INTERVAL
      );


    // =================================================
    // NETTOYAGE
    // =================================================

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
    checkInternetConnection,
  ]);


  // ===================================================
  // API DU HOOK
  // ===================================================

  return {
    isOnline,
    checkInternetConnection,
  };

}