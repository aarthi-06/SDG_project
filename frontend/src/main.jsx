import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App.jsx'

import "./styles/global.css";
import "./styles/landing.css";
import "./styles/login.css";
import "./styles/dashboard.css";
import "./styles/panchayatProfile.css";
import "./styles/panchayatActivities.css";
import "./styles/leaderBoard.css";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
