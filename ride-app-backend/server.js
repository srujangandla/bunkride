const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { getDistance } = require("geolib");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const PORT = 5000;
const SECRET = "mysecretkey";

app.use(cors());
app.use(express.json());

let users = [];
let rides = [];

function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(403).json({ msg: "No token provided" });
  }

  const token = authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : authHeader;

  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    return res.status(401).json({ msg: "Invalid or expired token" });
  }
}

app.post("/signup", async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password) {
    return res.status(400).json({ msg: "Missing username or password" });
  }

  const exists = users.find((u) => u.username === username);
  if (exists) {
    return res.status(400).json({ msg: "User already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  users.push({
    username,
    password: hashedPassword,
    role: role || "rider"
  });

  res.json({ msg: "Account created" });
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = users.find((u) => u.username === username);

  if (!user) {
    return res.status(401).json({ msg: "Invalid credentials" });
  }

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) {
    return res.status(401).json({ msg: "Invalid credentials" });
  }

  const token = jwt.sign(
    { username: user.username, role: user.role },
    SECRET,
    { expiresIn: "1h" }
  );

  res.json({ token, role: user.role });
});

app.post("/ride/book", verifyToken, (req, res) => {
  if (req.user.role !== "rider") {
    return res.status(403).json({ msg: "Only riders can book rides" });
  }

  const { pickup, destination, vehicleType = "bike" } = req.body;

  if (
    !pickup ||
    !destination ||
    pickup.lat == null ||
    pickup.lng == null ||
    destination.lat == null ||
    destination.lng == null
  ) {
    return res.status(400).json({ msg: "Invalid pickup/destination" });
  }

  const activeRide = rides.find(
    (r) =>
      r.rider === req.user.username &&
      r.status !== "completed" &&
      r.status !== "cancelled"
  );

  if (activeRide) {
    return res.status(400).json({ msg: "Active ride already exists" });
  }

  // ✅ DISTANCE CALCULATION
  const distanceMeters = getDistance(
    { latitude: pickup.lat, longitude: pickup.lng },
    { latitude: destination.lat, longitude: destination.lng }
  );

  const distanceKm = distanceMeters / 1000;

  // ✅ BASE RATE (bike)
  let fare = distanceKm * 16.5;

  // ✅ CAR = +13%
  if (vehicleType === "car") {
    fare = fare * 1.15;
  }

  // ✅ MINIMUM FARE
  fare = Math.max(fare, 30);

  // ✅ ROUND OFF
  fare = Math.round(fare);

  const ride = {
    id: rides.length + 1,
    rider: req.user.username,
    driver: null,
    pickup,
    destination,
    status: "requested",
    vehicleType,
    fare,
    distanceKm: Number(distanceKm.toFixed(2)) // optional but useful
  };

  rides.push(ride);

  io.emit("newRide", ride);

  res.json(ride);
});

app.post("/ride/accept/:id", verifyToken, (req, res) => {
  if (req.user.role !== "driver") {
    return res.status(403).json({ msg: "Only drivers can accept rides" });
  }

  const ride = rides.find((r) => r.id == req.params.id);

  if (!ride) {
    return res.status(404).json({ msg: "Ride not found" });
  }

  if (ride.status !== "requested") {
    return res.status(400).json({ msg: "Ride already taken" });
  }

  ride.status = "accepted";
  ride.driver = req.user.username;

  io.emit("rideUpdated", ride);

  res.json(ride);
});

app.post("/ride/cancel/:id", verifyToken, (req, res) => {
  const ride = rides.find((r) => r.id == req.params.id);

  if (!ride) {
    return res.status(404).json({ msg: "Ride not found" });
  }

  if (ride.rider !== req.user.username && req.user.role !== "driver") {
    return res.status(403).json({ msg: "Not allowed" });
  }

  if (ride.status === "completed") {
    return res.status(400).json({ msg: "Cannot cancel completed ride" });
  }

  ride.status = "cancelled";

  io.emit("rideUpdated", ride);

  res.json(ride);
});

app.get("/rides", (req, res) => {
  res.json(rides);
});

io.on("connection", (socket) => {
  socket.on("joinRide", (rideId) => {
    socket.join(`ride_${rideId}`);
  });

  socket.on("driverLocation", (data) => {
    const { rideId, lat, lng } = data;

    io.to(`ride_${rideId}`).emit("updateLocation", {
      rideId,
      lat,
      lng
    });
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});