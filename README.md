# 🚗 BunkRide

BunkRide is a real-time ride booking web application built with the MERN stack (MongoDB, Express, React, Node.js) and Socket.IO. It supports live ride tracking, booking system, and Google Maps integration.

---

## 📌 Features

- User authentication (Rider / Driver roles)
- Ride booking (pickup & destination)
- Real-time updates using Socket.IO
- Live route display using Google Maps API
- Driver–rider connection system
- Ride cancellation support
- Responsive frontend UI

---

## 🏗️ Tech Stack

**Frontend:**
- React.js
- Axios
- Socket.IO Client
- Google Maps JavaScript API
- Bootstrap

**Backend:**
- Node.js
- Express.js
- Socket.IO
- JWT Authentication
- Bcrypt

---

## 📁 Project Structure
bunkride/
│
├── ride-app-backend/        # Backend (Node.js + Express)
│   ├── node_modules/        # Backend dependencies
│   ├── .gitignore           # Ignore backend-specific files
│   ├── package.json         # Backend dependencies & scripts
│   ├── package-lock.json    # Dependency lock file
│   └── server.js            # Main backend server entry point
│
├── rider-app-frontendapp/   # Frontend (React.js)
│   ├── node_modules/        # Frontend dependencies
│   ├── public/              # Static assets
│   ├── src/                 # React components & logic
│   ├── .env                 # Environment variables (ignored in Git)
│   ├── .gitignore           # Ignore frontend-specific files
│   ├── package.json         # Frontend dependencies & scripts
│   ├── package-lock.json    # Dependency lock file
│
└── README.md                # Project documentation

---

## ⚙️ Installation

### Clone Repo
git clone https://github.com/srujangandla/bunkride.git
cd bunkride

---

### Backend Setup
cd backend
npm install

Create .env file:

PORT=5000
JWT_SECRET=your_secret_key
GOOGLE_MAPS_API_KEY=your_api_key

Run backend:
node server.js

---

### Frontend Setup
cd frontend
npm install
npm start

Create .env file:

Upload your APi

---

## 🚀 Deployment

### Backend (Render)
- Add environment variables in dashboard
- Start command: node server.js

### Frontend (Vercel)
- Add:
REACT_APP_API_URL=https://your-backend-url.onrender.com

---

## 🔐 Important Notes

- Never commit .env files
- Use production backend URL instead of localhost
- Enable CORS in backend

---

## 📌 Future Improvements

- Payment integration
- OTP verification
- Driver dashboard
- Driver ratings
- Admin dashboard

---

## 📜 License

Educational use only
