const ensureAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.is_admin) {
    return next();
  }
  res.status(403).send('Access denied. Admins only.');
};

module.exports = { ensureAdmin };