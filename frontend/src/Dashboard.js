import { useCallback, useContext, useEffect, useRef, useState } from "react";
import "./App.css";
import { AuthContext } from "./context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import logo from "./assets/logo.svg";
import NavbarProfileMenu from "./NavbarProfileMenu";

// Reference for embla carousel library (examples): https://www.embla-carousel.com/docs/examples/predefined
// Reference for implementing embla carousel library: https://codesandbox.io/p/sandbox/embla-carousel-arrows-and-dots-react-xccd7
import useEmblaCarousel from "embla-carousel-react";

//image for spotify connection tab
import spotifyImg from "./assets/spotify-banner-img.png";
import spotifyLogo from "./assets/spotify-logo.svg";

//image for genre connection setup tab
import genreImg from "./assets/genre-banner.png";

function Dashboard() {
  // Destructure and retreive the token that was stored in the AuthContext
  const { token, user } = useContext(AuthContext);

  const navigate = useNavigate();

  // State to hold fetched concerts from ticketmaster api
  const [concerts, setConcerts] = useState([]);
  const [recommendedConcerts, setRecommendedConcerts] = useState([]);

  // State to fetch Spotify Favourite Artists into Ticketmaster Concerts
  const [spotifyConcerts, setSpotifyConcerts] = useState([]);
  const [spotifyAvailable, setSpotifyAvailable] = useState(null);

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

  const fetchFeaturedConcerts = async () => {
    try {
      const response = await fetch(
        "http://localhost:5001/api/concerts/featured"
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setFeaturedConcerts(data.concerts || []);
    } catch (err) {
      console.error("Failed to fetch featured concerts:", err.message);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchFeaturedConcerts();

    // 🔁 Poll every 5 seconds
    const interval = setInterval(() => {
      fetchFeaturedConcerts();
    }, 5000);

    // 🧹 Cleanup when component unmounts
    return () => clearInterval(interval);
  }, []);

  //fetch conerts from TM API
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

  //fetch recommended concerts
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

        if (!res.ok) {
          const text = await res.text();
          console.error("Recommended concerts error:", res.status, text);
          setRecommendedConcerts([]);
          return;
        }

        const data = await res.json();
        setRecommendedConcerts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch recommendations", err);
        setRecommendedConcerts([]);
      }
    }

    fetchRecommended();
  }, [token]);

  //fetch spotify user access status
  useEffect(() => {
  if (!token) return;

  async function checkSpotifyStatus() {
    try {
      const response = await fetch(
        "http://localhost:5001/api/spotify/status",
        {
          headers: {
            Authorization: token,
          },
        }
      );

      const data = await response.json();
      setSpotifyAvailable(data.connected);
    } catch (err) {
      console.error("Spotify status check failed:", err);
    }
  }

  checkSpotifyStatus();
}, [token]);

  //fetch spotify concerts
  useEffect(() => {
    if (!token || spotifyAvailable !== true) return;

    async function fetchSpotifyConcerts() {
      try {
        const response = await fetch(
          "http://localhost:5001/api/concerts/spotify-favourites",
          {
            headers: {
              Authorization: token,
            },
          },
        );

        if (!response.ok) {
          throw new Error(`Error fetching Spotify concerts: ${response.status}`);
        }

        const data = await response.json();
        setSpotifyConcerts(data.favouriteArtists || []);
      } catch (err) {
        console.error("Failed to fetch Favourite Artists concerts:", err);
      }
    }

    fetchSpotifyConcerts();
  }, [token,spotifyAvailable]);

  //fetch profile for genre preferences
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

  //find only one nearest dates upcoming concerts from TM API
  const upcomingConcerts = concerts
    .filter(
      (concert, index, self) =>
        index === self.findIndex((c) => c.name === concert.name),
    )
    .slice(0, 5);

  //to prevent having same concerts with multiple dates - for Spotify artists
  const uniqueSpotifyConcerts = spotifyConcerts.map((artistObj) => ({
    ...artistObj,
    concerts: artistObj.concerts
      .filter((concert) => concert.dates?.start?.localDate)
      .sort(
        (a, b) =>
          new Date(a.dates.start.localDate) - new Date(b.dates.start.localDate),
      )
      .slice(0, 1),
  }));

  //connect with Spotify
  const connectSpotify = () => {
    localStorage.setItem("redirectAfterSpotify", "/profile");
    window.location.href = `http://localhost:5001/api/spotify/login?token=${token}`;
  };

  //check if spotify account is connected
  const spotifyConnected = spotifyConcerts.length > 0;

  const hasSpotify = token && spotifyConnected;
  const hasGenres = token && genres && genres.length>0;

  //Spotify concerts section depending on its token availability
  const spotifySection = hasSpotify ? (
    <div>
      <h2>From Your Favourite Artists</h2>
      <div className="concerts-grid">
        {uniqueSpotifyConcerts.length > 0 ? (
        uniqueSpotifyConcerts.map((artistObj) =>
          artistObj.concerts
            .filter((concert) => concert.id)
            .map((concert) => (
            <Link
              key={concert.id}
              to={`/concerts/${concert.id}`}
              style={{ textDecoration: "none", color: "inherit" }}>
                <div className="concert-card">
                  {getBestImage(concert.images) && (
                    <div className="image-container">
                      <img
                        src={getBestImage(concert.images)}
                        alt={concert.name}/>
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
                      {concert._embedded?.venues?.[0]?.name}
                  </p>
                </div>
            </Link>
            ))
          )
        ) : (
        <p>No Spotify concert recommendations yet.</p>
      )}
    </div>
    </div>
    ) : (
    <div className="setup-banner">
      <h2>Finish Setting Up</h2>
        <div className="spotify-setup">
          <div className="spotify-banner-img">
            <img src={spotifyImg} alt="Spotify Artists"/>
          </div>
          <div className="spotify-setup-content">
            <div className="spotify-heading">
            {/*if Spotify is not connected, it shows this*/}
              <h3> Experience more with</h3>
              <img src={spotifyLogo} alt="Spotify Logo" className="spotify-logo" />
            </div>
            <button className="spotify-connect-btn" onClick={connectSpotify}>
              Connect Spotify →
            </button>
          </div>
      </div>
    </div>
  );

  //Preferred Genre concerts section depending on its token availability
  const genreSection = hasGenres ? (
  <div>
    <h2>Since you love {genres.join(", ")}</h2>
    <div className="concerts-grid">
      {recommendedConcerts.length > 0 ? (
        recommendedConcerts.map((concert) => (
          <Link
            key={concert.id}
            to={`/concerts/${concert.id}`}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div className="concert-card">
              {getBestImage(concert.images) && (
              <div className="image-container">
                <img
                  src={getBestImage(concert.images)} alt={concert.name}/>
              </div>
              )}
                <h3>{concert.name}</h3>
                <p>
                  <strong>Date:</strong>{" "}
                    {formatConcertDate(
                      concert?.dates?.start?.localDate,
                      concert?.dates?.start?.localTime,
                    )}
                </p>
                <p>
                  <strong>Venue:</strong>{" "}
                  {concert?._embedded?.venues?.[0]?.name ||
                    "Unknown venue"}
                </p>
              </div>
          </Link>
        ))
      ) : (
        <p>No recommendations yet.</p>
      )}
    </div>
  </div>
  ) : (
    <div className="setup-banner">
      <h2>Set Your Genre Preferences</h2>
      <div className="genre-setup">
          <div className="genre-setup-content">
            <div className="genre-heading">
            {/*if genre is not chosen, it shows this*/}
              <h3> Your profile is a bit empty... </h3>
              <p>Edit your genre preferences in your profile to get more recommended concerts.</p>
            </div>
            <button className="genre-connect-btn" 
            onClick={() => navigate("/profile")}>
              Edit Genre Preferences →
            </button>
          </div>
          <div className="genre-banner-img">
            <img src={genreImg} alt = "Concert Stage"/>
          </div>
      </div>
    </div>
  );


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
            />

            <button onClick={() => navigate("/browse")} className="nav-button">
              Browse
            </button>
          </div>

          <div className="nav-links">
            {token ? (
              <>
                <NavbarProfileMenu />
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
      </header>
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

                    <h1 className="dashboard-carousel-title">{concert.name}</h1>
                  </div>
                  <Link
                    to={`/concerts/${concert.id}`}
                    className="dashboard-carousel-button"
                  >
                    View Details
                  </Link>
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
      <div className="page-container">
        {/*upcoming concerts*/}
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
            {upcomingConcerts.length > 0 ? (
              upcomingConcerts.map((concert) => (
                <Link
                  key={concert.id}
                  to={`/concerts/${concert.id}`}
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
                      {concert._embedded?.venues?.[0]?.name || "Unknown venue"}
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
          !hasSpotify && hasGenres ? (
            <>
              {genreSection}
              {spotifySection}
            </>
          ) : (
            <>
              {spotifySection}
              {genreSection}
            </>
          )
        )}
      </div>
    </div>
  );
}

export default Dashboard;
