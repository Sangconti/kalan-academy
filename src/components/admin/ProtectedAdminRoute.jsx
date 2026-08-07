import { Navigate } from "react-router-dom";
import useAdmin from "../../hooks/useAdmin";

export default function ProtectedAdminRoute({ children }) {
  const { loading, isAdmin } = useAdmin();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Chargement...
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}