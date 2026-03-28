import React, { useEffect, useState, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { AuthContext } from "./context/AuthContext";
import "./reviews.css";

function Reviews() {

  const { concertId } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const currentUserId = user?.id?.toString();


  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    fetch(`http://localhost:5001/api/reviews/${concertId}`)
      .then(res => res.json())
      .then(data => {
        setReviews(data);
      })
      .catch(err => console.error("Error fetching reviews:", err));
  }, [concertId]);

  const handleDelete = async (reviewId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this review?");
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`http://localhost:5001/api/reviews/${reviewId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error("Failed to delete review");
      }

      setReviews(reviews.filter(r => r._id !== reviewId));

    } catch (error) {
      console.error("Error deleting review:", error);
    }
  };

  return (
    <div className="reviews-bg">
      <div className="reviews-container">

        <button className="back-btn" onClick={() => navigate("/")}>
          ← Back to Dashboard
        </button>

        <h2>Concert Reviews</h2>

        {user ? (
          <Link to={`/write-review/${concertId}`}>
            <button>Write a Review</button>
          </Link>
        ) : (
          <p className="review-login-msg">
            <Link to="/login">Log in</Link> or{" "}
            <Link to="/register">Register</Link> to write reviews
          </p>
        )}

        {reviews.length === 0 && <p>No reviews yet</p>}

        {reviews.map(review => {

          const ownerId = review.userId?.toString();
          const userId = currentUserId;

          return (
            <div className="review-card" key={review._id}>
              <h4>{review.username}</h4>
              <p className="review-rating">Rating: {review.rating}/5</p>
              <p className="review-comment">{review.comment}</p>

              {userId && ownerId === userId && (
                <button
                  className="delete-btn"
                  onClick={() => handleDelete(review._id)}
                >
                  Delete
                </button>
              )}
            </div>
          );
        })}

      </div>
    </div>
  );
}

export default Reviews;