import { Device } from "@capacitor/device";
import { supabase } from "../lib/supabase";


// =====================================================
// INFORMATIONS DE L'APPAREIL
// =====================================================

export async function getDeviceInfo() {

  try {

    const idInfo = await Device.getId();
    const deviceInfo = await Device.getInfo();

    const result = {

      deviceId: idInfo.identifier,

      platform: deviceInfo.platform,

      model: deviceInfo.model,

      operatingSystem: deviceInfo.operatingSystem,

      osVersion: deviceInfo.osVersion

    };

    console.log(
      "📱 [DEVICE] Informations appareil =",
      result
    );

    return result;

  } catch (error) {

    console.error(
      "❌ [DEVICE] Impossible d'obtenir les informations de l'appareil =",
      error
    );

    throw error;

  }

}


// =====================================================
// VÉRIFIER / ENREGISTRER L'APPAREIL
// =====================================================

export async function verifyUserDevice(userId) {

  if (!userId) {

    return {
      allowed: false,
      reason: "USER_ID_MISSING"
    };

  }


  try {

    // ================================================
    // RÉCUPÉRER L'APPAREIL ACTUEL
    // ================================================

    const device = await getDeviceInfo();


    // ================================================
    // CHERCHER L'APPAREIL DU COMPTE
    // ================================================

    const {
      data: registeredDevice,
      error: selectError
    } = await supabase

      .from("user_devices")

      .select(`
        id,
        user_id,
        device_id,
        device_name,
        platform,
        is_active,
        last_seen_at
      `)

      .eq(
        "user_id",
        userId
      )

      .maybeSingle();


    if (selectError) {

      console.error(
        "❌ [DEVICE] Erreur recherche appareil =",
        selectError
      );

      return {
        allowed: false,
        reason: "DATABASE_ERROR",
        error: selectError
      };

    }


    // ================================================
    // PREMIÈRE CONNEXION
    // ================================================

    if (!registeredDevice) {

      console.log(
        "🆕 [DEVICE] Aucun appareil enregistré"
      );

      const {
        data: newDevice,
        error: insertError
      } = await supabase

        .from("user_devices")

        .insert({

          user_id: userId,

          device_id: device.deviceId,

          device_name: device.model,

          platform: device.platform,

          is_active: true,

          last_seen_at: new Date().toISOString()

        })

        .select()

        .single();


      if (insertError) {

        console.error(
          "❌ [DEVICE] Erreur enregistrement appareil =",
          insertError
        );

        return {
          allowed: false,
          reason: "DEVICE_REGISTRATION_ERROR",
          error: insertError
        };

      }


      console.log(
        "✅ [DEVICE] Premier appareil enregistré =",
        newDevice
      );


      return {

        allowed: true,

        reason: "DEVICE_REGISTERED",

        device: newDevice

      };

    }


    // ================================================
    // VÉRIFIER L'APPAREIL EXISTANT
    // ================================================

    console.log(
      "📱 [DEVICE] Appareil enregistré =",
      registeredDevice.device_id
    );

    console.log(
      "📱 [DEVICE] Appareil actuel =",
      device.deviceId
    );


    // ================================================
    // AUTRE APPAREIL
    // ================================================

    if (
      registeredDevice.device_id !==
      device.deviceId
    ) {

      console.warn(
        "🚫 [DEVICE] AUTRE APPAREIL DÉTECTÉ"
      );


      return {

        allowed: false,

        reason: "DIFFERENT_DEVICE",

        device: registeredDevice

      };

    }


    // ================================================
    // MÊME APPAREIL
    // ================================================

    const {
      error: updateError
    } = await supabase

      .from("user_devices")

      .update({

        last_seen_at:
          new Date().toISOString(),

        is_active: true

      })

      .eq(
        "id",
        registeredDevice.id
      );


    if (updateError) {

      console.warn(
        "⚠️ [DEVICE] Mise à jour last_seen impossible =",
        updateError
      );

    }


    console.log(
      "✅ [DEVICE] Appareil autorisé"
    );


    return {

      allowed: true,

      reason: "DEVICE_MATCH",

      device: registeredDevice

    };


  } catch (error) {

    console.error(
      "💥 [DEVICE] Exception vérification appareil =",
      error
    );


    return {

      allowed: false,

      reason: "UNKNOWN_ERROR",

      error

    };

  }

}