// src/pages/LessonDetailPage.jsx

import {
  useEffect,
  useState
} from "react";

import {
  useParams,
  useNavigate
} from "react-router-dom";

import {
  getLesson
} from "../services/educationService";

import {
  ArrowLeft,
  BookOpen,
  Loader2
} from "lucide-react";



export default function LessonDetailPage() {

  const { id } = useParams();

  const navigate = useNavigate();

  const [lesson, setLesson] = useState(null);

  const [blocks, setBlocks] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");



  // ==========================================
  // CHARGEMENT DE LA LEÇON
  // ==========================================

  useEffect(() => {

    let cancelled = false;

    async function loadLesson() {

      try {

        setLoading(true);

        setError("");

        if (!id) {

          throw new Error(
            "Identifiant de la leçon introuvable."
          );

        }



        console.log(
          "========== LESSON DETAIL =========="
        );

        console.log(
          "LESSON ID :",
          id
        );



        // ======================================
        // EDUCATION SERVICE
        // ======================================

        const lessonData =
          await getLesson(id);



        if (cancelled) {
          return;
        }



        if (!lessonData) {

          throw new Error(
            "Leçon introuvable."
          );

        }



        console.log(
          "LEÇON CHARGÉE :",
          lessonData
        );



        setLesson(
          lessonData
        );



        // ======================================
        // BLOCS
        // ======================================

        const lessonBlocks =
          lessonData.lesson_blocks ||
          lessonData.lessonBlocks ||
          lessonData.blocks ||
          [];



        const normalizedBlocks =
          (lessonBlocks || [])
            .sort(
              (a, b) =>
                Number(
                  a.order_number || 0
                ) -
                Number(
                  b.order_number || 0
                )
            )
            .map(
              (block, index) => ({

                ...block,

                order_number:
                  block.order_number ||
                  index + 1

              })
            );



        console.log(
          "BLOCS LEÇON :",
          normalizedBlocks
        );



        setBlocks(
          normalizedBlocks
        );



      } catch (err) {

        console.error(
          "Erreur chargement leçon :",
          err
        );



        if (!cancelled) {

          setError(
            err.message ||
            "Impossible de charger la leçon."
          );

        }



      } finally {

        if (!cancelled) {

          setLoading(false);

        }

      }

    }



    loadLesson();



    return () => {

      cancelled = true;

    };

  }, [id]);



  // ==========================================
  // NORMALISER LE CONTENU
  // ==========================================

  function renderContent(content) {

    if (
      content === null ||
      content === undefined
    ) {

      return "";

    }



    if (
      typeof content === "string"
    ) {

      return content;

    }



    if (
      typeof content === "object"
    ) {

      if (
        typeof content.text === "string"
      ) {

        return content.text;

      }



      if (
        typeof content.content === "string"
      ) {

        return content.content;

      }



      try {

        return JSON.stringify(
          content,
          null,
          2
        );

      } catch {

        return "";

      }

    }



    return String(content);

  }



  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {

    return (

      <div
        className="
          min-h-[60vh]
          flex
          flex-col
          items-center
          justify-center
          px-6
        "
      >

        <Loader2
          size={32}
          className="
            text-blue-600
            animate-spin
            mb-4
          "
        />

        <p
          className="
            text-gray-500
            font-medium
          "
        >

          Chargement de la leçon...

        </p>

      </div>

    );

  }



  // ==========================================
  // ERREUR
  // ==========================================

  if (error || !lesson) {

    return (

      <div
        className="
          min-h-[60vh]
          flex
          items-center
          justify-center
          px-5
        "
      >

        <div
          className="
            w-full
            max-w-md
            bg-white
            rounded-2xl
            border
            border-gray-100
            shadow-sm
            p-6
            text-center
          "
        >

          <div
            className="
              w-14
              h-14
              mx-auto
              mb-4
              rounded-2xl
              bg-red-50
              flex
              items-center
              justify-center
            "
          >

            <BookOpen
              size={28}
              className="text-red-500"
            />

          </div>



          <h2
            className="
              text-lg
              font-bold
              text-gray-900
            "
          >

            Leçon introuvable

          </h2>



          <p
            className="
              text-sm
              text-gray-500
              mt-2
            "
          >

            {error ||
              "Cette leçon n'est pas disponible."}

          </p>



          <button
            type="button"
            onClick={() =>
              navigate(-1)
            }
            className="
              mt-5
              inline-flex
              items-center
              justify-center
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

            Retour

          </button>

        </div>

      </div>

    );

  }



  // ==========================================
  // AFFICHAGE
  // ==========================================

  return (

    <div
      className="
        max-w-3xl
        mx-auto
        px-5
        py-6
        pb-10
      "
    >

      {/* ====================================
          RETOUR
      ==================================== */}

      <button
        type="button"
        onClick={() =>
          navigate(-1)
        }
        className="
          flex
          items-center
          gap-2
          text-sm
          font-medium
          text-gray-600
          hover:text-blue-600
          transition
          mb-5
        "
      >

        <ArrowLeft
          size={18}
        />

        Retour

      </button>



      {/* ====================================
          EN-TÊTE
      ==================================== */}

      <div
        className="
          bg-white
          rounded-2xl
          border
          border-gray-100
          shadow-sm
          p-6
          mb-6
        "
      >

        <div
          className="
            w-12
            h-12
            rounded-2xl
            bg-blue-50
            flex
            items-center
            justify-center
            mb-4
          "
        >

          <BookOpen
            size={25}
            className="text-blue-600"
          />

        </div>



        <p
          className="
            text-sm
            font-medium
            text-blue-600
            mb-1
          "
        >

          Kalan Academy

        </p>



        <h1
          className="
            text-2xl
            md:text-3xl
            font-bold
            text-gray-900
          "
        >

          {lesson.title ||
            "Cours"}

        </h1>



        {lesson.description && (

          <p
            className="
              text-gray-500
              mt-2
              leading-relaxed
            "
          >

            {lesson.description}

          </p>

        )}

      </div>



      {/* ====================================
          BLOCS DE LA LEÇON
      ==================================== */}

      {blocks.length === 0 ? (

        <div
          className="
            bg-white
            rounded-2xl
            border
            border-gray-100
            shadow-sm
            p-8
            text-center
          "
        >

          <BookOpen
            size={34}
            className="
              mx-auto
              text-gray-300
              mb-3
            "
          />

          <h2
            className="
              font-bold
              text-gray-800
            "
          >

            Aucun contenu disponible

          </h2>



          <p
            className="
              text-sm
              text-gray-500
              mt-1
            "
          >

            Le contenu de cette leçon
            n'est pas encore disponible.

          </p>

        </div>

      ) : (

        <div
          className="
            space-y-4
          "
        >

          {blocks.map(
            (block, index) => (

              <article
                key={
                  block.id ||
                  `${id}-${index}`
                }
                className="
                  bg-white
                  rounded-2xl
                  border
                  border-gray-100
                  shadow-sm
                  p-5
                "
              >

                {/* NUMÉRO */}

                <div
                  className="
                    flex
                    items-start
                    gap-3
                    mb-4
                  "
                >

                  <div
                    className="
                      shrink-0
                      w-9
                      h-9
                      rounded-xl
                      bg-blue-50
                      text-blue-600
                      flex
                      items-center
                      justify-center
                      font-bold
                      text-sm
                    "
                  >

                    {index + 1}

                  </div>



                  <div
                    className="
                      flex-1
                    "
                  >

                    {block.title && (

                      <h2
                        className="
                          text-lg
                          font-bold
                          text-gray-900
                        "
                      >

                        {block.title}

                      </h2>

                    )}

                  </div>

                </div>



                {/* CONTENU */}

                <div
                  className="
                    text-gray-700
                    leading-7
                    whitespace-pre-line
                  "
                >

                  {renderContent(
                    block.content
                  )}

                </div>

              </article>

            )
          )}

        </div>

      )}

    </div>

  );

}