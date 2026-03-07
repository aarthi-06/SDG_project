import { useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Landmark,
  Leaf,
  UserRound,
  LockKeyhole,
  ArrowRight
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../services/authService";

function LoginPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);

    try {
      const data = await loginUser(formData);

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setSuccessMessage("Login successful");

      if (data.user.role === "admin") {
        navigate("/dashboard");
      } else if (data.user.role === "district_collector") {
        navigate("/dashboard");
      } else if (data.user.role === "panchayat_official") {
        navigate("/dashboard");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-page__overlay"></div>

      <motion.div
        className="login-page__content"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <section className="login-showcase">
          <div className="login-showcase__tag">
            Secure Access to SDG Action Hub
          </div>

          <h1 className="login-showcase__title">
            Governance Intelligence for
            <span> Sustainable Local Development</span>
          </h1>

          <p className="login-showcase__text">
            Sign in to access panchayat insights, SDG indicator mapping, activity
            tracking, infrastructure profiles, and district-level rankings through
            a secure and role-based governance portal.
          </p>

          <div className="login-highlights">
            <div className="login-highlight-card">
              <ShieldCheck size={22} />
              <div>
                <h3>Secure Role Access</h3>
                <p>Protected login for Admin, Collector, and Panchayat Officials</p>
              </div>
            </div>

            <div className="login-highlight-card">
              <Landmark size={22} />
              <div>
                <h3>District Governance View</h3>
                <p>Track local development progress across panchayats</p>
              </div>
            </div>

            <div className="login-highlight-card">
              <Leaf size={22} />
              <div>
                <h3>SDG-Aligned Action</h3>
                <p>Connect grassroots activities to measurable SDG indicators</p>
              </div>
            </div>
          </div>
        </section>

        <motion.section
          className="login-card"
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1 }}
        >
          <div className="login-card__header">
            <p className="login-card__mini">UN / SDG Governance Portal</p>
            <h2>Welcome Back</h2>
            <p className="login-card__subtext">
              Enter your credentials to continue into the SDG Action Hub.
            </p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-input-group">
              <label>Username</label>
              <div className="login-input-wrap">
                <UserRound size={18} />
                <input
                  type="text"
                  name="username"
                  placeholder="Enter your username"
                  value={formData.username}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="login-input-group">
              <label>Password</label>
              <div className="login-input-wrap">
                <LockKeyhole size={18} />
                <input
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
            </div>

            {error && <p className="login-message login-message--error">{error}</p>}
            {successMessage && (
              <p className="login-message login-message--success">{successMessage}</p>
            )}

            <button type="submit" className="login-submit-btn" disabled={loading}>
              {loading ? "Signing In..." : "Sign In"}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="login-role-box">
            <h4>Authorized Roles</h4>
            <div className="login-role-tags">
              <span>Admin</span>
              <span>District Collector</span>
              <span>Panchayat Official</span>
            </div>
          </div>

          <p className="login-back-link">
            Back to <Link to="/">Landing Page</Link>
          </p>
        </motion.section>
      </motion.div>
    </div>
  );
}

export default LoginPage;