import { useParams } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "./context/AuthContext";
import logo from "./assets/logo.svg";
import "./concertDetails.css";

function ConcertDetails() {
  const { token, user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const { id } = useParams();
  const [concert, setConcert] = useState(null);

  useEffect(() => {
    async function fetchConcert() {
      const res = await fetch(`http://localhost:5001/api/concerts/${id}`);
      const data = await res.json();
      setConcert(data);
    }
    fetchConcert();
  }, [id]);

  if (!concert) return <p>Loading...</p>;

  return (
    <div className="concert-bg">

      <header className="main-header">
        <nav className="nav-bar">
          <img
            src={logo}
            alt="TourJam logo"
            className="logo"
            onClick={() => navigate("/")}
            style={{ cursor: "pointer" }}
          />

          <div className="nav-links">
            <button onClick={() => navigate("/profile")}>My Profile</button>

            {token ? (
              <button onClick={logout} className="nav-button">
                Logout
              </button>
            ) : (
              <>
                <button onClick={() => navigate("/login")} className="nav-button">
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

      <div className="concert-container">

        <h1>{concert.name}</h1>

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
            className="concert-image"
          />
        )}

        {concert.pleaseNote && (
          <div className="concert-note">
            <h4>Note:</h4>
            <p>{concert.pleaseNote}</p>
          </div>
        )}

        <div className="concert-actions">

          <a
            href={concert.url}
            target="_blank"
            rel="noopener noreferrer"
            className="ticket-button"
          >
            Buy Tickets
          </a>

          <button onClick={() => navigate(`/reviews/${concert.id}`)}>
            View Reviews
          </button>

        </div>

      </div>
    </div>
  );
}

export default ConcertDetails;
