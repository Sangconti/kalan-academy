import { Device } from "@capacitor/device";
import { supabase } from "../lib/supabase";

// ==========================================
// RÉCUPÉRER L'IDENTIFIANT DE L'APPAREIL
// ==========================================

export async function getDeviceId() {
  try {
    const info = await Device.getId();

    console.log(
      "📱 [DEVICE] deviceId =",
      info.identifier
    );

    return info.identifier;

  } catch (error) {
    console.error(
      "❌ [DEVICE] Impossible de récupérer l'identifiant :",
      error
    );

    return null;
  }
}


// ==========================================
// RÉCUPÉRER LES INFORMATIONS DE L'APPAREIL
// ==========================================

export async function getDeviceInfo() {
  try {
    const info = await Device.getInfo();

    console.log(
      "📱 [DEVICE] Informations appareil =",
      info
    );

    return {
      manufacturer:
        info.manufacturer || null,

      model:
        info.model || null,

      platform:
        info.platform || null,

      osVersion:
        info.osVersion || null
    };

  } catch (error) {
    console.error(
      "❌ [DEVICE] Impossible de récupérer les informations de l'appareil :",
      error
    );

    return {
      manufacturer: null,
      model: null,
      platform: null,
      osVersion: null
    };
  }
}


// ==========================================
// ENREGISTRER / VÉRIFIER L'APPAREIL
// ==========================================

export async function registerUserDevice() {
  try {

    // ----------------------------------------
    // Vérifier la session
    // ----------------------------------------

    const {
      data: sessionData,
      error: sessionError
    } = await supabase.auth.getSession();

    console.log(
      "🔐 [DEVICE] Session avant RPC =",
      sessionData?.session
    );

    console.log(
      "❌ [DEVICE] Session error =",
      sessionError
    );

    if (sessionError) {
      return {
        success: false,
        status: "session_error",
        error: sessionError
      };
    }

    if (!sessionData?.session?.user) {
      return {
        success: false,
        status: "not_authenticated"
      };
    }


    // ----------------------------------------
    // Récupérer l'identifiant du téléphone
    // ----------------------------------------

    const deviceId =
      await getDeviceId();

    if (!deviceId) {
      return {
        success: false,
        status: "invalid_device"
      };
    }


    // ----------------------------------------
    // Récupérer les informations du téléphone
    // ----------------------------------------

    const deviceInfo =
      await getDeviceInfo();

    console.log(
      "📱 [DEVICE] Device ID =",
      deviceId
    );

    console.log(
      "📱 [DEVICE] Informations =",
      deviceInfo
    );

    console.log(
      "📱 [DEVICE] Vérification de l'appareil..."
    );


    // ----------------------------------------
    // Vérifier l'utilisateur réellement connecté
    // ----------------------------------------

    const {
      data: {
        user: currentUser
      },
      error: userError
    } = await supabase.auth.getUser();

    if (userError) {
      console.error(
        "❌ [DEVICE] Erreur récupération utilisateur =",
        userError
      );

      return {
        success: false,
        status: "user_error",
        error: userError
      };
    }

    console.log(
      "👤 [DEVICE] Utilisateur réellement utilisé par la RPC =",
      currentUser?.id
    );

    console.log(
      "📱 [DEVICE] Device réellement envoyé à la RPC =",
      deviceId
    );


    // ----------------------------------------
    // Appeler la fonction Supabase sécurisée
    // ----------------------------------------

    const {
      data,
      error
    } = await supabase.rpc(
      "register_user_device",
      {
        p_device_id:
          deviceId,

        p_manufacturer:
          deviceInfo.manufacturer,

        p_model:
          deviceInfo.model,

        p_platform:
          deviceInfo.platform,

        p_os_version:
          deviceInfo.osVersion
      }
    );


    // ----------------------------------------
    // Erreur Supabase
    // ----------------------------------------

    if (error) {
      console.error(
        "❌ [DEVICE] Erreur Supabase =",
        error
      );

      return {
        success: false,
        status: "server_error",
        error
      };
    }


    // ----------------------------------------
    // Résultat RPC
    // ----------------------------------------

    console.log(
      "📱 [DEVICE] Résultat RPC =",
      data
    );


    // ----------------------------------------
    // Normaliser le résultat
    //
    // La RPC retourne :
    //
    // {
    //   status: "authorized",
    //   message: "..."
    // }
    //
    // On ajoute success côté service afin que
    // LoginPage puisse utiliser un contrat stable.
    // ----------------------------------------

    return {
      success:
        data?.status === "authorized" ||
        data?.status === "registered",

      status:
        data?.status,

      message:
        data?.message,

      data
    };

  } catch (error) {

    console.error(
      "💥 [DEVICE] Exception =",
      error
    );

    return {
      success: false,
      status: "server_error",
      error
    };
  }
}


