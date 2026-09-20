// src/pages/DownloadsPage.jsx

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
  useLocation,
  useParams,
} from "react-router-dom";

import {
  getCachedVideos,
  getVideoStorage,
  deleteCachedVideo,
} from "../offline/video-cache";

import {
  PlayCircle,
  Trash2,
  HardDrive,
  Download,
  Video,
  Home,
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
  // PROTECTION CONTRE LES DOUBLES CHARGEMENTS
  // ==========================================

  const mountedRef = useRef(true);
  const loadingRequestRef = useRef(null);


  useEffect(() => {

    mountedRef.current = true;

    loadDownloads();

    return () => {
      mountedRef.current = false;
    };

  }, []);


  // ==========================================
  // CHARGEMENT
  // ==========================================

  async function loadDownloads() {

    // Évite deux chargements simultanés.
    if (loadingRequestRef.current) {
      return loadingRequestRef.current;
    }


    const request = (async () => {

      if (mountedRef.current) {
        setLoading(true);
      }


      try {

        /*
         * Les deux lectures Dexie sont lancées
         * en parallèle.
         *
         * Cela évite d'attendre la fin de la première
         * lecture avant de commencer la seconde.
         */
        const [
          downloaded,
          used,
        ] = await Promise.all([
          getCachedVideos(),
          getVideoStorage(),
        ]);


        if (!mountedRef.current) {
          return;
        }


        setVideos(downloaded || []);
        setStorage(used || 0);

      } catch (err) {

        console.error(
          "Erreur chargement téléchargements :",
          err
        );


        if (!mountedRef.current) {
          return;
        }


        setVideos([]);
        setStorage(0);

      } finally {

        if (mountedRef.current) {
          setLoading(false);
        }

      }

    })();


    loadingRequestRef.current = request;


    try {
      await request;
    } finally {

      if (loadingRequestRef.current === request) {
        loadingRequestRef.current = null;
      }

    }


    return request;

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
          CONTENU
      ====================================== */}

      <div className="
        max-w-3xl
        mx-auto
        px-5
        py-6
      ">


        {/* ======================================
            EN-TÊTE
        ====================================== */}

        <div
          className="
            relative
            overflow-hidden
            rounded-3xl
            bg-accent-soft
            border
            border-accent
            p-6
            md:p-8
            shadow-lg
            mb-7
          "
        >

          {/* CERCLES DÉCORATIFS */}

          <div
            className="
              absolute
              -right-10
              -top-10
              w-40
              h-40
              rounded-full
              bg-accent
              opacity-10
            "
          />


          <div
            className="
              absolute
              -left-16
              -bottom-20
              w-48
              h-48
              rounded-full
              bg-accent
              opacity-10
            "
          />


          <div
            className="
              absolute
              right-16
              -bottom-24
              w-56
              h-56
              rounded-full
              bg-accent
              opacity-5
            "
          />


          <div
            className="
              relative
              z-10
            "
          >

            {/* BADGE */}

            <div
              className="
                inline-flex
                items-center
                gap-2
                px-3
                py-1.5
                rounded-full
                bg-accent
                text-white
                text-xs
                font-semibold
                mb-4
              "
            >

              <HardDrive size={14} />

              {isConsultation
                ? "Consultation"
                : "Hors connexion"
              }

            </div>


            {/* TITRE */}

            <h1
              className="
                text-2xl
                md:text-3xl
                font-bold
                leading-tight
                theme-text
              "
            >
              Téléchargements
            </h1>


            {/* DESCRIPTION */}

            <p
              className="
                theme-text-secondary
                mt-3
                leading-relaxed
                max-w-2xl
              "
            >
              {isConsultation
                ? "Vidéos disponibles hors ligne sur cet appareil."
                : "Retrouve ici tes vidéos disponibles hors ligne."
              }
            </p>


            {/* INFORMATIONS */}

            <div
              className="
                flex
                flex-wrap
                items-center
                gap-3
                mt-5
              "
            >

              <div
                className="
                  inline-flex
                  items-center
                  gap-2
                  px-3
                  py-2
                  rounded-xl
                  bg-white/70
                  dark:bg-gray-950/30
                  theme-text
                  text-sm
                  font-medium
                  border
                  border-white/50
                  dark:border-white/10
                "
              >

                <Download
                  size={16}
                  className="text-accent"
                />

                {videos.length} vidéo
                {videos.length > 1 ? "s" : ""}

              </div>


              <div
                className="
                  inline-flex
                  items-center
                  gap-2
                  px-3
                  py-2
                  rounded-xl
                  bg-white/70
                  dark:bg-gray-950/30
                  theme-text
                  text-sm
                  font-medium
                  border
                  border-white/50
                  dark:border-white/10
                "
              >

                <HardDrive
                  size={16}
                  className="text-accent"
                />

                {storage} MB

              </div>

            </div>

          </div>

        </div>


        {/* ======================================
            STOCKAGE
        ====================================== */}

        <div className="
          relative
          overflow-hidden
          bg-accent-soft
          rounded-3xl
          shadow-sm
          border
          border-accent
          p-5
          md:p-6
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
            " />


            <div className="
              absolute
              -left-20
              -bottom-24
              w-48
              h-48
              rounded-full
              bg-accent
              opacity-10
            " />


            <div className="
              absolute
              right-10
              -bottom-24
              w-56
              h-56
              rounded-full
              bg-accent
              opacity-5
            " />

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
                  rounded-2xl
                  bg-white/70
                  dark:bg-gray-950/30
                  border
                  border-white/50
                  dark:border-white/10
                  flex
                  items-center
                  justify-center
                ">

                  <HardDrive
                    size={20}
                    className="text-accent"
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
                border-white/50
                dark:border-white/10
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
            rounded-3xl
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
              bg-accent-soft
              flex
              items-center
              justify-center
              mx-auto
              mb-4
            ">

              <Video
                size={30}
                className="text-accent"
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
                shadow-md
                hover:opacity-90
                hover:-translate-y-0.5
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
                  rounded-3xl
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
                      bg-accent-soft
                      text-accent
                      border
                      border-accent
                      flex
                      items-center
                      justify-center
                      hover:opacity-80
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
                        text-red-600
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
