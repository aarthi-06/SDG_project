
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch } from "../services/authFetch";
import {
  ArrowLeft,
  Trophy,
  Medal,
  Award,
  BarChart3,
  MapPinned,
  ChevronDown,
  ChevronUp,
  Target,
  CircleCheckBig,
  AlertTriangle,
  Lightbulb,
  FileText
} from "lucide-react";

function LeaderboardPage() {
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [expandedVillageCode, setExpandedVillageCode] = useState(null);
  const [detailsMap, setDetailsMap] = useState({});
  const [detailsLoadingMap, setDetailsLoadingMap] = useState({});

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const data = await authFetch("/leaderboard");
      setLeaderboard(data);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  };

  const loadLeaderboardDetails = async (villageCode) => {
    try {
      setDetailsLoadingMap((prev) => ({
        ...prev,
        [villageCode]: true
      }));

      const data = await authFetch(`/leaderboard/${villageCode}/details`);

      setDetailsMap((prev) => ({
        ...prev,
        [villageCode]: data
      }));
    } catch (err) {
      setDetailsMap((prev) => ({
        ...prev,
        [villageCode]: {
          error: err.message || "Failed to load details"
        }
      }));
    } finally {
      setDetailsLoadingMap((prev) => ({
        ...prev,
        [villageCode]: false
      }));
    }
  };

  const handleToggleDetails = async (villageCode) => {
    if (expandedVillageCode === villageCode) {
      setExpandedVillageCode(null);
      return;
    }

    setExpandedVillageCode(villageCode);

    if (!detailsMap[villageCode]) {
      await loadLeaderboardDetails(villageCode);
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

  const formatDate = (value) => {
    if (!value) return "Date unavailable";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Date unavailable";
    return date.toLocaleString();
  };

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
          Panchayat rankings based on mapped SDG indicator coverage and recorded
          development activities.
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
          <p>Click a panchayat to view covered indicators, activities, and gaps.</p>
        </div>

        <div className="leaderboard-list">
          {leaderboard.map((item) => {
            const isExpanded = expandedVillageCode === item.villageCode;
            const details = detailsMap[item.villageCode];
            const isDetailsLoading = detailsLoadingMap[item.villageCode];

            return (
              <div className="leaderboard-row-wrap" key={item.villageCode}>
                <div className="leaderboard-row-card">
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

                  <button
                    className="leaderboard-expand-btn"
                    onClick={() => handleToggleDetails(item.villageCode)}
                  >
                    {isExpanded ? (
                      <>
                        Hide Details <ChevronUp size={18} />
                      </>
                    ) : (
                      <>
                        View Details <ChevronDown size={18} />
                      </>
                    )}
                  </button>
                </div>

                {isExpanded && (
                  <div className="leaderboard-details-panel">
                    {isDetailsLoading ? (
                      <div className="leaderboard-details-loading">
                        <h4>Loading details...</h4>
                        <p>Please wait while we fetch indicator and activity breakdown.</p>
                      </div>
                    ) : details?.error ? (
                      <div className="leaderboard-details-error">
                        <h4>Could not load details</h4>
                        <p>{details.error}</p>
                      </div>
                    ) : (
                      <>
                        <div className="leaderboard-insight-box">
                          <Lightbulb size={18} />
                          <div>
                            <h4>Performance Insight</h4>
                            <p>{details?.insight || "No insight available."}</p>
                          </div>
                        </div>

                        <div className="leaderboard-chip-section">
                          <h4>SDG Goals Covered</h4>
                          <div className="leaderboard-chip-wrap">
                            {details?.sdgGoalsCovered?.length ? (
                              details.sdgGoalsCovered.map((goal) => (
                                <span className="leaderboard-chip" key={goal}>
                                  SDG {goal}
                                </span>
                              ))
                            ) : (
                              <span className="leaderboard-empty-inline">
                                No SDG goals mapped yet
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="leaderboard-details-grid">
                          <div className="leaderboard-detail-card">
                            <div className="leaderboard-detail-head">
                              <CircleCheckBig size={18} />
                              <h4>Covered Indicators</h4>
                            </div>

                            {details?.coveredIndicators?.length ? (
                              <div className="leaderboard-detail-list">
                                {details.coveredIndicators.map((indicator) => (
                                  <div
                                    className="leaderboard-detail-item"
                                    key={indicator.indicator_code}
                                  >
                                    <strong>{indicator.indicator_code}</strong>
                                    <p>{indicator.indicator_description}</p>
                                    <span>SDG {indicator.sdg_goal_number ?? "-"}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="leaderboard-empty-text">
                                No covered indicators yet.
                              </p>
                            )}
                          </div>

                          <div className="leaderboard-detail-card">
                            <div className="leaderboard-detail-head">
                              <AlertTriangle size={18} />
                              <h4>Missing Indicators</h4>
                            </div>

                            {details?.missingIndicators?.length ? (
                              <div className="leaderboard-detail-list leaderboard-detail-list--compact">
                                {details.missingIndicators.map((indicator) => (
                                  <div
                                    className="leaderboard-detail-item"
                                    key={indicator.indicator_code}
                                  >
                                    <strong>{indicator.indicator_code}</strong>
                                    <p>{indicator.indicator_description}</p>
                                    <span>SDG {indicator.sdg_goal_number ?? "-"}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="leaderboard-empty-text">
                                No missing indicators.
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="leaderboard-detail-card leaderboard-detail-card--full">
                          <div className="leaderboard-detail-head">
                            <FileText size={18} />
                            <h4>Mapped Activities</h4>
                          </div>

                          {details?.activities?.length ? (
                            <div className="leaderboard-activity-list">
                              {details.activities.map((activity) => (
                                <div className="leaderboard-activity-item" key={activity._id}>
                                  <div className="leaderboard-activity-top">
                                    <h5>{activity.activity_text}</h5>
                                    <span className="leaderboard-activity-status">
                                      {activity.status}
                                    </span>
                                  </div>

                                  <div className="leaderboard-activity-meta">
                                    <span>
                                      <strong>Indicator:</strong>{" "}
                                      {activity.matched_indicator_code || "-"}
                                    </span>
                                    <span>
                                      <strong>SDG:</strong>{" "}
                                      {activity.sdg_goal_number ?? "-"}
                                    </span>
                                    <span>
                                      <strong>Updated:</strong>{" "}
                                      {formatDate(activity.updatedAt || activity.createdAt)}
                                    </span>
                                  </div>

                                  {activity.evidenceLink ? (
                                    <a
                                      href={activity.evidenceLink}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="leaderboard-evidence-link"
                                    >
                                      View Evidence
                                    </a>
                                  ) : (
                                    <p className="leaderboard-no-link">No evidence link</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="leaderboard-empty-text">
                              No activities found for this panchayat.
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
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