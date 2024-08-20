const express = require('express');
const fetch = require('node-fetch');
const axios = require('axios');
const btoa = require('btoa');

const app = express();
app.use(express.json());

const clientId = 'AZ7poj2HOeKuQDtY19tPB5sK6v07_4w3M7BZbOcj172BgpEEruFlMRSNythoreHpOlZptiGRzQfb4Uzi';
const clientSecret = 'ENq_yNAF_KcrNlsvaSZuU_3V9QLf8plkMzFBo0-F1ACqkXXCwEonBT9kcqyT48ZfsXysq1hLX1f8KF1Q';
const baseURL = 'https://api-m.sandbox.paypal.com'; // Use sandbox for testing

const cjApiKey = 'YOUR_CJ_DROPSHIPPING_API_KEY'; // Replace with your CJ Dropshipping API Key
const cjApiBaseURL = 'https://developers.cjdropshipping.com/';

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

app.post('/create-order', async (req, res) => {
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
                }]
            })
        });
        const orderData = await response.json();
        res.json({ id: orderData.id });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error creating PayPal order');
    }
});

app.post('/capture-order', async (req, res) => {
    const { orderId, productId, quantity, shippingInfo } = req.body;

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

        if (captureData.status !== 'COMPLETED') {
            return res.status(400).send('Payment not completed');
        }

        // Create CJ Dropshipping Order
        const cjOrderResponse = await axios.post(
            `${cjApiBaseURL}/api/order/addOrder`,
            {
                orderId: orderId,
                productList: [
                    {
                        productId: productId,
                        quantity: quantity
                    }
                ],
                shippingInfo: shippingInfo
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${cjApiKey}`
                }
            }
        );

        if (cjOrderResponse.data.success) {
            res.json({ message: 'CJ Dropshipping order created successfully!', orderId: cjOrderResponse.data.orderId });
        } else {
            res.status(500).json({ message: 'Failed to create CJ Dropshipping order', details: cjOrderResponse.data });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error capturing PayPal order');
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
