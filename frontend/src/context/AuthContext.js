import { jwtDecode } from "jwt-decode";
import { createContext, useEffect, useState } from "react";

// create the Context object to be consumed by other components
export const AuthContext = createContext();

export function AuthProvider({ children }) {
  // initialize state directly from localStorage
  // this ensures that on page refresh, the 'token' is NOT null
  // prevents the ProtectedRoute from redirecting to Login
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [user, setUser] = useState(null);
  const [loading,setLoading] = useState(true);

  // useEffect runs whenever the token changes (login, logout, or initial load)
  useEffect(() => {
    if (token) {
      try {
        // decode the JWT to get user details
        const decoded = jwtDecode(token);

        // check if the token is expired
        if (decoded.exp * 1000 < Date.now()) {
          console.log("Token expired → switching to visitor view");
          logout(); // logged out to visitor view
        } else {
          setUser(decoded); // if token is valid, keep user logged in
        }
      } catch (err) {
        console.error("Token is invalid or corrupted:", err);
        logout();
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  }, [token]);

  // function to handle login
  function login(newToken) {
    localStorage.setItem("token", newToken); // save to browser memory
    setToken(newToken); // update state to trigger re-renders
  }

  // function to handle logout
  function logout() {
    localStorage.removeItem("token"); // remove from browser memory
    setToken(null); // reset state
    setUser(null);
  }

  return (
    // we provide 'token' and 'user' (data)
    // and 'login' and 'logout' (functions) to the whole app
    <AuthContext.Provider value={{ token, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
