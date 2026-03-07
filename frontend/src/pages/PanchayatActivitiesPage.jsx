import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  PlusCircle,
  FileText,
  CalendarDays,
  Sparkles,
  CheckCircle2,
  Clock3,
  PencilLine,
  MapPinned,
  Link2
} from "lucide-react";
import { authFetch } from "../services/authFetch";


const STATUS_OPTIONS = ["Planned", "In Progress", "Completed"];

function PanchayatActivitiesPage() {
  const navigate = useNavigate();
  const { villageCode } = useParams();

  const [panchayat, setPanchayat] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingNew, setSavingNew] = useState(false);
  const [savingEditId, setSavingEditId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [newActivity, setNewActivity] = useState({
    activity_text: "",
    status: "Planned",
    evidenceLink: ""
  });

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    activity_text: "",
    status: "Planned",
    evidenceLink: ""
  });

  useEffect(() => {
    loadPageData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [villageCode]);

  const loadPageData = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const [panchayatData, activitiesData] = await Promise.all([
        authFetch(`/panchayats/${villageCode}`),
       authFetch(`/activities/village/${villageCode}`)
      ]);

      setPanchayat(panchayatData);
      setActivities(Array.isArray(activitiesData) ? activitiesData : []);
    } catch (err) {
      setError(err.message || "Failed to load activities");
    } finally {
      setLoading(false);
    }
  };

  const activityCount = useMemo(() => activities.length, [activities]);

  const handleNewChange = (field, value) => {
    setNewActivity((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEditChange = (field, value) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddActivity = async (e) => {
    e.preventDefault();
    setSavingNew(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        villageCode: Number(villageCode),
        activity_text: newActivity.activity_text.trim(),
        status: newActivity.status,
        evidenceLink: newActivity.evidenceLink.trim()
      };

      if (!payload.activity_text) {
        throw new Error("Activity description is required");
      }

      const response = await authFetch("/activities", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      setSuccess(response?.message || "Activity added successfully");

      setNewActivity({
        activity_text: "",
        status: "Planned",
        evidenceLink: ""
      });

      await loadPageData();
    } catch (err) {
      setError(err.message || "Failed to add activity");
    } finally {
      setSavingNew(false);
    }
  };

  const startEditing = (activity) => {
    setEditingId(activity._id);
    setEditForm({
      activity_text: activity.activity_text || "",
      status: activity.status || "Planned",
      evidenceLink: activity.evidenceLink || ""
    });
    setError("");
    setSuccess("");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({
      activity_text: "",
      status: "Planned",
      evidenceLink: ""
    });
  };

  const handleUpdateActivity = async (activityId) => {
    setSavingEditId(activityId);
    setError("");
    setSuccess("");

    try {
      const payload = {
        activity_text: editForm.activity_text.trim(),
        status: editForm.status,
        evidenceLink: editForm.evidenceLink.trim()
      };

      if (!payload.activity_text) {
        throw new Error("Activity description is required");
      }

      const response = await authFetch(`/activities/${activityId}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });

      setSuccess(response?.message || "Activity updated successfully");
      setEditingId(null);

      await loadPageData();
    } catch (err) {
      setError(err.message || "Failed to update activity");
    } finally {
      setSavingEditId(null);
    }
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "Date unavailable";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "Date unavailable";
    return date.toLocaleString();
  };

  const getStatusClass = (status) => {
    const value = (status || "").toLowerCase();

    if (value === "completed") return "activity-status activity-status--completed";
    if (value === "in progress") return "activity-status activity-status--progress";
    return "activity-status activity-status--planned";
  };

  if (loading) {
    return (
      <div className="activities-shell">
        <div className="activities-loading-card">
          <div className="activities-spinner"></div>
          <h2>Loading Activities...</h2>
          <p>Please wait while we fetch this panchayat’s activity history.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="activities-shell">
      <div className="activities-orb activities-orb--one"></div>
      <div className="activities-orb activities-orb--two"></div>
      <div className="activities-grid-overlay"></div>

      <div className="activities-container">
        <button className="activities-back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
          Back
        </button>

        <section className="activities-hero">
          <div className="activities-hero-left">
            <div className="activities-badge">
              <Sparkles size={16} />
              SDG Activity Tracker
            </div>

            <h1>Manage Panchayat Activities</h1>
            <p>
              View existing activities, update them when needed, and add new
              activity records for this panchayat.
            </p>

            <div className="activities-location-card">
              <div className="activities-location-icon">
                <MapPinned size={20} />
              </div>
              <div>
                <h3>{panchayat?.villageName || "Village"}</h3>
                <p>
                  {panchayat?.blockName || "Block"}, {panchayat?.districtName || "District"}
                </p>
                <span>Village Code: {panchayat?.villageCode || villageCode}</span>
              </div>
            </div>
          </div>

          <div className="activities-hero-right">
            <div className="activities-stat-card">
              <FileText size={24} />
              <h3>{activityCount}</h3>
              <p>Total recorded activities</p>
            </div>
          </div>
        </section>

        <section className="activity-form-panel">
          <div className="section-head">
            <h2>Add New Activity</h2>
            <p>
              New activities are created with village code, activity text, status,
              and optional evidence link. 
            </p>
          </div>

          <form className="activity-form-grid" onSubmit={handleAddActivity}>
            <div className="activity-input-card activity-input-card--wide">
              <label>Activity Description</label>
              <textarea
                rows="4"
                placeholder="Describe the work done in the panchayat..."
                value={newActivity.activity_text}
                onChange={(e) => handleNewChange("activity_text", e.target.value)}
              />
            </div>

            <div className="activity-input-card">
              <label>Status</label>
              <select
                value={newActivity.status}
                onChange={(e) => handleNewChange("status", e.target.value)}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="activity-input-card">
              <label>Evidence Link</label>
              <input
                type="text"
                placeholder="Optional evidence URL"
                value={newActivity.evidenceLink}
                onChange={(e) => handleNewChange("evidenceLink", e.target.value)}
              />
            </div>

            <div className="activity-form-actions">
              <button className="activity-add-btn" type="submit" disabled={savingNew}>
                <PlusCircle size={18} />
                {savingNew ? "Adding..." : "Add Activity"}
              </button>
            </div>
          </form>
        </section>

        {error ? <div className="activity-message activity-message--error">{error}</div> : null}
        {success ? <div className="activity-message activity-message--success">{success}</div> : null}

        <section className="activity-list-panel">
          <div className="section-head">
            <h2>Existing Activities</h2>
            <p>
              This is to show all existing village activities 
            </p>
          </div>

          {activities.length === 0 ? (
            <div className="activity-empty-card">
              <FileText size={30} />
              <h3>No activities yet</h3>
              <p>Add the first activity for this panchayat.</p>
            </div>
          ) : (
            <div className="activity-list">
              {activities.map((activity) => {
                const isEditing = editingId === activity._id;

                return (
                  <div className="activity-item-card" key={activity._id}>
                    {isEditing ? (
                      <>
                        <div className="activity-edit-grid">
                          <div className="activity-input-card activity-input-card--wide">
                            <label>Edit Activity Description</label>
                            <textarea
                              rows="4"
                              value={editForm.activity_text}
                              onChange={(e) =>
                                handleEditChange("activity_text", e.target.value)
                              }
                            />
                          </div>

                          <div className="activity-input-card">
                            <label>Edit Status</label>
                            <select
                              value={editForm.status}
                              onChange={(e) => handleEditChange("status", e.target.value)}
                            >
                              {STATUS_OPTIONS.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="activity-input-card">
                            <label>Edit Evidence Link</label>
                            <input
                              type="text"
                              value={editForm.evidenceLink}
                              onChange={(e) =>
                                handleEditChange("evidenceLink", e.target.value)
                              }
                            />
                          </div>
                        </div>

                        <div className="activity-edit-actions">
                          <button
                            className="activity-save-btn"
                            type="button"
                            onClick={() => handleUpdateActivity(activity._id)}
                            disabled={savingEditId === activity._id}
                          >
                            <Save size={16} />
                            {savingEditId === activity._id ? "Saving..." : "Save Changes"}
                          </button>

                          <button
                            className="activity-cancel-btn"
                            type="button"
                            onClick={cancelEditing}
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="activity-item-top">
                          <div className="activity-item-title-wrap">
                            <h3>{activity.activity_text}</h3>
                            <span className={getStatusClass(activity.status)}>
                              {activity.status || "Planned"}
                            </span>
                          </div>

                          <button
                            className="activity-edit-btn"
                            type="button"
                            onClick={() => startEditing(activity)}
                          >
                            <PencilLine size={16} />
                            Edit
                          </button>
                        </div>

                        <div className="activity-meta-grid">
                          <div className="activity-meta">
                            <CalendarDays size={16} />
                            <span>{formatDate(activity.createdAt || activity.updatedAt)}</span>
                          </div>

                          <div className="activity-meta">
                            {activity.status === "Completed" ? (
                              <CheckCircle2 size={16} />
                            ) : (
                              <Clock3 size={16} />
                            )}
                            <span>{activity.createdBy || "User not shown"}</span>
                          </div>

                          <div className="activity-meta">
                            <Link2 size={16} />
                            <span>
                              {activity.evidenceLink ? activity.evidenceLink : "No evidence link"}
                            </span>
                          </div>
                        </div>

                        <div className="activity-mapping-box">
                          <p>
                            <strong>Mapped Indicator:</strong>{" "}
                            {activity.matched_indicator_code || "Not available"}
                          </p>
                          <p>
                            <strong>SDG Goal:</strong>{" "}
                            {activity.sdg_goal_number || "Not available"}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default PanchayatActivitiesPage;