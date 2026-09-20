// src/services/xpService.js

import { supabase } from "../lib/supabase";

import {
  addToSyncQueue,
  getLocalProgressResetVersion,
  setLocalProgressResetVersion,
  clearLocalUserProgress,
} from "../offline/db";


// =====================================
// CONSTANTES
// =====================================

const XP_PER_LEVEL = 500;

const XP_CACHE_PREFIX =
  "kalan_xp_cache_";


// =====================================
// UTILITAIRES XP
// =====================================

function calculateLevel(xp) {

  const safeXP =
    Math.max(
      Number(xp) || 0,
      0
    );

  return (
    Math.floor(
      safeXP / XP_PER_LEVEL
    ) + 1
  );

}


// =====================================
// CACHE XP
// =====================================

function getCachedXP(userId) {

  try {

    const raw =
      localStorage.getItem(
        `${XP_CACHE_PREFIX}${userId}`
      );

    if (!raw) {
      return null;
    }


    const parsed =
      JSON.parse(raw);


    if (!parsed) {
      return null;
    }


    return {

      xp:
        Math.max(
          Number(parsed.xp) || 0,
          0
        ),

      level:
        calculateLevel(
          parsed.xp
        )

    };

  }
  catch {

    return null;

  }

}


function saveCachedXP(
  userId,
  data
) {

  try {

    const safeXP =
      Math.max(
        Number(data?.xp) || 0,
        0
      );


    const safeLevel =
      calculateLevel(
        safeXP
      );


    localStorage.setItem(

      `${XP_CACHE_PREFIX}${userId}`,

      JSON.stringify({

        xp:
          safeXP,

        level:
          safeLevel

      })

    );

  }
  catch {

    // localStorage indisponible :
    // on continue sans bloquer l'application.

  }

}


// =====================================
// PROTECTION RÉINITIALISATION XP
// =====================================

async function checkProgressResetBeforeXP(
  userId
) {

  if (!userId) {

    return {

      allowed:
        false,

      resetDetected:
        false

    };

  }


  const localVersion =
    getLocalProgressResetVersion(
      userId
    );


  try {

    const {
      data: profile,
      error
    } = await supabase

      .from("profiles")

      .select(
        "progress_reset_version"
      )

      .eq(
        "id",
        userId
      )

      .single();


    if (error) {
      throw error;
    }


    const serverVersion =
      Math.max(
        Number(
          profile?.progress_reset_version
        ) || 0,
        0
      );


    // ---------------------------------
    // UNE RÉINITIALISATION A EU LIEU
    // ---------------------------------

    if (
      serverVersion >
      localVersion
    ) {

      console.log(
        "🚨 Nouvelle réinitialisation XP détectée."
      );


      await clearLocalUserProgress(
        userId
      );


      setLocalProgressResetVersion(
        userId,
        serverVersion
      );


      console.log(
        "✅ Ancienne progression XP locale supprimée."
      );


      return {

        allowed:
          true,

        resetDetected:
          true,

        localVersion:
          serverVersion,

        serverVersion

      };

    }


    // ---------------------------------
    // VERSION IDENTIQUE
    // ---------------------------------

    if (
      serverVersion ===
      localVersion
    ) {

      setLocalProgressResetVersion(
        userId,
        serverVersion
      );

    }


    // ---------------------------------
    // VERSION LOCALE SUPÉRIEURE
    // ---------------------------------

    if (
      localVersion >
      serverVersion
    ) {

      console.warn(
        "⚠️ Version locale XP supérieure à la version serveur."
      );

    }


    return {

      allowed:
        true,

      resetDetected:
        false,

      localVersion,

      serverVersion

    };

  }
  catch (error) {

    console.warn(
      "⚠️ Impossible de vérifier la réinitialisation XP :",
      error
    );


    /*
      On autorise ici le fonctionnement offline.

      La protection principale reste active dès que
      le serveur est de nouveau accessible.
    */

    return {

      allowed:
        true,

      resetDetected:
        false,

      localVersion,

      serverVersion:
        null

    };

  }

}


// =====================================
// AJOUT XP
// =====================================

