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

    const deviceId = await getDeviceId();

    if (!deviceId) {
      return {
        success: false,
        status: "invalid_device"
      };
    }


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
        p_device_id: deviceId
      }
    );


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


    console.log(
      "📱 [DEVICE] Résultat =",
      data
    );


    return data;

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


    console.log(
      "📱 [DEVICE RECOVERY] Nouveau deviceId =",
      deviceId
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
          deviceId
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


    console.log(
      "📱 [DEVICE RECOVERY] Résultat =",
      data
    );


    return data;

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
      "📱 [ADMIN DEVICE RECOVERY] Résultat =",
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