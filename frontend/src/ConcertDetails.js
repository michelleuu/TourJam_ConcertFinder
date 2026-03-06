import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

function ConcertDetails() {
  const { id } = useParams();
  const [concert, setConcert] = useState(null);

  useEffect(() => {
    async function fetchConcert() {
      const res = await fetch(`http://localhost:5001/api/concerts/${id}`);
      const data = await res.json();
      setConcert(data);
    }
    fetchConcert();
  }, [id]);

  if (!concert) return <p>Loading...</p>;

  return (
    <div>
      <h1>{concert.name}</h1>
      <p>
        <strong>Date:</strong> {concert.dates.start.localDate}{" "}
        {concert.dates.start.localTime || ""}
      </p>
      <p>
        <strong>Venue:</strong> {concert._embedded.venues[0].name}
      </p>
      {concert.images && concert.images[0] && (
        <img
          src={concert.images[0].url}
          alt={concert.name}
          style={{ maxWidth: "100%", height: "auto" }}
        />
      )}
      <a href={concert.url} target="_blank" rel="noopener noreferrer">
        Buy Tickets
      </a>
    </div>
  );
}

export default ConcertDetails;
