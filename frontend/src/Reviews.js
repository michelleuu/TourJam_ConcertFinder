import React, { useEffect, useState, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { AuthContext } from "./context/AuthContext";

function Reviews() {

  const { concertId } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    fetch(`http://localhost:5001/api/reviews/${concertId}`)
      .then(res => res.json())
      .then(data => setReviews(data))
      .catch(err => console.error("Error fetching reviews:", err));
  }, [concertId]);

  return (
    <div>

      <button onClick={() => navigate("/")}>
        ← Back to Dashboard
      </button>

      <h2>Concert Reviews</h2>

      {user ? (
        <Link to={`/write-review/${concertId}`}>
          <button>Write a Review</button>
        </Link>
      ) : (
        <p>
          <Link to="/login">Log in</Link> or{" "}
          <Link to="/register">Register</Link> to write reviews
        </p>
      )}

      <hr />

      {reviews.length === 0 && <p>No reviews yet</p>}

      {reviews.map(review => (
        <div key={review._id}>
          <h4>{review.username}</h4>
          <p>Rating: {review.rating}/5</p>
          <p>{review.comment}</p>
          <hr />
        </div>
      ))}

    </div>
  );
}

export default Reviews;