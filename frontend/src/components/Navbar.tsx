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
                <Link
                  to="/journal"
                  className={`nav-link ${location.pathname === "/journal" ? "active" : ""}`}
                >
                  Journal
                </Link>
                <Link
                  to="/calendar"
                  className={`nav-link ${location.pathname === "/calendar" ? "active" : ""}`}
                >
                  Calendar
                </Link>
                <Link
                  to="/leaderboard"
                  className={`nav-link ${location.pathname === "/leaderboard" ? "active" : ""}`}
                >
                  Leaderboard
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
                <a href="#features" className="nav-link" onClick={(e) => {
                  e.preventDefault();
                  scrollToSection('features');
                }}>Features</a>
                <a href="#how-it-works" className="nav-link" onClick={(e) => {
                  e.preventDefault();
                  scrollToSection('how-it-works');
                }}>How It Works</a>
                <a href="#pricing" className="nav-link" onClick={(e) => {
                  e.preventDefault();
                  scrollToSection('pricing');
                }}>Pricing</a>
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
                <Link
                  to="/journal"
                  className={location.pathname === "/journal" ? "active" : ""}
                >
                  Journal
                </Link>
                <Link
                  to="/calendar"
                  className={location.pathname === "/calendar" ? "active" : ""}
                >
                  Calendar
                </Link>
                <Link
                  to="/leaderboard"
                  className={location.pathname === "/leaderboard" ? "active" : ""}
                >
                  Leaderboard
                </Link>
                <div className="mobile-nav-divider"></div>
                <Link to="/profile">Profile Settings</Link>
                <button
                  className="theme-toggle-button"
                  onClick={toggleTheme}
                >
                  
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
                <a href="#features" onClick={(e) => {
                  e.preventDefault();
                  scrollToSection('features');
                  closeMobileMenu();
                }}>Features</a>
                <a href="#how-it-works" onClick={(e) => {
                  e.preventDefault();
                  scrollToSection('how-it-works');
                  closeMobileMenu();
                }}>How It Works</a>
                <a href="#pricing" onClick={(e) => {
                  e.preventDefault();
                  scrollToSection('pricing');
                  closeMobileMenu();
                }}>Pricing</a>
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
                  
                  Settings
                </Link>
                <button
                  className="dropdown-item theme-toggle"
                  onClick={() => {
                    toggleTheme();
                    closeDropdown();
                  }}
                >
                  
                </button>
                <div className="dropdown-divider"></div>
                <button
                  className="dropdown-item logout"
                  onClick={() => {
                    handleLogout();
                    closeDropdown();
                  }}
                >
                  
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