import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/Navbar.css";

const Navbar: React.FC = () => {
  const { user, logout, theme, toggleTheme } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeDropdown = () => {
    setDropdownOpen(false);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // Close dropdown and mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }

      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node) &&
        !(event.target as Element).classList.contains('mobile-menu-toggle')
      ) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Close mobile menu on navigation
  useEffect(() => {
    closeMobileMenu();
  }, [location.pathname]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className={`navbar ${theme === "dark" ? "navbar-dark" : ""}`}>
      <div className="navbar-container">
        <div className="navbar-logo">
          <Link to="/">
            <span className="logo-icon">⏱️</span>
            <span className="logo-text">FocusBuddy</span>
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          className="mobile-menu-toggle"
          onClick={toggleMobileMenu}
          aria-label="Toggle navigation menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Desktop Navigation */}
        <div className="navbar-links desktop-nav">
          <div className="nav-section">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className={`nav-link ${location.pathname === "/dashboard" ? "active" : ""}`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/tasks"
                  className={`nav-link ${location.pathname === "/tasks" ? "active" : ""}`}
                >
                  Tasks
                </Link>
                <Link
                  to="/pomodoro"
                  className={`nav-link ${location.pathname === "/pomodoro" ? "active" : ""}`}
                >
                  Pomodoro
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/"
                  className={`nav-link ${location.pathname === "/" ? "active" : ""}`}
                >
                  Home
                </Link>
                <a href="#features" className="nav-link" onClick={(e) => {e.preventDefault(); scrollToSection("features");}}>Features</a>
                <a href="#how-it-works" className="nav-link" onClick={(e) => {e.preventDefault(); scrollToSection("how-it-works");}}>How It Works</a>
                <a href="#pricing" className="nav-link" onClick={(e) => {e.preventDefault(); scrollToSection("pricing");}}>Pricing</a>
              </>
            )}
          </div>

          <div className="nav-section auth-section">
            {!user ? (
              <>
                <Link
                  to="/login"
                  className={`nav-link ${location.pathname === "/login" ? "active" : ""}`}
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="nav-button primary-button"
                >
                  Sign Up Free
                </Link>
              </>
            ) : null}
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <div
          className={`mobile-nav ${mobileMenuOpen ? 'open' : ''}`}
          ref={mobileMenuRef}
        >
          <div className="mobile-nav-header">
            <div className="navbar-logo">
              <Link to="/">
                <span className="logo-icon">⏱️</span>
                <span className="logo-text">FocusBuddy</span>
              </Link>
            </div>
            <button
              className="mobile-menu-close"
              onClick={closeMobileMenu}
              aria-label="Close navigation menu"
            >
              ×
            </button>
          </div>

          <div className="mobile-nav-links">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className={location.pathname === "/dashboard" ? "active" : ""}
                >
                  Dashboard
                </Link>
                <Link
                  to="/tasks"
                  className={location.pathname === "/tasks" ? "active" : ""}
                >
                  Tasks
                </Link>
                <Link
                  to="/pomodoro"
                  className={location.pathname === "/pomodoro" ? "active" : ""}
                >
                  Pomodoro
                </Link>
                <div className="mobile-nav-divider"></div>
                <Link to="/profile">Profile Settings</Link>
                <button
                  className="theme-toggle-button"
                  onClick={toggleTheme}
                >
                  {theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
                </button>
                <button
                  className="logout-button"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/" className={location.pathname === "/" ? "active" : ""}>
                  Home
                </Link>
                <a href="#features" onClick={(e) => {e.preventDefault(); scrollToSection("features");}}>Features</a>
                <a href="#how-it-works" onClick={(e) => {e.preventDefault(); scrollToSection("how-it-works");}}>How It Works</a>
                <a href="#pricing" onClick={(e) => {e.preventDefault(); scrollToSection("pricing");}}>Pricing</a>
                <div className="mobile-nav-divider"></div>
                <Link to="/login" className={location.pathname === "/login" ? "active" : ""}>
                  Log In
                </Link>
                <Link to="/register" className="mobile-signup-button">
                  Sign Up Free
                </Link>
              </>
            )}
          </div>
        </div>

        {/* User profile dropdown for authenticated users */}
        {user && (
          <div className={`profile-dropdown ${dropdownOpen ? 'show' : ''}`} ref={dropdownRef}>
            <button className="profile-button" onClick={toggleDropdown}>
              <div className="profile-avatar">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="profile-name">{user.name}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`dropdown-icon ${dropdownOpen ? 'rotated' : ''}`}
                width="16"
                height="16"
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z" />
              </svg>
            </button>

            {dropdownOpen && (
              <div className="dropdown-menu">
                <div className="dropdown-header">
                  <div className="dropdown-user-details">
                    <span className="dropdown-username">{user.name}</span>
                    <span className="dropdown-email">{user.email}</span>
                  </div>
                </div>
                <div className="dropdown-divider"></div>
                <Link to="/profile" className="dropdown-item" onClick={closeDropdown}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z" />
                  </svg>
                  Profile
                </Link>
                <Link to="/settings" className="dropdown-item" onClick={closeDropdown}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z" />
                    <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115l.094-.319z" />
                  </svg>
                  Settings
                </Link>
                <button
                  className="dropdown-item theme-toggle"
                  onClick={() => {
                    toggleTheme();
                    closeDropdown();
                  }}
                >
                  {theme === "light" ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M6 .278a.768.768 0 0 1 .08.858 7.208 7.208 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277.527 0 1.04-.055 1.533-.16a.787.787 0 0 1 .81.316a.733.733 0 0 1-.031.893A8.349 8.349 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.752.752 0 0 1 6 .278z" />
                      </svg>
                      Dark Theme
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0zm0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13zm8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5zM3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8zm10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0zm-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5.5 0 0 1 .707 0zm9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707zM4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708z" />
                      </svg>
                      Light Theme
                    </>
                  )}
                </button>
                <div className="dropdown-divider"></div>
                <button
                  className="dropdown-item logout"
                  onClick={() => {
                    handleLogout();
                    closeDropdown();
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path fillRule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 0 0 0 0 3.5v9A1.5 0 0 0 1.5 14h8a1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0v2z" />
                    <path fillRule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z" />
                  </svg>
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Backdrop for mobile menu */}
      {mobileMenuOpen && (
        <div className="mobile-backdrop" onClick={closeMobileMenu}></div>
      )}
    </nav>
  );
};

export default Navbar;
