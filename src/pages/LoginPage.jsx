// src/pages/LoginPage.jsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { getCurrentAdmin } from "../services/adminAuthService";

import {
  BookOpen,
  Mail,
  Lock,
  LogIn,
  UserPlus,
  GraduationCap,
  Loader2
} from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();

  const [isSignUp, setIsSignUp] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ==========================================
  // CONNEXION / INSCRIPTION
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("🔐 [LOGIN PAGE] Soumission du formulaire");
    console.log("📧 [LOGIN PAGE] email =", email.trim());
    console.log(
      "🎯 [LOGIN PAGE] mode =",
      isSignUp ? "INSCRIPTION" : "CONNEXION"
    );

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // ========================================
      // INSCRIPTION
      // ========================================

      if (isSignUp) {
        console.log("📝 [LOGIN PAGE] Début inscription");

        const {
          data,
          error: signUpError
        } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim()
            }
          }
        });

        console.log(
          "📝 [LOGIN PAGE] signUp data =",
          data
        );

        console.log(
          "❌ [LOGIN PAGE] signUp error =",
          signUpError
        );

        if (signUpError) {
          throw signUpError;
        }

        setSuccess(
          "Inscription réussie ! Tu peux maintenant te connecter."
        );

        setIsSignUp(false);
        setFullName("");
        setEmail("");
        setPassword("");

        console.log(
          "✅ [LOGIN PAGE] Inscription terminée"
        );

        return;
      }

      // ========================================
      // CONNEXION
      // ========================================

      console.log(
        "🔑 [LOGIN PAGE] Début connexion Supabase"
      );

      const {
        data,
        error: loginError
      } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      console.log(
        "👤 [LOGIN PAGE] signIn data =",
        data
      );

      console.log(
        "❌ [LOGIN PAGE] signIn error =",
        loginError
      );

      if (loginError) {
        throw loginError;
      }

      console.log(
        "✅ [LOGIN PAGE] Session Supabase obtenue",
        data?.user?.id
      );

      // ========================================
      // VÉRIFICATION DU RÔLE
      // ========================================

      console.log(
        "👑 [LOGIN PAGE] Vérification du rôle..."
      );

      const admin = await getCurrentAdmin();

      console.log(
        "👑 [LOGIN PAGE] getCurrentAdmin =",
        admin
      );

      // ========================================
      // ADMIN / SUPER ADMIN
      // ========================================

      if (admin) {
        console.log(
          "✅ [LOGIN PAGE] Utilisateur administrateur détecté"
        );

        console.log(
          "🎭 [LOGIN PAGE] role =",
          admin.profile?.role
        );

        console.log(
          "➡️ [LOGIN PAGE] Redirection vers /admin"
        );

        navigate("/admin", {
          replace: true
        });

        return;
      }

      // ========================================
      // UTILISATEUR ÉLÈVE
      // ========================================

      console.log(
        "👨‍🎓 [LOGIN PAGE] Utilisateur élève détecté"
      );

      console.log(
        "➡️ [LOGIN PAGE] Redirection vers /"
      );

      navigate("/", {
        replace: true
      });

    } catch (err) {
      console.error(
        "💥 [LOGIN PAGE] Erreur authentification =",
        err
      );

      setError(
        err?.message ||
        "Une erreur est survenue. Vérifie tes informations."
      );

    } finally {
      setLoading(false);

      console.log(
        "🏁 [LOGIN PAGE] handleSubmit terminé"
      );
    }
  };

  // ==========================================
  // CHANGER MODE
  // ==========================================

  function toggleMode() {
    setIsSignUp((previous) => !previous);
    setError("");
    setSuccess("");
  }

  // ==========================================
  // INTERFACE
  // ==========================================

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* HEADER */}

      <header className="bg-white border-b border-gray-100 px-5 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">

          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm group-hover:bg-blue-700 transition">
              <GraduationCap size={23} />
            </div>

            <div className="text-left">
              <p className="text-base font-bold text-gray-900 leading-none">
                Kalan Academy
              </p>

              <p className="text-xs text-gray-500 mt-1">
                Apprendre. Progresser. Réussir.
              </p>
            </div>
          </button>

        </div>
      </header>

      {/* CONTENU */}

      <main className="flex-1 flex items-center justify-center px-5 py-10">

        <div className="w-full max-w-md">

          {/* INTRODUCTION */}

          <div className="text-center mb-7">

            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <BookOpen size={28} />
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {isSignUp
                ? "Créer ton compte"
                : "Bienvenue sur Kalan Academy"}
            </h1>

            <p className="text-gray-500 mt-2 text-sm leading-relaxed">
              {isSignUp
                ? "Crée ton compte et commence ton apprentissage."
                : "Connecte-toi pour continuer ton apprentissage."}
            </p>

          </div>

          {/* CARTE */}

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">

            {/* MODE */}

            <div className="flex bg-gray-50 rounded-xl p-1 mb-6">

              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  setError("");
                  setSuccess("");
                }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition ${
                  !isSignUp
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Se connecter
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true);
                  setError("");
                  setSuccess("");
                }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition ${
                  isSignUp
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                S'inscrire
              </button>

            </div>

            {/* ERREUR */}

            {error && (
              <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* SUCCÈS */}

            {success && (
              <div className="mb-5 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">
                {success}
              </div>
            )}

            {/* FORMULAIRE */}

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >

            {/* NOM COMPLET */}

            {isSignUp && (
              <div>

                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nom complet
                </label>

                <input
                  type="text"
                  placeholder="Exemple : Abdoulaye Sangaré"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={loading}
                  required
                  autoComplete="name"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:bg-gray-50"
                />

              </div>
            )}

              {/* EMAIL */}

              <div>

                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Adresse e-mail
                </label>

                <div className="relative">

                  <Mail
                    size={19}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="email"
                    placeholder="exemple@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                    autoComplete="email"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:bg-gray-50"
                  />

                </div>

              </div>

              {/* MOT DE PASSE */}

              <div>

                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mot de passe
                </label>

                <div className="relative">

                  <Lock
                    size={19}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="password"
                    placeholder="Ton mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                    minLength={6}
                    autoComplete={
                      isSignUp
                        ? "new-password"
                        : "current-password"
                    }
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:bg-gray-50"
                  />

                </div>

                {isSignUp && (
                  <p className="text-xs text-gray-400 mt-2">
                    Le mot de passe doit contenir au moins 6 caractères.
                  </p>
                )}

              </div>

              {/* BOUTON */}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-3.5 px-5 rounded-xl shadow-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
              >

                {loading ? (
                  <>
                    <Loader2
                      size={19}
                      className="animate-spin"
                    />
                    Chargement...
                  </>
                ) : isSignUp ? (
                  <>
                    <UserPlus size={19} />
                    Créer mon compte
                  </>
                ) : (
                  <>
                    <LogIn size={19} />
                    Se connecter
                  </>
                )}

              </button>

            </form>

            {/* BAS DE CARTE */}

            <div className="mt-6 pt-5 border-t border-gray-100 text-center">

              <p className="text-sm text-gray-500">
                {isSignUp
                  ? "Tu as déjà un compte ?"
                  : "Tu n'as pas encore de compte ?"}
              </p>

              <button
                type="button"
                onClick={toggleMode}
                className="mt-1 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline transition"
              >
                {isSignUp
                  ? "Se connecter"
                  : "Créer un compte"}
              </button>

            </div>

          </div>

          {/* FOOTER */}

          <p className="text-center text-xs text-gray-400 mt-6">
            Apprends partout, même hors ligne avec Kalan Academy.
          </p>

        </div>

      </main>

    </div>
  );
}