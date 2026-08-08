// src/pages/SubjectPage.jsx

import { useEffect, useState } from "react";
import {
  useParams,
  useLocation,
  useNavigate
} from "react-router-dom";

import {
  getSubjects,
  getChapters
} from "../services/educationService";

import { db } from "../offline/db";

export default function SubjectPage() {
  const { subjectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [subject, setSubject] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  console.log(
    "================================="
  );

  console.log(
    "📘 SUBJECT PAGE"
  );

  console.log(
    "SUBJECT ID :",
    subjectId
  );

  console.log(
    "ONLINE :",
    navigator.onLine
  );

  console.log(
    "================================="
  );

  useEffect(() => {
    let cancelled = false;

    async function loadSubject() {
      try {
        setLoading(true);
        setError("");

        if (!subjectId) {
          throw new Error(
            "Identifiant matière manquant"
          );
        }

        // =================================================
        // 1. RÉCUPÉRER LA MATIÈRE
        // =================================================

        let currentSubject = null;

        // PRIORITÉ DEXIE

        currentSubject =
          await db.subjects.get(
            subjectId
          );

        console.log(
          "📘 SUBJECT DEXIE :",
          currentSubject
        );

        // SI PAS TROUVÉE → SERVICE

        if (!currentSubject) {
          const classId =
            location.state?.class_id;

          if (classId) {
            const subjects =
              await getSubjects(
                classId
              );

            currentSubject =
              (subjects || []).find(
                (subject) =>
                  String(subject.id) ===
                  String(subjectId)
              );
          }
        }

        if (!currentSubject) {
          throw new Error(
            "Matière introuvable"
          );
        }

        if (cancelled) return;

        setSubject(currentSubject);

        console.log(
          "✅ MATIÈRE CHARGÉE :",
          currentSubject.name
        );

        // =================================================
        // 2. RÉCUPÉRER LES CHAPITRES
        // =================================================

        let chaptersData = [];

        // =================================================
        // OFFLINE
        // =================================================

        if (!navigator.onLine) {
          console.log(
            "📴 MODE OFFLINE"
          );

          chaptersData =
            await db.chapters
              .where("subject_id")
              .equals(subjectId)
              .toArray();

          console.log(
            "📦 CHAPITRES DEXIE DIRECT :",
            chaptersData
          );
        }

        // =================================================
        // ONLINE
        // =================================================

        else {
          try {
            chaptersData =
              await getChapters(
                subjectId
              );

            console.log(
              "🌐 CHAPITRES SERVICE :",
              chaptersData
            );
          } catch (err) {
            console.warn(
              "⚠️ Erreur service chapitres, fallback Dexie",
              err
            );

            chaptersData =
              await db.chapters
                .where("subject_id")
                .equals(subjectId)
                .toArray();
          }
        }

        // =================================================
        // 3. SÉCURITÉ
        // =================================================

        chaptersData =
          (chaptersData || [])
            .filter(
              (chapter) =>
                String(
                  chapter.subject_id
                ) ===
                String(subjectId)
            )
            .sort(
              (a, b) =>
                (a.order_number || 0) -
                (b.order_number || 0)
            );

        console.log(
          "📚 CHAPITRES APRÈS FILTRE :",
          chaptersData
        );

        console.log(
          "📚 NOMBRE FINAL CHAPITRES :",
          chaptersData.length
        );

        if (cancelled) return;

        setChapters(chaptersData);
      } catch (err) {
        console.error(
          "❌ ERREUR SUBJECT PAGE :",
          err
        );

        if (!cancelled) {
          setError(
            err.message ||
              "Impossible de charger la matière"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSubject();

    return () => {
      cancelled = true;
    };
  }, [subjectId, location.state]);

  // =====================================================
  // OUVRIR CHAPITRE
  // =====================================================

  function openChapter(chapter) {
    console.log(
      "📖 OUVERTURE CHAPITRE :",
      chapter
    );

    navigate(
      `/chapter/${chapter.id}`,
      {
        state: {
          subject_id: subjectId,
          class_id: subject?.class_id,
          chapter_id: chapter.id
        }
      }
    );
  }

  // =====================================================
  // RETOUR
  // =====================================================

  function goBack() {
    navigate(-1);
  }

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center">

          <div className="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin" />

          <p className="text-gray-600 font-medium">
            Chargement de la matière...
          </p>

        </div>
      </div>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error) {
    return (
      <div className="px-4 py-6">

        <button
          onClick={goBack}
          className="
            mb-5
            flex
            items-center
            gap-2
            text-gray-600
            font-medium
            hover:text-blue-600
            transition
          "
        >
          <span className="text-xl">
            ←
          </span>

          Retour
        </button>

        <div className="max-w-lg mx-auto bg-red-50 border border-red-200 rounded-2xl p-5">

          <div className="flex items-start gap-3">

            <div className="text-2xl">
              ⚠️
            </div>

            <div>
              <h2 className="font-bold text-red-800">
                Impossible de charger la matière
              </h2>

              <p className="text-sm text-red-700 mt-1">
                {error}
              </p>
            </div>

          </div>

          <button
            onClick={() =>
              window.location.reload()
            }
            className="
              mt-4
              w-full
              py-3
              rounded-xl
              bg-red-600
              text-white
              font-semibold
              active:scale-[0.98]
              transition
            "
          >
            Réessayer
          </button>

        </div>

      </div>
    );
  }

  // =====================================================
  // AFFICHAGE
  // =====================================================

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-5 pb-24">

      {/* =================================================
          RETOUR
      ================================================= */}

      <button
        onClick={goBack}
        className="
          flex
          items-center
          gap-2
          mb-5
          text-gray-600
          font-semibold
          hover:text-blue-600
          transition
          active:scale-95
        "
      >
        <span
          className="
            w-9
            h-9
            rounded-full
            bg-white
            shadow-sm
            border
            border-gray-100
            flex
            items-center
            justify-center
            text-xl
          "
        >
          ←
        </span>

        <span>
          Retour aux matières
        </span>
      </button>

      {/* =================================================
          HEADER MATIÈRE
      ================================================= */}

      <div
        className="
          bg-white
          rounded-3xl
          border
          border-gray-100
          shadow-sm
          p-6
          mb-6
        "
      >

        <div className="flex items-start gap-4">

          {/* ICÔNE */}

          <div
            className="
              w-16
              h-16
              shrink-0
              rounded-2xl
              bg-blue-50
              flex
              items-center
              justify-center
              text-3xl
            "
          >
            📐
          </div>

          {/* TITRE */}

          <div className="flex-1 min-w-0">

            <p className="text-sm font-semibold text-blue-600 mb-1">
              Matière
            </p>

            <h1 className="text-2xl font-extrabold text-gray-900">
              {subject?.name}
            </h1>

            {subject?.description && (
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                {subject.description}
              </p>
            )}

          </div>

        </div>

        {/* STATISTIQUE */}

        <div
          className="
            mt-5
            pt-4
            border-t
            border-gray-100
            flex
            items-center
            justify-between
          "
        >

          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
              Programme
            </p>

            <p className="font-bold text-gray-800 mt-1">
              Mali • 7ème année
            </p>
          </div>

          <div className="text-right">

            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
              Chapitres
            </p>

            <p className="font-bold text-blue-600 text-lg mt-1">
              {chapters.length}
            </p>

          </div>

        </div>

      </div>

      {/* =================================================
          TITRE CHAPITRES
      ================================================= */}

      <div className="mb-4">

        <div className="flex items-center justify-between">

          <div>
            <h2 className="text-xl font-extrabold text-gray-900">
              📚 Chapitres
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Choisis un chapitre pour continuer ton apprentissage.
            </p>
          </div>

          {chapters.length > 0 && (
            <span
              className="
                shrink-0
                ml-3
                px-3
                py-1
                rounded-full
                bg-blue-50
                text-blue-700
                text-xs
                font-bold
              "
            >
              {chapters.length}
            </span>
          )}

        </div>

      </div>

      {/* =================================================
          CHAPITRES
      ================================================= */}

      {chapters.length === 0 ? (
        <div
          className="
            bg-white
            rounded-2xl
            border
            border-gray-200
            p-6
            text-center
            shadow-sm
          "
        >

          <div className="text-4xl mb-3">
            📚
          </div>

          <h3 className="font-bold text-gray-800">
            Aucun chapitre disponible
          </h3>

          <p className="text-sm text-gray-500 mt-1">
            Aucun chapitre n'est disponible pour cette matière.
          </p>

        </div>
      ) : (
        <div className="space-y-4">

          {chapters.map(
            (chapter, index) => (
              <button
                key={chapter.id}
                onClick={() =>
                  openChapter(chapter)
                }
                className="
                  group
                  w-full
                  bg-white
                  rounded-2xl
                  border
                  border-gray-100
                  shadow-sm
                  p-5
                  text-left
                  transition-all
                  duration-200
                  hover:shadow-lg
                  hover:-translate-y-0.5
                  active:scale-[0.98]
                "
              >

                <div className="flex items-start gap-4">

                  {/* NUMÉRO */}

                  <div
                    className="
                      w-12
                      h-12
                      shrink-0
                      rounded-xl
                      bg-blue-50
                      text-blue-700
                      flex
                      items-center
                      justify-center
                      font-extrabold
                      text-lg
                    "
                  >
                    {String(
                      index + 1
                    ).padStart(2, "0")}
                  </div>

                  {/* CONTENU */}

                  <div className="flex-1 min-w-0">

                    <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-1">
                      Chapitre {index + 1}
                    </p>

                    <h3 className="text-lg font-bold text-gray-900 leading-snug">
                      {chapter.title}
                    </h3>

                    {chapter.description && (
                      <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                        {chapter.description}
                      </p>
                    )}

                  </div>

                  {/* FLÈCHE */}

                  <div
                    className="
                      w-10
                      h-10
                      shrink-0
                      rounded-full
                      bg-gray-50
                      flex
                      items-center
                      justify-center
                      text-gray-400
                      group-hover:bg-blue-50
                      group-hover:text-blue-600
                      transition
                    "
                  >
                    <span className="text-xl">
                      →
                    </span>
                  </div>

                </div>

              </button>
            )
          )}

        </div>
      )}

    </div>
  );
}