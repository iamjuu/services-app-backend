const Razorpay = require('razorpay');
const crypto = require('crypto');
const { AppSetting } = require('../models');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Returns the current registration fee in paise.
 * Priority: DB (admin-controlled) → .env fallback → 1000 (₹10)
 */
const getRegistrationFeePaise = async () => {
  try {
    const setting = await AppSetting.findOne({ key: 'global' });
    if (setting) return setting.registrationFeePaise;
  } catch (_) {}
  return Number(process.env.REGISTRATION_FEE_PAISE) || 1000;
};

// @desc    Create a Razorpay order for professional registration fee
// @route   POST /api/payments/create-order
// @access  Public
const createOrder = async (req, res, next) => {
  try {
    const amount = await getRegistrationFeePaise();

    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: `reg_fee_${Date.now()}`,
      notes: { purpose: 'professional_registration' },
    });

    res.status(200).json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID,
        amountInRupees: order.amount / 100,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Razorpay payment signature
// @route   POST /api/payments/verify
// @access  Public
const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing payment verification fields' });
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment signature verification failed' });
    }

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        verified: true,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current registration fee (public — used by mobile before order creation)
// @route   GET /api/payments/fee
// @access  Public
const getRegistrationFee = async (req, res, next) => {
  try {
    const feePaise = await getRegistrationFeePaise();
    res.status(200).json({
      success: true,
      data: { feePaise, feeRupees: feePaise / 100 },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createOrder, verifyPayment, getRegistrationFee };
