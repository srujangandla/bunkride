import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import {
  GoogleMap,
  LoadScript,
  Marker,
  DirectionsRenderer,
  Autocomplete
} from "@react-google-maps/api";
import "bootstrap/dist/css/bootstrap.min.css";

const API_URL = "http://localhost:5000";
const socket = io(API_URL);

const defaultCenter = { lat: 17.385, lng: 78.4867 };

export default function Dashboard() {
  const [rides, setRides] = useState([]);
  const [directions, setDirections] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [pickupCoords, setPickupCoords] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [vehicleType, setVehicleType] = useState("bike");
  const [rideLocked, setRideLocked] = useState(false);

  const [pickupPlace, setPickupPlace] = useState(null);
  const [destinationPlace, setDestinationPlace] = useState(null);
  const [username, setUsername] = useState("");

  const pickupRef = useRef(null);
  const destinationRef = useRef(null);

  const fetchRides = async () => {
    try {
      const res = await axios.get(`${API_URL}/rides`);
      setRides(res.data);

      const user = localStorage.getItem("username");
      setUsername(user);

      const active = res.data.find(
        (r) =>
          r.rider === user &&
          (r.status === "requested" || r.status === "accepted")
      );

      setRideLocked(!!active);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchRides();

    socket.on("updateLocation", (d) => {
      setDriverLocation({ lat: d.lat, lng: d.lng });
    });

    socket.on("newRide", fetchRides);
    socket.on("rideUpdated", fetchRides);

    return () => {
      socket.off("updateLocation");
      socket.off("newRide");
      socket.off("rideUpdated");
    };
  }, []);

  const calculateRoute = () => {
    return new Promise((resolve, reject) => {
      const pickupInput = document
        .querySelector("input[placeholder='Pickup']")
        .value.trim();

      const destinationInput = document
        .querySelector("input[placeholder='Destination']")
        .value.trim();

      const origin = pickupPlace?.formatted_address || pickupInput;
      const destination = destinationPlace?.formatted_address || destinationInput;

      if (!origin || !destination) {
        return reject("Enter valid pickup and destination");
      }

      const service = new window.google.maps.DirectionsService();

      service.route(
        {
          origin,
          destination,
          travelMode: window.google.maps.TravelMode.DRIVING
        },
        (result, status) => {
          console.log("Directions Status:", status);

          if (status === "OK") {
            const leg = result.routes[0].legs[0];

            const pickup = {
              lat: leg.start_location.lat(),
              lng: leg.start_location.lng()
            };

            const destCoords = {
              lat: leg.end_location.lat(),
              lng: leg.end_location.lng()
            };

            setDirections(result);
            setPickupCoords(pickup);
            setDestinationCoords(destCoords);

            setRouteInfo({
              distance: leg.distance.text,
              duration: leg.duration.text
            });

            resolve({ pickup, destination: destCoords });
          } else if (status === "ZERO_RESULTS") {
            reject("No route found between locations");
          } else if (status === "NOT_FOUND") {
            reject("Invalid location entered");
          } else if (status === "REQUEST_DENIED") {
            reject("API key issue (enable billing & APIs)");
          } else {
            reject("Route failed: " + status);
          }
        }
      );
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rideLocked) {
      alert("Active ride already exists");
      return;
    }

    try {
      const { pickup, destination } = await calculateRoute();
      const token = localStorage.getItem("token");

      await axios.post(
        `${API_URL}/ride/book`,
        { pickup, destination, vehicleType },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }
      );

      fetchRides();
      setRideLocked(true);
    } catch (err) {
      alert(err);
    }
  };

  const cancelRide = async (rideId) => {
    try {
      const token = localStorage.getItem("token");

      await axios.post(
        `${API_URL}/ride/cancel/${rideId}`,
        {},
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }
      );

      fetchRides();
      setRideLocked(false);
    } catch {
      alert("Cancel failed");
    }
  };

  return (
    <LoadScript
      googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_KEY}
      libraries={["places"]}
    >
      <div style={{ height: "100vh", background: "#0f0f0f", color: "white" }}>

        <div style={{ display: "flex", height: "calc(100% - 50px)" }}>
          <div style={{ width: "25%", padding: "12px" }}>
            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              <Autocomplete
                onLoad={(ref) => (pickupRef.current = ref)}
                onPlaceChanged={() => {
                  const place = pickupRef.current.getPlace();
                  if (place.geometry) setPickupPlace(place);
                }}
              >
                <input placeholder="Pickup" style={box} />
              </Autocomplete>

              <Autocomplete
                onLoad={(ref) => (destinationRef.current = ref)}
                onPlaceChanged={() => {
                  const place = destinationRef.current.getPlace();
                  if (place.geometry) setDestinationPlace(place);
                }}
              >
                <input placeholder="Destination" style={box} />
              </Autocomplete>

              <button type="button" onClick={calculateRoute} className="btn btn-secondary">
                Show Route
              </button>

              <div style={{ display: "flex", gap: "8px" }}>
                <button type="button" onClick={() => setVehicleType("bike")} style={vehicleType === "bike" ? activeVehicleBtn : vehicleBtn}>
                  🏍 Bike
                </button>

                <button type="button" onClick={() => setVehicleType("car")} style={vehicleType === "car" ? activeVehicleBtn : vehicleBtn}>
                  🚗 Car
                </button>
              </div>

              <button className="btn btn-success" disabled={rideLocked}>
                {rideLocked ? "Ride Active" : "Book Ride"}
              </button>
            </form>

            {routeInfo && (
              <div className="mt-2 p-2 bg-dark rounded">
                {routeInfo.distance} • {routeInfo.duration}
              </div>
            )}

            <div style={{ marginTop: "10px" }}>
              {rides.map((r) => (
                <div key={r.id} style={card}>
                  <div>
                    ₹{r.fare}
                    <div style={{ fontSize: "12px" }}>{r.status}</div>
                  </div>

                  {r.status !== "cancelled" && r.status !== "completed" && (
                    <button onClick={() => cancelRide(r.id)} style={cancelBtn}>
                      Cancel
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={{ width: "75%" }}>
            <GoogleMap
              center={driverLocation || pickupCoords || defaultCenter}
              zoom={13}
              mapContainerStyle={{ width: "100%", height: "100%" }}
            >
              {pickupCoords && <Marker position={pickupCoords} />}
              {destinationCoords && <Marker position={destinationCoords} />}
              {driverLocation && <Marker position={driverLocation} />}
              {directions && <DirectionsRenderer directions={directions} />}
            </GoogleMap>
          </div>
        </div>
      </div>
    </LoadScript>
  );
}

const navBar = {
  height: "50px",
  display: "flex",
  alignItems: "center",
  padding: "0 15px",
  background: "#1a1a1a",
  borderBottom: "1px solid #333"
};

const box = {
  padding: "10px",
  borderRadius: "6px",
  background: "#1a1a1a",
  color: "white",
  border: "1px solid #333"
};

const card = {
  background: "#1a1a1a",
  padding: "8px",
  borderRadius: "8px",
  marginBottom: "6px",
  display: "flex",
  justifyContent: "space-between"
};

const cancelBtn = {
  background: "red",
  color: "white",
  border: "none",
  padding: "5px",
  borderRadius: "5px"
};

const vehicleBtn = {
  flex: 1,
  padding: "8px",
  background: "#1a1a1a",
  color: "white",
  border: "1px solid #333"
};

const activeVehicleBtn = {
  ...vehicleBtn,
  background: "#00aa66"
};