export default function StatCard({
  title,
  value,
  icon,
  description
}) {

  return (

    <div
      className="
        theme-surface
        theme-border
        border

        rounded-2xl

        shadow-sm

        p-5

        hover:shadow-md

        transition
      "
    >

      <div
        className="
          flex
          justify-between
          items-start
        "
      >

        <div>

          <p
            className="
              text-sm
              theme-text-secondary
            "
          >
            {title}
          </p>


          <h2
            className="
              text-3xl
              font-bold
              mt-2
              theme-text
            "
          >
            {value ?? "..."}
          </h2>


          <p
            className="
              text-xs
              theme-text-secondary
              mt-2
            "
          >
            {description}
          </p>

        </div>


        <div
          className="
            text-accent
            text-3xl
          "
        >
          {icon}
        </div>


      </div>


    </div>

  );

}