const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { logger } = require('./errorHandler');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
const SALT_ROUNDS = 10;

/**
 * Hashage d'un mot de passe
 */
async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Vérification d'un mot de passe
 */
async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

/**
 * Génération d'un token JWT
 */
function generateToken(userId, email) {
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Middleware d'authentification JWT
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('Tentative d\'accès sans token');
    return res.status(401).json({ 
      error: 'Authentification requise. Veuillez fournir un token JWT valide.' 
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    next();
  } catch (err) {
    logger.warn(`Token invalide : ${err.message}`);
    return res.status(401).json({ 
      error: 'Token invalide ou expiré. Veuillez vous reconnecter.' 
    });
  }
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken,
  authenticate
};