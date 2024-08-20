const express = require('express');
const fetch = require('node-fetch');
const btoa = require('btoa');

const app = express();
app.use(express.json());

const clientId = 'AZ7poj2HOeKuQDtY19tPB5sK6v07_4w3M7BZbOcj172BgpEEruFlMRSNythoreHpOlZptiGRzQfb4Uzi'; // Replace with your PayPal client ID
const clientSecret = 'ENq_yNAF_KcrNlsvaSZuU_3V9QLf8plkMzFBo0-F1ACqkXXCwEonBT9kcqyT48ZfsXysq1hLX1f8KF1Q'; // Replace with your PayPal client secret
const baseURL = 'https://api-m.sandbox.paypal.com';

let cachedToken = null;
let tokenExpiry = null;

async function getAccessToken() {
    if (cachedToken && tokenExpiry > Date.now()) {
        return cachedToken;
    }

    const auth = btoa(`${clientId}:${clientSecret}`);
    const response = await fetch(`${baseURL}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error('Failed to retrieve PayPal token');
    }

    cachedToken = data.access_token;
    tokenExpiry = Date.now() + data.expires_in * 1000; // Convert expires_in to milliseconds
    return cachedToken;
}

app.post('/create-paypal-order', async (req, res) => {
    try {
        const accessToken = await getAccessToken();
        const response = await fetch(`${baseURL}/v2/checkout/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
                "intent": "CAPTURE",
                "purchase_units": [{
                    "reference_id": "unique_reference_id",
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

app.post('/capture-paypal-order', async (req, res) => {
    const { orderId } = req.body;

    if (!orderId) {
        return res.status(400).send('Order ID is required');
    }

    try {
        const accessToken = await getAccessToken();
        const response = await fetch(`${baseURL}/v2/checkout/orders/${orderId}/capture`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            }
        });
        const captureData = await response.json();
        res.json({ status: captureData.status });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error capturing PayPal order');
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
