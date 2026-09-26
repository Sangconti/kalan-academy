import {
  useState,
  useEffect,
  useCallback,
} from "react";


// =====================================================
// HOOK NETWORK
// =====================================================

export function useNetwork() {

  const [
    isOnline,
    setIsOnline
  ] = useState(
    typeof navigator !== "undefined"
      ? navigator.onLine
      : false
  );


  // ===================================================
  // VÉRIFICATION DU RÉSEAU DE L'APPAREIL
  // ===================================================

  const checkInternetConnection =
    useCallback(
      () => {

        const online =
          typeof navigator !== "undefined"
            ? navigator.onLine
            : false;


        setIsOnline(online);


        return online;

      },
      []
    );


  // ===================================================
  // SURVEILLANCE DU RÉSEAU
  // ===================================================

  useEffect(() => {

    // -------------------------------------------------
    // État initial
    // -------------------------------------------------

    checkInternetConnection();


    // -------------------------------------------------
    // CONNEXION
    // -------------------------------------------------

    const handleOnline =
      () => {

        console.log(
          "🌐 Réseau détecté"
        );


        setIsOnline(true);

      };


    // -------------------------------------------------
    // DÉCONNEXION
    // -------------------------------------------------

    const handleOffline =
      () => {

        console.log(
          "📴 Réseau perdu"
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


    // -------------------------------------------------
    // NETTOYAGE
    // -------------------------------------------------

    return () => {

      window.removeEventListener(
        "online",
        handleOnline
      );


      window.removeEventListener(
        "offline",
        handleOffline
      );

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