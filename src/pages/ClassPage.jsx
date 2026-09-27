// src/pages/ClassPage.jsx

import {
  useEffect,
  useState
} from "react";

import {
  useParams,
  useNavigate,
  useLocation
} from "react-router-dom";

import {
  supabase
} from "../lib/supabase";

import {
  getCachedSubjects,
  cacheSubjects
} from "../offline/db";

import {
  ArrowLeft,
  ArrowRight,
  BookOpen
} from "lucide-react";


export default function ClassPage() {

  const { classId, studentId } = useParams();

  const navigate = useNavigate();
  const location = useLocation();

  const [subjects, setSubjects] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // =====================================================
  // 🌐 ÉTAT RÉSEAU DU NAVIGATEUR
  // =====================================================

  const [isOnline, setIsOnline] =
    useState(
      typeof navigator !== "undefined"
        ? navigator.onLine
        : true
    );


  useEffect(() => {

    const handleOnline = () => {
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };


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
  // RETOUR À L'ACCUEIL
  // =====================================================

  function goHome() {

    if (isConsultation) {

      navigate(
        `/admin/student/${studentId}/consultation`
      );

      return;
    }


    if (isStudentPreview) {

      navigate(
        "/admin/student-preview"
      );

      return;
    }


    navigate("/");
  }


  // =====================================================
  // CHARGEMENT DES MATIÈRES
  // =====================================================

  useEffect(() => {

    let cancelled = false;


    async function loadSubjects() {

      try {

        setLoading(true);
        setError("");


        if (!classId) {

          throw new Error(
            "Classe introuvable"
          );

        }


        // =================================================
        // 📦 DEXIE TOUJOURS EN PREMIER
        // =================================================
        //
        // Tous les modes utilisent la même priorité :
        //
        // 1. Dexie
        // 2. Si cache disponible → aucun réseau
        // 3. Si cache absent :
        //    - hors ligne → Dexie uniquement
        //    - en ligne → Supabase
        //
        // Aucun appel à educationService.isOnline()
        // Aucun HEAD /rest/v1/
        // =================================================

        console.log(
          isConsultation
            ? "👁️ [CONSULTATION] Chargement matières depuis Dexie :"
            : isStudentPreview
              ? "👁️ [APERÇU] Chargement matières depuis Dexie :"
              : "📦 [ÉLÈVE] Chargement matières depuis Dexie :",
          classId
        );


        const cachedSubjects =
          await getCachedSubjects(
            classId
          );


        if (cancelled) {
          return;
        }


        // =================================================
        // 📦 CACHE DISPONIBLE
        // =================================================

        if (
          Array.isArray(cachedSubjects) &&
          cachedSubjects.length > 0
        ) {

          console.log(
            isConsultation
              ? "📦 [CONSULTATION] Matières trouvées dans Dexie"
              : isStudentPreview
                ? "📦 [APERÇU] Matières trouvées dans Dexie"
                : "📦 [ÉLÈVE] Matières trouvées dans Dexie"
          );


          if (!cancelled) {

            setSubjects(
              cachedSubjects
            );

          }


          return;

        }


        // =================================================
        // 📭 CACHE VIDE
        // =================================================

        console.log(
          isConsultation
            ? "📭 [CONSULTATION] Aucune matière en cache"
            : isStudentPreview
              ? "📭 [APERÇU] Aucune matière en cache"
              : "📭 [ÉLÈVE] Aucune matière en cache"
        );


        // =================================================
        // 📴 CACHE VIDE + HORS LIGNE
        // =================================================

        if (!navigator.onLine) {

          console.log(
            isConsultation
              ? "📴 [CONSULTATION] Cache vide et hors ligne"
              : isStudentPreview
                ? "📴 [APERÇU] Cache vide et hors ligne"
                : "📴 [ÉLÈVE] Cache vide et hors ligne"
          );


          if (!cancelled) {

            setSubjects([]);

          }


          return;

        }


        // =================================================
        // 🌐 CACHE VIDE + EN LIGNE
        // =================================================

        console.log(
          isConsultation
            ? "🌐 [CONSULTATION] Matières absentes de Dexie → Supabase"
            : isStudentPreview
              ? "🌐 [APERÇU] Matières absentes de Dexie → Supabase"
              : "🌐 [ÉLÈVE] Matières absentes de Dexie → Supabase"
        );


        const {
          data,
          error: subjectsError
        } = await supabase
          .from("subjects")
          .select("*")
          .eq("class_id", classId);


        if (subjectsError) {
          throw subjectsError;
        }


        if (cancelled) {
          return;
        }


        const filtered =
          (data || []).filter(
            subject =>
              String(subject.class_id) ===
              String(classId)
          );


        // =================================================
        // 💾 MISE EN CACHE
        // =================================================

        if (
          filtered.length > 0
        ) {

          await cacheSubjects(
            filtered
          );


          if (cancelled) {
            return;
          }

        }


        if (!cancelled) {

          setSubjects(
            filtered
          );

        }


      } catch (err) {

        if (cancelled) {
          return;
        }


        console.error(
          "Erreur chargement matières :",
          err
        );


        // =================================================
        // 📦 FALLBACK DEXIE
        // =================================================

        try {

          const cachedSubjects =
            await getCachedSubjects(
              classId
            );


          if (cancelled) {
            return;
          }


          if (
            Array.isArray(cachedSubjects) &&
            cachedSubjects.length > 0
          ) {

            console.log(
              "📦 [FALLBACK] Matières récupérées depuis Dexie"
            );


            setSubjects(
              cachedSubjects
            );

            setError("");

            return;

          }

        } catch (cacheError) {

          if (!cancelled) {

            console.error(
              "Erreur fallback Dexie :",
              cacheError
            );

          }

        }


        if (!cancelled) {

          setError(
            err.message ||
            "Impossible de charger les matières"
          );

        }

      } finally {

        if (!cancelled) {

          setLoading(false);

        }

      }

    }


    loadSubjects();


    return () => {

      cancelled = true;

    };

  }, [
    classId,
    isOnline,
    isConsultation,
    isStudentPreview
  ]);


  // =====================================================
  // ICÔNE MATIÈRE
  // =====================================================

  function getSubjectIcon(subjectName) {

    const name =
      String(
        subjectName || ""
      ).toLowerCase();


    if (name.includes("math")) {

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
  // OUVRIR MATIÈRE
  // =====================================================

  function openSubject(subject) {

    if (!subject?.id) {

      console.error(
        "Subject invalide :",
        subject
      );

      return;

    }


    console.log(
      "========== OPEN SUBJECT =========="
    );

    console.log(
      "CLASS ID :",
      classId
    );

    console.log(
      "SUBJECT ID :",
      subject.id
    );

    console.log(
      "SUBJECT NAME :",
      subject.name
    );

    console.log(
      "SUBJECT CLASS ID :",
      subject.class_id
    );

    console.log(
      "CONSULTATION :",
      isConsultation
    );

    console.log(
      "STUDENT PREVIEW :",
      isStudentPreview
    );

    console.log(
      "=================================="
    );


    // ===================================================
    // MODE CONSULTATION
    // ===================================================

    if (isConsultation) {

      navigate(
        `/admin/student/${studentId}/consultation/subject/${subject.id}`,
        {
          state: {
            class_id: classId,
            subject_id: subject.id
          }
        }
      );

      return;
    }


    // ===================================================
    // MODE APERÇU
    // ===================================================

    if (isStudentPreview) {

      navigate(
        `/admin/student-preview/subject/${subject.id}`,
        {
          state: {
            class_id: classId,
            subject_id: subject.id
          }
        }
      );

      return;
    }


    // ===================================================
    // MODE NORMAL
    // ===================================================

    navigate(
      `/subject/${subject.id}`,
      {
        state: {
          class_id: classId,
          subject_id: subject.id
        }
      }
    );

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
      ">

        <div className="text-center">

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
            Chargement des matières...
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
        p-4
        md:p-6
      ">

        <button
          onClick={goHome}
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

          <ArrowLeft size={18} />

          Retour à l'accueil

        </button>


        <div className="
          theme-surface
          rounded-3xl
          border
          border-red-200
          dark:border-red-900
          shadow-sm
          p-6
          md:p-8
          text-center
        ">

          <div className="
            w-14
            h-14
            mx-auto
            mb-4
            rounded-2xl
            bg-red-50
            dark:bg-red-950/40
            flex
            items-center
            justify-center
            text-2xl
          ">
            ⚠️
          </div>


          <h2 className="
            font-bold
            text-red-700
            dark:text-red-300
          ">
            Impossible de charger les matières
          </h2>


          <p className="
            text-sm
            text-red-600
            dark:text-red-400
            mt-2
          ">
            {error}
          </p>


          <button
            onClick={() =>
              window.location.reload()
            }
            className="
              mt-5
              px-5
              py-3
              rounded-xl
              bg-accent
              text-white
              font-semibold
              shadow-sm
              hover:opacity-90
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

    <div className="
      pb-10
    ">


      {/* =================================================
          RETOUR
      ================================================= */}

      <button
        onClick={goHome}
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

        <ArrowLeft size={18} />

        Retour à l'accueil

      </button>


      {/* =================================================
          EN-TÊTE
      ================================================= */}

      <section className="
        relative
        overflow-hidden
        rounded-3xl
        bg-accent-soft
        border
        border-accent
        p-6
        md:p-8
        shadow-lg
        mb-8
      ">

        <div className="
          absolute
          -right-10
          -top-10
          w-40
          h-40
          rounded-full
          bg-accent
          opacity-10
        "/>


        <div className="
          absolute
          -left-16
          -bottom-20
          w-48
          h-48
          rounded-full
          bg-accent
          opacity-10
        "/>


        <div className="
          absolute
          right-16
          -bottom-24
          w-56
          h-56
          rounded-full
          bg-accent
          opacity-5
        "/>


        <div className="
          relative
          z-10
        ">


          {/* BADGE */}

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
            mb-4
          ">

            <BookOpen
              size={14}
            />

            Kalan Academy

          </div>


          {/* TITRE */}

          <h1 className="
            text-2xl
            md:text-3xl
            font-bold
            leading-tight
            theme-text
          ">
            Matières
          </h1>


          {/* DESCRIPTION */}

          <p className="
            theme-text-secondary
            mt-3
            leading-relaxed
            max-w-2xl
          ">
            Choisis une matière pour commencer
            ton apprentissage.
          </p>

        </div>

      </section>


      {/* =================================================
          LISTE DES MATIÈRES
      ================================================= */}

      {subjects.length === 0 ? (

        <div className="
          theme-surface
          rounded-3xl
          border
          theme-border
          shadow-sm
          p-8
          text-center
        ">

          <div className="
            w-16
            h-16
            mx-auto
            mb-4
            rounded-2xl
            bg-accent-soft
            flex
            items-center
            justify-center
            text-3xl
          ">
            📚
          </div>


          <h2 className="
            font-bold
            text-lg
            theme-text
          ">
            Aucune matière disponible
          </h2>


          <p className="
            text-sm
            theme-text-secondary
            mt-2
          ">
            Aucune matière n'est disponible
            pour cette classe.
          </p>

        </div>

      ) : (

        <div className="
          grid
          grid-cols-1
          sm:grid-cols-2
          lg:grid-cols-3
          gap-4
        ">

          {subjects.map(
            (subject, index) => {

              const icon =
                getSubjectIcon(
                  subject.name
                );


              return (

                <button
                  key={subject.id}
                  onClick={() =>
                    openSubject(subject)
                  }
                  className="
                    group
                    relative
                    overflow-hidden
                    theme-surface
                    rounded-3xl
                    border
                    theme-border
                    p-5
                    md:p-6
                    text-left
                    shadow-sm
                    hover:shadow-xl
                    hover:-translate-y-1
                    transition-all
                    hover:border-accent
                  "
                >

                  {/* BARRE ACCENT */}

                  <div className="
                    absolute
                    left-0
                    top-0
                    right-0
                    h-1.5
                    bg-accent
                  " />


                  <div className="
                    flex
                    items-start
                    justify-between
                    gap-4
                  ">

                    {/* ICÔNE */}

                    <div className="
                      w-14
                      h-14
                      rounded-2xl
                      bg-accent-soft
                      flex
                      items-center
                      justify-center
                      text-3xl
                      shrink-0
                    ">
                      {icon}
                    </div>


                    {/* FLÈCHE */}

                    <div className="
                      w-10
                      h-10
                      rounded-full
                      theme-bg
                      flex
                      items-center
                      justify-center
                      theme-text-secondary
                      group-hover:bg-accent-soft
                      group-hover:text-accent
                      transition
                    ">

                      <ArrowRight
                        size={19}
                        className="
                          group-hover:translate-x-0.5
                          transition
                        "
                      />

                    </div>

                  </div>


                  {/* NUMÉRO */}

                  <div className="
                    mt-5
                    text-xs
                    font-bold
                    text-accent
                  ">
                    MATIÈRE {index + 1}
                  </div>


                  {/* NOM */}

                  <h2 className="
                    mt-1
                    text-xl
                    font-bold
                    theme-text
                    truncate
                  ">
                    {subject.name}
                  </h2>


                  {/* DESCRIPTION */}

                  {subject.description ? (

                    <p className="
                      text-sm
                      theme-text-secondary
                      mt-2
                      line-clamp-2
                      leading-relaxed
                    ">
                      {subject.description}
                    </p>

                  ) : (

                    <p className="
                      text-sm
                      theme-text-secondary
                      mt-2
                      line-clamp-2
                      leading-relaxed
                    ">
                      Découvre les chapitres
                      de cette matière.
                    </p>

                  )}


                  {/* ACTION */}

                  <div className="
                    mt-5
                    flex
                    items-center
                    gap-1.5
                    text-sm
                    font-semibold
                    text-accent
                  ">

                    Commencer

                    <ArrowRight
                      size={16}
                      className="
                        group-hover:translate-x-1
                        transition
                      "
                    />

                  </div>

                </button>

              );

            }
          )}

        </div>

      )}

    </div>

  );

}