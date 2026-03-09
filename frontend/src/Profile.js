//Profile page: Members Only, if visitors try to reach this page, it directs to the sign-in page.
import { useContext, useEffect, useState } from "react";
import "./App.css";
import { AuthContext } from "./context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import logo from "./assets/logo.svg";

function Profile() {
  const { token, user, logout } = useContext(AuthContext);
  const [genres, setGenres] = useState([]);
  const navigate = useNavigate();

  const handleGenreChange = (genre) => {
    if (genres.includes(genre)) {
      setGenres(genres.filter((g) => g !== genre));
    } else {
      setGenres([...genres, genre]);
    }
  };

  //fetch preferred genres
  useEffect(() => {
    if (!token) return;

    async function fetchGenres() {
      try {
        const res = await fetch("http://localhost:5001/api/genres", {
          headers: {
            Authorization: token,
          },
        });

        const data = await res.json();
        setGenres(data.preferredGenres || []);
        console.log(data.preferredGenres);
      } catch (err) {
        console.error("Failed to fetch genres:", err);
      }
    }

    fetchGenres();
  }, [token]);

  const updateGenres = async () => {
    try {
      const res = await fetch("http://localhost:5001/api/genres", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({
          preferredGenres: genres,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Genres Update successful!");
      } else {
        alert(data.message || "Failed to update Genres");
      }
    } catch (err) {
      console.error(err);
    }
  };

  //options of genres
  const genreOptions = [
    "Rock",
    "Pop",
    "R&B",
    "Hip Hop/Rap",
    "Jazz",
    "Dance/Electronic",
    "Country",
    "Folk",
    "Metal",
    "Alternative",
    "Classical",
  ];

  return (
    <div>
      <header className="main-header">
        <nav className="nav-bar">
          {/* Logo as a clickable link to dashboard */}
          <div className="main-nav">
            <img
              src={logo}
              alt="TourJam logo"
              className="logo"
              onClick={() => navigate("/")}
              style={{ cursor: "pointer" }}
            />
            <button onClick={() => navigate("/profile")} className="nav-button">
              My Profile
            </button>
          </div>

          <div className="nav-links">
            {token ? (
              <button onClick={logout} className="nav-button">
                Logout
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate("/login")}
                  className="nav-button"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate("/register")}
                  className="nav-signup-button"
                >
                  Sign up
                </button>
              </>
            )}
          </div>
        </nav>
      </header>

      <div className="page-container">
        <div>
          <h1>My Profile</h1>
          <h2>Username: {user?.username}</h2>
        </div>

        <div>
          <h2>Edit Preferred Genres</h2>
          {genreOptions.map((genre) => (
            <label key={genre} style={{ display: "block" }}>
              <input
                type="checkbox"
                value={genre}
                checked={genres.includes(genre)}
                onChange={() => handleGenreChange(genre)}
              />
              {genre}
            </label>
          ))}
          <button onClick={updateGenres}>Save Preferences</button>
        </div>

        <div>
          <button onClick={logout}>Logout</button>
          <button onClick={() => navigate("/")}>Back to Dashboard</button>
        </div>
      </div>
    </div>
  );
}

export default Profile;
