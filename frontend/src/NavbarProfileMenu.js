import { useContext } from "react";
import { AuthContext } from "./context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./navbarProfile.css";
import UserAvatar from "./UserAvatar";

function NavbarProfileMenu() {
  const { user, logout, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  // while auth is still loading, don't render the profile menu yet
  if (loading) return null;

  // if no logged-in user, don't show the profile menu
  if (!user) return null;

  const isAdmin = user.role === "admin";

  return (
    <div className="nav-profile-wrapper">
      <button
        type="button"
        className="nav-profile-trigger"
        onClick={() => navigate("/profile")}
      >
        <UserAvatar
          user={user}
          className="nav-profile-avatar"
          fallbackClassName="nav-profile-avatar-fallback"
          alt={user.username}
        />

        <div className="nav-profile-text">
          {isAdmin ? (
            <>
              <div className="nav-profile-name">{user.username}</div>
              <span className="nav-role-badge">Admin</span>
            </>
          ) : (
            <div className="nav-profile-name">
              Hello, <br />
              {user.username}!
            </div>
          )}
        </div>

        <div className="nav-profile-arrow"></div>
      </button>

      <div className="nav-profile-dropdown">
        <div className="nav-profile-card">
          <UserAvatar
            user={user}
            className="dropdown-avatar"
            fallbackClassName="dropdown-avatar-fallback"
            alt={user.username}
          />

          <div className="dropdown-user-info">
            <h3>{user.username}</h3>

            {isAdmin ? (
              <div className="dropdown-sub-row">
                <span className="nav-role-badge">Admin</span>
              </div>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          className="dropdown-item"
          onClick={() => navigate("/profile")}
        >
          View Profile
        </button>

        {isAdmin && (
          <button
            type="button"
            className="dropdown-item admin-item"
            onClick={() => navigate("/admin")}
          >
            Switch to Admin Dashboard
          </button>
        )}

        <button
          type="button"
          className="dropdown-item"
          onClick={() => {
            logout();
            navigate("/login");
          }}
        >
          Log out
        </button>
      </div>
    </div>
  );
}

export default NavbarProfileMenu;
