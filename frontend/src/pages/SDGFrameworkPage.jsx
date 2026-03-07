import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch } from "../services/authFetch";
import { ArrowLeft } from "lucide-react";

const sdgVisualMap = {
  3: {
    image:
      "https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=900&q=80",
    label: "Health & Well-being"
  },
  4: {
    image:
      "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=900&q=80",
    label: "Quality Education"
  },
  6: {
    image:
      "https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=900&q=80",
    label: "Clean Water & Sanitation"
  },
  7: {
    image:
      "https://images.unsplash.com/photo-1509395176047-4a66953fd231?auto=format&fit=crop&w=900&q=80",
    label: "Affordable & Clean Energy"
  },
  9: {
    image:
      "https://images.unsplash.com/photo-1513828583688-c52646db42da?auto=format&fit=crop&w=900&q=80",
    label: "Infrastructure & Connectivity"
  }
};

function SDGFrameworkPage() {
  const navigate = useNavigate();
  const [indicators, setIndicators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadIndicators();
  }, []);

  const loadIndicators = async () => {
    try {
      const data = await authFetch("/indicators");
      setIndicators(data);
    } catch (err) {
      setError(err.message || "Failed to load indicators");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="simple-page">
        <h1>Loading SDG Framework...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div className="simple-page">
        <h1>Framework Error</h1>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="dashboard-shell">
      <div className="page-topbar">
        <button className="page-back-btn" onClick={() => navigate("/dashboard")}>
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>
      </div>

      <section className="dashboard-section-head">
        <h2>SDG Framework</h2>
        <p>Indicator catalogue used to map panchayat activities to SDG goals.</p>
      </section>

      <div className="sdg-framework-grid">
        {indicators.map((item) => {
          const visual = sdgVisualMap[item.sdg_goal_number] || {
            image:
              "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=900&q=80",
            label: "Sustainable Development"
          };

          return (
            <div className="sdg-framework-card" key={item._id}>
              <div
                className="sdg-framework-card__image"
                style={{ backgroundImage: `url(${visual.image})` }}
              >
                <div className="sdg-framework-card__overlay">
                  <span className="sdg-framework-card__goal">
                    SDG {item.sdg_goal_number}
                  </span>
                  <h3>{visual.label}</h3>
                </div>
              </div>

              <div className="sdg-framework-card__body">
                <p className="sdg-indicator-code">{item.indicator_code}</p>
                <h4>{item.indicator_description}</h4>
                <p><strong>Target:</strong> {item.target_number}</p>
                <p><strong>Ministry:</strong> {item.nodal_ministry}</p>
                <p><strong>Type:</strong> {item.indicator_type}</p>
                <p><strong>Direction:</strong> {item.direction}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SDGFrameworkPage;