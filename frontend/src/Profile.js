import { useContext, useEffect, useState, useRef } from "react";
import "./App.css";
import "./profile.css";
import { AuthContext } from "./context/AuthContext";
import { useNavigate } from "react-router-dom";
import logo from "./assets/logo.svg";

function Profile() {
  const { token, user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [genres, setGenres] = useState([]);
  const [savedConcerts, setSavedConcerts] = useState([]);
  const [activityTab, setActivityTab] = useState("concerts");
  const fileInputRef = useRef(null);

  const [draftUsername, setDraftUsername] = useState("");
  const [draftProfileImage, setDraftProfileImage] = useState("");
  const [activeSection, setActiveSection] = useState(null);

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

        if (!res.ok) {
          throw new Error(data.message || "Failed to fetch profile");
        }

        setUsername(data.username || "");
        setProfileImage(data.profileImage || "");
        setDraftUsername(data.username || "");
        setDraftProfileImage(data.profileImage || "");
        setGenres(data.preferredGenres || []);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    }

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

    fetchProfile();
    fetchSavedConcerts();
  }, [token]);

  const handleGenreChange = (genre) => {
    if (genres.includes(genre)) {
      setGenres(genres.filter((g) => g !== genre));
    } else {
      setGenres([...genres, genre]);
    }
  };

  const loadImageFile = (file) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setDraftProfileImage(reader.result);
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    loadImageFile(file);
  };

  const updateProfile = async () => {
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
        setUsername(draftUsername);
        setProfileImage(draftProfileImage);
        setActiveSection(null);
      } else {
        alert(data.message || "Failed to update profile");
      }
    } catch (err) {
      console.error(err);
    }
  };

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

  const displayImage =
    profileImage ||
    "https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png";

  if (!user) {
    return <div>Loading profile...</div>;
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
            <button onClick={() => navigate("/profile")} className="nav-button">
              My Profile
            </button>
          </div>

          <div className="nav-links">
            {token && (
              <button onClick={logout} className="nav-button">
                Logout
              </button>
            )}
          </div>
        </nav>
      </header>

      <div className="profile-header">
        <div className="profile-bio">
          <img src={displayImage} alt="Profile" className="profile-avatar" />

          <div className="profile-info">
            <h1>{username}</h1>
            <p>Preferred genres: {genres.join(", ") || "None"}</p>

            <div className="profile-buttons">
              <button
                className="edit-btn"
                onClick={() => {
                  setDraftUsername(username);
                  setDraftProfileImage(profileImage);
                  setActiveSection(activeSection === "edit" ? null : "edit");
                }}
              >
                Edit Profile
              </button>

              <button
                className="edit-btn"
                onClick={() =>
                  setActiveSection(activeSection === "genres" ? null : "genres")
                }
              >
                Genre Preferences
              </button>
            </div>
          </div>
        </div>

        {activeSection === "edit" && (
          <div className="edit-section">
            <div
              className="upload-box"
              onClick={() => fileInputRef.current.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                loadImageFile(file);
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
                    accept="image/*"
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
                  onClick={() => setActiveSection(null)}
                >
                  Cancel Edit
                </button>
              </div>
            </div>
          </div>
        )}

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

      <div className="profile-content">
        <h1>Your Activity</h1>

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
            Favorited Concerts
          </button>

          <button
            className={activityTab === "artists" ? "active-tab" : ""}
            onClick={() => setActivityTab("artists")}
          >
            Favorite Artists
          </button>
        </div>

        <div className="placeholder-area">
          {activityTab === "concerts" && (
            <div className="saved-concerts-grid">
              {savedConcerts.length === 0 ? (
                <p>No favorited concerts yet.</p>
              ) : (
                savedConcerts.map((concert) => (
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
                        <strong>Date:</strong> {concert.date || "TBA"}
                      </p>
                      <p>
                        <strong>Venue:</strong>{" "}
                        {concert.venue || "Unknown venue"}
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
                            Tickets
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
                ))
              )}
            </div>
          )}

          {activityTab === "reviews" && <p>Past reviews will show here.</p>}

          {activityTab === "artists" && <p>Favorite artists will show here.</p>}
        </div>
      </div>
    </div>
  );
}

export default Profile;
