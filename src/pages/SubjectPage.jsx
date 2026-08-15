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

import {
  ArrowLeft,
  BookOpen,
  ArrowRight,
  Loader2
} from "lucide-react";

import { db } from "../offline/db";


export default function SubjectPage() {

  const { subjectId } = useParams();

  const location = useLocation();

  const navigate = useNavigate();


  const [subject, setSubject] =
    useState(null);

  const [chapters, setChapters] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // =====================================================
  // CHARGEMENT
  // =====================================================

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


        setSubject(
          currentSubject
        );


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


        setChapters(
          chaptersData
        );


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

  }, [
    subjectId,
    location.state
  ]);


  // =====================================================
  // ICÔNE MATIÈRE
  // =====================================================

  function getSubjectIcon(
    subjectName
  ) {

    const name =
      String(
        subjectName || ""
      ).toLowerCase();


    if (
      name.includes("math")
    ) {

      return "📐";

    }


    if (
      name.includes("physique") ||
      name.includes("chimie")
    ) {

      return "⚗️";

    }


    if (
      name.includes("biologie") ||
      name.includes("bio")
    ) {

      return "🧬";

    }


    return "📚";

  }


  // =====================================================
  // OUVRIR CHAPITRE
  // =====================================================

  function openChapter(
    chapter
  ) {

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

      <div className="
        min-h-[60vh]
        flex
        items-center
        justify-center
        px-4
      ">

        <div className="
          text-center
        ">

          <div className="
            w-12
            h-12
            mx-auto
            mb-4
            rounded-full
            border-4
            border-accent-soft
            border-t-accent
            animate-spin
          " />


          <p className="
            theme-text-secondary
            font-medium
          ">

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

      <div className="
        px-4
        py-6
      ">

        <button
          onClick={goBack}
          className="
            mb-5
            flex
            items-center
            gap-2
            theme-text-secondary
            font-medium
            hover:text-accent
            transition
          "
        >

          <ArrowLeft
            size={18}
          />

          Retour

        </button>


        <div className="
          max-w-lg
          mx-auto
          bg-red-50
          dark:bg-red-950/40
          border
          border-red-200
          dark:border-red-900
          rounded-3xl
          p-6
        ">

          <div className="
            flex
            items-start
            gap-3
          ">

            <div className="
              text-2xl
            ">
              ⚠️
            </div>


            <div>

              <h2 className="
                font-bold
                text-red-800
                dark:text-red-300
              ">

                Impossible de charger la matière

              </h2>


              <p className="
                text-sm
                text-red-700
                dark:text-red-400
                mt-1
              ">

                {error}

              </p>

            </div>

          </div>


          <button
            onClick={() =>
              window.location.reload()
            }
            className="
              mt-5
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
  // ICÔNE
  // =====================================================

  const subjectIcon =
    getSubjectIcon(
      subject?.name
    );


  // =====================================================
  // AFFICHAGE
  // =====================================================

  return (

    <div className="
      min-h-screen
      theme-bg
      px-4
      py-5
      pb-24
    ">


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
          theme-text-secondary
          font-semibold
          hover:text-accent
          transition
          active:scale-95
        "
      >

        <div className="
          w-9
          h-9
          rounded-full
          theme-surface
          shadow-sm
          border
          theme-border
          flex
          items-center
          justify-center
        ">

          <ArrowLeft
            size={18}
          />

        </div>


        <span>
          Retour aux matières
        </span>

      </button>


      {/* =================================================
          HEADER MATIÈRE
      ================================================= */}

      <div className="
        relative
        overflow-hidden
        theme-surface
        rounded-3xl
        border
        theme-border
        shadow-sm
        p-6
        mb-7
      ">


        {/* CERCLES DÉCORATIFS */}

        <div className="
          absolute
          -right-12
          -top-12
          w-36
          h-36
          rounded-full
          bg-accent
          opacity-10
        " />


        <div className="
          absolute
          -left-10
          -bottom-14
          w-28
          h-28
          rounded-full
          bg-accent
          opacity-10
        " />


        <div className="
          relative
          z-10
        ">

          <div className="
            flex
            items-start
            gap-4
          ">


            {/* ICÔNE */}

            <div className="
              w-16
              h-16
              shrink-0
              rounded-2xl
              bg-accent-soft
              flex
              items-center
              justify-center
              text-3xl
            ">

              {subjectIcon}

            </div>


            {/* TITRE */}

            <div className="
              flex-1
              min-w-0
            ">

              <p className="
                text-sm
                font-semibold
                text-accent
                mb-1
              ">

                Matière

              </p>


              <h1 className="
                text-2xl
                md:text-3xl
                font-extrabold
                theme-text
                leading-tight
              ">

                {subject?.name}

              </h1>


              {subject?.description && (

                <p className="
                  text-sm
                  theme-text-secondary
                  mt-2
                  leading-relaxed
                ">

                  {subject.description}

                </p>

              )}

            </div>

          </div>


          {/* STATISTIQUES */}

          <div className="
            mt-6
            pt-4
            border-t
            theme-border
            flex
            items-center
            justify-between
            gap-4
          ">


            <div>

              <p className="
                text-xs
                theme-text-secondary
                font-medium
                uppercase
                tracking-wide
              ">

                Programme

              </p>


              <p className="
                theme-text
                font-bold
                mt-1
              ">

                Mali • 7ème année

              </p>

            </div>


            <div className="
              text-right
            ">

              <p className="
                text-xs
                theme-text-secondary
                font-medium
                uppercase
                tracking-wide
              ">

                Chapitres

              </p>


              <p className="
                font-bold
                text-accent
                text-lg
                mt-1
              ">

                {chapters.length}

              </p>

            </div>

          </div>

        </div>

      </div>


      {/* =================================================
          TITRE CHAPITRES
      ================================================= */}

      <div className="
        flex
        items-center
        justify-between
        mb-5
      ">

        <div>

          <div className="
            flex
            items-center
            gap-3
          ">

            <div className="
              w-11
              h-11
              rounded-xl
              bg-accent-soft
              flex
              items-center
              justify-center
            ">

              <BookOpen
                size={21}
                className="text-accent"
              />

            </div>


            <div>

              <h2 className="
                text-xl
                md:text-2xl
                font-bold
                theme-text
              ">

                Chapitres

              </h2>


              <p className="
                text-sm
                theme-text-secondary
                mt-1
              ">

                Choisis un chapitre pour continuer.

              </p>

            </div>

          </div>

        </div>


        {chapters.length > 0 && (

          <span className="
            shrink-0
            ml-3
            px-3
            py-1.5
            rounded-full
            bg-accent-soft
            text-accent
            text-xs
            font-bold
          ">

            {chapters.length}

          </span>

        )}

      </div>


      {/* =================================================
          AUCUN CHAPITRE
      ================================================= */}

      {chapters.length === 0 ? (

        <div className="
          theme-surface
          rounded-3xl
          border
          theme-border
          p-8
          text-center
          shadow-sm
        ">

          <div className="
            w-14
            h-14
            mx-auto
            mb-4
            rounded-2xl
            bg-accent-soft
            flex
            items-center
            justify-center
          ">

            <BookOpen
              size={28}
              className="text-accent"
            />

          </div>


          <h3 className="
            font-bold
            theme-text
          ">

            Aucun chapitre disponible

          </h3>


          <p className="
            text-sm
            theme-text-secondary
            mt-1
          ">

            Aucun chapitre n'est disponible
            pour cette matière.

          </p>

        </div>

      ) : (


        /* =================================================
           CHAPITRES
        ================================================= */

        <div className="
          space-y-4
        ">

          {chapters.map(
            (chapter, index) => (

              <button
                key={chapter.id}
                onClick={() =>
                  openChapter(chapter)
                }
                className="
                  group
                  relative
                  w-full
                  overflow-hidden
                  theme-surface
                  rounded-3xl
                  border
                  theme-border
                  shadow-sm
                  p-5
                  text-left
                  transition-all
                  duration-200
                  hover:shadow-lg
                  hover:-translate-y-0.5
                  active:scale-[0.98]
                  hover:border-accent
                "
              >


                {/* BARRE ACCENT */}

                <div className="
                  absolute
                  left-0
                  top-0
                  bottom-0
                  w-1
                  bg-accent
                  opacity-70
                " />


                <div className="
                  flex
                  items-start
                  gap-4
                ">


                  {/* NUMÉRO */}

                  <div className="
                    w-12
                    h-12
                    shrink-0
                    rounded-xl
                    bg-accent-soft
                    text-accent
                    flex
                    items-center
                    justify-center
                    font-extrabold
                    text-lg
                  ">

                    {String(
                      index + 1
                    ).padStart(2, "0")}

                  </div>


                  {/* CONTENU */}

                  <div className="
                    flex-1
                    min-w-0
                  ">

                    <p className="
                      text-xs
                      font-bold
                      text-accent
                      uppercase
                      tracking-wide
                      mb-1
                    ">

                      Chapitre {index + 1}

                    </p>


                    <h3 className="
                      text-lg
                      font-bold
                      theme-text
                      leading-snug
                    ">

                      {chapter.title}

                    </h3>


                    {chapter.description ? (

                      <p className="
                        text-sm
                        theme-text-secondary
                        mt-2
                        leading-relaxed
                      ">

                        {chapter.description}

                      </p>

                    ) : (

                      <p className="
                        text-sm
                        theme-text-secondary
                        mt-2
                      ">

                        Découvre les leçons
                        de ce chapitre.

                      </p>

                    )}

                  </div>


                  {/* FLÈCHE */}

                  <div className="
                    w-10
                    h-10
                    shrink-0
                    rounded-full
                    bg-accent-soft
                    flex
                    items-center
                    justify-center
                    text-accent
                    group-hover:bg-accent
                    group-hover:text-white
                    transition
                  ">

                    <ArrowRight
                      size={19}
                    />

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