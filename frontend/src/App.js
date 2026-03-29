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

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;