export default function StatCard({
  title,
  value,
  icon,
  description
}) {

return (

<div className="
bg-white
rounded-2xl
shadow-sm
border
p-5
hover:shadow-md
transition
">


<div className="
flex
justify-between
items-start
">


<div>

<p className="
text-sm
text-gray-500
">
{title}
</p>


<h2 className="
text-3xl
font-bold
mt-2
">
{value ?? "..."}
</h2>


<p className="
text-xs
text-gray-400
mt-2
">
{description}
</p>


</div>


<div className="
text-indigo-600
text-3xl
">
{icon}
</div>


</div>


</div>

)

}