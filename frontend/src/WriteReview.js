import React, { useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "./context/AuthContext";

function WriteReview() {

  const { concertId } = useParams();
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const submitReview = async (e) => {

    e.preventDefault();

    try {

      await fetch("http://localhost:5001/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          concertId,
          rating,
          comment,
          username: user.username
        })
      });

      navigate(`/reviews/${concertId}`);

    } catch (err) {
      console.error("Failed to submit review:", err);
    }
  };

  return (
    <div>

      <h2>Write Review</h2>

      <form onSubmit={submitReview}>

        <label>Rating</label>
        <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5</option>
        </select>

        <br /><br />

        <label>Comment</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        <br /><br />

        <button type="submit">Submit Review</button>

      </form>

    </div>
  );
}

export default WriteReview;