import { useContext } from "react";
import { AuthContext } from "./context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./navbarProfile.css";

function NavbarProfileMenu() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  if (!user) return null;

  const isAdmin = user.role === "admin";

  return (
    <div className="nav-profile-wrapper">
      <button
        className="nav-profile-trigger"
        onClick={() => navigate("/profile")}
      >
        {user.profileImage ? (
          <img
            src={user.profileImage}
            alt={user.username}
            className="nav-profile-avatar"
          />
        ) : (
          <div className="nav-profile-avatar-fallback">
            {user.username?.[0]?.toUpperCase() || "U"}
          </div>
        )}

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
          {user.profileImage ? (
            <img
              src={user.profileImage}
              alt={user.username}
              className="dropdown-avatar"
            />
          ) : (
            <div className="dropdown-avatar-fallback">
              {user.username?.[0]?.toUpperCase() || "U"}
            </div>
          )}

          <div className="dropdown-user-info">
            <h3>{user.username}</h3>

            {isAdmin ? (
              <div className="dropdown-sub-row">
                <span className="nav-role-badge">Admin</span>
              </div>
            ) : null}
          </div>
        </div>

        <button className="dropdown-item" onClick={() => navigate("/profile")}>
          View Profile
        </button>

        {isAdmin && (
          <button
            className="dropdown-item admin-item"
            onClick={() => navigate("/admin")}
          >
            Switch to Admin Dashboard
          </button>
        )}

        <button className="dropdown-item" onClick={() => logout()}>
          Log out
        </button>
      </div>
    </div>
  );
}

export default NavbarProfileMenu;
