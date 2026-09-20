import { supabase } from "../lib/supabase";

import {
  getLocalProgressResetVersion,
  setLocalProgressResetVersion,
  clearLocalUserProgress,
} from "../offline/db";


// =====================================
// PROTECTION RÉINITIALISATION
// =====================================

async function checkProgressResetBeforeBadge(
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
    // NOUVELLE RÉINITIALISATION
    // ---------------------------------

    if (
      serverVersion >
      localVersion
    ) {

      console.log(
        "🚨 Nouvelle réinitialisation détectée avant ajout du badge."
      );


      await clearLocalUserProgress(
        userId
      );


      setLocalProgressResetVersion(
        userId,
        serverVersion
      );


      console.log(
        "✅ Ancienne progression locale supprimée avant ajout du badge."
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
        "⚠️ Version locale badge supérieure à la version serveur."
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
      "⚠️ Impossible de vérifier la réinitialisation avant badge :",
      error
    );


    /*
      On conserve le fonctionnement actuel.

      En cas d'indisponibilité du serveur, le badge
      peut continuer à fonctionner normalement.
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
// VÉRIFIER / DÉBLOQUER UN BADGE
// =====================================

export async function unlockBadge(
  userId,
  badgeName
) {

  if (!userId) {
    return null;
  }


  const resetCheck =
    await checkProgressResetBeforeBadge(
      userId
    );


  if (!resetCheck.allowed) {

    console.warn(
      "⛔ Déblocage du badge bloqué."
    );

    return null;

  }


  const {
    data: badge
  } =
    await supabase

      .from("badges")

      .select("id")

      .eq(
        "name",
        badgeName
      )

      .single();


  if (!badge)
    return;


  const {
    data: exist
  } =
    await supabase

      .from("user_badges")

      .select("id")

      .eq(
        "user_id",
        userId
      )

      .eq(
        "badge_id",
        badge.id
      );


  if (exist?.length)
    return;

}


// ---------------------------------------------------------
// AJOUTER UN BADGE À UN UTILISATEUR
// ---------------------------------------------------------

export async function addUserBadge(
  userId,
  badgeId
) {

  if (!userId) {
    return null;
  }


  const resetCheck =
    await checkProgressResetBeforeBadge(
      userId
    );


  if (!resetCheck.allowed) {

    console.warn(
      "⛔ Ajout du badge bloqué."
    );

    return null;

  }


  // Vérifier si le badge existe déjà

  const {
    data: existing,
    error: checkError
  } = await supabase

    .from("user_badges")

    .select("id")

    .eq(
      "user_id",
      userId
    )

    .eq(
      "badge_id",
      badgeId
    )

    .maybeSingle();


  if (checkError) {

    console.error(
      "Erreur vérification badge :",
      checkError
    );

    return null;

  }


  // Déjà obtenu

  if (existing) {

    console.log(
      "Badge déjà obtenu"
    );

    return existing;

  }


  // Nouveau badge

  const {
    data,
    error
  } = await supabase

    .from("user_badges")

    .insert({

      user_id: userId,
      badge_id: badgeId

    })

    .select()
    .single();


  if (error) {

    console.error(
      "Erreur ajout badge :",
      error
    );

    return null;

  }


  return data;

}