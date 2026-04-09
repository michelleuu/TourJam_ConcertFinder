import UserAvatar from "./UserAvatar";

// Component for writing and submitting a new review
function AddReviewCard({
  concert,
  user,
  navigate,
  reviewOpen,
  setReviewOpen,
  rating,
  setRating,
  comment,
  setComment,
  submitReview,
  submittingReview,
}) {
  return (
    <div className={`add-review-card ${reviewOpen ? "open" : ""}`}>
      <button
        type="button"
        className="add-review-toggle"
        onClick={() => setReviewOpen((prev) => !prev)}
      >
        <div>
          <p className="add-review-kicker">Add a review to</p>
          <h3>{concert.name}</h3>
        </div>
        <span className={`chevron ${reviewOpen ? "up" : "down"}`} />
      </button>

      <div className="add-review-content">
        {user ? (
          <form onSubmit={submitReview} className="inline-review-form">
            <div className="review-user-row">
              <UserAvatar
                user={user}
                className="review-avatar-image"
                fallbackClassName="review-avatar"
                alt={user?.username}
              />

              <p>
                Posting public review as <br />
                {user?.username}
              </p>
            </div>

            <div className="inline-field">
              <label>My rating:</label>
              <div className="star-picker">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`star-button ${rating >= star ? "active" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setRating(star);
                    }}
                    aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                  >
                    {rating >= star ? "★" : "☆"}
                  </button>
                ))}
              </div>
            </div>

            <div className="inline-field">
              <label htmlFor="review-comment">Write a review:</label>
              <textarea
                id="review-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder=""
              />
            </div>

            <div className="inline-review-actions">
              <button
                type="button"
                className="cancel-review-btn"
                onClick={() => {
                  setReviewOpen(false);
                  setRating(0);
                  setComment("");
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="submit-review-btn"
                disabled={submittingReview}
              >
                {submittingReview ? "Posting..." : "Post Review"}
              </button>
            </div>
          </form>
        ) : (
          <div className="review-login-box">
            <p>Log in to post a review.</p>
            <button
              className="submit-review-btn"
              onClick={() => navigate("/login")}
            >
              Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AddReviewCard;
