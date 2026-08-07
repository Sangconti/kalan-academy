import fs from "fs/promises";
import path from "path";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();


console.log("🚀 Kalan Academy Import V2.3 Production");


console.log(
  "URL:",
  process.env.SUPABASE_URL
);

console.log(
  "KEY:",
  process.env.SUPABASE_SERVICE_ROLE_KEY
    ? "Chargée"
    : "Absente"
);



const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function normalizeDifficulty(value) {

  switch(value) {

    case "beginner":
      return "easy";

    case "intermediate":
      return "medium";

    case "advanced":
    case "challenge":
      return "hard";

    case "easy":
    case "medium":
    case "hard":
      return value;

    default:
      return "easy";
  }

}


const LESSONS_DIR = path.join(
  process.cwd(),
  "content"
);



let report = {

  files:0,
  lessons:0,
  blocks:0,
  exercises:0,
  quizzes:0,
  questions:0,
  errors:0,
  skipped:0

};



async function getJsonFiles(dir){

  let results=[];

  const files =
    await fs.readdir(
      dir,
      {withFileTypes:true}
    );


  for(const file of files){

    const fullPath =
      path.join(
        dir,
        file.name
      );


    if(file.isDirectory()){

      results =
        results.concat(
          await getJsonFiles(fullPath)
        );

    }
    else if(
      file.name.endsWith(".json")
    ){

      results.push(fullPath);

    }

  }


  return results;

}





async function createLesson(
  chapter,
  lessonData
){


try{


console.log(
`\n📘 Lesson : ${lessonData.title}`
);



//
// Vérification doublon
//

const {data:existing}=

await supabase

.from("lessons")

.select("id")

.eq(
"chapter_id",
chapter.chapter_id
)

.eq(
"title",
lessonData.title
)

.maybeSingle();



if(existing){

console.log(
"⏭️ Déjà existante"
);

report.skipped++;

return;

}




//
// Création lesson
//

const {

data:lesson,

error:lessonError

}=

await supabase

.from("lessons")

.insert({

chapter_id:
chapter.chapter_id,

title:
lessonData.title,

description:
lessonData.description ?? null,


duration_minutes:
lessonData.duration_minutes
?? lessonData.duration
?? 10,


difficulty:
 normalizeDifficulty(
   lessonData.difficulty ?? lessonData.level
 ),

order_number:
lessonData.order_number
?? lessonData.order
?? 1

})

.select()

.single();



if(lessonError)
throw lessonError;



report.lessons++;


console.log(
"✅ Lesson créée:",
lesson.id
);





//
// BLOCKS
//

if(
lessonData.blocks &&
lessonData.blocks.length
){

const blocks = lessonData.blocks.map(
(b,index)=>({

lesson_id:
lesson.id,

block_type:
b.type ?? "text",

title:
b.title ?? null,

content:
b.content ?? {},

order_number:
index + 1

})
);



const { error } = await supabase
.from("lesson_blocks")
.insert(blocks);



if(error)
throw error;



report.blocks += blocks.length;


console.log(
`✅ Blocks ${blocks.length}`
);

}




//
// QUIZ
//

if(
lessonData.quiz
){


const {

data:quiz,

error:quizError

}=


await supabase

.from("quizzes")

.insert({

lesson_id:
lesson.id,


title:
lessonData.quiz.title

})

.select()

.single();



if(quizError)
throw quizError;



report.quizzes++;



if(
lessonData.quiz.questions &&
lessonData.quiz.questions.length
){



const questions =

lessonData.quiz.questions.map(
(q,index)=>(


{

quiz_id:
quiz.id,


question:
q.question,


choices:
q.options,


correct_index:
q.correct_index
??
q.options.indexOf(
q.correct
),


explanation:
q.explanation ?? null,


order_number:
index+1


}


));




const {error}

=
await supabase

.from("quiz_questions")

.insert(questions);



if(error)
throw error;



report.questions +=
questions.length;


console.log(
`✅ Questions ${questions.length}`
);


}


}



}


catch(error){

report.errors++;


console.error(
"❌ Erreur:",
error.message
);


}


}







async function importChapter(file){


console.log(
`\n📚 Chapitre : ${file}`
);



const raw =
await fs.readFile(
file,
"utf8"
);



const chapter =
JSON.parse(raw);



if(
!chapter.chapter_id
){

throw new Error(
"chapter_id manquant dans JSON"
);

}




for(
const lesson of chapter.lessons
){

await createLesson(
chapter,
lesson
);

}


}







async function main(){


const files =
await getJsonFiles(
LESSONS_DIR
);



report.files =
files.length;



console.log(
`📂 ${files.length} fichiers JSON trouvés`
);



for(
const file of files
){

await importChapter(file);

}



console.log(`

=========================
 RAPPORT IMPORT V2.3
=========================

Fichiers : ${report.files}

Leçons : ${report.lessons}

Blocks : ${report.blocks}

Exercices : ${report.exercises}

Quiz : ${report.quizzes}

Questions : ${report.questions}

Ignorées : ${report.skipped}

Erreurs : ${report.errors}

=========================

`);

}



main();