import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

function Artist() {
  const { name } = useParams();
  const [artist, setArtist] = useState(null);

  useEffect(() => {
    async function fetchArtist() {
      try {
        const res = await fetch(
          `http://localhost:5001/api/artists/${encodeURIComponent(name)}`,
        );

        const data = await res.json();
        setArtist(data);
      } catch (err) {
        console.error("Failed to fetch artist:", err);
      }
    }

    fetchArtist();
  }, [name]);

  if (!artist) return <p>Loading artist...</p>;

  return (
    <div className="artist-page">
      <h1>{artist.name}</h1>

      {artist.image && (
        <img src={artist.image} alt={artist.name} className="artist-image" />
      )}

      <p>
        <strong>Genres:</strong> {artist.genres.join(", ")}
      </p>

      <p>
        <strong>Followers:</strong> {artist.followers.toLocaleString()}
      </p>

      <p>
        <strong>Popularity:</strong> {artist.popularity}
      </p>

      <a href={artist.spotifyUrl} target="_blank" rel="noopener noreferrer">
        View on Spotify
      </a>
    </div>
  );
}

export default Artist;