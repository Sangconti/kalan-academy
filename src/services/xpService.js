// src/services/xpService.js

import { supabase } from "../lib/supabase";

import {
  addToSyncQueue
} from "../offline/db";


// =====================================
// CONSTANTES
// =====================================

const XP_CACHE_PREFIX =
  "kalan_xp_cache_";


// =====================================
// UTILITAIRES
// =====================================

function getCachedXP(userId) {

  try {

    const raw =
      localStorage.getItem(
        `${XP_CACHE_PREFIX}${userId}`
      );

    if (!raw)
      return null;

    return JSON.parse(raw);

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

    localStorage.setItem(

      `${XP_CACHE_PREFIX}${userId}`,

      JSON.stringify(data)

    );

  }
  catch {

    // Rien à faire si localStorage indisponible

  }

}


// =====================================
// AJOUT XP
// =====================================

export async function addXP(
  userId,
  amount
) {

  if (!userId)
    return null;


  amount =
    Number(amount) || 0;


  if (amount <= 0)
    return null;


  /*
    ------------------------------------
    MODE ONLINE
    ------------------------------------
  */

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
          "xp, level"
        )

        .eq(
          "id",
          userId
        )

        .single();


      if (getError)
        throw getError;


      const currentXP =
        Number(profile?.xp) || 0;


      const newXP =
        currentXP + amount;


      const newLevel =
        Math.floor(
          newXP / 500
        ) + 1;


      const {
        error: updateError
      } = await supabase

        .from("profiles")

        .update({

          xp: newXP,

          level: newLevel

        })

        .eq(
          "id",
          userId
        );


      if (updateError)
        throw updateError;


      /*
        On garde une copie locale
        du dernier XP confirmé.
      */

      saveCachedXP(

        userId,

        {
          xp: newXP,
          level: newLevel
        }

      );


      console.log(
        `+${amount} XP | Niveau ${newLevel} ☁️ synchronisé`
      );


      return {

        xp: newXP,

        level: newLevel,

        pending: false

      };

    }

    catch (error) {

      console.error(
        "⚠️ XP Supabase indisponible, sauvegarde offline :",
        error
      );

      /*
        On continue volontairement
        vers le mode offline.
      */

    }

  }


  /*
    ------------------------------------
    MODE OFFLINE
    ------------------------------------
  */

  const cached =
    getCachedXP(userId);


  const currentXP =
    Number(cached?.xp) || 0;


  const newXP =
    currentXP + amount;


  const newLevel =
    Math.floor(
      newXP / 500
    ) + 1;


  saveCachedXP(

    userId,

    {
      xp: newXP,

      level: newLevel
    }

  );


  /*
    Une opération XP est ajoutée
    à la queue.

    Le serveur recalculera le XP
    lorsqu'Internet reviendra.
  */

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

      amount

    }

  });


  console.log(
    `+${amount} XP | Niveau ${newLevel} 💾 offline`
  );


  return {

    xp: newXP,

    level: newLevel,

    pending: true

  };

}