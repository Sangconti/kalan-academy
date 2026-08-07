// src/services/xpService.js

import { supabase } from "../lib/supabase";


// =====================================
// AJOUT XP + CALCUL NIVEAU
// =====================================

export async function addXP(
  userId,
  amount
) {


  try {


    // récupérer profil actuel

    const {

      data:profile,

      error:getError

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



    if(getError){

      throw getError;

    }





    const currentXP =
      profile?.xp || 0;



    const newXP =
      currentXP + amount;





    // Niveau :
    // Niveau 1 = 0-499 XP
    // Niveau 2 = 500-999 XP
    // Niveau 3 = 1000-1499 XP

    const newLevel =
      Math.floor(
        newXP / 500
      ) + 1;








    const {

      error:updateError

    } = await supabase

      .from("profiles")

      .update({

        xp:newXP,

        level:newLevel

      })

      .eq(
        "id",
        userId
      );





    if(updateError){

      throw updateError;

    }





    console.log(
      `+${amount} XP | Niveau ${newLevel}`
    );



    return {

      xp:newXP,

      level:newLevel

    };




  }

  catch(error){


    console.error(
      "Erreur ajout XP :",
      error
    );


    return null;


  }


}