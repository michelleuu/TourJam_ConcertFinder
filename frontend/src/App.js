import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext"; // global state provider
import Dashboard from "./Dashboard";
import Login from "./Login";
import ProtectedRoute from "./ProtectedRoute"; // the "bounce" component
import Register from "./Register";
import ConcertDetails from "./ConcertDetails";
import Reviews from "./Reviews"; //review routes
import WriteReview from "./WriteReview"; //review routes
import Profile from "./Profile";
import Browse from "./Browse";
import Callback from "./Callback";
import Artist from "./Artist";

function App() {
  return (
    //wrap the entire app in AuthProvider so every component
    // can access the user's login status and token.

    <AuthProvider>
      <Router>
        <Routes>
          {/* public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/*Dashboard is visible for everyone, but it differs its content depending on the user state (Visitor/Member) */}
          <Route path="/" element={<Dashboard />} />

          <Route path="/browse" element={<Browse />} />

          {/* Concert Detail is also visible for everyone, but it differs in its reviewss */}
          <Route path="/concert/:id" element={<ConcertDetails />} />

          {/* Artist Detail page available for everyone */}
          <Route path="/artist/:name" element={<Artist />} />

          {/* protected routes */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
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
      </Router>
    </AuthProvider>
  );
}

export default App;
