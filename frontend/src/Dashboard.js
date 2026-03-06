import { useContext, useEffect, useState } from "react";
import "./App.css";
import { AuthContext } from "./context/AuthContext";

function Dashboard() {
  const [concerts, setConcerts] = useState([]);
  const { token, user, logout } = useContext(AuthContext);

  useEffect(() => {
    async function fetchConcerts() {
      try {
        const response = await fetch("http://localhost:5001/api/concerts"); // make sure this matches your Express route
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
        </div>
        <button onClick={logout}>Logout</button>
      </header>

      <h2>Concerts in Vancouver</h2>
      <div className="concerts-grid">
        {concerts.length > 0 ? (
          concerts.map((concert) => (
            <div key={concert.id} className="concert-card">
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
              <a href={concert.url} target="_blank" rel="noopener noreferrer">
                Buy Tickets
              </a>
            </div>
          ))
        ) : (
          <p>No concerts found.</p>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
