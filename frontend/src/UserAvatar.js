// Component for display user profile image
function UserAvatar({ user, className = "", fallbackClassName = "", alt }) {
  const imageSrc = user?.profileImage || "";
  const displayName = user?.username || "User";
  const fallbackLetter = displayName?.[0]?.toUpperCase() || "U";

  return imageSrc ? (
    <img src={imageSrc} alt={alt || displayName} className={className} />
  ) : (
    <div className={fallbackClassName}>{fallbackLetter}</div>
  );
}

export default UserAvatar;
