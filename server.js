// server.js
const express = require('express');
const fetch = require('node-fetch');

const app = express();
app.use(express.json());

// PayPal credentials
const clientId = 'AZ7poj2HOeKuQDtY19tPB5sK6v07_4w3M7BZbOcj172BgpEEruFlMRSNythoreHpOlZptiGRzQfb4Uzi'; // Replace with your PayPal client ID
const clientSecret = 'ENq_yNAF_KcrNlsvaSZuU_3V9QLf8plkMzFBo0-F1ACqkXXCwEonBT9kcqyT48ZfsXysq1hLX1f8KF1Q'; // Replace with your PayPal client secret
const baseURL = 'https://api-m.sandbox.paypal.com'; // Use 'https://api-m.paypal.com' for live environment

// Helper function to get access token
async function getAccessToken() {
    const response = await fetch(`${baseURL}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
    });

    const data = await response.json();
    return data.access_token;
}

// Create PayPal order
app.post('https://api-m.paypal.com/v2/checkout/orders', async (req, res) => {
    const accessToken = await getAccessToken();
    
    const orderData = {
        intent: 'CAPTURE',
        purchase_units: [{
            amount: {
                currency_code: 'USD',
                value: req.body.amount
            }
        }]
    };

    const response = await fetch(`${baseURL}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
    });

    const order = await response.json();

    if (response.ok) {
        res.json({ id: order.id });
    } else {
        console.error(order);
        res.status(500).send('Error creating PayPal order');
    }
});

// Capture PayPal order
app.post('https://api-m.paypal.com/v2/checkout/orders/${id}/capture', async (req, res) => {
    const accessToken = await getAccessToken();
    const orderId = req.body.orderId;

    const response = await fetch(`${baseURL}/v2/checkout/orders/${id}/capture`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    });

    const capture = await response.json();

    if (response.ok) {
        res.json({ status: capture.status });
    } else {
        console.error(capture);
        res.status(500).send('Error capturing PayPal order');
    }
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
