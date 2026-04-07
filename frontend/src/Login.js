// import necessary hooks
// 'useState' handles what the user types, 'useContext' lets us talk to our global AuthContext
import { useContext, useState } from "react";

// import routing tools. 'Link' is for clickable text, 'useNavigate' allows us to force a redirect in code
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "./context/AuthContext";
import "./Login.css";
import logoImg from "./assets/logo-purple.svg";

function Login() {
  // local State: we need to keep track of exactly what the user is typing into the inputs
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  //check if user has put all the fields and sends popup message
  const [errors, setErrors] = useState({});

  // we grab the 'login' function from our AuthContext
  // we will call this function ONLY IF the backend says the password is correct
  const { login } = useContext(AuthContext);

  // initialize the navigator so we can send the user to the Dashboard after they log in
  const navigate = useNavigate();

  // the Submit Handler: This runs when the user clicks the "Login" button.
  async function handleLogin(e) {
    e.preventDefault(); // prevents the browser from refreshing the page (the default HTML form behavior)

    const newErrors = {};

    if (!username) {
      newErrors.username = "Username is required";
    }

    if (!password) {
      newErrors.password = "Password is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    try {
      // send the username and password to our secure Express backend
      const res = await fetch("http://localhost:5001/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      // the Success path
      if (res.ok) {
        // we pass the new token to our Context. The Context saves it to localStorage
        // and updates the whole app so Navbar/Dashboard knows user is logged in
        login(data.token);

        // instantly redirect the user to the Dashboard page
        navigate("/");
      } else {
        // the Error Path (e.g., wrong password, user not found)
        alert(data.message || "Login failed");
      }
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="login-bg">
      {/*overall page with rounded circle */}
      <div className="login-page">
      
      {/*left catchphrase with image*/}
      <div className="login-left-card">
        <div className="overlay"></div>
        <div className ="left-content">
          <Link to="/">
            <img src={logoImg} alt="TourJam Logo in Purple" className="tourjam-logo" />
          </Link>
          <h1>Find concerts, <br />
          follow artists, <br />
          and share the moment
          </h1>
        </div>
      </div>

      {/*right login form */}
      <div className="login-right-form">
        <h1> Welcome Back! </h1>
        <h2>Enter Username & Password to continue</h2>

        <form onSubmit={handleLogin}>
          <div className ="input-group">
            <input
              id="username"
              type="text"
              placeholder=" "
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setErrors({ ...errors, username: "" });
              }}
            />
            <label> Username</label>
            {errors.username && (
              <span className="error-tooltip">!! Please enter username</span>
            )}
          </div>

          <div className ="input-group">
            <input
              id="password"
              type="password"
              placeholder=" "
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors({ ...errors, password: "" });
              }}
            />
            <label> Password</label>
            {errors.password && (
              <span className="error-tooltip">!! Password is Required</span>
            )}
          </div>

          <div className="bottom-row">
              <p className="register-text">
                Don’t have an account?{" "}<Link to="/register">Register here</Link>
              </p>

              <button type="submit">Login</button>
          </div>
        </form>
      </div>
      </div>
      
    </div>
  );
}

export default Login;