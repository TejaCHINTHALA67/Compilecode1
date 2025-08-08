const express = require('express');
const Razorpay = require('razorpay');
const stripe = require('stripe');
const { auth, requireKYC } = require('../middleware/auth');

const router = express.Router();

// Initialize payment gateways
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);

// Create Razorpay order (for UPI/India)
router.post('/razorpay/create-order', auth, requireKYC, async (req, res) => {
  try {
    const { amount, currency = 'INR' } = req.body;

    const options = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency,
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order',
      error:
        process.env.NODE_ENV === 'development'
          ? error.message
          : 'Internal server error',
    });
  }
});

// Create Stripe payment intent (for global)
router.post('/stripe/create-intent', auth, requireKYC, async (req, res) => {
  try {
    const { amount, currency = 'USD' } = req.body;

    const paymentIntent = await stripeClient.paymentIntents.create({
      amount: amount * 100, // Stripe expects amount in cents
      currency,
      metadata: {
        userId: req.user.userId,
      },
    });

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      },
    });
  } catch (error) {
    console.error('Stripe payment intent error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment intent',
      error:
        process.env.NODE_ENV === 'development'
          ? error.message
          : 'Internal server error',
    });
  }
});

// Verify payment
router.post('/verify', auth, async (req, res) => {
  try {
    const { paymentId, orderId, signature, gateway } = req.body;

    let isValid = false;

    if (gateway === 'razorpay') {
      const crypto = require('crypto');
      const body = orderId + "|" + paymentId;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');
      isValid = expectedSignature === signature;
    } else if (gateway === 'stripe') {
      // For Stripe, verification is handled during payment intent confirmation
      isValid = true;
    }

    res.json({
      success: true,
      data: { isValid },
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error:
        process.env.NODE_ENV === 'development'
          ? error.message
          : 'Internal server error',
    });
  }
});

module.exports = router;
