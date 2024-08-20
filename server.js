const express = require('express');
const fetch = require('node-fetch');

const app = express();
app.use(express.json());

// PayPal credentials
const clientId = 'AZ7poj2HOeKuQDtY19tPB5sK6v07_4w3M7BZbOcj172BgpEEruFlMRSNythoreHpOlZptiGRzQfb4Uzi'; // Replace with your PayPal client ID
const clientSecret = 'ENq_yNAF_KcrNlsvaSZuU_3V9QLf8plkMzFBo0-F1ACqkXXCwEonBT9kcqyT48ZfsXysq1hLX1f8KF1Q'; // Replace with your PayPal client secret
const baseURL = 'https://api-m.sandbox.paypal.com'; // Use 'https://api-m.paypal.com' for live environment
// PayPal configuration

// Endpoint to get PayPal access token
app.get('/paypal-token', async (req, res) => {
    const auth = btoa(`${clientId}:${clientSecret}`);
    const response = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
    });

    const data = await response.json();
    res.json({ access_token: data.access_token });
});

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
app.post('/create-paypal-order', async (req, res) => {
    try {
        const response = await fetch('https://api-m.sandbox.paypal.com/v2/checkout/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
                'PayPal-Request-Id': '7b92603e-77ed-4896-8e78-5dea2050476a' // Unique request ID
            },
            body: JSON.stringify({
                "intent": "CAPTURE",
                "purchase_units": [{
                    "reference_id": "unique_reference_id", // Replace with a unique reference ID if needed
                    "amount": {
                        "currency_code": "USD",
                        "value": req.body.amount
                    }
                }],
                "payment_source": {
                    "paypal": {
                        "experience_context": {
                            "payment_method_preference": "IMMEDIATE_PAYMENT_REQUIRED",
                            "brand_name": "Your Brand",
                            "locale": "en-US",
                            "landing_page": "LOGIN",
                            "shipping_preference": "SET_PROVIDED_ADDRESS",
                            "user_action": "PAY_NOW",
                            "return_url": "https://example.com/returnUrl",
                            "cancel_url": "https://example.com/cancelUrl"
                        }
                    }
                }
            })
        });
        const orderData = await response.json();
        res.json({ id: orderData.id });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error creating PayPal order');
    }
});

// Capture PayPal order
app.post('/capture-paypal-order', async (req, res) => {
    const { orderId } = req.body;

    if (!orderId) {
        return res.status(400).send('Order ID is required');
    }

    try {
        const response = await fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderId}/capture`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
                'PayPal-Request-Id': '7b92603e-77ed-4896-8e78-5dea2050476a' // Unique request ID
            }
        });
        const captureData = await response.json();
        res.json({ status: captureData.status });
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
