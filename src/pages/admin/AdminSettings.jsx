import { supabase } from "../../lib/supabase";
import { logAdminActivity } from "../../services/adminService";

import { useEffect, useState } from "react";
import {
  Save,
  RefreshCw,
  Settings,
  Building2,
  Video,
  Trophy,
  Smartphone,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";


const DEFAULT_SETTINGS = {
  academy_name: "Kalan Academy",
  academy_description:
    "Plateforme éducative pour les élèves du Mali.",

  video_default_duration: 10,
  video_premium_enabled: true,

  xp_lesson_completion: 10,
  xp_quiz_completion: 20,
  xp_quiz_perfect: 10,

  level_base_xp: 100,

  badges_enabled: true,

  app_maintenance_mode: false,
  app_registration_enabled: true,
};


// ===========================================================
// CACHE MÉMOIRE
// ===========================================================

let settingsCache = null;
let settingsLoadingPromise = null;


// ===========================================================
// NORMALISER LES PARAMÈTRES
// ===========================================================

const normalizeSettings = (data) => ({
  academy_name:
    data?.academy_name ??
    DEFAULT_SETTINGS.academy_name,

  academy_description:
    data?.academy_description ??
    DEFAULT_SETTINGS.academy_description,

  video_default_duration:
    data?.video_default_duration ??
    DEFAULT_SETTINGS.video_default_duration,

  video_premium_enabled:
    data?.video_premium_enabled ??
    DEFAULT_SETTINGS.video_premium_enabled,

  xp_lesson_completion:
    data?.xp_lesson_completion ??
    DEFAULT_SETTINGS.xp_lesson_completion,

  xp_quiz_completion:
    data?.xp_quiz_completion ??
    DEFAULT_SETTINGS.xp_quiz_completion,

  xp_quiz_perfect:
    data?.xp_quiz_perfect ??
    DEFAULT_SETTINGS.xp_quiz_perfect,

  level_base_xp:
    data?.level_base_xp ??
    DEFAULT_SETTINGS.level_base_xp,

  badges_enabled:
    data?.badges_enabled ??
    DEFAULT_SETTINGS.badges_enabled,

  app_maintenance_mode:
    data?.app_maintenance_mode ??
    DEFAULT_SETTINGS.app_maintenance_mode,

  app_registration_enabled:
    data?.app_registration_enabled ??
    DEFAULT_SETTINGS.app_registration_enabled,
});


// ===========================================================
// CHARGER LES PARAMÈTRES
// ===========================================================

const fetchSettings = async (force = false) => {
  if (!force && settingsCache) {
    return settingsCache;
  }

  if (!force && settingsLoadingPromise) {
    return settingsLoadingPromise;
  }

  settingsLoadingPromise = (async () => {
    const { data, error: fetchError } =
      await supabase
        .from("admin_settings")
        .select(
          `
            id,
            academy_name,
            academy_description,
            video_default_duration,
            video_premium_enabled,
            xp_lesson_completion,
            xp_quiz_completion,
            xp_quiz_perfect,
            level_base_xp,
            badges_enabled,
            app_maintenance_mode,
            app_registration_enabled
          `
        )
        .limit(1)
        .maybeSingle();

    if (fetchError) {
      throw fetchError;
    }

    const settings = normalizeSettings(data);

    settingsCache = {
      settings,
      id: data?.id ?? null,
    };

    return settingsCache;
  })();

  try {
    return await settingsLoadingPromise;
  } finally {
    settingsLoadingPromise = null;
  }
};


export default function AdminSettings() {
  const [settings, setSettings] =
    useState(
      () =>
        settingsCache?.settings ||
        DEFAULT_SETTINGS
    );

  const [settingsId, setSettingsId] =
    useState(
      () =>
        settingsCache?.id ||
        null
    );

  const [loading, setLoading] =
    useState(
      () => !settingsCache
    );

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");


  // =========================================================
  // CHARGEMENT
  // =========================================================

  const loadSettings = async (
    force = false
  ) => {
    try {
      setError("");
      setSuccess("");

      if (force || !settingsCache) {
        setLoading(true);
      }

      const result =
        await fetchSettings(force);

      setSettings(
        result.settings
      );

      setSettingsId(
        result.id
      );
    } catch (err) {
      console.error(
        "Erreur chargement paramètres :",
        err
      );

      setError(
        err?.message ||
          "Impossible de charger les paramètres."
      );
    } finally {
      setLoading(false);
    }
  };


  // =========================================================
  // CHARGEMENT INITIAL
  // =========================================================

  useEffect(() => {
    loadSettings();
  }, []);


  // =========================================================
  // MODIFICATION D'UN PARAMÈTRE
  // =========================================================

  const updateSetting = (
    field,
    value
  ) => {
    setSettings((current) => ({
      ...current,
      [field]: value,
    }));
  };


  // =========================================================
  // ENREGISTRER
  // =========================================================

  const saveSettings = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      // =====================================================
      // UTILISATEUR ADMIN CONNECTÉ
      // =====================================================

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error(
          "Utilisateur non connecté."
        );
      }

      // =====================================================
      // DONNÉES À ENREGISTRER
      // =====================================================

      const payload = {
        academy_name:
          settings.academy_name.trim(),

        academy_description:
          settings.academy_description.trim(),

        video_default_duration:
          Number(
            settings.video_default_duration
          ),

        video_premium_enabled:
          Boolean(
            settings.video_premium_enabled
          ),

        xp_lesson_completion:
          Number(
            settings.xp_lesson_completion
          ),

        xp_quiz_completion:
          Number(
            settings.xp_quiz_completion
          ),

        xp_quiz_perfect:
          Number(
            settings.xp_quiz_perfect
          ),

        level_base_xp:
          Number(
            settings.level_base_xp
          ),

        badges_enabled:
          Boolean(
            settings.badges_enabled
          ),

        app_maintenance_mode:
          Boolean(
            settings.app_maintenance_mode
          ),

        app_registration_enabled:
          Boolean(
            settings.app_registration_enabled
          ),

        updated_at:
          new Date().toISOString(),

        updated_by:
          user.id,
      };


      // =====================================================
      // VALIDATION DES NOMBRES
      // =====================================================

      const numericFields = [
        [
          "video_default_duration",
          "Durée vidéo par défaut",
        ],
        [
          "xp_lesson_completion",
          "XP leçon",
        ],
        [
          "xp_quiz_completion",
          "XP quiz",
        ],
        [
          "xp_quiz_perfect",
          "XP quiz parfait",
        ],
        [
          "level_base_xp",
          "XP de base du niveau",
        ],
      ];


      for (const [
        field,
        label,
      ] of numericFields) {
        if (
          !Number.isFinite(
            payload[field]
          ) ||
          payload[field] < 0
        ) {
          throw new Error(
            `${label} doit être un nombre positif ou nul.`
          );
        }
      }


      // =====================================================
      // UPDATE OU INSERT
      // =====================================================

      let result;

      if (settingsId) {
        result = await supabase
          .from("admin_settings")
          .update(payload)
          .eq("id", settingsId)
          .select()
          .single();
      } else {
        result = await supabase
          .from("admin_settings")
          .insert(payload)
          .select()
          .single();
      }


      if (result.error) {
        throw result.error;
      }


      // =====================================================
      // METTRE À JOUR L'ID
      // =====================================================

      if (result.data?.id) {
        setSettingsId(
          result.data.id
        );
      }


      // =====================================================
      // METTRE À JOUR LE CACHE
      // =====================================================

      const normalizedSettings =
        normalizeSettings(
          result.data || payload
        );

      settingsCache = {
        settings:
          normalizedSettings,
        id:
          result.data?.id ||
          settingsId ||
          null,
      };


      // =====================================================
      // JOURNAL ADMINISTRATEUR
      // =====================================================

      await logAdminActivity({
        action: "admin_settings_updated",
        details: {
          academy_name:
            payload.academy_name,

          academy_description:
            payload.academy_description,

          video_default_duration:
            payload.video_default_duration,

          video_premium_enabled:
            payload.video_premium_enabled,

          xp_lesson_completion:
            payload.xp_lesson_completion,

          xp_quiz_completion:
            payload.xp_quiz_completion,

          xp_quiz_perfect:
            payload.xp_quiz_perfect,

          level_base_xp:
            payload.level_base_xp,

          badges_enabled:
            payload.badges_enabled,

          app_maintenance_mode:
            payload.app_maintenance_mode,

          app_registration_enabled:
            payload.app_registration_enabled,
        },
      });


      // =====================================================
      // SUCCÈS
      // =====================================================

      setSuccess(
        "Les paramètres ont été enregistrés avec succès."
      );

      setTimeout(() => {
        setSuccess("");
      }, 4000);

    } catch (err) {
      console.error(
        "Erreur sauvegarde paramètres :",
        err
      );

      setError(
        err?.message ||
          "Impossible d'enregistrer les paramètres."
      );

    } finally {
      setSaving(false);
    }
  };


  // =========================================================
  // RÉINITIALISATION / ACTUALISATION
  // =========================================================

  const resetForm = () => {
    loadSettings(true);
  };


  // =========================================================
  // CHARGEMENT
  // =========================================================

  if (loading) {
    return (
      <div className="
        min-h-[60vh]
        flex
        flex-col
        items-center
        justify-center
        px-5
      ">

        <div className="
          w-14
          h-14
          rounded-2xl
          bg-accent-soft
          border
          border-accent
          flex
          items-center
          justify-center
          mb-4
        ">

          <Loader2
            size={28}
            className="
              animate-spin
              text-accent
            "
          />

        </div>

        <p className="
          theme-text
          font-semibold
        ">
          Chargement des paramètres...
        </p>

        <p className="
          theme-text-secondary
          text-sm
          mt-1
        ">
          Préparation de la configuration administrateur.
        </p>

      </div>
    );
  }


  // =========================================================
  // INTERFACE
  // =========================================================

  return (
    <div className="
      min-h-screen
      theme-bg
      theme-text
      px-4
      py-6
      md:px-6
      md:py-8
    ">

      <div className="
        max-w-6xl
        mx-auto
        space-y-6
      ">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <section className="
          relative
          overflow-hidden
          rounded-3xl
          bg-accent-soft
          border
          border-accent
          shadow-lg
          p-6
          md:p-8
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

            <div className="
              flex
              flex-col
              lg:flex-row
              lg:items-center
              lg:justify-between
              gap-5
            ">

              <div>

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

                  <Settings size={14} />

                  Administration

                </div>

                <h1 className="
                  text-2xl
                  md:text-3xl
                  font-bold
                  leading-tight
                  theme-text
                ">
                  Paramètres administrateur
                </h1>

                <p className="
                  theme-text-secondary
                  mt-3
                  leading-relaxed
                  max-w-2xl
                ">
                  Configurez les paramètres généraux de
                  Kalan Academy, les vidéos, la progression
                  XP et le fonctionnement de l'application.
                </p>

                <div className="
                  flex
                  flex-wrap
                  items-center
                  gap-3
                  mt-5
                ">

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
                    <Building2
                      size={16}
                      className="text-accent"
                    />
                    Kalan Academy
                  </div>

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
                    <Trophy
                      size={16}
                      className="text-accent"
                    />
                    XP et badges
                  </div>

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
                    <Smartphone
                      size={16}
                      className="text-accent"
                    />
                    Application
                  </div>

                </div>

              </div>


              <div className="
                flex
                flex-col
                sm:flex-row
                lg:flex-col
                gap-3
                shrink-0
              ">

                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  className="
                    inline-flex
                    items-center
                    justify-center
                    gap-2
                    px-4
                    py-3
                    rounded-xl
                    theme-surface
                    theme-border
                    border
                    theme-text
                    font-semibold
                    shadow-sm
                    hover:bg-accent-soft
                    hover:text-accent
                    transition
                    disabled:opacity-50
                  "
                >

                  <RefreshCw
                    size={18}
                  />

                  Actualiser

                </button>


                <button
                  type="button"
                  onClick={saveSettings}
                  disabled={saving}
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

        </section>


        {/* =====================================================
            ERREUR
        ===================================================== */}

        {error && (
          <div className="
            p-4
            rounded-2xl
            bg-red-50
            dark:bg-red-950/30
            border
            border-red-200
            dark:border-red-900
            text-red-700
            dark:text-red-300
            flex
            gap-3
          ">

            <AlertCircle
              size={20}
              className="shrink-0 mt-0.5"
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
          <div className="
            p-4
            rounded-2xl
            bg-green-50
            dark:bg-green-950/30
            border
            border-green-200
            dark:border-green-900
            text-green-700
            dark:text-green-300
            flex
            gap-3
          ">

            <CheckCircle
              size={20}
              className="shrink-0"
            />

            <p className="
              text-sm
              font-medium
            ">
              {success}
            </p>

          </div>
        )}


        <div className="
          max-w-5xl
          space-y-6
        ">

          {/* ===================================================
              INFORMATIONS KALAN ACADEMY
          =================================================== */}

          <SettingsSection
            icon={Building2}
            title="Kalan Academy"
            description="Informations générales affichées dans l'application."
          >

            <div className="
              grid
              grid-cols-1
              gap-5
            ">

              <Field
                label="Nom de l'application"
              >

                <input
                  type="text"
                  value={
                    settings.academy_name
                  }
                  onChange={(event) =>
                    updateSetting(
                      "academy_name",
                      event.target.value
                    )
                  }
                  className={inputClass}
                  placeholder="Kalan Academy"
                />

              </Field>


              <Field
                label="Description"
              >

                <textarea
                  rows={4}
                  value={
                    settings.academy_description
                  }
                  onChange={(event) =>
                    updateSetting(
                      "academy_description",
                      event.target.value
                    )
                  }
                  className={inputClass}
                  placeholder="Description de Kalan Academy..."
                />

              </Field>

            </div>

          </SettingsSection>


          {/* ===================================================
              VIDÉOS
          =================================================== */}

          <SettingsSection
            icon={Video}
            title="Vidéos et contenus"
            description="Paramètres par défaut pour les vidéos pédagogiques."
          >

            <div className="
              grid
              grid-cols-1
              md:grid-cols-2
              gap-5
            ">

              <Field
                label="Durée vidéo par défaut"
                suffix="minutes"
              >

                <input
                  type="number"
                  min="0"
                  value={
                    settings.video_default_duration
                  }
                  onChange={(event) =>
                    updateSetting(
                      "video_default_duration",
                      event.target.value
                    )
                  }
                  className={inputClass}
                />

              </Field>


              <Toggle
                label="Vidéos premium"
                description="Autoriser les leçons vidéo réservées aux utilisateurs premium."
                checked={
                  settings.video_premium_enabled
                }
                onChange={(value) =>
                  updateSetting(
                    "video_premium_enabled",
                    value
                  )
                }
              />

            </div>

          </SettingsSection>


          {/* ===================================================
              XP / NIVEAUX / BADGES
          =================================================== */}

          <SettingsSection
            icon={Trophy}
            title="XP, niveaux et badges"
            description="Configurez la progression et la récompense des élèves."
          >

            <div className="
              grid
              grid-cols-1
              md:grid-cols-2
              gap-5
            ">

              <Field
                label="XP pour terminer une leçon"
                suffix="XP"
              >

                <input
                  type="number"
                  min="0"
                  value={
                    settings.xp_lesson_completion
                  }
                  onChange={(event) =>
                    updateSetting(
                      "xp_lesson_completion",
                      event.target.value
                    )
                  }
                  className={inputClass}
                />

              </Field>


              <Field
                label="XP pour terminer un quiz"
                suffix="XP"
              >

                <input
                  type="number"
                  min="0"
                  value={
                    settings.xp_quiz_completion
                  }
                  onChange={(event) =>
                    updateSetting(
                      "xp_quiz_completion",
                      event.target.value
                    )
                  }
                  className={inputClass}
                />

              </Field>


              <Field
                label="Bonus XP quiz parfait"
                suffix="XP"
              >

                <input
                  type="number"
                  min="0"
                  value={
                    settings.xp_quiz_perfect
                  }
                  onChange={(event) =>
                    updateSetting(
                      "xp_quiz_perfect",
                      event.target.value
                    )
                  }
                  className={inputClass}
                />

              </Field>


              <Field
                label="XP de base pour un niveau"
                suffix="XP"
              >

                <input
                  type="number"
                  min="0"
                  value={
                    settings.level_base_xp
                  }
                  onChange={(event) =>
                    updateSetting(
                      "level_base_xp",
                      event.target.value
                    )
                  }
                  className={inputClass}
                />

              </Field>


              <Toggle
                label="Système de badges"
                description="Activer les badges et leurs récompenses."
                checked={
                  settings.badges_enabled
                }
                onChange={(value) =>
                  updateSetting(
                    "badges_enabled",
                    value
                  )
                }
              />

            </div>

          </SettingsSection>


          {/* ===================================================
              APPLICATION
          =================================================== */}

          <SettingsSection
            icon={Smartphone}
            title="Application"
            description="Paramètres généraux de fonctionnement."
          >

            <div className="space-y-4">

              <Toggle
                label="Inscriptions activées"
                description="Autoriser la création de nouveaux comptes élèves."
                checked={
                  settings.app_registration_enabled
                }
                onChange={(value) =>
                  updateSetting(
                    "app_registration_enabled",
                    value
                  )
                }
              />


              <Toggle
                label="Mode maintenance"
                description="Désactiver temporairement l'accès normal à l'application."
                checked={
                  settings.app_maintenance_mode
                }
                onChange={(value) =>
                  updateSetting(
                    "app_maintenance_mode",
                    value
                  )
                }
                danger
              />

            </div>

          </SettingsSection>


          {/* ===================================================
              BOUTON FINAL
          =================================================== */}

          <div className="
            flex
            justify-end
            pt-2
          ">

            <button
              type="button"
              onClick={saveSettings}
              disabled={saving}
              className="
                inline-flex
                items-center
                gap-2
                px-6
                py-3
                rounded-xl
                bg-accent
                text-white
                hover:opacity-90
                hover:-translate-y-0.5
                transition
                disabled:opacity-50
                disabled:cursor-not-allowed
                font-bold
                shadow-md
              "
            >

              {saving ? (
                <Loader2
                  size={19}
                  className="animate-spin"
                />
              ) : (
                <Save size={19} />
              )}

              Enregistrer les paramètres

            </button>

          </div>

        </div>

      </div>

    </div>
  );
}


