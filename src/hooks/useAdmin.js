import { useEffect, useState } from "react";
import { getCurrentAdmin } from "../services/adminAuthService";

export default function useAdmin() {
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState(null);

  useEffect(() => {
    async function load() {
      const data = await getCurrentAdmin();
      setAdmin(data);
      setLoading(false);
    }

    load();
  }, []);

  return {
    loading,
    admin,
    isAdmin: !!admin,
  };
}