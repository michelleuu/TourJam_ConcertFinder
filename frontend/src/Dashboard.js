import { useContext, useEffect, useState } from "react";
import "./App.css";
import { AuthContext } from "./context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import logo from "./assets/logo.svg";

function Dashboard() {
  // Destructure and retreive the token that was stored in the AuthContext
  const { token, user, logout } = useContext(AuthContext);

  const navigate = useNavigate();

  // State to hold fetched concerts from ticketmaster api
  const [concerts, setConcerts] = useState([]);
  const [recommendedConcerts, setRecommendedConcerts] = useState([]);

  // States to hold user data from database
  /* Todo: get request and get user's location to set the default city */
  const [city, setCity] = useState("Vancouver"); // Default city is vancouver
  const [genres, setGenres] = useState([]); // State to hold the selected genres from User database

  function formatConcertDate(dateStr, timeStr) {
    if (!dateStr) return "";

    // Combine date and time
    const dateTime = timeStr ? `${dateStr}T${timeStr}` : dateStr;

    const date = new Date(dateTime);

    // Format date
    const options = {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    };

    return date.toLocaleString("en-US", options); // e.g., Fri, Feb 5, 2027, 9:00 PM
  }

  // Ticketmaster api - Fetch concerts by selected city
  useEffect(() => {
    async function fetchConcerts() {
      try {
        const response = await fetch(
          `http://localhost:5001/api/concerts?city=${city}`,
        );

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();
        setConcerts(data);
      } catch (err) {
        console.error("Failed to fetch concerts:", err.message);
      }
    }

    fetchConcerts();
  }, [city]); // Fetch again if user changes the city

  // Ticketmaster api - Fetch concerts by the genre to get recomended concerts
  useEffect(() => {
    if (!token) return;

    async function fetchRecommended() {
      try {
        const res = await fetch(
          "http://localhost:5001/api/concerts/recommended",
          {
            headers: {
              Authorization: token,
            },
          },
        );

        const data = await res.json();
        setRecommendedConcerts(data);
      } catch (err) {
        console.error("Failed to fetch recommendations", err);
      }
    }

    fetchRecommended();
  }, [token]);

  /* 
  Fetch genres from data base and store it into the genre state to display so it 
  can be used to display which genres the user saved.
  I.e. Your Preferred Genres: Rock, Hip Hop. Since you love Rock, Hip Hop.
  */
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

  return (
    <div>
      <header className="main-header">
        <nav className="nav-bar">
          {/* Logo as a clickable link to dashboard */}
          <img
            src={logo}
            alt="TourJam logo"
            className="logo"
            onClick={() => navigate("/dashboard")}
            style={{ cursor: "pointer" }}
          />

          <div className="nav-links">
            {token ? (
              <button onClick={logout} className="nav-button">
                Logout
              </button>
            ) : (
              <>
                <button onClick={() => navigate("/profile")}>My Profile</button>
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

        <div className="header-context">
          {user && <h1>Welcome back, {user.username}!</h1>}
          {user && genres.length > 0 && (
            <p>Your Preferred Genres: {genres.join(", ")}</p>
          )}
        </div>
      </header>

      <div className="page-container">
        <section id="upcoming-concerts">
          <div>
            <h2>Upcoming Concerts in {city}</h2>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              style={{ padding: ".25rem" }}
            >
              <option value="Vancouver">Vancouver</option>
              <option value="Toronto">Toronto</option>
              <option value="Montreal">Montreal</option>
              <option value="Calgary">Calgary</option>
              <option value="Edmonton">Edmonton</option>
              <option value="Ottawa">Ottawa</option>
            </select>
          </div>
          <div className="concerts-grid">
            {concerts.length > 0 ? (
              concerts.map((concert) => (
                <Link
                  key={concert.id}
                  to={`/concert/${concert.id}`}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div className="concert-card">
                    {concert.images && concert.images[0] && (
                      <img
                        src={concert.images[0].url}
                        alt={concert.name}
                        style={{ maxWidth: "100%", height: "auto" }}
                      />
                    )}
                    <h3>{concert.name}</h3>
                    <p>
                      <strong>Date:</strong>{" "}
                      {formatConcertDate(
                        concert.dates.start.localDate,
                        concert.dates.start.localTime,
                      )}
                    </p>
                    <p>
                      <strong>Venue:</strong> {concert._embedded.venues[0].name}
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              <p>No concerts found.</p>
            )}
          </div>
        </section>

        {token && (
          <>
            <h2>Since you love {genres.join(", ")}</h2>
            <div className="concerts-grid">
              {recommendedConcerts.length > 0 ? (
                recommendedConcerts.map((concert) => (
                  <Link
                    key={concert.id}
                    to={`/concert/${concert.id}`}
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <div className="concert-card">
                      {concert.images && concert.images[0] && (
                        <img
                          src={concert.images[0].url}
                          alt={concert.name}
                          style={{ maxWidth: "100%", height: "auto" }}
                        />
                      )}
                      <h3>{concert.name}</h3>
                      <p>
                        <strong>Date:</strong>{" "}
                        {formatConcertDate(
                          concert.dates.start.localDate,
                          concert.dates.start.localTime,
                        )}
                      </p>
                      <p>
                        <strong>Venue:</strong>{" "}
                        {concert._embedded.venues[0].name}
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <p>No recommendations yet.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
