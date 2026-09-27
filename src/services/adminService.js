import { supabase } from "../lib/supabase";

// ==========================
// CACHES ADMIN — HORS LIGNE
// ==========================

const ADMIN_ACTIVITY_LOGS_CACHE_KEY =
  "kalan_admin_activity_logs_cache";

const ADMIN_USERS_CACHE_KEY =
  "kalan_admin_users_cache";


// ==========================
// CACHE — JOURNAL ADMIN
// ==========================

function getCachedAdminActivityLogs() {
  try {
    const raw =
      localStorage.getItem(
        ADMIN_ACTIVITY_LOGS_CACHE_KEY
      );

    if (!raw) {
      return null;
    }

    const logs =
      JSON.parse(raw);

    if (!Array.isArray(logs)) {
      return null;
    }

    return logs;

  } catch (error) {
    console.warn(
      "⚠️ [ADMIN ACTIVITY] Impossible de lire le cache local :",
      error
    );

    return null;
  }
}


function cacheAdminActivityLogs(logs) {
  if (!Array.isArray(logs)) {
    return;
  }

  try {
    localStorage.setItem(
      ADMIN_ACTIVITY_LOGS_CACHE_KEY,
      JSON.stringify(logs)
    );

    console.log(
      "💾 [ADMIN ACTIVITY] Journal mis en cache local"
    );

  } catch (error) {
    console.warn(
      "⚠️ [ADMIN ACTIVITY] Impossible de sauvegarder le journal localement :",
      error
    );
  }
}


// ==========================
// CACHE — UTILISATEURS ADMIN
// ==========================

function getCachedAdminUsers() {
  try {
    const raw =
      localStorage.getItem(
        ADMIN_USERS_CACHE_KEY
      );

    if (!raw) {
      return null;
    }

    const users =
      JSON.parse(raw);

    if (!Array.isArray(users)) {
      return null;
    }

    return users;

  } catch (error) {
    console.warn(
      "⚠️ [ADMIN USERS] Impossible de lire le cache local :",
      error
    );

    return null;
  }
}


function cacheAdminUsers(users) {
  if (!Array.isArray(users)) {
    return;
  }

  try {
    localStorage.setItem(
      ADMIN_USERS_CACHE_KEY,
      JSON.stringify(users)
    );

    console.log(
      "💾 [ADMIN USERS] Utilisateurs mis en cache local"
    );

  } catch (error) {
    console.warn(
      "⚠️ [ADMIN USERS] Impossible de sauvegarder les utilisateurs localement :",
      error
    );
  }
}

// ==========================
// JOURNAL ADMIN — ENREGISTRER
// ==========================

export async function logAdminActivity({
  action,
  targetUserId = null,
  details = {}
}) {
  if (!action) {
    console.warn(
      "⚠️ [ADMIN ACTIVITY] Action manquante."
    );

    return false;
  }

  try {
    const {
      data,
      error
    } = await supabase.rpc(
      "log_admin_activity",
      {
        p_action: action,
        p_target_user_id: targetUserId || null,
        p_details: details || {}
      }
    );

    if (error) {
      console.error(
        "❌ [ADMIN ACTIVITY] Erreur enregistrement :",
        error
      );

      return false;
    }

    if (!data?.success) {
      console.warn(
        "⚠️ [ADMIN ACTIVITY] Enregistrement non confirmé :",
        data
      );

      return false;
    }

    console.log(
      "✅ [ADMIN ACTIVITY] Activité enregistrée :",
      action
    );

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent(
          "kalan-admin-activity-updated"
        )
      );
    }

    return true;

  } catch (error) {
    console.error(
      "💥 [ADMIN ACTIVITY] Exception enregistrement :",
      error
    );

    return false;
  }
}


// ==========================
// JOURNAL ADMIN — RÉCUPÉRER
// ==========================

export async function getAdminActivityLogs(
  limit = 10
) {
  const safeLimit =
    Math.min(
      Math.max(
        Number(limit) || 10,
        1
      ),
      50
    );


  // =====================================================
  // 1. HORS LIGNE → CACHE LOCAL
  // =====================================================

  if (
    typeof navigator !== "undefined" &&
    navigator.onLine === false
  ) {

    const cachedLogs =
      getCachedAdminActivityLogs();

    if (cachedLogs) {

      console.log(
        "📴 [ADMIN ACTIVITY] Hors ligne → utilisation du cache local"
      );

      return cachedLogs.slice(
        0,
        safeLimit
      );
    }

    console.warn(
      "⚠️ [ADMIN ACTIVITY] Hors ligne et aucun cache disponible."
    );

    throw new Error(
      "Journal administrateur indisponible hors ligne."
    );
  }


  // =====================================================
  // 2. EN LIGNE → SUPABASE
  // =====================================================

  try {

    const {
      data,
      error
    } = await supabase
      .from("admin_activity_logs")
      .select(`
        id,
        admin_id,
        action,
        target_user_id,
        details,
        created_at,
        admin:profiles!admin_id(
          id,
          full_name
        ),
        target_user:profiles!target_user_id(
          id,
          full_name
        )
      `)
      .order(
        "created_at",
        {
          ascending: false
        }
      )
      .limit(safeLimit);


    if (error) {

      console.error(
        "❌ [ADMIN ACTIVITY] Erreur récupération :",
        error
      );

      throw error;
    }


    const logs =
      data || [];


    // ===================================================
    // 3. CACHE DES DERNIERS JOURNAUX VALIDES
    // ===================================================

    cacheAdminActivityLogs(
      logs
    );


    return logs;

  } catch (error) {

    // ===================================================
    // 4. FALLBACK CACHE
    // ===================================================

    const cachedLogs =
      getCachedAdminActivityLogs();

    if (cachedLogs) {

      console.warn(
        "📴 [ADMIN ACTIVITY] Requête Supabase échouée → utilisation du cache local"
      );

      return cachedLogs.slice(
        0,
        safeLimit
      );
    }


    throw error;
  }
}


