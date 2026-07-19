import { useEffect, useMemo, useRef, useState } from "react";
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
  UploadCloud,
  X,
  Eye,
  ExternalLink,
  Image as ImageIcon,
  File,
  ShieldCheck,
  AlertTriangle
} from "lucide-react";
import { authFetch } from "../services/authFetch";
import "../styles/panchayatActivities.css"

const STATUS_OPTIONS = ["Planned", "In Progress", "Completed"];

const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf"
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILES = 5;

function PanchayatActivitiesPage() {
  const navigate = useNavigate();
  const { villageCode } = useParams();
  const fileInputRef = useRef(null);

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
    evidenceFiles: []
  });

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    activity_text: "",
    status: "Planned"
  });

  const getDisplayVerification = (activity) => {
  if (
    activity.reviewStatus === "COLLECTOR_APPROVED" ||
    activity.collectorDecision === "APPROVED"
  ) {
    return {
      label: "Collector Approved",
      className: "collector-approved"
    };
  }

  if (
    activity.reviewStatus === "COLLECTOR_REJECTED" ||
    activity.collectorDecision === "REJECTED"
  ) {
    return {
      label: "Collector Rejected",
      className: "collector-rejected"
    };
  }

  const verificationStatus =
    activity.overallVerificationStatus || "PENDING";

  const normalizedStatus = verificationStatus
    .replace(/_/g, " ")
    .toLowerCase();

  return {
    label: normalizedStatus.replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    ),
    className: verificationStatus
      .toLowerCase()
      .replace(/_/g, "-")
  };
};

  useEffect(() => {
    loadPageData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [villageCode]);

  const loadPageData = async () => {
    try {
      setLoading(true);
      setError("");

      const [panchayatData, activitiesData] = await Promise.all([
        authFetch(`/panchayats/${villageCode}`),
        authFetch(`/activities/village/${villageCode}`)
      ]);

      setPanchayat(panchayatData);

      const activityList = Array.isArray(activitiesData)
        ? activitiesData
        : activitiesData?.activities || [];

      setActivities(activityList);
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

  const validateFiles = (files) => {
    if (files.length > MAX_FILES) {
      throw new Error(`Maximum ${MAX_FILES} evidence files are allowed`);
    }

    files.forEach((file) => {
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        throw new Error(
          `${file.name} is not supported. Upload JPG, PNG, WEBP or PDF files`
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        throw new Error(`${file.name} exceeds the 10 MB limit`);
      }
    });
  };

  const handleEvidenceSelection = (event) => {
    setError("");
    setSuccess("");

    try {
      const selectedFiles = Array.from(event.target.files || []);
      const combinedFiles = [
        ...newActivity.evidenceFiles,
        ...selectedFiles
      ];

      const uniqueFiles = combinedFiles.filter(
        (file, index, files) =>
          index ===
          files.findIndex(
            (item) =>
              item.name === file.name &&
              item.size === file.size &&
              item.lastModified === file.lastModified
          )
      );

      validateFiles(uniqueFiles);

      setNewActivity((prev) => ({
        ...prev,
        evidenceFiles: uniqueFiles
      }));
    } catch (err) {
      setError(err.message || "Unable to select evidence files");
    } finally {
      event.target.value = "";
    }
  };

  const removeSelectedFile = (indexToRemove) => {
    setNewActivity((prev) => ({
      ...prev,
      evidenceFiles: prev.evidenceFiles.filter(
        (_, index) => index !== indexToRemove
      )
    }));
  };

  const formatFileSize = (bytes) => {
    if (bytes === null || bytes === undefined) return "";

    if (bytes < 1024) return `${bytes} B`;

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleAddActivity = async (event) => {
    event.preventDefault();

    setSavingNew(true);
    setError("");
    setSuccess("");

    try {
      const activityText = newActivity.activity_text.trim();

      if (!activityText) {
        throw new Error("Activity description is required");
      }

      validateFiles(newActivity.evidenceFiles);

      const formData = new FormData();

      formData.append("villageCode", String(Number(villageCode)));
      formData.append("activity_text", activityText);
      formData.append("status", newActivity.status);

      newActivity.evidenceFiles.forEach((file) => {
        formData.append("evidence", file);
      });

      const response = await authFetch("/activities", {
        method: "POST",
        body: formData
      });

      setNewActivity({
        activity_text: "",
        status: "Planned",
        evidenceFiles: []
      });

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      await loadPageData();

      setSuccess(response?.message || "Activity added successfully");
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
      status: activity.status || "Planned"
    });

    setError("");
    setSuccess("");
  };

  const cancelEditing = () => {
    setEditingId(null);

    setEditForm({
      activity_text: "",
      status: "Planned"
    });
  };

  const handleUpdateActivity = async (activityId) => {
    setSavingEditId(activityId);
    setError("");
    setSuccess("");

    try {
      const payload = {
        activity_text: editForm.activity_text.trim(),
        status: editForm.status
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

    if (Number.isNaN(date.getTime())) {
      return "Date unavailable";
    }

    return date.toLocaleString();
  };

  const getStatusClass = (status) => {
    const value = String(status || "").toLowerCase();

    if (value === "completed") {
      return "activity-status activity-status--completed";
    }

    if (value === "in progress") {
      return "activity-status activity-status--progress";
    }

    return "activity-status activity-status--planned";
  };

  const getEvidenceList = (activity) => {
    if (Array.isArray(activity?.evidence)) {
      return activity.evidence;
    }

    if (Array.isArray(activity?.evidenceFiles)) {
      return activity.evidenceFiles;
    }

    return [];
  };

  const getEvidenceUrl = (evidence) =>
    evidence?.fileUrl ||
    evidence?.url ||
    evidence?.secure_url ||
    evidence?.path ||
    "";

  const getEvidenceName = (evidence, index) =>
    evidence?.originalName ||
    evidence?.originalname ||
    evidence?.fileName ||
    evidence?.filename ||
    `Evidence ${index + 1}`;

  const getEvidenceType = (evidence) =>
    evidence?.fileType ||
    evidence?.mimeType ||
    evidence?.mimetype ||
    "";

  const isImageEvidence = (evidence) => {
    const fileType = String(getEvidenceType(evidence)).toLowerCase();
    const fileUrl = String(getEvidenceUrl(evidence)).toLowerCase();

    return (
      fileType.startsWith("image/") ||
      /\.(jpg|jpeg|png|webp)(\?.*)?$/.test(fileUrl)
    );
  };

  const getVerificationStatus = (activity) =>
    activity?.overallVerificationStatus ||
    activity?.verificationStatus ||
    activity?.reviewStatus ||
    "";

  const getReadableVerificationStatus = (status) =>
    String(status || "")
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());

  if (loading) {
    return (
      <div className="activities-shell">
        <div className="activities-loading-card">
          <div className="activities-spinner"></div>
          <h2>Loading Activities...</h2>
          <p>Please wait while we fetch this panchayat&apos;s activity history.</p>
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
        <button
          className="activities-back-btn"
          type="button"
          onClick={() => navigate(-1)}
        >
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
              Add development activities, upload supporting evidence and review
              existing activity records for this panchayat.
            </p>

            <div className="activities-location-card">
              <div className="activities-location-icon">
                <MapPinned size={20} />
              </div>

              <div>
                <h3>{panchayat?.villageName || "Village"}</h3>

                <p>
                  {panchayat?.blockName || "Block"},{" "}
                  {panchayat?.districtName || "District"}
                </p>

                <span>
                  Village Code: {panchayat?.villageCode || villageCode}
                </span>
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
              Add the activity details and upload supporting images or PDF
              evidence.
            </p>
          </div>

          <form className="activity-form-grid" onSubmit={handleAddActivity}>
            <div className="activity-input-card activity-input-card--wide">
              <label htmlFor="activity-description">
                Activity Description
              </label>

              <textarea
                id="activity-description"
                rows="4"
                placeholder="Describe the work done in the panchayat..."
                value={newActivity.activity_text}
                onChange={(event) =>
                  handleNewChange("activity_text", event.target.value)
                }
                disabled={savingNew}
              />
            </div>

            <div className="activity-input-card">
              <label htmlFor="activity-status">Status</label>

              <select
                id="activity-status"
                value={newActivity.status}
                onChange={(event) =>
                  handleNewChange("status", event.target.value)
                }
                disabled={savingNew}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="activity-input-card activity-input-card--wide">
              <label>Supporting Evidence</label>

              <div
                className="activity-upload-zone"
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    fileInputRef.current?.click();
                  }
                }}
              >
                <UploadCloud size={30} />

                <div>
                  <h3>Select Evidence Files</h3>
                  <p>
                    Upload up to {MAX_FILES} JPG, PNG, WEBP or PDF files.
                    Maximum 10 MB each.
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.pdf"
                  multiple
                  hidden
                  onChange={handleEvidenceSelection}
                  disabled={savingNew}
                />
              </div>

              {newActivity.evidenceFiles.length > 0 && (
                <div className="activity-selected-files">
                  {newActivity.evidenceFiles.map((file, index) => (
                    <div
                      className="activity-selected-file"
                      key={`${file.name}-${file.lastModified}`}
                    >
                      <div className="activity-selected-file-icon">
                        {file.type.startsWith("image/") ? (
                          <ImageIcon size={18} />
                        ) : (
                          <File size={18} />
                        )}
                      </div>

                      <div className="activity-selected-file-info">
                        <strong>{file.name}</strong>
                        <span>{formatFileSize(file.size)}</span>
                      </div>

                      <button
                        type="button"
                        className="activity-remove-file-btn"
                        onClick={() => removeSelectedFile(index)}
                        disabled={savingNew}
                        aria-label={`Remove ${file.name}`}
                      >
                        <X size={17} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="activity-form-actions">
              <button
                className="activity-add-btn"
                type="submit"
                disabled={savingNew}
              >
                <PlusCircle size={18} />
                {savingNew ? "Uploading..." : "Add Activity"}
              </button>
            </div>
          </form>
        </section>

        {error && (
          <div className="activity-message activity-message--error">
            <AlertTriangle size={18} />
            {error}
          </div>
        )}

        {success && (
          <div className="activity-message activity-message--success">
            <CheckCircle2 size={18} />
            {success}
          </div>
        )}

        <section className="activity-list-panel">
          <div className="section-head">
            <h2>Existing Activities</h2>
            <p>All existing activity records for this village are shown below.</p>
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
                const evidenceList = getEvidenceList(activity);
                const verificationStatus = getVerificationStatus(activity);
                const verificationDisplay =getDisplayVerification(activity);

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
                              onChange={(event) =>
                                handleEditChange(
                                  "activity_text",
                                  event.target.value
                                )
                              }
                              disabled={savingEditId === activity._id}
                            />
                          </div>

                          <div className="activity-input-card">
                            <label>Edit Status</label>

                            <select
                              value={editForm.status}
                              onChange={(event) =>
                                handleEditChange("status", event.target.value)
                              }
                              disabled={savingEditId === activity._id}
                            >
                              {STATUS_OPTIONS.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="activity-edit-actions">
                          <button
                            className="activity-save-btn"
                            type="button"
                            onClick={() =>
                              handleUpdateActivity(activity._id)
                            }
                            disabled={savingEditId === activity._id}
                          >
                            <Save size={16} />
                            {savingEditId === activity._id
                              ? "Saving..."
                              : "Save Changes"}
                          </button>

                          <button
                            className="activity-cancel-btn"
                            type="button"
                            onClick={cancelEditing}
                            disabled={savingEditId === activity._id}
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

                            <div className="activity-badge-row">
                              <span className={getStatusClass(activity.status)}>
                                {activity.status || "Planned"}
                              </span>

                              {verificationStatus && (
                                <span
  className={`verification-badge ${verificationDisplay.className}`}
>
  <ShieldCheck size={13} />
  {verificationDisplay.label}
</span>
                              )}
                            </div>
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
                            <span>
                              {formatDate(
                                activity.createdAt || activity.updatedAt
                              )}
                            </span>
                          </div>

                          <div className="activity-meta">
                            {activity.status === "Completed" ? (
                              <CheckCircle2 size={16} />
                            ) : (
                              <Clock3 size={16} />
                            )}

                            <span>
                              {activity.createdBy?.username ||
                                activity.createdBy?.name ||
                                activity.createdBy ||
                                "User not shown"}
                            </span>
                          </div>

                          <div className="activity-meta">
                            <FileText size={16} />
                            <span>
                              {evidenceList.length} evidence{" "}
                              {evidenceList.length === 1 ? "file" : "files"}
                            </span>
                          </div>
                        </div>

                        <div className="activity-mapping-box">
                          <p>
                            <strong>Mapped Indicator:</strong>{" "}
                            {activity.matched_indicator_code ||
                              activity.matchedIndicatorCode ||
                              activity.indicatorCode ||
                              "Not available"}
                          </p>

                          <p>
                            <strong>SDG Goal:</strong>{" "}
                            {activity.sdg_goal_number ||
                              activity.sdgGoalNumber ||
                              activity.sdgGoal ||
                              "Not available"}
                          </p>
                        </div>

                        {evidenceList.length > 0 && (
  <div className="activity-evidence-section">
    <div className="evidence-section-header">
      <div>
        <h4>Uploaded Evidence</h4>
        <p>
          View the supporting files submitted for this activity.
        </p>
      </div>

      <span className="evidence-count-badge">
        {evidenceList.length}{" "}
        {evidenceList.length === 1 ? "File" : "Files"}
      </span>
    </div>

    <div className="evidence-grid">
      {evidenceList.map((evidence, evidenceIndex) => {
        const fileUrl =
          evidence.fileUrl ||
          evidence.url ||
          evidence.secure_url ||
          null;

        const fileName =
          evidence.originalName ||
          evidence.filename ||
          `Evidence ${evidenceIndex + 1}`;

        const mimeType =
          evidence.mimeType ||
          evidence.fileType ||
          "";

        const isImage =
          mimeType.startsWith("image/") ||
          /\.(jpg|jpeg|png|webp)$/i.test(fileName);

        const isPdf =
          mimeType === "application/pdf" ||
          /\.pdf$/i.test(fileName);

        return (
          <div
            className="evidence-card"
            key={`${fileName}-${evidenceIndex}`}
          >
            <div className="evidence-preview">
              {isImage && fileUrl ? (
                <img
                  src={fileUrl}
                  alt={fileName}
                  loading="lazy"
                />
              ) : (
                <div className="evidence-file-placeholder">
                  {isPdf ? (
                    <FileText size={38} />
                  ) : (
                    <File size={38} />
                  )}

                  <span>
                    {isPdf ? "PDF Document" : "Evidence File"}
                  </span>
                </div>
              )}
            </div>

            <div className="evidence-card-content">
              <div className="evidence-file-icon">
                {isImage ? (
                  <ImageIcon size={20} />
                ) : (
                  <FileText size={20} />
                )}
              </div>

              <div className="evidence-file-details">
                <strong title={fileName}>
                  {fileName}
                </strong>

                <span>
                  {isImage
                    ? "Image evidence"
                    : isPdf
                      ? "PDF document"
                      : "Supporting document"}
                </span>
              </div>
            </div>

            {fileUrl ? (
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="view-evidence-button"
              >
                <Eye size={17} />
                View Evidence
                <ExternalLink size={15} />
              </a>
            ) : (
              <button
                type="button"
                className="view-evidence-button unavailable"
                disabled
              >
                File unavailable
              </button>
            )}
          </div>
        );
      })}
    </div>
  </div>
)}




                        
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