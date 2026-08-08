// =====================================================
// src/components/VideoPlayer.jsx
// =====================================================

import {
  useEffect,
  useRef,
  useState
} from "react";

import {
  Play,
  Pause,
  RotateCcw
} from "lucide-react";


export function VideoPlayer({
  src,
  lessonId,
  onProgress
}) {

  const videoRef =
    useRef(null);


  const [isPlaying, setIsPlaying] =
    useState(false);

  const [progress, setProgress] =
    useState(0);

  const [duration, setDuration] =
    useState(0);


  // =====================================================
  // CHARGEMENT / SAUVEGARDE POSITION
  // =====================================================

  useEffect(() => {

    const video =
      videoRef.current;


    if (!video) return;


    const storageKey =
      `video-pos-${lessonId}`;


    const saved =
      localStorage.getItem(
        storageKey
      );


    if (saved) {

      const savedPosition =
        parseFloat(saved);


      if (
        Number.isFinite(
          savedPosition
        )
      ) {

        video.currentTime =
          savedPosition;

      }

    }


    // ===================================================
    // TEMPS DE LECTURE
    // ===================================================

    function handleTimeUpdate() {

      const current =
        video.currentTime;


      setProgress(current);


      localStorage.setItem(
        storageKey,
        String(current)
      );


      if (onProgress) {

        onProgress(current);

      }

    }


    // ===================================================
    // MÉTADONNÉES
    // ===================================================

    function handleLoadedMetadata() {

      setDuration(
        Number.isFinite(
          video.duration
        )
          ? video.duration
          : 0
      );

    }


    // ===================================================
    // PLAY
    // ===================================================

    function handlePlay() {

      setIsPlaying(true);

    }


    // ===================================================
    // PAUSE
    // ===================================================

    function handlePause() {

      setIsPlaying(false);

    }


    // ===================================================
    // FIN
    // ===================================================

    function handleEnded() {

      setIsPlaying(false);

    }


    video.addEventListener(
      "timeupdate",
      handleTimeUpdate
    );


    video.addEventListener(
      "loadedmetadata",
      handleLoadedMetadata
    );


    video.addEventListener(
      "play",
      handlePlay
    );


    video.addEventListener(
      "pause",
      handlePause
    );


    video.addEventListener(
      "ended",
      handleEnded
    );


    return () => {

      video.removeEventListener(
        "timeupdate",
        handleTimeUpdate
      );


      video.removeEventListener(
        "loadedmetadata",
        handleLoadedMetadata
      );


      video.removeEventListener(
        "play",
        handlePlay
      );


      video.removeEventListener(
        "pause",
        handlePause
      );


      video.removeEventListener(
        "ended",
        handleEnded
      );

    };

  }, [
    lessonId,
    onProgress,
    src
  ]);


  // =====================================================
  // PLAY / PAUSE
  // =====================================================

  async function togglePlay() {

    const video =
      videoRef.current;


    if (!video) return;


    try {

      if (video.paused) {

        await video.play();

      } else {

        video.pause();

      }

    } catch (error) {

      console.error(
        "Erreur lecture vidéo :",
        error
      );

    }

  }


  // =====================================================
  // RESTART
  // =====================================================

  async function restart() {

    const video =
      videoRef.current;


    if (!video) return;


    video.currentTime = 0;


    localStorage.removeItem(
      `video-pos-${lessonId}`
    );


    try {

      await video.play();

    } catch (error) {

      console.error(
        "Erreur redémarrage vidéo :",
        error
      );

    }

  }


  // =====================================================
  // FORMATAGE DU TEMPS
  // =====================================================

  function formatTime(value) {

    if (
      !Number.isFinite(value) ||
      value <= 0
    ) {

      return "0:00";

    }


    const minutes =
      Math.floor(
        value / 60
      );


    const seconds =
      Math.floor(
        value % 60
      )
        .toString()
        .padStart(2, "0");


    return `${minutes}:${seconds}`;

  }


  // =====================================================
  // POURCENTAGE
  // =====================================================

  const progressPercent =
    duration > 0
      ? Math.min(
          Math.max(
            (progress / duration) * 100,
            0
          ),
          100
        )
      : 0;


  // =====================================================
  // AFFICHAGE
  // =====================================================

  return (

    <div className="
      w-full
      bg-black
      rounded-2xl
      overflow-hidden
      shadow-lg
    ">


      {/* VIDÉO */}

      <video
        ref={videoRef}
        src={src}
        className="
          w-full
          aspect-video
          bg-black
          object-contain
        "
        playsInline
        preload="metadata"
      />


      {/* CONTRÔLES */}

      <div className="
        bg-white
        p-4
      ">


        {/* BARRE DE PROGRESSION */}

        <div className="
          w-full
          h-2
          bg-gray-200
          rounded-full
          overflow-hidden
          mb-3
        ">

          <div
            className="
              h-full
              bg-blue-600
              transition-all
            "
            style={{
              width:
                `${progressPercent}%`
            }}
          />

        </div>


        {/* COMMANDES */}

        <div className="
          flex
          items-center
          justify-between
          gap-3
        ">


          <div className="
            flex
            items-center
            gap-2
          ">


            {/* PLAY / PAUSE */}

            <button
              type="button"
              onClick={togglePlay}
              className="
                w-10
                h-10
                rounded-full
                bg-blue-600
                text-white
                flex
                items-center
                justify-center
                hover:bg-blue-700
                transition
                active:scale-95
              "
              aria-label={
                isPlaying
                  ? "Pause"
                  : "Lecture"
              }
            >

              {isPlaying ? (

                <Pause size={18} />

              ) : (

                <Play size={18} />

              )}

            </button>


            {/* RESTART */}

            <button
              type="button"
              onClick={restart}
              className="
                w-10
                h-10
                rounded-full
                bg-gray-100
                text-gray-700
                flex
                items-center
                justify-center
                hover:bg-gray-200
                transition
                active:scale-95
              "
              aria-label="Recommencer"
            >

              <RotateCcw size={18} />

            </button>

          </div>


          {/* TEMPS */}

          <span className="
            text-sm
            font-medium
            text-gray-600
            font-mono
          ">

            {formatTime(progress)}

            {" / "}

            {formatTime(duration)}

          </span>


        </div>

      </div>

    </div>

  );

}


export default VideoPlayer;