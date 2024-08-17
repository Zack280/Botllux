const axios = require('axios');
const stripe = require('stripe')('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');


const apiKey = '33b93f0cf2c04545b812cd9a840f88ce';
const apiUrl = 'https://api.cjdropshipping.com'; // Replace with the actual CJ Dropshipping API URL

const cjApi = axios.create({
  baseURL: apiUrl,
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  }
});

const getProducts = async () => {
  try {
    const response = await cjApi.get('https://developers.cjdropshipping.com/api2.0/v1/product/list'); // Replace with actual endpoint
    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

const createOrder = async (orderData) => {
  try {
    const response = await cjApi.post('https://developers.cjdropshipping.com/api2.0/v1/shopping/order/createOrder', orderData); // Replace with actual endpoint
    return response.data;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

module.exports = { getProducts, createOrder };
