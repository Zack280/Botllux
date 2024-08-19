// server.js
const express = require('express');
const paypal = require('@paypal/checkout-server-sdk');

const app = express();
app.use(express.json());

// PayPal configuration
const clientId = 'AZ7poj2HOeKuQDtY19tPB5sK6v07_4w3M7BZbOcj172BgpEEruFlMRSNythoreHpOlZptiGRzQfb4Uzi'; // Replace with your PayPal client ID
const clientSecret = 'ENq_yNAF_KcrNlsvaSZuU_3V9QLf8plkMzFBo0-F1ACqkXXCwEonBT9kcqyT48ZfsXysq1hLX1f8KF1Q'; // Replace with your PayPal client secret
const environment = new paypal.core.SandboxEnvironment(clientId, clientSecret);
const client = new paypal.core.PayPalHttpClient(environment);

// Create PayPal order
app.post('/create-paypal-order', async (req, res) => {
    const request = new paypal.orders.OrdersCreateRequest();
    request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{
            amount: {
                currency_code: 'USD',
                value: req.body.amount
            }
        }]
    });

    try {
        const order = await client.execute(request);
        res.json({ id: order.result.id });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error creating PayPal order');
    }
});

// Capture PayPal order
app.post('/capture-paypal-order', async (req, res) => {
    const request = new paypal.orders.OrdersCaptureRequest(req.body.orderId);
    request.requestBody({});

    try {
        const capture = await client.execute(request);
        res.json({ status: capture.result.status });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error capturing PayPal order');
    }
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
