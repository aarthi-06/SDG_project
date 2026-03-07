import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, BarChart3, Leaf, MapPinned, LogOut, ShieldCheck } from "lucide-react";
import { authFetch } from "../services/authFetch";

function DashboardPage() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [panchayats, setPanchayats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    setUser(storedUser);

    loadPanchayats();
  }, []);

  const loadPanchayats = async (searchValue = "") => {
    try {
      setLoading(true);
      const endpoint = searchValue
        ? `/panchayats?search=${encodeURIComponent(searchValue)}`
        : "/panchayats";

      const data = await authFetch(endpoint);
      setPanchayats(data);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to load panchayats");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    const value = e.target.value;
    setSearch(value);
    await loadPanchayats(value);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="dashboard-shell">
      <header className="dashboard-topbar">
        <div className="dashboard-topbar__left">
          <div className="dashboard-badge-icon">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h1 className="dashboard-title">SDG Action Hub Dashboard</h1>
            <p className="dashboard-subtitle">
              Welcome {user?.username} • {user?.role} • {user?.district}
            </p>
          </div>
        </div>

        <button className="dashboard-logout-btn" onClick={handleLogout}>
          <LogOut size={18} />
          Logout
        </button>
      </header>

      <section className="dashboard-nav-cards">
        <button className="dashboard-nav-card dashboard-nav-card--active">
          <Building2 size={26} />
          <div>
            <h3>Panchayats</h3>
            <p>View and manage panchayat-level records</p>
          </div>
        </button>

        <button
          className="dashboard-nav-card"
          onClick={() => navigate("/sdg-framework")}
        >
          <Leaf size={26} />
          <div>
            <h3>SDG Framework</h3>
            <p>Explore mapped SDG indicators and themes</p>
          </div>
        </button>

        <button
          className="dashboard-nav-card"
          onClick={() => navigate("/leaderboard")}
        >
          <BarChart3 size={26} />
          <div>
            <h3>Leaderboard</h3>
            <p>See ranked panchayat performance</p>
          </div>
        </button>
      </section>

      <section className="dashboard-section-head">
        <h2>Panchayat Overview</h2>
        <p>Role-based panchayat access with action controls.</p>
      </section>

      <div className="dashboard-search-wrap">
        <input
          type="text"
          placeholder="Search panchayat by name..."
          value={search}
          onChange={handleSearch}
          className="dashboard-search-input"
        />
      </div>

      {loading ? (
        <div className="simple-page">
          <h1>Loading Panchayats...</h1>
        </div>
      ) : error ? (
        <div className="simple-page">
          <h1>Dashboard Error</h1>
          <p>{error}</p>
        </div>
      ) : (
        <div className="panchayat-card-grid">
          {panchayats.map((item) => (
            <div className="panchayat-card" key={item.villageCode}>
              <div className="panchayat-card__top">
                <div className="panchayat-card__icon">
                  <MapPinned size={22} />
                </div>
                <span className="panchayat-code-badge">Code: {item.villageCode}</span>
              </div>

              <h3>{item.villageName}</h3>
              <p><strong>District:</strong> {item.districtName}</p>
              <p><strong>Block:</strong> {item.blockName}</p>

              <div className="panchayat-card__actions">
                <button
                  className="panchayat-btn panchayat-btn--primary"
                  onClick={() => navigate(`/panchayat/${item.villageCode}/activities`)}
                >
                  Add Activities
                </button>

                <button
                  className="panchayat-btn panchayat-btn--secondary"
                  onClick={() => navigate(`/panchayat/${item.villageCode}/profile`)}
                >
                  Edit Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DashboardPage;