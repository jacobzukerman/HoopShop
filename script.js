// Product data
const products = {
    sneakerChains: Array.from({ length: 8 }, (_, i) => ({
        id: `chain-${i + 1}`,
        name: `Sneaker Chain ${i + 1}`,
        price: 10.00,
        image: `images/sneaker-chain-${i + 1}.webp`,
        quantity: 1,
        sold: false
    })),
    stickerPacks: [
        {
            id: 'basketball-stars',
            name: 'NBA Superstar Stickers',
            price: 5.00,
            image: 'images/basketball-stars-pack.png',
            quantity: 36,
            description: 'Set of 4',
            sold: false
        },
        {
            id: 'shoe-stickers',
            name: 'Sneaker Stickers',
            price: 5.00,
            image: 'images/shoe-stickers-pack.png',
            quantity: 20,
            description: 'Set of 2',
            sold: false
        }
    ]
};

// Cart functionality
let cart = [];

// DOM Elements
const sneakerChainsContainer = document.getElementById('sneaker-chains');
const stickerPacksContainer = document.getElementById('sticker-packs');
const cartIcon = document.querySelector('.cart-icon');
const cartModal = document.getElementById('cart-modal');
const cartItems = document.getElementById('cart-items');
const cartCount = document.getElementById('cart-count');
const cartTotalAmount = document.getElementById('cart-total-amount');
const checkoutBtn = document.getElementById('checkout-btn');
const purchaseHistory = document.getElementById('purchase-history');

// Load saved product states
function loadProductStates() {
    const savedStates = JSON.parse(localStorage.getItem('productStates') || '{}');
    console.log('Loading saved states:', savedStates);
    
    // Update sneaker chains
    products.sneakerChains.forEach(chain => {
        if (savedStates[chain.id]) {
            chain.sold = savedStates[chain.id].sold;
            chain.quantity = savedStates[chain.id].quantity;
        }
    });
    
    // Update sticker packs
    products.stickerPacks.forEach(pack => {
        if (savedStates[pack.id]) {
            pack.sold = savedStates[pack.id].sold;
            pack.quantity = savedStates[pack.id].quantity;
        }
    });
    
    console.log('Updated products:', products);
}

// Save product states
function saveProductStates() {
    const states = {};
    
    // Save sneaker chains
    products.sneakerChains.forEach(chain => {
        states[chain.id] = {
            sold: chain.sold,
            quantity: chain.quantity
        };
    });
    
    // Save sticker packs
    products.stickerPacks.forEach(pack => {
        states[pack.id] = {
            sold: pack.sold,
            quantity: pack.quantity
        };
    });
    
    console.log('Saving product states:', states);
    localStorage.setItem('productStates', JSON.stringify(states));
}

// Display products
function displayProducts() {
    // Display sneaker chains
    products.sneakerChains.forEach(chain => {
        const card = createProductCard(chain);
        sneakerChainsContainer.appendChild(card);
    });

    // Display sticker packs
    products.stickerPacks.forEach(pack => {
        const card = createProductCard(pack);
        stickerPacksContainer.appendChild(card);
    });
}

// Generate random color
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// Create product card
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = `product-card ${product.sold ? 'sold' : ''}`;
    
    // Generate random gradient colors
    const color1 = getRandomColor();
    const color2 = getRandomColor();
    card.style.setProperty('--hover-gradient-start', color1);
    card.style.setProperty('--hover-gradient-end', color2);
    
    card.innerHTML = `
        <img src="${product.image}" alt="${product.name}">
        <h3>${product.name}</h3>
        ${product.description ? `<p>${product.description}</p>` : ''}
        <div class="price">$${product.price.toFixed(2)}</div>
        ${product.quantity && (product.id === 'basketball-stars' || product.id === 'shoe-stickers') ? `<p class="quantity">Available: ${product.quantity}</p>` : ''}
        ${product.sold ? 
            '<div class="sold-badge">SOLD</div>' :
            `<button class="add-to-cart" data-id="${product.id}">Add to Cart</button>`
        }
    `;

    if (!product.sold) {
        card.querySelector('.add-to-cart').addEventListener('click', () => addToCart(product));
    }
    return card;
}

// Add to cart
function addToCart(product) {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
        if (product.quantity && existingItem.quantity >= product.quantity) {
            showNotification('Sorry, this item is out of stock!');
            return;
        }
        existingItem.quantity++;
    } else {
        if (product.quantity && product.quantity <= 0) {
            showNotification('Sorry, this item is out of stock!');
            return;
        }
        cart.push({ ...product, quantity: 1 });
    }
    
    if (product.quantity) {
        product.quantity--;
    }
    
    updateCart();
    showNotification(`${product.name} added to cart!`);
}

