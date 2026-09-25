import { supabase } from "../lib/supabase";

const ADMIN_PROFILE_CACHE_KEY =
  "kalan_admin_profile_cache";

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

    if (!profile?.id || profile.id !== userId) {
      return null;
    }

    if (
      !["admin", "super_admin"].includes(
        profile.role
      )
    ) {
      return null;
    }

    return profile;
  } catch (error) {
    console.warn(
      "⚠️ [ADMIN AUTH] Impossible de lire le profil admin local =",
      error
    );

    return null;
  }
}

function cacheAdminProfile(profile) {
  if (!profile?.id) {
    return;
  }

  if (
    !["admin", "super_admin"].includes(
      profile.role
    )
  ) {
    return;
  }

  try {
    localStorage.setItem(
      `${ADMIN_PROFILE_CACHE_KEY}_${profile.id}`,
      JSON.stringify(profile)
    );

    console.log(
      "💾 [ADMIN AUTH] Profil admin mis en cache local"
    );
  } catch (error) {
    console.warn(
      "⚠️ [ADMIN AUTH] Impossible de mettre le profil admin en cache =",
      error
    );
  }
}

export async function getCurrentAdmin() {
  console.log(
    "🔐 [ADMIN AUTH] getCurrentAdmin()"
  );

  // =====================================================
  // 1. RÉCUPÉRER LA SESSION LOCALE
  // =====================================================

  const {
    data: sessionData,
    error: sessionError,
  } = await supabase.auth.getSession();

  const session = sessionData?.session;
  const sessionUser = session?.user;

  console.log(
    "🔐 [ADMIN AUTH] Session locale =",
    session
  );

  console.log(
    "❌ [ADMIN AUTH] Session error =",
    sessionError
  );

  if (sessionError || !sessionUser) {
    console.log(
      "🚫 [ADMIN AUTH] Aucune session utilisateur"
    );

    return null;
  }

  let user = sessionUser;
  let offlineFallback = false;

  // =====================================================
  // 2. VÉRIFICATION SERVEUR DE L'UTILISATEUR
  // =====================================================

  try {
    const {
      data: userData,
      error: userError,
    } = await supabase.auth.getUser();

    console.log(
      "👤 [ADMIN AUTH] user =",
      userData?.user
    );

    console.log(
      "❌ [ADMIN AUTH] userError =",
      userError
    );

    if (userData?.user) {
      user = userData.user;
    }

    // ---------------------------------------------------
    // Erreur d'authentification réseau :
    // on conserve la session locale.
    // ---------------------------------------------------

    if (userError) {
      const errorName =
        userError?.name || "";

      const errorMessage =
        userError?.message || "";

      const isNetworkError =
        errorName ===
          "AuthRetryableFetchError" ||
        errorMessage
          .toLowerCase()
          .includes("failed to fetch") ||
        errorMessage
          .toLowerCase()
          .includes(
            "network request failed"
          ) ||
        errorMessage
          .toLowerCase()
          .includes(
            "networkerror"
          );

      if (isNetworkError) {
        console.warn(
          "📴 [ADMIN AUTH] Vérification serveur impossible → utilisation de la session locale"
        );

        offlineFallback = true;
        user = sessionUser;
      } else {
        console.error(
          "❌ [ADMIN AUTH] Erreur authentification non réseau"
        );

        return null;
      }
    }

  } catch (error) {
    console.error(
      "💥 [ADMIN AUTH] Exception getUser() =",
      error
    );

    const errorName =
      error?.name || "";

    const errorMessage =
      error?.message || "";

    const isNetworkError =
      errorName ===
        "AuthRetryableFetchError" ||
      errorMessage
        .toLowerCase()
        .includes("failed to fetch") ||
      errorMessage
        .toLowerCase()
        .includes(
          "network request failed"
        ) ||
      errorMessage
        .toLowerCase()
        .includes(
          "networkerror"
        );

    if (isNetworkError) {
      console.warn(
        "📴 [ADMIN AUTH] Réseau indisponible → session locale conservée"
      );

      offlineFallback = true;
      user = sessionUser;
    } else {
      return null;
    }
  }

  if (!user?.id) {
    console.log(
      "🚫 [ADMIN AUTH] Aucun utilisateur valide"
    );

    return null;
  }

  // =====================================================
  // 3. MODE HORS LIGNE
  // =====================================================

  if (offlineFallback) {
    const cachedProfile =
      getCachedAdminProfile(user.id);

    console.log(
      "💾 [ADMIN AUTH] Profil admin local =",
      cachedProfile
    );

    if (!cachedProfile) {
      console.warn(
        "⚠️ [ADMIN AUTH] Aucun profil admin local disponible hors ligne"
      );

      return null;
    }

    console.log(
      "✅ [ADMIN AUTH] ADMIN VALIDÉ HORS LIGNE"
    );

    return {
      user,
      profile: cachedProfile,
    };
  }

  // =====================================================
  // 4. RÉCUPÉRER LE PROFIL EN LIGNE
  // =====================================================

  const {
    data: profile,
    error,
  } = await supabase
    .from("profiles")
    .select(
      "id, full_name, role"
    )
    .eq("id", user.id)
    .single();

  console.log(
    "📋 [ADMIN AUTH] profile =",
    profile
  );

  console.log(
    "❌ [ADMIN AUTH] profile error =",
    error
  );

  if (error || !profile) {
    console.log(
      "🚫 [ADMIN AUTH] Profil introuvable"
    );

    return null;
  }

  // =====================================================
  // 5. VÉRIFICATION DU RÔLE
  // =====================================================

  console.log(
    "🎭 [ADMIN AUTH] role =",
    profile.role
  );

  if (
    !["admin", "super_admin"].includes(
      profile.role
    )
  ) {
    console.log(
      "🚫 [ADMIN AUTH] Rôle refusé :",
      profile.role
    );

    return null;
  }

  // =====================================================
  // 6. CACHE LOCAL DU PROFIL ADMIN
  // =====================================================

  cacheAdminProfile(profile);

  console.log(
    "✅ [ADMIN AUTH] ADMIN VALIDÉ"
  );

  return {
    user,
    profile,
  };
}