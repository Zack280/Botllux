document.addEventListener('DOMContentLoaded', () => {
    // Add to Cart Buttons
    const addToCartButtons = document.querySelectorAll('.add-to-cart-button');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            event.preventDefault();
            
            // Get product details from data attributes
            const productElement = button.closest('.product-card');
            const productId = productElement.dataset.productId;
            const productName = productElement.querySelector('h3').textContent;
            const productPrice = parseFloat(productElement.querySelector('.price').textContent.replace('$', ''));
            const productQuantity = 1; // Default quantity to 1

            console.log('Adding to cart:', { id: productId, name: productName, price: productPrice, quantity: productQuantity });

            // Create product object
            const product = {
                id: productId,
                name: productName,
                price: productPrice,
                quantity: productQuantity
            };

            // Add product to cart
            addToCart(product);

            // Optionally, show a message or update UI
            alert('Item added to cart!');
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
    const cartContainer = document.querySelector('.cart-items');
    if (cartContainer) {
        loadCart();
    }
});

// Function to add an item to the cart
function addToCart(product) {
    let cartItems = JSON.parse(localStorage.getItem('cart')) || [];
    console.log('Current cart items:', cartItems);

    const existingItemIndex = cartItems.findIndex(item => item.id === product.id);
    
    if (existingItemIndex > -1) {
        cartItems[existingItemIndex].quantity += product.quantity;
    } else {
        cartItems.push(product);
    }

    console.log('Updated cart items:', cartItems);
    localStorage.setItem('cart', JSON.stringify(cartItems));
}

// Function to load cart items
function loadCart() {
    const cartContainer = document.querySelector('.cart-items');
    if (!cartContainer) {
        console.error('Cart container not found');
        return;
    }

    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    console.log('Loaded cart items:', cart);

    if (cart.length === 0) {
        cartContainer.innerHTML = '<p>Your cart is empty.</p>';
        return;
    }

    cart.forEach(item => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <img src="https://example.com/product-image-${item.id}.jpg" alt="${item.name}">
            <div class="cart-item-details">
                <h2>${item.name}</h2>
                <p class="item-price">$${item.price.toFixed(2)}</p>
                <p class="item-quantity">Quantity: ${item.quantity}</p>
                <div class="item-actions">
                    <button class="remove-from-cart-button" data-id="${item.id}">Remove</button>
                </div>
            </div>
        `;
        cartContainer.appendChild(cartItem);
    });

    // Add event listeners for remove buttons
    document.querySelectorAll('.remove-from-cart-button').forEach(button => {
        button.addEventListener('click', () => {
            const productId = button.getAttribute('data-id');
            console.log('Removing from cart:', productId);
            removeFromCart(productId);
        });
    });
}

// Function to remove an item from the cart
function removeFromCart(id) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    console.log('Current cart before removal:', cart);

    cart = cart.filter(item => item.id !== id);

    console.log('Updated cart after removal:', cart);
    localStorage.setItem('cart', JSON.stringify(cart));
    location.reload(); // Reload page to reflect changes
}
