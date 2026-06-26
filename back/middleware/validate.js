const { body, param, validationResult } = require('express-validator');

// Валидация для ID
const tierListIdSchema = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('L\'identifiant doit être un nombre entier positif')
];

// Валидация для /api/parse
const parseSchema = [
  body('url')
    .isURL()
    .withMessage('L\'URL fournie est invalide'),
  body('html')
    .isString()
    .notEmpty()
    .withMessage('Le contenu HTML est requis'),
  body('tierListId')
    .isInt({ min: 1 })
    .withMessage('L\'identifiant du tier-list est invalide'),
  body('imageUrl')
    .optional()
    .isURL()
    .withMessage('L\'URL de l\'image est invalide')
];

// Валидация для /api/compareData
const compareSchema = [
  body('userMessage')
    .isString()
    .notEmpty()
    .withMessage('Le message utilisateur est requis'),
  body('tierListId')
    .isInt({ min: 1 })
    .withMessage('L\'identifiant du tier-list est invalide')
];

// Middleware проверки результата
const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    res.status(400).json({
      error: 'Validation échouée',
      details: errors.array().map(e => e.msg)
    });
  };
};

module.exports = {
  validate,
  tierListIdSchema,
  parseSchema,
  compareSchema
};