// ==========================================
// RÉCUPÉRER L'APPAREIL AVEC UN CODE
// ==========================================

export async function recoverUserDevice(
  recoveryCode
) {
  try {

    // ----------------------------------------
    // Vérifier le code
    // ----------------------------------------

    if (
      !recoveryCode ||
      !recoveryCode.trim()
    ) {
      return {
        success: false,
        status: "invalid_code"
      };
    }


    // ----------------------------------------
    // Vérifier la session
    // ----------------------------------------

    const {
      data: sessionData,
      error: sessionError
    } = await supabase.auth.getSession();

    console.log(
      "🔐 [DEVICE RECOVERY] Session =",
      sessionData?.session
    );

    console.log(
      "❌ [DEVICE RECOVERY] Session error =",
      sessionError
    );

    if (sessionError) {
      return {
        success: false,
        status: "session_error",
        error: sessionError
      };
    }

    if (!sessionData?.session?.user) {
      return {
        success: false,
        status: "not_authenticated"
      };
    }


    // ----------------------------------------
    // Récupérer le nouvel appareil
    // ----------------------------------------

    const deviceId =
      await getDeviceId();

    if (!deviceId) {
      return {
        success: false,
        status: "invalid_device"
      };
    }


    // ----------------------------------------
    // Récupérer les informations du nouvel appareil
    // ----------------------------------------

    const deviceInfo =
      await getDeviceInfo();

    console.log(
      "📱 [DEVICE RECOVERY] Nouveau deviceId =",
      deviceId
    );

    console.log(
      "📱 [DEVICE RECOVERY] Informations =",
      deviceInfo
    );


    // ----------------------------------------
    // Vérifier l'utilisateur réellement connecté
    // ----------------------------------------

    const {
      data: {
        user: currentUser
      },
      error: userError
    } = await supabase.auth.getUser();

    if (userError) {
      console.error(
        "❌ [DEVICE RECOVERY] Erreur utilisateur =",
        userError
      );

      return {
        success: false,
        status: "user_error",
        error: userError
      };
    }

    console.log(
      "👤 [DEVICE RECOVERY] Utilisateur réellement utilisé par la RPC =",
      currentUser?.id
    );

    console.log(
      "📱 [DEVICE RECOVERY] Device réellement envoyé à la RPC =",
      deviceId
    );


    // ----------------------------------------
    // Appeler Supabase
    // ----------------------------------------

    const {
      data,
      error
    } = await supabase.rpc(
      "recover_user_device",
      {
        p_recovery_code:
          recoveryCode.trim().toUpperCase(),

        p_device_id:
          deviceId,

        p_manufacturer:
          deviceInfo.manufacturer,

        p_model:
          deviceInfo.model,

        p_platform:
          deviceInfo.platform,

        p_os_version:
          deviceInfo.osVersion
      }
    );


    // ----------------------------------------
    // Erreur Supabase
    // ----------------------------------------

    if (error) {
      console.error(
        "❌ [DEVICE RECOVERY] Erreur Supabase =",
        error
      );

      return {
        success: false,
        status: "server_error",
        error
      };
    }


    // ----------------------------------------
    // Résultat RPC
    // ----------------------------------------

    console.log(
      "📱 [DEVICE RECOVERY] Résultat RPC =",
      data
    );


    // ----------------------------------------
    // Normaliser le résultat
    // ----------------------------------------

    return {
      success:
        data?.status === "device_recovered",

      status:
        data?.status,

      message:
        data?.message,

      data
    };

  } catch (error) {

    console.error(
      "💥 [DEVICE RECOVERY] Exception =",
      error
    );

    return {
      success: false,
      status: "server_error",
      error
    };
  }
}


// ==========================================
// GÉNÉRER UN CODE DE RÉCUPÉRATION
// ==========================================
//
// IMPORTANT :
// Cette fonction doit être appelée lorsque
// l'utilisateur est encore connecté sur son
// ancien téléphone.
//
// Le code est généré côté serveur.
//
// Le code en clair n'est retourné qu'une seule
// fois par Supabase.
//
// ==========================================

