import { useContext, useEffect, useState } from "react";
import "./App.css";
import { AuthContext } from "./context/AuthContext"; // import the global "cloud" to access our token and user

function Dashboard() {
  // local State: managing the data strictly on this specific page
  const [plants, setPlants] = useState([]); // holds the array of plants from the database
  const [formData, setFormData] = useState({
    // holds the current text typed into the form
    commonName: "",
    family: "",
    category: "",
    origin: "",
    climate: "",
    imgUrl: "",
  });

  // tap into our AuthContext
  // we grab the token, the decoded user object (for the greeting),
  // and the logout function (to attach to our button)
  const { token, user, logout } = useContext(AuthContext);

  // initial data load: runs once when the Dashboard first appears on the screen
  useEffect(() => {
    // GET is a public route on our backend, so we DO NOT need to attach the token here
    // anyone can view the plants.
    fetch("http://localhost:5001/api/plants")
      .then((res) => res.json())
      .then((data) => setPlants(data))
      .catch((err) => console.error("Error fetching plants:", err));
  }, []); // empty array ensures this only happens once on mount

  // helper function for the Controlled Form
  // Updates the specific field in our formData state based on the input's 'name' attribute
  function handleChange(e) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  }

  // creating data: protected POST request
  async function handleSubmit(e) {
    e.preventDefault(); // stop the page from refreshing

    try {
      const response = await fetch("http://localhost:5001/api/plants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // attach the token to prove user is authorized
          Authorization: token,
        },
        body: JSON.stringify(formData), // send the form data to the server
      });

      // basic error handling if the token is invalid/missing or the server rejects
      if (!response.ok) {
        throw new Error("Failed to add plant. Are you authorized?");
      }

      // if successful, the server sends back the newly created plant (including its new MongoDB _id)
      const newPlant = await response.json();

      // update our local React state to include the new plant instantly without refreshing the page
      setPlants([...plants, newPlant]);

      // clear the form fields
      setFormData({
        commonName: "",
        family: "",
        category: "",
        origin: "",
        climate: "",
        imgUrl: "",
      });
    } catch (err) {
      console.error(err);
      alert(err.message); // show the error to the user
    }
  }

  // deleting data: protected DELETE request
  const handleDelete = async (id) => {
    try {
      const response = await fetch(`http://localhost:5001/api/plants/${id}`, {
        method: "DELETE",
        headers: {
          // attach the token to prove user is authorized - again
          Authorization: token,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete. Are you authorized?");
      }

      // if the backend successfully deleted it, remove it from our local React state
      // this filters out the deleted plant so it disappears from the screen instantly
      setPlants(plants.filter((plant) => plant._id !== id));
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  return (
    <div className="page-container">
      <header
        className="main-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>Plant Collection Dashboard</h1>
          {/* conditional rendering: only show the welcome message if the user object successfully loaded */}
          {user && (
            <h3 style={{ color: "#2e7d32", marginTop: "5px", marginBottom: 0 }}>
              Welcome back, {user.username}!
            </h3>
          )}
        </div>

        {/* Logout button: connected directly to the global logout function from our Context */}
        <button
          onClick={logout}
          style={{
            padding: "10px 20px",
            backgroundColor: "#c62828",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Logout
        </button>
      </header>

      <div className="content-wrapper">
        <div className="left-panel">
          <div className="card form-card">
            <h3>Add New Plant</h3>
            <form onSubmit={handleSubmit} className="plant-form">
              <label>Name</label>
              {/* note: 'name' must match the keys in our formData state for handleChange to work */}
              <input
                name="commonName"
                value={formData.commonName}
                onChange={handleChange}
                required
              />

              <label>Family</label>
              <input
                name="family"
                value={formData.family}
                onChange={handleChange}
              />

              <label>Category</label>
              <input
                name="category"
                value={formData.category}
                onChange={handleChange}
              />

              <label>Origin</label>
              <input
                name="origin"
                value={formData.origin}
                onChange={handleChange}
              />

              <label>Climate</label>
              <input
                name="climate"
                value={formData.climate}
                onChange={handleChange}
              />

              <label>Image URL</label>
              <input
                name="imgUrl"
                value={formData.imgUrl}
                onChange={handleChange}
              />

              <button type="submit">Add Plant</button>
            </form>
          </div>
        </div>

        {/* right panel: the grid of plants */}
        <div className="right-panel">
          <div className="plant-grid">
            {/* array map: loop over every plant in our state array and create a card for it */}
            {plants.map((plant) => (
              // keys are required by React to keep track of list items efficiently
              <div key={plant._id} className="plant-card">
                <div className="image-container">
                  {/* conditional rendering for the image */}
                  {plant.imgUrl ? (
                    <img src={plant.imgUrl} alt={plant.commonName} />
                  ) : (
                    <div className="placeholder">No Image</div>
                  )}
                </div>
                <div className="card-details">
                  <h3>{plant.commonName}</h3>
                  <p>
                    <strong>Family:</strong> {plant.family}
                  </p>
                  <p>
                    <strong>Origin:</strong> {plant.origin}
                  </p>
                  <p>
                    <strong>Climate:</strong> {plant.climate}
                  </p>
                  {/* connect the delete button to our handleDelete function, passing the specific plant's ID */}
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(plant._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
