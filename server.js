const express = require('express');
const fetch = require('node-fetch');
const axios = require('axios');
const btoa = require('btoa');
const session = require('express-session');
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;

const app = express();
app.use(express.json());

// GitHub OAuth credentials
const GITHUB_CLIENT_ID = 'Ov23liuQCr3xgb3Vn1Rg';
const GITHUB_CLIENT_SECRET = '502683464dc44b5de92f08cb2b199a264f161957';

// PayPal credentials
const clientId = 'AZ7poj2HOeKuQDtY19tPB5sK6v07_4w3M7BZbOcj172BgpEEruFlMRSNythoreHpOlZptiGRzQfb4Uzi';
const clientSecret = 'ENq_yNAF_KcrNlsvaSZuU_3V9QLf8plkMzFBo0-F1ACqkXXCwEonBT9kcqyT48ZfsXysq1hLX1f8KF1Q';
const baseURL = 'https://api-m.sandbox.paypal.com'; // Use sandbox for testing

const cjApiKey = '33b93f0cf2c04545b812cd9a840f88ce'; // Replace with your CJ Dropshipping API Key
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

// Initialize session middleware
app.use(session({
    secret: 'your_secret',
    resave: false,
    saveUninitialized: true
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Configure Passport to use GitHub OAuth strategy
passport.use(new GitHubStrategy({
    clientID: GITHUB_CLIENT_ID,
    clientSecret: GITHUB_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/github/callback"
},
function(accessToken, refreshToken, profile, done) {
    // Here, you would typically save the user profile to your database
    return done(null, profile);
}));

// Serialize user information into session
passport.serializeUser((user, done) => {
    done(null, user);
});

// Deserialize user from session
passport.deserializeUser((obj, done) => {
    done(null, obj);
});

// Define GitHub OAuth routes
app.get('/auth/github',
    passport.authenticate('github', { scope: ['user:email'] })
);

app.get('/auth/github/callback', 
    passport.authenticate('github', { failureRedirect: '/' }),
    (req, res) => {
        // Successful authentication
        res.redirect('/');
    }
);

// Protected route that requires authentication
app.get('/profile', ensureAuthenticated, (req, res) => {
    res.json(req.user);
});

// Middleware to ensure a user is authenticated
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/auth/github');
}

// PayPal order creation route
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

// PayPal order capture and CJ Dropshipping order creation
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

// Home route
app.get('/', (req, res) => {
    res.send('<h1>Welcome! <a href="/auth/github">Login with GitHub</a></h1>');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
