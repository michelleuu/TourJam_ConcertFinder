import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const Register = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [genres, setGenres] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const genreOptions = [
    "Rock",
    "Pop",
    "Hip Hop",
    "Jazz",
    "Electronic",
    "Country",
    "Indie",
    "Metal",
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
    <div
      style={{
        padding: "50px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <h2 style={{ color: "#1b5e20", marginBottom: "20px" }}>
        Create an Account
      </h2>

      {error && <p style={{ color: "#c62828", fontWeight: "bold" }}>{error}</p>}

      <form
        onSubmit={handleRegister}
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          maxWidth: "320px",
          gap: "15px",
        }}
      >
        <input
          placeholder="Choose a Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{
            padding: "12px",
            fontSize: "1.1rem",
            borderRadius: "4px",
            border: "1px solid #ccc",
          }}
          required
        />

        <input
          type="password"
          placeholder="Choose a Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            padding: "12px",
            fontSize: "1.1rem",
            borderRadius: "4px",
            border: "1px solid #ccc",
          }}
          required
        />

        {/* GENRE SELECTION */}
        <div>
          <p style={{ fontWeight: "bold" }}>Select your favorite genres:</p>

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
        </div>

        <button
          type="submit"
          style={{
            padding: "12px",
            fontSize: "1.1rem",
            backgroundColor: "#2e7d32",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Register
        </button>
      </form>

      <p style={{ marginTop: "20px" }}>
        Already have an account?{" "}
        <Link to="/login" style={{ color: "#2e7d32", fontWeight: "bold" }}>
          Log in here
        </Link>
      </p>
    </div>
  );
};

export default Register;
