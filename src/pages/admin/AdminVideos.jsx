import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Video,
  Search,
  RefreshCw,
  Save,
  ExternalLink,
  Image as ImageIcon,
  Clock,
  Crown,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";

import { supabase } from "../../lib/supabase";
import { logAdminActivity } from "../../services/adminService";

// ===========================================================
// CONSTANTES
// ===========================================================

const SUCCESS_MESSAGE_DURATION = 3500;

// ===========================================================
// CACHE MÉMOIRE
// ===========================================================

let videosCache = null;
let videosLoadingPromise = null;

// ===========================================================
// HELPERS
// ===========================================================

function hasVideo(lesson) {
  return (
    typeof lesson?.video_url === "string" &&
    lesson.video_url.trim() !== ""
  );
}

function normalizeText(value) {
  return typeof value === "string"
    ? value.trim().toLowerCase()
    : "";
}

// ===========================================================
// CHARGEMENT CENTRALISÉ
// ===========================================================

async function fetchLessons() {
  if (videosCache) {
    return videosCache;
  }

  if (videosLoadingPromise) {
    return videosLoadingPromise;
  }

  videosLoadingPromise = (async () => {
    const { data, error } = await supabase
      .from("lessons")
      .select(`
        id,
        chapter_id,
        title,
        description,
        duration_minutes,
        video_url,
        thumbnail_url,
        is_premium,
        chapters (
          title,
          subjects (
            name
          )
        )
      `)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      throw error;
    }

    videosCache = Array.isArray(data) ? data : [];

    return videosCache;
  })();

  try {
    return await videosLoadingPromise;
  } finally {
    videosLoadingPromise = null;
  }
}

// ===========================================================
// COMPOSANT
// ===========================================================

