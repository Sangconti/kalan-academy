import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";


// =====================================================
// CONTEXTE
// =====================================================

const ThemeContext = createContext(null);


// =====================================================
// VALEURS PAR DÉFAUT
// =====================================================

const DEFAULT_THEME = "light";
const DEFAULT_ACCENT = "blue";

const VALID_THEMES = [
  "light",
  "dark",
  "system",
];

const VALID_ACCENTS = [
  "blue",
  "green",
  "purple",
  "orange",
  "pink",
];


// =====================================================
// UTILITAIRES
// =====================================================

function getStoredValue(key, allowedValues, fallback) {
  try {
    const value = localStorage.getItem(key);

    if (allowedValues.includes(value)) {
      return value;
    }
  } catch (error) {
    console.warn(
      "⚠️ Impossible de lire le thème local :",
      error
    );
  }

  return fallback;
}


// =====================================================
// PROVIDER
// =====================================================

export function ThemeProvider({ children }) {

  const [theme, setThemeState] = useState(() =>
    getStoredValue(
      "kalan-theme",
      VALID_THEMES,
      DEFAULT_THEME
    )
  );

  const [accentColor, setAccentColorState] = useState(() =>
    getStoredValue(
      "kalan-accent-color",
      VALID_ACCENTS,
      DEFAULT_ACCENT
    )
  );


  // ===================================================
  // APPLIQUER LE THÈME
  // ===================================================

  useEffect(() => {

    const root = document.documentElement;

    const mediaQuery = window.matchMedia(
      "(prefers-color-scheme: dark)"
    );


    function applyTheme() {

      const systemIsDark = mediaQuery.matches;

      const shouldUseDark =
        theme === "dark" ||
        (
          theme === "system" &&
          systemIsDark
        );


      // -------------------------------------------------
      // NETTOYAGE
      // -------------------------------------------------

      root.classList.remove(
        "dark",
        "system-theme"
      );


      root.classList.remove(
        "theme-blue",
        "theme-green",
        "theme-purple",
        "theme-orange",
        "theme-pink"
      );


      // -------------------------------------------------
      // MODE
      // -------------------------------------------------

      if (theme === "system") {
        root.classList.add("system-theme");
      }


      if (shouldUseDark) {
        root.classList.add("dark");
      }


      // -------------------------------------------------
      // COULEUR
      // -------------------------------------------------

      root.classList.add(
        `theme-${accentColor}`
      );

    }


    applyTheme();


    // ---------------------------------------------------
    // ÉCOUTER LE THÈME WINDOWS / SYSTÈME
    // ---------------------------------------------------

    function handleSystemThemeChange() {

      if (theme === "system") {
        applyTheme();
      }

    }


    mediaQuery.addEventListener(
      "change",
      handleSystemThemeChange
    );


    return () => {

      mediaQuery.removeEventListener(
        "change",
        handleSystemThemeChange
      );

    };

  }, [
    theme,
    accentColor,
  ]);


  // ===================================================
  // CHANGER LE THÈME
  // ===================================================

  function setTheme(value) {

    if (!VALID_THEMES.includes(value)) {
      console.warn(
        `⚠️ Thème invalide : ${value}`
      );

      return;
    }


    setThemeState(value);


    try {

      localStorage.setItem(
        "kalan-theme",
        value
      );

    } catch (error) {

      console.warn(
        "⚠️ Impossible de sauvegarder le thème :",
        error
      );

    }

  }


  // ===================================================
  // CHANGER LA COULEUR
  // ===================================================

  function setAccentColor(value) {

    if (!VALID_ACCENTS.includes(value)) {
      console.warn(
        `⚠️ Couleur invalide : ${value}`
      );

      return;
    }


    setAccentColorState(value);


    try {

      localStorage.setItem(
        "kalan-accent-color",
        value
      );

    } catch (error) {

      console.warn(
        "⚠️ Impossible de sauvegarder la couleur :",
        error
      );

    }

  }


  // ===================================================
  // VALEUR DU CONTEXTE
  // ===================================================

  const value = useMemo(
    () => ({
      theme,
      setTheme,

      accentColor,
      setAccentColor,

      availableThemes: VALID_THEMES,
      availableAccentColors: VALID_ACCENTS,
    }),
    [
      theme,
      accentColor,
    ]
  );


  // ===================================================
  // RENDER
  // ===================================================

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );

}


// =====================================================
// EXPORT CONTEXTE
// =====================================================

export default ThemeContext;