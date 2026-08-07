import { supabase } from "../lib/supabase";



export async function saveLessonProgress({

userId,
lessonId,
score

}){


const { data, error } = await supabase

.from("user_progress")

.upsert({

user_id:userId,

lesson_id:lessonId,

completed:true,

score:score,

completed_at:new Date().toISOString()

},

{

onConflict:
"user_id,lesson_id"

}

);



if(error){

console.error(
"Erreur sauvegarde progression :",
error
);

throw error;

}


return data;


}