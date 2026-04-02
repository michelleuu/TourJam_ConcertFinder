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
  const [artists, setArtists] = useState([]);

  console.log("ConcertDetails token:", token);
  console.log("ConcertDetails user:", user);

  //fetching concerts from TM API
  useEffect(() => {
    async function fetchConcert() {
      try {
        const res = await fetch(`http://localhost:5001/api/concerts/${id}`);
        const data = await res.json();
        console.log("concert response:", data);
        setConcert(data);
      } catch (err) {
        console.error("Failed to fetch concert:", err);
      }
    }

    fetchConcert();
  }, [id]);

  //fetch artists from concert
  useEffect(() => {
    async function fetchArtists() {
      if (!concert?._embedded?.attractions?.length) return;

      try {
        const artistResults = await Promise.all(
          concert._embedded.attractions.map(async (artistItem) => {
            const res = await fetch(
              `http://localhost:5001/api/artists/${encodeURIComponent(artistItem.name)}`,
            );

            const data = await res.json();

            return {
              id: artistItem.id,
              name: artistItem.name,
              image: data.image || "",
              genres: data.genres || [],
              followers: data.followers || 0,
              popularity: data.popularity || 0,
              spotifyUrl: data.spotifyUrl || "",
            };
          }),
        );

        setArtists(artistResults);
      } catch (err) {
        console.error("Failed to fetch artist:", err);
      }
    }

    fetchArtists();
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
              date: concert?.dates?.start?.localDate || "",
              venue: concert?._embedded?.venues?.[0]?.name || "",
              image: concert?.images?.[0]?.url || "",
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

  function getBestImage(images) {
    if (!images || images.length === 0) return "";

    // Sort images by size (largest first)
    const sorted = [...images].sort((a, b) => {
      return b.width * b.height - a.width * a.height;
    });

    return sorted[0]?.url || "";
  }

  const headliner = artists?.[0];
  const localDate = concert?.dates?.start?.localDate || "Date TBA";
  const localTime = concert?.dates?.start?.localTime || "";
  const venueName = concert?._embedded?.venues?.[0]?.name || "Venue TBA";
  const concertImage = getBestImage(concert?.images);

  return (
    <div className="concert-bg">
      <header className="main-header">
        <nav className="nav-bar">
          <div className="main-nav">
            <img
              src={logo}
              alt="TourJam logo"
              className="logo"
              onClick={() => navigate("/")}
              style={{ cursor: "pointer" }}
            />
            <button onClick={() => navigate("/browse")} className="nav-button">
              Browse
            </button>
          </div>

          <div className="nav-links">
            {token ? (
              <>
                <button onClick={logout} className="nav-button">
                  Logout
                </button>
                <button
                  onClick={() => navigate("/profile")}
                  className="nav-button"
                >
                  My Profile
                </button>

                {/* ADMIN BUTTON */}
                {user?.role === "admin" && (
                  <button
                    onClick={() => navigate("/admin")}
                    className="nav-button"
                  >
                    Admin Dashboard
                  </button>
                )}
              </>
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

        {/* Headliner + Supporting Acts */}
        <div className="lineup-section">
          <div className="headliner-block">
            <strong>Headliner:</strong>

            <div className="artist-card">
              {headliner?.image && (
                <img
                  src={headliner.image}
                  alt={headliner.name}
                  className="lineup-artist-image"
                />
              )}
              <p className="artist-name">{headliner?.name || "Artist TBA"}</p>
            </div>
          </div>

          {artists.length > 1 && (
            <div className="supporting-block">
              <strong>Supporting Acts:</strong>

              <div className="supporting-acts-row">
                {artists.slice(1).map((artist) => (
                  <div className="artist-card" key={artist.id}>
                    {artist.image && (
                      <img
                        src={artist.image}
                        alt={artist.name}
                        className="lineup-artist-image"
                      />
                    )}
                    <p className="artist-name">{artist.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <p>
          <strong>Date:</strong> {localDate} {localTime}
        </p>

        <p>
          <strong>Venue:</strong> {venueName}
        </p>

        {concertImage && (
          <img
            src={concertImage}
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
