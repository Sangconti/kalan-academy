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


        try {

          /*
           * ------------------------------------------------
           * TEST RÉEL SUPABASE
           * ------------------------------------------------
           *
           * On utilise la table "profiles" qui existe
           * réellement dans Kalan Academy.
           *
           * Le contenu retourné n'est pas important.
           *
           * Même si RLS empêche la lecture, le fait que
           * Supabase réponde signifie que le serveur est
           * joignable.
           */
          const result =
            await Promise.race([

              supabase
                .from("profiles")
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
           * que la requête a atteint le serveur.
           *
           * Une erreur RLS / autorisation n'est donc
           * pas considérée comme une perte d'Internet.
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