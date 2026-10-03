import {
  useEffect,
  useState,
} from "react";

import { supabase } from "../lib/supabase";

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
// LISTENER AUTHENTIFICATION GLOBAL
// ============================================================

// Un seul listener Supabase pour toute l'application.
// Plusieurs composants peuvent utiliser useAdmin(),
// mais ils ne doivent pas créer plusieurs listeners auth.
let authSubscription = null;
let authListenerUsers = 0;


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
// RÉINITIALISATION ADMIN
// ============================================================

function resetSharedAdmin() {
  sharedAdmin = null;
  sharedLoading = true;
  initializationPromise = null;

  clearAdminAuthCache();

  notifySubscribers();
}


// ============================================================
// RECHARGEMENT APRÈS CHANGEMENT DE SESSION
// ============================================================

function reloadAdminAfterAuthChange() {
  // On laisse le callback Supabase se terminer avant
  // d'appeler getSession() / getUser().
  setTimeout(() => {
    loadSharedAdmin();
  }, 0);
}


// ============================================================
// LISTENER AUTH GLOBAL
// ============================================================

function setupAuthListener() {
  if (authSubscription) {
    return;
  }

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(
    (event, session) => {
      console.log(
        "🔄 [USE ADMIN] auth event =",
        event
      );

      console.log(
        "👤 [USE ADMIN] auth user =",
        session?.user?.id || null
      );

      // ======================================================
      // DÉCONNEXION
      // ======================================================

      if (event === "SIGNED_OUT") {
        console.log(
          "🚪 [USE ADMIN] SIGNED_OUT → réinitialisation"
        );

        resetSharedAdmin();

        return;
      }

      // ======================================================
      // NOUVELLE CONNEXION
      // ======================================================

      if (event === "SIGNED_IN") {
        console.log(
          "🔐 [USE ADMIN] SIGNED_IN → nouveau contrôle admin"
        );

        resetSharedAdmin();

        if (session?.user?.id) {
          reloadAdminAfterAuthChange();
        } else {
          sharedLoading = false;
          notifySubscribers();
        }

        return;
      }

      // ======================================================
      // UTILISATEUR MODIFIÉ
      // ======================================================

      if (event === "USER_UPDATED") {
        console.log(
          "👤 [USE ADMIN] USER_UPDATED → nouveau contrôle admin"
        );

        resetSharedAdmin();

        if (session?.user?.id) {
          reloadAdminAfterAuthChange();
        } else {
          sharedLoading = false;
          notifySubscribers();
        }

        return;
      }

      // ======================================================
      // TOKEN REFRESH
      // ======================================================

      if (event === "TOKEN_REFRESHED") {
        if (!session?.user?.id) {
          resetSharedAdmin();
          return;
        }

        // Si un admin est déjà chargé pour le même utilisateur,
        // inutile de refaire une requête.
        if (
          sharedAdmin?.user?.id === session.user.id
        ) {
          return;
        }

        // Si aucun admin n'est chargé, on vérifie la session.
        if (!sharedAdmin) {
          console.log(
            "🔄 [USE ADMIN] TOKEN_REFRESHED → vérification admin"
          );

          reloadAdminAfterAuthChange();
        }

        return;
      }

      // ======================================================
      // INITIAL_SESSION
      // ======================================================

      // IMPORTANT :
      // INITIAL_SESSION n'est PAS traité comme un changement
      // de compte.
      //
      // Le chargement initial est déjà effectué par le hook
      // avec loadSharedAdmin().
      //
      // Cela évite la boucle :
      //
      // INITIAL_SESSION
      // → reset
      // → load
      // → INITIAL_SESSION
      // → reset
      // → ...
      if (event === "INITIAL_SESSION") {
        console.log(
          "ℹ️ [USE ADMIN] INITIAL_SESSION → état initial déjà chargé"
        );

        return;
      }
    }
  );

  authSubscription = subscription;
}


// ============================================================
// NETTOYAGE DU LISTENER AUTH GLOBAL
// ============================================================

function cleanupAuthListener() {
  if (
    authListenerUsers === 0 &&
    authSubscription
  ) {
    console.log(
      "🧹 [USE ADMIN] suppression du listener auth global"
    );

    authSubscription.unsubscribe();
    authSubscription = null;
  }
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

    authListenerUsers += 1;

    // --------------------------------------------------------
    // UN SEUL LISTENER AUTH POUR TOUS LES useAdmin()
    // --------------------------------------------------------

    setupAuthListener();

    // --------------------------------------------------------
    // CHARGEMENT INITIAL
    // --------------------------------------------------------

    if (
      sharedLoading &&
      !initializationPromise
    ) {
      loadSharedAdmin();
    }

    // --------------------------------------------------------
    // NETTOYAGE
    // --------------------------------------------------------

    return () => {
      subscribers.delete(setState);

      authListenerUsers = Math.max(
        0,
        authListenerUsers - 1
      );

      cleanupAuthListener();
    };
  }, []);

  const isAdmin =
    !!state.admin;

  console.log(
    "🛡️ [USE ADMIN] état =",
    {
      loading: state.loading,
      isAdmin,
      userId:
        state.admin?.user?.id || null,
      role:
        state.admin?.profile?.role || null,
    }
  );

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
  resetSharedAdmin();
}