import { useMemo, useState } from "react";

import {
  Search,
  Trash2,
  School,
} from "lucide-react";

export default function ClassTable({
  classes = [],
  loading = false,
  onDelete,
}) {

  const [search, setSearch] =
    useState("");


  // =====================================================
  // FILTRAGE + TRI
  // =====================================================

  const filteredClasses =
    useMemo(() => {

      const value =
        search
          .trim()
          .toLowerCase();

      const result =
        [...classes].sort(
          (a, b) =>
            (a.order_number || 999) -
            (b.order_number || 999)
        );


      if (!value) {
        return result;
      }


      return result.filter(
        (item) => {

          const name =
            String(
              item.name || ""
            ).toLowerCase();

          const code =
            String(
              item.code || ""
            ).toLowerCase();

          return (
            name.includes(value) ||
            code.includes(value)
          );
        }
      );

    }, [classes, search]);


  // =====================================================
  // CHARGEMENT
  // =====================================================

  if (loading) {

    return (

      <div
        className="
          p-10
          text-center
          theme-text
        "
      >

        <div
          className="
            inline-block
            w-8
            h-8
            border-4
            theme-border
            border-t-accent
            rounded-full
            animate-spin
          "
        />

        <p className="theme-text-secondary mt-3">
          Chargement des classes...
        </p>

      </div>

    );
  }


  // =====================================================
  // AUCUNE CLASSE
  // =====================================================

  if (classes.length === 0) {

    return (

      <div
        className="
          p-10
          text-center
          theme-text
        "
      >

        <div
          className="
            mx-auto
            w-14
            h-14
            rounded-full
            bg-accent-soft
            flex
            items-center
            justify-center
            text-accent
          "
        >

          <School size={28} />

        </div>


        <h3 className="
          font-semibold
          mt-4
          theme-text
        ">
          Aucune classe
        </h3>


        <p className="
          text-sm
          theme-text-secondary
          mt-1
        ">
          Ajoutez votre première classe.
        </p>

      </div>

    );
  }


  return (

    <div className="theme-text">

      {/* =================================================
          RECHERCHE
      ================================================= */}

      <div
        className="
          p-5
          border-b
          theme-border
        "
      >

        <div className="relative max-w-md">

          <Search
            size={18}
            className="
              absolute
              left-3
              top-1/2
              -translate-y-1/2
              theme-text-secondary
            "
          />

          <input
            type="text"
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            placeholder="Rechercher une classe..."
            className="
              w-full
              border
              theme-border
              theme-surface
              theme-text
              rounded-lg
              pl-10
              pr-3
              py-2.5
              outline-none
              focus:ring-2
              focus:ring-accent
              focus:border-accent
              transition
            "
          />

        </div>

      </div>


      {/* =================================================
          DESKTOP
      ================================================= */}

      <div className="hidden md:block overflow-x-auto">

        <table className="w-full">

          <thead
            className="
              bg-gray-50
              dark:bg-gray-800
              border-b
              theme-border
            "
          >

            <tr>

              <th
                className="
                  text-left
                  px-5
                  py-3
                  text-sm
                  font-semibold
                  theme-text-secondary
                "
              >
                #
              </th>

              <th
                className="
                  text-left
                  px-5
                  py-3
                  text-sm
                  font-semibold
                  theme-text-secondary
                "
              >
                Classe
              </th>

              <th
                className="
                  text-left
                  px-5
                  py-3
                  text-sm
                  font-semibold
                  theme-text-secondary
                "
              >
                Code
              </th>

              <th
                className="
                  text-right
                  px-5
                  py-3
                  text-sm
                  font-semibold
                  theme-text-secondary
                "
              >
                Actions
              </th>

            </tr>

          </thead>


          <tbody
            className="
              divide-y
              theme-border
            "
          >

            {filteredClasses.map(
              (item, index) => (

                <tr
                  key={item.id}
                  className="
                    hover:bg-gray-50
                    dark:hover:bg-gray-800
                    transition
                  "
                >

                  <td
                    className="
                      px-5
                      py-4
                      theme-text-secondary
                    "
                  >

                    {item.order_number ||
                      index + 1}

                  </td>


                  <td className="px-5 py-4">

                    <div className="flex items-center gap-3">

                      <div
                        className="
                          w-10
                          h-10
                          rounded-lg
                          bg-accent-soft
                          text-accent
                          flex
                          items-center
                          justify-center
                        "
                      >

                        <School size={20} />

                      </div>


                      <div>

                        <p className="
                          font-semibold
                          theme-text
                        ">
                          {item.name}
                        </p>

                        <p className="
                          text-xs
                          theme-text-secondary
                        ">
                          Classe scolaire
                        </p>

                      </div>

                    </div>

                  </td>


                  <td className="px-5 py-4">

                    {item.code ? (

                      <span
                        className="
                          inline-flex
                          px-2.5
                          py-1
                          rounded-md
                          bg-gray-100
                          dark:bg-gray-800
                          theme-text
                          text-xs
                          font-semibold
                        "
                      >
                        {item.code}
                      </span>

                    ) : (

                      <span className="
                        theme-text-secondary
                      ">
                        —
                      </span>

                    )}

                  </td>


                  <td className="px-5 py-4">

                    <div className="flex justify-end">

                      <button
                        type="button"
                        onClick={() =>
                          onDelete?.(
                            item.id
                          )
                        }
                        className="
                          p-2
                          rounded-lg
                          bg-red-50
                          dark:bg-red-950/40
                          text-red-600
                          dark:text-red-400
                          hover:bg-red-100
                          dark:hover:bg-red-900/50
                          transition
                        "
                        title="Supprimer"
                      >

                        <Trash2 size={18} />

                      </button>

                    </div>

                  </td>

                </tr>

              )
            )}

          </tbody>

        </table>

      </div>


      {/* =================================================
          MOBILE
      ================================================= */}

      <div
        className="
          md:hidden
          divide-y
          theme-border
        "
      >

        {filteredClasses.map(
          (item, index) => (

            <div
              key={item.id}
              className="
                p-4
                hover:bg-gray-50
                dark:hover:bg-gray-800
                transition
              "
            >

              <div className="flex items-start justify-between">

                <div className="flex items-center gap-3">

                  <div
                    className="
                      w-11
                      h-11
                      rounded-lg
                      bg-accent-soft
                      text-accent
                      flex
                      items-center
                      justify-center
                    "
                  >

                    <School size={21} />

                  </div>


                  <div>

                    <h3 className="
                      font-semibold
                      theme-text
                    ">
                      {item.name}
                    </h3>

                    <p className="
                      text-sm
                      theme-text-secondary
                    ">
                      Code :{" "}
                      {item.code || "—"}
                    </p>

                    <p className="
                      text-xs
                      theme-text-secondary
                    ">
                      Ordre :{" "}
                      {item.order_number ||
                        index + 1}
                    </p>

                  </div>

                </div>


                <button
                  type="button"
                  onClick={() =>
                    onDelete?.(
                      item.id
                    )
                  }
                  className="
                    p-2
                    rounded-lg
                    bg-red-50
                    dark:bg-red-950/40
                    text-red-600
                    dark:text-red-400
                    hover:bg-red-100
                    dark:hover:bg-red-900/50
                    transition
                  "
                >

                  <Trash2 size={18} />

                </button>

              </div>

            </div>

          )
        )}

      </div>


      {/* =================================================
          AUCUN RÉSULTAT
      ================================================= */}

      {filteredClasses.length === 0 &&
        search.trim() !== "" && (

          <div className="
            p-8
            text-center
          ">

            <p className="
              theme-text-secondary
            ">

              Aucune classe ne correspond à «{" "}
              {search}
              »

            </p>

          </div>

        )}

    </div>

  );
}