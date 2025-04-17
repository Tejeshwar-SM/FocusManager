import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Footer.css';
import { useAuth } from '../context/AuthContext';

const Footer: React.FC = () => {
  const { theme } = useAuth();
  
  return (
    <footer className={`footer ${theme === 'dark' ? 'footer-dark' : ''}`}>
      <div className="footer-container">
        <div className="footer-section">
          <h3>FocusBuddy</h3>
          <p>Your productivity assistant to help you stay focused and accomplish more.</p>
        </div>
        
        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/dashboard">Dashboard</Link></li>
            <li><Link to="/tasks">Tasks</Link></li>
            <li><Link to="/pomodoro">Pomodoro Timer</Link></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h4>Resources</h4>
          <ul>
            <li><a href="#">Blog</a></li>
            <li><a href="#">Help Center</a></li>
            <li><a href="#">Privacy Policy</a></li>
            <li><a href="#">Terms of Service</a></li>
          </ul>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} FocusManager. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;