// ===========================================================
// SECTION
// ===========================================================

function SettingsSection({
  icon: Icon,
  title,
  description,
  children,
}) {
  return (
    <section className="
      theme-surface
      theme-border
      border
      rounded-3xl
      shadow-sm
      overflow-hidden
    ">

      <div className="
        p-5
        md:p-6
        border-b
        theme-border
        flex
        items-start
        gap-3
      ">

        <div className="
          w-11
          h-11
          shrink-0
          rounded-2xl
          bg-accent-soft
          border
          border-accent
          text-accent
          flex
          items-center
          justify-center
        ">

          <Icon
            size={21}
          />

        </div>

        <div>

          <h2 className="
            text-lg
            md:text-xl
            font-bold
            theme-text
          ">
            {title}
          </h2>

          <p className="
            text-sm
            theme-text-secondary
            mt-1
          ">
            {description}
          </p>

        </div>

      </div>


      <div className="p-5 md:p-6">
        {children}
      </div>

    </section>
  );
}


// ===========================================================
// CHAMP
// ===========================================================

function Field({
  label,
  suffix,
  children,
}) {
  return (
    <div>

      <label className="
        block
        text-sm
        font-semibold
        theme-text
        mb-2
      ">
        {label}
      </label>

      <div className="relative">

        {children}

        {suffix && (
          <span className="
            absolute
            right-3
            top-1/2
            -translate-y-1/2
            text-sm
            theme-text-secondary
            pointer-events-none
          ">
            {suffix}
          </span>
        )}

      </div>

    </div>
  );
}


