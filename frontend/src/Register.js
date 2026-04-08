import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Register.css";

import logotypePurple from "./assets/logotype-purple.svg";
import logoLined from "./assets/logo-transparent.svg";

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [genres, setGenres] = useState([]);
  //const [error, setError] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const navigate = useNavigate();

  //check errors state
  const [multipleErrors,setMultipleErrors]=useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  //email validate function
  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

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

  const handleGenreChange = (genre) => {
    if (genres.includes(genre)) {
      setGenres(genres.filter((g) => g !== genre));
    } else {
      setGenres([...genres, genre]);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    let newErrors = {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    };

    if (!username.trim()) {
      newErrors.username = "!! Enter Username";
    }

    if (!email.trim() || !validateEmail(email)) {
      newErrors.email = "!! Enter Valid Email Address";
    }

    if (!password) {
      newErrors.password = "!! Enter Password";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "!! Enter Password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "!! Password not Match";
    }

    setMultipleErrors(newErrors);

    if (Object.values(newErrors).some((multipleErrors) => multipleErrors !== "")) {
      return;
    }

    try {
      const res = await fetch("http://localhost:5001/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          email,
          password,
          preferredGenres: genres,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Registration successful!");
        navigate("/login");
      } else {
        const backendMessage =
          data.message || data.error || "";

        if (backendMessage.toLowerCase().includes("exists")) {
          setMultipleErrors((prev) => ({
            ...prev,
            username: "!! Username already exists",
          }));
        }
      }
    } catch (err) {
      console.multipleErrors(err);
    }
  };

  return (
    <div className="register-bg">

      {/* OUTSIDE HEADER */}
      <div className="register-header">
        <Link to="/">
            <img src={logoLined} alt="Logo" className="register-header-logo" />
        </Link>
        <h1>Create an Account</h1>
      </div>

      <div className="register-card">
        <form onSubmit={handleRegister} className="register-form">

          {/* LEFT SIDE */}
          <div className="register-card-left">

            <div className="register-left-grid">

              {/* INPUT COLUMN */}
              <div className="register-input-column">

                <div className="register-input-group">
                  <label>Username</label>
                  <input
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setMultipleErrors({ ...multipleErrors, username: "" });
                    }}
                  />
                  {multipleErrors.username && (
                    <span className="error-tooltip">{multipleErrors.username}</span>
                  )}
                </div>

                <div className="register-input-group">
                  <label>Email</label>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setMultipleErrors({ ...multipleErrors, email: "" });
                    }}
                  />
                  {multipleErrors.email && (
                    <span className="error-tooltip">{multipleErrors.email}</span>
                  )}
                </div>

                <div className="register-input-group">
                  <label>Password</label>
                  <input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setMultipleErrors({ ...multipleErrors, password: "" });
                    }}
                  />
                  {multipleErrors.password && (
                    <span className="error-tooltip">{multipleErrors.password}</span>
                  )}
                </div>

                <div className="register-input-group">
                  <label>Confirm Password</label>
                  <input
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setMultipleErrors({ ...multipleErrors, confirmPassword: "" });
                    }}
                  />
                  {multipleErrors.confirmPassword && (
                    <span className="error-tooltip">{multipleErrors.confirmPassword}</span>
                  )}
                </div>

              </div>

              {/* GENRE COLUMN */}
              <div className="register-genre-column">
                <p>Preferred Genres</p>

                <div className="genre-list">
                  {genreOptions.map((genre) => (
                    <label key={genre}>
                      <input
                        type="checkbox"
                        checked={genres.includes(genre)}
                        onChange={() => handleGenreChange(genre)}
                      />
                      {genre}
                    </label>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* RIGHT SIDE TICKET */}
          <div className="register-card-right">
            <div className="ticket-circle-bottom"></div>

            <div className="ticket-content">
              <Link to="/">
                <img
                  src={logotypePurple}
                  alt="TourJam"
                  className="ticket-logo"
                />
              </Link>

              <h3>{username || "Your Name"}</h3>
              <p>{email || "your@email.com"}</p>

              <h4>Favourite Genre</h4>

              <div className="ticket-genres">
                {genres.length > 0 ? (
                  genres.map((genre) => (
                    <span key={genre}>{genre}</span>
                  ))
                ) : (
                  <span>No genre selected</span>
                )}
              </div>

              <div className="register-bottom-row">
                <p className="register-login-link">
                  Already have an account? <Link to="/login">Log in here</Link>
                </p>

                <button type="submit">Register</button>
              </div>
            </div>

          </div>

        </form>
      </div>
    </div>
  );
};

export default Register;