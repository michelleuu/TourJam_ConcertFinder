import { useParams } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "./context/AuthContext";
import logo from "./assets/logo.svg";
import "./concertDetails.css";

function ConcertDetails() {
  const { token, user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const { id } = useParams();
  const [concert, setConcert] = useState(null);
  const [isInterested, setIsInterested] = useState(false);
  const [loadingInterest, setLoadingInterest] = useState(false);
  //bring artists information from Spotify API
  const [artist, setArtist] = useState(null);

  console.log("ConcertDetails token:", token);
  console.log("ConcertDetails user:", user);

  //fetching concerts from TM API
  useEffect(() => {
    async function fetchConcert() {
      try {
        const res = await fetch(`http://localhost:5001/api/concerts/${id}`);
        const data = await res.json();
        setConcert(data);
      } catch (err) {
        console.error("Failed to fetch concert:", err);
      }
    }

    fetchConcert();
  }, [id]);

  //fetch artists from concert 
  useEffect(() => {
  async function fetchArtist() {
    if (!concert?._embedded?.attractions?.[0]?.name) return;

    try {
      const artistName = concert._embedded.attractions[0].name;

      const res = await fetch(
        `http://localhost:5001/api/artists/${encodeURIComponent(artistName)}`
      );

      const data = await res.json();
      setArtist(data);
    } catch (err) {
      console.error("Failed to fetch artist:", err);
    }
  }

  fetchArtist();
}, [concert]);

  //Interest check 
  useEffect(() => {
    async function checkInterestedStatus() {
      console.log("Checking interested status with token:", token);

      if (!token) return;

      try {
        const res = await fetch(
          `http://localhost:5001/api/profile/interested/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!res.ok) return;

        const data = await res.json();
        setIsInterested(data.isSaved);
      } catch (err) {
        console.error("Failed to check interested status:", err);
      }
    }

    checkInterestedStatus();
  }, [id, token]);

  async function handleInterestedClick() {
    console.log("Clicked interested");
    console.log("Token being sent:", token);
    console.log("Type of token:", typeof token);

    if (!token) {
      navigate("/login");
      return;
    }

    if (!concert) return;

    setLoadingInterest(true);

    try {
      if (isInterested) {
        const res = await fetch(
          `http://localhost:5001/api/profile/interested/${concert.id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!res.ok) {
          throw new Error("Failed to remove concert");
        }

        setIsInterested(false);
      } else {
        const res = await fetch(
          "http://localhost:5001/api/profile/interested",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              concertId: concert.id,
              name: concert.name,
              date: concert.dates?.start?.localDate || "",
              venue: concert._embedded?.venues?.[0]?.name || "",
              image: concert.images?.[0]?.url || "",
              url: concert.url || "",
            }),
          },
        );

        if (!res.ok) {
          throw new Error("Failed to save concert");
        }

        setIsInterested(true);
      }
    } catch (err) {
      console.error(err);
      alert("Could not update interested concerts.");
    } finally {
      setLoadingInterest(false);
    }
  }

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

      <div className="concert-container">
        <h1>{concert.name}</h1>
        
        <p>
            <strong>Artist:</strong>{" "}
            <span>{concert._embedded?.attractions?.[0]?.name}</span>
        </p>

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
        {/*Artist section for showing thier information */}
        {artist && (
          <div className="artist-section">
            <h2>Artist Info</h2>

            {artist.image && (
              <img
                src={artist.image}
                alt={artist.name}
                className="artist-image"
              />
            )}

            <p>
              <strong>Genres:</strong> {artist.genres.join(", ")}
            </p>

            <p>
              <strong>Followers:</strong> {artist.followers.toLocaleString()}
            </p>

            <p>
              <strong>Popularity:</strong> {artist.popularity}
            </p>

            <a
              href={artist.spotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              View on Spotify
            </a>
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

          <button
            onClick={handleInterestedClick}
            disabled={loadingInterest}
            className={`interested-button ${isInterested ? "saved" : ""}`}
          >
            {isInterested ? "♥ Interested" : "♡ Interested"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConcertDetails;
