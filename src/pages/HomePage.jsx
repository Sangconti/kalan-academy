// src/pages/HomePage.jsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getClasses } from "../services/educationService";

import {
  GraduationCap,
  ArrowRight,
  BookOpen
} from "lucide-react";

export default function HomePage() {
  const navigate = useNavigate();

  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadClasses() {
      try {
        const data = await getClasses();

        setClasses(data || []);
      } catch (error) {
        console.error(
          "Erreur classes :",
          error
        );

        setClasses([]);
      } finally {
        setLoading(false);
      }
    }

    loadClasses();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">

          <div className="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />

          <p className="text-gray-500 font-medium">
            Chargement...
          </p>

        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 pb-10">

      {/* HERO */}

      <div
        className="
          relative
          overflow-hidden
          rounded-3xl
          bg-gradient-to-br
          from-blue-600
          via-blue-700
          to-indigo-900
          text-white
          p-6
          md:p-10
          mb-8
          shadow-xl
        "
      >

        <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-white/10" />

        <div className="absolute -right-10 bottom-[-80px] w-60 h-60 rounded-full bg-white/5" />

        <div className="relative z-10 max-w-2xl">

          <div className="flex items-center gap-3 mb-5">

            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
              <GraduationCap size={32} />
            </div>

            <div>
              <p className="text-blue-100 text-sm">
                Bienvenue sur
              </p>

              <h1 className="text-2xl md:text-3xl font-bold">
                Kalan Academy
              </h1>
            </div>

          </div>

          <h2 className="text-2xl md:text-4xl font-bold leading-tight">
            Apprends. Progresse.
            <br />
            Réussis.
          </h2>

          <p className="text-blue-100 mt-4 max-w-xl leading-relaxed">
            Choisis ta classe et commence à apprendre
            les matières de ton programme scolaire.
          </p>

        </div>

      </div>

      {/* TITRE */}

      <div className="flex items-center justify-between mb-5">

        <div>

          <h2 className="text-xl md:text-2xl font-bold text-gray-900">
            Choisis ta classe
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Sélectionne ton niveau pour continuer.
          </p>

        </div>

        <div className="hidden sm:flex w-11 h-11 rounded-xl bg-blue-50 items-center justify-center">
          <BookOpen
            size={21}
            className="text-blue-600"
          />
        </div>

      </div>

      {/* CLASSES */}

      {classes.length === 0 ? (

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center">

          <GraduationCap
            size={42}
            className="mx-auto text-gray-300 mb-4"
          />

          <p className="text-gray-500">
            Aucune classe disponible.
          </p>

        </div>

      ) : (

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

          {classes.map((classe, index) => (

            <button
              key={classe.id}
              onClick={() =>
                navigate(`/class/${classe.id}`)
              }
              className="
                group
                relative
                overflow-hidden
                bg-white
                rounded-3xl
                border
                border-gray-100
                p-5
                md:p-6
                text-left
                shadow-sm
                hover:shadow-xl
                hover:-translate-y-1
                transition-all
              "
            >

              {/* BARRE */}

              <div
                className={`
                  absolute
                  left-0
                  top-0
                  right-0
                  h-1.5
                  ${
                    index % 3 === 0
                      ? "bg-blue-600"
                      : index % 3 === 1
                      ? "bg-purple-600"
                      : "bg-green-600"
                  }
                `}
              />

              <div className="flex items-start justify-between gap-4">

                <div
                  className={`
                    w-14
                    h-14
                    rounded-2xl
                    flex
                    items-center
                    justify-center
                    ${
                      index % 3 === 0
                        ? "bg-blue-50 text-blue-600"
                        : index % 3 === 1
                        ? "bg-purple-50 text-purple-600"
                        : "bg-green-50 text-green-600"
                    }
                  `}
                >
                  <GraduationCap size={28} />
                </div>

                <ArrowRight
                  size={21}
                  className="
                    text-gray-300
                    group-hover:text-blue-600
                    group-hover:translate-x-1
                    transition
                  "
                />

              </div>

              <h3 className="mt-5 text-xl font-bold text-gray-900">
                {classe.name}
              </h3>

              {classe.description && (
                <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                  {classe.description}
                </p>
              )}

              <div className="mt-5 text-sm font-semibold text-blue-600">
                Commencer →
              </div>

            </button>

          ))}

        </div>

      )}

    </div>
  );
}