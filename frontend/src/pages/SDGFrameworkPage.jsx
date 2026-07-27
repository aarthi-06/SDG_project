import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Database, Search } from "lucide-react";
import "../styles/sdgFramework.css";
import { authFetch } from "../services/authFetch";
import sdg1 from "../assets/sdg-icons/E_SDG_inverted_PRINT-01.jpg";
import sdg2 from "../assets/sdg-icons/E_SDG_inverted_PRINT-02.jpg";
import sdg3 from "../assets/sdg-icons/E_SDG_inverted_PRINT-03.jpg";
import sdg4 from "../assets/sdg-icons/E_SDG_inverted_PRINT-04.jpg";
import sdg5 from "../assets/sdg-icons/E_SDG_inverted_PRINT-05.jpg";
import sdg6 from "../assets/sdg-icons/E_SDG_inverted_PRINT-06.jpg";
import sdg7 from "../assets/sdg-icons/E_SDG_inverted_PRINT-07.jpg";
import sdg8 from "../assets/sdg-icons/E_SDG_inverted_PRINT-08.jpg";
import sdg9 from "../assets/sdg-icons/E_SDG_inverted_PRINT-09.jpg";
import sdg10 from "../assets/sdg-icons/E_SDG_inverted_PRINT-10.jpg";
import sdg11 from "../assets/sdg-icons/E_SDG_inverted_PRINT-11.jpg";
import sdg12 from "../assets/sdg-icons/E_SDG_inverted_PRINT-12.jpg";
import sdg13 from "../assets/sdg-icons/E_SDG_inverted_PRINT-13.jpg";
import sdg14 from "../assets/sdg-icons/E_SDG_inverted_PRINT-14.jpg";
import sdg15 from "../assets/sdg-icons/E_SDG_inverted_PRINT-15.jpg";
import sdg16 from "../assets/sdg-icons/E_SDG_inverted_PRINT-16.jpg";
import sdg17 from "../assets/sdg-icons/E_SDG_inverted_PRINT-17.jpg";

const sdgImageMap = {
  1: sdg1,
  2: sdg2,
  3: sdg3,
  4: sdg4,
  5: sdg5,
  6: sdg6,
  7: sdg7,
  8: sdg8,
  9: sdg9,
  10: sdg10,
  11: sdg11,
  12: sdg12,
  13: sdg13,
  14: sdg14,
  15: sdg15,
  16: sdg16,
  17: sdg17,
};

