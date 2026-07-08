import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { productImageUrl } from '../../config/contact.config';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="top-bar">
      <h1 class="logo-title">Mon Panier</h1>
      <button class="clear-cart-btn" *ngIf="items().length > 0" (click)="clearCart()">
        <i class="bi bi-trash"></i> Vider le panier
      </button>
    </div>

    <div class="cart-layout-container" *ngIf="items().length > 0; else emptyCartTpl">
      
      <!-- Left Column: Items List -->
      <div class="cart-items-col">
        <div class="cart-item-row" *ngFor="let item of items(); let idx = index">
          <div class="item-img" [routerLink]="['/product', item.product.id]">
            <img [src]="productImageUrl(item.product.images[0]?.imageUrl)" [alt]="item.product.name" />
          </div>
          <div class="item-details">
            <div class="title-brand-row">
              <h3 [routerLink]="['/product', item.product.id]">{{ item.product.name }}</h3>
              <span class="item-brand">{{ item.product.brand }}</span>
            </div>
            <div class="price-row">
              <span class="price">{{ item.product.price }} FCFA</span>
              <div class="qty-control">
                <button (click)="updateQty(idx, item.quantity - 1)"><i class="bi bi-dash"></i></button>
                <span>{{ item.quantity }}</span>
                <button (click)="updateQty(idx, item.quantity + 1)"><i class="bi bi-plus"></i></button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Summary Panel & Coupon input (Sticky) -->
      <div class="cart-summary-col">
        <div class="summary-card">
          <h3>Résumé de la commande</h3>
          
          <!-- Coupon Box inside summary card -->
          <div class="coupon-section">
            <h4 class="section-title-sm">Code Promo</h4>
            <div class="coupon-input-row" *ngIf="!appliedCoupon()">
              <input 
                type="text" 
                class="input-premium" 
                placeholder="Code (ex: ECOM20)" 
                [(ngModel)]="couponCode"
                (keyup.enter)="applyCoupon()"
              />
              <button class="btn-premium apply-btn" (click)="applyCoupon()">Valider</button>
            </div>

            <div class="applied-coupon-row" *ngIf="appliedCoupon()">
              <div class="coupon-info">
                <i class="bi bi-tag-fill"></i>
                <span>Code <b>{{ appliedCoupon()!.code }}</b> activé</span>
              </div>
              <button class="remove-coupon-btn" (click)="removeCoupon()"><i class="bi bi-x-circle-fill"></i></button>
            </div>
          </div>

          <div class="totals-breakdown">
            <div class="summary-line">
              <span>Sous-total</span>
              <span>{{ subtotal().toFixed(0) }} FCFA</span>
            </div>
            <div class="summary-line">
              <span>Frais de livraison</span>
              <span>{{ shippingFee().toFixed(0) }} FCFA</span>
            </div>
            <div class="summary-line discount" *ngIf="discountAmount() > 0">
              <span>Réduction</span>
              <span>-{{ discountAmount().toFixed(0) }} FCFA</span>
            </div>
            <div class="summary-line total-line">
              <span>TOTAL ESTIMÉ</span>
              <span>{{ total().toFixed(0) }} FCFA</span>
            </div>
          </div>

          <button class="btn-premium checkout-btn" (click)="goToCheckout()">Passer la commande</button>
        </div>
      </div>
    </div>

    <ng-template #emptyCartTpl>
      <div class="empty-state">
        <i class="bi bi-cart-x"></i>
        <h4>Votre panier est vide</h4>
        <p>Parcourez notre catalogue de meubles de rangement et trouvez le modèle idéal.</p>
        <button class="btn-premium discover-btn" routerLink="/search">Découvrir nos meubles</button>
      </div>
    </ng-template>
  `,
  styles: [`
    .top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid var(--border-color);
      max-width: 1400px;
      margin: 0 auto;
    }
    .logo-title {
      font-size: 1.4rem !important;
      font-weight: 700;
    }
    .clear-cart-btn {
      background: none;
      border: none;
      color: var(--danger);
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.3rem;
    }

    /* Layout responsive desktop grid */
    .cart-layout-container {
      display: grid;
      grid-template-columns: 1.8fr 1fr;
      gap: 3rem;
      padding: 2rem 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    /* Items col */
    .cart-items-col {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .cart-item-row {
      display: flex;
      gap: 1.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--border-color);
    }
    .item-img {
      width: 100px;
      height: 130px;
      border-radius: var(--border-radius-sm);
      overflow: hidden;
      cursor: pointer;
      border: 1px solid var(--border-color);
    }
    .item-img img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .item-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
    .title-brand-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .item-details h3 {
      font-size: 1.05rem;
      font-weight: 600;
      color: var(--text-primary);
      cursor: pointer;
      text-decoration: none;
    }
    .item-details h3:hover {
      color: var(--gold-accent);
    }
    .item-brand {
      font-size: 0.75rem;
      text-transform: uppercase;
      color: var(--text-muted);
      font-weight: 700;
      letter-spacing: 0.05em;
    }
    .item-variants {
      display: flex;
      gap: 0.8rem;
    }
    .variant-tag {
      font-size: 0.75rem;
      color: var(--text-secondary);
      background-color: var(--bg-secondary);
      padding: 0.2rem 0.6rem;
      border-radius: 4px;
      display: flex;
      align-items: center;
      gap: 0.3rem;
      border: 1px solid var(--border-color);
    }
    .color-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      display: inline-block;
      border: 1px solid rgba(0,0,0,0.1);
    }
    .price-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: auto;
    }
    .price {
      font-size: 1.15rem;
      font-weight: 800;
      color: var(--text-primary);
    }
    .qty-control {
      display: flex;
      align-items: center;
      background-color: var(--bg-secondary);
      border-radius: var(--border-radius-sm);
      border: 1px solid var(--border-color);
      overflow: hidden;
    }
    .qty-control button {
      border: none;
      background: none;
      width: 32px;
      height: 32px;
      cursor: pointer;
      color: var(--text-primary);
      transition: var(--transition-smooth);
    }
    .qty-control button:hover {
      background-color: var(--border-color);
    }
    .qty-control span {
      padding: 0 0.8rem;
      font-weight: 700;
      font-size: 0.88rem;
    }

    /* Summary Card */
    .cart-summary-col {
      align-self: flex-start;
      position: sticky;
      top: 95px;
    }
    .summary-card {
      background-color: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-sm);
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .summary-card h3 {
      font-size: 1rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 700;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.6rem;
      color: var(--text-secondary);
    }
    .section-title-sm {
      font-size: 0.82rem;
      text-transform: uppercase;
      font-weight: 700;
      color: var(--text-secondary);
      margin-bottom: 0.5rem;
    }
    .coupon-input-row {
      display: flex;
      gap: 0.5rem;
    }
    .coupon-input-row input {
      border-radius: 4px !important;
      padding: 0.6rem 0.8rem !important;
      font-size: 0.85rem !important;
    }
    .apply-btn {
      width: auto !important;
      padding: 0 1.2rem !important;
      font-size: 0.8rem !important;
      border-radius: 4px !important;
    }
    .applied-coupon-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background-color: rgba(16, 185, 129, 0.1);
      border: 1px dashed var(--success);
      padding: 0.6rem 0.8rem;
      border-radius: 4px;
      color: var(--success);
      font-size: 0.85rem;
    }
    .coupon-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .remove-coupon-btn {
      background: none;
      border: none;
      color: var(--danger);
      font-size: 1.15rem;
      cursor: pointer;
    }
    
    .totals-breakdown {
      display: flex;
      flex-direction: column;
      gap: 0.7rem;
      border-top: 1px solid var(--border-color);
      padding-top: 1rem;
    }
    .summary-line {
      display: flex;
      justify-content: space-between;
      font-size: 0.88rem;
      color: var(--text-secondary);
    }
    .summary-line.discount {
      color: var(--success);
      font-weight: 600;
    }
    .total-line {
      font-size: 1.2rem;
      font-weight: 800;
      color: var(--text-primary);
      border-top: 1px dashed var(--border-color);
      padding-top: 0.8rem;
      margin-top: 0.4rem;
    }
    .checkout-btn {
      padding: 1rem !important;
      font-size: 0.95rem !important;
      border-radius: 4px !important;
    }

    /* Empty State */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 8rem 2rem;
      text-align: center;
      max-width: 500px;
      margin: 0 auto;
    }
    .empty-state i {
      font-size: 4rem;
      color: var(--text-muted);
      margin-bottom: 1.2rem;
    }
    .empty-state h4 {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }
    .empty-state p {
      font-size: 0.9rem;
      color: var(--text-muted);
      margin-bottom: 1.8rem;
    }
    .discover-btn {
      width: auto !important;
      padding: 0.8rem 2rem !important;
    }

    /* RESPONSIVE CONVERSION */
    @media (max-width: 1024px) {
      .cart-layout-container {
        grid-template-columns: 1fr;
        gap: 2rem;
      }
    }
  `]
})
export class CartComponent {
  cartService = inject(CartService);
  auth = inject(AuthService);
  router = inject(Router);

  items = this.cartService.cartItems;
  subtotal = this.cartService.subtotal;
  shippingFee = this.cartService.shippingFee;
  discountAmount = this.cartService.discountAmount;
  total = this.cartService.total;
  appliedCoupon = this.cartService.appliedCoupon;
  
  productImageUrl = productImageUrl;
  couponCode = '';

  constructor() {}

  updateQty(index: number, quantity: number) {
    this.cartService.updateQuantity(index, quantity);
  }

  clearCart() {
    this.cartService.clearCart();
  }

  applyCoupon() {
    const code = this.couponCode.trim();
    if (code) {
      this.cartService.applyCoupon(code).subscribe({
        next: () => {
          this.couponCode = '';
          alert('Code promo appliqué avec succès !');
        },
        error: (err) => alert(err.error?.message || 'Erreur d\'application du code promo.')
      });
    }
  }

  removeCoupon() {
    this.cartService.removeCoupon();
  }

  goToCheckout() {
    // If user is not logged in, ask to connect first
    if (!this.auth.isLoggedIn()) {
      alert('Veuillez vous connecter pour valider votre commande.');
      this.router.navigate(['/profile']);
    } else {
      this.router.navigate(['/checkout']);
    }
  }
}
