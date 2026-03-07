import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "../pages/LandingPage";
import LoginPage from "../pages/LoginPage";
import DashboardPage from "../pages/DashboardPage";
import SDGFrameworkPage from "../pages/SDGFrameworkPage";
import LeaderboardPage from "../pages/LeaderboardPage";
import PanchayatProfilePage from "../pages/PanchayatProfilePage";
import ProtectedRoute from "./ProtectedRoute";
import PanchayatActivitiesPage from "../pages/PanchayatActivitiesPage";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/sdg-framework"
          element={
            <ProtectedRoute>
              <SDGFrameworkPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/leaderboard"
          element={
            <ProtectedRoute>
              <LeaderboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/panchayat/:villageCode/profile"
          element={
            <ProtectedRoute>
              <PanchayatProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
        path="/panchayat/:villageCode/activities"
        element={
        <ProtectedRoute>
           <PanchayatActivitiesPage />
        </ProtectedRoute>
        }
      />
      
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;