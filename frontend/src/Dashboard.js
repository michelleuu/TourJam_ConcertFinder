import { useContext, useEffect, useState } from "react";
import "./App.css";
import { AuthContext } from "./context/AuthContext";
import { Link, useNavigate } from "react-router-dom";

function Dashboard() {
  const [concerts, setConcerts] = useState([]);
  const { token, user, logout } = useContext(AuthContext);
  const [recommendedConcerts, setRecommendedConcerts] = useState([]);

  const [genres, setGenres] = useState([]);

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
      } catch (err) {
        console.error("Failed to fetch genres", err);
      }
    }

    fetchGenres();
  }, [token]);

  useEffect(() => {
    async function fetchConcerts() {
      try {
        const response = await fetch("http://localhost:5001/api/concerts");
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
  }, []);
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
  return (
    <div className="page-container">
      <header
        className="main-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1>Plant Collection Dashboard</h1>
          {user && <h3>Welcome back, {user.username}!</h3>}
          {genres.length > 0 && (
            <h3>Your Preferred Genres: {genres.join(", ")}</h3>
          )}
        </div>
        <button onClick={logout}>Logout</button>
      </header>

      <h2>Concerts in Vancouver</h2>
      <div className="concerts-grid">
        {concerts.length > 0 ? (
          concerts.map((concert) => (
            <Link
              key={concert.id}
              to={`/concert/${concert.id}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div className="concert-card">
                <h3>{concert.name}</h3>
                <p>
                  <strong>Date:</strong> {concert.dates.start.localDate}{" "}
                  {concert.dates.start.localTime || ""}
                </p>
                <p>
                  <strong>Venue:</strong> {concert._embedded.venues[0].name}
                </p>
                {concert.images && concert.images[0] && (
                  <img
                    src={concert.images[0].url}
                    alt={concert.name}
                    style={{ maxWidth: "100%", height: "auto" }}
                  />
                )}
                <p style={{ color: "blue", textDecoration: "underline" }}>
                  View Details
                </p>
              </div>
            </Link>
          ))
        ) : (
          <p>No concerts found.</p>
        )}
      </div>
      {user && (
        <>
          <h2>
            Recommended For You. Filtered by the genre you selected at login
          </h2>
          <div className="concerts-grid">
            {recommendedConcerts.length > 0 ? (
              recommendedConcerts.map((concert) => (
                <Link
                  key={concert.id}
                  to={`/concert/${concert.id}`}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div className="concert-card">
                    <h3>{concert.name}</h3>
                    <p>
                      <strong>Date:</strong> {concert.dates.start.localDate}{" "}
                      {concert.dates.start.localTime || ""}
                    </p>
                    <p>
                      <strong>Venue:</strong> {concert._embedded.venues[0].name}
                    </p>
                    {concert.images && concert.images[0] && (
                      <img
                        src={concert.images[0].url}
                        alt={concert.name}
                        style={{ maxWidth: "100%", height: "auto" }}
                      />
                    )}
                    <p style={{ color: "blue", textDecoration: "underline" }}>
                      View Details
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
  );
}

export default Dashboard;