export async function generateDeviceRecoveryCode() {
  try {

    console.log(
      "🔐 [DEVICE RECOVERY] Début génération du code..."
    );


    // ----------------------------------------
    // Vérifier la session
    // ----------------------------------------

    const {
      data: sessionData,
      error: sessionError
    } = await supabase.auth.getSession();

    console.log(
      "🔐 [DEVICE RECOVERY] Session avant génération =",
      sessionData?.session
    );

    console.log(
      "❌ [DEVICE RECOVERY] Session error =",
      sessionError
    );

    if (sessionError) {
      return {
        success: false,
        status: "session_error",
        error: sessionError
      };
    }

    if (!sessionData?.session?.user) {

      console.warn(
        "🚫 [DEVICE RECOVERY] Aucun utilisateur connecté"
      );

      return {
        success: false,
        status: "not_authenticated"
      };
    }


    // ----------------------------------------
    // Vérifier l'utilisateur réellement connecté
    // ----------------------------------------

    const {
      data: {
        user: currentUser
      },
      error: userError
    } = await supabase.auth.getUser();

    console.log(
      "👤 [DEVICE RECOVERY] Utilisateur connecté =",
      currentUser?.id
    );

    if (userError) {
      console.error(
        "❌ [DEVICE RECOVERY] Erreur utilisateur =",
        userError
      );

      return {
        success: false,
        status: "user_error",
        error: userError
      };
    }

    if (!currentUser) {
      return {
        success: false,
        status: "not_authenticated"
      };
    }


    // ----------------------------------------
    // Appeler la fonction Supabase
    // ----------------------------------------

    console.log(
      "🔐 [DEVICE RECOVERY] Appel generate_device_recovery_code..."
    );

    const {
      data,
      error
    } = await supabase.rpc(
      "generate_device_recovery_code"
    );


    // ----------------------------------------
    // Erreur Supabase
    // ----------------------------------------

    if (error) {
      console.error(
        "❌ [DEVICE RECOVERY] Erreur RPC =",
        error
      );

      return {
        success: false,
        status: "server_error",
        error
      };
    }


    // ----------------------------------------
    // Résultat
    // ----------------------------------------

    console.log(
      "📱 [DEVICE RECOVERY] Résultat génération =",
      data
    );

    return data;

  } catch (error) {

    console.error(
      "💥 [DEVICE RECOVERY] Exception génération =",
      error
    );

    return {
      success: false,
      status: "server_error",
      error
    };
  }
}


// ==========================================
// GÉNÉRER LE CODE D'UN UTILISATEUR — ADMIN
// ==========================================
//
// Cette fonction est destinée au Dashboard Admin.
//
// Elle appelle la fonction SQL sécurisée :
//
// generate_user_device_recovery_code(p_user_id)
//
// Le serveur vérifie que l'utilisateur connecté
// est bien admin ou super_admin.
//
// ==========================================

export async function generateUserDeviceRecoveryCode(
  userId
) {
  try {

    console.log(
      "🔐 [ADMIN DEVICE RECOVERY] Début génération..."
    );


    // ----------------------------------------
    // Vérifier l'ID utilisateur cible
    // ----------------------------------------

    if (!userId) {

      console.warn(
        "⚠️ [ADMIN DEVICE RECOVERY] Aucun userId fourni"
      );

      return {
        success: false,
        status: "invalid_user"
      };
    }

    console.log(
      "👤 [ADMIN DEVICE RECOVERY] Utilisateur cible =",
      userId
    );


    // ----------------------------------------
    // Vérifier la session admin
    // ----------------------------------------

    const {
      data: sessionData,
      error: sessionError
    } = await supabase.auth.getSession();

    console.log(
      "🔐 [ADMIN DEVICE RECOVERY] Session =",
      sessionData?.session
    );

    if (sessionError) {

      console.error(
        "❌ [ADMIN DEVICE RECOVERY] Erreur session =",
        sessionError
      );

      return {
        success: false,
        status: "session_error",
        error: sessionError
      };
    }

    if (!sessionData?.session?.user) {

      console.warn(
        "🚫 [ADMIN DEVICE RECOVERY] Aucun admin connecté"
      );

      return {
        success: false,
        status: "not_authenticated"
      };
    }


    // ----------------------------------------
    // Vérifier l'utilisateur connecté
    // ----------------------------------------

    const {
      data: {
        user: currentUser
      },
      error: userError
    } = await supabase.auth.getUser();

    console.log(
      "👑 [ADMIN DEVICE RECOVERY] Admin connecté =",
      currentUser?.id
    );

    if (userError) {

      console.error(
        "❌ [ADMIN DEVICE RECOVERY] Erreur utilisateur =",
        userError
      );

      return {
        success: false,
        status: "user_error",
        error: userError
      };
    }

    if (!currentUser) {

      return {
        success: false,
        status: "not_authenticated"
      };
    }


    // ----------------------------------------
    // Appeler la RPC ADMIN
    // ----------------------------------------

    console.log(
      "🔐 [ADMIN DEVICE RECOVERY] Appel generate_user_device_recovery_code..."
    );

    const {
      data,
      error
    } = await supabase.rpc(
      "generate_user_device_recovery_code",
      {
        p_user_id: userId
      }
    );


    // ----------------------------------------
    // Erreur Supabase
    // ----------------------------------------

    if (error) {

      console.error(
        "❌ [ADMIN DEVICE RECOVERY] Erreur RPC =",
        error
      );

      return {
        success: false,
        status: "server_error",
        error
      };
    }


    // ----------------------------------------
    // Résultat
    // ----------------------------------------

    console.log(
      "📱 [ADMIN DEVICE RECOVERY] Résultat génération =",
      data
    );

    return data;

  } catch (error) {

    console.error(
      "💥 [ADMIN DEVICE RECOVERY] Exception =",
      error
    );

    return {
      success: false,
      status: "server_error",
      error
    };
  }
}


