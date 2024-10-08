// Add to Cart Buttons
const addToCartButtons = document.querySelectorAll('.add-to-cart-button');
addToCartButtons.forEach(button => {
    button.addEventListener('click', (event) => {
        event.preventDefault();

        // Get product details from the product card
        const productElement = button.closest('.product-card');
        const productId = productElement.dataset.productId;
        const productName = productElement.querySelector('h3').textContent;
        const productPrice = parseFloat(productElement.querySelector('.price').textContent.replace('$', ''));
        const productQuantity = 1; // Default quantity to 1

        // Get the image URL or use a default
        const imageUrl = productElement.querySelector('img').src || 'https://i.ibb.co/qsTgdW5/Botlluxe.png';

        console.log('Adding to cart:', { id: productId, name: productName, price: productPrice, quantity: productQuantity });

        // Create product object
        const product = {
            id: productId,
            name: productName,
            price: productPrice,
            quantity: productQuantity,
            image: imageUrl
        };

        // Add product to cart
        addToCart(product);
    });
});

// Contact Form Submission
const contactForm = document.querySelector('#contact form');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Message sent! We will get back to you soon.');
        contactForm.reset();
    });
}

// Cart Functions
loadCart();

// Function to add an item to the cart
function addToCart(product) {
    const { id, name, price, quantity, image } = product;

    // Retrieve existing cart items from localStorage
    const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];

    // Check if the item already exists in the cart
    const existingItemIndex = cartItems.findIndex(item => item.id === id);

    if (existingItemIndex > -1) {
        // If the item exists, update its quantity
        cartItems[existingItemIndex].quantity += 1;
    } else {
        // If the item does not exist, add it to the cart
        cartItems.push({ id, name, price, image, quantity });
    }

    // Save the updated cart items back to localStorage
    localStorage.setItem('cartItems', JSON.stringify(cartItems));

    // Load the updated cart to refresh the display
    loadCart();
}

// Function to load and display cart items
function loadCart() {
    const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    const cartItemsContainer = document.querySelector('.cart-items');
    const totalItemsSpan = document.getElementById('total-items');
    const totalPriceSpan = document.getElementById('total-price');

    if (!cartItemsContainer) {
        console.error("Cart items container not found!");
        return;
    }

    let totalItems = 0;
    let totalPrice = 0;

    // Clear existing items
    cartItemsContainer.innerHTML = '';

    cartItems.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.classList.add('cart-item');

        const imageUrl = item.image || 'default-image-url.png';

        const imageElement = document.createElement('img');
        imageElement.src = imageUrl;
        imageElement.alt = item.name;
        imageElement.classList.add('cart-item-image');

        imageElement.onerror = function() {
            this.src = 'default-image-url.png';
            this.alt = 'Image not available';
        };

        itemElement.appendChild(imageElement);

        itemElement.innerHTML += `
            <div class="cart-item-details">
                <h2>${item.name}</h2>
                <p class="item-price">$${item.price.toFixed(2)}</p>
                <p class="item-quantity">Quantity: ${item.quantity}</p>
                <div class="item-actions">
                    <button class="remove-button" data-id="${item.id}" onclick="removeFromCart('${item.id}');">Remove</button>
                </div>
            </div>
        `;

        cartItemsContainer.appendChild(itemElement);

        totalItems += item.quantity;
        totalPrice += item.price * item.quantity;
    });

    if (totalItemsSpan) {
        totalItemsSpan.textContent = totalItems;
    }
    if (totalPriceSpan) {
        totalPriceSpan.textContent = totalPrice.toFixed(2);
    }

    // Add event listeners to remove buttons
    document.querySelectorAll('.remove-button').forEach(button => {
        button.addEventListener('click', (event) => {
            const id = event.target.dataset.id;
            removeFromCart(id);
        });
    });
}

// Function to remove an item from the cart
function removeFromCart(id) {
    let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    cartItems = cartItems.filter(item => item.id !== id);
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    loadCart();
}

function clearCart() {
    localStorage.removeItem('cartItems');  // This clears the cart in localStorage
    loadCart();  // Reload the cart display (which will now be empty)
}

// Function to calculate the total amount in USD
function calculateTotalAmount(cartItems) {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
}

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
