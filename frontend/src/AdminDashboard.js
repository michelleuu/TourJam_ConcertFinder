import { useEffect, useState, useContext } from "react";
import { AuthContext } from "./context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";

function AdminDashboard() {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchResults, setSearchResults] = useState([]);
  const [carouselArtists, setCarouselArtists] = useState([]);

  const fetchCarousel = async () => {
    const res = await fetch("http://localhost:5001/api/admin/carousel");
    const data = await res.json();
    setCarouselArtists(data);
  };
  
  const searchArtist = async (query) => {
    const res = await fetch(`http://localhost:5001/api/artists/search?q=${query}`);
    const data = await res.json();
    setSearchResults(data);
    console.log("SEARCH DATA:", data);

    setSearchResults(Array.isArray(data) ? data : [data]);
  };

  const addToCarousel = async (artist) => {
    await fetch("http://localhost:5001/api/admin/carousel", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        artistId: artist.id,
        name: artist.name,
        image: artist.images?.[0]?.url
      })
    });

    fetchCarousel();
  };

  const removeFromCarousel = async (id) => {
    await fetch(`http://localhost:5001/api/admin/carousel/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    fetchCarousel();
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("http://localhost:5001/api/admin/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await fetch("http://localhost:5001/api/admin/reviews", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      setReviews(data);
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await fetch(`http://localhost:5001/api/admin/users/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUsers(users.filter((u) => u._id !== id));
    } catch (err) {
      console.error("Failed to delete user:", err);
    }
  };

  const deleteReview = async (id) => {
    if (!window.confirm("Delete this review?")) return;

    try {
      await fetch(`http://localhost:5001/api/admin/reviews/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setReviews(reviews.filter((r) => r._id !== id));
    } catch (err) {
      console.error("Failed to delete review:", err);
    }
  };

  useEffect(() => {
    async function loadData() {
      await Promise.all([fetchUsers(), fetchReviews(), fetchCarousel()]);
      setLoading(false);
    }

    loadData();
  }, []);

  if (loading) return <h2 className="admin-loading">Loading admin dashboard...</h2>;

  return (
    <div className="admin-container">
      <h1 className="admin-title">Admin Dashboard</h1>

      <button
        onClick={() => navigate("/")}
        className="admin-back-button"
      >
        Back to Dashboard
      </button>

      {/* USERS */}
      <section className="admin-section">
        <h2>All Users</h2>

        {users.length === 0 ? (
          <p>No users found.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => (
                <tr key={user._id}>
                  <td>{user.username}</td>
                  <td>{user.role}</td>
                  <td>
                    <button
                      onClick={() => deleteUser(user._id)}
                      className="admin-delete-button"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* REVIEWS */}
      <section className="admin-section">
        <h2>All Reviews</h2>

        {reviews.length === 0 ? (
          <p>No reviews found.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Concert</th>
                <th>Rating</th>
                <th>Comment</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {reviews.map((review) => (
                <tr key={review._id}>
                  <td>{review.username || "Unknown"}</td>
                  <td>{review.concertName || review.concertId}</td>
                  <td>{review.rating}</td>
                  <td>{review.comment}</td>
                  <td>
                    <button
                      onClick={() => deleteReview(review._id)}
                      className="admin-delete-button"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* CAROUSEL MANAGEMENT */}
      <section className="admin-section">
        <h2>Manage Carousel</h2>

        {/* 🔍 SEARCH */}
        <input
          type="text"
          placeholder="Search artist..."
          onChange={(e) => searchArtist(e.target.value)}
          className="admin-search-input"
        />

        {/* SEARCH RESULTS */}
        <div className="admin-search-results">
          {searchResults.map((artist) => (
            <div key={artist.id} className="admin-artist-card">
              <img
                src={artist.images?.[0]?.url}
                alt={artist.name}
                width="50"
              />
              <span>{artist.name}</span>
              <button onClick={() => addToCarousel(artist)}>
                Add
              </button>
            </div>
          ))}
        </div>

        {/* CURRENT CAROUSEL */}
        <h3>Current Carousel Artists</h3>

        <div className="admin-carousel-list">
          {carouselArtists.map((artist) => (
            <div key={artist._id} className="admin-artist-card">
              {artist.image && (
                <img src={artist.image} alt={artist.name} width="50" />
              )}
              <span>{artist.name}</span>
              <button
                onClick={() => removeFromCarousel(artist._id)}
                className="admin-delete-button"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default AdminDashboard;