// ==========================
// DASHBOARD STATISTIQUES
// ==========================

const ADMIN_STATS_CACHE_KEY =
  "kalan_admin_stats_cache";


function getCachedAdminStats() {
  try {
    const raw =
      localStorage.getItem(
        ADMIN_STATS_CACHE_KEY
      );

    if (!raw) {
      return null;
    }

    const stats =
      JSON.parse(raw);

    if (
      !stats ||
      typeof stats !== "object"
    ) {
      return null;
    }

    return stats;

  } catch (error) {
    console.warn(
      "⚠️ [ADMIN STATS] Impossible de lire le cache local :",
      error
    );

    return null;
  }
}


function cacheAdminStats(stats) {
  if (!stats) {
    return;
  }

  try {
    localStorage.setItem(
      ADMIN_STATS_CACHE_KEY,
      JSON.stringify(stats)
    );

    console.log(
      "💾 [ADMIN STATS] Statistiques mises en cache local"
    );

  } catch (error) {
    console.warn(
      "⚠️ [ADMIN STATS] Impossible de sauvegarder les statistiques localement :",
      error
    );
  }
}


export async function getAdminStats() {

  // =====================================================
  // 1. HORS LIGNE → CACHE LOCAL
  // =====================================================

  if (
    typeof navigator !== "undefined" &&
    navigator.onLine === false
  ) {

    const cachedStats =
      getCachedAdminStats();

    if (cachedStats) {

      console.log(
        "📴 [ADMIN STATS] Hors ligne → utilisation du cache local"
      );

      return cachedStats;
    }

    console.warn(
      "⚠️ [ADMIN STATS] Hors ligne et aucun cache disponible."
    );

    throw new Error(
      "Statistiques administrateur indisponibles hors ligne."
    );
  }


  // =====================================================
  // 2. EN LIGNE → SUPABASE
  // =====================================================

  try {

    const [
      students,
      premium,
      classes,
      subjects,
      lessons,
      quizzes,
      xp
    ] = await Promise.all([

      supabase
        .from("profiles")
        .select("*", {
          count: "exact",
          head: true
        })
        .eq(
          "role",
          "student"
        ),

      supabase
        .from("profiles")
        .select("*", {
          count: "exact",
          head: true
        })
        .eq(
          "is_premium",
          true
        ),

      supabase
        .from("classes")
        .select("*", {
          count: "exact",
          head: true
        }),

      supabase
        .from("subjects")
        .select("*", {
          count: "exact",
          head: true
        }),

      supabase
        .from("lessons")
        .select("*", {
          count: "exact",
          head: true
        }),

      supabase
        .from("quizzes")
        .select("*", {
          count: "exact",
          head: true
        }),

      supabase
        .from("profiles")
        .select("xp")
    ]);


    const responses = [
      {
        name:
          "students",
        response:
          students
      },
      {
        name:
          "premium",
        response:
          premium
      },
      {
        name:
          "classes",
        response:
          classes
      },
      {
        name:
          "subjects",
        response:
          subjects
      },
      {
        name:
          "lessons",
        response:
          lessons
      },
      {
        name:
          "quizzes",
        response:
          quizzes
      },
      {
        name:
          "xp",
        response:
          xp
      }
    ];


    const failedRequest =
      responses.find(
        item =>
          item.response.error
      );


    if (failedRequest) {

      console.error(
        `Erreur statistiques ${failedRequest.name}:`,
        failedRequest.response.error
      );

      throw failedRequest.response.error;
    }


    const totalXP =
      xp.data?.reduce(
        (sum, user) => {

          return (
            sum +
            (
              Number(
                user.xp
              ) || 0
            )
          );

        },
        0
      ) || 0;


    const stats = {

      students:
        students.count || 0,

      premium:
        premium.count || 0,

      classes:
        classes.count || 0,

      subjects:
        subjects.count || 0,

      lessons:
        lessons.count || 0,

      quizzes:
        quizzes.count || 0,

      totalXP

    };


    // ===================================================
    // 3. CACHE DES DERNIÈRES STATISTIQUES VALIDES
    // ===================================================

    cacheAdminStats(
      stats
    );


    return stats;

  } catch (error) {

    // ===================================================
    // 4. FALLBACK CACHE
    // ===================================================

    const cachedStats =
      getCachedAdminStats();

    if (cachedStats) {

      console.warn(
        "📴 [ADMIN STATS] Requête Supabase échouée → utilisation du cache local"
      );

      return cachedStats;
    }


    throw error;
  }
}


