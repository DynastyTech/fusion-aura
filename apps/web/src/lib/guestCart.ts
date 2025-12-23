// Guest cart management using localStorage
// Used for anonymous/guest checkout

export interface GuestCartItem {
  productId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number | string;
    images: string[];
  };
}

const GUEST_CART_KEY = 'fusionaura_guest_cart';

export function getGuestCart(): GuestCartItem[] {
  if (typeof window === 'undefined') return [];
  const cart = localStorage.getItem(GUEST_CART_KEY);
  return cart ? JSON.parse(cart) : [];
}

export function setGuestCart(items: GuestCartItem[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
}

export function addToGuestCart(product: GuestCartItem['product'], quantity: number): void {
  const cart = getGuestCart();
  const existingIndex = cart.findIndex((item) => item.productId === product.id);
  
  if (existingIndex >= 0) {
    cart[existingIndex].quantity += quantity;
  } else {
    cart.push({
      productId: product.id,
      quantity,
      product,
    });
  }
  
  setGuestCart(cart);
}

export function updateGuestCartItem(productId: string, quantity: number): void {
  const cart = getGuestCart();
  const item = cart.find((item) => item.productId === productId);
  if (item) {
    if (quantity <= 0) {
      removeFromGuestCart(productId);
    } else {
      item.quantity = quantity;
      setGuestCart(cart);
    }
  }
}

export function removeFromGuestCart(productId: string): void {
  const cart = getGuestCart().filter((item) => item.productId !== productId);
  setGuestCart(cart);
}

export function clearGuestCart(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(GUEST_CART_KEY);
}

export function getGuestCartTotal(): number {
  const cart = getGuestCart();
  return cart.reduce((total, item) => {
    const price = typeof item.product.price === 'string' ? parseFloat(item.product.price) : item.product.price;
    return total + price * item.quantity;
  }, 0);
}