// Update cart
function updateCart() {
    cartCount.textContent = cart.reduce((total, item) => total + item.quantity, 0);
    cartItems.innerHTML = '';
    
    let total = 0;
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="cart-item-details">
                <h4>${item.name}</h4>
                <p>$${item.price.toFixed(2)} x ${item.quantity}</p>
            </div>
            <div class="cart-item-total">
                $${itemTotal.toFixed(2)}
            </div>
        `;
        cartItems.appendChild(cartItem);
    });
    
    cartTotalAmount.textContent = total.toFixed(2);
}

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 2000);
}

// Save purchase to localStorage
function savePurchase(customerName, items) {
    const purchases = JSON.parse(localStorage.getItem('purchases') || '[]');
    const purchase = {
        id: Date.now(),
        customerName,
        items: items.map(item => ({
            id: item.id,
            name: item.name,
            price: parseFloat(item.price) || 0,
            quantity: parseInt(item.quantity) || 0
        })),
        date: new Date().toISOString(),
        total: items.reduce((sum, item) => sum + ((parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0)), 0)
    };
    purchases.push(purchase);
    localStorage.setItem('purchases', JSON.stringify(purchases));
    displayPurchaseHistory();
}

// Clear all saved data
function clearAllData() {
    // Clear purchases
    localStorage.removeItem('purchases');
    
    // Clear product states
    localStorage.removeItem('productStates');
    
    // Reset products to initial state
    products.sneakerChains.forEach(chain => {
        chain.sold = false;
        chain.quantity = 1;
    });
    
    products.stickerPacks.forEach(pack => {
        pack.sold = false;
        pack.quantity = pack.id === 'basketball-stars' ? 30 : 16;
    });
    
    // Update display
    sneakerChainsContainer.innerHTML = '';
    stickerPacksContainer.innerHTML = '';
    displayProducts();
    displayPurchaseHistory();
    
    showNotification('All data has been cleared');
}

// Display purchase history
function displayPurchaseHistory() {
    const purchases = JSON.parse(localStorage.getItem('purchases') || '[]');
    purchaseHistory.innerHTML = '';

    if (purchases.length === 0) {
        purchaseHistory.innerHTML = '<p style="color: white;">No purchase history available.</p>';
        return;
    }

    // Sort purchases by date, most recent first
    purchases.sort((a, b) => new Date(b.date) - new Date(a.date));

    purchases.forEach(purchase => {
        if (!purchase || !purchase.items) return;

        const purchaseElement = document.createElement('div');
        purchaseElement.className = 'purchase-item';
        
        const date = new Date(purchase.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const itemsHtml = purchase.items.map(item => {
            if (!item || typeof item.price === 'undefined' || typeof item.quantity === 'undefined') return '';
            const price = parseFloat(item.price) || 0;
            const quantity = parseInt(item.quantity) || 0;
            return `<p>${item.name || 'Unknown Item'} x ${quantity} - $${(price * quantity).toFixed(2)}</p>`;
        }).join('');

        purchaseElement.innerHTML = `
            <h3>${purchase.customerName || 'Unknown Customer'}</h3>
            <div class="date">${date}</div>
            <div class="items">
                ${itemsHtml}
            </div>
            <div class="total">Total: $${(purchase.total || 0).toFixed(2)}</div>
            <button class="delete-purchase" data-id="${purchase.id}">Delete Purchase</button>
        `;

        purchaseHistory.appendChild(purchaseElement);
    });

    // Add event listeners to delete buttons
    document.querySelectorAll('.delete-purchase').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const purchaseId = parseInt(button.dataset.id);
            deletePurchase(purchaseId);
        });
    });

    // Add clear all button at the bottom
    const clearButton = document.createElement('button');
    clearButton.className = 'clear-all-button';
    clearButton.textContent = 'Clear All Data';
    clearButton.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all purchase history and reset all products?')) {
            clearAllData();
        }
    });
    purchaseHistory.appendChild(clearButton);
}

// Delete purchase
function deletePurchase(purchaseId) {
    console.log('Attempting to delete purchase:', purchaseId);
    const purchases = JSON.parse(localStorage.getItem('purchases') || '[]');
    console.log('Current purchases:', purchases);
    
    const purchaseToDelete = purchases.find(p => p.id === purchaseId);
    console.log('Purchase to delete:', purchaseToDelete);
    
    if (purchaseToDelete) {
        // Restore quantities and sold states
        purchaseToDelete.items.forEach(item => {
            console.log('Processing item:', item);
            const product = [...products.sneakerChains, ...products.stickerPacks]
                .find(p => p.id === item.id);
            console.log('Found product:', product);
            
            if (product) {
                product.quantity += item.quantity;
                product.sold = false;
                console.log('Updated product:', product);
            }
        });
        
        // Remove the purchase
        const updatedPurchases = purchases.filter(p => p.id !== purchaseId);
        localStorage.setItem('purchases', JSON.stringify(updatedPurchases));
        
        // Save updated product states
        saveProductStates();
        
        // Update the display
        sneakerChainsContainer.innerHTML = '';
        stickerPacksContainer.innerHTML = '';
        displayProducts();
        displayPurchaseHistory();
        
        showNotification('Purchase deleted successfully');
    }
}

// Event Listeners
cartIcon.addEventListener('click', () => {
    cartModal.style.display = 'block';
});

cartModal.addEventListener('click', (e) => {
    if (e.target === cartModal) {
        cartModal.style.display = 'none';
    }
});

checkoutBtn.addEventListener('click', () => {
    if (cart.length === 0) {
        showNotification('Your cart is empty!');
        return;
    }

    const customerName = prompt('Please enter your name:');
    if (!customerName) {
        showNotification('Purchase cancelled - name is required');
        return;
    }

    // Mark items as sold
    cart.forEach(item => {
        const product = [...products.sneakerChains, ...products.stickerPacks]
            .find(p => p.id === item.id);
        if (product) {
            product.sold = true;
            product.quantity -= item.quantity;
        }
    });

    // Save purchase information
    savePurchase(customerName, cart);
    
    // Save product states
    saveProductStates();

    // Update UI
    sneakerChainsContainer.innerHTML = '';
    stickerPacksContainer.innerHTML = '';
    displayProducts();

    showNotification('Thank you for your purchase!');
    cart = [];
    updateCart();
    cartModal.style.display = 'none';
});

// Initialize the store
loadProductStates(); // Load saved states first
displayProducts();
displayPurchaseHistory(); 