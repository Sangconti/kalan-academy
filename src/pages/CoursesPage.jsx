// src/pages/CoursesPage.jsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { supabase } from "../lib/supabase";

import {
  getCachedClasses,
  cacheClasses,
} from "../offline/db";

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  GraduationCap,
} from "lucide-react";

export default function CoursesPage() {
  const navigate = useNavigate();

  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined"
      ? navigator.onLine
      : true
  );

  // ==========================================
  // DÉTECTION RÉSEAU LOCALE
  // ==========================================

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
    }

    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // ==========================================
  // CHARGEMENT DES CLASSES
  // ==========================================

  useEffect(() => {
    let cancelled = false;

    async function loadClasses() {
      try {
        setLoading(true);

        // ======================================
        // 1. CACHE DEXIE EN PRIORITÉ
        // ======================================

        const cachedClasses = await getCachedClasses();

        if (cancelled) return;

        if (
          Array.isArray(cachedClasses) &&
          cachedClasses.length > 0
        ) {
          console.log(
            "📦 [COURS] Classes trouvées dans Dexie :",
            cachedClasses.length
          );

          setClasses(cachedClasses);
          setLoading(false);
        } else {
          console.log(
            "📭 [COURS] Aucune classe disponible dans Dexie"
          );
        }

        // ======================================
        // 2. SI PAS INTERNET → CACHE UNIQUEMENT
        // ======================================

        if (!isOnline) {
          console.log(
            "📴 [COURS] Hors ligne → utilisation du cache"
          );

          return;
        }

        // ======================================
        // 3. SUPABASE DIRECT
        //    Aucun appel à getClasses()
        //    donc aucun HEAD /rest/v1/
        // ======================================

        console.log(
          "🌐 [COURS] Chargement direct depuis Supabase"
        );

        const {
          data,
          error,
        } = await supabase
          .from("classes")
          .select("*")
          .order("order_number", {
            ascending: true,
          });

        if (error) {
          throw error;
        }

        const freshClasses = Array.isArray(data)
          ? data
          : [];

        if (cancelled) return;

        // ======================================
        // 4. MISE À JOUR DE L'INTERFACE
        // ======================================

        setClasses(freshClasses);

        // ======================================
        // 5. MISE EN CACHE DEXIE
        // ======================================

        if (freshClasses.length > 0) {
          await cacheClasses(freshClasses);

          console.log(
            "📦 [COURS] Classes Supabase mises en cache :",
            freshClasses.length
          );
        }
      } catch (error) {
        console.error(
          "❌ Erreur chargement des cours :",
          error
        );

        // ======================================
        // FALLBACK DEXIE
        // ======================================

        try {
          const fallbackClasses =
            await getCachedClasses();

          if (cancelled) return;

          if (Array.isArray(fallbackClasses)) {
            setClasses(fallbackClasses);
          }
        } catch (cacheError) {
          console.error(
            "❌ Erreur fallback Dexie :",
            cacheError
          );

          if (!cancelled) {
            setClasses([]);
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadClasses();

    return () => {
      cancelled = true;
    };
  }, [isOnline]);

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="min-h-[60vh] theme-bg flex flex-col items-center justify-center px-6">
        <div className="w-14 h-14 rounded-2xl bg-accent-soft border border-accent flex items-center justify-center mb-4">
          <GraduationCap
            size={28}
            className="text-accent"
          />
        </div>

        <p className="theme-text font-medium">
          Chargement des cours...
        </p>
      </div>
    );
  }

  // ==========================================
  // INTERFACE
  // ==========================================

  return (
    <div className="min-h-screen theme-bg theme-text pb-8">

      {/* ======================================
          HEADER
      ====================================== */}

      <div className="theme-surface theme-border border-b shadow-sm px-5 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">

          {/* LOGO */}

          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center shadow-sm group-hover:opacity-90 transition">
              <GraduationCap size={23} />
            </div>

            <div className="text-left">
              <p className="text-base font-bold theme-text leading-none">
                Kalan Academy
              </p>

              <p className="text-xs theme-text-secondary mt-1">
                Apprendre. Progresser. Réussir.
              </p>
            </div>
          </button>

          {/* RETOUR */}

          <button
            type="button"
            onClick={() => navigate("/")}
            className="hidden sm:flex items-center gap-2 text-sm font-medium theme-text-secondary hover:text-accent transition"
          >
            <ArrowLeft size={17} />
            Accueil
          </button>
        </div>
      </div>

      {/* ======================================
          CONTENU
      ====================================== */}

      <main className="max-w-5xl mx-auto px-5 py-7">

        {/* ====================================
            EN-TÊTE
        ==================================== */}

        <div className="relative overflow-hidden rounded-3xl bg-accent-soft border border-accent shadow-lg p-6 md:p-8 mb-7">

          {/* DÉCORATIONS */}

          <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-accent opacity-10" />

          <div className="absolute -left-16 -bottom-20 w-48 h-48 rounded-full bg-accent opacity-10" />

          <div className="absolute right-16 -bottom-24 w-56 h-56 rounded-full bg-accent opacity-5" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">

            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent text-white text-xs font-semibold mb-3">
                <GraduationCap size={14} />
                Kalan Academy
              </div>

              <h1 className="text-2xl md:text-3xl font-bold leading-tight theme-text">
                Mes cours
              </h1>

              <p className="theme-text-secondary mt-3 leading-relaxed max-w-xl">
                Choisis ton niveau scolaire pour accéder
                à tes matières et à tes leçons.
              </p>
            </div>

            <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-white/70 dark:bg-gray-950/30 border border-white/50 dark:border-white/10 items-center justify-center shrink-0">
              <BookOpen
                size={27}
                className="text-accent"
              />
            </div>
          </div>
        </div>

        {/* ====================================
            AUCUNE CLASSE
        ==================================== */}

        {classes.length === 0 ? (
          <div className="theme-surface rounded-3xl border theme-border shadow-sm p-10 text-center">

            <div className="w-16 h-16 rounded-2xl bg-accent-soft border border-accent mx-auto mb-4 flex items-center justify-center">
              <GraduationCap
                size={32}
                className="text-accent"
              />
            </div>

            <h2 className="text-lg font-bold theme-text">
              Aucun cours disponible
            </h2>

            <p className="text-sm theme-text-secondary mt-2 max-w-sm mx-auto">
              Les classes disponibles apparaîtront
              ici dès qu'elles seront ajoutées.
            </p>

            <button
              type="button"
              onClick={() => navigate("/")}
              className="mt-6 inline-flex items-center gap-2 bg-accent text-white px-5 py-3 rounded-xl font-semibold shadow-md hover:opacity-90 hover:-translate-y-0.5 transition"
            >
              <ArrowLeft size={18} />
              Retour à l'accueil
            </button>
          </div>
        ) : (

          /* ==================================
             LISTE DES CLASSES
          ================================== */

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

            {classes.map((classe) => (
              <button
                key={classe.id}
                type="button"
                onClick={() => navigate(`/class/${classe.id}`)}
                className="group relative overflow-hidden theme-surface rounded-3xl border theme-border p-5 md:p-6 text-left shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all"
              >

                {/* BARRE SUPÉRIEURE */}

                <div className="absolute left-0 right-0 top-0 h-1.5 bg-accent" />

                {/* ICÔNE + FLÈCHE */}

                <div className="flex items-start justify-between gap-4">

                  <div className="w-14 h-14 rounded-2xl bg-accent-soft border border-accent flex items-center justify-center text-accent">
                    <GraduationCap size={28} />
                  </div>

                  <ArrowRight
                    size={21}
                    className="theme-text-secondary group-hover:text-accent group-hover:translate-x-1 transition"
                  />
                </div>

                {/* NOM */}

                <h2 className="mt-5 text-xl font-bold theme-text">
                  {classe.name}
                </h2>

                {/* DESCRIPTION */}

                {classe.description && (
                  <p className="text-sm theme-text-secondary mt-2 leading-relaxed line-clamp-2">
                    {classe.description}
                  </p>
                )}

                {/* ACTION */}

                <div className="mt-5 flex items-center justify-between">

                  <span className="text-sm font-semibold text-accent">
                    Voir les matières
                  </span>

                  <span className="text-xs font-medium theme-text-secondary">
                    Commencer →
                  </span>
                </div>

              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}