export default function AdminVideos() {
  // =========================================================
  // ÉTATS
  // =========================================================

  const [lessons, setLessons] = useState(
    () => videosCache || []
  );

  const [loading, setLoading] = useState(
    () => !videosCache
  );

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const [editingLesson, setEditingLesson] = useState(null);

  const [saving, setSaving] = useState(false);

  const successTimeoutRef = useRef(null);

  // =========================================================
  // NETTOYAGE DU MESSAGE DE SUCCÈS
  // =========================================================

  const showSuccess = useCallback((message) => {
    setSuccess(message);

    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
    }

    successTimeoutRef.current = setTimeout(() => {
      setSuccess("");
      successTimeoutRef.current = null;
    }, SUCCESS_MESSAGE_DURATION);
  }, []);

  // =========================================================
  // CHARGEMENT DES LEÇONS
  // =========================================================

  const loadLessons = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else if (!videosCache) {
          setLoading(true);
        }

        setError("");

        if (!isRefresh) {
          setSuccess("");
        }

        if (!isRefresh && videosCache) {
          setLessons(videosCache);
          setLoading(false);
          return;
        }

        const data = await fetchLessons();

        setLessons(data);

        if (isRefresh) {
          showSuccess(
            "Liste des vidéos actualisée."
          );
        }
      } catch (err) {
        console.error(
          "Erreur chargement vidéos :",
          err
        );

        setError(
          err?.message ||
            "Impossible de charger les vidéos."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [showSuccess]
  );

  // =========================================================
  // CHARGEMENT INITIAL
  // =========================================================

  useEffect(() => {
    loadLessons();

    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
        successTimeoutRef.current = null;
      }
    };
  }, [loadLessons]);

  // =========================================================
  // DONNÉES PRÉPARÉES POUR LA RECHERCHE
  // =========================================================

  const indexedLessons = useMemo(() => {
    return lessons.map((lesson) => {
      const subjectName =
        lesson.chapters?.subjects?.name || "";

      const chapterTitle =
        lesson.chapters?.title || "";

      return {
        lesson,
        searchTitle: normalizeText(
          lesson.title
        ),
        searchChapter: normalizeText(
          chapterTitle
        ),
        searchSubject: normalizeText(
          subjectName
        ),
        videoExists: hasVideo(lesson),
      };
    });
  }, [lessons]);

  // =========================================================
  // FILTRAGE
  // =========================================================

  const filteredLessons = useMemo(() => {
    const normalizedSearch =
      normalizeText(search);

    if (
      !normalizedSearch &&
      filter === "all"
    ) {
      return lessons;
    }

    return indexedLessons
      .filter(
        ({
          searchTitle,
          searchChapter,
          searchSubject,
          videoExists,
          lesson,
        }) => {
          const matchesSearch =
            !normalizedSearch ||
            searchTitle.includes(normalizedSearch) ||
            searchChapter.includes(normalizedSearch) ||
            searchSubject.includes(normalizedSearch);

          if (!matchesSearch) {
            return false;
          }

          if (filter === "with-video") {
            return videoExists;
          }

          if (filter === "without-video") {
            return !videoExists;
          }

          if (filter === "premium") {
            return lesson.is_premium === true;
          }

          return true;
        }
      )
      .map(({ lesson }) => lesson);
  }, [
    lessons,
    indexedLessons,
    search,
    filter,
  ]);

  // =========================================================
  // STATISTIQUES
  // =========================================================

  const statistics = useMemo(() => {
    let totalVideos = 0;
    let premiumVideos = 0;

    for (const lesson of lessons) {
      if (hasVideo(lesson)) {
        totalVideos += 1;
      }

      if (lesson.is_premium === true) {
        premiumVideos += 1;
      }
    }

    const totalLessons = lessons.length;

    return {
      totalLessons,
      totalVideos,
      missingVideos:
        totalLessons - totalVideos,
      premiumVideos,
    };
  }, [lessons]);

  const {
    totalLessons,
    totalVideos,
    missingVideos,
    premiumVideos,
  } = statistics;

  // =========================================================
  // OUVRIR L'ÉDITEUR
  // =========================================================

  const openEditor = useCallback((lesson) => {
    setEditingLesson({
      id: lesson.id,
      title: lesson.title || "",
      video_url: lesson.video_url || "",
      thumbnail_url:
        lesson.thumbnail_url || "",
      duration_minutes:
        lesson.duration_minutes ?? "",
      is_premium:
        Boolean(lesson.is_premium),
    });

    setError("");
    setSuccess("");
  }, []);

  // =========================================================
  // FERMER L'ÉDITEUR
  // =========================================================

  const closeEditor = useCallback(() => {
    if (saving) {
      return;
    }

    setEditingLesson(null);
  }, [saving]);

  // =========================================================
  // MODIFICATION CHAMP
  // =========================================================

  const handleEditorChange = useCallback(
    (field, value) => {
      setEditingLesson((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          [field]: value,
        };
      });
    },
    []
  );

  // =========================================================
  // ENREGISTRER
  // =========================================================

  const saveLessonVideo = useCallback(
    async () => {
      if (!editingLesson) {
        return;
      }

      try {
        setSaving(true);
        setError("");
        setSuccess("");

        const duration =
          editingLesson.duration_minutes === "" ||
          editingLesson.duration_minutes === null
            ? null
            : Number(
                editingLesson.duration_minutes
              );

        if (
          duration !== null &&
          (!Number.isFinite(duration) ||
            duration < 0)
        ) {
          throw new Error(
            "La durée doit être un nombre positif."
          );
        }

        const videoUrl =
          editingLesson.video_url.trim();

        const thumbnailUrl =
          editingLesson.thumbnail_url.trim();

        const {
          data,
          error: updateError,
        } = await supabase
          .from("lessons")
          .update({
            video_url:
              videoUrl || null,

            thumbnail_url:
              thumbnailUrl || null,

            duration_minutes:
              duration,

            is_premium:
              Boolean(
                editingLesson.is_premium
              ),
          })
          .eq("id", editingLesson.id)
          .select(`
            id,
            chapter_id,
            title,
            description,
            duration_minutes,
            video_url,
            thumbnail_url,
            is_premium,
            chapters (
              title,
              subjects (
                name
              )
            )
          `)
          .single();

        if (updateError) {
          throw updateError;
        }

        setLessons((current) => {
          const updated = current.map(
            (lesson) =>
              lesson.id === data.id
                ? data
                : lesson
          );

          videosCache = updated;

          return updated;
        });

        // ===================================================
        // JOURNAL ADMINISTRATEUR
        // ===================================================

        await logAdminActivity({
          action: "lesson_video_updated",
          targetUserId: null,
          details: {
            lesson_id: data.id,
            lesson_title:
              data.title ||
              editingLesson.title,

            video_url:
              data.video_url || null,

            thumbnail_url:
              data.thumbnail_url || null,

            duration_minutes:
              data.duration_minutes ?? null,

            is_premium:
              Boolean(data.is_premium),
          },
        });

        setEditingLesson(null);

        showSuccess(
          "Les informations de la vidéo ont été enregistrées."
        );
      } catch (err) {
        console.error(
          "Erreur sauvegarde vidéo :",
          err
        );

        setError(
          err?.message ||
            "Impossible d'enregistrer la vidéo."
        );
      } finally {
        setSaving(false);
      }
    },
    [editingLesson, showSuccess]
  );

  // =========================================================
  // TEST VIDÉO
  // =========================================================

  const openVideo = useCallback((url) => {
    if (!url) {
      return;
    }

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  }, []);

  // =========================================================
  // CHARGEMENT
  // =========================================================

  if (loading) {
    return (
      <div className="p-6">
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="text-center">
            <Loader2
              size={40}
              className="animate-spin text-accent mx-auto mb-4"
            />

            <p className="theme-text-secondary">
              Chargement des vidéos...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // RENDU
  // =========================================================

  return (
    <div className="space-y-6">

      {/* =====================================================
          HERO
      ===================================================== */}

      <div
        className="
          relative
          overflow-hidden
          rounded-3xl
          bg-accent-soft
          border
          border-accent
          shadow-lg
          p-6
          md:p-8
        "
      >
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-accent opacity-10" />

        <div className="absolute -left-16 -bottom-20 w-48 h-48 rounded-full bg-accent opacity-10" />

        <div className="absolute right-16 -bottom-24 w-56 h-56 rounded-full bg-accent opacity-5" />

        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

            <div className="flex items-start gap-4">

              <div
                className="
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
                  text-accent
                "
              >
                <Video size={30} />
              </div>

              <div className="min-w-0">

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
                    mb-3
                  "
                >
                  <Video size={14} />

                  Administration
                </div>

                <h1
                  className="
                    text-2xl
                    md:text-3xl
                    font-bold
                    leading-tight
                    theme-text
                  "
                >
                  Gestion des vidéos
                </h1>

                <p className="theme-text-secondary mt-3 leading-relaxed">
                  Gérez les vidéos associées aux leçons,
                  leurs miniatures, durées et accès premium.
                </p>

                <div className="flex flex-wrap items-center gap-3 mt-5">

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
                    <Video
                      size={16}
                      className="text-accent"
                    />

                    {totalVideos} vidéo
                    {totalVideos > 1 ? "s" : ""}
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
                    <XCircle
                      size={16}
                      className="text-accent"
                    />

                    {missingVideos} sans vidéo
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
                    <Crown
                      size={16}
                      className="text-accent"
                    />

                    {premiumVideos} premium
                  </div>

                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => loadLessons(true)}
              disabled={refreshing}
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                px-5
                py-3
                rounded-xl
                bg-accent
                text-white
                font-bold
                shadow-md
                hover:opacity-90
                hover:-translate-y-0.5
                transition
                disabled:opacity-50
                disabled:cursor-not-allowed
                shrink-0
              "
            >
              <RefreshCw
                size={18}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />

              Actualiser
            </button>

          </div>
        </div>
      </div>

      {/* =====================================================
          ERREUR
      ===================================================== */}

      {error && (
        <div
          className="
            rounded-2xl
            border
            border-red-200
            bg-red-50
            dark:bg-red-950/20
            text-red-700
            dark:text-red-300
            px-4
            py-3
            flex
            gap-3
          "
        >
          <AlertCircle
            size={20}
            className="shrink-0"
          />

          <div>
            <p className="font-semibold">
              Une erreur est survenue
            </p>

            <p className="text-sm mt-1">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* =====================================================
          SUCCÈS
      ===================================================== */}

      {success && (
        <div
          className="
            rounded-2xl
            border
            border-green-200
            bg-green-50
            dark:bg-green-950/20
            text-green-700
            dark:text-green-300
            px-4
            py-3
            flex
            gap-3
          "
        >
          <CheckCircle
            size={20}
            className="shrink-0"
          />

          <p className="text-sm font-medium">
            {success}
          </p>
        </div>
      )}

      {/* =====================================================
          STATISTIQUES
      ===================================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

        <VideoStat
          icon={Video}
          label="Leçons"
          value={totalLessons}
        />

        <VideoStat
          icon={CheckCircle}
          label="Avec vidéo"
          value={totalVideos}
          variant="success"
        />

        <VideoStat
          icon={XCircle}
          label="Sans vidéo"
          value={missingVideos}
          variant="danger"
        />

        <VideoStat
          icon={Crown}
          label="Premium"
          value={premiumVideos}
          variant="premium"
        />

      </div>

      {/* =====================================================
          FILTRES
      ===================================================== */}

      <div
        className="
          theme-surface
          theme-border
          border
          rounded-3xl
          shadow-sm
          p-5
          md:p-6
        "
      >
        <div className="flex items-center gap-3 mb-4">

          <div
            className="
              w-10
              h-10
              rounded-xl
              bg-accent-soft
              border
              border-accent
              flex
              items-center
              justify-center
              text-accent
            "
          >
            <Search size={19} />
          </div>

          <div>
            <h2 className="font-bold theme-text">
              Rechercher et filtrer
            </h2>

            <p className="text-sm theme-text-secondary mt-0.5">
              Trouvez rapidement une leçon ou un contenu vidéo.
            </p>
          </div>

        </div>

        <div className="flex flex-col lg:flex-row gap-3">

          <div className="relative flex-1">

            <Search
              size={19}
              className="
                absolute
                left-3
                top-1/2
                -translate-y-1/2
                text-accent
              "
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Rechercher une leçon, un chapitre ou une matière..."
              className="
                w-full
                theme-surface
                theme-text
                theme-border
                border
                rounded-xl
                pl-10
                pr-4
                py-2.5
                outline-none
                focus:ring-2
                focus:ring-accent
                placeholder:opacity-60
              "
            />

          </div>

          <select
            value={filter}
            onChange={(event) =>
              setFilter(event.target.value)
            }
            className="
              theme-surface
              theme-text
              theme-border
              border
              rounded-xl
              px-4
              py-2.5
              outline-none
              focus:ring-2
              focus:ring-accent
              lg:min-w-[190px]
            "
          >
            <option value="all">
              Toutes les leçons
            </option>

            <option value="with-video">
              Avec vidéo
            </option>

            <option value="without-video">
              Sans vidéo
            </option>

            <option value="premium">
              Premium
            </option>
          </select>

        </div>
      </div>

      {/* =====================================================
          TABLE
      ===================================================== */}

      <div
        className="
          theme-surface
          theme-border
          border
          rounded-3xl
          shadow-sm
          overflow-hidden
        "
      >
        <div
          className="
            p-5
            md:p-6
            border-b
            theme-border
            bg-accent-soft
          "
        >
          <div className="flex items-center justify-between gap-4">

            <div>
              <div className="flex items-center gap-3">

                <div
                  className="
                    w-10
                    h-10
                    rounded-xl
                    bg-white/70
                    dark:bg-gray-950/30
                    border
                    border-white/50
                    dark:border-white/10
                    flex
                    items-center
                    justify-center
                    text-accent
                  "
                >
                  <Video size={19} />
                </div>

                <div>
                  <h2 className="text-xl font-bold theme-text">
                    Leçons
                  </h2>

                  <p className="text-sm theme-text-secondary mt-1">
                    {filteredLessons.length} leçon
                    {filteredLessons.length > 1
                      ? "s"
                      : ""} affichée
                    {filteredLessons.length > 1
                      ? "s"
                      : ""}
                  </p>
                </div>

              </div>
            </div>

          </div>
        </div>

        {filteredLessons.length === 0 ? (

          <div className="p-10 text-center">

            <div
              className="
                w-16
                h-16
                rounded-2xl
                bg-accent-soft
                border
                border-accent
                flex
                items-center
                justify-center
                text-accent
                mx-auto
                mb-4
              "
            >
              <Video size={30} />
            </div>

            <h3 className="font-semibold theme-text">
              Aucune leçon trouvée
            </h3>

            <p className="text-sm theme-text-secondary mt-1">
              Modifiez votre recherche ou votre filtre.
            </p>

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full text-sm">

              <thead className="bg-accent-soft">

                <tr>

                  <th className="text-left p-4 font-semibold theme-text-secondary">
                    Leçon
                  </th>

                  <th className="text-left p-4 font-semibold theme-text-secondary">
                    Matière
                  </th>

                  <th className="text-left p-4 font-semibold theme-text-secondary">
                    Chapitre
                  </th>

                  <th className="text-left p-4 font-semibold theme-text-secondary">
                    Vidéo
                  </th>

                  <th className="text-left p-4 font-semibold theme-text-secondary">
                    Durée
                  </th>

                  <th className="text-left p-4 font-semibold theme-text-secondary">
                    Type
                  </th>

                  <th className="text-right p-4 font-semibold theme-text-secondary">
                    Action
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredLessons.map((lesson) => {

                  const subjectName =
                    lesson.chapters?.subjects?.name ||
                    "—";

                  const chapterTitle =
                    lesson.chapters?.title ||
                    "—";

                  const videoExists =
                    hasVideo(lesson);

                  return (
                    <tr
                      key={lesson.id}
                      className="
                        border-t
                        theme-border
                        hover:bg-accent-soft
                        transition
                      "
                    >

                      <td className="p-4">

                        <div className="max-w-xs">

                          <p className="font-medium theme-text">
                            {lesson.title}
                          </p>

                          {lesson.description && (
                            <p className="text-xs theme-text-secondary mt-1 line-clamp-2">
                              {lesson.description}
                            </p>
                          )}

                        </div>

                      </td>

                      <td className="p-4">
                        <span className="theme-text">
                          {subjectName}
                        </span>
                      </td>

                      <td className="p-4">
                        <span className="theme-text-secondary">
                          {chapterTitle}
                        </span>
                      </td>

                      <td className="p-4">

                        {videoExists ? (

                          <button
                            type="button"
                            onClick={() =>
                              openVideo(
                                lesson.video_url
                              )
                            }
                            className="
                              inline-flex
                              items-center
                              gap-2
                              px-3
                              py-1.5
                              rounded-xl
                              bg-green-100
                              dark:bg-green-950/30
                              text-green-700
                              dark:text-green-300
                              hover:bg-green-200
                              dark:hover:bg-green-950/50
                              text-xs
                              font-semibold
                              transition
                            "
                          >

                            <Video size={15} />

                            Disponible

                            <ExternalLink
                              size={13}
                            />

                          </button>

                        ) : (

                          <span
                            className="
                              inline-flex
                              items-center
                              gap-2
                              px-3
                              py-1.5
                              rounded-xl
                              bg-red-100
                              dark:bg-red-950/30
                              text-red-700
                              dark:text-red-300
                              text-xs
                              font-semibold
                            "
                          >

                            <XCircle size={15} />

                            Absente

                          </span>

                        )}

                      </td>

                      <td className="p-4">

                        <div className="flex items-center gap-2 theme-text-secondary">

                          <Clock size={15} />

                          {lesson.duration_minutes
                            ? `${lesson.duration_minutes} min`
                            : "—"}

                        </div>

                      </td>

                      <td className="p-4">

                        {lesson.is_premium ? (

                          <span
                            className="
                              inline-flex
                              items-center
                              gap-1.5
                              px-2.5
                              py-1
                              rounded-full
                              bg-yellow-100
                              dark:bg-yellow-950/30
                              text-yellow-700
                              dark:text-yellow-300
                              text-xs
                              font-semibold
                            "
                          >

                            <Crown size={13} />

                            Premium

                          </span>

                        ) : (

                          <span className="text-xs theme-text-secondary">
                            Gratuit
                          </span>

                        )}

                      </td>

                      <td className="p-4 text-right">

                        <button
                          type="button"
                          onClick={() =>
                            openEditor(lesson)
                          }
                          className="
                            inline-flex
                            items-center
                            gap-2
                            px-3
                            py-2
                            rounded-xl
                            bg-accent
                            text-white
                            hover:opacity-90
                            text-xs
                            font-semibold
                            shadow-sm
                            transition
                          "
                        >

                          <Video size={15} />

                          Gérer

                        </button>

                      </td>

                    </tr>
                  );
                })}

              </tbody>

            </table>

          </div>
        )}

      </div>

      {/* =====================================================
          MODAL ÉDITION
      ===================================================== */}

      {editingLesson && (

        <div
          className="
            fixed
            inset-0
            z-50
            bg-black/50
            flex
            items-center
            justify-center
            p-4
          "
        >

          <div
            className="
              theme-surface
              theme-text
              rounded-3xl
              shadow-2xl
              w-full
              max-w-2xl
              max-h-[90vh]
              overflow-y-auto
              theme-border
              border
            "
          >

            <div
              className="
                flex
                items-center
                justify-between
                gap-4
                p-5
                md:p-6
                border-b
                theme-border
                bg-accent-soft
              "
            >

              <div>

                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent text-white text-xs font-semibold mb-2">

                  <Video size={14} />

                  Édition

                </div>

                <h2 className="text-xl font-bold theme-text">
                  Gérer la vidéo
                </h2>

                <p className="text-sm theme-text-secondary mt-1">
                  {editingLesson.title}
                </p>

              </div>

              <button
                type="button"
                onClick={closeEditor}
                disabled={saving}
                className="
                  p-2.5
                  rounded-xl
                  theme-text-secondary
                  hover:bg-white/70
                  dark:hover:bg-gray-950/30
                  hover:text-accent
                  disabled:opacity-50
                  transition
                "
              >
                <X size={21} />
              </button>

            </div>

            <div className="p-5 md:p-6 space-y-5">

              {/* URL vidéo */}

              <div>

                <label
                  className="
                    block
                    text-sm
                    font-semibold
                    theme-text
                    mb-2
                  "
                >
                  URL de la vidéo
                </label>

                <div className="relative">

                  <Video
                    size={18}
                    className="
                      absolute
                      left-3
                      top-1/2
                      -translate-y-1/2
                      text-accent
                    "
                  />

                  <input
                    type="url"
                    value={
                      editingLesson.video_url
                    }
                    onChange={(event) =>
                      handleEditorChange(
                        "video_url",
                        event.target.value
                      )
                    }
                    placeholder="https://..."
                    className="
                      w-full
                      theme-surface
                      theme-text
                      theme-border
                      border
                      rounded-xl
                      pl-10
                      pr-4
                      py-2.5
                      outline-none
                      focus:ring-2
                      focus:ring-accent
                      placeholder:opacity-60
                    "
                  />

                </div>

                <p className="text-xs theme-text-secondary mt-1">
                  URL directe ou URL fournie par ton hébergeur vidéo.
                </p>

              </div>

              {/* Thumbnail */}

              <div>

                <label
                  className="
                    block
                    text-sm
                    font-semibold
                    theme-text
                    mb-2
                  "
                >
                  URL de la miniature
                </label>

                <div className="relative">

                  <ImageIcon
                    size={18}
                    className="
                      absolute
                      left-3
                      top-1/2
                      -translate-y-1/2
                      text-accent
                    "
                  />

                  <input
                    type="url"
                    value={
                      editingLesson.thumbnail_url
                    }
                    onChange={(event) =>
                      handleEditorChange(
                        "thumbnail_url",
                        event.target.value
                      )
                    }
                    placeholder="https://..."
                    className="
                      w-full
                      theme-surface
                      theme-text
                      theme-border
                      border
                      rounded-xl
                      pl-10
                      pr-4
                      py-2.5
                      outline-none
                      focus:ring-2
                      focus:ring-accent
                      placeholder:opacity-60
                    "
                  />

                </div>

              </div>

              {/* Aperçu miniature */}

              {editingLesson.thumbnail_url && (

                <div>

                  <p className="text-sm font-semibold theme-text mb-2">
                    Aperçu
                  </p>

                  <img
                    src={
                      editingLesson.thumbnail_url
                    }
                    alt="Miniature"
                    className="
                      w-full
                      max-h-56
                      object-cover
                      rounded-2xl
                      border
                      theme-border
                    "
                    onError={(event) => {
                      event.currentTarget.style.display =
                        "none";
                    }}
                  />

                </div>

              )}

              {/* Durée */}

              <div>

                <label
                  className="
                    block
                    text-sm
                    font-semibold
                    theme-text
                    mb-2
                  "
                >
                  Durée en minutes
                </label>

                <div className="relative">

                  <Clock
                    size={18}
                    className="
                      absolute
                      left-3
                      top-1/2
                      -translate-y-1/2
                      text-accent
                    "
                  />

                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={
                      editingLesson.duration_minutes
                    }
                    onChange={(event) =>
                      handleEditorChange(
                        "duration_minutes",
                        event.target.value
                      )
                    }
                    placeholder="10"
                    className="
                      w-full
                      theme-surface
                      theme-text
                      theme-border
                      border
                      rounded-xl
                      pl-10
                      pr-4
                      py-2.5
                      outline-none
                      focus:ring-2
                      focus:ring-accent
                      placeholder:opacity-60
                    "
                  />

                </div>

              </div>

              {/* Premium */}

              <label
                className="
                  flex
                  items-center
                  justify-between
                  gap-4
                  p-4
                  rounded-2xl
                  theme-surface
                  theme-border
                  border
                  cursor-pointer
                  hover:bg-accent-soft
                  transition
                "
              >

                <div className="flex items-center gap-3">

                  <div
                    className="
                      w-10
                      h-10
                      rounded-xl
                      bg-yellow-100
                      dark:bg-yellow-950/30
                      flex
                      items-center
                      justify-center
                    "
                  >

                    <Crown
                      size={19}
                      className="text-yellow-600 dark:text-yellow-400"
                    />

                  </div>

                  <div>

                    <p className="font-semibold theme-text">
                      Vidéo premium
                    </p>

                    <p className="text-xs theme-text-secondary">
                      Réserver cette leçon aux utilisateurs premium.
                    </p>

                  </div>

                </div>

                <input
                  type="checkbox"
                  checked={
                    editingLesson.is_premium
                  }
                  onChange={(event) =>
                    handleEditorChange(
                      "is_premium",
                      event.target.checked
                    )
                  }
                  className="
                    w-5
                    h-5
                    accent-blue-600
                  "
                />

              </label>

            </div>

            {/* Footer */}

            <div
              className="
                flex
                flex-col-reverse
                sm:flex-row
                sm:justify-between
                gap-3
                p-5
                md:p-6
                border-t
                theme-border
                bg-accent-soft
              "
            >

              <div>

                {editingLesson.video_url && (

                  <button
                    type="button"
                    onClick={() =>
                      openVideo(
                        editingLesson.video_url
                      )
                    }
                    disabled={saving}
                    className="
                      inline-flex
                      items-center
                      gap-2
                      px-4
                      py-2.5
                      rounded-xl
                      theme-surface
                      theme-text
                      theme-border
                      border
                      hover:bg-white
                      dark:hover:bg-gray-900
                      disabled:opacity-50
                      transition
                    "
                  >

                    <ExternalLink size={17} />

                    Tester la vidéo

                  </button>

                )}

              </div>

              <div className="flex gap-3">

                <button
                  type="button"
                  onClick={closeEditor}
                  disabled={saving}
                  className="
                    px-4
                    py-2.5
                    rounded-xl
                    theme-surface
                    theme-text
                    theme-border
                    border
                    hover:bg-white
                    dark:hover:bg-gray-900
                    disabled:opacity-50
                    transition
                  "
                >
                  Annuler
                </button>

                <button
                  type="button"
                  onClick={saveLessonVideo}
                  disabled={saving}
                  className="
                    inline-flex
                    items-center
                    justify-center
                    gap-2
                    px-4
                    py-2.5
                    rounded-xl
                    bg-accent
                    text-white
                    font-bold
                    shadow-md
                    hover:opacity-90
                    hover:-translate-y-0.5
                    disabled:opacity-50
                    disabled:cursor-not-allowed
                    transition
                  "
                >

                  {saving ? (
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />
                  ) : (
                    <Save size={18} />
                  )}

                  {saving
                    ? "Enregistrement..."
                    : "Enregistrer"}

                </button>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

// ===========================================================
// STAT CARD
// ===========================================================

function VideoStat({
  icon: Icon,
  label,
  value,
  variant = "default",
}) {
  const variantClasses = {
    default: {
      wrapper: "bg-accent-soft border-accent",
      icon: "text-accent",
    },

    success: {
      wrapper:
        "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900",
      icon: "text-green-600 dark:text-green-400",
    },

    danger: {
      wrapper:
        "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900",
      icon: "text-red-600 dark:text-red-400",
    },

    premium: {
      wrapper:
        "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900",
      icon: "text-yellow-600 dark:text-yellow-400",
    },
  };

  const current =
    variantClasses[variant] ||
    variantClasses.default;

  return (
    <div
      className={`
        relative
        overflow-hidden
        border
        rounded-3xl
        p-5
        shadow-sm
        ${current.wrapper}
      `}
    >

      <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-accent opacity-5" />

      <div className="relative z-10 flex items-center justify-between gap-4">

        <div>

          <p className="text-sm theme-text-secondary">
            {label}
          </p>

          <p className="text-3xl font-bold theme-text mt-2">
            {value}
          </p>

        </div>

        <div
          className="
            w-12
            h-12
            rounded-2xl
            bg-white/70
            dark:bg-gray-950/30
            border
            border-white/50
            dark:border-white/10
            flex
            items-center
            justify-center
          "
        >

          <Icon
            size={22}
            className={current.icon}
          />

        </div>

      </div>

    </div>
  );
}
