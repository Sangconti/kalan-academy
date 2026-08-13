import { useEffect, useState } from "react";
import { getCurrentAdmin } from "../services/adminAuthService";

export default function useAdmin() {
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState(null);

  useEffect(() => {
    async function load() {

    console.log("👤 useAdmin — chargement");

      const data = await getCurrentAdmin();

     console.log("👤 useAdmin — résultat =", data);
      setAdmin(data);
      setLoading(false);
    }

    load();
  }, []);

  console.log("📊 [USE ADMIN] state =", {
      loading,
      admin,
      isAdmin: !!admin,
    });

  return {
    loading,
    admin,
    isAdmin: !!admin,
  };
}