import { useParams, useNavigate } from "react-router-dom";
import { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./context/AuthContext";
import logo from "./assets/logo.svg";
import "./concertDetails.css";
import { BsBookmark, BsBookmarkFill } from "react-icons/bs";
import NavbarProfileMenu from "./NavbarProfileMenu";
import UserAvatar from "./UserAvatar";

function ConcertDetails() {
  const { token, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { id } = useParams();

  const [concert, setConcert] = useState(null);
  const [artists, setArtists] = useState([]);
  const [isInterested, setIsInterested] = useState(false);
  const [loadingInterest, setLoadingInterest] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const [reviews, setReviews] = useState([]);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editRating, setEditRating] = useState(0);
  const [editComment, setEditComment] = useState("");

  const currentUserId = user?.id?.toString();

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
          concert._embedded.attractions.map(async (artistItem, index) => {
            const res = await fetch(
              `http://localhost:5001/api/artists/${encodeURIComponent(artistItem.name)}`,
            );
            const data = await res.json();

            return {
              id: artistItem.id,
              name: artistItem.name,
              image: data.image || "",
              genres: data.genres || [],
              followers: index === 0 ? 82049727 : data.followers || 0,
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

  useEffect(() => {
    async function checkInterestedStatus() {
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
    if (!token) {
      navigate("/login");
      return;
    }

    if (!concert || loadingInterest) return;

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

        if (!res.ok) throw new Error("Failed to remove concert");
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

        if (!res.ok) throw new Error("Failed to save concert");

        setIsInterested(true);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2500);
      }
    } catch (err) {
      console.error(err);
      alert("Could not update interested concerts.");
    } finally {
      setLoadingInterest(false);
    }
  }

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

  async function handleUpdate(reviewId) {
    try {
      const localToken = localStorage.getItem("token");

      const res = await fetch(`http://localhost:5001/api/reviews/${reviewId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localToken}`,
        },
        body: JSON.stringify({
          rating: editRating,
          comment: editComment,
        }),
      });

      const updated = await res.json();

      if (!res.ok) throw new Error("Failed to update review");

      setReviews((prev) => prev.map((r) => (r._id === reviewId ? updated : r)));

      setEditingReviewId(null);
    } catch (err) {
      console.error("Error updating review:", err);
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
    <div className="concert-page">
      <header className="main-header">
        <nav className="nav-bar">
          <div className="main-nav">
            <img
              src={logo}
              alt="TourJam logo"
              className="logo"
              onClick={() => navigate("/")}
            />

            <button onClick={() => navigate("/browse")} className="nav-button">
              Browse
            </button>
          </div>

          <div className="nav-links">
            {token ? (
              <>
                <NavbarProfileMenu />
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

      <main className="concert-details-page">
        <section className="hero-section">
          <div className="hero-image-wrap">
            {concertImage && (
              <img
                src={concertImage}
                alt={concert.name}
                className="hero-image"
              />
            )}
          </div>

          <div className="hero-content">
            <p className="artist-title">{headliner?.name}</p>
            <h1 className="tour-label">{concert.name}</h1>

            <p className="hero-meta">
              {formatDate(localDate, localTime)}{" "}
              {localTime && <span>• {formatTime(localTime)}</span>}
            </p>

            <p className="hero-meta">
              {venueName}
              {(venueCity || venueState) && (
                <span>
                  {" "}
                  • {venueCity}
                  {venueState ? `, ${venueState}` : ""}
                </span>
              )}
            </p>

            <div className="hero-tags">
              <span className="hero-pill">
                {averageRating ? averageRating.toFixed(1) : "0.0"} ★
              </span>
              <span className="hero-pill">
                {headliner?.genres?.[0]
                  ? headliner.genres[0][0].toUpperCase() +
                    headliner.genres[0].slice(1)
                  : "Pop"}
              </span>
            </div>
          </div>
        </section>

        <section className="details-surface">
          <section className="lineup-section-new">
            <h2 className="section-title">Headliner</h2>

            <div className="headliner-grid">
              <div className="headliner-image-card">
                {headliner?.image ? (
                  <img
                    src={headliner.image}
                    alt={headliner.name}
                    className="headliner-image"
                  />
                ) : (
                  <div className="headliner-image placeholder-box" />
                )}
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
                </div>

                <div className="concert-actions">
                  <a
                    href={concert.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ticket-button"
                  >
                    Find Tickets
                  </a>

                  <a
                    href={headliner?.spotifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="view-spotify-button"
                  >
                    View on Spotify
                  </a>

                  <button
                    onClick={handleInterestedClick}
                    disabled={loadingInterest}
                    className={`interested-button ${isInterested ? "saved" : ""}`}
                    aria-label={
                      isInterested
                        ? "Remove from interested concerts"
                        : "Save to interested concerts"
                    }
                    title={isInterested ? "Saved" : "Save concert"}
                  >
                    {isInterested ? (
                      <BsBookmarkFill className="bookmark-icon" />
                    ) : (
                      <BsBookmark className="bookmark-icon" />
                    )}

                    <span className="bookmark-label">
                      {isInterested ? "Saved" : "Save Concert"}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {!!supportingActs.length && (
              <>
                <h2 className="section-title supporting-title">
                  Supporting Acts
                </h2>

                <div className="supporting-grid">
                  {supportingActs.map((artist) => (
                    <div className="supporting-card" key={artist.id}>
                      {artist.image ? (
                        <img
                          src={artist.image}
                          alt={artist.name}
                          className="supporting-image"
                        />
                      ) : (
                        <div className="supporting-image placeholder-box" />
                      )}
                      <p>{artist.name}</p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {concert.pleaseNote && (
              <div className="notes-card">
                <strong>Notes:</strong>
                <p>{concert.pleaseNote}</p>
              </div>
            )}
          </section>

          <section className="reviews-section">
            <div className="reviews-left">
              <div className="reviews-header-row">
                <h2 className="section-title reviews-title">Reviews</h2>
                <p className="reviews-summary-inline">
                  • {averageRating ? averageRating.toFixed(1) : "0.0"} ☆ (
                  {reviews.length} review{reviews.length === 1 ? "" : "s"})
                </p>
              </div>

              {!user && (
                <p
                  style={{
                    marginTop: "1rem",
                    marginBottom: "5rem",
                    fontSize: "1rem",
                  }}
                >
                  <span
                    onClick={() => navigate("/login")}
                    style={{
                      color: "#6d28d9",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Log in
                  </span>{" "}
                  or{" "}
                  <span
                    onClick={() => navigate("/register")}
                    style={{
                      color: "#6d28d9",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Register
                  </span>{" "}
                  to leave reviews.
                </p>
              )}

              {reviews.length === 0 ? (
                <p className="no-reviews">No reviews yet.</p>
              ) : (
                <div className="reviews-list">
                  {reviews.map((review) => {
                    const ownerId = review.userId?.toString();
                    const canDelete =
                      currentUserId && ownerId === currentUserId;
                    const canEdit = currentUserId && ownerId === currentUserId;

                    const isEditing = editingReviewId === review._id;

                    return (
                      <div className="review-item" key={review._id}>
                        <h4>{review.username}</h4>

                        {!isEditing && (
                          <div className="review-stars-time">
                            <span className="review-stars">
                              {"★".repeat(Number(review.rating || 0))}
                              {"☆".repeat(5 - Number(review.rating || 0))}
                            </span>
                            <span className="review-time">
                              {timeAgo(review.createdAt)}
                            </span>
                          </div>
                        )}

                        {isEditing ? (
                          <>
                            <div className="star-picker">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  className={`star-button ${editRating >= star ? "active" : ""}`}
                                  onClick={() => setEditRating(star)}
                                >
                                  {editRating >= star ? "★" : "☆"}
                                </button>
                              ))}
                            </div>

                            <textarea
                              className="edit-review-textarea"
                              value={editComment}
                              onChange={(e) => setEditComment(e.target.value)}
                            />

                            <div className="edit-review-actions">
                              <button
                                className="save-review-btn"
                                onClick={() => handleUpdate(review._id)}
                              >
                                Save
                              </button>

                              <button
                                className="cancel-review-btn"
                                onClick={() => setEditingReviewId(null)}
                              >
                                Cancel
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <p className="review-comment">{review.comment}</p>

                            {canDelete && (
                              <button
                                className="delete-review-btn"
                                onClick={() => handleDelete(review._id)}
                              >
                                Delete
                              </button>
                            )}

                            {canEdit && (
                              <button
                                className="edit-review-btn"
                                onClick={() => {
                                  setEditingReviewId(review._id);
                                  setEditRating(review.rating);
                                  setEditComment(review.comment);
                                }}
                              >
                                Edit
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="reviews-right">
              <div className="review-summary-card">
                <h3>Review summary</h3>

                {[5, 4, 3, 2, 1].map((star) => (
                  <div className="summary-row" key={star}>
                    <span className="summary-label">{star} star</span>
                    <div className="summary-bar">
                      <div
                        className="summary-fill"
                        style={{
                          width: `${(ratingCounts[star] / maxCount) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="summary-count">{ratingCounts[star]}</span>
                  </div>
                ))}
              </div>

              <div className={`add-review-card ${reviewOpen ? "open" : ""}`}>
                <button
                  type="button"
                  className="add-review-toggle"
                  onClick={() => setReviewOpen((prev) => !prev)}
                >
                  <div>
                    <p className="add-review-kicker">Add a review to</p>
                    <h3>{concert.name}</h3>
                  </div>
                  <span className={`chevron ${reviewOpen ? "up" : "down"}`} />
                </button>

                <div className="add-review-content">
                  {user ? (
                    <form
                      onSubmit={submitReview}
                      className="inline-review-form"
                    >
                      <div className="review-user-row">
                        <UserAvatar
                          user={user}
                          className="review-avatar-image"
                          fallbackClassName="review-avatar"
                          alt={user?.username}
                        />

                        <p>
                          Posting public review as <br />
                          {user?.username}
                        </p>
                      </div>

                      <div className="inline-field">
                        <label>My rating:</label>
                        <div className="star-picker">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              className={`star-button ${rating >= star ? "active" : ""}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setRating(star);
                              }}
                              aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                            >
                              {rating >= star ? "★" : "☆"}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="inline-field">
                        <label htmlFor="review-comment">Write a review:</label>
                        <textarea
                          id="review-comment"
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder=""
                        />
                      </div>

                      <div className="inline-review-actions">
                        <button
                          type="button"
                          className="cancel-review-btn"
                          onClick={() => {
                            setReviewOpen(false);
                            setRating(0);
                            setComment("");
                          }}
                        >
                          Cancel
                        </button>

                        <button
                          type="submit"
                          className="submit-review-btn"
                          disabled={submittingReview}
                        >
                          {submittingReview ? "Posting..." : "Post Review"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="review-login-box">
                      <p>Log in to post a review.</p>
                      <button
                        className="submit-review-btn"
                        onClick={() => navigate("/login")}
                      >
                        Login
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </section>
      </main>

      {showToast && <div className="save-toast">Saved to your profile!</div>}
      <footer className="footer">
        <div className="footer-content">
          <img src={logo} alt="TourJam logo" className="logo" />

          <div className="footer-divider" />

          <div className="footer-bottom">
            <p className="footer-description">
              TourJam helps you discover live music experiences tailored to your
              taste. Browse concerts, find shows from your favourite artists,
              and never miss a performance near you.
            </p>

            <p className="footer-copy">© 2026 TourJam</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default ConcertDetails;