// ==========================
// UTILISATEURS ADMIN
// ==========================

export async function getAdminUsers() {

  // =====================================================
  // 1. HORS LIGNE → CACHE LOCAL
  // =====================================================

  if (
    typeof navigator !== "undefined" &&
    navigator.onLine === false
  ) {

    const cachedUsers =
      getCachedAdminUsers();

    if (cachedUsers) {

      console.log(
        "📴 [ADMIN USERS] Hors ligne → utilisation du cache local"
      );

      return cachedUsers;
    }

    console.warn(
      "⚠️ [ADMIN USERS] Hors ligne et aucun cache disponible."
    );

    throw new Error(
      "Utilisateurs administrateur indisponibles hors ligne."
    );
  }


  // =====================================================
  // 2. EN LIGNE → SUPABASE
  // =====================================================

  try {

    const {
      data,
      error
    } = await supabase
      .from("profiles")
      .select(`
        id,
        full_name,
        avatar_url,
        role,
        access_status,
        class_id,
        is_premium,
        xp,
        level,
        orange_money_id,
        created_at
      `)
      .order(
        "created_at",
        {
          ascending: false
        }
      );


    if (error) {
      throw error;
    }


    const users =
      data || [];


    // ===================================================
    // 3. CACHE DES DERNIERS UTILISATEURS VALIDES
    // ===================================================

    cacheAdminUsers(
      users
    );


    return users;

  } catch (error) {

    // ===================================================
    // 4. FALLBACK CACHE
    // ===================================================

    const cachedUsers =
      getCachedAdminUsers();

    if (cachedUsers) {

      console.warn(
        "📴 [ADMIN USERS] Requête Supabase échouée → utilisation du cache local"
      );

      return cachedUsers;
    }


    throw error;
  }
}


// ==========================
// MODIFIER LE RÔLE
// ==========================

export async function updateUserRole(
  userId,
  role
) {
  const {
    error
  } = await supabase
    .from("profiles")
    .update({
      role
    })
    .eq(
      "id",
      userId
    );


  if (error) {
    throw error;
  }


  const activityLogged =
    await logAdminActivity({
      action:
        "user_role_updated",

      targetUserId:
        userId,

      details: {
        new_role:
          role
      }
    });

  if (!activityLogged) {
    console.warn(
      "⚠️ [ADMIN] Rôle modifié mais activité non enregistrée."
    );
  }


  return true;
}


// ==========================
// ACTIVER / DÉSACTIVER
// ==========================

export async function updateUserAccess(
  userId,
  accessStatus
) {
  const {
    error
  } = await supabase
    .from("profiles")
    .update({
      access_status: accessStatus
    })
    .eq(
      "id",
      userId
    );


  if (error) {
    throw error;
  }


  const activityLogged =
    await logAdminActivity({
      action:
        "user_access_updated",

      targetUserId:
        userId,

      details: {
        access_status:
          accessStatus
      }
    });

  if (!activityLogged) {
    console.warn(
      "⚠️ [ADMIN] Accès utilisateur modifié mais activité non enregistrée."
    );
  }


  return true;
}


// ==========================
// MODIFIER L'ACCÈS UTILISATEUR
// ==========================

export async function updateUserAccessStatus(
  userId,
  accessStatus
) {
  const {
    error
  } = await supabase
    .from("profiles")
    .update({
      access_status: accessStatus
    })
    .eq(
      "id",
      userId
    );


  if (error) {
    console.error(
      "Erreur modification access_status :",
      error
    );

    throw error;
  }


  const activityLogged =
    await logAdminActivity({
      action:
        "user_access_updated",

      targetUserId:
        userId,

      details: {
        access_status:
          accessStatus
      }
    });

  if (!activityLogged) {
    console.warn(
      "⚠️ [ADMIN] Access_status modifié mais activité non enregistrée."
    );
  }


  return true;
}


// ==========================
// MODIFIER PREMIUM
// ==========================

export async function updateUserPremium(
  userId,
  isPremium
) {
  if (!userId) {
    throw new Error(
      "Identifiant utilisateur manquant."
    );
  }


  const normalizedPremium =
    Boolean(isPremium);


  const {
    error
  } = await supabase
    .from("profiles")
    .update({
      is_premium:
        normalizedPremium
    })
    .eq(
      "id",
      userId
    );


  if (error) {
    console.error(
      "Erreur modification Premium :",
      error
    );

    throw error;
  }


  const activityLogged =
    await logAdminActivity({
      action:
        "user_premium_updated",

      targetUserId:
        userId,

      details: {
        is_premium:
          normalizedPremium
      }
    });

  if (!activityLogged) {
    console.warn(
      "⚠️ [ADMIN] Statut Premium modifié mais activité non enregistrée."
    );
  }


  return true;
}


// ==========================
// MODIFIER LA CLASSE
// ==========================

