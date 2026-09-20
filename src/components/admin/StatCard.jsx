export default function StatCard({
  title,
  value,
  icon,
  description
}) {
  return (
    <div
      className="
        relative
        overflow-hidden
        rounded-3xl
        bg-accent-soft
        border
        border-accent
        shadow-sm
        p-5
        hover:shadow-lg
        hover:-translate-y-0.5
        transition-all
      "
    >
      {/* Décoration */}
      <div
        className="
          absolute
          -right-8
          -top-8
          w-24
          h-24
          rounded-full
          bg-accent
          opacity-10
        "
      />

      <div
        className="
          absolute
          -left-10
          -bottom-12
          w-28
          h-28
          rounded-full
          bg-accent
          opacity-5
        "
      />

      <div
        className="
          relative
          z-10
          flex
          justify-between
          items-start
          gap-4
        "
      >
        <div className="min-w-0">
          <p
            className="
              text-sm
              font-medium
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
            shrink-0
            w-12
            h-12
            rounded-2xl
            bg-white/70
            dark:bg-gray-950/30
            border
            border-white/50
            dark:border-white/10
            flex
            items-center
            justify-center
            text-accent
            text-2xl
          "
        >
          {icon}
        </div>
      </div>
    </div>
  );
}