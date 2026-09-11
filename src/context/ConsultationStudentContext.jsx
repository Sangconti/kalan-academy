import { createContext, useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getAdminStudentView } from "../services/adminService";

const ConsultationStudentContext = createContext(null);

export function ConsultationStudentProvider({ children }) {
  const { studentId } = useParams();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadStudent() {
      if (!studentId) {
        if (mounted) {
          setStudent(null);
          setLoading(false);
          setError("Élève introuvable.");
        }
        return;
      }

      try {
        setLoading(true);
        setError("");

        const result = await getAdminStudentView(studentId);

        if (!mounted) {
          return;
        }

        if (!result) {
          setStudent(null);
          setError("Impossible de charger les informations de l'élève.");
          return;
        }

        setStudent(result);
      } catch (error) {
        console.error(
          "❌ [CONSULTATION] Erreur chargement élève :",
          error
        );

        if (mounted) {
          setStudent(null);
          setError(
            error?.message ||
              "Impossible de charger les informations de l'élève."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadStudent();

    return () => {
      mounted = false;
    };
  }, [studentId]);

  const profile = student?.profile || null;

  const value = {
    consultationMode: true,
    studentId,
    student,
    profile,
    studentName:
      profile?.full_name ||
      student?.full_name ||
      "Élève",
    loading,
    error
  };

  return (
    <ConsultationStudentContext.Provider value={value}>
      {children}
    </ConsultationStudentContext.Provider>
  );
}

export function useConsultationStudent() {
  const context = useContext(ConsultationStudentContext);

  if (!context) {
    throw new Error(
      "useConsultationStudent doit être utilisé à l'intérieur de ConsultationStudentProvider."
    );
  }

  return context;
}