import { Link } from "react-router-dom";
import { Globe, Leaf, BarChart3 } from "lucide-react";

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar__left">
        <div className="logo-box">
          <Globe size={24} />
        </div>
        <div>
          <h2 className="brand-title">SDG Action Hub</h2>
          <p className="brand-subtitle">Localizing Sustainable Development Goals</p>
        </div>
      </div>

      <div className="navbar__right">
        <a href="#about" className="nav-link">About</a>
        <a href="#impact" className="nav-link">Impact</a>
        <a href="#sdgs" className="nav-link">Goals</a>

        <Link to="/login" className="nav-btn nav-btn--light">
          <Leaf size={18} />
          Login
        </Link>

        {/* <Link to="/dashboard" className="nav-btn nav-btn--primary">
          <BarChart3 size={18} />
          Dashboard
        </Link> */}
      </div>
    </nav>
  );
}

export default Navbar;