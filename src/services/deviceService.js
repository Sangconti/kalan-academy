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