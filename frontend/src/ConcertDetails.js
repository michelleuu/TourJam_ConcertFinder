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
  const [showToast, setShowToast] = useState(false);

  //bring artists information from Spotify API
  const [artists, setArtists] = useState([]);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const currentUserId = user?.id?.toString();

  //fetch Concert
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

  //fetch artists
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
              bio: data.bio || "",
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

  //fetch reviews
  useEffect(() => {
    async function fetchReviews() {
      try {
        const res = await fetch(`http://localhost:5001/api/reviews/${id}`);
        const data = await res.json();
        setReviews(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching reviews:", err);
      }
    }

    fetchReviews();
  }, [id]);

  //check saved concerts
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

  //handle the saving concerts process
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

  //handle deleting events
  async function handleDelete(reviewId) {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this review?",
    );
    if (!confirmDelete) return;

    try {
      const localToken = localStorage.getItem("token");

      const res = await fetch(`http://localhost:5001/api/reviews/${reviewId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localToken}`,
        },
      });

      if (!res.ok) throw new Error("Failed to delete review");

      setReviews((prev) => prev.filter((r) => r._id !== reviewId));
    } catch (error) {
      console.error("Error deleting review:", error);
    }
  }

  //submit reviews function
  async function submitReview(e) {
    e.preventDefault();

    if (!token) {
      navigate("/login");
      return;
    }

    if (!rating) {
      alert("Please select a rating.");
      return;
    }

    try {
      setSubmittingReview(true);

      const response = await fetch("http://localhost:5001/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          concertId: id,
          rating: Number(rating),
          comment,
          username: user.username,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit review");
      }

      setReviews((prev) => [data, ...prev]);
      setRating(0);
      setComment("");
      setReviewOpen(false);
    } catch (error) {
      console.error("Review submission error:", error);
    } finally {
      setSubmittingReview(false);
    }
  }

  function getBestImage(images) {
    if (!images || images.length === 0) return "";

    const sorted = [...images].sort((a, b) => {
      return b.width * b.height - a.width * a.height;
    });

    return sorted[0]?.url || "";
  }

  function formatDate(date, time) {
    if (!date) return "Date TBA";

    const dateObj = new Date(`${date}T${time || "19:00:00"}`);
    return new Intl.DateTimeFormat("en-CA", {
      weekday: "short",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(dateObj);
  }

  function formatTime(time) {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const date = new Date();
    date.setHours(Number(hours), Number(minutes));
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  }

  function timeAgo(createdAt) {
    if (!createdAt) return "";
    const now = new Date();
    const then = new Date(createdAt);
    const diffMs = now - then;
    const day = 1000 * 60 * 60 * 24;

    const days = Math.floor(diffMs / day);
    if (days < 1) return "today";
    if (days === 1) return "1 day ago";
    if (days < 7) return `${days} days ago`;
    if (days < 30) {
      const weeks = Math.floor(days / 7);
      return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
    }
    if (days < 365) {
      const months = Math.floor(days / 30);
      return `${months} month${months > 1 ? "s" : ""} ago`;
    }
    const years = Math.floor(days / 365);
    return `${years} year${years > 1 ? "s" : ""} ago`;
  }

  const headliner = artists?.[0];
  const supportingActs = artists?.slice(1) || [];
  const localDate = concert?.dates?.start?.localDate || "Date TBA";
  const localTime = concert?.dates?.start?.localTime || "";
  const venueName = concert?._embedded?.venues?.[0]?.name || "Venue TBA";
  const venueCity = concert?._embedded?.venues?.[0]?.city?.name || "";
  const venueState =
    concert?._embedded?.venues?.[0]?.state?.stateCode ||
    concert?._embedded?.venues?.[0]?.country?.countryCode ||
    "";
  const concertImage = getBestImage(concert?.images);

  const averageRating = useMemo(() => {
    if (!reviews.length) return 0;
    const total = reviews.reduce(
      (sum, review) => sum + Number(review.rating || 0),
      0,
    );
    return total / reviews.length;
  }, [reviews]);

  const ratingCounts = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((review) => {
      const value = Number(review.rating);
      if (counts[value] !== undefined) counts[value] += 1;
    });
    return counts;
  }, [reviews]);

  const maxCount = Math.max(...Object.values(ratingCounts), 1);

  if (!concert) return <p className="concert-loading">Loading...</p>;

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

        {/* Headliner + Supporting Acts */}
        <div className="lineup-section">
          <div className="headliner-block">
            <strong>Headliner:</strong>

            <div className="artist-card">
              {artists[0]?.image && (
                <img
                  src={artists[0].image}
                  alt={artists[0].name}
                  className="lineup-artist-image"
                />
              )}
              <p className="artist-name">{artists[0]?.name}</p>
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

              <div className="headliner-info">
                <h3>{headliner?.name || "Artist TBA"}</h3>

                <p className="artist-bio">
                  {headliner?.bio || "No biography available."}
                </p>

                <div className="artist-stats">
                  <div>
                    <p className="artist-stat-number">
                      {headliner?.popularity
                        ? headliner.popularity.toLocaleString()
                        : "N/A"}
                    </p>
                    <span>Popularity</span>
                  </div>

                  <div>
                    <p className="artist-stat-number">
                      {headliner?.followers
                      ? headliner.followers.toLocaleString()
                      : "N/A"}
                    </p>
                    <span>Followers</span>
                  </div>

                  <a 
                    href={headliner?.spotifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View on Spotify
                  </a>
                  
                </div>

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
