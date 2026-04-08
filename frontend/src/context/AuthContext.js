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
  const [loading, setLoading] = useState(true);
  console.log("stored token:", token);
  console.log("token length:", token?.length);
  // useEffect runs whenever the token changes (login, logout, or initial load)
  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          // decode the JWT to get user details
          const decoded = jwtDecode(token);

          // check if the token is expired
          if (decoded.exp * 1000 < Date.now()) {
            console.log("Token expired → switching to visitor view");
            logout(); // logged out to visitor view
            return;
          } else {
            // first set user from token so app can render immediately
            setUser({
              id: decoded.id,
              username: decoded.username,
              role: decoded.role,
              profileImage: decoded.profileImage || "",
            });

            // then fetch the latest profile from backend
            const res = await fetch("http://localhost:5001/api/profile", {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            const data = await res.json();

            if (!res.ok) {
              throw new Error(data.message || "Failed to fetch profile");
            }

            // overwrite token data with the latest database values
            setUser({
              id: data.id || decoded.id,
              username: data.username || decoded.username,
              role: data.role || decoded.role,
              profileImage: data.profileImage || "",
              preferredGenres: data.preferredGenres || [],
              spotifyConnected: !!data.spotifyConnected,
            });
          }
        } catch (err) {
          console.error("Token is invalid or corrupted:", err);
          logout();
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    }

    loadUser();
  }, [token]);

  // function to handle login
  function login(newToken) {
    localStorage.setItem("token", newToken); // save to browser memory
    setToken(newToken); // update state to trigger re-renders
    setLoading(true);
  }

  // function to handle logout
  function logout() {
    localStorage.removeItem("token"); // remove from browser memory
    setToken(null); // reset state
    setUser(null);
    setLoading(false);
  }

  return (
    // we provide 'token' and 'user' (data)
    // and 'login' and 'logout' (functions) to the whole app
    <AuthContext.Provider
      value={{ token, user, setUser, login, logout, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
}
