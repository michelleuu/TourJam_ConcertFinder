import { useContext, useEffect, useRef, useState } from "react";
import "./App.css";
import { AuthContext } from "./context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import logo from "./assets/logo.svg";
import { LuSearch } from "react-icons/lu";

function Dashboard() {
  // Destructure and retreive the token that was stored in the AuthContext
  const { token, user, logout } = useContext(AuthContext);

  const navigate = useNavigate();

  // State to hold fetched concerts from ticketmaster api
  const [concerts, setConcerts] = useState([]);
  const [recommendedConcerts, setRecommendedConcerts] = useState([]);

  // States to hold user data from database
  /* Todo: get request and get user's location to set the default city */
  const [city, setCity] = useState("Vancouver"); // Default city is vancouver
  const [genres, setGenres] = useState([]); // State to hold the selected genres from User database
  const [username, setUsername] = useState("");

  const [featuredConcerts, setFeaturedConcerts] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const activeConcert = featuredConcerts[currentSlide];
  const autoScrollRef = useRef(null);

  function formatConcertDate(dateStr, timeStr) {
    if (!dateStr) return "";

    // Combine date and time
    const dateTime = timeStr ? `${dateStr}T${timeStr}` : dateStr;

    const date = new Date(dateTime);

    // Format date
    const options = {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    };

    return date.toLocaleString("en-US", options); // e.g., Fri, Feb 5, 2027, 9:00 PM
  }

  function getBestImage(images) {
    if (!Array.isArray(images) || images.length === 0) return "";

    const sorted = [...images].sort((a, b) => {
      const areaA = (a.width || 0) * (a.height || 0);
      const areaB = (b.width || 0) * (b.height || 0);
      return areaB - areaA;
    });

    return sorted[0]?.url || "";
  }

  function startAutoScroll() {
    if (autoScrollRef.current) {
      clearInterval(autoScrollRef.current);
    }

    if (featuredConcerts.length <= 1) return;

    autoScrollRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % featuredConcerts.length);
    }, 5000);
  }

  function resetAutoScroll() {
    startAutoScroll();
  }

  // fetch the dashboard carousel concerts
  useEffect(() => {
    async function fetchFeaturedConcerts() {
      try {
        const response = await fetch(
          "http://localhost:5001/api/concerts/featured",
        );

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();
        setFeaturedConcerts(data.concerts || []);
      } catch (err) {
        console.error("Failed to fetch featured concerts:", err.message);
      }
    }

    fetchFeaturedConcerts();
  }, []);

  // auto slide animation for the carousel
  useEffect(() => {
    startAutoScroll();

    return () => {
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current);
      }
    };
  }, [featuredConcerts]);

  function goToPrevSlide() {
    setCurrentSlide((prev) =>
      prev === 0 ? featuredConcerts.length - 1 : prev - 1,
    );
    resetAutoScroll();
  }

  function goToNextSlide() {
    setCurrentSlide((prev) => (prev + 1) % featuredConcerts.length);
    resetAutoScroll();
  }

  // Ticketmaster api - Fetch concerts by selected city
  useEffect(() => {
    async function fetchConcerts() {
      try {
        const response = await fetch(
          `http://localhost:5001/api/concerts?location=${encodeURIComponent(city)}`,
        );

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();
        setConcerts(data.concerts || []);
      } catch (err) {
        console.error("Failed to fetch concerts:", err.message);
      }
    }

    fetchConcerts();
  }, [city]); // Fetch again if user changes the city

  // Ticketmaster api - Fetch concerts by the genre to get recomended concerts
  useEffect(() => {
    if (!token) return;

    async function fetchRecommended() {
      try {
        const res = await fetch(
          "http://localhost:5001/api/concerts/recommended",
          {
            headers: {
              Authorization: token,
            },
          },
        );

        const data = await res.json();
        setRecommendedConcerts(data);
      } catch (err) {
        console.error("Failed to fetch recommendations", err);
      }
    }

    fetchRecommended();
  }, [token]);

  /* 
  Fetch genres from data base and store it into the genre state to display so it 
  can be used to display which genres the user saved.
  I.e. Your Preferred Genres: Rock, Hip Hop. Since you love Rock, Hip Hop.
  */
  useEffect(() => {
    if (!token) return;

    async function fetchProfile() {
      try {
        const res = await fetch("http://localhost:5001/api/profile", {
          headers: { Authorization: token },
        });
        const data = await res.json();
        setUsername(data.username || "");
        setGenres(data.preferredGenres || []);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    }

    fetchProfile();
  }, [token]);

  return (
    <div>
      <header className="main-header">
        <nav className="nav-bar">
          {/* Logo as a clickable link to dashboard */}
          <div className="main-nav">
            <img
              src={logo}
              alt="TourJam logo"
              className="logo"
              onClick={() => navigate("/")}
              style={{ cursor: "pointer" }}
            />
            <button onClick={() => navigate("/browse")} className="nav-button">
              Browse
            </button>
          </div>
          <div className="nav-links">
            {token ? (
              <>
                <button onClick={logout} className="nav-button">
                  Logout
                </button>
                <button
                  onClick={() => navigate("/profile")}
                  className="nav-button"
                >
                  My Profile
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate("/login")}
                  className="nav-button"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate("/register")}
                  className="nav-signup-button"
                >
                  Sign up
                </button>
              </>
            )}
          </div>
        </nav>
        {activeConcert ? (
          <div className="dashboard-carousel">
            {getBestImage(activeConcert.images) && (
              <img
                src={getBestImage(activeConcert.images)}
                alt={activeConcert.name}
                className="dashboard-carousel-image"
              />
            )}

            <div className="dashboard-carousel-overlay" />

            <button
              className="carousel-arrow carousel-arrow-left"
              onClick={goToPrevSlide}
              aria-label="Previous slide"
            >
              ❮
            </button>

            <button
              className="carousel-arrow carousel-arrow-right"
              onClick={goToNextSlide}
              aria-label="Next slide"
            >
              ❯
            </button>

            <div className="dashboard-carousel-content">
              <p className="dashboard-carousel-subtitle">
                {activeConcert?._embedded?.attractions?.[0]?.name ||
                  "Featured Concert"}
                {activeConcert?.classifications?.[0]?.genre?.name && (
                  <> • {activeConcert.classifications[0].genre.name}</>
                )}
              </p>
              <h1 className="dashboard-carousel-title">{activeConcert.name}</h1>

              <Link
                to={`/concert/${activeConcert.id}`}
                className="dashboard-carousel-button"
              >
                View Details
              </Link>
            </div>

            <div className="dashboard-carousel-dots">
              {featuredConcerts.map((_, index) => (
                <button
                  key={index}
                  className={`carousel-dot ${index === currentSlide ? "active" : ""}`}
                  onClick={() => {
                    setCurrentSlide(index);
                    resetAutoScroll();
                  }}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="header-context">
            {user && <h1>Welcome back, {username}!</h1>}
            {user && genres.length > 0 && (
              <p>Your Preferred Genres: {genres.join(", ")}</p>
            )}
          </div>
        )}
      </header>

      <div className="page-container">
        <section id="upcoming-concerts">
          <div>
            <h2>Upcoming Concerts in {city}</h2>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              style={{ padding: ".25rem" }}
            >
              <option value="Vancouver">Vancouver</option>
              <option value="Toronto">Toronto</option>
              <option value="Montreal">Montreal</option>
              <option value="Calgary">Calgary</option>
              <option value="Edmonton">Edmonton</option>
              <option value="Ottawa">Ottawa</option>
            </select>
          </div>
          <div className="concerts-grid">
            {concerts.length > 0 ? (
              concerts.map((concert) => (
                <Link
                  key={concert.id}
                  to={`/concert/${concert.id}`}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div className="concert-card">
                    {getBestImage(concert.images) && (
                      <div className="image-container">
                        <img
                          src={getBestImage(concert.images)}
                          alt={concert.name}
                        />
                      </div>
                    )}
                    <h3>{concert.name}</h3>
                    <p>
                      <strong>Date:</strong>{" "}
                      {formatConcertDate(
                        concert.dates.start.localDate,
                        concert.dates.start.localTime,
                      )}
                    </p>
                    <p>
                      <strong>Venue:</strong> {concert._embedded.venues[0].name}
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              <p>No concerts found.</p>
            )}
          </div>
        </section>

        {token && (
          <>
            <h2>Since you love {genres.join(", ")}</h2>
            <div className="concerts-grid">
              {recommendedConcerts.length > 0 ? (
                recommendedConcerts.map((concert) => (
                  <Link
                    key={concert.id}
                    to={`/concert/${concert.id}`}
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <div className="concert-card">
                      {getBestImage(concert.images) && (
                        <div className="image-container">
                          <img
                            src={getBestImage(concert.images)}
                            alt={concert.name}
                          />
                        </div>
                      )}
                      <h3>{concert.name}</h3>
                      <p>
                        <strong>Date:</strong>{" "}
                        {formatConcertDate(
                          concert.dates.start.localDate,
                          concert.dates.start.localTime,
                        )}
                      </p>
                      <p>
                        <strong>Venue:</strong>{" "}
                        {concert._embedded.venues[0].name}
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <p>No recommendations yet.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
