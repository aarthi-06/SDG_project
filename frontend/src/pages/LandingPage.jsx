import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import MainLayout from "../layouts/MainLayout";
import { Earth, Droplets, Sun, Trees } from "lucide-react";

function LandingPage() {
  return (
    <MainLayout>
      <section className="hero-section">
        <div className="hero-overlay"></div>

        <motion.div
          className="hero-content"
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <p className="hero-tag">UN-Inspired Sustainable Development Platform</p>

          <h1 className="hero-title">
            Transform Local Governance into
            <span> Sustainable Action</span>
          </h1>

          <p className="hero-text">
            SDG Action Hub helps administrators, district officials, and panchayats
            track indicators, map government schemes, analyze rankings, and promote
            inclusive development through a visually powerful dashboard.
          </p>

          <div className="hero-buttons">
            <Link to="/dashboard" className="hero-btn hero-btn--primary">
              Explore Dashboard
            </Link>
            <Link to="/login" className="hero-btn hero-btn--secondary">
              Sign In
            </Link>
          </div>
        </motion.div>

        <motion.div
          className="floating-card"
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1.2 }}
        >
          <h3>Development Focus Areas</h3>
          <div className="focus-grid">
            <div className="focus-item">
              <Earth size={22} />
              <span>SDG Monitoring</span>
            </div>
            <div className="focus-item">
              <Droplets size={22} />
              <span>Water & Sanitation</span>
            </div>
            <div className="focus-item">
              <Sun size={22} />
              <span>Clean Energy</span>
            </div>
            <div className="focus-item">
              <Trees size={22} />
              <span>Green Communities</span>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="info-section" id="about">
        <motion.div
          className="info-card"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2>Why SDG Action Hub?</h2>
          <p>
            The platform is designed to connect sustainable development goals with
            local administrative action. It gives a district-level view of progress,
            scheme relevance, and panchayat-level opportunities.
          </p>
        </motion.div>

        <motion.div
          className="info-card"
          id="impact"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
          viewport={{ once: true }}
        >
          <h2>Impact-Driven Decisions</h2>
          <p>
            With a premium dashboard experience, decision makers can quickly identify
            development gaps, compare regions, and discover action-oriented
            recommendations aligned with the SDGs.
          </p>
        </motion.div>

        <motion.div
          className="info-card"
          id="sdgs"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
        >
          <h2>Designed for Sustainability</h2>
          <p>
            The interface uses a modern UN-inspired visual theme with earth tones,
            blue governance identity, and immersive motion to communicate progress,
            trust, and social responsibility.
          </p>
        </motion.div>
      </section>
    </MainLayout>
  );
}

export default LandingPage;