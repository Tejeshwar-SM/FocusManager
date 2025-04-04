import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/Navbar.css";

const Navbar: React.FC = () => {
  const { user, logout, theme, toggleTheme } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const closeDropdown = () => {
    setDropdownOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <nav className={`navbar ${theme === "dark" ? "navbar-dark" : ""}`}>
      <div className="navbar-container">
        <div className="navbar-logo">
          <Link to="/">FocusBuddy</Link>
        </div>

        <div className="navbar-links">
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
            </>
          ) : (
            <>
              <Link
                to="/login"
                className={location.pathname === "/login" ? "active" : ""}
              >
                Login
              </Link>
              <Link
                to="/register"
                className={location.pathname === "/register" ? "active" : ""}
              >
                Register
              </Link>
            </>
          )}
        </div>

        {/* User profile dropdown for authenticated users */}
        {user && (
          <div className={`profile-dropdown ${dropdownOpen ? 'show' : ''}`} ref={dropdownRef}>
            <button className="profile-button" onClick={toggleDropdown}>
              <div className="profile-avatar">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className={`profile-name ${dropdownOpen ? 'show-full-name' : ''}`}>{dropdownOpen ? user.name : ''}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="dropdown-icon"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {dropdownOpen && (
              <div className="dropdown-menu">
                <div className="dropdown-header">
                  {/* <div className="dropdown-avatar">
                    {user.name.charAt(0).toUpperCase()}
                  </div> */}
                  <div className="dropdown-user-details">
                    <span className="dropdown-username">{user.name}</span>
                    <span className="dropdown-email">{user.email}</span>
                  </div>
                </div>
                <div className="dropdown-divider"></div>
                <Link to="/profile" className="dropdown-item" onClick={closeDropdown}>
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
                  {theme === "light" ? "Dark Theme" : "Light Theme"}
                </button>
                <button className="dropdown-item logout" onClick={() => { handleLogout(); closeDropdown(); }}>
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Backdrop to close dropdown when clicking outside */}
      {dropdownOpen && (
        <div className="dropdown-backdrop" onClick={closeDropdown}></div>
      )}
    </nav>
  );
};
export default Navbar;