import {
  useEffect,
  useState,
} from "react";

import {
  getCurrentAdmin,
  clearAdminAuthCache,
} from "../services/adminAuthService";


// ============================================================
// CACHE GLOBAL DU HOOK
// ============================================================

let sharedAdmin = null;
let sharedLoading = true;

const subscribers = new Set();

let initializationPromise = null;


// ============================================================
// NOTIFICATION
// ============================================================

function notifySubscribers() {
  subscribers.forEach(
    (setState) => {
      setState({
        admin: sharedAdmin,
        loading: sharedLoading,
      });
    }
  );
}


// ============================================================
// CHARGEMENT PARTAGÉ
// ============================================================

async function loadSharedAdmin() {
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise =
    getCurrentAdmin()
      .then((data) => {
        sharedAdmin = data;
        sharedLoading = false;

        notifySubscribers();

        return data;
      })
      .catch((error) => {
        console.error(
          "❌ [USE ADMIN] erreur :",
          error
        );

        sharedAdmin = null;
        sharedLoading = false;

        notifySubscribers();

        return null;
      })
      .finally(() => {
        initializationPromise = null;
      });

  return initializationPromise;
}


// ============================================================
// HOOK
// ============================================================

export default function useAdmin() {
  const [
    state,
    setState,
  ] = useState({
    admin: sharedAdmin,
    loading: sharedLoading,
  });

  useEffect(() => {
    subscribers.add(setState);

    // --------------------------------------------------------
    // Si l'état partagé n'est pas encore chargé
    // --------------------------------------------------------

    if (
      sharedLoading &&
      !initializationPromise
    ) {
      loadSharedAdmin();
    }

    return () => {
      subscribers.delete(setState);
    };
  }, []);

  const isAdmin =
    !!state.admin;

  return {
    loading: state.loading,
    admin: state.admin,
    isAdmin,
  };
}


// ============================================================
// INVALIDATION ADMIN
// ============================================================

export function resetAdminState() {
  sharedAdmin = null;
  sharedLoading = true;
  initializationPromise = null;

  clearAdminAuthCache();

  notifySubscribers();
}