export async function updateUserClass(
  userId,
  classId
) {
  if (!userId) {
    throw new Error(
      "Identifiant utilisateur manquant."
    );
  }


  const normalizedClassId =
    classId || null;


  const {
    error
  } = await supabase
    .from("profiles")
    .update({
      class_id:
        normalizedClassId
    })
    .eq(
      "id",
      userId
    );


  if (error) {
    console.error(
      "Erreur modification classe :",
      error
    );

    throw error;
  }


  const activityLogged =
    await logAdminActivity({
      action:
        "user_class_updated",

      targetUserId:
        userId,

      details: {
        class_id:
          normalizedClassId
      }
    });

  if (!activityLogged) {
    console.warn(
      "⚠️ [ADMIN] Classe utilisateur modifiée mais activité non enregistrée."
    );
  }


  return true;
}


// ==========================
// MODIFIER ORANGE MONEY
// ==========================

export async function updateUserOrangeMoney(
  userId,
  orangeMoneyId
) {
  if (!userId) {
    throw new Error(
      "Identifiant utilisateur manquant."
    );
  }


  const normalizedOrangeMoneyId =
    orangeMoneyId?.trim() || null;


  const {
    error
  } = await supabase
    .from("profiles")
    .update({
      orange_money_id:
        normalizedOrangeMoneyId
    })
    .eq(
      "id",
      userId
    );


  if (error) {
    console.error(
      "Erreur modification Orange Money :",
      error
    );

    throw error;
  }


  const activityLogged =
    await logAdminActivity({
      action:
        "user_orange_money_updated",

      targetUserId:
        userId,

      details: {
        orange_money_id:
          normalizedOrangeMoneyId
      }
    });

  if (!activityLogged) {
    console.warn(
      "⚠️ [ADMIN] Orange Money modifié mais activité non enregistrée."
    );
  }


  return true;
}


// ==========================
// RÉINITIALISER LA PROGRESSION
// ==========================

export async function resetUserProgress(
  userId
) {
  if (!userId) {
    throw new Error(
      "Identifiant élève manquant."
    );
  }


  const {
    data,
    error
  } = await supabase.rpc(
    "reset_user_progress",
    {
      p_user_id: userId
    }
  );


  if (error) {
    console.error(
      "Erreur RPC reset_user_progress :",
      error
    );

    throw error;
  }


  if (!data?.success) {
    throw new Error(
      data?.message ||
      "La réinitialisation de la progression a échoué."
    );
  }


  const activityLogged =
    await logAdminActivity({
      action:
        "progress_reset",

      targetUserId:
        userId,

      details: {
        progress_reset_version:
          data?.progress_reset_version ?? null
      }
    });

  if (!activityLogged) {
    console.warn(
      "⚠️ [ADMIN] Progression réinitialisée mais activité non enregistrée."
    );
  }


  return data;
}


// ==========================
// EMAIL ADMIN DE L'ÉLÈVE
// ==========================

export async function getAdminStudentEmail(
  userId
) {
  if (!userId) {
    throw new Error(
      "Identifiant élève manquant."
    );
  }


  const {
    data,
    error
  } = await supabase.rpc(
    "get_admin_student_email",
    {
      p_user_id: userId
    }
  );


  if (error) {
    console.error(
      "Erreur RPC get_admin_student_email :",
      error
    );

    throw error;
  }


  if (!data?.success) {
    throw new Error(
      data?.message ||
      "Impossible de récupérer l'adresse email."
    );
  }


  return data.email || null;
}


// ==========================
// SUPPRIMER UN UTILISATEUR
// ==========================

export async function deleteAdminUser(
  userId
) {
  if (!userId) {
    throw new Error(
      "Identifiant utilisateur manquant."
    );
  }


  // ----------------------------------------
  // Récupérer les informations avant
  // suppression afin de conserver une trace
  // lisible dans le journal.
  // ----------------------------------------

  let targetUserName = null;


  try {
    const {
      data: targetUser,
      error: targetUserError
    } = await supabase
      .from("profiles")
      .select(`
        id,
        full_name,
        role
      `)
      .eq(
        "id",
        userId
      )
      .maybeSingle();


    if (targetUserError) {
      console.warn(
        "⚠️ [ADMIN] Impossible de récupérer le nom avant suppression :",
        targetUserError
      );
    } else {
      targetUserName =
        targetUser?.full_name || null;
    }

  } catch (error) {
    console.warn(
      "⚠️ [ADMIN] Exception récupération utilisateur avant suppression :",
      error
    );
  }


  const {
    data,
    error
  } = await supabase.functions.invoke(
    "delete-user",
    {
      body: {
        userId
      }
    }
  );


  if (error) {
    console.error(
      "❌ Erreur Edge Function :",
      error
    );

    console.error(
      "❌ Type erreur :",
      error?.constructor?.name
    );

    console.error(
      "❌ Message :",
      error?.message
    );


    if (error.context) {
      try {
        const details =
          await error.context.json();

        console.error(
          "🔥 RÉPONSE DELETE-USER :",
          details
        );

        throw new Error(
          details?.error ||
          details?.message ||
          "Erreur lors de la suppression."
        );

      } catch (readError) {

        if (
          readError instanceof Error &&
          readError.message
        ) {
          throw readError;
        }

        console.error(
          "Impossible de lire la réponse Edge Function :",
          readError
        );
      }
    }


    throw error;
  }


  if (!data?.success) {
    throw new Error(
      data?.error ||
      "La suppression n'a pas été confirmée."
    );
  }


  // ----------------------------------------
  // JOURNAL ADMIN
  // ----------------------------------------
  //
  // Le profil a maintenant été supprimé.
  // On ne peut donc pas utiliser userId dans
  // target_user_id, car cette colonne possède
  // une clé étrangère vers profiles.
  //
  // On conserve l'ancien identifiant et le nom
  // dans details.
  // ----------------------------------------

  const activityLogged =
    await logAdminActivity({
      action:
        "user_deleted",

      targetUserId:
        null,

      details: {
        user_id:
          userId,

        full_name:
          targetUserName
      }
    });

  if (!activityLogged) {
    console.warn(
      "⚠️ [ADMIN] Utilisateur supprimé mais activité non enregistrée."
    );
  }


  return true;
}


