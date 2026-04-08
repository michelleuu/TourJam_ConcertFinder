import { useCallback, useContext, useEffect, useRef, useState } from "react";
import "./App.css";
import { AuthContext } from "./context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import logo from "./assets/logo.svg";
import NavbarProfileMenu from "./NavbarProfileMenu";
import ConcertCard from "./ConcertCard";

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

  const concertsScrollRef = useRef(null);
  const spotifyScrollRef = useRef(null);
  const recommendedScrollRef = useRef(null);

  const [concertsRef, concertsApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    dragFree: true,
  });

  // Spotify carousel
  const [spotifyRef, spotifyApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
  });

  // Recommended carousel
  const [recommendedRef, recommendedApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
  });

  const [canScrollPrevConcerts, setCanScrollPrevConcerts] = useState(false);
  const [canScrollNextConcerts, setCanScrollNextConcerts] = useState(false);

  const [canScrollPrevSpotify, setCanScrollPrevSpotify] = useState(false);
  const [canScrollNextSpotify, setCanScrollNextSpotify] = useState(false);

  const [canScrollPrevRecommended, setCanScrollPrevRecommended] =
    useState(false);
  const [canScrollNextRecommended, setCanScrollNextRecommended] =
    useState(false);

  const autoSlideRef = useRef(null);

  const scrollContainerByAmount = (ref, amount) => {
    if (!ref.current) return;

    ref.current.scrollBy({
      left: amount,
      behavior: "smooth",
    });
  };

  const updateScrollButtons = useCallback((ref, setPrev, setNext) => {
    const el = ref.current;
    if (!el) return;

    const maxScrollLeft = el.scrollWidth - el.clientWidth;
    setPrev(el.scrollLeft > 5);
    setNext(el.scrollLeft < maxScrollLeft - 5);
  }, []);

  const scrollPrevConcerts = useCallback(() => {
    if (!concertsApi) return;
    concertsApi.scrollPrev();
  }, [concertsApi]);

  const scrollNextConcerts = useCallback(() => {
    if (!concertsApi) return;
    concertsApi.scrollNext();
  }, [concertsApi]);

  const scrollPrevSpotify = useCallback(() => {
    if (!spotifyApi) return;
    spotifyApi.scrollPrev();
  }, [spotifyApi]);

  const scrollNextSpotify = useCallback(() => {
    if (!spotifyApi) return;
    spotifyApi.scrollNext();
  }, [spotifyApi]);

  const scrollPrevRecommended = useCallback(() => {
    if (!recommendedApi) return;
    recommendedApi.scrollPrev();
  }, [recommendedApi]);

  const scrollNextRecommended = useCallback(() => {
    if (!recommendedApi) return;
    recommendedApi.scrollNext();
  }, [recommendedApi]);

  useEffect(() => {
    const concertsEl = concertsScrollRef.current;
    const spotifyEl = spotifyScrollRef.current;
    const recommendedEl = recommendedScrollRef.current;

    const handleConcertsScroll = () => {
      updateScrollButtons(
        concertsScrollRef,
        setCanScrollPrevConcerts,
        setCanScrollNextConcerts,
      );
    };

    const handleSpotifyScroll = () => {
      updateScrollButtons(
        spotifyScrollRef,
        setCanScrollPrevSpotify,
        setCanScrollNextSpotify,
      );
    };

    const handleRecommendedScroll = () => {
      updateScrollButtons(
        recommendedScrollRef,
        setCanScrollPrevRecommended,
        setCanScrollNextRecommended,
      );
    };

    if (concertsEl) {
      concertsEl.addEventListener("scroll", handleConcertsScroll);
      handleConcertsScroll();
    }

    if (spotifyEl) {
      spotifyEl.addEventListener("scroll", handleSpotifyScroll);
      handleSpotifyScroll();
    }

    if (recommendedEl) {
      recommendedEl.addEventListener("scroll", handleRecommendedScroll);
      handleRecommendedScroll();
    }

    window.addEventListener("resize", handleConcertsScroll);
    window.addEventListener("resize", handleSpotifyScroll);
    window.addEventListener("resize", handleRecommendedScroll);

    return () => {
      if (concertsEl) {
        concertsEl.removeEventListener("scroll", handleConcertsScroll);
      }

      if (spotifyEl) {
        spotifyEl.removeEventListener("scroll", handleSpotifyScroll);
      }

      if (recommendedEl) {
        recommendedEl.removeEventListener("scroll", handleRecommendedScroll);
      }

      window.removeEventListener("resize", handleConcertsScroll);
      window.removeEventListener("resize", handleSpotifyScroll);
      window.removeEventListener("resize", handleRecommendedScroll);
    };
  }, [updateScrollButtons, concerts, spotifyConcerts, recommendedConcerts]);

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

  // Concerts
  useEffect(() => {
    if (!concertsApi) return;

    const update = () => {
      setCanScrollPrevConcerts(concertsApi.canScrollPrev());
      setCanScrollNextConcerts(concertsApi.canScrollNext());
    };

    concertsApi.on("select", update);
    concertsApi.on("reInit", update);

    update(); // initial check

    return () => {
      concertsApi.off("select", update);
      concertsApi.off("reInit", update);
    };
  }, [concertsApi]);

  // Spotify
  useEffect(() => {
    if (!spotifyApi) return;

    const update = () => {
      setCanScrollPrevSpotify(spotifyApi.canScrollPrev());
      setCanScrollNextSpotify(spotifyApi.canScrollNext());
    };

    spotifyApi.on("select", update);
    spotifyApi.on("reInit", update);

    update();

    return () => {
      spotifyApi.off("select", update);
      spotifyApi.off("reInit", update);
    };
  }, [spotifyApi]);

  // Recommended
  useEffect(() => {
    if (!recommendedApi) return;

    const update = () => {
      setCanScrollPrevRecommended(recommendedApi.canScrollPrev());
      setCanScrollNextRecommended(recommendedApi.canScrollNext());
    };

    recommendedApi.on("select", update);
    recommendedApi.on("reInit", update);

    update();

    return () => {
      recommendedApi.off("select", update);
      recommendedApi.off("reInit", update);
    };
  }, [recommendedApi]);

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
  };

  useEffect(() => {
    // Initial fetch
    fetchFeaturedConcerts();

    // Poll every 30 seconds
    const interval = setInterval(() => {
      fetchFeaturedConcerts();
    }, 1200000);

    // Cleanup when component unmounts
    return () => clearInterval(interval);
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
  <section>
    <h2>From Your Favourite Artists</h2>
      {uniqueSpotifyConcerts.length > 0 ? (
        <div className="concerts-wrapper">
          <div className="concerts-carousel">
            <div className="embla" ref={spotifyRef}>
              <div className="embla__container">
                {uniqueSpotifyConcerts.map((artistObj) =>
                  artistObj.concerts
                    .filter((concert) => concert.id)
                    .map((concert) => (
                      <div className="embla__slide concert-slide" key={concert.id}>
                        <Link
                          to={`/concerts/${concert.id}`}
                          style={{ textDecoration: "none", color: "inherit" }}
                        >
                          <ConcertCard concert={concert} />
                        </Link>
                      </div>
                    ))
                )}
              </div>
            </div>

            {(canScrollPrevSpotify || canScrollNextSpotify) && (
              <>
                {canScrollPrevSpotify && (
                  <button
                    className="concerts-arrow concerts-arrow-left"
                    onClick={scrollPrevSpotify}
                  >
                    ‹
                  </button>
                )}

                {canScrollNextSpotify && (
                  <button
                    className="concerts-arrow concerts-arrow-right"
                    onClick={scrollNextSpotify}
                  >
                    ›
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        <p>No Spotify concert recommendations yet.</p>
      )}
  </section>
  ) : (
    <section className="setup-banner">
      <h2>Finish Setting Up</h2>
      <div className="spotify-setup">
        <div className="spotify-banner-img">
          <img src={spotifyImg} alt="Spotify Artists" />
        </div>

        <div className="spotify-setup-content">
          <div className="spotify-heading">
            <h3>Experience more with</h3>
            <img src={spotifyLogo} alt="Spotify Logo" className="spotify-logo" />
          </div>

          <button className="spotify-connect-btn" onClick={connectSpotify}>
            Connect Spotify →
          </button>
        </div>
      </div>
    </section>
  );

  //Preferred Genre concerts section depending on its token availability
  const genreSection = hasGenres ? (
  <section>
      <h2>Since you love {genres.join(", ")}</h2>
        {recommendedConcerts.length > 0 ? (
          <div className="concerts-wrapper">
            <div className="concerts-carousel">
              <div className="embla" ref={recommendedRef}>
                <div className="embla__container">
                  {recommendedConcerts.map((concert) => (
                    <div className="embla__slide concert-slide" key={concert.id}>
                      <Link
                        to={`/concerts/${concert.id}`}
                        style={{ textDecoration: "none", color: "inherit" }}
                      >
                        <ConcertCard concert={concert} />
                      </Link>
                    </div>
                  ))}
                </div>
              </div>

              {(canScrollPrevRecommended || canScrollNextRecommended) && (
                <>
                  {canScrollPrevRecommended && (
                    <button
                      className="concerts-arrow concerts-arrow-left"
                      onClick={scrollPrevRecommended}
                    >
                      ‹
                    </button>
                  )}

                  {canScrollNextRecommended && (
                    <button
                      className="concerts-arrow concerts-arrow-right"
                      onClick={scrollNextRecommended}
                    >
                      ›
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          <p>No recommendations yet.</p>
        )}
    </section>
  ) : (
    <section className="setup-banner">
      <h2>Set Your Genre Preferences</h2>

      <div className="genre-setup">
        <div className="genre-setup-content">
          <div className="genre-heading">
            <h3>Your profile is a bit empty...</h3>
            <p>Edit your genre preferences in your profile to get recommendations.</p>
          </div>

          <button
            className="genre-connect-btn"
            onClick={() => navigate("/profile")}
          >
            Edit Genre Preferences →
          </button>
        </div>

        <div className="genre-banner-img">
          <img src={genreImg} alt="Concert Stage" />
        </div>
      </div>
    </section>
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
        <section id="upcoming-concerts">
          <div>
            <h2>Upcoming Concerts</h2>
            <div className="city-tabs">
              {[
                "Vancouver",
                "Toronto",
                "Montreal",
                "Calgary",
                "Ottawa",
                "Edmonton",
                "Winnipeg",
              ].map((c) => (
                <button
                  key={c}
                  className={`city-tab ${city === c ? "active" : ""}`}
                  onClick={() => setCity(c)}
                >
                  <span>{c}</span>
                </button>
              ))}
            </div>
          </div>
          {upcomingConcerts.length > 0 ? (
            <div className="concerts-wrapper">
              <div className="concerts-carousel">
                <div className="embla" ref={concertsRef}>
                  <div className="embla__container">
                    {upcomingConcerts.map((concert) => (
                      <div
                        className="embla__slide concert-slide"
                        key={concert.id}
                      >
                        <Link
                          to={`/concerts/${concert.id}`}
                          style={{ textDecoration: "none", color: "inherit" }}
                        >
                          <ConcertCard key={concert.id} concert={concert} />
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>

                {(canScrollPrevConcerts || canScrollNextConcerts) && (
                  <>
                    {canScrollPrevConcerts && (
                      <button
                        className="concerts-arrow concerts-arrow-left"
                        onClick={scrollPrevConcerts}
                      >
                        ‹
                      </button>
                    )}

                    {canScrollNextConcerts && (
                      <button
                        className="concerts-arrow concerts-arrow-right"
                        onClick={scrollNextConcerts}
                      >
                        ›
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : (
            <p>No concerts found.</p>
          )}
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
      <footer className="footer">
        <div className="footer-content">
          <img src={logo} alt="TourJam logo" className="logo" />

          <div className="footer-divider" />

          <div className="footer-bottom">
            <p className="footer-description">
              TourJam helps you discover live music experiences tailored to your
              taste. Browse concerts, find shows from your favourite artists,
              and never miss a performance near you.
            </p>

            <p className="footer-copy">© 2026 TourJam</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Dashboard;