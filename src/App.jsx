import { useEffect, useMemo, useState } from 'react';
import { products } from './catalog';
import { business, categories, formatPrice } from './config';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronLeft,
  Clock,
  Copy,
  Facebook,
  Instagram,
  Leaf,
  MapPin,
  Menu,
  MessageCircle,
  Minus,
  Package,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  X,
} from 'lucide-react';

function getStoredCart() {
  if (typeof window === 'undefined') return [];

  try {
    const storedCart = window.localStorage.getItem('harvest-basket-cart');
    const parsedCart = storedCart ? JSON.parse(storedCart) : [];
    return Array.isArray(parsedCart)
      ? parsedCart.filter((item) => item && item.id && item.name && Number(item.quantity) > 0)
      : [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  try {
    window.localStorage.setItem('harvest-basket-cart', JSON.stringify(cart));
  } catch {
    return false;
  }

  return true;
}

function buildOrderMessage({ cart, customer, orderReference, subtotal }) {
  const orderLines = [
    `Hello ${business.name}! I would like to place a wholesale order.`,
    '',
    `Name: ${customer.name.trim()}`,
    `Phone: ${customer.phone.trim()}`,
    `Delivery address: ${customer.address.trim()}`,
    `Order reference: ${orderReference}`,
    ...(customer.deliveryDate ? [`Preferred delivery date: ${customer.deliveryDate}`] : []),
    '',
    'Items:',
    ...cart.map((item) => `- ${item.quantity} × ${item.name} (${item.unit}) — ${formatPrice(item.price * item.quantity)}`),
    '',
    `Subtotal: ${formatPrice(subtotal)}`,
    `Delivery: ${business.deliveryLabel}`,
    `Total: ${formatPrice(subtotal)}`,
    ...(customer.notes.trim() ? ['', `Notes: ${customer.notes.trim()}`] : []),
  ];

  return orderLines.join('\n');
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  textarea.remove();
}

function App() {
  const [cart, setCart] = useState(getStoredCart);
  const [activeCategory, setActiveCategory] = useState('All items');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [view, setView] = useState('shop');
  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    address: '',
    deliveryDate: '',
    notes: '',
  });
  const [toast, setToast] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const [orderReference] = useState(() => `HB-${String(Date.now()).slice(-6)}`);

  useEffect(() => {
    saveCart(cart);
  }, [cart]);

  useEffect(() => {
    document.body.classList.toggle('drawer-open', isCartOpen);
    return () => document.body.classList.remove('drawer-open');
  }, [isCartOpen]);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(''), 2600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory = activeCategory === 'All items' || product.category === activeCategory;
      const matchesSearch =
        !normalizedSearch ||
        `${product.name} ${product.category} ${product.description}`.toLowerCase().includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchTerm]);

  const visibleProducts = showAll ? filteredProducts : filteredProducts.slice(0, 6);
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  const addToCart = (product) => {
    setCart((currentCart) => {
      const existingItem = currentCart.find((item) => item.id === product.id);

      if (existingItem) {
        return currentCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }

      return [...currentCart, { ...product, quantity: 1 }];
    });
    setToast(`${product.name} added to your basket`);
  };

  const updateQuantity = (productId, change) => {
    setCart((currentCart) =>
      currentCart
        .map((item) => (item.id === productId ? { ...item, quantity: item.quantity + change } : item))
        .filter((item) => item.quantity > 0),
    );
  };

  const removeFromCart = (productId) => {
    setCart((currentCart) => currentCart.filter((item) => item.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setToast('Basket cleared');
  };

  const openCheckout = () => {
    setIsCartOpen(false);
    setCheckoutError('');
    setView('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToSection = (sectionId) => {
    setIsMenuOpen(false);

    if (view !== 'shop') {
      setView('shop');
      window.requestAnimationFrame(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
      });
      return;
    }

    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  const updateCustomer = (field, value) => {
    setCustomer((currentCustomer) => ({ ...currentCustomer, [field]: value }));
    if (checkoutError) setCheckoutError('');
  };

  const sendOrderToWhatsApp = () => {
    if (!cart.length) {
      setCheckoutError('Your basket is empty. Add an item before sending an order.');
      return;
    }

    if (!customer.name.trim() || !customer.phone.trim() || !customer.address.trim()) {
      setCheckoutError('Please add your name, phone number, and delivery address.');
      return;
    }

    const normalizedNumber = business.whatsappNumber.replace(/\D/g, '');

    if (normalizedNumber.length < 8) {
      setCheckoutError('Add your WhatsApp number to VITE_WHATSAPP_NUMBER before publishing the site.');
      return;
    }

    const orderMessage = buildOrderMessage({ cart, customer, orderReference, subtotal });
    // Alternative format:
    
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${normalizedNumber}&text=${encodeURIComponent(orderMessage)}`; 
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const copyOrderSummary = async () => {
    if (!cart.length) {
      setCheckoutError('Your basket is empty. Add an item before copying an order.');
      return;
    }

    if (!customer.name.trim() || !customer.phone.trim() || !customer.address.trim()) {
      setCheckoutError('Add your name, phone number, and delivery address before copying the order.');
      return;
    }

    try {
      await copyText(buildOrderMessage({ cart, customer, orderReference, subtotal }));
      setToast('Order summary copied to your clipboard');
    } catch {
      setCheckoutError('Your browser could not copy the order. You can still send it through WhatsApp.');
    }
  };

  return (
    <div className="app-shell">
      <Header
        cartCount={cartCount}
        isMenuOpen={isMenuOpen}
        onCartClick={() => setIsCartOpen(true)}
        onMenuToggle={() => setIsMenuOpen((open) => !open)}
        onNavigate={goToSection}
      />

      {view === 'checkout' ? (
        <CheckoutPage
          cart={cart}
          cartCount={cartCount}
          customer={customer}
          error={checkoutError}
          orderReference={orderReference}
          onBack={() => {
            setView('shop');
            setCheckoutError('');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onChange={updateCustomer}
          onCopy={copyOrderSummary}
          onQuantityChange={updateQuantity}
          onRemove={removeFromCart}
          onSubmit={sendOrderToWhatsApp}
          subtotal={subtotal}
        />
      ) : (
        <>
          <HomePage
            activeCategory={activeCategory}
            cart={cart}
            filteredProducts={filteredProducts}
            onAdd={addToCart}
            onCategoryChange={(category) => {
              setActiveCategory(category);
              setShowAll(false);
            }}
            onNavigate={goToSection}
            onQuantityChange={updateQuantity}
            onSearchChange={setSearchTerm}
            onShowAll={() => setShowAll((visible) => !visible)}
            searchTerm={searchTerm}
            showAll={showAll}
            visibleProducts={visibleProducts}
          />
          <Footer onNavigate={goToSection} />
        </>
      )}

      <CartDrawer
        cart={cart}
        isOpen={isCartOpen}
        onCheckout={openCheckout}
        onClear={clearCart}
        onClose={() => setIsCartOpen(false)}
        onQuantityChange={updateQuantity}
        onRemove={removeFromCart}
        subtotal={subtotal}
      />

      {toast && (
        <div className="toast" role="status">
          <span className="toast-icon">
            <Check size={15} strokeWidth={3} />
          </span>
          {toast}
        </div>
      )}
    </div>
  );
}

function Header({ cartCount, isMenuOpen, onCartClick, onMenuToggle, onNavigate }) {
  return (
    <header className="site-header" id="top">
      <div className="header-inner">
        <button className="brand" onClick={() => onNavigate('top')} type="button">
          <span className="brand-mark">
            <Leaf size={18} strokeWidth={2.5} />
          </span>
          <span>
            <strong>{business.brand.primary}</strong>
            <small>{business.brand.secondary}</small>
          </span>
        </button>

        <nav className="desktop-nav" aria-label="Primary navigation">
          <button onClick={() => onNavigate('shop')} type="button">
            Shop
          </button>
          <button onClick={() => onNavigate('how-it-works')} type="button">
            How it works
          </button>
          <button onClick={() => onNavigate('our-story')} type="button">
            Our story
          </button>
        </nav>

        <div className="header-actions">
          <span className="availability">
            <span className="availability-dot" />
            Delivering daily
          </span>
          <button className="cart-button" onClick={onCartClick} type="button" aria-label={`Open basket with ${cartCount} items`}>
            <ShoppingBag size={19} />
            <span>Basket</span>
            <strong>{cartCount}</strong>
          </button>
          <button
            className="menu-button"
            onClick={onMenuToggle}
            type="button"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <nav className="mobile-nav" aria-label="Mobile navigation">
          <button onClick={() => onNavigate('shop')} type="button">
            Shop <ArrowRight size={16} />
          </button>
          <button onClick={() => onNavigate('how-it-works')} type="button">
            How it works <ArrowRight size={16} />
          </button>
          <button onClick={() => onNavigate('our-story')} type="button">
            Our story <ArrowRight size={16} />
          </button>
        </nav>
      )}
    </header>
  );
}

function HomePage({
  activeCategory,
  cart,
  filteredProducts,
  onAdd,
  onCategoryChange,
  onNavigate,
  onQuantityChange,
  onSearchChange,
  onShowAll,
  searchTerm,
  showAll,
  visibleProducts,
}) {
  return (
    <main>
      <section className="hero-section" id="shop">
        <div className="hero-inner page-width">
          <div className="hero-copy">
            <div className="eyebrow">
              <Sparkles size={15} />
              Wholesale, made simple
            </div>
            <h1>
              Stock your shelves <span>with confidence.</span>
            </h1>
            <p className="hero-description">
              Fresh produce, pantry staples, and café essentials delivered in dependable weekly boxes. One easy basket, less busywork, more time for your business.
            </p>
            <div className="hero-actions">
              <button className="button button-primary" onClick={() => onNavigate('catalog')} type="button">
                Browse the harvest
                <ArrowRight size={17} />
              </button>
              <button className="text-button" onClick={() => onNavigate('how-it-works')} type="button">
                See how it works
                <ChevronDown size={16} />
              </button>
            </div>
            <div className="hero-proof">
              <div className="proof-avatars" aria-hidden="true">
                <span>JM</span>
                <span>AK</span>
                <span>RS</span>
                <span>+</span>
              </div>
              <div>
                <strong>Loved by 120+ local kitchens</strong>
                <span>Reliable products. Fair prices. Zero fuss.</span>
              </div>
            </div>
          </div>

          <div className="hero-visual" aria-label="A selection of fresh market ingredients">
            <div className="hero-sun" />
            <div className="hero-leaf hero-leaf-one" />
            <div className="hero-leaf hero-leaf-two" />
            <div className="hero-image-frame">
              <img
                src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=88"
                alt="Fresh vegetables arranged at a market"
              />
            </div>
            <div className="hero-float-card hero-float-top">
              <span className="float-icon float-icon-green">
                <Truck size={17} />
              </span>
              <span>
                <strong>Next-day slots</strong>
                <small>Available in your area</small>
              </span>
            </div>
            <div className="hero-float-card hero-float-bottom">
              <span className="float-icon float-icon-yellow">
                <Leaf size={17} />
              </span>
              <span>
                <strong>Freshly sourced</strong>
                <small>Quality you can count on</small>
              </span>
            </div>
            <div className="hero-price-tag">
              <span>from</span>
              <strong>$18</strong>
              <small>per case</small>
            </div>
          </div>
        </div>
      </section>

      <section className="trust-strip" aria-label="Service benefits">
        <div className="page-width trust-grid">
          <div className="trust-item">
            <span className="trust-icon"><Truck size={18} /></span>
            <span><strong>Flexible delivery</strong><small>Choose a day that works</small></span>
          </div>
          <div className="trust-item">
            <span className="trust-icon"><Package size={18} /></span>
            <span><strong>Wholesale pricing</strong><small>Better margins, every order</small></span>
          </div>
          <div className="trust-item">
            <span className="trust-icon"><ShieldCheck size={18} /></span>
            <span><strong>Quality checked</strong><small>Freshness you can trust</small></span>
          </div>
          <div className="trust-item">
            <span className="trust-icon"><MessageCircle size={18} /></span>
            <span><strong>Human support</strong><small>Real people, real answers</small></span>
          </div>
        </div>
      </section>

      <section className="catalog-section page-width" id="catalog">
        <div className="section-heading catalog-heading">
          <div>
            <div className="eyebrow eyebrow-dark">The wholesale edit</div>
            <h2>Good ingredients, <span>fair prices.</span></h2>
          </div>
          <p>Everything your kitchen needs, carefully chosen and delivered in practical wholesale packs.</p>
        </div>

        <div className="catalog-toolbar">
          <div className="category-tabs" role="tablist" aria-label="Product categories">
            {categories.map((category) => (
              <button
                className={activeCategory === category ? 'category-tab active' : 'category-tab'}
                key={category}
                onClick={() => onCategoryChange(category)}
                role="tab"
                aria-selected={activeCategory === category}
                type="button"
              >
                {category}
              </button>
            ))}
          </div>
          <label className="search-field">
            <Search size={18} />
            <span className="sr-only">Search products</span>
            <input
              type="search"
              placeholder="Search products"
              value={searchTerm}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </label>
        </div>

        {visibleProducts.length ? (
          <div className="product-grid">
            {visibleProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                quantity={cart.find((item) => item.id === product.id)?.quantity || 0}
                onAdd={onAdd}
                onQuantityChange={onQuantityChange}
              />
            ))}
          </div>
        ) : (
          <div className="empty-search">
            <Search size={24} />
            <h3>No products found</h3>
            <p>Try a different search or browse all of our categories.</p>
            <button className="button button-secondary" onClick={() => onSearchChange('')} type="button">Clear search</button>
          </div>
        )}

        {filteredProducts.length > 6 && (
          <div className="catalog-footer">
            <button className="button button-secondary" onClick={onShowAll} type="button">
              {showAll ? 'Show fewer items' : `View all ${filteredProducts.length} items`}
              <ArrowRight size={17} />
            </button>
          </div>
        )}
      </section>

      <section className="story-section" id="how-it-works">
        <div className="page-width story-grid">
          <div className="story-image-wrap">
            <div className="story-image-main">
              <img
                src="https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1000&q=85"
                alt="A local food supplier preparing a delivery"
              />
            </div>
            <div className="story-stat">
              <strong>7 yrs</strong>
              <span>serving local<br />food businesses</span>
            </div>
            <div className="story-spark" aria-hidden="true" />
          </div>
          <div className="story-copy">
            <div className="eyebrow eyebrow-dark">Simple by design</div>
            <h2>More time for the <span>good stuff.</span></h2>
            <p className="story-intro">We take care of the sourcing, packing, and delivery details so you can take care of your customers.</p>
            <div className="steps-list">
              <div className="step-item">
                <span className="step-number">01</span>
                <div><strong>Build your basket</strong><p>Pick the products and pack sizes that match your business.</p></div>
              </div>
              <div className="step-item">
                <span className="step-number">02</span>
                <div><strong>Send it to WhatsApp</strong><p>Share your order and delivery details in one quick message.</p></div>
              </div>
              <div className="step-item">
                <span className="step-number">03</span>
                <div><strong>We deliver</strong><p>Your order arrives fresh, sorted, and ready to unpack.</p></div>
              </div>
            </div>
            <button className="text-button story-link" onClick={() => onNavigate('catalog')} type="button">
              Start building your basket <ArrowRight size={17} />
            </button>
          </div>
        </div>
      </section>

      <section className="promise-section page-width" id="our-story">
        <div className="promise-card">
          <div>
            <div className="eyebrow eyebrow-light">The {business.name} promise</div>
            <h2>Good food should feel <span>easy to source.</span></h2>
          </div>
          <p>We partner with trusted growers and makers to bring dependable food supplies to independent kitchens, cafés, and retailers.</p>
          <div className="promise-pill"><Leaf size={16} /> Locally sourced, always</div>
        </div>
      </section>
    </main>
  );
}

function ProductCard({ product, quantity, onAdd, onQuantityChange }) {
  return (
    <article className={quantity ? 'product-card is-added' : 'product-card'}>
      <div className="product-media" style={{ background: product.tint }}>
        <img src={product.image} alt={product.name} loading="lazy" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
        <div className="product-shine" />
        {product.badge && <span className="product-badge">{product.badge}</span>}
        <button className="quick-add" onClick={() => onAdd(product)} type="button" aria-label={`Add ${product.name} to basket`}>
          <Plus size={19} />
        </button>
      </div>
      <div className="product-content">
        <div className="product-category">{product.category}</div>
        <h3>{product.name}</h3>
        <p>{product.description}</p>
        <div className="product-bottom">
          <div className="product-price">
            <strong>{formatPrice(product.price)}</strong>
            <span>/ {product.unit}</span>
          </div>
          {quantity ? (
            <QuantityControl quantity={quantity} onChange={(change) => onQuantityChange(product.id, change)} />
          ) : (
            <button className="add-button" onClick={() => onAdd(product)} type="button">
              Add <Plus size={16} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function QuantityControl({ quantity, onChange }) {
  return (
    <div className="quantity-control" aria-label={`Quantity: ${quantity}`}>
      <button onClick={() => onChange(-1)} type="button" aria-label="Decrease quantity"><Minus size={14} /></button>
      <span>{quantity}</span>
      <button onClick={() => onChange(1)} type="button" aria-label="Increase quantity"><Plus size={14} /></button>
    </div>
  );
}

function CartDrawer({ cart, isOpen, onCheckout, onClear, onClose, onQuantityChange, onRemove, subtotal }) {
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <>
      {isOpen && <button className="drawer-backdrop" onClick={onClose} type="button" aria-label="Close basket" />}
      <aside className={isOpen ? 'cart-drawer is-open' : 'cart-drawer'} aria-label="Shopping basket" aria-hidden={!isOpen}>
        <div className="drawer-header">
          <div>
            <span className="drawer-kicker">Your order</span>
            <h2>Basket <span>{cartCount} {cartCount === 1 ? 'item' : 'items'}</span></h2>
          </div>
          <button className="icon-button" onClick={onClose} type="button" aria-label="Close basket"><X size={21} /></button>
        </div>

        {cart.length ? (
          <>
            <div className="drawer-items">
              {cart.map((item) => (
                <div className="drawer-item" key={item.id}>
                  <div className="drawer-item-image" style={{ background: item.tint }}>
                    <img src={item.image} alt="" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
                  </div>
                  <div className="drawer-item-details">
                    <div className="drawer-item-top"><h3>{item.name}</h3><button onClick={() => onRemove(item.id)} type="button" aria-label={`Remove ${item.name}`}><X size={15} /></button></div>
                    <span>{item.unit}</span>
                    <div className="drawer-item-bottom">
                      <QuantityControl quantity={item.quantity} onChange={(change) => onQuantityChange(item.id, change)} />
                      <strong>{formatPrice(item.price * item.quantity)}</strong>
                    </div>
                  </div>
                </div>
              ))}
              <button className="clear-basket" onClick={onClear} type="button">Clear basket</button>
            </div>
            <div className="drawer-summary">
              <div><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div>
              <div><span>Delivery</span><strong className="free-delivery">{business.deliveryLabel}</strong></div>
              <div className="drawer-total"><span>Total</span><strong>{formatPrice(subtotal)}</strong></div>
              <button className="button button-primary button-full" onClick={onCheckout} type="button">
                Review order <ArrowRight size={17} />
              </button>
              <p className="drawer-footnote"><MessageCircle size={15} /> You will confirm your order on WhatsApp.</p>
            </div>
          </>
        ) : (
          <div className="empty-basket">
            <div className="empty-basket-icon"><ShoppingBag size={29} /></div>
            <h3>Your basket is waiting</h3>
            <p>Add a few essentials and we will get your wholesale order ready to go.</p>
            <button className="button button-secondary" onClick={onClose} type="button">Browse products <ArrowRight size={16} /></button>
          </div>
        )}
      </aside>
    </>
  );
}

function CheckoutPage({ cart, cartCount, customer, error, orderReference, onBack, onChange, onCopy, onQuantityChange, onRemove, onSubmit, subtotal }) {
  return (
    <main className="checkout-page">
      <div className="page-width checkout-container">
        <button className="back-link" onClick={onBack} type="button"><ChevronLeft size={17} /> Back to shop</button>
        <div className="checkout-intro">
          <div>
            <div className="eyebrow eyebrow-dark">Almost there</div>
            <h1>Let’s get this <span>delivered.</span></h1>
          </div>
          <div className="checkout-secure"><ShieldCheck size={17} /> No payment needed today</div>
        </div>

        <div className="checkout-grid">
          <section className="checkout-form-card">
            <div className="form-card-heading">
              <span className="form-step">01</span>
              <div><h2>Your details</h2><p>Where should we send your order?</p></div>
            </div>
            <div className="form-fields">
              <label>
                Full name
                <input type="text" value={customer.name} onChange={(event) => onChange('name', event.target.value)} placeholder="e.g. Jordan Mensah" autoComplete="name" />
              </label>
              <label>
                Phone number
                <input type="tel" value={customer.phone} onChange={(event) => onChange('phone', event.target.value)} placeholder="e.g. +1 555 123 4567" autoComplete="tel" />
              </label>
              <label className="form-full">
                Preferred delivery date <span>(optional)</span>
                <input type="date" value={customer.deliveryDate} onChange={(event) => onChange('deliveryDate', event.target.value)} min={new Date().toISOString().split('T')[0]} />
              </label>
              <label className="form-full">
                Delivery address
                <textarea value={customer.address} onChange={(event) => onChange('address', event.target.value)} placeholder="Street, city, and any delivery notes" rows="3" autoComplete="street-address" />
              </label>
              <label className="form-full">
                Notes for the team <span>(optional)</span>
                <textarea value={customer.notes} onChange={(event) => onChange('notes', event.target.value)} placeholder="Preferred delivery time, special requests, or business name" rows="3" />
              </label>
            </div>
            <div className="delivery-callout">
              <span><MapPin size={18} /></span>
              <div><strong>{business.deliveryArea}</strong><p>Our team will confirm your delivery slot and final total on WhatsApp.</p></div>
            </div>
          </section>

          <section className="order-summary-card">
            <div className="summary-card-heading">
              <div><span className="form-step">02</span><h2>Order summary</h2></div>
              <div className="summary-heading-meta"><span className="summary-reference">Ref {orderReference}</span><span className="summary-count">{cartCount} {cartCount === 1 ? 'item' : 'items'}</span></div>
            </div>
            <div className="summary-items">
              {cart.length ? cart.map((item) => (
                <div className="summary-item" key={item.id}>
                  <div className="summary-item-image" style={{ background: item.tint }}>
                    <img src={item.image} alt="" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
                  </div>
                  <div className="summary-item-info">
                    <div><strong>{item.name}</strong><button onClick={() => onRemove(item.id)} type="button" aria-label={`Remove ${item.name}`}><X size={14} /></button></div>
                    <span>{item.unit}</span>
                    <div className="summary-item-bottom">
                      <QuantityControl quantity={item.quantity} onChange={(change) => onQuantityChange(item.id, change)} />
                      <strong>{formatPrice(item.price * item.quantity)}</strong>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="summary-empty"><ShoppingBag size={21} /> Your basket is empty.</div>
              )}
            </div>
            <div className="summary-totals">
              <div><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div>
              <div><span>Delivery</span><strong className="free-delivery">{business.deliveryLabel}</strong></div>
              <div className="summary-total"><span>Total</span><strong>{formatPrice(subtotal)}</strong></div>
            </div>
            {error && <div className="checkout-error" role="alert">{error}</div>}
            <button className="button button-primary button-full whatsapp-button" onClick={onSubmit} type="button" disabled={!cart.length}>
              <MessageCircle size={18} />
              Send order on WhatsApp
              <ArrowUpRight size={17} />
            </button>
            <button className="copy-order-button" onClick={onCopy} type="button" disabled={!cart.length}>
              <Copy size={15} /> Copy order summary
            </button>
            <p className="summary-footnote">Your order summary will open in WhatsApp. Review it there, then tap send to place your order.</p>
          </section>
        </div>
      </div>
    </main>
  );
}

function Footer({ onNavigate }) {
  return (
    <footer className="site-footer">
      <div className="page-width footer-main">
        <div className="footer-brand-column">
          <button className="brand brand-light" onClick={() => onNavigate('top')} type="button">
            <span className="brand-mark"><Leaf size={18} strokeWidth={2.5} /></span>
            <span><strong>{business.brand.primary}</strong><small>{business.brand.secondary}</small></span>
          </button>
          <p>Fresh food, thoughtful sourcing, and a simpler way to keep your kitchen moving.</p>
          <div className="social-links"><a href={business.instagramUrl} target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram size={18} /></a><a href={business.facebookUrl} target="_blank" rel="noreferrer" aria-label="Facebook"><Facebook size={18} /></a></div>
        </div>
        <div className="footer-links-column"><span className="footer-label">Explore</span><button onClick={() => onNavigate('catalog')} type="button">Shop all products</button><button onClick={() => onNavigate('how-it-works')} type="button">How it works</button><button onClick={() => onNavigate('our-story')} type="button">Our story</button></div>
        <div className="footer-contact-column"><span className="footer-label">Need a hand?</span><a href={`tel:${business.phoneDial}`}><Phone size={16} /> {business.phoneDisplay}</a><p><Clock size={16} /> {business.hours}</p><p><MapPin size={16} /> {business.deliveryArea}</p></div>
        <div className="footer-cta"><span className="footer-label">Ready when you are</span><h3>Fresh stock.<br /><span>One message.</span></h3><button className="button button-light" onClick={() => onNavigate('catalog')} type="button">Start an order <ArrowRight size={16} /></button></div>
      </div>
      <div className="page-width footer-bottom"><span>© {new Date().getFullYear()} {business.name}</span><span>Made for good food businesses.</span><button onClick={() => onNavigate('top')} type="button">Back to top ↑</button></div>
    </footer>
  );
}

export default App;
