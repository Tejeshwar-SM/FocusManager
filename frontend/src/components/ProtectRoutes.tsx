import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface ProtectedRoutesProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRoutesProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <p>Loading...</p>;
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  //if authenticated, render children
  return <>{children}</>;
};
export default ProtectedRoute;
