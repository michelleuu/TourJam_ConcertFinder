import { useContext, useEffect, useState } from "react";
import "./App.css";
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

  // Draft states for editing
  const [draftUsername, setDraftUsername] = useState("");
  const [draftProfileImage, setDraftProfileImage] = useState("");

  const [editMode, setEditMode] = useState(false);

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

  // Handle image upload for draft
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setDraftProfileImage(reader.result);
    reader.readAsDataURL(file);
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
        setEditMode(false);
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
              style={{ cursor: "pointer" }}
            />
            <button onClick={() => navigate("/profile")} className="nav-button">
              My Profile
            </button>
          </div>
          <div className="nav-links">
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

      <div className="page-container">
        <h1>My Profile</h1>
        <h2>Username: {username}</h2>
        <div style={{ marginBottom: "1rem" }}>
          <img
            src={displayImage}
            alt="Profile"
            style={{ width: "15rem", height: "15rem", borderRadius: "50%" }}
          />
        </div>

        <button
          onClick={() => {
            setDraftUsername(username);
            setDraftProfileImage(profileImage);
            setEditMode(!editMode);
          }}
        >
          {editMode ? "Cancel Edit" : "Edit Profile"}
        </button>

        {editMode && (
          <div style={{ marginTop: "1rem" }}>
            <div>
              <label>
                Username:
                <input
                  type="text"
                  value={draftUsername}
                  onChange={(e) => setDraftUsername(e.target.value)}
                />
              </label>
            </div>
            <div style={{ marginTop: "1rem" }}>
              <label>
                Upload Profile Image:
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </label>
            </div>
            <button onClick={updateProfile} style={{ marginTop: "1rem" }}>
              Save Profile Info
            </button>
          </div>
        )}

        {/* Genres */}
        <div style={{ marginTop: "2rem" }}>
          <h2>Edit Preferred Genres</h2>
          {genreOptions.map((genre) => (
            <label key={genre} style={{ display: "block" }}>
              <input
                type="checkbox"
                value={genre}
                checked={genres.includes(genre)}
                onChange={() => handleGenreChange(genre)}
              />
              {genre}
            </label>
          ))}
        </div>
        <button onClick={updateGenres} style={{ marginTop: "1rem" }}>
          Save Genres
        </button>

        <div style={{ marginTop: "2rem" }}>
          <button onClick={() => navigate("/")}>Back to Dashboard</button>
          <button onClick={logout}>Logout</button>
        </div>
      </div>
    </div>
  );
}

export default Profile;
