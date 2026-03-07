import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Building2,
  Droplets,
  School,
  HeartPulse,
  House,
  MapPinned,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { authFetch } from "../services/authFetch";


const AREA_TAG_OPTIONS = [
  "Tribal",
  "Coastal",
  "Hilly",
  "Water-scarce",
  "Flood-prone",
  "Urban-fringe"
];

const POPULATION_OPTIONS = ["<2k", "2-5k", "5-10k", ">10k"];
const COVERAGE_OPTIONS = ["Low", "Medium", "High"];

function PanchayatProfilePage() {
  const navigate = useNavigate();
  const { villageCode } = useParams();

  const [panchayat, setPanchayat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    populationBand: "",
    areaTypeTags: [],
    topLocalProblems: ["", "", ""],
    phcAvailable: false,
    governmentSchoolAvailable: false,
    anganwadiAvailable: false,
    tapWaterCoverage: "",
    toiletCoverage: ""
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

      const [panchayatData, profileData] = await Promise.all([
        authFetch(`/panchayats/${villageCode}`),
        authFetch(`/profiles/${villageCode}`)
      ]);

      setPanchayat(panchayatData);

      if (
        !profileData ||
        profileData?.profile === null ||
        profileData?.message === "No profile found yet"
      ) {
        return;
      }

      setFormData({
        populationBand: profileData.populationBand || "",
        areaTypeTags: Array.isArray(profileData.areaTypeTags)
          ? profileData.areaTypeTags
          : [],
        topLocalProblems: [
          profileData.topLocalProblems?.[0] || "",
          profileData.topLocalProblems?.[1] || "",
          profileData.topLocalProblems?.[2] || ""
        ],
        phcAvailable: Boolean(profileData.phcAvailable),
        governmentSchoolAvailable: Boolean(profileData.governmentSchoolAvailable),
        anganwadiAvailable: Boolean(profileData.anganwadiAvailable),
        tapWaterCoverage: profileData.tapWaterCoverage || "",
        toiletCoverage: profileData.toiletCoverage || ""
      });
    } catch (err) {
      setError(err.message || "Failed to load panchayat profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleProblemChange = (index, value) => {
    const updated = [...formData.topLocalProblems];
    updated[index] = value;
    setFormData((prev) => ({
      ...prev,
      topLocalProblems: updated
    }));
  };

  const handleAreaTagToggle = (tag) => {
    const exists = formData.areaTypeTags.includes(tag);

    if (exists) {
      handleChange(
        "areaTypeTags",
        formData.areaTypeTags.filter((item) => item !== tag)
      );
    } else {
      handleChange("areaTypeTags", [...formData.areaTypeTags, tag]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        populationBand: formData.populationBand || null,
        areaTypeTags: formData.areaTypeTags || [],
        topLocalProblems: formData.topLocalProblems
          .map((item) => item.trim())
          .filter(Boolean),
        phcAvailable: formData.phcAvailable,
        governmentSchoolAvailable: formData.governmentSchoolAvailable,
        anganwadiAvailable: formData.anganwadiAvailable,
        tapWaterCoverage: formData.tapWaterCoverage || null,
        toiletCoverage: formData.toiletCoverage || null
      };

      const response = await authFetch(`/profiles/${villageCode}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });

      setSuccess(response?.message || "Profile saved successfully");
    } catch (err) {
      setError(err.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-page-shell">
        <div className="profile-loading-card">
          <div className="profile-spinner"></div>
          <h2>Loading Panchayat Profile...</h2>
          <p>Please wait while we fetch the current details.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page-shell">
      <div className="profile-bg-orb profile-bg-orb--one"></div>
      <div className="profile-bg-orb profile-bg-orb--two"></div>
      <div className="profile-grid-lines"></div>

      <div className="profile-page-container">
        <button className="profile-back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
          Back
        </button>

        <section className="profile-hero">
          <div className="profile-hero-left">
            <div className="profile-badge">
              <Sparkles size={16} />
              SDG Action Hub
            </div>

            <h1>Edit Panchayat Details</h1>

            <p>
              Update the infrastructure and local context for this panchayat.
              Empty values are allowed, so officials can save partial data and
              return later.
            </p>

            <div className="profile-location-card">
              <div className="profile-location-icon">
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

          <div className="profile-hero-right">
            <div className="profile-summary-card">
              <ShieldCheck size={22} />
              <h3>Profile Management</h3>
              <p>
                These details improve context for later activity analysis,
                ranking logic, and recommendation features.
              </p>
            </div>
          </div>
        </section>

        <form className="profile-form-card" onSubmit={handleSubmit}>
          <div className="profile-section-header">
            <h2>Basic Context</h2>
            <p>Capture broad panchayat characteristics for SDG planning.</p>
          </div>

          <div className="profile-form-grid">
            <div className="profile-input-card">
              <label>Population Band</label>
              <select
                value={formData.populationBand}
                onChange={(e) => handleChange("populationBand", e.target.value)}
              >
                <option value="">Select or leave empty</option>
                {POPULATION_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="profile-input-card profile-input-card--wide">
              <label>Area Type Tags</label>
              <div className="profile-chip-group">
                {AREA_TAG_OPTIONS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className={`profile-chip ${
                      formData.areaTypeTags.includes(tag) ? "profile-chip--active" : ""
                    }`}
                    onClick={() => handleAreaTagToggle(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="profile-section-header">
            <h2>Top Local Problems</h2>
            <p>Add up to 3 key local issues. Leaving them empty is okay.</p>
          </div>

          <div className="profile-problem-grid">
            {[0, 1, 2].map((index) => (
              <div className="profile-input-card" key={index}>
                <label>Problem {index + 1}</label>
                <input
                  type="text"
                  placeholder={`Enter local problem ${index + 1}`}
                  value={formData.topLocalProblems[index]}
                  onChange={(e) => handleProblemChange(index, e.target.value)}
                />
              </div>
            ))}
          </div>

          <div className="profile-section-header">
            <h2>Facilities</h2>
            <p>Switch on the facilities that are available in this panchayat.</p>
          </div>

          <div className="profile-facility-grid">
            <div className="profile-toggle-card">
              <div className="profile-toggle-head">
                <HeartPulse size={20} />
                <div>
                  <h3>PHC Available</h3>
                  <p>Primary Health Centre availability</p>
                </div>
              </div>

              <label className="switch">
                <input
                  type="checkbox"
                  checked={formData.phcAvailable}
                  onChange={(e) => handleChange("phcAvailable", e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="profile-toggle-card">
              <div className="profile-toggle-head">
                <School size={20} />
                <div>
                  <h3>Government School</h3>
                  <p>School facility availability</p>
                </div>
              </div>

              <label className="switch">
                <input
                  type="checkbox"
                  checked={formData.governmentSchoolAvailable}
                  onChange={(e) =>
                    handleChange("governmentSchoolAvailable", e.target.checked)
                  }
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="profile-toggle-card">
              <div className="profile-toggle-head">
                <House size={20} />
                <div>
                  <h3>Anganwadi Available</h3>
                  <p>Child care and nutrition support centre</p>
                </div>
              </div>

              <label className="switch">
                <input
                  type="checkbox"
                  checked={formData.anganwadiAvailable}
                  onChange={(e) =>
                    handleChange("anganwadiAvailable", e.target.checked)
                  }
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>

          <div className="profile-section-header">
            <h2>Coverage Details</h2>
            <p>Optional service coverage levels for water and sanitation.</p>
          </div>

          <div className="profile-form-grid">
            <div className="profile-input-card">
              <label>
                <Droplets size={16} />
                Tap Water Coverage
              </label>
              <select
                value={formData.tapWaterCoverage}
                onChange={(e) => handleChange("tapWaterCoverage", e.target.value)}
              >
                <option value="">Select or leave empty</option>
                {COVERAGE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="profile-input-card">
              <label>
                <Building2 size={16} />
                Toilet Coverage
              </label>
              <select
                value={formData.toiletCoverage}
                onChange={(e) => handleChange("toiletCoverage", e.target.value)}
              >
                <option value="">Select or leave empty</option>
                {COVERAGE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error ? (
            <div className="profile-message profile-message--error">{error}</div>
          ) : null}

          {success ? (
            <div className="profile-message profile-message--success">{success}</div>
          ) : null}

          <div className="profile-form-actions">
            <button className="profile-save-btn" type="submit" disabled={saving}>
              <Save size={18} />
              {saving ? "Saving..." : "Save Details"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PanchayatProfilePage;