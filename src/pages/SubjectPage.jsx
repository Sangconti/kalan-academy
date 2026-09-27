// src/pages/SubjectPage.jsx

import { useEffect, useState } from "react";

import {
  useParams,
  useLocation,
  useNavigate
} from "react-router-dom";

import { supabase } from "../lib/supabase";

import {
  ArrowLeft,
  BookOpen,
  ArrowRight
} from "lucide-react";

import { db } from "../offline/db";


export default function SubjectPage() {

  const {
    subjectId,
    studentId
  } = useParams();

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

  const [isOnline, setIsOnline] =
    useState(
      typeof navigator !== "undefined"
        ? navigator.onLine
        : true
    );


  // =====================================================
  // MODE CONSULTATION
  // =====================================================

  const isConsultation =
    location.pathname.includes("/admin/student/") &&
    location.pathname.includes("/consultation") &&
    Boolean(studentId);


  // =====================================================
  // MODE APERÇU APPLICATION ÉLÈVE
  // =====================================================

  const isStudentPreview =
    location.pathname.startsWith(
      "/admin/student-preview"
    );


  // =====================================================
  // DÉTECTION RÉSEAU LOCALE
  // =====================================================

  useEffect(() => {

    function handleOnline() {

      setIsOnline(true);

    }


    function handleOffline() {

      setIsOnline(false);

    }


    window.addEventListener(
      "online",
      handleOnline
    );

    window.addEventListener(
      "offline",
      handleOffline
    );


    return () => {

      window.removeEventListener(
        "online",
        handleOnline
      );

      window.removeEventListener(
        "offline",
        handleOffline
      );

    };

  }, []);


  // =====================================================
  // CHARGEMENT
  // =====================================================

  useEffect(() => {

    let cancelled = false;


    async function loadSubject() {

      try {

        setError("");


        if (!subjectId) {

          throw new Error(
            "Identifiant matière manquant"
          );

        }


        // =================================================
        // 1. RÉCUPÉRER LA MATIÈRE DEPUIS DEXIE
        // =================================================

        let currentSubject =
          await db.subjects.get(
            subjectId
          );


        console.log(
          "📘 SUBJECT DEXIE :",
          currentSubject
        );


        // =================================================
        // 2. SI ABSENTE → SUPABASE DIRECT
        // =================================================

        if (!currentSubject) {

          if (!navigator.onLine) {

            throw new Error(
              "Matière introuvable hors ligne"
            );

          }


          console.log(
            "🌐 [SUBJECT] Matière absente de Dexie → Supabase"
          );


          const {
            data,
            error: subjectError
          } = await supabase
            .from("subjects")
            .select("*")
            .eq("id", subjectId)
            .maybeSingle();


          if (subjectError) {

            throw subjectError;

          }


          currentSubject =
            data || null;


          if (currentSubject) {

            await db.subjects.put(
              currentSubject
            );


            console.log(
              "📦 [SUBJECT] Matière mise en cache"
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
        // 3. CHARGER LES CHAPITRES DEPUIS DEXIE
        // =================================================

        const cachedChapters =
          await db.chapters
            .where("subject_id")
            .equals(subjectId)
            .toArray();


        const normalizedCachedChapters =
          (cachedChapters || [])
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


        // =================================================
        // 4. CACHE DISPONIBLE
        // =================================================
        //
        // IMPORTANT :
        //
        // On affiche immédiatement Dexie.
        // On ne bloque PAS l'interface avec Supabase.
        //
        // =================================================

        if (
          normalizedCachedChapters.length > 0
        ) {

          console.log(
            "📦 [SUBJECT] Chapitres trouvés dans Dexie :",
            normalizedCachedChapters.length
          );


          if (!cancelled) {

            setChapters(
              normalizedCachedChapters
            );

            setLoading(false);

          }


          // =================================================
          // ACTUALISATION EN ARRIÈRE-PLAN
          // =================================================

          if (navigator.onLine) {

            refreshChaptersInBackground();

          }


          return;

        }


        // =================================================
        // 5. CACHE VIDE
        // =================================================

        console.log(
          "📭 [SUBJECT] Aucun chapitre dans Dexie"
        );


        if (!navigator.onLine) {

          if (!cancelled) {

            setChapters([]);

            setLoading(false);

          }

          return;

        }


        // =================================================
        // 6. PREMIER CHARGEMENT → SUPABASE
        // =================================================

        console.log(
          "🌐 [SUBJECT] Cache vide → chargement direct Supabase"
        );


        const {
          data,
          error: chaptersError
        } = await supabase
          .from("chapters")
          .select("*")
          .eq(
            "subject_id",
            subjectId
          )
          .order(
            "order_number",
            {
              ascending: true
            }
          );


        if (chaptersError) {

          throw chaptersError;

        }


        const freshChapters =
          Array.isArray(data)
            ? data
            : [];


        // =================================================
        // 7. MISE EN CACHE
        // =================================================

        if (
          freshChapters.length > 0
        ) {

          await db.chapters.bulkPut(
            freshChapters
          );


          console.log(
            "📦 [SUBJECT] Chapitres Supabase mis en cache :",
            freshChapters.length
          );

        }


        if (cancelled) return;


        const finalChapters =
          freshChapters
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


        setChapters(
          finalChapters
        );


        setLoading(false);


      } catch (err) {

        console.error(
          "❌ ERREUR SUBJECT PAGE :",
          err
        );


        if (!cancelled) {

          // =================================================
          // FALLBACK DEXIE
          // =================================================

          try {

            const fallbackChapters =
              await db.chapters
                .where("subject_id")
                .equals(subjectId)
                .toArray();


            const sortedFallback =
              (fallbackChapters || [])
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


            if (
              sortedFallback.length > 0
            ) {

              console.log(
                "📦 [SUBJECT] Fallback Dexie :",
                sortedFallback.length
              );


              setChapters(
                sortedFallback
              );

              setLoading(false);

              return;

            }

          } catch (cacheError) {

            console.error(
              "❌ [SUBJECT] Erreur fallback Dexie :",
              cacheError
            );

          }


          setError(
            err?.message ||
            "Impossible de charger la matière"
          );

          setLoading(false);

        }

      }

    }


    // =====================================================
    // ACTUALISATION EN ARRIÈRE-PLAN
    // =====================================================

    async function refreshChaptersInBackground() {

      try {

        console.log(
          "🔄 [SUBJECT] Actualisation des chapitres en arrière-plan"
        );


        const {
          data,
          error: chaptersError
        } = await supabase
          .from("chapters")
          .select("*")
          .eq(
            "subject_id",
            subjectId
          )
          .order(
            "order_number",
            {
              ascending: true
            }
          );


        if (chaptersError) {

          throw chaptersError;

        }


        const freshChapters =
          Array.isArray(data)
            ? data
            : [];


        if (
          freshChapters.length > 0
        ) {

          await db.chapters.bulkPut(
            freshChapters
          );

        }


        if (cancelled) return;


        const sortedFreshChapters =
          freshChapters
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


        setChapters(
          sortedFreshChapters
        );


        console.log(
          "✅ [SUBJECT] Chapitres actualisés en arrière-plan :",
          sortedFreshChapters.length
        );


      } catch (err) {

        console.warn(
          "⚠️ [SUBJECT] Actualisation arrière-plan échouée → conservation du cache",
          err
        );

      }

    }


    loadSubject();


    return () => {

      cancelled = true;

    };

  }, [
    subjectId,
    isOnline
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


    if (!chapter?.id) {

      console.error(
        "❌ Chapitre invalide :",
        chapter
      );

      return;

    }


    console.log(
      "👁️ CONSULTATION :",
      isConsultation
    );

    console.log(
      "👁️ APERÇU APPLICATION ÉLÈVE :",
      isStudentPreview
    );


    // ===================================================
    // MODE CONSULTATION
    // ===================================================

    if (isConsultation) {

      navigate(
        `/admin/student/${studentId}/consultation/chapter/${chapter.id}`,
        {
          state: {
            subject_id: subjectId,
            class_id: subject?.class_id,
            chapter_id: chapter.id
          }
        }
      );

      return;

    }


    // ===================================================
    // MODE APERÇU APPLICATION ÉLÈVE
    // ===================================================

    if (isStudentPreview) {

      navigate(
        `/admin/student-preview/chapter/${chapter.id}`,
        {
          state: {
            subject_id: subjectId,
            class_id: subject?.class_id,
            chapter_id: chapter.id
          }
        }
      );

      return;

    }


    // ===================================================
    // MODE ÉLÈVE NORMAL
    // ===================================================

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

   // ---------------------------------------------------
   // MODE CONSULTATION
   // ---------------------------------------------------

   if (isConsultation) {

     if (subject?.class_id) {

       navigate(
         `/admin/student/${studentId}/consultation/class/${subject.class_id}`
       );

       return;
     }

     navigate(-1);

     return;
   }


   // ---------------------------------------------------
   // MODE APERÇU APPLICATION ÉLÈVE
   // ---------------------------------------------------

   if (isStudentPreview) {

     if (subject?.class_id) {

       navigate(
         `/admin/student-preview/class/${subject.class_id}`
       );

       return;
     }

     navigate(
       "/admin/student-preview"
     );

     return;
   }


   // ---------------------------------------------------
   // MODE ÉLÈVE NORMAL
   // ---------------------------------------------------

   if (subject?.class_id) {

     navigate(
       `/class/${subject.class_id}`
     );

     return;
   }


   // ---------------------------------------------------
   // FALLBACK
   // ---------------------------------------------------

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
            inline-flex
            items-center
            gap-2
            mb-5
            px-4
            py-2.5
            rounded-xl
            theme-surface
            border
            theme-border
            shadow-sm
            theme-text
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
          inline-flex
          items-center
          gap-2
          mb-5
          px-4
          py-2.5
          rounded-xl
          theme-surface
          border
          theme-border
          shadow-sm
          theme-text
          font-medium
          hover:text-accent
          transition
        "
      >

        <ArrowLeft
          size={18}
        />

        Retour aux matières

      </button>


      {/* =================================================
          HEADER MATIÈRE
      ================================================= */}

      <div className="
        relative
        overflow-hidden
        rounded-3xl
        bg-accent-soft
        border
        border-accent
        shadow-lg
        p-6
        md:p-8
        mb-7
      ">


        {/* CERCLES DÉCORATIFS */}

        <div className="
          absolute
          -right-10
          -top-10
          w-40
          h-40
          rounded-full
          bg-accent
          opacity-10
        " />


        <div className="
          absolute
          -left-16
          -bottom-20
          w-48
          h-48
          rounded-full
          bg-accent
          opacity-10
        " />


        <div className="
          absolute
          right-16
          -bottom-24
          w-56
          h-56
          rounded-full
          bg-accent
          opacity-5
        " />


        <div className="
          relative
          z-10
        ">


          {/* CONTENU PRINCIPAL */}

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
              bg-white/70
              dark:bg-gray-950/30
              border
              border-white/50
              dark:border-white/10
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

              <div className="
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
                mb-3
              ">

                <BookOpen
                  size={14}
                />

                Matière

              </div>


              <h1 className="
                text-2xl
                md:text-3xl
                font-bold
                leading-tight
                theme-text
              ">

                {subject?.name}

              </h1>


              {subject?.description && (

                <p className="
                  theme-text-secondary
                  mt-3
                  leading-relaxed
                ">

                  {subject.description}

                </p>

              )}

            </div>

          </div>


          {/* INFORMATIONS */}

          <div className="
            mt-6
            flex
            flex-wrap
            items-center
            gap-3
          ">


            {/* PROGRAMME */}

            <div className="
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
            ">

              <BookOpen
                size={16}
                className="text-accent"
              />

              Mali • 7ème année

            </div>


            {/* CHAPITRES */}

            <div className="
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
            ">

              <BookOpen
                size={16}
                className="text-accent"
              />

              {chapters.length} chapitre
              {chapters.length > 1 ? "s" : ""}

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