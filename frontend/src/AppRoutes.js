import { Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "./context/AuthContext";

import Dashboard from "./Dashboard";
import Login from "./Login";
import Register from "./Register";
import Profile from "./Profile";
import Browse from "./Browse";
import ConcertDetails from "./ConcertDetails";
import Reviews from "./Reviews";
import WriteReview from "./WriteReview";
import Callback from "./Callback";
import ProtectedRoute from "./ProtectedRoute";
import AdminDashboard from "./AdminDashboard";

function AppRoutes() {
  const { user } = useContext(AuthContext);

  return (
    <Routes>
      {/* public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<Dashboard />} />
      <Route path="/browse" element={<Browse />} />
      <Route path="/concerts/:id" element={<ConcertDetails />} />

      {/* protected routes */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      {/* ✅ ADMIN ROUTE */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            {user?.role === "admin" ? <AdminDashboard /> : <Navigate to="/" />}
          </ProtectedRoute>
        }
      />

      <Route path="/Callback" element={<Callback />} />
      <Route path="/reviews/:concertId" element={<Reviews />} />

      <Route
        path="/write-review/:concertId"
        element={
          <ProtectedRoute>
            <WriteReview />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default AppRoutes;
