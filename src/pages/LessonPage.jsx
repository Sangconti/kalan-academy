// src/pages/LessonPage.jsx

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import {
  getLesson,
  getLessonBlocks
} from "../services/educationService";

import {
  cacheLesson,
  getCachedLesson,
  cacheLessonBlocks,
  getCachedLessonBlocks
} from "../offline/db";

import { useNetwork } from "../hooks/useNetwork";

import {
  ArrowLeft,
  PlayCircle,
  BookOpen,
  Clock,
  CheckCircle2,
  Trophy
} from "lucide-react";

export default function LessonPage() {
  const { lessonId } = useParams();
  const navigate = useNavigate();

  const { isOnline } = useNetwork();

  const [lesson, setLesson] = useState(null);
  const [blocks, setBlocks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadLesson();
  }, [lessonId, isOnline]);

  async function loadLesson() {
    try {
      setLoading(true);
      setError(null);

      let lessonData = null;
      let blockData = [];

      if (isOnline) {
        lessonData = await getLesson(lessonId);

        blockData =
          await getLessonBlocks(lessonId);

        if (lessonData) {
          await cacheLesson(lessonData);
        }

        await cacheLessonBlocks(
          blockData || []
        );
      } else {
        lessonData =
          await getCachedLesson(lessonId);

        blockData =
          await getCachedLessonBlocks(
            lessonId
          );
      }

      setLesson(lessonData);
      setBlocks(blockData || []);
    } catch (err) {
      console.error(
        "Erreur LessonPage:",
        err
      );

      setError(
        err.message ||
        "Impossible de charger la leçon"
      );
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />

          <p className="text-gray-500 font-medium">
            Chargement de la leçon...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6">
        <div className="bg-white rounded-3xl border border-red-100 p-6 text-center">
          <p className="text-red-500 mb-4">
            {error}
          </p>

          <button
            onClick={() => window.location.reload()}
            className="
              px-5
              py-3
              rounded-xl
              bg-blue-600
              text-white
              font-semibold
            "
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">
          Leçon introuvable.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 pb-10 max-w-4xl mx-auto">

      {/* RETOUR */}

      <button
        onClick={() => navigate(-1)}
        className="
          inline-flex
          items-center
          gap-2
          mb-5
          px-4
          py-2.5
          rounded-xl
          bg-white
          border
          border-gray-100
          shadow-sm
          text-gray-700
          font-medium
          hover:text-blue-600
          transition
        "
      >
        <ArrowLeft size={18} />
        Retour aux leçons
      </button>

      {/* HEADER LEÇON */}

      <div
        className="
          relative
          overflow-hidden
          rounded-3xl
          bg-gradient-to-br
          from-blue-600
          via-blue-700
          to-indigo-800
          text-white
          p-6
          md:p-8
          shadow-lg
          mb-7
        "
      >

        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10" />

        <div className="relative z-10">

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 text-blue-50 text-xs font-semibold mb-4">
            <BookOpen size={14} />
            Leçon
          </div>

          <h1 className="text-2xl md:text-3xl font-bold leading-tight">
            {lesson.title}
          </h1>

          {lesson.description && (
            <p className="text-blue-100 mt-3 leading-relaxed">
              {lesson.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 mt-5">

            {lesson.duration_minutes && (
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 text-sm">
                <Clock size={16} />

                {lesson.duration_minutes} min
              </div>
            )}

            {!isOnline && (
              <div className="px-3 py-2 rounded-xl bg-white/10 text-sm">
                📱 Disponible hors ligne
              </div>
            )}

          </div>

          {/* VIDEO */}

          {lesson.video_url && (
            <button
              onClick={() =>
                navigate(`/video/${lesson.id}`)
              }
              className="
                mt-6
                inline-flex
                items-center
                gap-2
                bg-white
                text-blue-700
                px-5
                py-3
                rounded-xl
                font-bold
                shadow-md
                hover:shadow-lg
                hover:-translate-y-0.5
                transition
              "
            >
              <PlayCircle size={21} />

              Voir la vidéo
            </button>
          )}

        </div>

      </div>

      {/* COURS */}

      <div className="mb-7">

        <div className="flex items-center gap-3 mb-5">

          <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
            <BookOpen
              size={22}
              className="text-blue-600"
            />
          </div>

          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">
              Cours
            </h2>

            <p className="text-sm text-gray-500">
              Apprends étape par étape.
            </p>
          </div>

        </div>

        {blocks.length === 0 ? (

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center">
            <BookOpen
              size={38}
              className="mx-auto text-gray-300 mb-3"
            />

            <p className="text-gray-500">
              Aucun contenu disponible.
            </p>
          </div>

        ) : (

          <div className="space-y-4">

            {blocks.map((block, index) => {

              const content =
                typeof block.content === "object"
                  ? block.content?.text
                  : block.content;

              return (
                <article
                  key={block.id}
                  className="
                    bg-white
                    rounded-3xl
                    border
                    border-gray-100
                    shadow-sm
                    overflow-hidden
                  "
                >

                  <div className="p-5 md:p-6">

                    <div className="flex items-start gap-4">

                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold flex-shrink-0">
                        {index + 1}
                      </div>

                      <div className="flex-1">

                        <h3 className="font-bold text-lg text-gray-900">
                          {block.title || "Cours"}
                        </h3>

                        <p className="text-gray-700 mt-3 leading-7 whitespace-pre-line">
                          {content}
                        </p>

                      </div>

                    </div>

                  </div>

                </article>
              );
            })}

          </div>

        )}

      </div>

      {/* QUIZ */}

      <div
        className="
          rounded-3xl
          bg-gradient-to-br
          from-green-500
          to-emerald-700
          text-white
          p-6
          md:p-7
          shadow-lg
        "
      >

        <div className="flex items-start gap-4">

          <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
            <Trophy size={25} />
          </div>

          <div className="flex-1">

            <h2 className="text-xl font-bold">
              Quiz de validation
            </h2>

            <p className="text-green-50 text-sm mt-1">
              Vérifie ce que tu as appris dans cette leçon.
            </p>

            <button
              onClick={() =>
                navigate(`/exercise/${lesson.id}`)
              }
              className="
                mt-5
                inline-flex
                items-center
                gap-2
                bg-white
                text-green-700
                px-5
                py-3
                rounded-xl
                font-bold
                shadow-md
                hover:shadow-lg
                transition
              "
            >
              <CheckCircle2 size={20} />

              Commencer le quiz
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}