// ==========================
// CLASSES
// ==========================

export async function getAdminClasses() {
  const {
    data,
    error
  } = await supabase
    .from("classes")
    .select("*")
    .order(
      "order_number",
      {
        ascending: true
      }
    );


  if (error) {
    throw error;
  }


  return data || [];
}


// ==========================
// CRÉER UNE CLASSE
// ==========================

export async function createClass(
  classData
) {
  const {
    data,
    error
  } = await supabase
    .from("classes")
    .insert(classData)
    .select()
    .single();


  if (error) {
    throw error;
  }


  const activityLogged =
    await logAdminActivity({
      action:
        "class_created",

      details: {
        class_id:
          data?.id || null,

        name:
          data?.name ||
          classData?.name ||
          null,

        order_number:
          data?.order_number ??
          classData?.order_number ??
          null
      }
    });

  if (!activityLogged) {
    console.warn(
      "⚠️ [ADMIN] Classe créée mais activité non enregistrée."
    );
  }


  return data;
}


// ==========================
// MODIFIER UNE CLASSE
// ==========================

export async function updateClass(
  id,
  classData
) {
  const {
    error
  } = await supabase
    .from("classes")
    .update(classData)
    .eq(
      "id",
      id
    );


  if (error) {
    throw error;
  }


  const activityLogged =
    await logAdminActivity({
      action:
        "class_updated",

      details: {
        class_id:
          id,

        ...classData
      }
    });

  if (!activityLogged) {
    console.warn(
      "⚠️ [ADMIN] Classe modifiée mais activité non enregistrée."
    );
  }


  return true;
}


// ==========================
// SUPPRIMER UNE CLASSE
// ==========================

export async function deleteClass(
  id
) {
  if (!id) {
    throw new Error(
      "Identifiant classe manquant."
    );
  }


  // ----------------------------------------
  // Récupérer les informations avant
  // suppression pour conserver une trace
  // lisible dans le journal.
  // ----------------------------------------

  let className = null;


  try {
    const {
      data: classData,
      error: classError
    } = await supabase
      .from("classes")
      .select(`
        id,
        name,
        order_number
      `)
      .eq(
        "id",
        id
      )
      .maybeSingle();


    if (classError) {
      console.warn(
        "⚠️ [ADMIN] Impossible de récupérer la classe avant suppression :",
        classError
      );
    } else {
      className =
        classData?.name || null;
    }

  } catch (error) {
    console.warn(
      "⚠️ [ADMIN] Exception récupération classe avant suppression :",
      error
    );
  }


  const {
    error
  } = await supabase
    .from("classes")
    .delete()
    .eq(
      "id",
      id
    );


  if (error) {
    throw error;
  }


  const activityLogged =
    await logAdminActivity({
      action:
        "class_deleted",

      details: {
        class_id:
          id,

        name:
          className
      }
    });

  if (!activityLogged) {
    console.warn(
      "⚠️ [ADMIN] Classe supprimée mais activité non enregistrée."
    );
  }


  return true;
}

// ==========================
// VUE LÉGÈRE — CONSULTATION ÉLÈVE
// ==========================
//
// Cette fonction est dédiée au mode consultation.
// Elle ne remplace PAS getAdminStudentView().
//
// Objectif :
// - charger rapidement les données nécessaires au mode consultation
// - éviter user_devices
// - éviter l'email RPC
// - éviter de récupérer toutes les leçons de l'académie
// - conserver le même format attendu par DashboardPage
// ==========================

