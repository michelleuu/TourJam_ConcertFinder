import { Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "./context/AuthContext";

import Dashboard from "./Dashboard";
import Login from "./Login";
import Register from "./Register";
import Profile from "./Profile";
import Browse from "./Browse";
import ConcertDetails from "./ConcertDetails";
import Callback from "./Callback";
import ProtectedRoute from "./ProtectedRoute";
import AdminDashboard from "./AdminDashboard";

function AppRoutes() {
  const { user } = useContext(AuthContext);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<Dashboard />} />
      <Route path="/browse" element={<Browse />} />
      <Route path="/concerts/:id" element={<ConcertDetails />} />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            {user?.role === "admin" ? <AdminDashboard /> : <Navigate to="/" />}
          </ProtectedRoute>
        }
      />

      <Route path="/callback" element={<Callback />} />
    </Routes>
  );
}

export default AppRoutes;