export async function addXP(
  userId,
  amount
) {

  if (!userId) {
    return null;
  }


  const safeAmount =
    Number(amount) || 0;


  if (safeAmount <= 0) {
    return null;
  }


  // ===================================
  // PROTECTION RÉINITIALISATION
  // ===================================

  const resetCheck =
    await checkProgressResetBeforeXP(
      userId
    );


  if (!resetCheck.allowed) {

    console.warn(
      "⛔ Ajout XP bloqué."
    );

    return null;

  }


  // ===================================
  // MODE ONLINE
  // ===================================

  if (
    typeof navigator !== "undefined" &&
    navigator.onLine
  ) {

    try {

      const {
        data: profile,
        error: getError
      } = await supabase

        .from("profiles")

        .select(
          "xp, level, progress_reset_version"
        )

        .eq(
          "id",
          userId
        )

        .single();


      if (getError) {
        throw getError;
      }


      // --------------------------------
      // VÉRIFICATION VERSION
      // --------------------------------

      const serverVersion =
        Math.max(
          Number(
            profile?.progress_reset_version
          ) || 0,
          0
        );


      const localVersion =
        getLocalProgressResetVersion(
          userId
        );


      if (
        serverVersion >
        localVersion
      ) {

        console.log(
          "🚨 Réinitialisation détectée avant écriture XP."
        );


        await clearLocalUserProgress(
          userId
        );


        setLocalProgressResetVersion(
          userId,
          serverVersion
        );


        return {

          xp:
            0,

          level:
            1,

          pending:
            false

        };

      }


      // --------------------------------
      // XP ACTUEL SERVEUR
      // --------------------------------

      const currentXP =
        Math.max(
          Number(profile?.xp) || 0,
          0
        );


      // --------------------------------
      // NOUVEL XP
      // --------------------------------

      const newXP =
        currentXP +
        safeAmount;


      // --------------------------------
      // NOUVEAU NIVEAU
      // --------------------------------

      const newLevel =
        calculateLevel(
          newXP
        );


      // --------------------------------
      // SAUVEGARDE SUPABASE
      // --------------------------------

      const {
        error: updateError
      } = await supabase

        .from("profiles")

        .update({

          xp:
            newXP,

          level:
            newLevel

        })

        .eq(
          "id",
          userId
        );


      if (updateError) {
        throw updateError;
      }


      // --------------------------------
      // CACHE LOCAL
      // --------------------------------

      saveCachedXP(

        userId,

        {

          xp:
            newXP,

          level:
            newLevel

        }

      );


      console.log(

        `+${safeAmount} XP | ` +
        `XP total : ${newXP} | ` +
        `Niveau ${newLevel} ☁️`

      );


      return {

        xp:
          newXP,

        level:
          newLevel,

        pending:
          false

      };

    }

    catch (error) {

      console.error(

        "⚠️ XP Supabase indisponible, " +
        "passage en mode offline :",

        error

      );

      // On continue vers le mode offline.

    }

  }


  // ===================================
  // MODE OFFLINE
  // ===================================

  let cached =
    getCachedXP(userId);


  /*
    Si aucun cache XP n'existe encore,
    on essaie de récupérer le XP serveur
    une dernière fois.

    Cela évite de faire :

    5500 XP → offline → 100 XP

    au lieu de :

    5500 XP → offline → 5600 XP
  */

  if (!cached) {

    try {

      const {
        data: profile
      } = await supabase

        .from("profiles")

        .select(
          "xp, level, progress_reset_version"
        )

        .eq(
          "id",
          userId
        )

        .single();


      if (profile) {

        const serverVersion =
          Math.max(
            Number(
              profile.progress_reset_version
            ) || 0,
            0
          );


        const localVersion =
          getLocalProgressResetVersion(
            userId
          );


        // ------------------------------
        // PROTECTION RESET
        // ------------------------------

        if (
          serverVersion >
          localVersion
        ) {

          console.log(
            "🚨 Réinitialisation détectée avant récupération XP."
          );


          await clearLocalUserProgress(
            userId
          );


          setLocalProgressResetVersion(
            userId,
            serverVersion
          );


          cached = {

            xp:
              0,

            level:
              1

          };

        }

        else {

          cached = {

            xp:
              Math.max(
                Number(profile.xp) || 0,
                0
              ),

            level:
              calculateLevel(
                profile.xp
              )

          };


          saveCachedXP(
            userId,
            cached
          );

        }

      }

    }
    catch {

      // Si aucun accès serveur n'est possible,
      // on utilisera le cache ou 0 comme dernier recours.

    }

  }


  // --------------------------------
  // XP LOCAL
  // --------------------------------

  const currentXP =
    Math.max(
      Number(cached?.xp) || 0,
      0
    );


  const newXP =
    currentXP +
    safeAmount;


  // --------------------------------
  // NIVEAU LOCAL
  // --------------------------------

  const newLevel =
    calculateLevel(
      newXP
    );


  // --------------------------------
  // CACHE LOCAL
  // --------------------------------

  saveCachedXP(

    userId,

    {

      xp:
        newXP,

      level:
        newLevel

    }

  );


  // --------------------------------
  // FILE DE SYNCHRONISATION
  // --------------------------------

  await addToSyncQueue({

    table_name:
      "profiles",

    record_id:
      userId,

    action:
      "xp",

    local_record_id:
      `${userId}-${Date.now()}`,

    payload: {

      user_id:
        userId,

      amount:
        safeAmount

    }

  });


  console.log(

    `+${safeAmount} XP | ` +
    `XP total : ${newXP} | ` +
    `Niveau ${newLevel} 💾 offline`

  );


  return {

    xp:
      newXP,

    level:
      newLevel,

    pending:
      true

  };

}


// =====================================
// CALCUL XP DU NIVEAU
// =====================================

export function getXPProgress(xp) {

  const safeXP =
    Math.max(
      Number(xp) || 0,
      0
    );


  const level =
    calculateLevel(
      safeXP
    );


  const currentLevelXP =
    (level - 1) *
    XP_PER_LEVEL;


  const xpInCurrentLevel =
    safeXP -
    currentLevelXP;


  const xpRemaining =
    XP_PER_LEVEL -
    xpInCurrentLevel;


  const percentage =
    Math.min(

      Math.max(

        (
          xpInCurrentLevel /
          XP_PER_LEVEL
        ) * 100,

        0

      ),

      100

    );


  return {

    level,

    currentLevelXP,

    xpInCurrentLevel,

    xpRemaining,

    percentage

  };

}


// =====================================
// EXPORT
// =====================================

export {
  XP_PER_LEVEL,
  calculateLevel
};
