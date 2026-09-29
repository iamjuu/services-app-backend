const express = require('express');
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const rateLimit = require('express-rate-limit');
const swaggerSpec = require('./config/swagger');

const { apiRouter } = require('./routes');
const { notFound, errorHandler } = require('./middlewares/errorMiddleware');

const app = express();

// Rate limiter for API protection
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes'
  }
});

// Middleware
app.use(limiter);
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Public Profile Photos only
// NOTE: Identity documents in uploads/documents are strictly NOT exposed here for security!
app.use('/uploads/profiles', express.static(path.join(__dirname, '../uploads/profiles')));

// API Documentation via Swagger
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Skilled Service Marketplace API Docs',
  customCss: '.swagger-ui .topbar { display: none }'
}));
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date(),
    service: 'Skilled Service Marketplace Backend API'
  });
});

// Modular Routes (Domain partitioned + backward-compatible endpoints)
app.use('/api', apiRouter);

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

module.exports = app;