export async function getConsultationStudentView(
  studentId
) {
  if (!studentId) {
    throw new Error(
      "Identifiant élève manquant."
    );
  }


  // =====================================================
  // 1. PROFIL + PROGRESSION + QUIZ + BADGES
  // =====================================================

  const [
    profileResult,
    progressResult,
    attemptsResult,
    badgesResult
  ] = await Promise.all([

    // -----------------------------------------
    // PROFIL
    // -----------------------------------------

    supabase
      .from("profiles")
      .select(`
        id,
        full_name,
        avatar_url,
        role,
        access_status,
        class_id,
        is_premium,
        orange_money_id,
        xp,
        level,
        created_at,
        classes(
          id,
          name
        )
      `)
      .eq(
        "id",
        studentId
      )
      .single(),


    // -----------------------------------------
    // PROGRESSION
    // -----------------------------------------

    supabase
      .from("user_progress")
      .select(`
        lesson_id,
        completed
      `)
      .eq(
        "user_id",
        studentId
      ),


    // -----------------------------------------
    // QUIZ
    // -----------------------------------------

    supabase
      .from("quiz_attempts")
      .select(`
        score
      `)
      .eq(
        "user_id",
        studentId
      ),


    // -----------------------------------------
    // BADGES
    // -----------------------------------------

    supabase
      .from("user_badges")
      .select(`
        id,
        badge_id,
        earned_at,
        badges(
          id,
          name,
          description,
          image_url,
          xp_reward
        )
      `)
      .eq(
        "user_id",
        studentId
      )

  ]);


  // =====================================================
  // 2. VALIDATION DU PROFIL
  // =====================================================

  if (profileResult.error) {

    console.error(
      "❌ [CONSULTATION] Erreur profil :",
      profileResult.error
    );

    throw profileResult.error;
  }


  if (!profileResult.data) {
    throw new Error(
      "Élève introuvable."
    );
  }


  const profile =
    profileResult.data;


  console.log(
    "🔎 [CONSULTATION] PROFIL ÉLÈVE :",
    {
      id: profile.id,
      full_name: profile.full_name,
      class_id: profile.class_id,
      classes: profile.classes
    }
  );


  // =====================================================
  // 3. DONNÉES PROGRESSION
  // =====================================================

  if (progressResult.error) {

    console.error(
      "❌ [CONSULTATION] Erreur progression :",
      progressResult.error
    );

  }


  const progressData =
    progressResult.data || [];


  // =====================================================
  // 4. DONNÉES QUIZ
  // =====================================================

  if (attemptsResult.error) {

    console.error(
      "❌ [CONSULTATION] Erreur quiz :",
      attemptsResult.error
    );

  }


  const attemptsData =
    attemptsResult.data || [];


  // =====================================================
  // 5. DONNÉES BADGES
  // =====================================================

  if (badgesResult.error) {

    console.error(
      "❌ [CONSULTATION] Erreur badges :",
      badgesResult.error
    );

  }


  const badges =
    badgesResult.data || [];


  // =====================================================
  // 6. LEÇONS DE LA CLASSE DE L'ÉLÈVE
  // =====================================================
  //
  // On récupère uniquement les leçons appartenant
  // à la classe de l'élève.
  //
  // Contrairement à getAdminStudentView(), on ne
  // récupère plus toutes les leçons de l'académie.
  // =====================================================

  let lessonsData = [];

  if (profile.class_id) {
    try {

      // ============================================
      // 1. MATIÈRES DE LA CLASSE
      // ============================================

      const {
        data: subjectsData,
        error: subjectsError
      } = await supabase
        .from("subjects")
        .select(`
          id,
          name
        `)
        .eq(
          "class_id",
          profile.class_id
        );


      if (subjectsError) {

        console.error(
          "❌ [CONSULTATION] Erreur matières :",
          subjectsError
        );

      } else if (subjectsData?.length) {

        const subjectIds =
          subjectsData.map(
            subject =>
              subject.id
          );


        console.log(
          "🔎 [CONSULTATION] MATIÈRES DE LA CLASSE :",
          {
            classId:
              profile.class_id,

            count:
              subjectsData?.length || 0,

            subjects:
              subjectsData || [],

            error:
              subjectsError || null
          }
        );


        // ==========================================
        // 2. CHAPITRES DES MATIÈRES
        // ==========================================

        const {
          data: chaptersData,
          error: chaptersError
        } = await supabase
          .from("chapters")
          .select(`
            id,
            subject_id
          `)
          .in(
            "subject_id",
            subjectIds
          );


        if (chaptersError) {

          console.error(
            "❌ [CONSULTATION] Erreur chapitres :",
            chaptersError
          );

        } else if (chaptersData?.length) {

          const chapterIds =
            chaptersData.map(
              chapter =>
                chapter.id
            );


          console.log(
            "🔎 [CONSULTATION] CHAPITRES :",
            {
              count:
                chaptersData?.length || 0,

              chapters:
                chaptersData || [],

              error:
                chaptersError || null
            }
          );


          // ========================================
          // 3. LEÇONS DES CHAPITRES
          // ========================================

          const {
            data: lessonsQueryData,
            error: lessonsQueryError
          } = await supabase
            .from("lessons")
            .select(`
              id,
              chapter_id
            `)
            .in(
              "chapter_id",
              chapterIds
            );


          if (lessonsQueryError) {

            console.error(
              "❌ [CONSULTATION] Erreur leçons :",
              lessonsQueryError
            );

          } else {

            lessonsData =
              (lessonsQueryData || []).map(
                lesson => {

                  const chapter =
                    chaptersData.find(
                      item =>
                        item.id ===
                        lesson.chapter_id
                    );


                  const subject =
                    subjectsData.find(
                      item =>
                        item.id ===
                        chapter?.subject_id
                    );


                  return {
                    ...lesson,

                    chapters: {
                      id:
                        chapter?.id ||
                        null,

                      subject_id:
                        chapter?.subject_id ||
                        null,

                      subjects: {
                        id:
                          subject?.id ||
                          null,

                        name:
                          subject?.name ||
                          "Matière inconnue"
                      }
                    }
                  };

                }
              );

          }
        }
      }

    } catch (error) {

      console.error(
        "❌ [CONSULTATION] Exception chargement contenu :",
        error
      );

    }
  }


  // =====================================================
  // 6.1. LOG DES LEÇONS
  // =====================================================

  console.log(
    "🔎 [CONSULTATION] LEÇONS :",
    {
      count:
        lessonsData.length,

      lessons:
        lessonsData,

      error:
        null
    }
  );


  // =====================================================
  // 7. LEÇONS TERMINÉES
  // =====================================================

  const completedLessons =
    progressData.reduce(
      (total, item) =>
        total +
        (
          item?.completed === true
            ? 1
            : 0
        ),
      0
    );


  // =====================================================
  // 8. LEÇONS TERMINÉES PAR ID
  // =====================================================

  const completedLessonIds =
    new Set(
      progressData
        .filter(
          item =>
            item?.completed === true &&
            item?.lesson_id
        )
        .map(
          item =>
            item.lesson_id
        )
    );


  // =====================================================
  // 9. PROGRESSION PAR MATIÈRE
  // =====================================================

  const subjectsProgress = {};


  for (
    const lesson of lessonsData
  ) {

    const subject =
      lesson?.chapters?.subjects;


    if (!subject?.id) {
      continue;
    }


    const subjectId =
      subject.id;


    const subjectName =
      subject.name ||
      "Matière inconnue";


    if (!subjectsProgress[subjectId]) {

      subjectsProgress[subjectId] = {
        id:
          subjectId,

        name:
          subjectName,

        total:
          0,

        completed:
          0,

        percent:
          0
      };

    }


    subjectsProgress[
      subjectId
    ].total += 1;


    if (
      completedLessonIds.has(
        lesson.id
      )
    ) {

      subjectsProgress[
        subjectId
      ].completed += 1;

    }

  }


  // =====================================================
  // 10. POURCENTAGES
  // =====================================================

  Object.values(
    subjectsProgress
  ).forEach(
    subject => {

      if (subject.total > 0) {

        subject.percent =
          Math.round(
            (
              subject.completed /
              subject.total
            ) * 100
          );

      } else {

        subject.percent = 0;

      }

    }
  );


  // =====================================================
  // 11. SCORE MOYEN
  // =====================================================

  let averageScore = 0;


  if (attemptsData.length > 0) {

    const totalScore =
      attemptsData.reduce(
        (total, attempt) =>
          total +
          Number(
            attempt?.score || 0
          ),
        0
      );


    averageScore =
      Math.round(
        totalScore /
        attemptsData.length
      );

  }


  // =====================================================
  // 12. RÉSULTAT LÉGER
  // =====================================================

  console.log(
    "⚡ [CONSULTATION] Vue légère chargée :",
    {
      studentId,

      subjects:
        Object.keys(
          subjectsProgress
        ).length,

      lessons:
        lessonsData.length,

      completedLessons,

      attempts:
        attemptsData.length,

      badges:
        badges.length
    }
  );


  return {

    profile,

    subjects:
      subjectsProgress,

    stats: {

      lessons:
        completedLessons,

      score:
        averageScore,

      badges:
        badges.length,

      attempts:
        attemptsData.length

    },

    badges

  };
}

