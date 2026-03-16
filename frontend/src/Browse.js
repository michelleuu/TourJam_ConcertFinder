import { useContext, useEffect, useRef, useState } from "react";
import "./App.css";
import { AuthContext } from "./context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import logo from "./assets/logo.svg";
import {
  LuSearch,
  LuMapPin,
  LuCalendarDays,
  LuMusic2,
  LuChevronDown,
  LuChevronUp,
  LuX,
} from "react-icons/lu";

const AVAILABLE_GENRES = [
  "Rock",
  "Pop",
  "R&B",
  "Hip Hop/Rap",
  "Jazz",
  "Dance/Electronic",
  "Country",
  "Folk",
  "Metal",
  "Alternative",
  "Classical",
];

const GENRE_QUERY_MAP = {
  Rock: "rock",
  Pop: "pop",
  "R&B": "r&b",
  "Hip Hop/Rap": "hip hop",
  Jazz: "jazz",
  "Dance/Electronic": "dance/electronic",
  Country: "country",
  Folk: "folk",
  Metal: "metal",
  Alternative: "alternative",
  Classical: "classical",
};

function Browse() {
  const { token, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [concerts, setConcerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [locationInput, setLocationInput] = useState("");
  const [keywordInput, setKeywordInput] = useState("");

  const [selectedGenres, setSelectedGenres] = useState([]);
  const [appliedGenres, setAppliedGenres] = useState([]);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [appliedStartDate, setAppliedStartDate] = useState("");
  const [appliedEndDate, setAppliedEndDate] = useState("");

  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [showGenreDropdown, setShowGenreDropdown] = useState(false);

  const [page, setPage] = useState(0);
  const [size] = useState(40);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const dateDropdownRef = useRef(null);
  const genreDropdownRef = useRef(null);

  function formatConcertDate(dateStr, timeStr) {
    if (!dateStr) return "";

    const dateTime = timeStr ? `${dateStr}T${timeStr}` : dateStr;
    const date = new Date(dateTime);

    const options = {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: timeStr ? "numeric" : undefined,
      minute: timeStr ? "2-digit" : undefined,
      hour12: true,
    };

    return date.toLocaleString("en-US", options);
  }

  async function fetchConcerts({
    nextPage = 0,
    location = locationInput,
    keyword = keywordInput,
    start = appliedStartDate,
    end = appliedEndDate,
    genres = appliedGenres,
  } = {}) {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      params.append("page", String(nextPage));
      params.append("size", String(size));

      if (location.trim()) params.append("location", location.trim());
      if (keyword.trim()) params.append("keyword", keyword.trim());
      if (start) params.append("startDate", start);
      if (end) params.append("endDate", end);

      const genreValues = genres
        .map((genre) => GENRE_QUERY_MAP[genre])
        .filter(Boolean);

      if (genreValues.length > 0) {
        params.append("genre", genreValues.join(","));
      }

      const response = await fetch(
        `http://localhost:5001/api/concerts?${params.toString()}`,
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();

      setConcerts(data.concerts || []);
      setPage(data.page || 0);
      setTotalPages(data.totalPages || 1);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      console.error("Failed to fetch concerts:", err.message);
      setConcerts([]);
      setPage(0);
      setTotalPages(1);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchConcerts({
      nextPage: 0,
      location: "",
      keyword: "",
      start: "",
      end: "",
      genres: [],
    });
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dateDropdownRef.current &&
        !dateDropdownRef.current.contains(event.target)
      ) {
        setShowDateDropdown(false);
      }

      if (
        genreDropdownRef.current &&
        !genreDropdownRef.current.contains(event.target)
      ) {
        setShowGenreDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function applyFilters() {
    setAppliedGenres(selectedGenres);
    setAppliedStartDate(startDate);
    setAppliedEndDate(endDate);
    setShowDateDropdown(false);
    setShowGenreDropdown(false);

    fetchConcerts({
      nextPage: 0,
      location: locationInput,
      keyword: keywordInput,
      start: startDate,
      end: endDate,
      genres: selectedGenres,
    });
  }

  function goToNextPage() {
    if (page < totalPages - 1) {
      fetchConcerts({ nextPage: page + 1 });
    }
  }

  function goToPreviousPage() {
    if (page > 0) {
      fetchConcerts({ nextPage: page - 1 });
    }
  }

  function toggleGenre(genre) {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre],
    );
  }

  function clearLocation() {
    setLocationInput("");
  }

  function clearKeyword() {
    setKeywordInput("");
  }

  function getDateLabel() {
    if (!appliedStartDate && !appliedEndDate) return "All Dates";
    if (appliedStartDate && appliedEndDate) {
      return `${appliedStartDate} - ${appliedEndDate}`;
    }
    if (appliedStartDate) return `From ${appliedStartDate}`;
    return `Until ${appliedEndDate}`;
  }

  function getGenreLabel() {
    if (appliedGenres.length === 0) return "All Genres";
    if (appliedGenres.length <= 2) return appliedGenres.join(", ");
    return `${appliedGenres.length} genres selected`;
  }

  return (
    <div style={{ overflowX: "hidden" }}>
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
                <button
                  onClick={() => navigate("/profile")}
                  className="nav-button"
                >
                  My Profile
                </button>
                <button onClick={logout} className="nav-button">
                  Logout
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

        <div
          style={{
            maxWidth: "1320px",
            margin: "2.5rem auto 0",
            padding: "0 1rem 2rem",
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.75rem",
              background: "#f4f4f4",
              borderRadius: "12px",
              border: "1px solid #d9d9d9",
              padding: "0.75rem",
            }}
          >
            <div
              style={{
                flex: "1 1 220px",
                minWidth: 0,
                padding: "0.75rem",
                background: "#fff",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
              }}
            >
              <LuMapPin size={22} color="#2563eb" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                  }}
                >
                  Location
                </div>
                <input
                  type="text"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  placeholder="City or Country"
                  style={{
                    width: "100%",
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    fontSize: "1rem",
                    marginTop: "0.2rem",
                  }}
                />
              </div>
              {locationInput && (
                <button
                  onClick={clearLocation}
                  style={{
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  <LuX size={18} />
                </button>
              )}
            </div>

            <div
              ref={dateDropdownRef}
              style={{
                flex: "1 1 220px",
                minWidth: 0,
                position: "relative",
                padding: "0.75rem",
                background: "#fff",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
              }}
            >
              <LuCalendarDays size={22} color="#2563eb" />
              <button
                onClick={() => {
                  setShowDateDropdown((prev) => !prev);
                  setShowGenreDropdown(false);
                }}
                style={{
                  flex: 1,
                  border: "none",
                  background: "transparent",
                  textAlign: "left",
                  cursor: "pointer",
                  padding: 0,
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                  }}
                >
                  Dates
                </div>
                <div style={{ fontSize: "1rem", marginTop: "0.2rem" }}>
                  {getDateLabel()}
                </div>
              </button>

              <button
                onClick={() => {
                  setShowDateDropdown((prev) => !prev);
                  setShowGenreDropdown(false);
                }}
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                {showDateDropdown ? (
                  <LuChevronUp size={20} />
                ) : (
                  <LuChevronDown size={20} />
                )}
              </button>

              {showDateDropdown && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    left: 0,
                    right: 0,
                    background: "#fff",
                    border: "1px solid #d9d9d9",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
                    zIndex: 50,
                    padding: "1rem",
                    borderRadius: "8px",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "1rem",
                    }}
                  >
                    <div>
                      <label
                        style={{ display: "block", marginBottom: "0.4rem" }}
                      >
                        Start date
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "0.85rem",
                          border: "1px solid #bdbdbd",
                        }}
                      />
                    </div>
                    <div>
                      <label
                        style={{ display: "block", marginBottom: "0.4rem" }}
                      >
                        End date
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "0.85rem",
                          border: "1px solid #bdbdbd",
                        }}
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginTop: "1rem",
                    }}
                  ></div>
                </div>
              )}
            </div>

            <div
              ref={genreDropdownRef}
              style={{
                flex: "1 1 220px",
                minWidth: 0,
                position: "relative",
                padding: "0.75rem",
                background: "#fff",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
              }}
            >
              <LuMusic2 size={22} color="#2563eb" />
              <button
                onClick={() => {
                  setShowGenreDropdown((prev) => !prev);
                  setShowDateDropdown(false);
                }}
                style={{
                  flex: 1,
                  border: "none",
                  background: "transparent",
                  textAlign: "left",
                  cursor: "pointer",
                  padding: 0,
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                  }}
                >
                  Genres
                </div>
                <div style={{ fontSize: "1rem", marginTop: "0.2rem" }}>
                  {getGenreLabel()}
                </div>
              </button>

              <button
                onClick={() => {
                  setShowGenreDropdown((prev) => !prev);
                  setShowDateDropdown(false);
                }}
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                {showGenreDropdown ? (
                  <LuChevronUp size={20} />
                ) : (
                  <LuChevronDown size={20} />
                )}
              </button>

              {showGenreDropdown && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    left: 0,
                    right: 0,
                    background: "#fff",
                    border: "1px solid #d9d9d9",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
                    zIndex: 50,
                    padding: "1rem",
                    borderRadius: "8px",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, 1fr)",
                      gap: "1rem",
                    }}
                  >
                    {AVAILABLE_GENRES.map((genre) => (
                      <label
                        key={genre}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedGenres.includes(genre)}
                          onChange={() => toggleGenre(genre)}
                        />
                        {genre}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div
              style={{
                flex: "2 1 280px",
                minWidth: 0,
                padding: "0.75rem",
                background: "#fff",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
              }}
            >
              <LuSearch size={22} color="#2563eb" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                  }}
                >
                  Search
                </div>
                <input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") applyFilters();
                  }}
                  placeholder="Search for artists or concerts"
                  style={{
                    width: "100%",
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    fontSize: "1rem",
                    marginTop: "0.2rem",
                  }}
                />
              </div>
              {keywordInput && (
                <button
                  onClick={clearKeyword}
                  style={{
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  <LuX size={18} />
                </button>
              )}
            </div>

            <button
              onClick={applyFilters}
              style={{
                flex: "0 0 auto",
                background: "#2563eb",
                color: "#fff",
                border: "none",
                padding: "0 1.5rem",
                minHeight: "64px",
                borderRadius: "8px",
                fontSize: "1.05rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Search
            </button>
          </div>
        </div>
      </header>

      <div className="page-container" style={{ overflowX: "hidden" }}>
        <section id="browse-concerts">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem",
              flexWrap: "wrap",
              gap: "0.75rem",
            }}
          >
            <h2 style={{ margin: 0 }}>Browse Concerts</h2>
            <p style={{ margin: 0, fontWeight: 600 }}>
              {totalElements} result{totalElements === 1 ? "" : "s"}
            </p>
          </div>

          {loading ? (
            <p>Loading concerts...</p>
          ) : concerts.length > 0 ? (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                  gap: "1.5rem",
                  width: "100%",
                }}
              >
                {concerts.map((concert) => (
                  <Link
                    key={concert.id}
                    to={`/concert/${concert.id}`}
                    style={{
                      textDecoration: "none",
                      color: "inherit",
                      minWidth: 0,
                    }}
                  >
                    <div className="concert-card" style={{ height: "100%" }}>
                      {concert.images?.[0] && (
                        <div className="image-container">
                          <img src={concert.images[0].url} alt={concert.name} />
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

                      <p>
                        <strong>Location:</strong>{" "}
                        {concert?._embedded?.venues?.[0]?.city?.name || ""}
                        {concert?._embedded?.venues?.[0]?.city?.name &&
                        concert?._embedded?.venues?.[0]?.country?.name
                          ? ", "
                          : ""}
                        {concert?._embedded?.venues?.[0]?.country?.name || ""}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "1rem",
                  marginTop: "2rem",
                }}
              >
                <button
                  onClick={goToPreviousPage}
                  disabled={page === 0}
                  style={{
                    padding: "0.75rem 1rem",
                    borderRadius: "8px",
                    border: "1px solid #d1d5db",
                    background: page === 0 ? "#f3f4f6" : "#fff",
                    cursor: page === 0 ? "not-allowed" : "pointer",
                  }}
                >
                  Previous
                </button>

                <span>
                  Page {page + 1} of {totalPages}
                </span>

                <button
                  onClick={goToNextPage}
                  disabled={page >= totalPages - 1}
                  style={{
                    padding: "0.75rem 1rem",
                    borderRadius: "8px",
                    border: "1px solid #d1d5db",
                    background: page >= totalPages - 1 ? "#f3f4f6" : "#fff",
                    cursor: page >= totalPages - 1 ? "not-allowed" : "pointer",
                  }}
                >
                  Next
                </button>
              </div>
            </>
          ) : (
            <p>No concerts found matching your filters.</p>
          )}
        </section>
      </div>
    </div>
  );
}

export default Browse;
