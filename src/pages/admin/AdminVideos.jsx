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


// ===========================================================
// CONSTANTES
// ===========================================================

const SUCCESS_MESSAGE_DURATION = 3500;


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
// COMPOSANT
// ===========================================================

export default function AdminVideos() {
  // =========================================================
  // ÉTATS
  // =========================================================

  const [lessons, setLessons] = useState([]);

  const [loading, setLoading] = useState(true);
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
        } else {
          setLoading(true);
        }

        setError("");

        if (!isRefresh) {
          setSuccess("");
        }

        const { data, error: fetchError } = await supabase
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
              id,
              title,
              subjects (
                id,
                name
              )
            )
          `)
          .order("created_at", {
            ascending: false,
          });

        if (fetchError) {
          throw fetchError;
        }

        setLessons(Array.isArray(data) ? data : []);

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
              id,
              title,
              subjects (
                id,
                name
              )
            )
          `)
          .single();

        if (updateError) {
          throw updateError;
        }

        setLessons((current) =>
          current.map((lesson) =>
            lesson.id === data.id
              ? data
              : lesson
          )
        );

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
              className="animate-spin text-blue-600 mx-auto mb-4"
            />

            <p className="text-slate-600">
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
    <div className="p-6">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">

        <div>
          <div className="flex items-center gap-3">

            <div className="p-3 bg-blue-100 rounded-xl">
              <Video
                size={25}
                className="text-blue-600"
              />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Gestion des vidéos
              </h1>

              <p className="text-sm text-slate-500">
                Gérez les vidéos associées aux leçons.
              </p>
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
            px-4
            py-2.5
            rounded-lg
            bg-blue-600
            text-white
            hover:bg-blue-700
            disabled:opacity-50
            disabled:cursor-not-allowed
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


      {/* =====================================================
          ERREUR
      ===================================================== */}

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex gap-3">

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
        <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 flex gap-3">

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">

        <VideoStat
          icon={Video}
          label="Leçons"
          value={totalLessons}
          bg="bg-blue-100"
          iconColor="text-blue-600"
        />

        <VideoStat
          icon={CheckCircle}
          label="Avec vidéo"
          value={totalVideos}
          bg="bg-green-100"
          iconColor="text-green-600"
        />

        <VideoStat
          icon={XCircle}
          label="Sans vidéo"
          value={missingVideos}
          bg="bg-red-100"
          iconColor="text-red-600"
        />

        <VideoStat
          icon={Crown}
          label="Premium"
          value={premiumVideos}
          bg="bg-yellow-100"
          iconColor="text-yellow-600"
        />

      </div>


      {/* =====================================================
          FILTRES
      ===================================================== */}

      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">

        <div className="flex flex-col lg:flex-row gap-3">

          {/* Recherche */}

          <div className="relative flex-1">

            <Search
              size={19}
              className="
                absolute
                left-3
                top-1/2
                -translate-y-1/2
                text-slate-400
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
                border
                border-slate-300
                rounded-lg
                pl-10
                pr-4
                py-2.5
                outline-none
                focus:ring-2
                focus:ring-blue-500
              "
            />

          </div>


          {/* Filtre */}

          <select
            value={filter}
            onChange={(event) =>
              setFilter(event.target.value)
            }
            className="
              border
              border-slate-300
              rounded-lg
              px-4
              py-2.5
              bg-white
              outline-none
              focus:ring-2
              focus:ring-blue-500
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

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">

        <div className="p-5 border-b border-slate-200">

          <div className="flex items-center justify-between gap-4">

            <div>

              <h2 className="text-lg font-semibold text-slate-900">
                Leçons
              </h2>

              <p className="text-sm text-slate-500 mt-1">
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


        {filteredLessons.length === 0 ? (

          <div className="p-10 text-center">

            <Video
              size={42}
              className="mx-auto text-slate-300 mb-4"
            />

            <h3 className="font-semibold text-slate-700">
              Aucune leçon trouvée
            </h3>

            <p className="text-sm text-slate-500 mt-1">
              Modifiez votre recherche ou votre filtre.
            </p>

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full text-sm">

              <thead className="bg-slate-50">

                <tr>

                  <th className="text-left p-4 font-semibold text-slate-600">
                    Leçon
                  </th>

                  <th className="text-left p-4 font-semibold text-slate-600">
                    Matière
                  </th>

                  <th className="text-left p-4 font-semibold text-slate-600">
                    Chapitre
                  </th>

                  <th className="text-left p-4 font-semibold text-slate-600">
                    Vidéo
                  </th>

                  <th className="text-left p-4 font-semibold text-slate-600">
                    Durée
                  </th>

                  <th className="text-left p-4 font-semibold text-slate-600">
                    Type
                  </th>

                  <th className="text-right p-4 font-semibold text-slate-600">
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
                        border-slate-100
                        hover:bg-slate-50
                      "
                    >

                      {/* Leçon */}

                      <td className="p-4">

                        <div className="max-w-xs">

                          <p className="font-medium text-slate-900">
                            {lesson.title}
                          </p>

                          {lesson.description && (
                            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                              {lesson.description}
                            </p>
                          )}

                        </div>

                      </td>


                      {/* Matière */}

                      <td className="p-4">
                        <span className="text-slate-700">
                          {subjectName}
                        </span>
                      </td>


                      {/* Chapitre */}

                      <td className="p-4">
                        <span className="text-slate-600">
                          {chapterTitle}
                        </span>
                      </td>


                      {/* Vidéo */}

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
                              rounded-lg
                              bg-green-100
                              text-green-700
                              hover:bg-green-200
                              text-xs
                              font-semibold
                            "
                          >

                            <Video size={15} />

                            Disponible

                            <ExternalLink
                              size={13}
                            />

                          </button>

                        ) : (

                          <span className="
                            inline-flex
                            items-center
                            gap-2
                            px-3
                            py-1.5
                            rounded-lg
                            bg-red-100
                            text-red-700
                            text-xs
                            font-semibold
                          ">

                            <XCircle size={15} />

                            Absente

                          </span>

                        )}

                      </td>


                      {/* Durée */}

                      <td className="p-4">

                        <div className="flex items-center gap-2 text-slate-600">

                          <Clock size={15} />

                          {lesson.duration_minutes
                            ? `${lesson.duration_minutes} min`
                            : "—"}

                        </div>

                      </td>


                      {/* Type */}

                      <td className="p-4">

                        {lesson.is_premium ? (

                          <span className="
                            inline-flex
                            items-center
                            gap-1.5
                            px-2.5
                            py-1
                            rounded-full
                            bg-yellow-100
                            text-yellow-700
                            text-xs
                            font-semibold
                          ">

                            <Crown size={13} />

                            Premium

                          </span>

                        ) : (

                          <span className="
                            text-xs
                            text-slate-500
                          ">
                            Gratuit
                          </span>

                        )}

                      </td>


                      {/* Action */}

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
                            rounded-lg
                            bg-slate-900
                            text-white
                            hover:bg-slate-700
                            text-xs
                            font-semibold
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

        <div className="
          fixed
          inset-0
          z-50
          bg-black/50
          flex
          items-center
          justify-center
          p-4
        ">

          <div className="
            bg-white
            rounded-2xl
            shadow-2xl
            w-full
            max-w-2xl
            max-h-[90vh]
            overflow-y-auto
          ">

            {/* Header modal */}

            <div className="
              flex
              items-center
              justify-between
              gap-4
              p-5
              border-b
              border-slate-200
            ">

              <div>

                <h2 className="text-xl font-bold text-slate-900">
                  Gérer la vidéo
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  {editingLesson.title}
                </p>

              </div>


              <button
                type="button"
                onClick={closeEditor}
                disabled={saving}
                className="
                  p-2
                  rounded-lg
                  hover:bg-slate-100
                  text-slate-500
                  disabled:opacity-50
                "
              >

                <X size={21} />

              </button>

            </div>


            {/* Corps */}

            <div className="p-5 space-y-5">

              {/* URL vidéo */}

              <div>

                <label className="
                  block
                  text-sm
                  font-semibold
                  text-slate-700
                  mb-2
                ">
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
                      text-slate-400
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
                      border
                      border-slate-300
                      rounded-lg
                      pl-10
                      pr-4
                      py-2.5
                      outline-none
                      focus:ring-2
                      focus:ring-blue-500
                    "
                  />

                </div>

                <p className="text-xs text-slate-400 mt-1">
                  URL directe ou URL fournie par ton hébergeur vidéo.
                </p>

              </div>


              {/* Thumbnail */}

              <div>

                <label className="
                  block
                  text-sm
                  font-semibold
                  text-slate-700
                  mb-2
                ">
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
                      text-slate-400
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
                      border
                      border-slate-300
                      rounded-lg
                      pl-10
                      pr-4
                      py-2.5
                      outline-none
                      focus:ring-2
                      focus:ring-blue-500
                    "
                  />

                </div>

              </div>


              {/* Aperçu miniature */}

              {editingLesson.thumbnail_url && (

                <div>

                  <p className="
                    text-sm
                    font-semibold
                    text-slate-700
                    mb-2
                  ">
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
                      rounded-xl
                      border
                      border-slate-200
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

                <label className="
                  block
                  text-sm
                  font-semibold
                  text-slate-700
                  mb-2
                ">
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
                      text-slate-400
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
                      border
                      border-slate-300
                      rounded-lg
                      pl-10
                      pr-4
                      py-2.5
                      outline-none
                      focus:ring-2
                      focus:ring-blue-500
                    "
                  />

                </div>

              </div>


              {/* Premium */}

              <label className="
                flex
                items-center
                justify-between
                gap-4
                p-4
                rounded-xl
                border
                border-slate-200
                cursor-pointer
                hover:bg-slate-50
              ">

                <div className="flex items-center gap-3">

                  <div className="p-2 bg-yellow-100 rounded-lg">

                    <Crown
                      size={19}
                      className="text-yellow-600"
                    />

                  </div>

                  <div>

                    <p className="font-semibold text-slate-800">
                      Vidéo premium
                    </p>

                    <p className="text-xs text-slate-500">
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

            <div className="
              flex
              flex-col-reverse
              sm:flex-row
              sm:justify-between
              gap-3
              p-5
              border-t
              border-slate-200
              bg-slate-50
            ">

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
                      rounded-lg
                      border
                      border-slate-300
                      bg-white
                      text-slate-700
                      hover:bg-slate-100
                      disabled:opacity-50
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
                    rounded-lg
                    border
                    border-slate-300
                    bg-white
                    text-slate-700
                    hover:bg-slate-100
                    disabled:opacity-50
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
                    rounded-lg
                    bg-blue-600
                    text-white
                    hover:bg-blue-700
                    disabled:opacity-50
                    disabled:cursor-not-allowed
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
  bg,
  iconColor,
}) {
  return (
    <div className="
      bg-white
      border
      border-slate-200
      rounded-xl
      p-5
    ">

      <div className="flex items-center justify-between gap-4">

        <div>

          <p className="text-sm text-slate-500">
            {label}
          </p>

          <p className="text-3xl font-bold text-slate-900 mt-2">
            {value}
          </p>

        </div>


        <div
          className={`
            p-3
            rounded-xl
            ${bg}
          `}
        >

          <Icon
            size={22}
            className={iconColor}
          />

        </div>

      </div>

    </div>
  );
}