import { useContext, useEffect, useState, useRef } from "react";
import "./App.css";
import "./profile.css";
import { AuthContext } from "./context/AuthContext";
import { useNavigate } from "react-router-dom";
import logo from "./assets/logo.svg";

function Profile() {
  const { token, user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // Main saved state
  const [username, setUsername] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [genres, setGenres] = useState([]);
  const fileInputRef = useRef(null);

  // States for editing
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

  // Fetch profile info on load
  useEffect(() => {
    if (!token) return;

    async function fetchProfile() {
      try {
        const res = await fetch("http://localhost:5001/api/profile", {
          headers: { Authorization: token },
        });
        const data = await res.json();
        setUsername(data.username || "");
        setProfileImage(data.profileImage || "");
        setDraftUsername(data.username || "");
        setDraftProfileImage(data.profileImage || "");
        setGenres(data.preferredGenres || []);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    }

    fetchProfile();
  }, [token]);

  // Handle genre selection
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

  // Handle image upload for draft
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    loadImageFile(file);
  };

  // Update profile info (username + profile image)
  const updateProfile = async () => {
    try {
      const res = await fetch("http://localhost:5001/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
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

  // Update genres only
  const updateGenres = async () => {
    try {
      const res = await fetch("http://localhost:5001/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
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

  // Profile image to display
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

      {/* Black profile header section for profile image and editing options */}
      <div className="profile-header">
        <div className="profile-bio">
          <img src={displayImage} alt="Profile" className="profile-avatar" />

          <div className="profile-info">
            <h1>{username}</h1>
            <p>Preferred genres: {genres.join(", ") || "None"}</p>

            {/* Buttons to toggle between profile edditing modes (edit profile or edit genre) */}
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

        {/* Display edit profile components when state is set to "edit"*/}
        {activeSection === "edit" && (
          <div className="edit-section">
            {/* Drop box */}
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
              {/* Show preview if is image selected/uploaded */}
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

            {/* Edit profile info form */}
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

        {/* Display edit profile components when state is set to "genre" */}
        {activeSection === "genres" && (
          <div className="genre-section">
            <h3>Edit Preffered Genres</h3>

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

      {/* Profile page content */}
      <div className="profile-content">
        <h1>Your Activity</h1>

        <div className="profile-tabs">
          <p>Past Reviews</p>
          <p>Favorited Concerts</p>
          <p>Favorite Artists</p>
        </div>

        <div className="placeholder-area">
          Todo: fetch reviews, favorited concerts/ artists, and display it here
          under the corresponding tabs.
        </div>
      </div>
    </div>
  );
}

export default Profile;
