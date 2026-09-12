// src/pages/DownloadsPage.jsx

import { useEffect, useState } from "react";

import {
  useNavigate,
  useLocation,
  useParams,
} from "react-router-dom";

import {
  getCachedVideos,
  getVideoStorage,
  deleteCachedVideo
} from "../offline/video-cache";

import {
  PlayCircle,
  Trash2,
  HardDrive,
  Download,
  Video,
  Home
} from "lucide-react";


export default function DownloadsPage({
  consultationMode = false,
}) {

  const navigate = useNavigate();

  const location = useLocation();

  const {
    studentId,
  } = useParams();


  // ==========================================
  // MODE CONSULTATION
  // ==========================================

  const isConsultation =
    consultationMode ||
    location.state?.consultationMode === true ||
    (
      Boolean(studentId) &&
      location.pathname.includes("/admin/student/") &&
      location.pathname.includes("/consultation")
    );


  const [videos, setVideos] = useState([]);
  const [storage, setStorage] = useState(0);
  const [loading, setLoading] = useState(true);


  // ==========================================
  // CHARGEMENT
  // ==========================================

  useEffect(() => {
    loadDownloads();
  }, []);


  async function loadDownloads() {

    setLoading(true);

    try {

      const downloaded =
        await getCachedVideos();

      const used =
        await getVideoStorage();

      setVideos(downloaded || []);
      setStorage(used || 0);

    } catch (err) {

      console.error(
        "Erreur chargement téléchargements :",
        err
      );

      setVideos([]);
      setStorage(0);

    } finally {

      setLoading(false);

    }

  }


  // ==========================================
  // SUPPRIMER UNE VIDÉO
  // ==========================================

  async function handleDelete(lessonId) {

    /*
     * IMPORTANT
     *
     * En mode consultation, l'administrateur ne doit
     * pas modifier les téléchargements locaux depuis
     * l'expérience de consultation de l'élève.
     *
     * La suppression est donc interdite.
     */

    if (isConsultation) {
      return;
    }


    if (
      !window.confirm(
        "Supprimer cette vidéo téléchargée ?"
      )
    ) {
      return;
    }


    try {

      await deleteCachedVideo(lessonId);
      await loadDownloads();

    } catch (error) {

      console.error(
        "Erreur suppression vidéo :",
        error
      );

    }

  }


  // ==========================================
  // LIRE UNE VIDÉO
  // ==========================================

  function handlePlay(video) {

    if (!video?.lesson_id) {
      return;
    }


    if (isConsultation && studentId) {

      navigate(
        `/admin/student/${studentId}/consultation/video/${video.lesson_id}`,
        {
          state: {
            consultationMode: true,
          },
        }
      );

      return;
    }


    navigate(
      `/video/${video.lesson_id}`
    );

  }


  // ==========================================
  // RETOUR ACCUEIL
  // ==========================================

  function goHome() {

    if (isConsultation && studentId) {

      navigate(
        `/admin/student/${studentId}/consultation`,
        {
          state: {
            consultationMode: true,
          },
        }
      );

      return;
    }


    navigate("/");

  }


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
        theme-bg
        theme-text
      ">

        <div className="
          w-14
          h-14
          rounded-2xl
          bg-accent-soft
          flex
          items-center
          justify-center
          mb-4
        ">

          <Download
            size={28}
            className="text-accent"
          />

        </div>


        <p className="
          theme-text-secondary
          font-medium
        ">

          Chargement des téléchargements...

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
      theme-bg
      theme-text
      pb-8
    ">


      {/* ======================================
          HEADER
      ====================================== */}

      <div className="
        theme-surface
        border-b
        theme-border
        px-5
        py-4
      ">

        <button
          onClick={goHome}
          className="
            flex
            items-center
            gap-2
            text-xl
            font-bold
            theme-text
            hover:text-accent
            transition
          "
        >

          <span className="
            w-9
            h-9
            rounded-xl
            bg-accent
            text-white
            flex
            items-center
            justify-center
          ">

            🎓

          </span>

          Kalan Academy

        </button>

      </div>


      {/* ======================================
          CONTENU
      ====================================== */}

      <div className="
        max-w-3xl
        mx-auto
        px-5
        py-6
      ">


        {/* TITRE */}

        <div className="
          flex
          items-center
          gap-3
          mb-6
        ">

          <div className="
            w-12
            h-12
            rounded-2xl
            bg-accent-soft
            flex
            items-center
            justify-center
          ">

            <HardDrive
              size={25}
              className="text-accent"
            />

          </div>


          <div>

            <h1 className="
              text-2xl
              font-bold
              theme-text
            ">

              Téléchargements

            </h1>


            <p className="
              text-sm
              theme-text-secondary
              mt-1
            ">

              {isConsultation
                ? "Vidéos disponibles hors ligne sur cet appareil"
                : "Tes vidéos disponibles hors ligne"
              }

            </p>

          </div>

        </div>


        {/* ======================================
            STOCKAGE
        ====================================== */}

        <div className="
          relative
          overflow-hidden
          theme-surface
          rounded-2xl
          shadow-sm
          border
          theme-border
          p-5
          mb-6
        ">

          {/* CERCLES DÉCORATIFS */}

          <div
            className="
              pointer-events-none
              absolute
              inset-0
              overflow-hidden
            "
            aria-hidden="true"
          >

            <div className="
              absolute
              -right-16
              -top-16
              w-48
              h-48
              rounded-full
              bg-accent
              opacity-10
              "
            />

            <div className="
              absolute
              right-10
              -bottom-24
              w-56
              h-56
              rounded-full
              bg-accent
              opacity-5
              "
            />

          </div>


          <div className="
            relative
            z-10
          ">

            <div className="
              flex
              items-center
              justify-between
              mb-3
            ">

              <div className="
                flex
                items-center
                gap-3
              ">

                <div className="
                  w-10
                  h-10
                  rounded-xl
                  bg-green-100
                  dark:bg-green-950/40
                  flex
                  items-center
                  justify-center
                ">

                  <HardDrive
                    size={20}
                    className="text-green-600 dark:text-green-400"
                  />

                </div>


                <div>

                  <p className="
                    text-sm
                    theme-text-secondary
                  ">

                    Stockage utilisé

                  </p>


                  <p className="
                    text-xl
                    font-bold
                    theme-text
                  ">

                    {storage} MB

                  </p>

                </div>

              </div>


              <div className="
                text-right
              ">

                <p className="
                  text-2xl
                  font-bold
                  text-accent
                ">

                  {videos.length}

                </p>


                <p className="
                  text-xs
                  theme-text-secondary
                ">

                  vidéo{videos.length > 1 ? "s" : ""}

                </p>

              </div>

            </div>


            {isConsultation && (

              <p className="
                text-xs
                theme-text-secondary
                mt-3
                pt-3
                border-t
                theme-border
              ">

                Ces téléchargements sont stockés
                localement sur l'appareil utilisé
                pour la consultation.

              </p>

            )}

          </div>

        </div>


        {/* ======================================
            AUCUNE VIDÉO
        ====================================== */}

        {videos.length === 0 ? (

          <div className="
            theme-surface
            rounded-2xl
            shadow-sm
            border
            theme-border
            p-10
            text-center
          ">

            <div className="
              w-16
              h-16
              rounded-2xl
              bg-gray-100
              dark:bg-gray-800
              flex
              items-center
              justify-center
              mx-auto
              mb-4
            ">

              <Video
                size={30}
                className="theme-text-secondary"
              />

            </div>


            <h2 className="
              text-lg
              font-bold
              theme-text
              mb-2
            ">

              Aucun téléchargement

            </h2>


            <p className="
              text-sm
              theme-text-secondary
              max-w-sm
              mx-auto
            ">

              {isConsultation
                ? "Aucune vidéo n'est actuellement disponible hors ligne sur cet appareil."
                : "Les vidéos que tu télécharges pour apprendre hors ligne apparaîtront ici."
              }

            </p>


            <button
              onClick={goHome}
              className="
                mt-6
                inline-flex
                items-center
                gap-2
                bg-accent
                text-white
                px-5
                py-3
                rounded-xl
                font-semibold
                hover:opacity-90
                transition
              "
            >

              <Home size={18} />

              Retour à l'accueil

            </button>

          </div>

        ) : (

          /* ====================================
             LISTE DES VIDÉOS
          ==================================== */

          <div className="
            space-y-4
          ">

            {videos.map((video, index) => (

              <div
                key={video.lesson_id}
                className="
                  theme-surface
                  rounded-2xl
                  shadow-sm
                  border
                  theme-border
                  p-4
                  flex
                  items-center
                  gap-4
                  hover:shadow-md
                  transition
                "
              >

                {/* ICÔNE */}

                <div className="
                  w-14
                  h-14
                  flex-shrink-0
                  rounded-2xl
                  bg-accent-soft
                  flex
                  items-center
                  justify-center
                ">

                  <PlayCircle
                    size={28}
                    className="text-accent"
                  />

                </div>


                {/* INFORMATIONS */}

                <div className="
                  flex-1
                  min-w-0
                ">

                  <h2 className="
                    font-bold
                    theme-text
                    truncate
                  ">

                    {video.lesson_title ||
                      `Leçon ${index + 1}`}

                  </h2>


                  <div className="
                    flex
                    items-center
                    gap-2
                    mt-1
                  ">

                    <Download
                      size={14}
                      className="theme-text-secondary"
                    />

                    <span className="
                      text-sm
                      theme-text-secondary
                    ">

                      Disponible hors ligne

                    </span>

                  </div>


                  <p className="
                    text-xs
                    theme-text-secondary
                    mt-1
                  ">

                    {video.size_mb} MB

                  </p>

                </div>


                {/* ACTIONS */}

                <div className="
                  flex
                  items-center
                  gap-2
                ">

                  <button
                    onClick={() =>
                      handlePlay(video)
                    }
                    className="
                      w-10
                      h-10
                      rounded-xl
                      bg-green-100
                      dark:bg-green-950/40
                      text-green-600
                      dark:text-green-400
                      flex
                      items-center
                      justify-center
                      hover:bg-green-200
                      dark:hover:bg-green-900/50
                      transition
                    "
                    title="Lire"
                  >

                    <PlayCircle
                      size={21}
                    />

                  </button>


                  {!isConsultation && (

                    <button
                      onClick={() =>
                        handleDelete(
                          video.lesson_id
                        )
                      }
                      className="
                        w-10
                        h-10
                        rounded-xl
                        bg-red-50
                        dark:bg-red-950/40
                        text-red-500
                        dark:text-red-400
                        flex
                        items-center
                        justify-center
                        hover:bg-red-100
                        dark:hover:bg-red-900/50
                        transition
                      "
                      title="Supprimer"
                    >

                      <Trash2
                        size={20}
                      />

                    </button>

                  )}

                </div>

              </div>

            ))}

          </div>

        )}

      </div>

    </div>

  );

}