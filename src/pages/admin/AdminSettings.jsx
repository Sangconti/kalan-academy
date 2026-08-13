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

import { supabase } from "../../lib/supabase";


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


export default function AdminSettings() {
  const [settings, setSettings] =
    useState(DEFAULT_SETTINGS);

  const [settingsId, setSettingsId] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");


  // =========================================================
  // CHARGER LES PARAMÈTRES
  // =========================================================

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const { data, error: fetchError } =
        await supabase
          .from("admin_settings")
          .select("*")
          .limit(1)
          .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      if (data) {
        setSettings({
          academy_name:
            data.academy_name ??
            DEFAULT_SETTINGS.academy_name,

          academy_description:
            data.academy_description ??
            DEFAULT_SETTINGS.academy_description,

          video_default_duration:
            data.video_default_duration ??
            DEFAULT_SETTINGS.video_default_duration,

          video_premium_enabled:
            data.video_premium_enabled ??
            DEFAULT_SETTINGS.video_premium_enabled,

          xp_lesson_completion:
            data.xp_lesson_completion ??
            DEFAULT_SETTINGS.xp_lesson_completion,

          xp_quiz_completion:
            data.xp_quiz_completion ??
            DEFAULT_SETTINGS.xp_quiz_completion,

          xp_quiz_perfect:
            data.xp_quiz_perfect ??
            DEFAULT_SETTINGS.xp_quiz_perfect,

          level_base_xp:
            data.level_base_xp ??
            DEFAULT_SETTINGS.level_base_xp,

          badges_enabled:
            data.badges_enabled ??
            DEFAULT_SETTINGS.badges_enabled,

          app_maintenance_mode:
            data.app_maintenance_mode ??
            DEFAULT_SETTINGS.app_maintenance_mode,

          app_registration_enabled:
            data.app_registration_enabled ??
            DEFAULT_SETTINGS.app_registration_enabled,
        });

        setSettingsId(data.id);
      } else {
        setSettings(DEFAULT_SETTINGS);
      }
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

        // ===================================================
        // TRAÇABILITÉ
        // ===================================================

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
  // RÉINITIALISATION LOCALE
  // =========================================================

  const resetForm = () => {
    loadSettings();
  };


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
              className="
                animate-spin
                text-blue-600
                mx-auto
                mb-4
              "
            />

            <p className="text-slate-600">
              Chargement des paramètres...
            </p>

          </div>

        </div>

      </div>
    );
  }


  // =========================================================
  // INTERFACE
  // =========================================================

  return (
    <div className="p-6">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="
        flex
        flex-col
        lg:flex-row
        lg:items-center
        lg:justify-between
        gap-4
        mb-6
      ">

        <div className="flex items-center gap-3">

          <div className="
            p-3
            bg-slate-100
            rounded-xl
          ">

            <Settings
              size={26}
              className="text-slate-700"
            />

          </div>

          <div>

            <h1 className="
              text-2xl
              font-bold
              text-slate-900
            ">
              Paramètres administrateur
            </h1>

            <p className="
              text-sm
              text-slate-500
              mt-1
            ">
              Configurez les paramètres généraux de Kalan Academy.
            </p>

          </div>

        </div>


        <div className="flex gap-3">

          <button
            type="button"
            onClick={resetForm}
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
              hover:bg-slate-50
              disabled:opacity-50
            "
          >

            <RefreshCw size={18} />

            Actualiser

          </button>


          <button
            type="button"
            onClick={saveSettings}
            disabled={saving}
            className="
              inline-flex
              items-center
              gap-2
              px-5
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


      {/* =====================================================
          ERREUR
      ===================================================== */}

      {error && (
        <div className="
          mb-6
          p-4
          rounded-xl
          bg-red-50
          border
          border-red-200
          text-red-700
          flex
          gap-3
        ">

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
        <div className="
          mb-6
          p-4
          rounded-xl
          bg-green-50
          border
          border-green-200
          text-green-700
          flex
          gap-3
        ">

          <CheckCircle
            size={20}
            className="shrink-0"
          />

          <p className="text-sm font-medium">
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
              rounded-lg
              bg-blue-600
              text-white
              hover:bg-blue-700
              disabled:opacity-50
              disabled:cursor-not-allowed
              font-semibold
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
      bg-white
      border
      border-slate-200
      rounded-xl
      overflow-hidden
    ">

      <div className="
        p-5
        border-b
        border-slate-200
        flex
        items-start
        gap-3
      ">

        <div className="
          p-2.5
          bg-slate-100
          rounded-lg
        ">

          <Icon
            size={20}
            className="text-slate-700"
          />

        </div>

        <div>

          <h2 className="
            text-lg
            font-semibold
            text-slate-900
          ">
            {title}
          </h2>

          <p className="
            text-sm
            text-slate-500
            mt-1
          ">
            {description}
          </p>

        </div>

      </div>


      <div className="p-5">
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
        text-slate-700
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
            text-slate-400
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

      <div>

        <p className={`
          font-semibold
          ${danger && checked
            ? "text-red-700"
            : "text-slate-800"
          }
        `}>
          {label}
        </p>

        <p className="
          text-xs
          text-slate-500
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
                : "bg-blue-600"
              : "bg-slate-300"
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

    </label>
  );
}


// ===========================================================
// STYLE INPUT
// ===========================================================

const inputClass = `
  w-full
  border
  border-slate-300
  rounded-lg
  px-4
  py-2.5
  outline-none
  focus:ring-2
  focus:ring-blue-500
  focus:border-blue-500
  bg-white
`;