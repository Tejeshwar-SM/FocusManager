import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "../styles/Home.css";

const Home: React.FC = () => {
  const [apiStatus, setApiStatus] = useState<string>("");
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const featuresRef = useRef<HTMLDivElement>(null);
  const testimonialInterval = useRef<NodeJS.Timeout | null>(null);

  // For animated counting
  const [statsVisible, setStatsVisible] = useState(false);
  const [animatedStats, setAnimatedStats] = useState({
    productivity: 0,
    sessions: 0,
    satisfaction: 0,
    tasks: 0
  });

  // Define final stat values
  const finalStats = {
    productivity: 37,
    sessions: 1.5,
    satisfaction: 89,
    tasks: 25
  };

  // Easing function for smoother animation
  const easeInOutQuad = (t: number): number => {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  };

  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL || "http://localhost:5000/api"}/`
        );
        setApiStatus(JSON.stringify(response.data));
      } catch (error) {
        console.error("Error connecting to API:", error);
        setApiStatus("Error connecting to the API");
      }
    };

    // Create intersection observer for animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (entry.target.id === "stats-section") {
              setStatsVisible(true);
              
              // Begin stat counter animation when section becomes visible
              if (!animatedStats.productivity) {
                animateStats();
              }
            }
            entry.target.classList.add("animate-in");
          }
        });
      },
      { threshold: 0.1 }
    );

    // Observe all sections for animations
    document.querySelectorAll("section").forEach((section) => {
      observer.observe(section);
    });

    // Observe stats section specifically
    const statsSection = document.getElementById("stats-section");
    if (statsSection) observer.observe(statsSection);

    // Rotate testimonials automatically
    testimonialInterval.current = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % 3);
    }, 5000);

    checkApiStatus();

    return () => {
      observer.disconnect();
      if (testimonialInterval.current)
        clearInterval(testimonialInterval.current);
    };
  }, [animatedStats.productivity]);

  // Function to animate stats counting up
  const animateStats = () => {
    // Animation duration in ms
    const duration = 2000;
    // Number of steps in the animation
    const steps = 60;
    // Calculate time between steps
    const stepTime = duration / steps;
    
    let currentStep = 0;
    
    const timer = setInterval(() => {
      currentStep += 1;
      
      // Calculate current value as a percentage of final value
      const progress = easeInOutQuad(currentStep / steps);
      
      setAnimatedStats({
        productivity: Math.round(progress * finalStats.productivity),
        sessions: parseFloat((progress * finalStats.sessions).toFixed(1)),
        satisfaction: Math.round(progress * finalStats.satisfaction),
        tasks: Math.round(progress * finalStats.tasks)
      });
      
      if (currentStep >= steps) {
        // Ensure final values are exactly what we want
        setAnimatedStats(finalStats);
        clearInterval(timer);
      }
    }, stepTime);
  };

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Testimonial data
  const testimonials = [
    {
      text: "FocusBuddy transformed my work habits completely. The pomodoro timer combined with task management helped me increase my productivity by 40%. I accomplish more in less time with less stress!",
      name: "Jane Doe",
      title: "Product Manager",
      avatar: "JD",
      company: "Acme Inc.",
    },
    {
      text: "As a software developer, staying focused is crucial. FocusBuddy's leaderboard feature added a friendly competitive element within our team, boosting everyone's productivity while making it fun.",
      name: "John Smith",
      title: "Senior Developer",
      avatar: "JS",
      company: "TechCorp",
    },
    {
      text: "The analytics dashboard has been a game-changer for me. Being able to see patterns in my productivity helped me optimize my schedule and identify the times when I'm most effective.",
      name: "Amy Chen",
      title: "Freelance Designer",
      avatar: "AC",
      company: "Self-employed",
    },
  ];

  return (
    <div className="home-container">
      {/* Animated background elements */}
      <div className="animated-background">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
        <div className="shape shape-4"></div>
      </div>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <span>⚡ Productivity Tool of the Year 2025</span>
          </div>
          <h1>
            <span className="gradient-text">Focus</span> Better, <br />
            <span className="gradient-text">Achieve</span> More
          </h1>
          <p className="hero-subtitle">
            The all-in-one productivity suite that combines pomodoro timing,
            task management, and analytics to help you stay focused and
            accomplish your goals.
          </p>
          <div className="hero-cta">
            <Link to="/register" className="btn btn-primary">
              <span>Start Free Trial</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14"></path>
                <path d="M12 5l7 7-7 7"></path>
              </svg>
            </Link>
            <button onClick={scrollToFeatures} className="btn btn-secondary">
              <span>Explore Features</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M7 13l5 5 5-5"></path>
                <path d="M7 6l5 5 5-5"></path>
              </svg>
            </button>
          </div>
          <div className="hero-metrics">
            <div className="metric">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <span>20,000+ Users</span>
            </div>
            <div className="metric">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
              <span>4.8/5 Rating</span>
            </div>
            <div className="metric">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
              <span>Trusted by 500+ Companies</span>
            </div>
          </div>
        </div>
        <div className="hero-image-container">
          <div className="hero-image">
            <img
              src="/images/cybergirl.webp"
              alt="FocusBuddy Dashboard"
              className="main-image"
            />
            <div className="floating-element floating-timer">
              <div className="timer-circle">
                <svg viewBox="0 0 36 36">
                  <path
                    className="timer-bg"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="timer-progress"
                    strokeDasharray="75, 100"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="timer-text">18:45</span>
              </div>
              <span className="timer-label">Focus Session</span>
            </div>
            <div className="floating-element floating-task">
              <div className="task-item">
                <span className="task-checkbox completed"></span>
                <span className="task-text">Review project proposal</span>
              </div>
              <div className="task-item">
                <span className="task-checkbox"></span>
                <span className="task-text">Team meeting prep</span>
              </div>
            </div>
          </div>
          <div className="hero-backdrop"></div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="trusted-section">
        <h2>Trusted by innovative teams</h2>
        <div className="logo-scroll">
          <div className="logos-slide">
            <div className="company-logo">Microsoft</div>
            <div className="company-logo">Shopify</div>
            <div className="company-logo">Airbnb</div>
            <div className="company-logo">Spotify</div>
            <div className="company-logo">Slack</div>
            <div className="company-logo">Adobe</div>
            <div className="company-logo">Twitter</div>
            <div className="company-logo">Dropbox</div>
          </div>
          <div className="logos-slide">
            <div className="company-logo">Microsoft</div>
            <div className="company-logo">Shopify</div>
            <div className="company-logo">Airbnb</div>
            <div className="company-logo">Spotify</div>
            <div className="company-logo">Slack</div>
            <div className="company-logo">Adobe</div>
            <div className="company-logo">Twitter</div>
            <div className="company-logo">Dropbox</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section" ref={featuresRef} id="features">
        <div className="section-header">
          <span className="section-tag">Features</span>
          <h2>Everything you need to boost productivity</h2>
          <p>
            FocusBuddy combines powerful tools into one integrated platform to
            help you stay focused, organized, and accountable.
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-container">
              <div className="feature-icon">⏱️</div>
            </div>
            <h3>Smart Pomodoro Timer</h3>
            <p>
              Customize focus sessions and breaks to match your natural rhythm.
              AI-powered recommendations help optimize your schedule over time.
            </p>
            <Link to="/features/pomodoro" className="feature-link">
              Learn more
            </Link>
          </div>

          <div className="feature-card">
            <div className="feature-icon-container">
              <div className="feature-icon">✅</div>
            </div>
            <h3>Task Management</h3>
            <p>
              Organize tasks with priorities, deadlines, and tags. Intelligent
              task suggestions help you focus on what matters most.
            </p>
            <Link to="/features/tasks" className="feature-link">
              Learn more
            </Link>
          </div>

          <div className="feature-card">
            <div className="feature-icon-container">
              <div className="feature-icon">📊</div>
            </div>
            <h3>Productivity Analytics</h3>
            <p>
              Track your progress with detailed reports and insights. Identify
              patterns and optimize your workflow for maximum efficiency.
            </p>
            <Link to="/features/analytics" className="feature-link">
              Learn more
            </Link>
          </div>

          <div className="feature-card">
            <div className="feature-icon-container">
              <div className="feature-icon">📅</div>
            </div>
            <h3>Calendar Integration</h3>
            <p>
              Seamlessly sync with Google Calendar, Outlook, and Apple Calendar
              to plan your day without switching between apps.
            </p>
            <Link to="/features/calendar" className="feature-link">
              Learn more
            </Link>
          </div>

          <div className="feature-card">
            <div className="feature-icon-container">
              <div className="feature-icon">🏆</div>
            </div>
            <h3>Leaderboards & Teams</h3>
            <p>
              Stay motivated by competing with friends and colleagues. Create
              teams and track collective productivity goals together.
            </p>
            <Link to="/features/teams" className="feature-link">
              Learn more
            </Link>
          </div>

          <div className="feature-card">
            <div className="feature-icon-container">
              <div className="feature-icon">📱</div>
            </div>
            <h3>Cross-Device Sync</h3>
            <p>
              Access FocusBuddy from any device. Your data automatically syncs
              so you can stay productive anywhere, anytime.
            </p>
            <Link to="/features/sync" className="feature-link">
              Learn more
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section - FIXED */}
      <section className="stats-section" id="stats-section">
        <div className="stats-content">
          <div className="section-header centered">
            <span className="section-tag">Results</span>
            <h2>Proven productivity improvements</h2>
            <p>See the difference FocusBuddy makes in numbers</p>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <h3 className="stat-number">
                <span className={statsVisible ? "animated-number" : ""}>
                  {statsVisible ? animatedStats.productivity : "0"}
                </span>
                %
              </h3>
              <p>Average productivity increase</p>
            </div>
            <div className="stat-card">
              <h3 className="stat-number">
                <span className={statsVisible ? "animated-number" : ""}>
                  {statsVisible ? animatedStats.sessions : "0"}
                </span>
                M+
              </h3>
              <p>Pomodoro sessions completed</p>
            </div>
            <div className="stat-card">
              <h3 className="stat-number">
                <span className={statsVisible ? "animated-number" : ""}>
                  {statsVisible ? animatedStats.satisfaction : "0"}
                </span>
                %
              </h3>
              <p>User satisfaction rate</p>
            </div>
            <div className="stat-card">
              <h3 className="stat-number">
                <span className={statsVisible ? "animated-number" : ""}>
                  {statsVisible ? animatedStats.tasks : "0"}
                </span>
                M+
              </h3>
              <p>Tasks completed with FocusBuddy</p>
            </div>
          </div>
        </div>
      </section> 

      {/* How It Works Section */}
      <section className="how-it-works-section" id="how-it-works">
        <div className="section-header">
          <span className="section-tag">Process</span>
          <h2>How FocusBuddy works</h2>
          <p>Simple steps to transform your productivity</p>
        </div>

        <div className="steps-container">
          <div className="step-card">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>Set Up Your Workspace</h3>
              <p>
                Create your profile, customize your workspace, and configure
                your preferences to match your workflow.
              </p>
            </div>
          </div>

          <div className="step-card">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>Plan Your Day</h3>
              <p>
                Add tasks, schedule focus sessions, and prioritize your work
                using our intuitive task management system.
              </p>
            </div>
          </div>

          <div className="step-card">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>Focus with Pomodoro</h3>
              <p>
                Use our customizable Pomodoro timer to work in focused
                intervals, with automatic breaks to prevent burnout.
              </p>
            </div>
          </div>

          <div className="step-card">
            <div className="step-number">4</div>
            <div className="step-content">
              <h3>Track & Optimize</h3>
              <p>
                Review your productivity analytics and insights to continuously
                improve your habits and achieve your goals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="section-header">
          <span className="section-tag">Testimonials</span>
          <h2>Loved by professionals worldwide</h2>
          <p>Read what our users have to say about FocusBuddy</p>
        </div>

        <div className="testimonials-carousel">
          <div
            className="testimonials-track"
            style={{ transform: `translateX(-${activeTestimonial * 100}%)` }}
          >
            {testimonials.map((testimonial, index) => (
              <div className="testimonial-slide" key={index}>
                <div className="testimonial-card">
                  <div className="testimonial-stars">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                      </svg>
                    ))}
                  </div>
                  <p className="testimonial-text">{testimonial.text}</p>
                  <div className="testimonial-author">
                    <div className="author-avatar">{testimonial.avatar}</div>
                    <div className="author-info">
                      <p className="author-name">{testimonial.name}</p>
                      <p className="author-title">
                        {testimonial.title} <span>· {testimonial.company}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="carousel-controls">
            {testimonials.map((_, index) => (
              <button
                key={index}
                className={`carousel-dot ${
                  activeTestimonial === index ? "active" : ""
                }`}
                onClick={() => setActiveTestimonial(index)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="pricing-section" id="pricing">
        <div className="section-header">
          <span className="section-tag">Pricing</span>
          <h2>Flexible plans for every need</h2>
          <p>No credit card required to start. Cancel anytime.</p>
        </div>

        <div className="pricing-toggle">
          <span className={`toggle-option ${true ? "active" : ""}`}>
            Monthly
          </span>
          <span className="toggle-option">
            Yearly <span className="discount-badge">Save 20%</span>
          </span>
        </div>

        <div className="pricing-grid">
          <div className="pricing-card">
            <div className="pricing-header">
              <h3>Free</h3>
              <p className="pricing-description">Perfect for getting started</p>
              <div className="pricing-price">
                <span className="price">$0</span>
                <span className="period">/month</span>
              </div>
            </div>
            <ul className="pricing-features">
              <li>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Basic Pomodoro Timer</span>
              </li>
              <li>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Simple Task Management</span>
              </li>
              <li>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Limited Analytics</span>
              </li>
              <li className="unavailable">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
                <span>Calendar Integration</span>
              </li>
              <li className="unavailable">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
                <span>Team Features</span>
              </li>
            </ul>
            <Link to="/register" className="btn btn-outline">
              Get Started
            </Link>
          </div>

          <div className="pricing-card popular">
            <div className="popular-badge">Most Popular</div>
            <div className="pricing-header">
              <h3>Pro</h3>
              <p className="pricing-description">Perfect for individuals</p>
              <div className="pricing-price">
                <span className="price">$9</span>
                <span className="period">/month</span>
              </div>
            </div>
            <ul className="pricing-features">
              <li>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Advanced Pomodoro Timer</span>
              </li>
              <li>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Advanced Task Management</span>
              </li>
              <li>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Full Analytics Dashboard</span>
              </li>
              <li>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Calendar Integration</span>
              </li>
              <li className="unavailable">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
                <span>Team Management</span>
              </li>
            </ul>
            <Link to="/register" className="btn btn-primary">
              Get Started
            </Link>
          </div>

          <div className="pricing-card">
            <div className="pricing-header">
              <h3>Team</h3>
              <p className="pricing-description">Perfect for teams</p>
              <div className="pricing-price">
                <span className="price">$19</span>
                <span className="period">/month</span>
              </div>
            </div>
            <ul className="pricing-features">
              <li>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>All Pro Features</span>
              </li>
              <li>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Team Management</span>
              </li>
              <li>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Team Analytics</span>
              </li>
              <li>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Advanced Integrations</span>
              </li>
              <li>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Priority Support</span>
              </li>
            </ul>
            <Link to="/register" className="btn btn-outline">
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section">
        <div className="section-header">
          <span className="section-tag">FAQ</span>
          <h2>Frequently Asked Questions</h2>
          <p>Everything you need to know about FocusBuddy</p>
        </div>

        <div className="faq-container">
          <details className="faq-item">
            <summary>What is FocusBuddy?</summary>
            <p>
              FocusBuddy is an all-in-one productivity platform that combines
              Pomodoro timing, task management, analytics, and social features
              to help you stay focused and get more done. It's designed to help
              individuals and teams optimize their productivity through proven
              techniques and data-driven insights.
            </p>
          </details>

          <details className="faq-item">
            <summary>Is FocusBuddy free to use?</summary>
            <p>
              Yes! We offer a generous free plan that includes all core
              features. For more advanced features like calendar integration,
              team management, and detailed analytics, we offer affordable Pro
              and Team plans. You can start with the free plan and upgrade
              whenever you're ready.
            </p>
          </details>

          <details className="faq-item">
            <summary>How does the Pomodoro timer work?</summary>
            <p>
              The Pomodoro Technique is a time management method that uses a
              timer to break work into intervals, traditionally 25 minutes in
              length, separated by short breaks. FocusBuddy lets you customize
              these intervals to match your workflow. Our smart timer also
              suggests optimal focus/break patterns based on your past
              performance.
            </p>
          </details>

          <details className="faq-item">
            <summary>Can I use FocusBuddy on mobile devices?</summary>
            <p>
              Absolutely! FocusBuddy works on all devices, including desktops,
              tablets, and smartphones. We have native apps for iOS and Android,
              as well as a responsive web app that works in any modern browser.
              Your data syncs automatically across all your devices.
            </p>
          </details>

          <details className="faq-item">
            <summary>How does the team feature work?</summary>
            <p>
              With our Team plan, you can create teams, invite members, and
              track collective productivity goals. Team leaders can view
              aggregated analytics, assign tasks, and monitor progress. Team
              members can participate in productivity challenges and
              leaderboards to stay motivated and accountable.
            </p>
          </details>

          <details className="faq-item">
            <summary>Can I integrate FocusBuddy with other tools?</summary>
            <p>
              Yes! FocusBuddy integrates with popular tools like Google
              Calendar, Outlook, Apple Calendar, Slack, Trello, Asana, and more.
              We're constantly adding new integrations based on user feedback.
              If there's a specific integration you'd like to see, please let us
              know!
            </p>
          </details>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="final-cta-section">
        <div className="cta-content">
          <h2>Ready to transform your productivity?</h2>
          <p>
            Join over 20,000 professionals who use FocusBuddy to get more done
            with less stress. Try it free for 14 days, no credit card required.
          </p>
          <div className="cta-buttons">
            <Link to="/register" className="btn btn-primary btn-large">
              Start Your Free Trial
            </Link>
            <Link to="/demo" className="btn btn-outline btn-large">
              Schedule a Demo
            </Link>
          </div>
          <div className="cta-guarantee">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            <span>30-day money-back guarantee. Cancel anytime.</span>
          </div>
        </div>
      </section>

      {/* API Status - Hidden in production, useful for development */}
      <div
        className="api-status"
        style={{
          display: process.env.NODE_ENV === "production" ? "none" : "block",
        }}
      >
        <h3>API Status:</h3>
        <p>{apiStatus || "Checking..."}</p>
      </div>
    </div>
  );
};

export default Home;
