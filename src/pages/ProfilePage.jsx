// src/pages/ProfilePage.jsx

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { LogOut } from "lucide-react";

export default function ProfilePage() {

  const [profile, setProfile] = useState(null);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {

    loadProfile();

  }, []);



  async function loadProfile() {

    try {

      setLoading(true);


      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();



      if (!session?.user) {

        console.log("Utilisateur non connecté");

        return;

      }



      const userId = session.user.id;



      // ==========================
      // PROFILE
      // ==========================

      const {
        data: profileData,
        error: profileError
      } = await supabase

        .from("profiles")

        .select(`
          id,
          full_name,
          avatar_url,
          role,
          class_id,
          orange_money_id,
          is_premium
        `)

        .eq(
          "id",
          userId
        )

        .single();



      if(profileError){

        console.error(
          "PROFILE ERROR:",
          profileError
        );

      }


      setProfile(profileData || null);



      // ==========================
      // BADGES
      // ==========================

      const {
        data: badgeData,
        error: badgeError
      } = await supabase

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
          userId
        );



      console.log(
        "BADGES:",
        badgeData
      );


      console.log(
        "BADGES ERROR:",
        badgeError
      );



      if(badgeError){

        console.error(
          badgeError
        );

        setBadges([]);

      }else{

        setBadges(
          badgeData || []
        );

      }



    } catch(error){

      console.error(
        "Erreur ProfilePage:",
        error
      );

    } finally {

      setLoading(false);

    }

  }



  if(loading){

    return (
      <div className="p-6 text-center">
        Chargement du profil...
      </div>
    );

  }



  return (

    <div className="p-6 max-w-xl mx-auto">


      <h1 className="text-2xl font-bold mb-6">
        Mon profil
      </h1>



      {profile && (

        <div className="bg-white rounded-xl shadow p-4 mb-6">

          <h2 className="text-xl font-semibold">

            {profile.full_name || "Étudiant Kalan"}

          </h2>


          <p>
            Statut :
            {" "}
            {profile.is_premium
              ? "Premium"
              : "Gratuit"
            }
          </p>

        </div>

      )}



      <h2 className="text-xl font-bold mb-4">
        Mes badges
      </h2>



      {
        badges.length === 0 ? (

          <div className="text-gray-500">

            Aucun badge obtenu.

          </div>

        ) : (

          <div className="space-y-4">


            {
              badges.map((item)=>(

                <div
                  key={item.id}
                  className="bg-white shadow rounded-xl p-4 flex gap-4 items-center"
                >


                  <div className="w-14 h-14 rounded-full bg-yellow-100 flex items-center justify-center">

                    🏆

                  </div>



                  <div>


                    <h3 className="font-bold">

                      {item.badges?.name}

                    </h3>


                    <p className="text-sm">

                      {item.badges?.description}

                    </p>


                    <p className="text-sm font-semibold mt-1">

                      +{item.badges?.xp_reward || 0} XP

                    </p>


                  </div>


                </div>

              ))

            }


          </div>

        )

      }


    </div>

  );

}