function SDGFrameworkPage() {
  const navigate = useNavigate();

  const [indicators, setIndicators] = useState([]);
  const [selectedGoal, setSelectedGoal] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadIndicators();
  }, []);

  const loadIndicators = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await authFetch("/indicators");

      if (!Array.isArray(data)) {
        throw new Error("Invalid indicator response");
      }

      setIndicators(data);
    } catch (err) {
      setError(
        err.message ||
          "Failed to load the SDG indicator catalogue"
      );
    } finally {
      setLoading(false);
    }
  };

  const availableGoals = useMemo(() => {
    return [
      ...new Set(
        indicators
          .map((item) =>
            Number(item.sdg_goal_number)
          )
          .filter(Boolean)
      ),
    ].sort((a, b) => a - b);
  }, [indicators]);

  const filteredIndicators = useMemo(() => {
    const normalizedSearch =
      searchText.toLowerCase().trim();

    return indicators.filter((item) => {
      const matchesGoal =
        selectedGoal === "all" ||
        Number(item.sdg_goal_number) ===
          Number(selectedGoal);

      const searchableText = [
        item.indicator_code,
        item.indicator_description,
        item.target_number,
        item.target_description,
        item.sdg_goal_title,
        item.nodal_ministry,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        searchableText.includes(normalizedSearch);

      return matchesGoal && matchesSearch;
    });
  }, [indicators, selectedGoal, searchText]);

  if (loading) {
    return (
      <div className="simple-page">
        <h1>Loading SDG Framework...</h1>
        <p>
          Fetching district-computable indicators.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="simple-page">
        <h1>Framework Error</h1>
        <p>{error}</p>

        <button
          type="button"
          onClick={loadIndicators}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-shell">
      <div className="page-topbar">
        <button
          className="page-back-btn"
          onClick={() =>
            navigate("/dashboard")
          }
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>
      </div>

      <section className="dashboard-section-head">
        <div>
          <h2>
            District SDG Indicator Framework
          </h2>

          <p>
            Catalogue of district-computable
            indicators used for semantic mapping of
            panchayat development activities.
          </p>
        </div>
      </section>

      <section className="sdg-framework-summary">
        <div className="sdg-framework-summary__item">
          <Database size={22} />

          <div>
            <strong>{indicators.length}</strong>
            <span>
              District-computable indicators
            </span>
          </div>
        </div>

        <div className="sdg-framework-summary__item">
          <strong>{availableGoals.length}</strong>
          <span>SDG goals represented</span>
        </div>
      </section>

      <section className="sdg-framework-toolbar">
        <div className="sdg-framework-search">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search by code, description, target or ministry..."
            value={searchText}
            onChange={(event) =>
              setSearchText(event.target.value)
            }
          />
        </div>

        <select
          value={selectedGoal}
          onChange={(event) =>
            setSelectedGoal(event.target.value)
          }
        >
          <option value="all">
            All SDG Goals
          </option>

          {availableGoals.map((goal) => (
            <option
              key={goal}
              value={goal}
            >
              SDG {goal}
            </option>
          ))}
        </select>
      </section>

      <p className="sdg-framework-result-count">
        Showing {filteredIndicators.length} of{" "}
        {indicators.length} indicators
      </p>

      <div className="sdg-framework-grid">
        {filteredIndicators.map((item) => {
          const image =
            sdgImageMap[
              item.sdg_goal_number
            ];

          return (
            <article
              className="sdg-framework-card"
              key={
                item._id ||
                item.indicator_code
              }
            >
              <div className="sdg-framework-card__header">
                <div className="sdg-framework-card__icon">
                  {image && (
                    <img
                      src={image}
                      alt={`SDG ${item.sdg_goal_number}`}
                    />
                  )}
                </div>

                <div className="sdg-framework-card__goal-info">
                  <span>
                    SDG{" "}
                    {item.sdg_goal_number}
                  </span>

                  <h3>
                    {item.sdg_goal_title}
                  </h3>
                </div>
              </div>

              <div className="sdg-framework-card__body">
                <div className="sdg-framework-card__badges">
                  <span className="sdg-indicator-code">
                    {item.indicator_code}
                  </span>

                  <span className="district-computable-badge">
                    District Computable
                  </span>
                </div>

                <h4>
                  {
                    item.indicator_description
                  }
                </h4>

                <div className="sdg-framework-detail">
                  <strong>Target</strong>

                  <span>
                    {item.target_number ||
                      "Not available"}
                  </span>
                </div>

                <div className="sdg-framework-detail">
                  <strong>
                    Target Description
                  </strong>

                  <span>
                    {item.target_description ||
                      "Not available"}
                  </span>
                </div>

                <div className="sdg-framework-detail">
                  <strong>Data Source</strong>

                  <span>
                    {item.nodal_ministry ||
                      "Not available"}
                  </span>
                </div>

                <div className="sdg-framework-detail">
                  <strong>Periodicity</strong>

                  <span>
                    {item.periodicity ||
                      "Not available"}
                  </span>
                </div>

                <div className="sdg-framework-card__footer">
                  <span>
                    Classification:{" "}
                    {item.classificationMethod ===
                    "LLM_ASSISTED"
                      ? "LLM-assisted review"
                      : "Rule-based"}
                  </span>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {filteredIndicators.length === 0 && (
        <div className="sdg-framework-empty">
          <h3>No indicators found</h3>

          <p>
            Try changing the SDG goal or search
            keyword.
          </p>
        </div>
      )}
    </div>
  );
}

export default SDGFrameworkPage;