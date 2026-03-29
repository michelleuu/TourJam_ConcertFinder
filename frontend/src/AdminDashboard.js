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
      await Promise.all([fetchUsers(), fetchReviews()]);
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
    </div>
  );
}

export default AdminDashboard;