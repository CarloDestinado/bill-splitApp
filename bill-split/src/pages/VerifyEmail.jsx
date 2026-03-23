import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import api from "../services/api";
import "./VerifyEmail.css";

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmail = async () => {
      // Get parameters from URL
      const id = searchParams.get("id");
      const hash = searchParams.get("hash");
      const signature = searchParams.get("signature");
      const expires = searchParams.get("expires");

      if (!id || !hash || !signature || !expires) {
        setStatus("error");
        setMessage("Invalid verification link. Please request a new one.");
        return;
      }

      try {
        // Call the API verification endpoint
        const response = await api.get(`/email/verify/${id}/${hash}`, {
          params: { signature, expires },
        });

        if (response.data.message.includes("already verified")) {
          setStatus("already-verified");
          setMessage(response.data.message);
        } else {
          setStatus("success");
          setMessage(response.data.message);
        }
      } catch (err) {
        console.error("Verification error:", err);
        setStatus("error");
        setMessage(
          err.response?.data?.message ||
          "Invalid or expired verification link. Please request a new one."
        );
      }
    };

    verifyEmail();
  }, [searchParams]);

  const handleResendVerification = async () => {
    // Try to get email from multiple sources
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get("email") || localStorage.getItem("pending_email");

    if (!email) {
      setMessage("Email not found. Please try logging in again.");
      return;
    }

    try {
      const response = await api.post("/email/verify/resend", { email });
      setMessage(response.data.message);
    } catch (err) {
      setMessage(
        err.response?.data?.message || "Failed to resend verification email."
      );
    }
  };

  return (
    <div className="verify-page">
      <div className="verify-container">
        <div className="verify-card">
          {status === "verifying" && (
            <>
              <div className="verify-icon verifying">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2>Verifying your email...</h2>
              <p>Please wait a moment</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="verify-icon success">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2>Email Verified!</h2>
              <p>{message}</p>
              <p className="success-text">
                You can now log in to your account
              </p>
              <Link to="/login" className="verify-btn">
                Go to Login
              </Link>
            </>
          )}

          {status === "already-verified" && (
            <>
              <div className="verify-icon already-verified">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2>Email Already Verified</h2>
              <p>{message}</p>
              <p className="info-text">
                Your email has already been verified
              </p>
              <Link to="/login" className="verify-btn">
                Go to Login
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <div className="verify-icon error">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2>Verification Failed</h2>
              <p className="error-text">{message}</p>
              <button
                onClick={handleResendVerification}
                className="verify-btn resend"
              >
                Resend Verification Email
              </button>
              <Link to="/login" className="verify-link">
                Back to Login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default VerifyEmail;
