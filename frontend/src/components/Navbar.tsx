import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/Navbar.css";

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("theme") as "light" | "dark") || "light";
  });

  // Apply theme when it changes
  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const closeDropdown = () => {
    setDropdownOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <Link to={user ? "/dashboard" : "/"}>FocusManager</Link>
        </div>

        <div className="navbar-links">
          {user ? (
            // Nav links for authenticated users
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
            // Nav links for guests
            <>
              <Link
                to="/login"
                className={`auth-button ${
                  location.pathname === "/login" ? "active" : ""
                }`}
              >
                Login
              </Link>
              <Link
                to="/register"
                className={`auth-button signup ${
                  location.pathname === "/register" ? "active" : ""
                }`}
              >
                Register
              </Link>
            </>
          )}
        </div>

        {/* User profile dropdown for authenticated users */}
        {user && (
          <div className="profile-dropdown">
            <button className="profile-button" onClick={toggleDropdown}>
              <span className="profile-icon">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </button>

            {dropdownOpen && (
              <div className="dropdown-menu">
                <div className="dropdown-header">
                  <span className="user-name">{user.name}</span>
                  <span className="user-email">{user.email}</span>
                </div>
                <div className="dropdown-divider"></div>
                <button
                  className="dropdown-item theme-toggle"
                  onClick={toggleTheme}
                >
                  {theme === "light" ? "Dark Theme" : "Light Theme"}
                </button>
                <button className="dropdown-item logout" onClick={handleLogout}>
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
