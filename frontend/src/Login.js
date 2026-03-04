// import necessary hooks
// 'useState' handles what the user types, 'useContext' lets us talk to our global AuthContext
import { useContext, useState } from "react";

// import routing tools. 'Link' is for clickable text, 'useNavigate' allows us to force a redirect in code
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "./context/AuthContext";

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
    <div
      style={{
        padding: "50px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <h2 style={{ color: "#1b5e20", marginBottom: "20px" }}>
        Login to Plant Dashboard
      </h2>

      <form
        onSubmit={handleLogin}
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          maxWidth: "320px",
          gap: "15px",
        }}
      >
        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{
            padding: "12px",
            fontSize: "1.1rem",
            borderRadius: "4px",
            border: "1px solid #ccc",
          }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            padding: "12px",
            fontSize: "1.1rem",
            borderRadius: "4px",
            border: "1px solid #ccc",
          }}
        />

        <button
          type="submit"
          style={{
            padding: "12px",
            fontSize: "1.1rem",
            backgroundColor: "#2e7d32",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Login
        </button>
      </form>

      {/* React Router Link: We use <Link> instead of a standard HTML <a> tag. 
          An <a> tag forces the browser to download the whole app again. <Link> just swaps the components instantly. */}
      <p style={{ marginTop: "20px" }}>
        Don't have an account?{" "}
        <Link to="/register" style={{ color: "#2e7d32", fontWeight: "bold" }}>
          Register here
        </Link>
      </p>
    </div>
  );
}

export default Login;
