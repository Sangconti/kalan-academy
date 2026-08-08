// src/pages/CoursesPage.jsx

import {
  useEffect,
  useState
} from "react";

import {
  useNavigate
} from "react-router-dom";

import {
  getClasses
} from "../services/educationService";

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  GraduationCap
} from "lucide-react";

export default function CoursesPage() {

  const navigate = useNavigate();

  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);


  // ==========================================
  // CHARGEMENT DES CLASSES
  // ==========================================

  useEffect(() => {

    async function loadClasses() {

      try {

        const data =
          await getClasses();

        setClasses(data || []);

      } catch (error) {

        console.error(
          "Erreur chargement des cours :",
          error
        );

        setClasses([]);

      } finally {

        setLoading(false);

      }

    }

    loadClasses();

  }, []);


  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {

    return (

      <div className="
        min-h-[60vh]
        flex
        flex-col
        items-center
        justify-center
        px-6
      ">

        <div className="
          w-14
          h-14
          rounded-2xl
          bg-blue-50
          flex
          items-center
          justify-center
          mb-4
        ">

          <GraduationCap
            size={28}
            className="text-blue-600"
          />

        </div>


        <p className="
          text-gray-600
          font-medium
        ">

          Chargement des cours...

        </p>

      </div>

    );

  }


  // ==========================================
  // INTERFACE
  // ==========================================

  return (

    <div className="
      min-h-screen
      bg-gray-50
      pb-8
    ">


      {/* ======================================
          HEADER
      ====================================== */}

      <div className="
        bg-white
        border-b
        border-gray-100
        px-5
        py-4
      ">

        <div className="
          max-w-5xl
          mx-auto
          flex
          items-center
          justify-between
          gap-4
        ">


          {/* LOGO */}

          <button
            type="button"
            onClick={() => navigate("/")}
            className="
              flex
              items-center
              gap-3
              group
            "
          >

            <div className="
              w-10
              h-10
              rounded-xl
              bg-blue-600
              text-white
              flex
              items-center
              justify-center
              shadow-sm
              group-hover:bg-blue-700
              transition
            ">

              <GraduationCap
                size={23}
              />

            </div>


            <div className="text-left">

              <p className="
                text-base
                font-bold
                text-gray-900
                leading-none
              ">

                Kalan Academy

              </p>

              <p className="
                text-xs
                text-gray-500
                mt-1
              ">

                Apprendre. Progresser. Réussir.

              </p>

            </div>

          </button>


          {/* RETOUR */}

          <button
            type="button"
            onClick={() => navigate("/")}
            className="
              hidden
              sm:flex
              items-center
              gap-2
              text-sm
              font-medium
              text-gray-500
              hover:text-blue-600
              transition
            "
          >

            <ArrowLeft
              size={17}
            />

            Accueil

          </button>

        </div>

      </div>


      {/* ======================================
          CONTENU
      ====================================== */}

      <main className="
        max-w-5xl
        mx-auto
        px-5
        py-7
      ">


        {/* ====================================
            EN-TÊTE
        ==================================== */}

        <div className="
          flex
          items-start
          justify-between
          gap-4
          mb-7
        ">

          <div>

            <p className="
              text-sm
              font-medium
              text-blue-600
              mb-1
            ">

              Kalan Academy

            </p>


            <h1 className="
              text-2xl
              md:text-3xl
              font-bold
              text-gray-900
            ">

              Mes cours

            </h1>


            <p className="
              text-gray-500
              mt-2
              max-w-xl
            ">

              Choisis ton niveau scolaire pour
              accéder à tes matières et à tes leçons.

            </p>

          </div>


          <div className="
            hidden
            sm:flex
            w-12
            h-12
            rounded-2xl
            bg-blue-50
            items-center
            justify-center
            shrink-0
          ">

            <BookOpen
              size={24}
              className="text-blue-600"
            />

          </div>

        </div>


        {/* ====================================
            AUCUNE CLASSE
        ==================================== */}

        {classes.length === 0 ? (

          <div className="
            bg-white
            rounded-3xl
            border
            border-gray-100
            shadow-sm
            p-10
            text-center
          ">

            <div className="
              w-16
              h-16
              rounded-2xl
              bg-gray-50
              mx-auto
              mb-4
              flex
              items-center
              justify-center
            ">

              <GraduationCap
                size={32}
                className="text-gray-400"
              />

            </div>


            <h2 className="
              text-lg
              font-bold
              text-gray-800
            ">

              Aucun cours disponible

            </h2>


            <p className="
              text-sm
              text-gray-500
              mt-2
              max-w-sm
              mx-auto
            ">

              Les classes disponibles apparaîtront
              ici dès qu'elles seront ajoutées.

            </p>


            <button
              type="button"
              onClick={() => navigate("/")}
              className="
                mt-6
                inline-flex
                items-center
                gap-2
                bg-blue-600
                text-white
                px-5
                py-3
                rounded-xl
                font-semibold
                hover:bg-blue-700
                transition
              "
            >

              <ArrowLeft
                size={18}
              />

              Retour à l'accueil

            </button>

          </div>

        ) : (


          /* ==================================
             LISTE DES CLASSES
          ================================== */

          <div className="
            grid
            grid-cols-1
            sm:grid-cols-2
            lg:grid-cols-3
            gap-4
          ">

            {classes.map(
              (classe, index) => (

                <button
                  key={classe.id}
                  type="button"
                  onClick={() =>
                    navigate(
                      `/class/${classe.id}`
                    )
                  }
                  className="
                    group
                    relative
                    overflow-hidden
                    bg-white
                    rounded-3xl
                    border
                    border-gray-100
                    p-5
                    md:p-6
                    text-left
                    shadow-sm
                    hover:shadow-xl
                    hover:-translate-y-1
                    transition-all
                  "
                >


                  {/* BARRE SUPÉRIEURE */}

                  <div
                    className={`
                      absolute
                      left-0
                      right-0
                      top-0
                      h-1.5
                      ${
                        index % 3 === 0
                          ? "bg-blue-600"
                          : index % 3 === 1
                          ? "bg-purple-600"
                          : "bg-green-600"
                      }
                    `}
                  />


                  {/* ICÔNE + FLÈCHE */}

                  <div className="
                    flex
                    items-start
                    justify-between
                    gap-4
                  ">

                    <div
                      className={`
                        w-14
                        h-14
                        rounded-2xl
                        flex
                        items-center
                        justify-center
                        ${
                          index % 3 === 0
                            ? "bg-blue-50 text-blue-600"
                            : index % 3 === 1
                            ? "bg-purple-50 text-purple-600"
                            : "bg-green-50 text-green-600"
                        }
                      `}
                    >

                      <GraduationCap
                        size={28}
                      />

                    </div>


                    <ArrowRight
                      size={21}
                      className="
                        text-gray-300
                        group-hover:text-blue-600
                        group-hover:translate-x-1
                        transition
                      "
                    />

                  </div>


                  {/* NOM */}

                  <h2 className="
                    mt-5
                    text-xl
                    font-bold
                    text-gray-900
                  ">

                    {classe.name}

                  </h2>


                  {/* DESCRIPTION */}

                  {classe.description && (

                    <p className="
                      text-sm
                      text-gray-500
                      mt-2
                      leading-relaxed
                      line-clamp-2
                    ">

                      {classe.description}

                    </p>

                  )}


                  {/* ACTION */}

                  <div className="
                    mt-5
                    flex
                    items-center
                    justify-between
                  ">

                    <span className="
                      text-sm
                      font-semibold
                      text-blue-600
                    ">

                      Voir les matières

                    </span>


                    <span className="
                      text-xs
                      font-medium
                      text-gray-400
                    ">

                      Commencer →

                    </span>

                  </div>

                </button>

              )
            )}

          </div>

        )}

      </main>

    </div>

  );

}
