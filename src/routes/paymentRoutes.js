const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment, getRegistrationFee } = require('../controllers/paymentController');

// GET  /api/payments/fee           → returns current registration fee (public)
router.get('/fee', getRegistrationFee);

// POST /api/payments/create-order  → creates Razorpay order
router.post('/create-order', createOrder);

// POST /api/payments/verify        → verifies payment signature
router.post('/verify', verifyPayment);

module.exports = router;
