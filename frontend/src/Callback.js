import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

function Callback() {
  const navigate = useNavigate();
  const hasRun = useRef (false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (code) {
      fetch("http://localhost:5001/api/spotify/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: localStorage.getItem("token"),
        },
        body: JSON.stringify({ code }),
      })
        .then((res) => res.json())
        .then((data) => {
          alert("Spotify connected successfully!");

          navigate("/");
        })
        .catch((err) => {
          console.error(err);
        });
    }
  }, [navigate]);

  return <div>Connecting Spotify account...</div>;
}

export default Callback;