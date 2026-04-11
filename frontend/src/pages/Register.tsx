import "./Register.css";
import "./Login.css";
import { Link, useNavigate } from "react-router-dom";
import GoogleButton from "../components/ui/GoogleButton";
import { useEffect, useState } from "react";
import { useAuth } from "../services/AuthProvider";
import { useNoti } from "../services/NotiProvider";
export default function Register() {
  const { user, handleLogin } = useAuth();
  const { setNotification } = useNoti();
  const [checked, setChecked] = useState<boolean>(false);
  const [visibleError, setVisibleError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const handleRegisterClick = async () => {
    if (checked) {
      setIsLoading(true);
      setNotification("Redirecting to Google Sign-Up...");
      try {
        await handleLogin();
      } catch (error) {
        console.error("Login failed", error);
        setIsLoading(false);
        setNotification("Login failed. Please try again.");
      }
    } else {
      setVisibleError(true);
    }
  };
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);
  return (
    <>
      <title>Create Account — Smart Home UIA</title>
      <div className="page-wrapper">
        <aside className="left-panel">
          <a href="login.html" className="logo anim-slide-left">
            <div className="logo-mark">S</div>
            <div className="logo-text">
              Smart Home UIA
              <span>Intelligent Living</span>
            </div>
          </a>

          <div className="panel-hero">
            <div className="panel-tag anim-slide-left delay-1">
              Get Started · Free
            </div>

            <h1 className="panel-heading register-heading anim-slide-left delay-2">
              Set up your
              <br />
              home in just
              <br />
              <em>3 steps.</em>
            </h1>

            <div className="step-list anim-slide-left delay-3">
              <div className="step-item">
                <div className="step-num">1</div>
                <div>
                  <div className="step-text">Create your account</div>
                  <div className="step-sub">
                    Sign up with your Google account
                  </div>
                </div>
              </div>
              <div className="step-item">
                <div className="step-num">2</div>
                <div>
                  <div className="step-text">Connect your devices</div>
                  <div className="step-sub">
                    Add lights, thermostats, cameras &amp; more
                  </div>
                </div>
              </div>
              <div className="step-item">
                <div className="step-num">3</div>
                <div>
                  <div className="step-text">Automate everything</div>
                  <div className="step-sub">
                    Build scenes, schedules, and smart rules
                  </div>
                </div>
              </div>
            </div>

            <div className="stats-row anim-slide-left delay-4">
              <div className="stat-box">
                <span className="stat-num">Free</span>
                <span className="stat-label">Forever Plan</span>
              </div>
              <div className="stat-box">
                <span className="stat-num">2 min</span>
                <span className="stat-label">Setup Time</span>
              </div>
              <div className="stat-box" style={{ background: "var(--accent)" }}>
                <span className="stat-num">0</span>
                <span className="stat-label">No Card Needed</span>
              </div>
            </div>
          </div>
        </aside>

        <main className="right-panel">
          <p className="panel-nav">
            Already a member? <Link to="/login">Sign in</Link>
          </p>

          <div className="form-card">
            <p className="form-eyebrow anim-slide-up">New Account</p>
            <h2 className="form-title anim-slide-up delay-1">
              Create your
              <br />
              account today.
            </h2>
            <p className="form-subtitle anim-slide-up delay-2">
              Join 40,000+ homeowners using Smart Home UIA to automate and
              monitor their living spaces.
            </p>

            <div className="benefit-row anim-slide-up delay-2">
              <div className="benefit-item">
                <div className="benefit-dot"></div>
                Control unlimited devices from one dashboard
              </div>
              <div className="benefit-item">
                <div className="benefit-dot"></div>
                Real-time alerts and energy usage insights
              </div>
              <div className="benefit-item">
                <div className="benefit-dot"></div>
                Share access with family members securely
              </div>
            </div>

            <div className="anim-slide-up delay-3">
              <GoogleButton
                isLoading={isLoading}
                onClick={handleRegisterClick}
              />
            </div>

            <div className="terms-block anim-slide-up delay-4">
              <input
                type="checkbox"
                id="terms-cb"
                className="custom-checkbox"
                checked={checked}
                onChange={(e) => {
                  setChecked(e.target.checked);
                  setVisibleError(false);
                }}
              />
              <div>
                <label htmlFor="terms-cb" className="terms-text">
                  By creating an account, I confirm I have read and agree to the
                  <a href="#">Terms of Service</a>,
                  <a href="#">Privacy Policy</a>, and
                  <a href="#">Data Processing Agreement</a> of Smart Home UIA.
                </label>
                {visibleError && (
                  <div id="terms-error-msg" className="terms-error">
                    Please accept the Terms of Service to create your account.
                  </div>
                )}
              </div>
            </div>

            <div className="divider anim-slide-up delay-5">
              <div className="divider-line"></div>
              <span className="divider-text">Secured by</span>
              <div className="divider-line"></div>
            </div>

            <div className="security-row anim-slide-up delay-5">
              <div className="badge">
                <span className="badge-title">OAuth 2.0</span>
                <span className="badge-sub">Industry Standard</span>
              </div>
              <div className="badge">
                <span className="badge-title">End-to-End</span>
                <span className="badge-sub">Encrypted</span>
              </div>
              <div className="badge">
                <span className="badge-title">GDPR</span>
                <span className="badge-sub">Compliant</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
