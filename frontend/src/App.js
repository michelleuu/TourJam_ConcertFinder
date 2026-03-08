import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext"; // global state provider
import Dashboard from "./Dashboard";
import Login from "./Login";
import ProtectedRoute from "./ProtectedRoute"; // the "bounce" component
import Register from "./Register";
import ConcertDetails from "./ConcertDetails";

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
          <Route path="/" element={<Dashboard />}/>

          {/* protected routes */}
          <Route
            path="/concert/:id"
            element={
              <ProtectedRoute>
                <ConcertDetails />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
