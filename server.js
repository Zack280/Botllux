const express = require('express');
const Stripe = require('stripe');
const stripe = Stripe('sk_test_51PoC52K4kIROIBXXCWPl4Wel4ghYynbVeIwkUtMNomHwdKqE7OVKL9rExHbemQRfS00dmij7kwl830xcmAKCOzsA00nOeatmSs'); // Replace with your Stripe secret key

const app = express();
app.use(express.json());

// Endpoint to create a Stripe Payment Intent
app.post('/create-payment-intent', async (req, res) => {
  const { amount } = req.body;

  try {
    if (!amount || amount <= 0) {
      return res.status(400).send({ error: 'Invalid amount' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount, // Amount in cents
      currency: 'usd'
    });

    res.send({
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).send({ error: 'Failed to create payment intent' });
  }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
