import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getCachedVideos,
  getVideoStorage,
  deleteCachedVideo
} from "../offline/video-cache";

import {
  PlayCircle,
  Trash2,
  HardDrive,
  ArrowLeft
} from "lucide-react";

export default function DownloadsPage() {

  const [videos, setVideos] = useState([]);
  const [storage, setStorage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDownloads();
  }, []);

  async function loadDownloads() {

    setLoading(true);

    try {

      const downloaded = await getCachedVideos();

      const used = await getVideoStorage();

      setVideos(downloaded);

      setStorage(used);

    } catch (err) {

      console.error(err);

    } finally {

      setLoading(false);

    }

  }

  async function handleDelete(lessonId) {

    if (!window.confirm("Supprimer cette vidéo téléchargée ?")) {

      return;

    }

    await deleteCachedVideo(lessonId);

    loadDownloads();

  }

  if (loading) {

    return (
      <div className="p-6 text-center">
        Chargement...
      </div>
    );

  }

  return (

    <div className="p-6">

      <Link
        to="/profile"
        className="inline-flex items-center gap-2 text-blue-600 mb-6"
      >
        <ArrowLeft size={18}/>
        Retour
      </Link>

      <div className="flex items-center gap-2 mb-6">

        <HardDrive/>

        <h1 className="text-2xl font-bold">

          Téléchargements

        </h1>

      </div>

      <div className="mb-6">

        <p>

          Stockage utilisé :

          <strong> {storage} MB</strong>

        </p>

      </div>

      {

        videos.length===0 ?

        (

          <div className="bg-white rounded-xl p-8 text-center">

            Aucune vidéo téléchargée.

          </div>

        )

        :

        (

          <div className="space-y-4">

            {

              videos.map(video=>(

                <div
                  key={video.lesson_id}
                  className="bg-white rounded-xl shadow p-4 flex justify-between items-center"
                >

                  <div>

                    <div className="font-semibold">

                      {video.lesson_title || video.lesson_id}

                    </div>

                    <div className="text-sm text-gray-500">

                      {video.size_mb} MB

                    </div>

                  </div>

                  <div className="flex gap-3">

                    <button
                      className="text-green-600"
                    >

                      <PlayCircle/>

                    </button>

                    <button
                      className="text-red-600"
                      onClick={() => handleDelete(video.lesson_id)}
                    >

                      <Trash2/>

                    </button>

                  </div>

                </div>

              ))

            }

          </div>

        )

      }

    </div>

  );

}