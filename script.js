// Import Firestore functions
import { 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    updateDoc, 
    deleteDoc,
    query,
    orderBy,
    onSnapshot,
    setDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
            quantity: 34,
            description: 'Set of 4',
            sold: false
        },
        {
            id: 'shoe-stickers',
            name: 'Sneaker Stickers',
            price: 5.00,
            image: 'images/shoe-stickers-pack.png',
            quantity: 22,
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
async function loadProductStates() {
    try {
        console.log('Loading product states...');
        const productsRef = collection(db, 'products');
        
        // Set up real-time listener for products
        onSnapshot(productsRef, (snapshot) => {
            console.log('Product update received:', snapshot.size, 'products');
            
            // Clear existing products
            sneakerChainsContainer.innerHTML = '';
            stickerPacksContainer.innerHTML = '';
            
            snapshot.forEach(doc => {
                const data = doc.data();
                console.log('Loading product:', data.id, data);
                const product = [...products.sneakerChains, ...products.stickerPacks]
                    .find(p => p.id === data.id);
                
                if (product) {
                    // Update all product properties from Firestore
                    Object.assign(product, {
                        sold: data.sold || false,
                        quantity: data.quantity || 1,
                        name: data.name,
                        price: data.price,
                        image: data.image
                    });
                    
                    // Add description for sticker packs
                    if (data.description) {
                        product.description = data.description;
                    }
                    console.log('Updated product:', product.id, product);
                } else {
                    console.log('Product not found in local data:', data.id);
                }
            });
            
            // Display products after all updates
            displayProducts();
        }, (error) => {
            console.error('Error in products listener:', error);
        });
        
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

// Save product states
async function saveProductStates() {
    try {
        console.log('Saving product states...');
        const productsRef = collection(db, 'products');
        
        // Update all products
        for (const product of [...products.sneakerChains, ...products.stickerPacks]) {
            console.log('Saving product:', product.id, product);
            const docRef = doc(productsRef, product.id);
            await setDoc(docRef, {
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                quantity: product.quantity,
                sold: product.sold,
                type: product.id.startsWith('chain') ? 'chain' : 'sticker',
                ...(product.description && { description: product.description })
            }, { merge: true }); // Use merge to only update specified fields
        }
        
        console.log('Products saved to Firestore');
    } catch (error) {
        console.error('Error saving products:', error);
    }
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

// Remove from cart
function removeFromCart(itemId) {
    const itemIndex = cart.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return;

    const item = cart[itemIndex];
    const product = [...products.sneakerChains, ...products.stickerPacks]
        .find(p => p.id === itemId);

    // Restore quantity if it's a sticker pack
    if (product && !product.id.startsWith('chain')) {
        product.quantity += item.quantity;
    }

    // Remove item from cart
    cart.splice(itemIndex, 1);

    // Update UI
    updateCart();
    showNotification('Item removed from cart');
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
            <div class="cart-item-actions">
                <div class="cart-item-total">
                    $${itemTotal.toFixed(2)}
                </div>
                <button class="remove-item" data-id="${item.id}">×</button>
            </div>
        `;
        cartItems.appendChild(cartItem);
    });
    
    cartTotalAmount.textContent = total.toFixed(2);

    // Add event listeners to remove buttons
    document.querySelectorAll('.remove-item').forEach(button => {
        button.addEventListener('click', () => {
            const itemId = button.dataset.id;
            removeFromCart(itemId);
        });
    });
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

// Save purchase to Firestore
async function savePurchase(customerName, items) {
    try {
        const purchasesRef = collection(db, 'purchases');
        const purchase = {
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
        
        await addDoc(purchasesRef, purchase);
        displayPurchaseHistory();
    } catch (error) {
        console.error('Error saving purchase:', error);
        showNotification('Error saving purchase. Please try again.');
    }
}

// Display purchase history
function displayPurchaseHistory() {
    console.log('Setting up purchase history listener...');
    const purchasesRef = collection(db, 'purchases');
    const q = query(purchasesRef, orderBy('date', 'desc'));
    
    onSnapshot(q, (snapshot) => {
        console.log('Purchase history update received:', snapshot.size, 'purchases');
        purchaseHistory.innerHTML = '';
        
        if (snapshot.empty) {
            console.log('No purchase history available');
            purchaseHistory.innerHTML = '<p style="color: white;">No purchase history available.</p>';
            return;
        }

        let totalAmount = 0;

        snapshot.forEach(doc => {
            const purchase = doc.data();
            console.log('Processing purchase:', purchase);
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

            totalAmount += purchase.total || 0;

            purchaseElement.innerHTML = `
                <h3>${purchase.customerName || 'Unknown Customer'}</h3>
                <div class="date">${date}</div>
                <div class="items">
                    ${itemsHtml}
                </div>
                <div class="total">Total: $${(purchase.total || 0).toFixed(2)}</div>
                <button class="delete-purchase" data-id="${doc.id}">Delete Purchase</button>
            `;

            purchaseHistory.appendChild(purchaseElement);
        });

        // Add total amount display
        const totalElement = document.createElement('div');
        totalElement.className = 'total-amount';
        totalElement.innerHTML = `<h3>Total Sales: $${totalAmount.toFixed(2)}</h3>`;
        purchaseHistory.appendChild(totalElement);

        // Add event listeners to delete buttons
        document.querySelectorAll('.delete-purchase').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const purchaseId = button.dataset.id;
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
    }, (error) => {
        console.error('Error in purchase history listener:', error);
    });
}

// Delete purchase
async function deletePurchase(purchaseId) {
    try {
        const purchaseRef = doc(db, 'purchases', purchaseId);
        await deleteDoc(purchaseRef);
        showNotification('Purchase deleted successfully');
    } catch (error) {
        console.error('Error deleting purchase:', error);
        showNotification('Error deleting purchase. Please try again.');
    }
}

// Clear all saved data
async function clearAllData() {
    try {
        console.log('Starting data clear process...');
        
        // Clear purchases
        const purchasesRef = collection(db, 'purchases');
        const purchasesSnapshot = await getDocs(purchasesRef);
        const deletePromises = purchasesSnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
        console.log('Purchase history cleared');
        
        // Reset products to initial state
        const productsRef = collection(db, 'products');
        
        // Reset sneaker chains
        for (const chain of products.sneakerChains) {
            const docRef = doc(productsRef, chain.id);
            await setDoc(docRef, {
                id: chain.id,
                name: chain.name,
                price: chain.price,
                image: chain.image,
                quantity: 1,
                sold: false,
                type: 'chain'
            });
            // Update local state
            chain.sold = false;
            chain.quantity = 1;
            console.log('Reset chain:', chain.id);
        }
        
        // Reset sticker packs
        for (const pack of products.stickerPacks) {
            const docRef = doc(productsRef, pack.id);
            await setDoc(docRef, {
                id: pack.id,
                name: pack.name,
                price: pack.price,
                image: pack.image,
                quantity: pack.id === 'basketball-stars' ? 34 : 22,
                sold: false,
                description: pack.description,
                type: 'sticker'
            });
            // Update local state
            pack.sold = false;
            if (pack.id === 'basketball-stars') {
                pack.quantity = 34;
            } else if (pack.id === 'shoe-stickers') {
                pack.quantity = 22;
            }
            console.log('Reset sticker pack:', pack.id);
        }
        
        // Clear cart
        cart = [];
        updateCart();
        
        // Force refresh display
        sneakerChainsContainer.innerHTML = '';
        stickerPacksContainer.innerHTML = '';
        displayProducts();
        
        console.log('All data has been cleared and reset');
        showNotification('All data has been cleared');
    } catch (error) {
        console.error('Error clearing data:', error);
        showNotification('Error clearing data. Please try again.');
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

    // Mark items as sold or update quantities
    cart.forEach(item => {
        const product = [...products.sneakerChains, ...products.stickerPacks]
            .find(p => p.id === item.id);
        if (product) {
            if (product.id.startsWith('chain')) {
                // For chains, mark as sold immediately
                product.sold = true;
            } else {
                // For sticker packs, only mark as sold when quantity reaches 0
                if (product.quantity <= 0) {
                    product.sold = true;
                    product.quantity = 0;
                }
            }
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

// Initialize products in Firestore
async function initializeProducts() {
    try {
        console.log('Starting product initialization...');
        const productsRef = collection(db, 'products');
        const snapshot = await getDocs(productsRef);
        
        // Only initialize if no products exist
        if (snapshot.empty) {
            console.log('No products found, initializing...');
            
            // Initialize sneaker chains
            for (const chain of products.sneakerChains) {
                console.log('Adding chain:', chain.id);
                const docRef = doc(productsRef, chain.id);
                await setDoc(docRef, {
                    id: chain.id,
                    name: chain.name,
                    price: chain.price,
                    image: chain.image,
                    quantity: chain.quantity,
                    sold: chain.sold,
                    type: 'chain'
                });
            }
            
            // Initialize sticker packs
            for (const pack of products.stickerPacks) {
                console.log('Adding sticker pack:', pack.id);
                const docRef = doc(productsRef, pack.id);
                await setDoc(docRef, {
                    id: pack.id,
                    name: pack.name,
                    price: pack.price,
                    image: pack.image,
                    quantity: pack.quantity,
                    sold: pack.sold,
                    description: pack.description,
                    type: 'sticker'
                });
            }
            
            console.log('Products initialized in Firestore');
        } else {
            console.log('Products already exist in Firestore');
        }
    } catch (error) {
        console.error('Error initializing products:', error);
    }
}

// Initialize the store
async function initializeStore() {
    try {
        console.log('Starting store initialization...');
        await initializeProducts();
        await loadProductStates(); // This now sets up the real-time listener
        displayPurchaseHistory();
        console.log('Store initialization complete');
    } catch (error) {
        console.error('Error initializing store:', error);
    }
}

// Start the store
console.log('Starting application...');
initializeStore(); 