import { useContext, useEffect, useRef, useState } from "react";
import "./Browse.css";
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

// Genre options shown in the genre dropdown
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

// Maps the UI genre labels to the values your backend expects
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

  // Concert data from backend
  const [concerts, setConcerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search input values
  const [locationInput, setLocationInput] = useState("");
  const [keywordInput, setKeywordInput] = useState("");

  // Genre filter state
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [appliedGenres, setAppliedGenres] = useState([]);

  // Date filter state
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [appliedStartDate, setAppliedStartDate] = useState("");
  const [appliedEndDate, setAppliedEndDate] = useState("");

  // Dropdown visibility
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [showGenreDropdown, setShowGenreDropdown] = useState(false);

  // Sort dropdown state
  // "date" is the default and uses backend sorting
  // "a-z" and "z-a" sort only the current page on the frontend
  const [sortOption, setSortOption] = useState("date");

  // Pagination state
  const [page, setPage] = useState(0);
  const [size] = useState(120);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Refs for closing dropdowns when clicking outside
  const dateDropdownRef = useRef(null);
  const genreDropdownRef = useRef(null);

  // Formats concert date/time for display
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

  // Returns the concerts to display on the current page
  // Date uses backend order
  // A-Z and Z-A sort only the concerts already loaded on this page
  function getDisplayConcerts() {
    const concertsCopy = [...concerts];

    if (sortOption === "a-z") {
      return concertsCopy.sort((a, b) =>
        (a.name || "").localeCompare(b.name || ""),
      );
    }

    if (sortOption === "z-a") {
      return concertsCopy.sort((a, b) =>
        (b.name || "").localeCompare(a.name || ""),
      );
    }

    return concertsCopy;
  }

  const getBestImage = (images = []) => {
    return images.reduce((best, img) => {
      if (!best) return img;
      return img.width > best.width ? img : best;
    }, null);
  };

  // Fetch concerts from backend
  // IMPORTANT:
  // We always fetch by date so pagination continues properly across pages.
  // Then, if the user selected A-Z or Z-A, we sort only the current page locally.
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

      // Always fetch from backend in date order
      // This keeps pagination stable and continuous
      params.append("sort", "date,asc");

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

  // Initial page load
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

  // Close dropdowns when clicking outside them
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

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Apply filters and reset to page 1
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

  // Go to next page
  // Backend still fetches next date-sorted page
  function goToNextPage() {
    if (page < totalPages - 1) {
      fetchConcerts({
        nextPage: page + 1,
      });
    }
  }

  // Go to previous page
  function goToPreviousPage() {
    if (page > 0) {
      fetchConcerts({
        nextPage: page - 1,
      });
    }
  }

  // Toggle genre selection
  function toggleGenre(genre) {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre],
    );
  }

  // Clear search inputs
  function clearLocation() {
    setLocationInput("");
  }

  function clearKeyword() {
    setKeywordInput("");
  }

  // Label shown in date dropdown button
  function getDateLabel() {
    if (!appliedStartDate && !appliedEndDate) return "All Dates";
    if (appliedStartDate && appliedEndDate) {
      return `${appliedStartDate} - ${appliedEndDate}`;
    }
    if (appliedStartDate) return `From ${appliedStartDate}`;
    return `Until ${appliedEndDate}`;
  }

  // Label shown in genre dropdown button
  function getGenreLabel() {
    if (appliedGenres.length === 0) return "All Genres";
    if (appliedGenres.length <= 2) return appliedGenres.join(", ");
    return `${appliedGenres.length} genres selected`;
  }

  // Handle sort dropdown changes
  // We do NOT refetch here because all pages are already fetched by date.
  // A-Z / Z-A only change how the current page is displayed.
  function handleSortChange(e) {
    const newSort = e.target.value;
    setSortOption(newSort);
  }

  // Final concerts shown in the grid
  const displayConcerts = getDisplayConcerts();

  return (
    <div className="browse-page">
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

        <div className="browse-hero">
          <div className="filter-bar">
            {/* Location filter */}
            <div className="filter-box">
              <LuMapPin size={22} color="#2563eb" />

              <div className="filter-box-content">
                <div className="filter-box-label">Location</div>

                <input
                  type="text"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  placeholder="City or Country"
                  className="filter-input"
                />
              </div>

              {locationInput && (
                <button onClick={clearLocation} className="icon-button">
                  <LuX size={18} />
                </button>
              )}
            </div>

            {/* Date filter dropdown */}
            <div className="filter-box dropdown-box" ref={dateDropdownRef}>
              <LuCalendarDays size={22} color="#2563eb" />

              <button
                onClick={() => {
                  setShowDateDropdown((prev) => !prev);
                  setShowGenreDropdown(false);
                }}
                className="dropdown-trigger"
              >
                <div className="filter-box-label">Dates</div>
                <div className="dropdown-value">{getDateLabel()}</div>
              </button>

              <button
                onClick={() => {
                  setShowDateDropdown((prev) => !prev);
                  setShowGenreDropdown(false);
                }}
                className="icon-button"
              >
                {showDateDropdown ? (
                  <LuChevronUp size={20} />
                ) : (
                  <LuChevronDown size={20} />
                )}
              </button>

              {showDateDropdown && (
                <div className="dropdown-panel">
                  <div className="date-grid">
                    <div>
                      <label className="dropdown-field-label">Start date</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="date-input"
                      />
                    </div>

                    <div>
                      <label className="dropdown-field-label">End date</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="date-input"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Genre filter dropdown */}
            <div className="filter-box dropdown-box" ref={genreDropdownRef}>
              <LuMusic2 size={22} color="#2563eb" />

              <button
                onClick={() => {
                  setShowGenreDropdown((prev) => !prev);
                  setShowDateDropdown(false);
                }}
                className="dropdown-trigger"
              >
                <div className="filter-box-label">Genres</div>
                <div className="dropdown-value">{getGenreLabel()}</div>
              </button>

              <button
                onClick={() => {
                  setShowGenreDropdown((prev) => !prev);
                  setShowDateDropdown(false);
                }}
                className="icon-button"
              >
                {showGenreDropdown ? (
                  <LuChevronUp size={20} />
                ) : (
                  <LuChevronDown size={20} />
                )}
              </button>

              {showGenreDropdown && (
                <div className="dropdown-panel">
                  <div className="genre-grid">
                    {AVAILABLE_GENRES.map((genre) => (
                      <label key={genre} className="genre-option">
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

            {/* Keyword search */}
            <div className="filter-box search-box">
              <LuSearch size={22} color="#2563eb" />

              <div className="filter-box-content">
                <div className="filter-box-label">Search</div>

                <input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") applyFilters();
                  }}
                  placeholder="Search for artists or concerts"
                  className="filter-input"
                />
              </div>

              {keywordInput && (
                <button onClick={clearKeyword} className="icon-button">
                  <LuX size={18} />
                </button>
              )}
            </div>

            {/* Search button */}
            <button onClick={applyFilters} className="search-button">
              Search
            </button>
          </div>
        </div>
      </header>

      <div className="page-container browse-content">
        <section id="browse-concerts">
          <div className="results-header">
            <h2 className="results-title">Browse Concerts</h2>

            <div className="results-controls">
              <p className="results-count">
                {totalElements} result{totalElements === 1 ? "" : "s"}
              </p>

              <div className="sort-wrapper">
                <span className="sort-label">Sort by:</span>

                <select
                  value={sortOption}
                  onChange={handleSortChange}
                  className="sort-select"
                >
                  <option value="date">Date</option>
                  <option value="a-z">A-Z</option>
                  <option value="z-a">Z-A</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <p className="status-text">Loading concerts...</p>
          ) : displayConcerts.length > 0 ? (
            <>
              <div className="concert-grid">
                {displayConcerts.map((concert) => (
                  <Link
                    key={concert.id}
                    to={`/concert/${concert.id}`}
                    to={`/concerts/${concert.id}`}
                    className="concert-link"
                  >
                    <div className="concert-card browse-card-height">
                      {concert.images && (
                        <div className="image-container">
                          <img
                            src={getBestImage(concert.images)?.url}
                            alt={concert.name}
                          />
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

              <div className="pagination">
                <button
                  onClick={goToPreviousPage}
                  disabled={page === 0}
                  className="pagination-button"
                >
                  Previous
                </button>

                <span className="pagination-text">
                  Page {page + 1} of {totalPages}
                </span>

                <button
                  onClick={goToNextPage}
                  disabled={page >= totalPages - 1}
                  className="pagination-button"
                >
                  Next
                </button>
              </div>
            </>
          ) : (
            <p className="status-text">
              No concerts found matching your filters.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

export default Browse;
