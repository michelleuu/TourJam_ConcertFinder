// Reusable concert card comonent to use throughout the app (in browse and dashboard).

import { Link } from "react-router-dom";

// Format date from response into a readable format
function formatConcertDate(dateStr, timeStr) {
  if (!dateStr) return "";

  const dateTime = timeStr ? `${dateStr}T${timeStr}` : `${dateStr}T12:00:00`;
  const date = new Date(dateTime);

  const weekday = date.toLocaleDateString("en-US", {
    weekday: "short",
  });

  const calendarDate = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  if (!timeStr) {
    return `${weekday} • ${calendarDate}`;
  }

  const formattedTime = date
    .toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .replace("AM", "am")
    .replace("PM", "pm");

  return `${weekday} • ${calendarDate} • ${formattedTime}`;
}

// Format location from response into a readable format
function formatConcertLocationLine(venue) {
  const venueName = venue?.name || "Unknown venue";
  const city = venue?.city?.name || "";
  const state =
    venue?.state?.stateCode ||
    venue?.state?.name ||
    venue?.country?.countryCode ||
    venue?.country?.name ||
    "";

  const place = [city, state].filter(Boolean).join(", ");

  return place ? `${venueName} • ${place}` : venueName;
}

// Check image size to get best image resolution
function getBestImage(images = []) {
  return images.reduce((best, img) => {
    if (!best) return img;
    return (img.width || 0) > (best.width || 0) ? img : best;
  }, null);
}

// Create concert card component
function ConcertCard({ concert, className = "" }) {
  const venue = concert?._embedded?.venues?.[0];
  const bestImage = getBestImage(concert?.images);

  return (
    <Link
      to={`/concerts/${concert.id}`}
      className={`concert-link ${className}`.trim()}
    >
      <div className="concert-card browse-card-height">
        <div className="image-container">
          {bestImage?.url ? (
            <img src={bestImage.url} alt={concert.name} />
          ) : null}
        </div>

        <h3 className="concert-name">{concert.name}</h3>

        <p className="concert-meta">
          {formatConcertDate(
            concert?.dates?.start?.localDate,
            concert?.dates?.start?.localTime,
          )}
        </p>

        <p className="concert-location-line">
          {formatConcertLocationLine(venue)}
        </p>
      </div>
    </Link>
  );
}

export default ConcertCard;
