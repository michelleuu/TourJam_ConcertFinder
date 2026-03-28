import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Callback() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    console.log("Spotify code:", code);

    if (code) {
      fetch("http://localhost:5001/api/spotify/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      })
        .then((res) => res.json())
        .then((data) => {
          console.log("Spotify token:", data);

          alert("Spotify connected successfully!");

          navigate("/profile");
        })
        .catch((err) => {
          console.error(err);
        });
    }
  }, [navigate]);

  return <div>Connecting Spotify account...</div>;
}

export default Callback;