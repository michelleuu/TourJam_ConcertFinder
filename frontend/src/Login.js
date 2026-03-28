// import necessary hooks
// 'useState' handles what the user types, 'useContext' lets us talk to our global AuthContext
import { useContext, useState } from "react";

// import routing tools. 'Link' is for clickable text, 'useNavigate' allows us to force a redirect in code
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "./context/AuthContext";
import "./Login.css";

function Login() {
  // local State: we need to keep track of exactly what the user is typing into the inputs
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // we grab the 'login' function from our AuthContext
  // we will call this function ONLY IF the backend says the password is correct
  const { login } = useContext(AuthContext);

  // initialize the navigator so we can send the user to the Dashboard after they log in
  const navigate = useNavigate();

  // the Submit Handler: This runs when the user clicks the "Login" button.
  async function handleLogin(e) {
    e.preventDefault(); // prevents the browser from refreshing the page (the default HTML form behavior)

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
        {/*left catchphrase with imagee*/}
      <div className="login-left-card">
        <h1>Find concerts, follow artists and share the moment</h1>
      </div>

      {/*right login form */}
      <div className="login-right-form">
        <h2> Welcome Back! </h2>
        <p>Enter Username & Password to continue</p>

        <form onSubmit={handleLogin}>
          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit" > Login </button>
        </form>
      
      {/* React Router Link: We use <Link> instead of a standard HTML <a> tag. 
          An <a> tag forces the browser to download the whole app again. <Link> just swaps the components instantly. */}
      <p className="register-text"> Don't have an account?{" "}
        <Link to="/register"> Register here </Link>
      </p>
      </div>
      </div>
      
    </div>
  );
}

export default Login;
