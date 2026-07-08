import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="top-bar">
      <button routerLink="/cart" class="back-btn"><i class="bi bi-chevron-left"></i> Panier</button>
      <h1 class="logo-title">Validation de commande</h1>
      <div></div>
    </div>

    <div class="checkout-layout-container">

      <!-- Left Column: Order Forms -->
      <div class="checkout-forms-col">
        <!-- 1. Delivery Methods -->
        <div class="checkout-section">
          <h3>Mode de livraison</h3>
          <div class="delivery-tabs">
            <button
              [class.active]="shippingMethod() === 'home'"
              (click)="selectShipping('home')">
              <i class="bi bi-house"></i> Domicile (5 000 FCFA)
            </button>
            <button
              [class.active]="shippingMethod() === 'relay'"
              (click)="selectShipping('relay')">
              <i class="bi bi-pin-angle"></i> Point Relais (3 000 FCFA)
            </button>
            <button
              [class.active]="shippingMethod() === 'pickup'"
              (click)="selectShipping('pickup')">
              <i class="bi bi-shop"></i> Retrait Boutique (Gratuit)
            </button>
          </div>
        </div>

        <!-- 2. Shipping Address -->
        <div class="checkout-section">
          <h3>Adresse de livraison</h3>
          <div class="address-form">
            <div class="grid-inputs">
              <div class="form-group">
                <label>Nom complet *</label>
                <input type="text" class="input-premium" [(ngModel)]="address.name" placeholder="ex: Jean Dupont" />
              </div>
              <div class="form-group">
                <label>Téléphone de contact *</label>
                <input type="tel" class="input-premium" [(ngModel)]="address.phone" placeholder="ex: +242 06 888 88 88" />
              </div>
            </div>
            <div class="form-group" *ngIf="shippingMethod() !== 'pickup'">
              <label>Adresse postale / Rue *</label>
              <input type="text" class="input-premium" [(ngModel)]="address.street" placeholder="ex: 12 Rue Marien Ngouabi" />
            </div>
            <div class="grid-inputs" *ngIf="shippingMethod() !== 'pickup'">
              <div class="form-group">
                <label>Ville *</label>
                <input type="text" class="input-premium" [(ngModel)]="address.city" placeholder="ex: Brazzaville" />
              </div>
              <div class="form-group">
                <label>Pays *</label>
                <input type="text" class="input-premium" [(ngModel)]="address.country" placeholder="Congo" />
              </div>
            </div>
            <div class="form-group">
              <label>Instructions de livraison (Livreur / Boutique)</label>
              <textarea class="input-premium comment-box" [(ngModel)]="address.instructions" placeholder="ex: appeler à l'arrivée, à côté du supermarché..."></textarea>
            </div>
          </div>
        </div>

        <!-- 3. Payment Methods -->
        <div class="checkout-section">
          <h3>Méthodes de paiement</h3>
          <div class="payment-options">
            <label class="payment-card" [class.active]="paymentMethod() === 'cash'">
              <input type="radio" name="payment" value="cash" [(ngModel)]="paymentMethodModel" (change)="selectPayment('cash')" />
              <div class="payment-info">
                <i class="bi bi-cash-stack"></i>
                <div>
                  <h4>Paiement à la livraison / retrait</h4>
                  <p>Payez en espèces lorsque vous recevez ou retirez votre commande.</p>
                </div>
              </div>
            </label>

            <label class="payment-card" [class.active]="paymentMethod() === 'mobile_money'">
              <input type="radio" name="payment" value="mobile_money" [(ngModel)]="paymentMethodModel" (change)="selectPayment('mobile_money')" />
              <div class="payment-info">
                <i class="bi bi-phone"></i>
                <div>
                  <h4>Mobile Money / Airtel Money</h4>
                  <p>Effectuez le transfert et saisissez le code de référence.</p>
                </div>
              </div>
            </label>

            <label class="payment-card" [class.active]="paymentMethod() === 'card'">
              <input type="radio" name="payment" value="card" [(ngModel)]="paymentMethodModel" (change)="selectPayment('card')" />
              <div class="payment-info">
                <i class="bi bi-credit-card"></i>
                <div>
                  <h4>Carte bancaire</h4>
                  <p>Payez de manière sécurisée par Visa ou Mastercard.</p>
                </div>
              </div>
            </label>

            <label class="payment-card" [class.active]="paymentMethod() === 'whatsapp'">
              <input type="radio" name="payment" value="whatsapp" [(ngModel)]="paymentMethodModel" (change)="selectPayment('whatsapp')" />
              <div class="payment-info font-whatsapp">
                <i class="bi bi-whatsapp"></i>
                <div>
                  <h4>Commander via WhatsApp</h4>
                  <p>Envoyez la liste et validez votre adresse directement sur WhatsApp.</p>
                </div>
              </div>
            </label>
          </div>

          <!-- Airtel Mobile Money -->
          <div class="payment-details-form" *ngIf="paymentMethod() === 'mobile_money'">
            <div class="alert-info-pay">
              <i class="bi bi-info-circle-fill"></i>
              <span>Veuillez transférer le montant de <b>{{ total().toFixed(0) }} FCFA</b> au numéro <b>+242 06 000 00 00</b>.</span>
            </div>
            <div class="form-group">
              <label>Code de transaction / Référence Airtel Money *</label>
              <input type="text" class="input-premium" [(ngModel)]="txRef" placeholder="ex: TX-765412" />
            </div>
          </div>

          <!-- Credit Card -->
          <div class="payment-details-form" *ngIf="paymentMethod() === 'card'">
            <div class="form-group">
              <label>Nom sur la carte *</label>
              <input type="text" class="input-premium" [(ngModel)]="card.holderName" placeholder="Jean Dupont" />
            </div>
            <div class="form-group">
              <label>Numéro de carte *</label>
              <input type="text" class="input-premium" [(ngModel)]="card.number" maxlength="19" placeholder="0000 0000 0000 0000" />
            </div>
            <div class="grid-inputs">
              <div class="form-group">
                <label>Expiration *</label>
                <input type="text" class="input-premium" [(ngModel)]="card.expiry" maxlength="5" placeholder="MM/AA" />
              </div>
              <div class="form-group">
                <label>CVC / Code secret *</label>
                <input type="password" class="input-premium" [(ngModel)]="card.cvc" maxlength="4" placeholder="•••" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Sticky Recap -->
      <div class="checkout-summary-col">
        <div class="summary-card">
          <h3>Récapitulatif des articles</h3>

          <div class="items-mini-list">
            <div class="item-mini" *ngFor="let item of cartItems()">
              <img [src]="'https://ventedemeuble1.onrender.com' + (item.product.images[0]?.imageUrl || '/uploads/placeholder.png')" [alt]="item.product.name" />
              <div class="item-mini-info">
                <h4>{{ item.product.name }}</h4>
                <p>Qté: {{ item.quantity }}</p>
              </div>
              <span class="item-mini-price">{{ (item.product.price * item.quantity).toFixed(0) }} FCFA</span>
            </div>
          </div>

          <div class="totals-breakdown">
            <div class="summary-line">
              <span>Sous-total</span>
              <span>{{ subtotal().toFixed(0) }} FCFA</span>
            </div>
            <div class="summary-line">
              <span>Livraison</span>
              <span>{{ shippingFee().toFixed(0) }} FCFA</span>
            </div>
            <div class="summary-line discount" *ngIf="discountAmount() > 0">
              <span>Réduction</span>
              <span>-{{ discountAmount().toFixed(0) }} FCFA</span>
            </div>
            <div class="summary-line total-line">
              <span>TOTAL GENERAL</span>
              <span>{{ total().toFixed(0) }} FCFA</span>
            </div>
          </div>

          <button
            class="btn-premium order-confirm-btn"
            [class.whatsapp-theme]="paymentMethod() === 'whatsapp'"
            (click)="submitCheckout()"
            [disabled]="submitting()">
            <i class="bi bi-whatsapp" *ngIf="paymentMethod() === 'whatsapp'"></i>
            {{ paymentMethod() === 'whatsapp' ? 'Commander via WhatsApp' : submitting() ? 'Validation de commande...' : 'Confirmer la commande' }}
          </button>
        </div>
      </div>
    </div>
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
    .back-btn {
      background: none;
      border: none;
      color: var(--text-primary);
      font-size: 0.95rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-weight: 600;
    }
    .logo-title {
      font-size: 1.4rem !important;
      font-weight: 700;
    }
    .checkout-layout-container {
      display: grid;
      grid-template-columns: 1.8fr 1.2fr;
      gap: 3rem;
      padding: 2rem 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
    }
    .checkout-forms-col {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .checkout-section {
      background-color: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-sm);
      padding: 1.5rem;
    }
    .checkout-section h3 {
      font-size: 0.9rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-secondary);
      margin-bottom: 1.2rem;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.5rem;
    }
    .delivery-tabs {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.8rem;
    }
    .delivery-tabs button {
      background-color: var(--bg-primary);
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      padding: 1rem 0.4rem;
      font-size: 0.8rem;
      font-weight: 600;
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      transition: var(--transition-smooth);
    }
    .delivery-tabs button.active {
      border-color: var(--accent-color);
      color: var(--text-primary);
      background-color: var(--accent-light);
      box-shadow: 0 0 0 2px var(--accent-color);
    }
    .delivery-tabs button i {
      font-size: 1.2rem;
    }
    .form-group {
      margin-bottom: 1rem;
    }
    .form-group label {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-secondary);
      display: block;
      margin-bottom: 0.3rem;
    }
    .grid-inputs {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }
    .comment-box {
      height: 70px;
      resize: none;
      border-radius: 4px !important;
    }
    .payment-options {
      display: flex;
      flex-direction: column;
      gap: 0.8rem;
    }
    .payment-card {
      background-color: var(--bg-primary);
      border: 1px solid var(--border-color);
      padding: 1rem;
      border-radius: 4px;
      display: flex;
      gap: 1rem;
      align-items: center;
      cursor: pointer;
      transition: var(--transition-smooth);
    }
    .payment-card input[type="radio"] {
      accent-color: var(--accent-color);
      width: 18px;
      height: 18px;
    }
    .payment-info {
      display: flex;
      align-items: center;
      gap: 0.8rem;
    }
    .payment-info i {
      font-size: 1.5rem;
      color: var(--text-secondary);
    }
    .payment-info h4 {
      font-size: 0.9rem;
      font-weight: 650;
    }
    .payment-info p {
      font-size: 0.78rem;
      color: var(--text-muted);
      margin-top: 0.1rem;
    }
    .payment-card.active {
      border-color: var(--accent-color);
      background-color: var(--accent-light);
    }
    .font-whatsapp i {
      color: #25D366 !important;
    }
    .payment-details-form {
      background-color: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 4px;
      padding: 1.2rem;
      margin-top: 1rem;
    }
    .alert-info-pay {
      background-color: rgba(0, 71, 171, 0.08);
      color: #0047AB;
      padding: 0.8rem;
      border-radius: 4px;
      font-size: 0.82rem;
      display: flex;
      gap: 0.6rem;
      align-items: flex-start;
      margin-bottom: 1rem;
      line-height: 1.5;
    }
    .checkout-summary-col {
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
    .items-mini-list {
      display: flex;
      flex-direction: column;
      gap: 0.8rem;
      max-height: 240px;
      overflow-y: auto;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 1rem;
    }
    .item-mini {
      display: flex;
      align-items: center;
      gap: 0.8rem;
    }
    .item-mini img {
      width: 50px;
      height: 65px;
      object-fit: cover;
      border-radius: 2px;
      border: 1px solid var(--border-color);
    }
    .item-mini-info {
      flex: 1;
    }
    .item-mini-info h4 {
      font-size: 0.85rem;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .item-mini-info p {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }
    .item-mini-price {
      font-size: 0.85rem;
      font-weight: 700;
    }
    .totals-breakdown {
      display: flex;
      flex-direction: column;
      gap: 0.7rem;
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
    .order-confirm-btn {
      padding: 1rem !important;
      font-size: 0.95rem !important;
      border-radius: 4px !important;
    }
    .whatsapp-theme {
      background-color: #25D366 !important;
      color: #FFFFFF !important;
      gap: 0.5rem;
    }
    @media (max-width: 1024px) {
      .checkout-layout-container {
        grid-template-columns: 1fr;
        gap: 2rem;
      }
    }
  `]
})
export class CheckoutComponent implements OnInit {
  cartService = inject(CartService);
  orderService = inject(OrderService);
  auth = inject(AuthService);
  router = inject(Router);

  shippingMethod = this.cartService.shippingMethod;
  paymentMethod = this.cartService.paymentMethod;
  subtotal = this.cartService.subtotal;
  shippingFee = this.cartService.shippingFee;
  discountAmount = this.cartService.discountAmount;
  total = this.cartService.total;
  appliedCoupon = this.cartService.appliedCoupon;
  cartItems = this.cartService.cartItems;

  // Wrapper get/set : un signal ne peut pas être bindé directement en écriture avec [(ngModel)]
  get paymentMethodModel() {
    return this.paymentMethod();
  }
  set paymentMethodModel(v: 'cash' | 'mobile_money' | 'card' | 'whatsapp') {
    this.selectPayment(v);
  }

  address = {
    name: '',
    phone: '',
    street: '',
    city: '',
    country: 'Congo',
    instructions: ''
  };

  card = { holderName: '', number: '', expiry: '', cvc: '' };
  txRef = ''; // Airtel Money reference ID
  submitting = signal(false);

  ngOnInit() {
    if (!this.auth.isLoggedIn()) {
      alert('Veuillez vous connecter ou vous inscrire pour finaliser votre commande.');
      this.router.navigate(['/profile']);
      return;
    }
    this.prefillAddress();
  }

  prefillAddress() {
    const user = this.auth.currentUser();
    if (user) {
      this.address.name = user.name || '';
      this.address.phone = user.phone || '';
      if (user.addresses && user.addresses.length > 0) {
        const saved = user.addresses[0];
        this.address.street = saved.street || '';
        this.address.city = saved.city || '';
        this.address.country = saved.country || 'Congo';
        this.address.instructions = saved.instructions || '';
      }
    }
  }

  selectShipping(method: 'pickup' | 'home' | 'relay') {
    this.cartService.shippingMethod.set(method);
    if (method === 'pickup') {
      this.address.street = 'Retrait Boutique';
      this.address.city = 'Brazzaville';
      this.address.country = 'Congo';
    } else {
      this.prefillAddress();
    }
  }

  selectPayment(method: 'cash' | 'mobile_money' | 'card' | 'whatsapp') {
    this.cartService.paymentMethod.set(method);
  }

  validateFields(): boolean {
    if (!this.address.name.trim()) {
      alert('Veuillez renseigner votre nom complet.');
      return false;
    }
    if (!this.address.phone.trim()) {
      alert('Veuillez renseigner votre numéro de téléphone.');
      return false;
    }
    if (this.shippingMethod() !== 'pickup' && !this.address.street.trim()) {
      alert('Veuillez renseigner votre rue.');
      return false;
    }
    if (this.shippingMethod() !== 'pickup' && !this.address.city.trim()) {
      alert('Veuillez renseigner votre ville.');
      return false;
    }
    if (this.paymentMethod() === 'mobile_money' && !this.txRef.trim()) {
      alert('Veuillez renseigner la référence du transfert Airtel Money.');
      return false;
    }
    if (this.paymentMethod() === 'card') {
      if (!this.card.holderName.trim() || !this.card.number.trim() || !this.card.expiry.trim() || !this.card.cvc.trim()) {
        alert('Veuillez renseigner tous les champs de votre carte bancaire.');
        return false;
      }
    }
    return true;
  }

  buildPaymentDetails(): any {
    if (this.paymentMethod() === 'mobile_money') {
      return { txRef: this.txRef };
    }
    if (this.paymentMethod() === 'card') {
      // ⚠️ Ne jamais envoyer numéro/CVC bruts en prod : passer par un gateway (Stripe/CinetPay...) qui renvoie un token.
      return {};
    }
    return {};
  }

  submitCheckout() {
    if (!this.validateFields()) return;

    this.cartService.shippingAddress.set(this.address);

    const orderData = {
      items: this.cartItems().map(item => ({
        productId: item.product.id,
        quantity: item.quantity
      })),
      shippingMethod: this.shippingMethod(),
      shippingAddress: this.address,
      paymentMethod: this.paymentMethod(),
      paymentDetails: this.buildPaymentDetails(),
      couponCode: this.appliedCoupon()?.code || null
    };

    this.submitting.set(true);
    this.orderService.createOrder(orderData).subscribe({
      next: (res) => {
        this.submitting.set(false);
        this.cartService.clearCart();
        if (this.paymentMethod() === 'whatsapp') {
          const storeNumber = '242060000000';
          this.cartService.openWhatsAppCheckout(storeNumber);
          alert('Commande enregistrée. Redirection vers WhatsApp pour validation...');
        } else {
          alert('Votre commande a été validée avec succès !');
        }
        this.router.navigate(['/order-tracking', res.order.id]);
      },
      error: (err) => {
        this.submitting.set(false);
        alert(err.error?.message || 'Erreur lors de la validation.');
      }
    });
  }
}