import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch } from "../services/authFetch";
import { ArrowLeft, Trophy, Medal, Award, BarChart3, MapPinned } from "lucide-react";

function LeaderboardPage() {
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const data = await authFetch("/leaderboard");
      setLeaderboard(data);
    } catch (err) {
      setError(err.message || "Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  };

  const topThree = useMemo(() => leaderboard.slice(0, 3), [leaderboard]);

  const getRankIcon = (rank) => {
    if (rank === 1) return <Trophy size={22} />;
    if (rank === 2) return <Medal size={22} />;
    return <Award size={22} />;
  };

  const getPodiumClass = (rank) => {
    if (rank === 1) return "podium-card podium-card--gold";
    if (rank === 2) return "podium-card podium-card--silver";
    return "podium-card podium-card--bronze";
  };

  const formatScorePercent = (score) => `${Math.round((score || 0) * 100)}%`;

  if (loading) {
    return (
      <div className="simple-page">
        <h1>Loading Leaderboard...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div className="simple-page">
        <h1>Leaderboard Error</h1>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="dashboard-shell leaderboard-page">
      <div className="page-topbar">
        <button className="page-back-btn" onClick={() => navigate("/dashboard")}>
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>
      </div>

      <section className="dashboard-section-head leaderboard-head">
        <h2>District Leaderboard</h2>
        <p>
          Panchayat rankings based on mapped SDG indicator coverage and recorded development activities.
        </p>
      </section>

      <section className="leaderboard-summary-strip">
        <div className="leaderboard-summary-card">
          <BarChart3 size={22} />
          <div>
            <h3>{leaderboard.length}</h3>
            <p>Total Ranked Panchayats</p>
          </div>
        </div>

        <div className="leaderboard-summary-card">
          <Trophy size={22} />
          <div>
            <h3>{leaderboard[0]?.villageName || "-"}</h3>
            <p>Current Leader</p>
          </div>
        </div>

        <div className="leaderboard-summary-card">
          <MapPinned size={22} />
          <div>
            <h3>{leaderboard[0] ? formatScorePercent(leaderboard[0].score) : "0%"}</h3>
            <p>Top Score</p>
          </div>
        </div>
      </section>

      {topThree.length > 0 && (
        <section className="leaderboard-podium">
          {topThree.map((item) => (
            <div className={getPodiumClass(item.rank)} key={item.villageCode}>
              <div className="podium-rank-badge">
                {getRankIcon(item.rank)}
                <span>Rank #{item.rank}</span>
              </div>

              <h3>{item.villageName}</h3>
              <p className="podium-block">
                {item.blockName}, {item.districtName}
              </p>

              <div className="podium-stats">
                <div>
                  <span>Activities</span>
                  <strong>{item.totalActivities}</strong>
                </div>
                <div>
                  <span>Indicators</span>
                  <strong>{item.uniqueIndicatorsCovered}</strong>
                </div>
                <div>
                  <span>Score</span>
                  <strong>{formatScorePercent(item.score)}</strong>
                </div>
              </div>

              <div className="leaderboard-progress">
                <div
                  className="leaderboard-progress-bar"
                  style={{ width: formatScorePercent(item.score) }}
                ></div>
              </div>
            </div>
          ))}
        </section>
      )}

      <section className="leaderboard-list-section">
        <div className="leaderboard-list-head">
          <h3>Complete Rankings</h3>
          <p>All panchayats ranked in descending order of performance.</p>
        </div>

        <div className="leaderboard-list">
          {leaderboard.map((item) => (
            <div className="leaderboard-row-card" key={item.villageCode}>
              <div className="leaderboard-row-left">
                <div className="leaderboard-row-rank">#{item.rank}</div>
                <div>
                  <h4>{item.villageName}</h4>
                  <p>
                    {item.blockName}, {item.districtName}
                  </p>
                </div>
              </div>

              <div className="leaderboard-row-metrics">
                <div className="leaderboard-metric">
                  <span>Activities</span>
                  <strong>{item.totalActivities}</strong>
                </div>
                <div className="leaderboard-metric">
                  <span>Indicators</span>
                  <strong>{item.uniqueIndicatorsCovered}</strong>
                </div>
                <div className="leaderboard-metric leaderboard-metric--score">
                  <span>Score</span>
                  <strong>{formatScorePercent(item.score)}</strong>
                </div>
              </div>

              <div className="leaderboard-progress leaderboard-progress--row">
                <div
                  className="leaderboard-progress-bar"
                  style={{ width: formatScorePercent(item.score) }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        {leaderboard.length === 0 && (
          <div className="simple-page">
            <h1>No Rankings Yet</h1>
            <p>Add activities first to generate leaderboard scores.</p>
          </div>
        )}
      </section>
    </div>
  );
}

export default LeaderboardPage;