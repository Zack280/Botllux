const express = require('express');
const axios = require('axios');
const Stripe = require('stripe');
const stripe = Stripe('sk_test_51PoC52K4kIROIBXXCWPl4Wel4ghYynbVeIwkUtMNomHwdKqE7OVKL9rExHbemQRfS00dmij7kwl830xcmAKCOzsA00nOeatmSs'); // Replace with your Stripe secret key

const app = express();
app.use(express.json());

const apiKey = '33b93f0cf2c04545b812cd9a840f88ce';
const apiUrl = 'https://developers.cjdropshipping.com/api2.0/v1';

const cjApi = axios.create({
  baseURL: apiUrl,
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  }
});

// Endpoint to create a Stripe Payment Intent
app.post('/create-payment-intent', async (req, res) => {
  const { amount } = req.body;

  try {
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

// Endpoint to handle payment and order creation through CJ Dropshipping
app.post('https://developers.cjdropshipping.com/api2.0/v1/shopping/pay/payBalance', async (req, res) => {
  try {
    const { orderData } = req.body;

    // Example payment method ID or any specific data required by CJ Dropshipping for the payment
    const paymentMethodId = 'your-payment-method-id';

    // Call CJ Dropshipping API to process payment and create the order
    const response = await cjApi.post('/shopping/pay/payBalance', {
      paymentMethodId,
      orderData
    });

    if (response.data.success) {
      // Payment and order creation successful
      return res.json({ success: true, orderResponse: response.data });
    } else {
      return res.status(400).json({ error: 'Payment not successful' });
    }

  } catch (error) {
    console.error('Error processing payment and order:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Example endpoint for fetching products (if needed)
app.get('https://developers.cjdropshipping.com/api2.0/v1/product/list', async (req, res) => {
  try {
    const response = await cjApi.get('/product/list');
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
