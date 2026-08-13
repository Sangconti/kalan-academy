import { useContext } from "react";

import ThemeContext from "../context/ThemeContext";


// =====================================================
// HOOK useTheme
// =====================================================

export function useTheme() {

  const context = useContext(
    ThemeContext
  );


  if (!context) {

    throw new Error(
      "useTheme doit être utilisé à l'intérieur de ThemeProvider."
    );

  }


  return context;

}


export default useTheme;