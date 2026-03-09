import React, { useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "./context/AuthContext";
import "./writeReview.css";

function WriteReview() {

  const { concertId } = useParams();
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const submitReview = async (e) => {

    e.preventDefault();

    console.log("Submitting review...");
    console.log("Token:", token);
    console.log("User:", user);

    try {

      const response = await fetch("http://localhost:5001/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          concertId,
          rating: Number(rating),
          comment,
          username: user.username
        })
      });

      const data = await response.json();

      console.log("Server response:", data);

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit review");
      }

      navigate(`/reviews/${concertId}`);

    } catch (error) {
      console.error("Review submission error:", error);
    }
  };

  return (
    <div className="write-review-bg">
      <div className="write-review-container">

        <h2>Write Review</h2>

        <form onSubmit={submitReview}>

          <label>Rating</label>
          <select
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
            <option value={4}>4</option>
            <option value={5}>5</option>
          </select>

          <label>Comment</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />

          <button type="submit">Submit Review</button>

        </form>

      </div>
    </div>
  );
}

export default WriteReview;