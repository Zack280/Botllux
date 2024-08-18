const express = require('express');
const axios = require('axios');
const stripe = require('stripe')('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');

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

// Endpoint to handle payment and order creation
app.post('/api/pay', async (req, res) => {
  try {
    const { orderData, paymentMethodId } = req.body;

    // Create Payment Intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: orderData.amount, // Amount should be in cents
      currency: 'usd',
      payment_method: paymentMethodId,
      confirm: true, // Automatically confirm the payment
    });

    // If payment is successful, create the order in CJ Dropshipping
    if (paymentIntent.status === 'succeeded') {
      const orderResponse = await cjApi.post('/shopping/order/createOrder', orderData);
      
      return res.json({ success: true, orderResponse: orderResponse.data });
    } else {
      return res.status(400).json({ error: 'Payment not successful' });
    }

  } catch (error) {
    console.error('Error processing payment and order:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Example endpoint for fetching products (if needed)
app.get('/api/products', async (req, res) => {
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
