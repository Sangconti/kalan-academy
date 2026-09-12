// src/pages/LoginPage.jsx

import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { getCurrentAdmin } from "../services/adminAuthService";
import {
  registerUserDevice,
  recoverUserDevice,
  generateDeviceRecoveryCode
} from "../services/deviceService";

import {
  BookOpen,
  Mail,
  Lock,
  LogIn,
  UserPlus,
  GraduationCap,
  Loader2,
  Smartphone,
  KeyRound,
  ArrowLeft
} from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();

  const [isSignUp, setIsSignUp] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  // ==========================================
  // PROTECTION CONTRE UN SUBMIT PARASITE
  // APRÈS LE RETOUR DE RÉCUPÉRATION
  // ==========================================

  const skipNextSubmitRef = useRef(false);

  // ==========================================
  // RÉCUPÉRATION APPAREIL
  // ==========================================

  const [recoveryRequired, setRecoveryRequired] =
    useState(false);

  const [recoveryCode, setRecoveryCode] =
    useState("");

  // ==========================================
  // ÉTAT
  // ==========================================

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ==========================================
  // REDIRECTION APRÈS AUTORISATION APPAREIL
  // ==========================================

  async function continueAfterDeviceAuthorization() {
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
  }

  // ==========================================
  // RÉCUPÉRER L'APPAREIL AVEC LE CODE
  // ==========================================

  async function handleDeviceRecovery(e) {
    e.preventDefault();

    console.log(
      "🔐 [RECOVERY] Début récupération appareil"
    );

    const normalizedCode =
      recoveryCode.trim().toUpperCase();

    if (!normalizedCode) {
      setError(
        "Entre ton code de récupération."
      );

      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // ========================================
      // VÉRIFIER LA SESSION
      // ========================================

      const {
        data: sessionData,
        error: sessionError
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      const session =
        sessionData?.session;

      console.log(
        "🔐 [RECOVERY] Session présente =",
        !!session
      );

      console.log(
        "👤 [RECOVERY] User ID =",
        session?.user?.id
      );

      if (!session?.user) {
        setRecoveryRequired(false);

        throw new Error(
          "Ta session a expiré. Reconnecte-toi avec ton adresse e-mail et ton mot de passe."
        );
      }

      // ========================================
      // RÉCUPÉRATION VIA DEVICE SERVICE
      // ========================================
      //
      // IMPORTANT :
      //
      // recoverUserDevice() récupère lui-même :
      //
      // - device_id
      // - manufacturer
      // - model
      // - platform
      // - osVersion
      //
      // puis appelle la RPC sécurisée
      // recover_user_device().
      //
      // ========================================

      console.log(
        "📱 [RECOVERY] Récupération du nouvel appareil..."
      );

      const recoveryResult =
        await recoverUserDevice(
          normalizedCode
        );

      console.log(
        "📱 [RECOVERY] Résultat récupération =",
        recoveryResult
      );

      // ========================================
      // CODE INVALIDE
      // ========================================

      if (
        recoveryResult?.status ===
        "invalid_code"
      ) {
        setError(
          "❌ Code de récupération incorrect ou déjà utilisé."
        );

        return;
      }

      // ========================================
      // SESSION NON AUTHENTIFIÉE
      // ========================================

      if (
        recoveryResult?.status ===
        "not_authenticated"
      ) {
        setRecoveryRequired(false);

        setError(
          "Ta session a expiré. Reconnecte-toi avant de récupérer ton compte."
        );

        return;
      }

      // ========================================
      // AUTRE ERREUR
      // ========================================

      if (
        !recoveryResult?.success
      ) {
        console.error(
          "❌ [RECOVERY] Échec récupération =",
          recoveryResult
        );

        throw new Error(
          recoveryResult?.error?.message ||
          recoveryResult?.message ||
          `Impossible de récupérer cet appareil. Statut reçu : ${
            recoveryResult?.status || "inconnu"
          }`
        );
      }

      // ========================================
      // SUCCÈS
      // ========================================

      if (
        recoveryResult?.status ===
        "device_recovered"
      ) {
        console.log(
          "✅ [RECOVERY] Appareil récupéré avec succès"
        );

        setSuccess(
          "📱 Ton compte est maintenant associé à ce nouveau téléphone."
        );

        setRecoveryRequired(false);
        setRecoveryCode("");

        // ======================================
        // CONTINUER LA CONNEXION NORMALE
        // ======================================

        await continueAfterDeviceAuthorization();

        return;
      }

      throw new Error(
        "Réponse inattendue du serveur."
      );

    } catch (err) {
      console.error(
        "💥 [RECOVERY] Erreur récupération appareil =",
        err
      );

      setError(
        err?.message ||
        "Impossible de récupérer ton compte sur ce téléphone."
      );

    } finally {
      setLoading(false);

      console.log(
        "🏁 [RECOVERY] handleDeviceRecovery terminé"
      );
    }
  }

  // ==========================================
  // CONNEXION / INSCRIPTION
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ========================================
    // IGNORER LE SUBMIT ÉVENTUELLEMENT DÉCLENCHÉ
    // APRÈS "RETOUR À LA CONNEXION"
    // ========================================

    if (skipNextSubmitRef.current) {
      console.log(
        "🛑 [LOGIN PAGE] Submit ignoré après annulation récupération"
      );

      skipNextSubmitRef.current = false;

      return;
    }

    console.log(
      "🔐 [LOGIN PAGE] Soumission du formulaire"
    );

    console.log(
      "📧 [LOGIN PAGE] email =",
      email.trim()
    );

    console.log(
      "🎯 [LOGIN PAGE] mode =",
      isSignUp
        ? "INSCRIPTION"
        : "CONNEXION"
    );

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // ========================================
      // INSCRIPTION
      // ========================================

      if (isSignUp) {
        console.log(
          "📝 [LOGIN PAGE] Début inscription"
        );

        const {
          data,
          error: signUpError
        } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name:
                fullName.trim()
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
      // 👑 VÉRIFICATION ADMIN IMMÉDIATE
      // ========================================
      //
      // IMPORTANT :
      //
      // Les comptes admin et super_admin ne
      // doivent pas être bloqués par la protection
      // d'appareil des élèves.
      //
      // On vérifie donc le rôle immédiatement
      // après la connexion Supabase.
      //
      // Si l'utilisateur est admin ou super_admin,
      // il est envoyé directement vers /admin.
      //
      // ========================================

      console.log(
        "👑 [LOGIN PAGE] Vérification du rôle administrateur..."
      );

      const admin =
        await getCurrentAdmin();

      console.log(
        "👑 [LOGIN PAGE] Résultat getCurrentAdmin =",
        admin
      );

      if (admin) {
        console.log(
          "✅ [LOGIN PAGE] Administrateur autorisé"
        );

        console.log(
          "🎭 [LOGIN PAGE] role =",
          admin.profile?.role
        );

        console.log(
          "➡️ [LOGIN PAGE] Redirection directe vers /admin"
        );

        navigate("/admin", {
          replace: true
        });

        return;
      }

      console.log(
        "👨‍🎓 [LOGIN PAGE] Aucun rôle administrateur détecté"
      );

      // ========================================
      // 🔐 PROTECTION APPAREIL — ÉLÈVES
      // ========================================

      console.log(
        "📱 [LOGIN PAGE] Vérification de l'appareil..."
      );

      const deviceResult =
        await registerUserDevice();

      console.log(
        "📱 [LOGIN PAGE] Résultat appareil =",
        deviceResult
      );

      // ========================================
      // APPAREIL NON AUTORISÉ
      // ========================================

      if (
        deviceResult?.status ===
          "different_device" ||
        deviceResult?.status ===
          "device_already_used"
      ) {

        console.warn(
          "🚫 [LOGIN PAGE] Autre appareil détecté"
        );

        /*
          IMPORTANT :

          NE PAS faire signOut ici.

          recover_user_device() utilise
          auth.uid() pour retrouver le
          compte actuellement connecté.

          On garde donc temporairement
          la session active pendant que
          l'utilisateur saisit son code.
        */

        setRecoveryRequired(true);

        setError("");

        setSuccess(
          "Ton compte est déjà associé à un autre téléphone."
        );

        return;
      }

      // ========================================
      // APPAREIL ENREGISTRÉ / AUTORISÉ
      // ========================================

      if (
        deviceResult?.success === true &&
        (
          deviceResult?.status ===
            "registered" ||
          deviceResult?.status ===
            "authorized"
        )
      ) {

        console.log(
          "✅ [LOGIN PAGE] Appareil autorisé"
        );

        await continueAfterDeviceAuthorization();

        return;
      }

      // ========================================
      // ERREUR APPAREIL
      // ========================================

      console.error(
        "❌ [LOGIN PAGE] Réponse appareil inattendue =",
        deviceResult
      );

      throw new Error(
        deviceResult?.error?.message ||
        deviceResult?.message ||
        `Impossible de vérifier cet appareil. Statut reçu : ${
          deviceResult?.status || "inconnu"
        }`
      );

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
  // ANNULER RÉCUPÉRATION
  // ==========================================

  async function cancelRecovery(e) {
    // ========================================
    // EMPÊCHER TOUT COMPORTEMENT DU BOUTON
    // ========================================

    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    console.log(
      "🚪 [RECOVERY] Retour à la connexion demandé"
    );

    // ========================================
    // BLOQUER UN ÉVENTUEL SUBMIT PARASITE
    // ========================================

    skipNextSubmitRef.current = true;

    // ========================================
    // SORTIR IMMÉDIATEMENT DU MODE RÉCUPÉRATION
    // ========================================

    setRecoveryRequired(false);
    setRecoveryCode("");
    setError("");
    setSuccess("");
    setLoading(false);

    console.log(
      "🔐 [RECOVERY] Préparation de la déconnexion..."
    );

    try {
      // ========================================
      // SIGN OUT
      // ========================================

      const {
        error: signOutError
      } = await supabase.auth.signOut();

      if (signOutError) {
        console.error(
          "❌ [RECOVERY] Erreur signOut =",
          signOutError
        );
      } else {
        console.log(
          "✅ [RECOVERY] Déconnexion réussie"
        );
      }

      // ========================================
      // VÉRIFICATION
      // ========================================

      const {
        data,
        error: sessionError
      } = await supabase.auth.getSession();

      console.log(
        "🔐 [RECOVERY] Session après annulation =",
        data?.session?.user?.id || null
      );

      if (sessionError) {
        console.error(
          "❌ [RECOVERY] Erreur vérification session =",
          sessionError
        );
      }

    } catch (error) {
      console.error(
        "💥 [RECOVERY] Exception déconnexion =",
        error
      );

    } finally {
      console.log(
        "🏁 [RECOVERY] Retour à l'écran de connexion terminé"
      );
    }
  }

  // ==========================================
  // TEST — GÉNÉRER CODE DE RÉCUPÉRATION
  // ==========================================

  async function handleGenerateRecoveryCodeTest() {
    console.log(
      "🔐 [TEST RECOVERY] Demande de génération du code..."
    );

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const {
        data: sessionData,
        error: sessionError
      } = await supabase.auth.getSession();

      console.log(
        "🔐 [TEST RECOVERY] Session =",
        sessionData?.session
      );

      if (sessionError) {
        throw sessionError;
      }

      if (!sessionData?.session?.user) {
        setError(
          "Aucun utilisateur connecté. Connecte-toi d'abord."
        );

        return;
      }

      console.log(
        "👤 [TEST RECOVERY] User ID =",
        sessionData.session.user.id
      );

      const result =
        await generateDeviceRecoveryCode();

      console.log(
        "📱 [TEST RECOVERY] Résultat =",
        result
      );

      if (!result?.success) {
        setError(
          result?.message ||
          `Impossible de générer le code. Statut : ${
            result?.status || "inconnu"
          }`
        );

        return;
      }

      if (
        result?.status ===
        "code_generated"
      ) {
        console.log(
          "✅ [TEST RECOVERY] CODE GÉNÉRÉ =",
          result.code
        );

        setSuccess(
          `🔐 Code de récupération : ${result.code}`
        );

        return;
      }

      setError(
        "Réponse inattendue du serveur."
      );

    } catch (error) {
      console.error(
        "💥 [TEST RECOVERY] Exception =",
        error
      );

      setError(
        error?.message ||
        "Impossible de générer le code de récupération."
      );

    } finally {
      setLoading(false);

      console.log(
        "🏁 [TEST RECOVERY] Génération terminée"
      );
    }
  }

  // ==========================================
  // CHANGER MODE
  // ==========================================

  function toggleMode() {
    setIsSignUp(
      (previous) => !previous
    );

    setError("");
    setSuccess("");
    setRecoveryRequired(false);
    setRecoveryCode("");
  }

  // ==========================================
  // INTERFACE
  // ==========================================

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* ======================================
          HEADER
      ====================================== */}

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


      {/* ======================================
          CONTENU
      ====================================== */}

      <main className="flex-1 flex items-center justify-center px-5 py-10">

        <div className="w-full max-w-md">

          {/* ==================================
              INTRODUCTION
          ================================== */}

          <div className="text-center mb-7">

            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">

              {recoveryRequired ? (
                <Smartphone size={28} />
              ) : (
                <BookOpen size={28} />
              )}

            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">

              {recoveryRequired
                ? "Nouveau téléphone"
                : isSignUp
                  ? "Créer ton compte"
                  : "Bienvenue sur Kalan Academy"}

            </h1>

            <p className="text-gray-500 mt-2 text-sm leading-relaxed">

              {recoveryRequired
                ? "Récupère ton compte avec ton code de récupération."
                : isSignUp
                  ? "Crée ton compte et commence ton apprentissage."
                  : "Connecte-toi pour continuer ton apprentissage."}

            </p>

          </div>


          {/* ==================================
              CARTE
          ================================== */}

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">

            {/* =================================
                MODE CONNEXION / INSCRIPTION
            ================================= */}

            {!recoveryRequired && (

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

            )}

            {/* =================================
                ERREUR
            ================================= */}

            {error && (

              <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>

            )}

            {/* =================================
                SUCCÈS
            ================================= */}

            {success && (

              <div className="mb-5 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">
                {success}
              </div>

            )}

            {/* =================================
                RÉCUPÉRATION APPAREIL
            ================================= */}

            {recoveryRequired ? (

              <form
                onSubmit={handleDeviceRecovery}
                className="space-y-5"
              >

                <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4">

                  <div className="flex items-start gap-3">

                    <div className="w-10 h-10 shrink-0 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">

                      <Smartphone size={20} />

                    </div>

                    <div>

                      <p className="font-bold text-blue-900">
                        Ton ancien téléphone est encore associé
                      </p>

                      <p className="text-sm text-blue-700 mt-1 leading-relaxed">
                        Si tu as perdu ton ancien téléphone,
                        tu peux transférer ton compte sur ce
                        nouveau téléphone avec ton code de
                        récupération.
                      </p>

                    </div>

                  </div>

                </div>

                {/* CODE */}

                <div>

                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Code de récupération
                  </label>

                  <div className="relative">

                    <KeyRound
                      size={19}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      type="text"
                      placeholder="Exemple : A7F2-91BC-4D8E"
                      value={recoveryCode}
                      onChange={(e) =>
                        setRecoveryCode(
                          e.target.value.toUpperCase()
                        )
                      }
                      disabled={loading}
                      required
                      autoComplete="off"
                      autoFocus
                      maxLength={14}
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 tracking-widest font-semibold uppercase outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:bg-gray-50"
                    />

                  </div>

                  <p className="text-xs text-gray-400 mt-2">
                    Entre le code que tu avais enregistré
                    avant de perdre ton ancien téléphone.
                  </p>

                </div>

                {/* BOUTON RÉCUPÉRATION */}

                <button
                  type="submit"
                  disabled={
                    loading ||
                    !recoveryCode.trim()
                  }
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-3.5 px-5 rounded-xl shadow-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
                >

                  {loading ? (

                    <>
                      <Loader2
                        size={19}
                        className="animate-spin"
                      />

                      Récupération...
                    </>

                  ) : (

                    <>
                      <Smartphone size={19} />

                      Récupérer mon compte
                    </>

                  )}

                </button>

                {/* ANNULER */}

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    cancelRecovery(e);
                  }}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-gray-700 py-2.5 rounded-xl font-semibold transition disabled:opacity-50"
                >

                  <ArrowLeft size={17} />

                  Retour à la connexion

                </button>

              </form>

            ) : (

              /* =================================
                 FORMULAIRE CONNEXION / INSCRIPTION
              ================================= */

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
                      onChange={(e) =>
                        setFullName(
                          e.target.value
                        )
                      }
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
                      onChange={(e) =>
                        setEmail(
                          e.target.value
                        )
                      }
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
                      onChange={(e) =>
                        setPassword(
                          e.target.value
                        )
                      }
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
                      Le mot de passe doit contenir
                      au moins 6 caractères.
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

            )}


            {/* =================================
                BAS DE CARTE
            ================================= */}

            {!recoveryRequired && (

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

            )}

          </div>

          {/* ==================================
              FOOTER
          ================================== */}

          <p className="text-center text-xs text-gray-400 mt-6">
            Apprends partout, même hors ligne
            avec Kalan Academy.
          </p>

        </div>

      </main>

    </div>
  );
}