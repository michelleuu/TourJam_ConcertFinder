import { useContext, useEffect, useState, useRef } from "react";
import "./App.css";
import "./profile.css";
import { AuthContext } from "./context/AuthContext";
import { useNavigate } from "react-router-dom";
import logo from "./assets/logo.svg";
import NavbarProfileMenu from "./NavbarProfileMenu";
import UserAvatar from "./UserAvatar";

function Profile() {
  const { token, user, setUser, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [genres, setGenres] = useState([]);
  const [savedConcerts, setSavedConcerts] = useState([]);
  const [activityTab, setActivityTab] = useState("concerts");
  const fileInputRef = useRef(null);

  //change of user name
  const [draftUsername, setDraftUsername] = useState("");
  //change of profile image
  const [draftProfileImage, setDraftProfileImage] = useState("");
  const [activeSection, setActiveSection] = useState(null);
  const [imageError, setImageError] = useState("");

  const [userReviews, setUserReviews] = useState([]);
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [spotifyArtists, setSpotifyArtists] = useState([]);
  //clicking each artist information
  const [selectedArtist, setSelectedArtist] = useState(null);

  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editRating, setEditRating] = useState(0);
  const [editComment, setEditComment] = useState("");

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

  //fetch profile from saved data
  useEffect(() => {
    if (!token) return;

    async function fetchProfile() {
      try {
        const res = await fetch("http://localhost:5001/api/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        console.log("PROFILE DATA:", data);

        if (!res.ok) {
          throw new Error(data.message || "Failed to fetch profile");
        }

        setUsername(data.username || "");
        setProfileImage(data.profileImage || "");
        setDraftUsername(data.username || "");
        setDraftProfileImage(data.profileImage || "");
        setGenres(data.preferredGenres || []);
        setSpotifyConnected(!!data.spotifyConnected);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    }

    //fetch saved concerts
    async function fetchSavedConcerts() {
      try {
        const res = await fetch(
          "http://localhost:5001/api/profile/interested",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to fetch saved concerts");
        }

        setSavedConcerts(data || []);
      } catch (err) {
        console.error("Failed to fetch saved concerts:", err);
      }
    }

    async function fetchUserReviews() {
      try {
        const res = await fetch("http://localhost:5001/api/reviews/user", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to fetch user reviews");
        }

        console.log("USER REVIEWS:", data);
        setUserReviews(data);
      } catch (err) {
        console.error("Failed to fetch user reviews:", err);
      }
    }

    fetchProfile();
    fetchSavedConcerts();
    fetchUserReviews();
  }, [token]);

  //fetch using /spotify-favourites
  useEffect(() => {
  if (!token || !spotifyConnected) return;

  async function fetchSpotifyArtists() {
    try {
      const res = await fetch(
        "http://localhost:5001/api/concerts/spotify-favourites",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch Spotify artists");
      }

      setSpotifyArtists(data.favouriteArtists || []);
    } catch (err) {
      console.error("Failed to fetch Spotify artists:", err);
      setSpotifyArtists([]);
    }
  }

  fetchSpotifyArtists();
}, [token, spotifyConnected]);

  //delete review
  const handleDelete = async (reviewId) => {
    const confirmDelete = window.confirm("Delete this review?");
    if (!confirmDelete) return;

    try {
      const res = await fetch(`http://localhost:5001/api/reviews/${reviewId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to delete");

      setUserReviews((prev) => prev.filter((r) => r._id !== reviewId));
    } catch (err) {
      console.error(err);
    }
  };

  async function handleUpdate(reviewId) {
    try {
      const res = await fetch(
        `http://localhost:5001/api/reviews/${reviewId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            rating: editRating,
            comment: editComment,
          }),
        }
      );

      const updated = await res.json();

      if (!res.ok) throw new Error("Failed to update review");

      setUserReviews((prev) =>
        prev.map((r) => (r._id === reviewId ? updated : r))
      );

      setEditingReviewId(null);
    } catch (err) {
      console.error("Error updating review:", err);
    }
  }

  const handleGenreChange = (genre) => {
    if (genres.includes(genre)) {
      setGenres(genres.filter((g) => g !== genre));
    } else {
      setGenres([...genres, genre]);
    }
  };

  // validate images for user profile 
  const validateImageFile = (file) => {
    if (!file) return "No file selected.";

    const maxSize = 2 * 1024 * 1024; // 2MB
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    console.log("Selected image:", {
      name: file.name,
      type: file.type,
      sizeBytes: file.size,
      sizeMB: (file.size / (1024 * 1024)).toFixed(2),
    });

    if (!allowedTypes.includes(file.type)) {
      return "Only JPG, PNG, or WEBP images are allowed.";
    }

    if (file.size > maxSize) {
      return "File is too large. Max size is 2MB.";
    }

    return "";
  };

  // load those image files
  const loadImageFile = (file) => {
    if (!file) return;

    const reader = new FileReader();

    reader.onerror = () => {
      setDraftProfileImage("");
      setImageError("Could not read that image file.");
    };

    reader.onloadend = () => {
      setDraftProfileImage(reader.result);
      setImageError("");
    };

    reader.readAsDataURL(file);
  };

  // handle uploading the iamges
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validationError = validateImageFile(file);

    if (validationError) {
      setDraftProfileImage("");
      setImageError(validationError);
      return;
    }

    loadImageFile(file);
  };

  const handleDroppedImage = (file) => {
    if (!file) return;

    const validationError = validateImageFile(file);

    if (validationError) {
      setDraftProfileImage("");
      setImageError(validationError);
      return;
    }

    loadImageFile(file);
  };

  // update profile and post 
  const updateProfile = async () => {
    if (imageError) return;

    try {
      const res = await fetch("http://localhost:5001/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: draftUsername,
          profileImage: draftProfileImage,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Profile updated successfully!");

        const updatedUsername = data.username || draftUsername;
        const updatedProfileImage = data.profileImage ?? draftProfileImage;

        setUsername(updatedUsername);
        setProfileImage(updatedProfileImage);
        setDraftUsername(updatedUsername);
        setDraftProfileImage(updatedProfileImage);
        setImageError("");

        // update global auth user too
        setUser((prev) => ({
          ...prev,
          username: updatedUsername,
          profileImage: updatedProfileImage,
        }));

        setActiveSection(null);
      } else {
        setImageError(data.message || "Failed to update profile.");
      }
    } catch (err) {
      console.error(err);
      setImageError(
        "Upload failed. The image may be too large or the wrong file format.",
      );
    }
  };

  //update genre in POST
  const updateGenres = async () => {
    try {
      const res = await fetch("http://localhost:5001/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ preferredGenres: genres }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Genres updated successfully!");
        setActiveSection(null);
      } else {
        alert(data.message || "Failed to update genres");
      }
    } catch (err) {
      console.error(err);
    }
  };

  //connect with Spotify
  const connectSpotify = () => {
    localStorage.setItem("redirectAfterSpotify", "/profile");
    window.location.href = `http://localhost:5001/api/spotify/login?token=${token}`;
  };

  // Profile image to display
  const removeSavedConcert = async (concertId) => {
    try {
      const res = await fetch(
        `http://localhost:5001/api/profile/interested/${concertId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to remove concert");
      }

      setSavedConcerts((prev) =>
        prev.filter((concert) => concert.concertId !== concertId),
      );
    } catch (err) {
      console.error("Failed to remove saved concert:", err);
      alert("Could not remove concert.");
    }
  };

  if (loading) {
    return <div>Loading profile...</div>;
  }

  if (!user) {
    return <div>Please log in.</div>;
  }

  return (
    <div>
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

      <div className="profile-header">
        <div className="profile-bio">
          <UserAvatar
            user={{
              ...user,
              username: username || user?.username,
              profileImage: user?.profileImage || profileImage,
            }}
            className="profile-avatar"
            fallbackClassName="profile-avatar-fallback"
            alt="Profile"
          />

          <div className="profile-info">
            <h1>{username}</h1>
            <p>Preferred genres: {genres.join(", ") || "None"}</p>

            <div className="profile-buttons">
              {/*Edit Profile Button */}
              <button
                className="edit-btn"
                onClick={() => {
                  setDraftUsername(username);
                  setDraftProfileImage(profileImage);
                  setImageError("");
                  setActiveSection(activeSection === "edit" ? null : "edit");
                }}
              >
                Edit Profile
              </button>

              {/*Edit Genre Preferences Button */}
              <button
                className="edit-btn"
                onClick={() =>
                  setActiveSection(activeSection === "genres" ? null : "genres")
                }
              >
                Genre Preferences
              </button>

              {/*Connect Spotify Button */}
              <button
                className="edit-btn"
                onClick={() => {
                  if (!spotifyConnected) connectSpotify();
                }}
                disabled={spotifyConnected}
              >
                {spotifyConnected ? "Spotify Connected ✓" : "Connect Spotify"}
              </button>
            </div>
          </div>
        </div>

        {/*Edit Profile Section */}
        {activeSection === "edit" && (
          <div className="edit-section">
            <div
              className="upload-box"
              onClick={() => fileInputRef.current.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                handleDroppedImage(file);
              }}
            >
              {draftProfileImage ? (
                <div className="image-preview">
                  <img src={draftProfileImage} alt="Preview" />

                  <button
                    className="remove-image"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDraftProfileImage("");
                      setImageError("");

                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <>
                  <p>Add profile picture</p>
                  <p>( drag and drop or choose from file )</p>
                </>
              )}
            </div>

            <div className="edit-form">
              <h3>Account Information</h3>
              <div className="form-group-container">
                <div className="form-group">
                  <label htmlFor="profile-photo">Choose a profile photo:</label>

                  <input
                    id="profile-photo"
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageUpload}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="username">username</label>

                  <input
                    id="username"
                    type="text"
                    value={draftUsername}
                    onChange={(e) => setDraftUsername(e.target.value)}
                    placeholder="Username"
                  />
                </div>
              </div>

              <div className="edit-buttons">
                <button className="save-btn" onClick={updateProfile}>
                  Save Changes
                </button>

                <button
                  className="cancel-btn"
                  onClick={() => {
                    setImageError("");
                    setActiveSection(null);
                  }}
                >
                  Cancel Edit
                </button>
              </div>

              {imageError && <p className="image-error-text">{imageError}</p>}
            </div>
          </div>
        )}

        {/*Edit Genres Section */}
        {activeSection === "genres" && (
          <div className="genre-section">
            <h3>Edit Preferred Genres</h3>

            <div className="genre-grid">
              {genreOptions.map((genre) => (
                <div key={genre}>
                  <input
                    id={`genre-${genre}`}
                    type="checkbox"
                    checked={genres.includes(genre)}
                    onChange={() => handleGenreChange(genre)}
                  />
                  <label htmlFor={`genre-${genre}`}>{genre}</label>
                </div>
              ))}
            </div>
            <div className="edit-buttons">
              <button className="save-btn" onClick={updateGenres}>
                Add Genres
              </button>
              <button
                className="cancel-btn"
                onClick={() => setActiveSection(null)}
              >
                Cancel Edit
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="profile-tab-container">
        {/*Content from Dashboard Section */}
        <div className="profile-content">
          <h1>Your Activity</h1>

          {/*Change page views with three differnt tabs */}
          <div className="profile-tabs">
            <button
              className={activityTab === "reviews" ? "active-tab" : ""}
              onClick={() => setActivityTab("reviews")}
            >
              Past Reviews
            </button>

            <button
              className={activityTab === "concerts" ? "active-tab" : ""}
              onClick={() => setActivityTab("concerts")}
            >
              Saved Concerts
            </button>

            <button
              className={activityTab === "artists" ? "active-tab" : ""}
              onClick={() => setActivityTab("artists")}
            >
              Favourite Artists
            </button>
          </div>

          <div className="placeholder-area">
            {/*Saved Concerts tab*/}
            {activityTab === "concerts" && (
              <div className="saved-concerts-grid">
                {savedConcerts.length === 0 ? (
                  <p>No favourited concerts yet.</p>
                ) : (
                  savedConcerts.map((concert) => {
                  const localDate =
                  concert.dates?.start?.localDate || concert.date;

                  const localTime = concert.time || "TBA";

                  const formattedTime =
                    localTime !== "TBA"
                      ? new Date(`1970-01-01T${localTime}`).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })
                      : "TBA";
      
                  const eventDate = localDate ? new Date(localDate) : null;

                  const formattedDate = eventDate
                    ? eventDate.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "TBA";

                    return(
                      <div key={concert.concertId} className="saved-concert-card">
                      {concert.image && (
                        <img
                          src={concert.image}
                          alt={concert.name}
                          className="saved-concert-image"
                        />
                      )}

                      <div className="saved-concert-info">
                        <h3>{concert.name}</h3>
                        <p>
                          <strong>Date:</strong> {formattedDate} &#8226; {formattedTime}
                        </p>
                        <p>
                          <strong>Venue:</strong>{" "}
                            {concert._embedded?.venues?.[0]?.name ||
                              concert.venue ||
                              "Unknown venue"}
                        </p>

                        <div className="saved-concert-actions">
                          <button
                            onClick={() =>
                              navigate(`/concerts/${concert.concertId}`)
                            }
                          >
                            View Details
                          </button>

                          {concert.url && (
                            <a
                              href={concert.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ticket-link-button"
                            >
                              Get Tickets
                            </a>
                          )}

                          <button
                            onClick={() => removeSavedConcert(concert.concertId)}
                            className="remove-saved-button"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                    );
  })
                )}
              </div>
            )}

          {/*Past Reviews tab*/}
          {activityTab === "reviews" && (
            <div className="user-reviews">
              {userReviews.length === 0 ? (
                <p>No reviews yet.</p>
              ) : (
                userReviews.map((review) => {
                  const isEditing = editingReviewId === review._id;

                  return (
                    <div key={review._id} className="review-card">
                      <h4>{review.username}</h4>

                      {isEditing ? (
                        <>
                          {/* ⭐ Edit stars */}
                          <div className="star-picker">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                className={`star ${editRating >= star ? "filled" : ""}`}
                                onClick={() => setEditRating(star)}
                              >
                                {editRating >= star ? "★" : "☆"}
                              </span>
                            ))}
                          </div>

                          {/* ✏️ Edit comment */}
                          <textarea
                            className="edit-review-textarea"
                            value={editComment}
                            onChange={(e) => setEditComment(e.target.value)}
                          />

                          <div className="edit-review-actions">
                            <button onClick={() => handleUpdate(review._id)}>
                              Save
                            </button>

                            <button onClick={() => setEditingReviewId(null)}>
                              Cancel
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* NORMAL VIEW */}
                          <div className="review-stars">
                            {"★".repeat(Number(review.rating || 0))}
                            {"☆".repeat(5 - Number(review.rating || 0))}
                          </div>
                          <p>{review.comment}</p>

                          <div className="review-actions">
                            <button
                              onClick={() => navigate(`/concerts/${review.concertId}`)}
                            >
                              View Concert
                            </button>

                            <button
                              className="delete-btn"
                              onClick={() => handleDelete(review._id)}
                            >
                              Delete
                            </button>

                            <button
                              onClick={() => {
                                setEditingReviewId(review._id);
                                setEditRating(review.rating);
                                setEditComment(review.comment);
                              }}
                            >
                              Edit
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Favourite Artists tab*/}
          {activityTab === "artists" && (
            <div className="artists-grid">
              {spotifyArtists.length === 0 ? (
                <p>No favorite artists yet.</p>
              ) : (
                spotifyArtists.map(({ artist, concerts = [] }, index) => (
                  <div
                    key={artist.id}
                    className="artist-card"
                  >
                    <div className="artist-card-image">
                      {artist.image ? (
                        <img src={artist.image} alt={artist.name} />
                      ) : (
                        <div className="artist-image-placeholder" />
                      )}
                    </div>
                    <div className="artist-card-content">
                      <h3
                        className="artist-name"
                        onClick={() => setSelectedArtist({ artist, concerts })}
                      >
                        {artist.name}
                      </h3>
                      <p>
                        {concerts.length} concert
                        {concerts.length !== 1 ? "s" : ""} available
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

            {/* popup page for favourite artists concerts */}
            {selectedArtist && (
              <div
                className="popup-overlay"
                onClick={() => setSelectedArtist(null)}
              >
                <div
                  className="popup-content"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h2>{selectedArtist.artist.name}</h2>

                  {selectedArtist.concerts.length === 0 ? (
                    <p>No upcoming concerts found.</p>
                  ) : (
                    selectedArtist.concerts.map((concert) => (
                      <div key={concert.id} className="saved-concert-card">
                        <h4>{concert.name}</h4>

                        <p>
                          <strong>Date:</strong>{" "}
                          {concert.dates?.start?.localDate || "TBA"}
                        </p>

                        <p>
                          <strong>Venue:</strong>{" "}
                          {concert._embedded?.venues?.[0]?.name ||
                            "Unknown venue"}
                        </p>

                        <div className="saved-concert-actions">
                          <button
                            onClick={() => navigate(`/concerts/${concert.id}`)}
                          >
                            View Details
                          </button>

                          {concert.url && (
                            <a
                              href={concert.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ticket-link-button"
                            >
                              Tickets
                            </a>
                          )}
                        </div>
                      </div>
                    ))
                  )}

                  <button onClick={() => setSelectedArtist(null)}>Close</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
