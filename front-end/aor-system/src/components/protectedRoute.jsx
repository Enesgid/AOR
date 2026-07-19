import { Navigate } from "react-router-dom";
import {
  getCurrentToken,
  getCurrentUser,
} from "../utils/session";

const ProtectedRoute = ({
  children,
  allowedRoles,
}) => {
  const token = getCurrentToken();
  const user = getCurrentUser();

  // Not logged in
  if (!token || !user) {
    return <Navigate to="/" replace />;
  }

  // Wrong role
  if (
    allowedRoles &&
    !allowedRoles.includes(user.role)
  ) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;