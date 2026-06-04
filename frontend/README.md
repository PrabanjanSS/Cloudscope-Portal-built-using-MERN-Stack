# 🌤️ CloudScope Portal

Welcome to the **CloudScope Portal**—a full-stack MERN (MongoDB, Express, React, Node.js) single-page application. This platform integrates a real-time Weather Engine(using api from openweathermap), an interactive AI companion (**SkyBot** via Google Gemini), and a secure, permission-locked Peer-to-Peer Social Sync Chat.

---

## 🏗️ Project Structure

The repository is divided into two decoupled, fully independent root directories:
* `backend/` - Node.js & Express REST API microservices + Mongoose data layers (Running on port `5003`).
* `frontend/` - React SPA user interface + Axios state managers (Running on port `3000`).

---

## ⚙️ Prerequisites

Before launching the ecosystem, ensure your machine has the following frameworks installed globally:
* **Node.js** (v18.x or higher recommended)
* **npm** (Node Package Manager)
* A running **MongoDB Atlas** Cloud Cluster or Local MongoDB Instance.

---

## 🛠️ Step 1: Backend Installation & Setup

1. Open your terminal window and navigate into the backend folder:
   ```bash
   cd backend
Install all core dependencies, database drivers, and cryptographic modules:
Bash
npm install
Create a .env configuration file directly inside the backend/ directory:
Bash
touch .env
Open the .env file in your text editor and append your environmental keys exactly like this (replace the placeholder values with your real keys):
Code snippet
PORT=5003
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/cloudscope
JWT_SECRET=your_super_secure_random_jwt_secret_key_123
OPENWEATHER_API_KEY=your_openweather_api_key_here
GEMINI_API_KEY=your_google_gemini_api_key_here
> Note: Ensure there are no accidental spaces or quotation marks around your API keys or database strings.
🎨 Step 2: Frontend Installation & Setup
Open a new, separate terminal window, return to the root folder, and navigate into the frontend directory:
Bash
cd frontend
Install the React framework UI components, router configs, and client HTTP networks:
Bash
npm install
🚀 Step 3: Running the Application
To run the application, both your backend server data stream and frontend web components must run simultaneously in separate terminals.
1. Fire up the Backend API
In your backend terminal (backend/), start your development process engine. This script uses a watch monitoring tool to auto-reload whenever you save structural file changes:
Bash
npm run dev
You should see verification readouts inside your console indicating that the server has booted onto port 5003 and successfully connected to your MongoDB cloud network.
2. Launch the React Web Client
In your frontend terminal (frontend/), execute the development build command:
Bash
npm start
This script compiles your React state tree, handles asset pipelines, and automatically opens your browser window to your local interface path: http://localhost:3000.