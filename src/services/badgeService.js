import { supabase } from "../lib/supabase";



export async function unlockBadge(
  userId,
  badgeName
) {

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