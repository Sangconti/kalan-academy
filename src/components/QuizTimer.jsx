import {
  useEffect,
  useRef,
  useState
} from "react";

import {
  Timer
} from "lucide-react";


export default function QuizTimer({
  duration = 60,
  onTimeUp
}) {

  const [timeLeft, setTimeLeft] =
    useState(duration);

  const timeUpCalled =
    useRef(false);


  // =====================================================
  // INITIALISATION
  // =====================================================

  useEffect(() => {

    setTimeLeft(duration);

    timeUpCalled.current = false;

  }, [duration]);


  // =====================================================
  // COMPTE À REBOURS
  // =====================================================

  useEffect(() => {

    if (timeLeft <= 0) {

      if (
        !timeUpCalled.current
      ) {

        timeUpCalled.current = true;

        if (onTimeUp) {

          onTimeUp();

        }

      }

      return;

    }


    const timer =
      setInterval(() => {

        setTimeLeft(
          previous =>
            Math.max(
              previous - 1,
              0
            )
        );

      }, 1000);


    return () => {

      clearInterval(timer);

    };

  }, [
    timeLeft,
    onTimeUp
  ]);


  // =====================================================
  // FORMATAGE
  // =====================================================

  const minutes =
    Math.floor(
      timeLeft / 60
    );


  const seconds =
    String(
      timeLeft % 60
    ).padStart(2, "0");


  // =====================================================
  // COULEUR
  // =====================================================

  const percent =
    duration > 0
      ? (timeLeft / duration) * 100
      : 0;


  let colorClass =
    "text-green-600 dark:text-green-400";


  if (percent <= 50) {

    colorClass =
      "text-yellow-600 dark:text-yellow-400";

  }


  if (percent <= 25) {

    colorClass =
      "text-red-600 dark:text-red-400";

  }


  // =====================================================
  // AFFICHAGE
  // =====================================================

  return (

    <div
      className={`
        flex
        items-center
        gap-2
        font-mono
        font-bold
        ${colorClass}
      `}
      aria-label="Temps restant"
    >

      <Timer size={18} />

      <span>
        {minutes}:{seconds}
      </span>

    </div>

  );

}