// ===========================================================
// TOGGLE
// ===========================================================

function Toggle({
  label,
  description,
  checked,
  onChange,
  danger = false,
}) {
  return (
    <div className="
      flex
      items-center
      justify-between
      gap-4
      p-4
      rounded-2xl
      theme-border
      border
      cursor-pointer
      hover:bg-accent-soft
      transition
    ">

      <div>

        <p className={`
          font-semibold
          ${
            danger && checked
              ? "text-red-700 dark:text-red-300"
              : "theme-text"
          }
        `}>
          {label}
        </p>

        <p className="
          text-xs
          theme-text-secondary
          mt-1
          max-w-xl
        ">
          {description}
        </p>

      </div>


      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() =>
          onChange(!checked)
        }
        className={`
          relative
          shrink-0
          w-12
          h-6
          rounded-full
          transition
          ${
            checked
              ? danger
                ? "bg-red-600"
                : "bg-accent"
              : "bg-gray-300 dark:bg-gray-700"
          }
        `}
      >

        <span className={`
          absolute
          top-1
          w-4
          h-4
          bg-white
          rounded-full
          shadow
          transition
          ${
            checked
              ? "left-7"
              : "left-1"
          }
        `} />

      </button>

    </div>
  );
}


// ===========================================================
// STYLE INPUT
// ===========================================================

const inputClass = `
  w-full
  theme-surface
  theme-text
  theme-border
  border
  rounded-xl
  px-4
  py-3
  outline-none
  focus:ring-2
  focus:ring-accent
  focus:border-accent
  transition
  placeholder:text-gray-400
  dark:placeholder:text-gray-500
`;