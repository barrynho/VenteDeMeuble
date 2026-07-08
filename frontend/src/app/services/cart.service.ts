import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Product } from './product.service';

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface AppliedCoupon {
  code: string;
  type: 'percent' | 'fixed' | 'free_shipping';
  value: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly couponApi = 'https://ventedemeuble1.onrender.com/api/coupons/validate';
  
  readonly cartItems = signal<CartItem[]>([]);
  
  readonly shippingMethod = signal<'pickup' | 'home' | 'relay'>('home');
  readonly shippingAddress = signal<any>({
    name: '',
    phone: '',
    street: '',
    city: '',
    country: 'Congo',
    instructions: ''
  });
  readonly paymentMethod = signal<'mobile_money' | 'card' | 'whatsapp' | 'cash'>('whatsapp');
  readonly appliedCoupon = signal<AppliedCoupon | null>(null);

  readonly itemCount = computed(() => {
    return this.cartItems().reduce((sum, item) => sum + item.quantity, 0);
  });

  readonly subtotal = computed(() => {
    return this.cartItems().reduce((sum, item) => sum + (parseFloat(item.product.price as any) * item.quantity), 0);
  });

  readonly shippingFee = computed(() => {
    const method = this.shippingMethod();
    if (method === 'pickup') return 0;
    if (method === 'relay') return 3000;
    return 5000;
  });

  readonly discountAmount = computed(() => {
    const coupon = this.appliedCoupon();
    const sub = this.subtotal();
    const ship = this.shippingFee();

    if (!coupon) return 0;
    if (coupon.type === 'percent') {
      return sub * (coupon.value / 100);
    }
    if (coupon.type === 'fixed') {
      return coupon.value;
    }
    if (coupon.type === 'free_shipping') {
      return ship;
    }
    return 0;
  });

  readonly total = computed(() => {
    const sub = this.subtotal();
    const ship = this.shippingFee();
    const discount = this.discountAmount();
    const activeShip = this.appliedCoupon()?.type === 'free_shipping' ? 0 : ship;
    const finalTotal = sub + activeShip - discount;
    return finalTotal > 0 ? finalTotal : 0;
  });

  constructor(private http: HttpClient) {
    this.loadCart();
  }

  private loadCart() {
    const saved = localStorage.getItem('cart');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.cartItems.set(parsed.map((item: any) => ({
          product: item.product,
          quantity: item.quantity
        })));
      } catch {
        localStorage.removeItem('cart');
      }
    }
  }

  private saveCart() {
    localStorage.setItem('cart', JSON.stringify(this.cartItems()));
  }

  addToCart(product: Product, quantity: number = 1) {
    const current = this.cartItems();
    const existingIndex = current.findIndex(item => item.product.id === product.id);

    if (existingIndex > -1) {
      current[existingIndex].quantity += quantity;
      this.cartItems.set([...current]);
    } else {
      this.cartItems.set([...current, { product, quantity }]);
    }
    
    this.saveCart();
  }

  updateQuantity(index: number, quantity: number) {
    const current = this.cartItems();
    if (index >= 0 && index < current.length) {
      if (quantity <= 0) {
        current.splice(index, 1);
      } else {
        current[index].quantity = quantity;
      }
      this.cartItems.set([...current]);
      this.saveCart();
    }
  }

  removeFromCart(index: number) {
    const current = this.cartItems();
    current.splice(index, 1);
    this.cartItems.set([...current]);
    this.saveCart();
  }

  clearCart() {
    this.cartItems.set([]);
    this.appliedCoupon.set(null);
    localStorage.removeItem('cart');
  }

  applyCoupon(code: string): Observable<any> {
    return this.http.post<any>(this.couponApi, {
      code,
      subtotal: this.subtotal()
    }).pipe(
      tap(res => {
        this.appliedCoupon.set(res.coupon);
      })
    );
  }

  removeCoupon() {
    this.appliedCoupon.set(null);
  }

  openWhatsAppCheckout(whatsappNumber: string) {
    const address = this.shippingAddress();
    const items = this.cartItems();
    
    let message = `🛒 *Nouvelle Commande - Meubles de Rangement*\n\n`;
    message += `👤 *Client* : ${address.name}\n`;
    message += `📞 *Téléphone* : ${address.phone}\n`;
    message += `📍 *Adresse* : ${address.street}, ${address.city}, ${address.country}\n`;
    if (address.instructions) {
      message += `📝 *Instructions* : ${address.instructions}\n`;
    }
    message += `🚚 *Livraison* : ${this.shippingMethod().toUpperCase()}\n\n`;
    
    message += `📦 *Meubles commandés* :\n`;
    items.forEach((item, idx) => {
      const price = parseFloat(item.product.price as any);
      message += `${idx + 1}. *${item.product.name}* x${item.quantity} - ${(price * item.quantity).toFixed(0)} FCFA\n`;
    });
    
    message += `\n💵 *Détails financiers* :\n`;
    message += `- Sous-total : ${this.subtotal().toFixed(0)} FCFA\n`;
    message += `- Livraison : ${this.shippingFee().toFixed(0)} FCFA\n`;
    if (this.discountAmount() > 0) {
      message += `- Code Promo (${this.appliedCoupon()?.code}) : -${this.discountAmount().toFixed(0)} FCFA\n`;
    }
    message += `💰 *TOTAL A PAYER : ${this.total().toFixed(0)} FCFA*\n\n`;
    message += `Merci de confirmer la prise en charge de ma commande ! 🙏`;

    const encodedText = encodeURIComponent(message);
    const link = `https://wa.me/${whatsappNumber}?text=${encodedText}`;
    window.open(link, '_blank');
  }
}
