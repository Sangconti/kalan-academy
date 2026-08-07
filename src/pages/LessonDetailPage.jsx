import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import supabase from "../lib/supabase";


export default function LessonDetailPage(){

const {id}=useParams();

const [blocks,setBlocks]=useState([]);



useEffect(()=>{


async function load(){


const {data,error}=

await supabase

.from("lesson_blocks")

.select("*")

.eq(
"lesson_id",
id
)

.order(
"order_number"
);



if(error){

console.error(error);

}else{

setBlocks(data);

}


}


load();


},[id]);




return (

<div>


<h1>
Cours
</h1>


{
blocks.map(
block=>(

<div key={block.id}>

<h2>
{block.title}
</h2>


<p>
{block.content}
</p>


</div>


)
)
}


</div>

);


}