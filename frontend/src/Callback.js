import { useContext, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "./context/AuthContext";

function Callback() {
  const navigate = useNavigate();
  const hasRun = useRef (false);
  const {login} = useContext(AuthContext);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const stateToken = params.get("state");

    if (code) {
      const token = stateToken || localStorage.getItem("token");
      if (stateToken) {
        login(stateToken);
      }   
      fetch("http://localhost:5001/api/spotify/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code }),
      })
        .then((res) => res.json())
        .then(() => {
          alert("Spotify connected successfully!");

          const redirectPath =localStorage.getItem("redirectAfterSpotify") || "/profile";
          localStorage.removeItem("redirectAfterSpotify");

          setTimeout(() => {
            navigate(redirectPath);
          }, 300);
        })
        .catch((err) => {
          console.error(err);
        });
    }
  }, [navigate, login]);

  return <div>Connecting Spotify account...</div>;
}

export default Callback;