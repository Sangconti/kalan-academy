import { supabase } from "../lib/supabase";

const ADMIN_PROFILE_CACHE_KEY = "kalan_admin_profile_cache";

// ============================================================
// CACHE MÉMOIRE ADMIN
// ============================================================

// Le profil admin reste disponible en mémoire pendant cette durée.
// Cela évite de refaire les mêmes requêtes à chaque changement
// de page dans l'interface administrateur.
const ADMIN_MEMORY_CACHE_TTL = 5 * 60 * 1000;

let adminMemoryCache = null;
let adminMemoryCacheTimestamp = 0;

// Promise partagée pendant un chargement en cours.
// Très important avec React StrictMode et plusieurs composants
// qui appellent useAdmin() en même temps.
let adminLoadingPromise = null;


// ============================================================
// CACHE LOCALSTORAGE
// ============================================================

function getCachedAdminProfile(userId) {
  if (!userId) {
    return null;
  }

  try {
    const raw = localStorage.getItem(
      `${ADMIN_PROFILE_CACHE_KEY}_${userId}`
    );

    if (!raw) {
      return null;
    }

    const profile = JSON.parse(raw);

    if (!profile?.id) {
      return null;
    }

    if (!["admin", "super_admin"].includes(profile.role)) {
      return null;
    }

    return profile;
  } catch (error) {
    console.warn(
      "⚠️ Impossible de lire le profil admin en cache :",
      error
    );

    return null;
  }
}


function cacheAdminProfile(profile) {
  if (!profile?.id) {
    return;
  }

  try {
    localStorage.setItem(
      `${ADMIN_PROFILE_CACHE_KEY}_${profile.id}`,
      JSON.stringify(profile)
    );
  } catch (error) {
    console.warn(
      "⚠️ Impossible de mettre en cache le profil admin :",
      error
    );
  }
}


// ============================================================
// OUTILS CACHE MÉMOIRE
// ============================================================

function getMemoryCachedAdmin() {
  if (!adminMemoryCache) {
    return null;
  }

  const age =
    Date.now() - adminMemoryCacheTimestamp;

  if (age > ADMIN_MEMORY_CACHE_TTL) {
    adminMemoryCache = null;
    adminMemoryCacheTimestamp = 0;
    return null;
  }

  return adminMemoryCache;
}


function setMemoryCachedAdmin(admin) {
  adminMemoryCache = admin;
  adminMemoryCacheTimestamp = Date.now();
}


export function clearAdminAuthCache() {
  adminMemoryCache = null;
  adminMemoryCacheTimestamp = 0;
  adminLoadingPromise = null;
}


// ============================================================
// DÉTECTION ERREUR RÉSEAU
// ============================================================

function isNetworkError(error) {
  if (!error) {
    return false;
  }

  const message = String(
    error?.message || error
  ).toLowerCase();

  return (
    message.includes("failed to fetch") ||
    message.includes("networkerror") ||
    message.includes("network error") ||
    message.includes("fetch failed") ||
    message.includes("err_network") ||
    message.includes("offline") ||
    message.includes("timeout")
  );
}


// ============================================================
// CHARGEMENT RÉEL DE L'ADMIN
// ============================================================

async function fetchCurrentAdmin() {
  console.log("👤 [ADMIN AUTH] chargement réel");

  // ----------------------------------------------------------
  // 1. SESSION LOCALE
  // ----------------------------------------------------------

  const {
    data: sessionData,
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    console.error(
      "❌ [ADMIN AUTH] erreur getSession :",
      sessionError
    );

    return null;
  }

  const session =
    sessionData?.session;

  const sessionUser =
    session?.user;

  if (!sessionUser?.id) {
    console.log(
      "👤 [ADMIN AUTH] aucune session"
    );

    return null;
  }

  let user = sessionUser;
  let offlineFallback = false;

  // ----------------------------------------------------------
  // 2. VÉRIFICATION UTILISATEUR
  // ----------------------------------------------------------

  try {
    const {
      data: userData,
      error: userError,
    } = await supabase.auth.getUser();

    if (userData?.user) {
      user = userData.user;
    }

    if (userError) {
      if (isNetworkError(userError)) {
        console.warn(
          "🌐 [ADMIN AUTH] réseau indisponible, utilisation du cache"
        );

        offlineFallback = true;
        user = sessionUser;
      } else {
        console.error(
          "❌ [ADMIN AUTH] erreur getUser :",
          userError
        );

        return null;
      }
    }
  } catch (error) {
    if (isNetworkError(error)) {
      console.warn(
        "🌐 [ADMIN AUTH] erreur réseau, utilisation du cache"
      );

      offlineFallback = true;
      user = sessionUser;
    } else {
      console.error(
        "❌ [ADMIN AUTH] exception getUser :",
        error
      );

      return null;
    }
  }

  if (!user?.id) {
    return null;
  }

  // ----------------------------------------------------------
  // 3. MODE HORS LIGNE
  // ----------------------------------------------------------

  if (offlineFallback) {
    const cachedProfile =
      getCachedAdminProfile(user.id);

    if (!cachedProfile) {
      console.warn(
        "⚠️ [ADMIN AUTH] aucun profil admin en cache"
      );

      return null;
    }

    const result = {
      user,
      profile: cachedProfile,
    };

    setMemoryCachedAdmin(result);

    return result;
  }

  // ----------------------------------------------------------
  // 4. PROFIL ADMIN
  // ----------------------------------------------------------

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select(
      "id, full_name, role"
    )
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error(
      "❌ [ADMIN AUTH] erreur profil :",
      profileError
    );

    return null;
  }

  if (!profile) {
    console.warn(
      "⚠️ [ADMIN AUTH] profil introuvable"
    );

    return null;
  }

  if (
    !["admin", "super_admin"].includes(
      profile.role
    )
  ) {
    console.warn(
      "🚫 [ADMIN AUTH] utilisateur non administrateur"
    );

    return null;
  }

  // ----------------------------------------------------------
  // 5. CACHE
  // ----------------------------------------------------------

  cacheAdminProfile(profile);

  const result = {
    user,
    profile,
  };

  setMemoryCachedAdmin(result);

  console.log(
    "✅ [ADMIN AUTH] administrateur chargé"
  );

  return result;
}


// ============================================================
// API PUBLIQUE
// ============================================================

export async function getCurrentAdmin() {
  // ----------------------------------------------------------
  // CACHE MÉMOIRE
  // ----------------------------------------------------------

  const cachedAdmin =
    getMemoryCachedAdmin();

  if (cachedAdmin) {
    console.log(
      "⚡ [ADMIN AUTH] utilisation du cache mémoire"
    );

    return cachedAdmin;
  }

  // ----------------------------------------------------------
  // CHARGEMENT DÉJÀ EN COURS
  // ----------------------------------------------------------

  if (adminLoadingPromise) {
    console.log(
      "⏳ [ADMIN AUTH] chargement déjà en cours → promise partagée"
    );

    return adminLoadingPromise;
  }

  // ----------------------------------------------------------
  // NOUVEAU CHARGEMENT
  // ----------------------------------------------------------

  adminLoadingPromise =
    fetchCurrentAdmin()
      .catch((error) => {
        console.error(
          "❌ [ADMIN AUTH] erreur globale :",
          error
        );

        return null;
      })
      .finally(() => {
        adminLoadingPromise = null;
      });

  return adminLoadingPromise;
}