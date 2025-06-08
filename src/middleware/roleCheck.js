// Middleware to check user roles
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      // Check if user exists in request (added by auth middleware)
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Check if user's role is in allowed roles
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
      }

      next();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
};

module.exports = { checkRole }; 