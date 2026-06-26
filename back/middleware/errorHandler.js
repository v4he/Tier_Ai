const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Création du dossier logs si nécessaire
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

/**
 * Configuration des logs avec Winston
 * - Les erreurs vont dans error.log
 * - Tout va dans combined.log
 * - Affichage console pour le développement
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880,
      maxFiles: 5
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

/**
 * Middleware global de gestion d'erreurs
 * Capture toutes les erreurs non traitées et renvoie une réponse JSON
 */
function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const message = err.message || 'Une erreur interne est survenue sur le serveur.';

  // Log de l'erreur avec le contexte
  logger.error({
    message: message,
    status: status,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: req.userId || 'non authentifié',
    stack: err.stack
  });

  // Réponse au client
  res.status(status).json({
    error: message,
    status: status,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

module.exports = { errorHandler, logger };