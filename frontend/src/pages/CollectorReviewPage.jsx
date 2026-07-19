import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  MapPinned,
  Building2,
  FileImage,
  AlertTriangle,
  Eye,
  Sparkles,
  RefreshCw
} from "lucide-react";
import { authFetch } from "../services/authFetch";
import "../styles/collectorReview.css";

function CollectorReviewPage() {
  const navigate = useNavigate();

  const [activities, setActivities] = useState([]);
  const [remarksMap, setRemarksMap] = useState({});
  const [submittingMap, setSubmittingMap] = useState({});
  const [expandedActivityId, setExpandedActivityId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || {};
    } catch {
      return {};
    }
  }, []);

  useEffect(() => {
    loadFlaggedActivities();
  }, []);

  const loadFlaggedActivities = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await authFetch("/collector-reviews/flagged");

      setActivities(
        Array.isArray(data)
          ? data
          : Array.isArray(data.activities)
            ? data.activities
            : []
      );
    } catch (err) {
      setError(err.message || "Failed to load flagged activities");
    } finally {
      setLoading(false);
    }
  };

  const handleRemarksChange = (activityId, value) => {
    setRemarksMap((previous) => ({
      ...previous,
      [activityId]: value
    }));
  };

  const handleDecision = async (activityId, decision) => {
    const remarks = remarksMap[activityId]?.trim();

    if (!remarks || remarks.length < 5) {
      setError("Please enter remarks containing at least 5 characters.");
      return;
    }

    const confirmationText =
      decision === "APPROVED"
        ? "Approve this activity?"
        : "Reject this activity?";

    const confirmed = window.confirm(confirmationText);

    if (!confirmed) {
      return;
    }

    try {
      setSubmittingMap((previous) => ({
        ...previous,
        [activityId]: true
      }));

      setError("");
      setSuccessMessage("");

      const response = await authFetch(
        `/collector-reviews/${activityId}/decision`,
        {
          method: "PUT",
          body: JSON.stringify({
            decision,
            remarks
          })
        }
      );

      setActivities((previous) =>
        previous.filter((activity) => activity._id !== activityId)
      );

      setRemarksMap((previous) => {
        const updated = { ...previous };
        delete updated[activityId];
        return updated;
      });

      if (expandedActivityId === activityId) {
        setExpandedActivityId(null);
      }

      setSuccessMessage(response.message || "Decision submitted successfully.");
    } catch (err) {
      setError(err.message || "Failed to submit collector decision");
    } finally {
      setSubmittingMap((previous) => ({
        ...previous,
        [activityId]: false
      }));
    }
  };

  const formatDate = (value) => {
    if (!value) {
      return "Date unavailable";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Date unavailable";
    }

    return date.toLocaleString();
  };

  const getScoreClass = (score) => {
    if (score >= 80) return "collector-score collector-score--high";
    if (score >= 50) return "collector-score collector-score--medium";
    return "collector-score collector-score--low";
  };

  const getEvidenceStatusClass = (status) => {
    if (
      status === "VERIFIED" ||
      status === "TEXT_SUPPORTED"
    ) {
      return "collector-evidence-status collector-evidence-status--verified";
    }

    if (
      status === "PARTIALLY_VERIFIED" ||
      status === "TEXT_PARTIALLY_SUPPORTED"
    ) {
      return "collector-evidence-status collector-evidence-status--partial";
    }

    return "collector-evidence-status collector-evidence-status--failed";
  };

  if (
    user.role !== "district_collector" &&
    user.role !== "admin"
  ) {
    return (
      <div className="simple-page">
        <h1>Access Denied</h1>
        <p>Only district collectors and administrators can access this page.</p>
        <button
          className="page-back-btn"
          onClick={() => navigate("/dashboard")}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-shell collector-review-page">
      <div className="page-topbar">
        <button
          className="page-back-btn"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>

        <button
          className="collector-refresh-btn"
          onClick={loadFlaggedActivities}
          disabled={loading}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      <section className="collector-review-hero">
        <div className="collector-review-hero__icon">
          <ShieldCheck size={30} />
        </div>

        <div>
          <h1>Collector Evidence Review</h1>
          <p>
            Review activities flagged by the AI verification system before
            approving or rejecting them.
          </p>
        </div>

        <div className="collector-review-count">
          <strong>{activities.length}</strong>
          <span>Pending Reviews</span>
        </div>
      </section>

      <section className="collector-scope-card">
        <div>
          <span>Collector</span>
          <strong>{user.username || "Collector"}</strong>
        </div>

        <div>
          <span>District Scope</span>
          <strong>{user.district || "All Districts"}</strong>
        </div>

        <div>
          <span>Role</span>
          <strong>{user.role || "-"}</strong>
        </div>
      </section>

      {successMessage && (
        <div className="collector-message collector-message--success">
          <CheckCircle2 size={18} />
          {successMessage}
        </div>
      )}

      {error && (
        <div className="collector-message collector-message--error">
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      {loading ? (
        <div className="simple-page">
          <h1>Loading Flagged Activities...</h1>
        </div>
      ) : activities.length === 0 ? (
        <section className="collector-empty-state">
          <CheckCircle2 size={46} />
          <h2>No Pending Reviews</h2>
          <p>
            All flagged activities in your district have already been reviewed.
          </p>
        </section>
      ) : (
        <section className="collector-review-list">
          {activities.map((activity) => {
            const activityId = activity._id;
            const isExpanded = expandedActivityId === activityId;
            const isSubmitting = submittingMap[activityId];

            const overallScore =
              activity.overallVerificationScore ??
              activity.overallVerification?.score ??
              0;

            return (
              <article className="collector-review-card" key={activityId}>
                <div className="collector-review-card__header">
                  <div>
                    <div className="collector-review-label">
                      <Sparkles size={16} />
                      AI Flagged Activity
                    </div>

                    <h2>
                      {activity.activity_text ||
                        activity.activityText ||
                        "Activity description unavailable"}
                    </h2>
                  </div>

                  <div className={getScoreClass(overallScore)}>
                    <strong>{overallScore}%</strong>
                    <span>Verification Score</span>
                  </div>
                </div>

                <div className="collector-location-grid">
                  <div>
                    <MapPinned size={18} />
                    <span>
                      <small>Panchayat</small>
                      <strong>{activity.villageName || "-"}</strong>
                    </span>
                  </div>

                  <div>
                    <Building2 size={18} />
                    <span>
                      <small>Block</small>
                      <strong>{activity.blockName || "-"}</strong>
                    </span>
                  </div>

                  <div>
                    <ShieldCheck size={18} />
                    <span>
                      <small>District</small>
                      <strong>{activity.districtName || "-"}</strong>
                    </span>
                  </div>
                </div>

                <div className="collector-review-summary-grid">
                  <div className="collector-summary-item">
                    <span>Mapped Indicator</span>
                    <strong>{activity.matched_indicator_code || "-"}</strong>
                  </div>

                  <div className="collector-summary-item">
                    <span>SDG Goal</span>
                    <strong>{activity.sdg_goal_number ?? "-"}</strong>
                  </div>

                  <div className="collector-summary-item">
                    <span>Status</span>
                    <strong>{activity.status || "Planned"}</strong>
                  </div>

                  <div className="collector-summary-item">
                    <span>Submitted</span>
                    <strong>{formatDate(activity.createdAt)}</strong>
                  </div>
                </div>

                <div className="collector-ai-summary">
                  <h3>AI Verification Summary</h3>
                  <p>
                    {activity.overallVerificationSummary ||
                      activity.overallVerification?.summary ||
                      "The AI system flagged this activity for manual verification."}
                  </p>
                </div>

                <button
                  className="collector-evidence-toggle"
                  onClick={() =>
                    setExpandedActivityId(
                      isExpanded ? null : activityId
                    )
                  }
                >
                  <Eye size={18} />
                  {isExpanded ? "Hide Evidence" : "Review Evidence"}
                </button>

                {isExpanded && (
                  <div className="collector-evidence-section">
                    <div className="collector-evidence-heading">
                      <FileImage size={20} />
                      <div>
                        <h3>Submitted Evidence</h3>
                        <p>
                          {activity.evidence?.length || 0} evidence file(s)
                          submitted
                        </p>
                      </div>
                    </div>

                    {activity.evidence?.length ? (
                      <div className="collector-evidence-grid">
                        {activity.evidence.map((evidence, index) => (
                          <div
                            className="collector-evidence-card"
                            key={`${activityId}-${index}`}
                          >
                            {evidence.fileUrl &&
                            evidence.fileType === "IMAGE" ? (
                              <a
                                href={evidence.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <img
                                  src={evidence.fileUrl}
                                  alt={
                                    evidence.originalName ||
                                    `Evidence ${index + 1}`
                                  }
                                />
                              </a>
                            ) : evidence.fileUrl ? (
                              <a
                                href={evidence.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="collector-document-link"
                              >
                                <FileImage size={34} />
                                Open Evidence File
                              </a>
                            ) : (
                              <div className="collector-evidence-placeholder">
                                Evidence preview unavailable
                              </div>
                            )}

                            <div className="collector-evidence-card__body">
                              <h4>
                                {evidence.originalName ||
                                  `Evidence ${index + 1}`}
                              </h4>

                              <div className="collector-evidence-tags">
                                <span
                                  className={getEvidenceStatusClass(
                                    evidence.verificationStatus
                                  )}
                                >
                                  {evidence.verificationStatus || "UNKNOWN"}
                                </span>

                                <span>
                                  Score:{" "}
                                  {evidence.finalEvidenceScore ??
                                    evidence.verificationScore ??
                                    0}
                                  %
                                </span>
                              </div>

                              <p>
                                {evidence.verificationSummary ||
                                  "No evidence summary available."}
                              </p>

                              {evidence.visibleElements?.length > 0 && (
                                <div className="collector-evidence-points">
                                  <strong>Visible elements</strong>
                                  <ul>
                                    {evidence.visibleElements.map(
                                      (element, elementIndex) => (
                                        <li key={elementIndex}>{element}</li>
                                      )
                                    )}
                                  </ul>
                                </div>
                              )}

                              {evidence.verificationLimitations?.length > 0 && (
                                <div className="collector-evidence-points">
                                  <strong>Limitations</strong>
                                  <ul>
                                    {evidence.verificationLimitations.map(
                                      (limitation, limitationIndex) => (
                                        <li key={limitationIndex}>
                                          {limitation}
                                        </li>
                                      )
                                    )}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p>No evidence files are available.</p>
                    )}
                  </div>
                )}

                <div className="collector-decision-section">
                  <label htmlFor={`remarks-${activityId}`}>
                    Collector Remarks
                  </label>

                  <textarea
                    id={`remarks-${activityId}`}
                    value={remarksMap[activityId] || ""}
                    onChange={(event) =>
                      handleRemarksChange(activityId, event.target.value)
                    }
                    placeholder="Enter the reason for approving or rejecting this activity..."
                    rows={4}
                    disabled={isSubmitting}
                  />

                  <div className="collector-decision-actions">
                    <button
                      className="collector-decision-btn collector-decision-btn--approve"
                      onClick={() =>
                        handleDecision(activityId, "APPROVED")
                      }
                      disabled={isSubmitting}
                    >
                      <CheckCircle2 size={19} />
                      {isSubmitting ? "Submitting..." : "Approve Activity"}
                    </button>

                    <button
                      className="collector-decision-btn collector-decision-btn--reject"
                      onClick={() =>
                        handleDecision(activityId, "REJECTED")
                      }
                      disabled={isSubmitting}
                    >
                      <XCircle size={19} />
                      {isSubmitting ? "Submitting..." : "Reject Activity"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}

export default CollectorReviewPage;