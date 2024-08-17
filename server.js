// server.js
const express = require('express');
const app = express();
const stripe = require('stripe')('sk_test_51PoC52K4kIROIBXXCWPl4Wel4ghYynbVeIwkUtMNomHwdKqE7OVKL9rExHbemQRfS00dmij7kwl830xcmAKCOzsA00nOeatmSs');
const cors = require('cors');

app.use(cors());
app.use(express.json());

app.post('/create-checkout-session', async (req, res) => {
    const items = req.body.items;

    // Format the items for Stripe
    const lineItems = items.map(item => {
        return {
            price_data: {
                currency: 'usd',
                product_data: {
                    name: item.name,
                    images: [item.image],
                },
                unit_amount: Math.round(item.price * 100), // Stripe expects prices in cents
            },
            quantity: item.quantity,
        };
    });

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: 'http://localhost:3000/success', // Change to your success URL
        cancel_url: 'http://localhost:3000/cancel',   // Change to your cancel URL
    });

    res.json({ id: session.id });
});

app.listen(3000, () => console.log('Server running on port 3000'));
