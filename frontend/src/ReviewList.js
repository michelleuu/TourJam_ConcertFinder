import UserAvatar from "./UserAvatar";
import exitBtn from "./assets/exit-btn.svg";

// Component for showing all reviews, including edit and delete actions in the ConcertDetails page
function ReviewList({
  reviews,
  currentUserId,
  editingReviewId,
  setEditingReviewId,
  editRating,
  setEditRating,
  editComment,
  setEditComment,
  handleDelete,
  handleUpdate,
  timeAgo,
}) {
  if (reviews.length === 0) {
    return <p className="no-reviews">No reviews yet.</p>;
  }

  return (
    <div className="reviews-list">
      {reviews.map((review) => {
        const ownerId =
          typeof review.userId === "object"
            ? review.userId?._id?.toString()
            : review.userId?.toString();

        const canDelete = currentUserId && ownerId === currentUserId;
        const canEdit = currentUserId && ownerId === currentUserId;
        const isEditing = editingReviewId === review._id;

        return (
          <div className="review-item" key={review._id}>
            <div className="concert-detail-review-card">
              <div className="review-user-row">
                <UserAvatar
                  user={{
                    username:
                      typeof review.userId === "object"
                        ? review.userId?.username
                        : review.username,
                    profileImage:
                      typeof review.userId === "object"
                        ? review.userId?.profileImage
                        : review.profileImage || null,
                  }}
                  className="review-avatar-image"
                  fallbackClassName="review-avatar"
                  alt={review.userId?.username || review.username}
                />
                <h4>{review.userId?.username || review.username}</h4>
              </div>

              {!isEditing && (
                <div className="review-stars-time">
                  <span className="review-stars">
                    {"★".repeat(Number(review.rating || 0))}
                    {"☆".repeat(5 - Number(review.rating || 0))}
                  </span>
                  <span className="review-time">
                    {timeAgo(review.createdAt)}
                  </span>
                </div>
              )}

              {isEditing ? (
                <>
                  <div className="star-picker">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={`star-button ${editRating >= star ? "active" : ""}`}
                        onClick={() => setEditRating(star)}
                      >
                        {editRating >= star ? "★" : "☆"}
                      </button>
                    ))}
                  </div>

                  <textarea
                    className="edit-review-textarea"
                    value={editComment}
                    onChange={(e) => setEditComment(e.target.value)}
                  />

                  <div className="edit-review-actions">
                    <button
                      className="detail-save-review-btn"
                      onClick={() => handleUpdate(review._id)}
                    >
                      Save
                    </button>

                    <button
                      className="cancel-review-btn"
                      onClick={() => setEditingReviewId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="review-comment">{review.comment}</p>

                  {canDelete && (
                    <button
                      className="detail-delete-review-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(review._id);
                      }}
                    >
                      <img src={exitBtn} alt="delete review" />
                    </button>
                  )}

                  {canEdit && (
                    <button
                      className="detail-edit-review-btn "
                      onClick={() => {
                        setEditingReviewId(review._id);
                        setEditRating(review.rating);
                        setEditComment(review.comment);
                      }}
                    >
                      Edit
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default ReviewList;
