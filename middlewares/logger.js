function logger(req, res, next) {
  const now = new Date().toISOString();
  console.log(`[${now}] ${req.method} ${req.originalUrl} - User: ${req.user?.id || 'Anon'}`);
  next();
}

module.exports = logger;
