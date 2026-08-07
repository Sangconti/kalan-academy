// src/pages/DashboardPage.jsx

import {
  useEffect,
  useState
} from "react";

import {
  supabase
} from "../lib/supabase";

import {
  Award,
  BookOpen,
  Star,
  Trophy
} from "lucide-react";


export default function DashboardPage() {


  const [profile,setProfile] = useState(null);
  const [subjects,setSubjects] = useState({});

  const [stats,setStats] = useState({
    lessons:0,
    score:0,
    badges:0
  });

  const [badges,setBadges] = useState([]);

  const [loading,setLoading] = useState(true);



  useEffect(()=>{

    loadDashboard();

  },[]);




  async function loadDashboard(){


    try{


      const {
        data:{
          user
        }
      } = await supabase.auth.getUser();



      if(!user){

        setLoading(false);
        return;

      }




      // PROFILE

      const {
        data:profileData,
        error:profileError
      } = await supabase

        .from("profiles")

        .select("*")

        .eq(
          "id",
          user.id
        )

        .single();



      if(profileError){

        console.error(profileError);

      }


      setProfile(profileData);





    // ===============================
    // PROGRESSION PAR MATIERE
    // ===============================

    const {
      data: progress
    } = await supabase

    .from("user_progress")

    .select(`
      completed,
      lessons(
        chapter_id,
        chapters(
          subject_id,
          subjects(
            name
          )
        )
      )
    `)

    .eq(
      "user_id",
      user.id
    );



    const completed =
    progress?.filter(
     p=>p.completed
    ).length || 0;



    const subjectsProgress = {};

    progress?.forEach(item=>{


     if(
       item.lessons?.chapters?.subjects
     ){

     const subject =
     item.lessons.chapters.subjects.name;



     if(!subjectsProgress[subject]){

      subjectsProgress[subject]={
        total:0,
        completed:0
      };

     }


     subjectsProgress[subject].total++;


     if(item.completed){

      subjectsProgress[subject].completed++;

     }


     }


    });



    Object.keys(subjectsProgress)
    .forEach(subject=>{


     const data =
     subjectsProgress[subject];


     data.percent =
     Math.round(
       (data.completed/data.total)*100
     );


    });

    setSubjects(subjectsProgress);



      // QUIZ SCORES


      const {
        data:attempts
      } = await supabase

        .from("quiz_attempts")

        .select("score")

        .eq(
          "user_id",
          user.id
        );




      let average = 0;


      if(attempts?.length){


        average = Math.round(

          attempts.reduce(
            (sum,item)=>
              sum + item.score,
            0
          )
          /
          attempts.length

        );

      }


      // BADGES


      const {
        data:userBadges,
        error:badgeError
      } = await supabase

        .from("user_badges")

        .select(`
          id,
          badges(
            name,
            description,
            xp_reward,
            image_url
          )
        `)

        .eq(
          "user_id",
          user.id
        );





      if(badgeError){

        console.error(
          "Badge error:",
          badgeError
        );

      }



      setBadges(
        userBadges || []
      );



      setStats({

        lessons:completed,

        score:average,

        badges:userBadges?.length || 0

      });



    }
    catch(error){

      console.error(
        "Dashboard:",
        error
      );

    }
    finally{

      setLoading(false);

    }

  }






  if(loading){

    return (

      <div className="p-6">

        Chargement dashboard...

      </div>

    );

  }






  if(!profile){

    return (

      <div className="p-6">

        Profil introuvable

      </div>

    );

  }




  // XP SYSTEM

  const xp = profile.xp || 0;

  const level =
    Math.floor(xp / 500) + 1;


  const nextLevelXP =
    level * 500;



  const progressXP =
    Math.min(
      (xp / nextLevelXP) * 100,
      100
    );

    <section>

    <h2 className="text-xl font-bold">
    Progression par matière
    </h2>


    <div className="grid md:grid-cols-3 gap-4 mt-4">


    {
    Object.entries(subjects)
    .map(
    ([name,data])=>(

    <div
    key={name}
    className="bg-white shadow rounded-xl p-5"
    >

    <h3 className="font-bold">
    {name}
    </h3>


    <div className="bg-gray-200 rounded-full h-4 mt-3">

    <div

    className="bg-green-600 h-4 rounded-full"

    style={{
    width:`${data.percent}%`
    }}

    />

    </div>


    <p className="mt-2">
    {data.percent}% terminé
    </p>


    </div>


    ))
    }


    </div>

    </section>


// ===============================
// RANG ELEVE
// ===============================

let rank = "Débutant";


if(xp >= 500){

  rank = "Apprenti";

}


if(xp >= 1500){

  rank = "Élève confirmé";

}


if(xp >= 3000){

  rank = "Expert";

}


if(xp >= 5000){

  rank = "Maître Kalan";

}




  return (


    <div className="p-6 space-y-6">





      <h1 className="text-3xl font-bold">

        Bonjour {profile.full_name || "Élève"}

      </h1>






     <div className="grid md:grid-cols-4 gap-4">



        <div className="bg-blue-100 rounded-xl p-5">

          <Star/>

          <p>XP Total</p>

          <h2 className="text-3xl font-bold">

            {xp}

          </h2>


        </div>





        <div className="bg-green-100 rounded-xl p-5">

          <Trophy/>

          <p>Niveau</p>

          <h2 className="text-3xl font-bold">

            {level}

          </h2>


        </div>






        <div className="bg-yellow-100 rounded-xl p-5">

          <Award/>

          <p>Badges</p>

          <h2 className="text-3xl font-bold">

            {stats.badges}

          </h2>


        </div>

        <div className="bg-purple-100 rounded-xl p-5">

        <Trophy/>

        <p>Rang</p>

        <h2 className="text-2xl font-bold">

        {rank}

        </h2>

        </div>



      </div>







      <section>


        <h2 className="text-xl font-bold">

          Progression niveau

        </h2>



        <div className="bg-gray-200 rounded-full h-5">

          <div

            className="bg-blue-600 h-5 rounded-full"

            style={{
              width:`${progressXP}%`
            }}

          />

        </div>


        <p>

          {xp}/{nextLevelXP} XP

        </p>


      </section>








      <div className="grid md:grid-cols-2 gap-4">



        <div className="bg-white shadow rounded-xl p-5">

          <BookOpen/>

          <h3>

            Leçons terminées

          </h3>

          <p className="text-3xl">

            {stats.lessons}

          </p>


        </div>






        <div className="bg-white shadow rounded-xl p-5">


          <Star/>

          <h3>

            Score moyen

          </h3>


          <p className="text-3xl">

            {stats.score} %

          </p>


        </div>



      </div>









      <section>


        <h2 className="text-xl font-bold">

          Mes badges

        </h2>



        <div className="grid md:grid-cols-3 gap-4 mt-4">


          {
            badges.map((item)=>(


              <div

                key={item.id}

                className="bg-white shadow rounded-xl p-4"

              >

                <div className="text-4xl">

                  🏆

                </div>


                <h3 className="font-bold">

                  {item.badges?.name}

                </h3>


                <p>

                  {item.badges?.description}

                </p>


                <p className="text-yellow-600">

                  +{item.badges?.xp_reward} XP

                </p>


              </div>


            ))
          }



        </div>


      </section>






    </div>


  );


}