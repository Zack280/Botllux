const express = require('express');
const axios = require('axios');
const cors = require('cors');
const paypal = require('@paypal/checkout-server-sdk');

const app = express();
app.use(express.json());
app.use(cors()); // Enable CORS for all origins

const apiKey = '33b93f0cf2c04545b812cd9a840f88ce';
const apiUrl = 'https://developers.cjdropshipping.com/api2.0/v1';

// PayPal configuration
const clientId = 'AZ7poj2HOeKuQDtY19tPB5sK6v07_4w3M7BZbOcj172BgpEEruFlMRSNythoreHpOlZptiGRzQfb4Uzi'; // Replace with your PayPal client ID
const clientSecret = 'ENq_yNAF_KcrNlsvaSZuU_3V9QLf8plkMzFBo0-F1ACqkXXCwEonBT9kcqyT48ZfsXysq1hLX1f8KF1Q'; // Replace with your PayPal client secret

// Create a PayPal environment
const environment = new paypal.core.SandboxEnvironment(clientId, clientSecret);
const client = new paypal.core.PayPalHttpClient(environment);

// Endpoint to create a PayPal Order
app.post('/create-paypal-order', async (req, res) => {
  const { amount } = req.body;

  try {
    const request = new paypal.orders.OrdersCreateRequest();
    request.preferredPaymentSource = 'paypal';
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'USD',
          value: amount // Amount in USD
        }
      }]
    });

    const order = await client.execute(request);
    res.send({
      id: order.result.id
    });
  } catch (error) {
    console.error('Error creating PayPal order:', error);
    res.status(500).send({ error: 'Failed to create PayPal order' });
  }
});

// Endpoint to capture a PayPal Order
app.post('/capture-paypal-order', async (req, res) => {
  const { orderId } = req.body;

  try {
    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});

    const capture = await client.execute(request);
    res.send({
      status: capture.result.status
    });
  } catch (error) {
    console.error('Error capturing PayPal order:', error);
    res.status(500).send({ error: 'Failed to capture PayPal order' });
  }
});

// Endpoint to handle payment and order creation through CJ Dropshipping
app.post('/api/pay', async (req, res) => {
  try {
    const { orderData } = req.body;

    // Example payment method ID or any specific data required by CJ Dropshipping for the payment
    const paymentMethodId = 'your-payment-method-id'; // Replace with actual payment method ID

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
