import { supabase } from "../lib/supabase";



export async function unlockBadge(
userId,
badgeName
){


const {
data:badge
}
=
await supabase

.from("badges")

.select("id")

.eq(
"name",
badgeName
)

.single();



if(!badge)
return;



const {
data:exist
}
=
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



if(exist?.length)
return;




await supabase

.from("user_badges")

.insert({

user_id:userId,

badge_id:badge.id

});


}