import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Register.css";

const Register = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [genres, setGenres] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

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
    "Alertnative",
    "Classical",
  ];

  const handleGenreChange = (genre) => {
    if (genres.includes(genre)) {
      setGenres(genres.filter((g) => g !== genre));
    } else {
      setGenres([...genres, genre]);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("http://localhost:5001/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          preferredGenres: genres,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Registration successful! Please log in.");
        navigate("/login");
      } else {
        setError(data.message || data.error || "Registration failed");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred. Please try again.");
    }
  };

  return (
    <div className="register-bg">
      <div className="register-card">
        <form onSubmit={handleRegister} className="register-form">
        {/* LEFT SIDE */}
        <div className="register-card-left">
          <h2>Create an Account</h2>
          {error && <p>{error}</p>}

            <input
              placeholder="Choose a Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Choose a Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          
            <p className="login-text">
              Already have an account?{" "}
              <Link to="/login">
                Log in here
              </Link>
            </p>
        </div>

        {/* RIGHT SIDE */}
        <div className="register-card-right">
          {/* GENRE SELECTION */}
            <p>Select your favorite genres:</p>
            <div className="genre-list">
              {genreOptions.map((genre) => (
              <label key={genre}>
                <input
                  type="checkbox"
                  value={genre}
                  checked={genres.includes(genre)}
                  onChange={() => handleGenreChange(genre)}
                />
                {genre}
              </label>
            ))}
            </div>
            <button type="submit">Register</button>
          </div>
      </form>
      </div>
    </div>
  );
};

export default Register;