// ==========================
// VUE ADMIN D'UN ÉLÈVE
// ==========================

export async function getAdminStudentView(
  studentId
) {
  if (!studentId) {
    throw new Error(
      "Identifiant élève manquant."
    );
  }


  const [
    profileResult,
    progressResult,
    attemptsResult,
    badgesResult,
    deviceResult,
    lessonsResult,
    emailResult
  ] = await Promise.all([

    // -----------------------------------------
    // PROFIL
    // -----------------------------------------

    supabase
      .from("profiles")
      .select(`
        id,
        full_name,
        avatar_url,
        role,
        access_status,
        class_id,
        is_premium,
        orange_money_id,
        xp,
        level,
        created_at,
        classes(
          id,
          name
        )
      `)
      .eq(
        "id",
        studentId
      )
      .single(),


    // -----------------------------------------
    // PROGRESSION ÉLÈVE
    // -----------------------------------------

    supabase
      .from("user_progress")
      .select(`
        lesson_id,
        completed
      `)
      .eq(
        "user_id",
        studentId
      ),


    // -----------------------------------------
    // QUIZ
    // -----------------------------------------

    supabase
      .from("quiz_attempts")
      .select(`
        score
      `)
      .eq(
        "user_id",
        studentId
      ),


    // -----------------------------------------
    // BADGES
    // -----------------------------------------

    supabase
      .from("user_badges")
      .select(`
        id,
        badge_id,
        earned_at,
        badges(
          id,
          name,
          description,
          image_url,
          xp_reward
        )
      `)
      .eq(
        "user_id",
        studentId
      ),


    // -----------------------------------------
    // APPAREIL
    // -----------------------------------------

    supabase
      .from("user_devices")
      .select(`
        id,
        device_id,
        device_name,
        platform,
        manufacturer,
        model,
        os_version,
        is_active,
        last_seen_at,
        created_at,
        updated_at
      `)
      .eq(
        "user_id",
        studentId
      )
      .maybeSingle(),


    // -----------------------------------------
    // TOUTES LES LEÇONS
    // -----------------------------------------
    // Relation réelle :
    // lessons → chapters → subjects
    // -----------------------------------------

    supabase
      .from("lessons")
      .select(`
        id,
        chapter_id,
        chapters(
          id,
          subject_id,
          subjects(
            id,
            name
          )
        )
      `),


    // -----------------------------------------
    // EMAIL
    // -----------------------------------------

    supabase.rpc(
      "get_admin_student_email",
      {
        p_user_id: studentId
      }
    )

  ]);


  // -----------------------------------------
  // PROFIL
  // -----------------------------------------

  if (profileResult.error) {
    console.error(
      "❌ [ADMIN STUDENT] Erreur profil :",
      profileResult.error
    );

    throw profileResult.error;
  }


  if (!profileResult.data) {
    throw new Error(
      "Élève introuvable."
    );
  }


  // -----------------------------------------
  // EMAIL
  // -----------------------------------------

  let email = null;


  if (emailResult.error) {
    console.error(
      "❌ [ADMIN STUDENT] Erreur email :",
      emailResult.error
    );
  } else if (
    emailResult.data?.success
  ) {
    email =
      emailResult.data.email || null;
  }


  // -----------------------------------------
  // APPAREIL
  // -----------------------------------------

  if (deviceResult.error) {
    console.error(
      "❌ [ADMIN STUDENT] Erreur appareil :",
      deviceResult.error
    );
  }


  const deviceData =
    deviceResult.data || null;


  // -----------------------------------------
  // PROGRESSION
  // -----------------------------------------

  if (progressResult.error) {
    console.error(
      "❌ [ADMIN STUDENT] Erreur progression :",
      progressResult.error
    );
  }


  const progressData =
    progressResult.data || [];


  // -----------------------------------------
  // TOUTES LES LEÇONS
  // -----------------------------------------

  if (lessonsResult.error) {
    console.error(
      "❌ [ADMIN STUDENT] Erreur leçons :",
      lessonsResult.error
    );
  }


  const lessonsData =
    lessonsResult.data || [];


  // -----------------------------------------
  // LEÇONS TERMINÉES
  // -----------------------------------------

  const completedLessons =
    progressData.reduce(
      (total, item) =>

        total +
        (
          item?.completed === true
            ? 1
            : 0
        ),

      0
    );


  // -----------------------------------------
  // LEÇONS TERMINÉES PAR ID
  // -----------------------------------------

  const completedLessonIds =
    new Set(
      progressData
        .filter(
          item =>
            item?.completed === true &&
            item?.lesson_id
        )
        .map(
          item => item.lesson_id
        )
    );


  // -----------------------------------------
  // PROGRESSION PAR MATIÈRE
  // -----------------------------------------

  const subjectsProgress = {};


  for (const lesson of lessonsData) {

    const subject =
      lesson?.chapters?.subjects;


    if (!subject?.id) {
      continue;
    }


    const subjectId =
      subject.id;


    const subjectName =
      subject.name ||
      "Matière inconnue";


    if (!subjectsProgress[subjectId]) {

      subjectsProgress[subjectId] = {
        id: subjectId,
        name: subjectName,
        total: 0,
        completed: 0,
        percent: 0
      };

    }


    subjectsProgress[subjectId].total += 1;


    if (
      completedLessonIds.has(
        lesson.id
      )
    ) {

      subjectsProgress[
        subjectId
      ].completed += 1;

    }

  }


  // -----------------------------------------
  // CALCUL DES POURCENTAGES
  // -----------------------------------------

  Object.values(
    subjectsProgress
  ).forEach(subject => {

    if (subject.total > 0) {

      subject.percent =
        Math.round(
          (
            subject.completed /
            subject.total
          ) * 100
        );

    } else {

      subject.percent = 0;

    }

  });


  // -----------------------------------------
  // QUIZ
  // -----------------------------------------

  if (attemptsResult.error) {
    console.error(
      "❌ [ADMIN STUDENT] Erreur quiz :",
      attemptsResult.error
    );
  }


  const attemptsData =
    attemptsResult.data || [];


  let averageScore = 0;


  if (attemptsData.length > 0) {

    const totalScore =
      attemptsData.reduce(
        (total, attempt) =>

          total +
          Number(
            attempt?.score || 0
          ),

        0
      );


    averageScore =
      Math.round(
        totalScore /
        attemptsData.length
      );

  }


  // -----------------------------------------
  // BADGES
  // -----------------------------------------

  if (badgesResult.error) {
    console.error(
      "❌ [ADMIN STUDENT] Erreur badges :",
      badgesResult.error
    );
  }


  const badges =
    badgesResult.data || [];


  // -----------------------------------------
  // RÉSULTAT FINAL
  // -----------------------------------------

  return {

    profile: {
      ...profileResult.data,
      email
    },

    device:
      deviceData,

    subjects:
      subjectsProgress,

    stats: {

      lessons:
        completedLessons,

      score:
        averageScore,

      badges:
        badges.length,

      attempts:
        attemptsData.length

    },

    badges

  };
}