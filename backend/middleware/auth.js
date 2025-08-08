const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback_secret"

    // Get user from database
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Token is not valid. User not found.",
      });
    }

    // Check if user account is active
    if (user.status !== "active") {
      return res.status(401).json({
        success: false,
        message: "Account is suspended or deactivated.",
      });
    }

    // Add user to request object
    req.user = decoded;
    req.userProfile = user;

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Token is not valid.",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token has expired.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error during authentication.",
    });
  }
};

// Optional auth middleware - doesn't fail if no token provided
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (token) {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "fallback_secret"
      );
      const user = await User.findById(decoded.userId).select("-password");

      if (user && user.status === "active") {
        req.user = decoded;
        req.userProfile = user;
      }
    }

    next();
  } catch (error) {
    // For optional auth, we don't send error response
    // Just continue without user data
    next();
  }
};

// Role-based access control
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.userProfile) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const userRoles = Array.isArray(req.userProfile.userType)
      ? req.userProfile.userType
      : [req.userProfile.userType];

    // Check if user has 'both' type (can access all roles)
    if (userRoles.includes("both")) {
      return next();
    }

    // Check if user has required role
    const hasRole = roles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(" or ")}`,
      });
    }

    next();
  };
};

// KYC verification middleware
const requireKYC = (req, res, next) => {
  if (!req.userProfile) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  if (req.userProfile.kycStatus !== "verified") {
    return res.status(403).json({
      success: false,
      message: "KYC verification required to access this feature.",
    });
  }

  next();
};

module.exports = {
  auth,
  optionalAuth,
  requireRole,
  requireKYC,
};
