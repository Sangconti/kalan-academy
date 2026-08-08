// src/pages/DownloadsPage.jsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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

export default function DownloadsPage() {

  const navigate = useNavigate();

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

    navigate(
      `/video/${video.lesson_id}`
    );
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
      ">

        <div className="
          w-14
          h-14
          rounded-2xl
          bg-blue-100
          flex
          items-center
          justify-center
          mb-4
        ">

          <Download
            size={28}
            className="text-blue-600"
          />

        </div>

        <p className="
          text-gray-600
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

        <button
          onClick={() => navigate("/")}
          className="
            flex
            items-center
            gap-2
            text-xl
            font-bold
            text-gray-900
            hover:text-blue-600
            transition
          "
        >

          <span className="
            w-9
            h-9
            rounded-xl
            bg-blue-600
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
            bg-blue-100
            flex
            items-center
            justify-center
          ">

            <HardDrive
              size={25}
              className="text-blue-600"
            />

          </div>


          <div>

            <h1 className="
              text-2xl
              font-bold
              text-gray-900
            ">

              Téléchargements

            </h1>

            <p className="
              text-sm
              text-gray-500
              mt-1
            ">

              Tes vidéos disponibles hors ligne

            </p>

          </div>

        </div>


        {/* ======================================
            STOCKAGE
        ====================================== */}

        <div className="
          bg-white
          rounded-2xl
          shadow-sm
          border
          border-gray-100
          p-5
          mb-6
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
                flex
                items-center
                justify-center
              ">

                <HardDrive
                  size={20}
                  className="text-green-600"
                />

              </div>


              <div>

                <p className="
                  text-sm
                  text-gray-500
                ">

                  Stockage utilisé

                </p>

                <p className="
                  text-xl
                  font-bold
                  text-gray-900
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
                text-blue-600
              ">

                {videos.length}

              </p>

              <p className="
                text-xs
                text-gray-500
              ">

                vidéo{videos.length > 1 ? "s" : ""}

              </p>

            </div>

          </div>

        </div>


        {/* ======================================
            AUCUNE VIDÉO
        ====================================== */}

        {videos.length === 0 ? (

          <div className="
            bg-white
            rounded-2xl
            shadow-sm
            border
            border-gray-100
            p-10
            text-center
          ">

            <div className="
              w-16
              h-16
              rounded-2xl
              bg-gray-100
              flex
              items-center
              justify-center
              mx-auto
              mb-4
            ">

              <Video
                size={30}
                className="text-gray-400"
              />

            </div>


            <h2 className="
              text-lg
              font-bold
              text-gray-800
              mb-2
            ">

              Aucun téléchargement

            </h2>


            <p className="
              text-sm
              text-gray-500
              max-w-sm
              mx-auto
            ">

              Les vidéos que tu télécharges
              pour apprendre hors ligne
              apparaîtront ici.

            </p>


            <button
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
                  bg-white
                  rounded-2xl
                  shadow-sm
                  border
                  border-gray-100
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
                  bg-blue-100
                  flex
                  items-center
                  justify-center
                ">

                  <PlayCircle
                    size={28}
                    className="text-blue-600"
                  />

                </div>


                {/* INFORMATIONS */}

                <div className="
                  flex-1
                  min-w-0
                ">

                  <h2 className="
                    font-bold
                    text-gray-900
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
                      className="text-gray-400"
                    />

                    <span className="
                      text-sm
                      text-gray-500
                    ">

                      Disponible hors ligne

                    </span>

                  </div>


                  <p className="
                    text-xs
                    text-gray-400
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
                      text-green-600
                      flex
                      items-center
                      justify-center
                      hover:bg-green-200
                      transition
                    "
                    title="Lire"
                  >

                    <PlayCircle
                      size={21}
                    />

                  </button>


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
                      text-red-500
                      flex
                      items-center
                      justify-center
                      hover:bg-red-100
                      transition
                    "
                    title="Supprimer"
                  >

                    <Trash2
                      size={20}
                    />

                  </button>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>

    </div>

  );
}
