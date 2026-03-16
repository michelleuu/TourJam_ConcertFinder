import { useCallback, useContext, useEffect, useRef, useState } from "react";
import "./App.css";
import { AuthContext } from "./context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import logo from "./assets/logo.svg";

// Reference for embla carousel library (examples): https://www.embla-carousel.com/docs/examples/predefined
// Reference for implementing embla carousel library: https://codesandbox.io/p/sandbox/embla-carousel-arrows-and-dots-react-xccd7
import useEmblaCarousel from "embla-carousel-react";

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
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
  });

  const autoSlideRef = useRef(null);

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

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  const startAutoSlide = useCallback(() => {
    if (autoSlideRef.current) {
      clearInterval(autoSlideRef.current);
    }

    if (!emblaApi || featuredConcerts.length <= 1) return;

    autoSlideRef.current = setInterval(() => {
      emblaApi.scrollNext();
    }, 5000);
  }, [emblaApi, featuredConcerts.length]);

  const resetAutoSlide = useCallback(() => {
    startAutoSlide();
  }, [startAutoSlide]);

  useEffect(() => {
    if (!emblaApi) return;

    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);

    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  useEffect(() => {
    startAutoSlide();

    return () => {
      if (autoSlideRef.current) {
        clearInterval(autoSlideRef.current);
      }
    };
  }, [startAutoSlide]);

  const goToPrevSlide = useCallback(() => {
    if (!emblaApi) return;
    emblaApi.scrollPrev();
    resetAutoSlide();
  }, [emblaApi, resetAutoSlide]);

  const goToNextSlide = useCallback(() => {
    if (!emblaApi) return;
    emblaApi.scrollNext();
    resetAutoSlide();
  }, [emblaApi, resetAutoSlide]);

  const goToSlide = useCallback(
    (index) => {
      if (!emblaApi) return;
      emblaApi.scrollTo(index);
      resetAutoSlide();
    },
    [emblaApi, resetAutoSlide],
  );

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
  }, [city]);

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

        {featuredConcerts.length > 0 ? (
          <div className="dashboard-carousel">
            <div className="embla" ref={emblaRef}>
              <div className="embla__container">
                {featuredConcerts.map((concert) => (
                  <div className="embla__slide" key={concert.id}>
                    {getBestImage(concert.images) && (
                      <img
                        src={getBestImage(concert.images)}
                        alt={concert.name}
                        className="dashboard-carousel-image"
                      />
                    )}

                    <div className="dashboard-carousel-overlay" />

                    <div className="dashboard-carousel-content">
                      <p className="dashboard-carousel-subtitle">
                        {concert?._embedded?.attractions?.[0]?.name ||
                          "Featured Concert"}
                        {concert?.classifications?.[0]?.genre?.name && (
                          <> • {concert.classifications[0].genre.name}</>
                        )}
                      </p>

                      <h1 className="dashboard-carousel-title">
                        {concert.name}
                      </h1>

                      <Link
                        to={`/concert/${concert.id}`}
                        className="dashboard-carousel-button"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              className="carousel-arrow carousel-arrow-left"
              onClick={goToPrevSlide}
              aria-label="Previous slide"
            >
              &#10094;
            </button>

            <button
              className="carousel-arrow carousel-arrow-right"
              onClick={goToNextSlide}
              aria-label="Next slide"
            >
              &#10095;
            </button>

            <div className="dashboard-carousel-dots">
              {featuredConcerts.map((_, index) => (
                <button
                  key={index}
                  className={`carousel-dot ${
                    index === selectedIndex ? "active" : ""
                  }`}
                  onClick={() => goToSlide(index)}
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
            <h2>Upcoming Concerts</h2>
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