// ==========================================
// RÉINITIALISER L'APPAREIL D'UN UTILISATEUR
// — ADMIN
// ==========================================
//
// Cette fonction permet à un admin de libérer
// l'appareil actuellement associé au compte.
//
// La sécurité est assurée côté Supabase par
// la RPC reset_user_device(p_user_id).
//
// Après réinitialisation, l'élève pourra
// associer un nouveau téléphone.
//
// ==========================================

export async function resetUserDevice(userId) {
  try {

    console.log(
      "🔄 [ADMIN DEVICE] Début réinitialisation..."
    );


    // ----------------------------------------
    // Vérifier l'ID utilisateur
    // ----------------------------------------

    if (!userId) {

      console.warn(
        "⚠️ [ADMIN DEVICE] Aucun userId fourni"
      );

      return {
        success: false,
        status: "invalid_user"
      };
    }

    console.log(
      "👤 [ADMIN DEVICE] Utilisateur cible =",
      userId
    );


    // ----------------------------------------
    // Vérifier la session admin
    // ----------------------------------------

    const {
      data: sessionData,
      error: sessionError
    } = await supabase.auth.getSession();

    console.log(
      "🔐 [ADMIN DEVICE] Session =",
      sessionData?.session
    );

    if (sessionError) {

      console.error(
        "❌ [ADMIN DEVICE] Erreur session =",
        sessionError
      );

      return {
        success: false,
        status: "session_error",
        error: sessionError
      };
    }

    if (!sessionData?.session?.user) {

      console.warn(
        "🚫 [ADMIN DEVICE] Aucun administrateur connecté"
      );

      return {
        success: false,
        status: "not_authenticated"
      };
    }


    // ----------------------------------------
    // Vérifier l'utilisateur connecté
    // ----------------------------------------

    const {
      data: {
        user: currentUser
      },
      error: userError
    } = await supabase.auth.getUser();

    console.log(
      "👑 [ADMIN DEVICE] Administrateur connecté =",
      currentUser?.id
    );

    if (userError) {

      console.error(
        "❌ [ADMIN DEVICE] Erreur utilisateur =",
        userError
      );

      return {
        success: false,
        status: "user_error",
        error: userError
      };
    }

    if (!currentUser) {

      return {
        success: false,
        status: "not_authenticated"
      };
    }


    // ----------------------------------------
    // APPEL RPC
    // ----------------------------------------

    console.log(
      "🔐 [ADMIN DEVICE] Appel reset_user_device..."
    );

    const {
      data,
      error
    } = await supabase.rpc(
      "reset_user_device",
      {
        p_user_id: userId
      }
    );


    // ----------------------------------------
    // ERREUR SUPABASE
    // ----------------------------------------

    if (error) {

      console.error(
        "❌ [ADMIN DEVICE] Erreur RPC =",
        error
      );

      return {
        success: false,
        status: "server_error",
        error
      };
    }


    // ----------------------------------------
    // RÉSULTAT
    // ----------------------------------------

    console.log(
      "📱 [ADMIN DEVICE] Résultat réinitialisation =",
      data
    );

    return data;

  } catch (error) {

    console.error(
      "💥 [ADMIN DEVICE] Exception =",
      error
    );

    return {
      success: false,
      status: "server_error",
      error
    };
  }
}