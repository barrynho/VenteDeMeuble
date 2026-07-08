import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService, Product } from '../../services/product.service';
import { AuthService } from '../../services/auth.service';
import { ORDER_CONTACTS, OrderContact, productImageUrl } from '../../config/contact.config';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="top-bar">
      <button routerLink="/" class="back-btn"><i class="bi bi-chevron-left"></i> Retour</button>
      <h1 class="logo-title">Détails du produit</h1>
      <button class="share-btn" (click)="shareProduct()"><i class="bi bi-share"></i></button>
    </div>

    <div class="product-detail-layout" *ngIf="product(); else loadingTpl">
      
      <!-- Left Column: HD Gallery -->
      <div class="gallery-col">
        <div class="main-image-container" (click)="toggleZoom(true)">
          <img [src]="productImageUrl(activeImageUrl())" class="main-img" [alt]="product()!.name" />
          <span class="zoom-indicator"><i class="bi bi-zoom-in"></i> Zoom</span>
        </div>
        <div class="thumbnails-container">
          <div 
            class="thumb" 
            *ngFor="let img of product()!.images" 
            [class.active]="img.imageUrl === activeImageUrl()"
            (click)="setActiveImage(img.imageUrl)">
            <img [src]="productImageUrl(img.imageUrl)" [alt]="product()!.name" />
          </div>
        </div>
      </div>

      <!-- Right Column: Product Checkout Details -->
      <div class="details-col">
        <div class="product-header">
          <div class="brand-row">
            <button class="fav-icon" (click)="toggleFav()">
              <i class="bi" [class.bi-heart-fill]="isFav()" [class.bi-heart]="!isFav()"></i>
            </button>
          </div>
          <h2>{{ product()!.name }}</h2>
          
          <div class="price-box">
            <span class="price-val">{{ product()!.price }} FCFA</span>
            <span class="old-price-val" *ngIf="product()!.oldPrice">{{ product()!.oldPrice }} FCFA</span>
            <span class="discount-lbl" *ngIf="product()!.isPromo">-{{ product()!.discountPercentage }}%</span>
          </div>

          <div class="rating-summary" *ngIf="reviews().length > 0">
            <div class="stars">
              <i class="bi bi-star-fill filled"></i>
            </div>
            <span>{{ reviews().length }} avis client(s)</span>
          </div>
        </div>

        <!-- Stock visual badge indicator -->
        <div class="stock-banner" [class.low-stock]="availableStock() > 0 && availableStock() <= 5" [class.out-of-stock]="availableStock() === 0">
          <i class="bi" [class.bi-check-circle]="availableStock() > 5" [class.bi-exclamation-triangle]="availableStock() > 0 && availableStock() <= 5" [class.bi-x-circle]="availableStock() === 0"></i>
          <span>
            {{ availableStock() === 0 ? 'Rupture de stock' : availableStock() <= 5 ? 'Plus que ' + availableStock() + ' article(s) en stock !' : 'En stock' }}
          </span>
        </div>

        <div class="selectors-container">
          <!-- Quantity Selector -->
          <div class="qty-group" *ngIf="availableStock() > 0">
            <h3>Quantité :</h3>
            <div class="qty-selector">
              <button (click)="changeQty(-1)" [disabled]="quantity() <= 1"><i class="bi bi-dash"></i></button>
              <span class="qty-val">{{ quantity() }}</span>
              <button (click)="changeQty(1)" [disabled]="quantity() >= availableStock()"><i class="bi bi-plus"></i></button>
            </div>
          </div>

          <!-- Choix du numéro WhatsApp -->
          <div class="contact-selector" *ngIf="availableStock() > 0">
            <h3>Choisissez où passer votre commande :</h3>
            <div class="contact-options">
              <label 
                *ngFor="let contact of orderContacts" 
                class="contact-option"
                [class.selected]="selectedContact().phone === contact.phone">
                <input 
                  type="radio" 
                  name="orderContact" 
                  [value]="contact.phone"
                  [checked]="selectedContact().phone === contact.phone"
                  (change)="selectedContact.set(contact)" />
                <i class="bi bi-whatsapp"></i>
                <span>{{ contact.label }}</span>
              </label>
            </div>
          </div>

          <!-- Checkout CTA (WhatsApp Order) -->
          <div class="checkout-cta-wrap">
            <button 
              class="btn-premium add-to-cart-btn whatsapp-btn" 
              [disabled]="availableStock() === 0"
              (click)="orderViaWhatsApp()">
              <i class="bi bi-whatsapp"></i>
              {{ availableStock() === 0 ? 'Article en Rupture' : 'Commander sur WhatsApp' }}
            </button>
          </div>
        </div>

        <!-- Description collapse -->
        <div class="details-section">
          <h3>Description du produit</h3>
          <p class="description-text">{{ product()!.description || 'Aucune description disponible pour ce produit.' }}</p>
        </div>

        <!-- Reviews list & comments form -->
        <div class="details-section">
          <h3>Avis clients ({{ reviews().length }})</h3>
          
          <div class="add-review-form" *ngIf="isLoggedIn()">
            <h4>Ajouter un avis</h4>
            <div class="rating-stars-input">
              <button 
                *ngFor="let idx of [1,2,3,4,5]" 
                (click)="newRating.set(idx)"
                class="star-input-btn">
                <i class="bi" [class.bi-star-fill]="idx <= newRating()" [class.bi-star]="idx > newRating()"></i>
              </button>
            </div>
            <textarea 
              placeholder="Saisissez votre commentaire ici..." 
              [(ngModel)]="newComment"
              class="input-premium comment-box">
            </textarea>
            <button class="btn-premium submit-review-btn" [disabled]="!newRating()" (click)="submitReview()">Publier l'avis</button>
          </div>

          <div class="reviews-list" *ngIf="reviews().length > 0; else noReviewsTpl">
            <div class="review-item" *ngFor="let rev of reviews()">
              <div class="review-hdr">
                <span class="username">{{ rev.user?.name || 'Client anonyme' }}</span>
                <div class="stars">
                  <i class="bi bi-star-fill" *ngFor="let s of [1,2,3,4,5]" [class.filled]="s <= rev.rating"></i>
                </div>
              </div>
              <p class="review-comment">{{ rev.comment }}</p>
              <span class="review-date">{{ formatDate(rev.createdAt) }}</span>
            </div>
          </div>
          <ng-template #noReviewsTpl>
            <p class="no-reviews">Pas encore d'avis publié. Donnez le premier avis !</p>
          </ng-template>
        </div>
      </div>
    </div>

    <!-- Zoom modal fullscreen -->
    <div class="zoom-modal" *ngIf="isZoomed()">
      <button class="close-zoom" (click)="toggleZoom(false)"><i class="bi bi-x-lg"></i></button>
      <img [src]="'https://mon-vrai-backend.onrender.com' + activeImageUrl()" class="zoomed-img" [alt]="product()?.name" />
    </div>

    <ng-template #loadingTpl>
      <div class="skeleton-details">
        <div class="skeleton img-sk"></div>
        <div class="text-sk">
          <div class="skeleton line-sk title-sk"></div>
          <div class="skeleton line-sk price-sk"></div>
        </div>
      </div>
    </ng-template>
  `,
  styles: [`
    .top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.2rem 1.5rem;
      border-bottom: 1px solid var(--border-color);
      background-color: var(--bg-primary);
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
    .share-btn {
      background: none;
      border: none;
      color: var(--text-primary);
      font-size: 1.2rem;
      cursor: pointer;
    }

    /* Split Two-Column layout */
    .product-detail-layout {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 3rem;
      padding: 2rem 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    /* Gallery side styling */
    .gallery-col {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .main-image-container {
      width: 100%;
      height: 580px;
      overflow: hidden;
      border-radius: var(--border-radius-sm);
      cursor: zoom-in;
      position: relative;
      background-color: var(--bg-secondary);
      border: 1px solid var(--border-color);
    }
    .main-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: var(--transition-smooth);
    }
    .zoom-indicator {
      position: absolute;
      bottom: 15px;
      right: 15px;
      background: rgba(0, 0, 0, 0.6);
      color: #FFFFFF;
      font-size: 0.78rem;
      font-weight: 600;
      padding: 0.35rem 0.7rem;
      border-radius: 4px;
      display: flex;
      align-items: center;
      gap: 0.3rem;
    }
    .thumbnails-container {
      display: flex;
      gap: 0.8rem;
    }
    .thumb {
      width: 65px;
      height: 80px;
      border-radius: 4px;
      overflow: hidden;
      border: 1.5px solid var(--border-color);
      cursor: pointer;
      transition: var(--transition-smooth);
      opacity: 0.7;
    }
    .thumb.active {
      opacity: 1;
      border-color: var(--gold-accent);
      transform: scale(1.03);
    }
    .thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    /* Checkout actions side styling */
    .details-col {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .product-header .brand-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .brand-lbl {
      font-size: 0.8rem;
      text-transform: uppercase;
      font-weight: 700;
      color: var(--gold-accent);
      letter-spacing: 0.1em;
    }
    .fav-icon {
      background: none;
      border: none;
      font-size: 1.4rem;
      cursor: pointer;
      color: var(--text-primary);
    }
    .fav-icon i.bi-heart-fill {
      color: var(--danger);
    }
    .product-header h2 {
      font-size: 1.8rem;
      font-weight: 700;
      margin: 0.3rem 0;
    }
    .price-box {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 0.3rem;
    }
    .price-val {
      font-size: 1.6rem;
      font-weight: 800;
      color: var(--text-primary);
    }
    .old-price-val {
      font-size: 1.25rem;
      text-decoration: line-through;
      color: var(--text-muted);
    }
    .discount-lbl {
      background-color: var(--danger);
      color: #FFFFFF;
      font-size: 0.8rem;
      font-weight: 700;
      padding: 0.2rem 0.5rem;
      border-radius: 2px;
    }
    .rating-summary {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
      color: var(--text-secondary);
    }
    .stars i {
      color: var(--gold-accent);
    }

    /* Stock Banner */
    .stock-banner {
      padding: 0.8rem 1rem;
      background-color: rgba(16, 185, 129, 0.1);
      color: var(--success);
      border-radius: 4px;
      font-size: 0.85rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      border-left: 3px solid var(--success);
    }
    .stock-banner.low-stock {
      background-color: rgba(245, 158, 11, 0.1);
      color: var(--warning);
      border-left-color: var(--warning);
    }
    .stock-banner.out-of-stock {
      background-color: rgba(239, 68, 68, 0.1);
      color: var(--danger);
      border-left-color: var(--danger);
    }

    /* Selectors */
    .selectors-container {
      background-color: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-sm);
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.2rem;
    }
    .selector-group h3 {
      font-size: 0.85rem;
      font-weight: 700;
      margin-bottom: 0.6rem;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .selector-group h3 span {
      color: var(--text-primary);
      text-transform: none;
      font-weight: 700;
    }
    .color-balls {
      display: flex;
      gap: 0.8rem;
    }
    .color-balls button {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 1px solid rgba(0,0,0,0.1);
      cursor: pointer;
      transition: var(--transition-smooth);
    }
    .color-balls button.white-border {
      border: 1px solid var(--border-color);
    }
    .color-balls button.selected {
      transform: scale(1.15);
      box-shadow: 0 0 0 2.5px var(--accent-color);
    }
    .size-boxes {
      display: flex;
      flex-wrap: wrap;
      gap: 0.6rem;
    }
    .size-boxes button {
      border: 1px solid var(--border-color);
      background-color: var(--bg-primary);
      color: var(--text-primary);
      padding: 0.5rem 1.1rem;
      font-size: 0.82rem;
      font-weight: 700;
      border-radius: 4px;
      cursor: pointer;
      min-width: 46px;
      transition: var(--transition-smooth);
    }
    .size-boxes button:disabled {
      opacity: 0.35;
      text-decoration: line-through;
      cursor: not-allowed;
    }
    .size-boxes button.selected {
      background-color: var(--accent-color);
      color: var(--accent-text);
      border-color: var(--accent-color);
    }

    .qty-group {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }
    .qty-group h3 {
      font-size: 0.85rem;
      color: var(--text-secondary);
      text-transform: uppercase;
      font-weight: 700;
    }
    .qty-selector {
      display: flex;
      align-items: center;
      background-color: var(--bg-primary);
      border-radius: 4px;
      overflow: hidden;
      border: 1px solid var(--border-color);
    }
    .qty-selector button {
      border: none;
      background: none;
      width: 32px;
      height: 32px;
      cursor: pointer;
      font-size: 1rem;
      color: var(--text-primary);
    }
    .qty-val {
      padding: 0 0.8rem;
      font-weight: 700;
      font-size: 0.9rem;
    }

    /* Checkout actions */
    .checkout-cta-wrap {
      margin-top: 0.8rem;
    }
    .contact-selector {
      margin-bottom: 1.2rem;
    }
    .contact-selector h3 {
      font-size: 0.85rem;
      font-weight: 700;
      margin-bottom: 0.8rem;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .contact-options {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }
    .contact-option {
      display: flex;
      align-items: center;
      gap: 0.7rem;
      padding: 0.75rem 1rem;
      border: 1.5px solid var(--border-color);
      border-radius: var(--border-radius-sm);
      cursor: pointer;
      transition: var(--transition-smooth);
      background-color: var(--bg-primary);
    }
    .contact-option.selected {
      border-color: #25D366;
      background-color: rgba(37, 211, 102, 0.08);
    }
    .contact-option input {
      accent-color: #25D366;
    }
    .contact-option i {
      color: #25D366;
      font-size: 1.2rem;
    }
    .contact-option span {
      font-weight: 600;
      color: var(--text-primary);
      font-size: 0.9rem;
    }
    .add-to-cart-btn {
      padding: 1rem !important;
      font-size: 0.95rem !important;
      border-radius: 4px !important;
      gap: 0.6rem;
    }

    /* Description Collapse */
    .details-section {
      border-top: 1px solid var(--border-color);
      padding: 1.5rem 0.5rem;
    }
    .details-section h3 {
      font-size: 0.95rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.8rem;
      color: var(--text-secondary);
    }
    .description-text {
      font-size: 0.88rem;
      color: var(--text-secondary);
      line-height: 1.6;
    }

    /* Reviews block */
    .add-review-form {
      background-color: var(--bg-secondary);
      padding: 1.2rem;
      border-radius: 4px;
      border: 1px solid var(--border-color);
      margin-bottom: 1.5rem;
    }
    .add-review-form h4 {
      font-size: 0.9rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }
    .rating-stars-input {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 0.8rem;
    }
    .star-input-btn {
      background: none;
      border: none;
      font-size: 1.4rem;
      color: var(--text-muted);
      cursor: pointer;
      transition: var(--transition-smooth);
    }
    .star-input-btn i.bi-star-fill {
      color: var(--gold-accent);
    }
    .comment-box {
      height: 70px;
      resize: none;
      border-radius: 4px !important;
    }
    .submit-review-btn {
      padding: 0.6rem 1.2rem !important;
      font-size: 0.8rem !important;
      width: auto !important;
      margin-top: 0.5rem;
    }
    .review-item {
      padding: 1rem 0;
      border-bottom: 1px solid var(--border-color);
    }
    .review-hdr {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.4rem;
    }
    .username {
      font-weight: 700;
      font-size: 0.88rem;
    }
    .stars i {
      font-size: 0.75rem;
    }
    .review-comment {
      font-size: 0.88rem;
      color: var(--text-secondary);
      line-height: 1.5;
    }
    .review-date {
      font-size: 0.75rem;
      color: var(--text-muted);
      display: block;
      margin-top: 0.4rem;
    }
    .no-reviews {
      font-size: 0.85rem;
      color: var(--text-muted);
      text-align: center;
      padding: 2rem 0;
    }

    /* Fullscreen Zoom Modal */
    .zoom-modal {
      position: fixed;
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;
      background-color: rgba(0,0,0,0.95);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .zoomed-img {
      max-width: 95%;
      max-height: 90vh;
      object-fit: contain;
    }
    .close-zoom {
      position: absolute;
      top: 20px;
      right: 20px;
      background: none;
      border: none;
      color: #FFFFFF;
      font-size: 2rem;
      cursor: pointer;
    }

    /* Skeleton Loading states */
    .skeleton-details {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 3rem;
      padding: 2rem 1.5rem;
    }
    .img-sk { height: 500px; border-radius: var(--border-radius-sm); }
    .text-sk { padding: 1rem 0; }
    .title-sk { height: 32px; width: 70%; margin-bottom: 1rem; }
    .price-sk { height: 24px; width: 30%; }

    /* RESPONSIVE LAYOUT CONVERSION */
    @media (max-width: 1024px) {
      .product-detail-layout {
        grid-template-columns: 1fr;
        gap: 2rem;
      }
      .main-image-container {
        height: 440px;
      }
      .skeleton-details {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ProductDetailComponent implements OnInit {
  route = inject(ActivatedRoute);
  router = inject(Router);
  productService = inject(ProductService);
  auth = inject(AuthService);

  product = signal<Product | null>(null);
  similarProducts = signal<Product[]>([]);
  reviews = signal<any[]>([]);
  
  orderContacts = ORDER_CONTACTS;
  selectedContact = signal<OrderContact>(ORDER_CONTACTS[0]);
  productImageUrl = productImageUrl;
  
  // Selection state
  quantity = signal<number>(1);
  
  isZoomed = signal(false);
  showDesc = signal(true);
  
  // Review inputs
  newRating = signal(0);
  newComment = '';
  
  readonly isLoggedIn = this.auth.isLoggedIn;

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR');
  }

  // Active Image URL changes based on selection
  activeImageUrl = signal<string>('');

  availableStock = computed(() => {
    const p = this.product();
    return p ? p.stock : 0;
  });

  constructor() {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      if (id) {
        this.loadProductDetails(id);
      }
    });
  }

  loadProductDetails(id: number) {
    this.productService.getProductById(id).subscribe({
      next: (res) => {
        this.product.set(res.product);
        this.similarProducts.set(res.similarProducts);
        
        // Default image
        if (res.product.images && res.product.images.length > 0) {
          this.activeImageUrl.set(res.product.images[0].imageUrl);
        }
        
        this.loadReviews(id);
      }
    });
  }

  loadReviews(productId: number) {
    this.productService.getReviews(productId).subscribe(res => {
      this.reviews.set(res);
    });
  }

  changeQty(amount: number) {
    const newVal = this.quantity() + amount;
    if (newVal >= 1 && newVal <= this.availableStock()) {
      this.quantity.set(newVal);
    }
  }

  setActiveImage(url: string) {
    this.activeImageUrl.set(url);
  }

  toggleZoom(zoom: boolean) {
    this.isZoomed.set(zoom);
  }

  isFav(): boolean {
    const p = this.product();
    return p ? this.productService.isFavorite(p.id) : false;
  }

  toggleFav() {
    const p = this.product();
    if (p) this.productService.toggleFavorite(p);
  }

  orderViaWhatsApp() {
    const p = this.product();
    if (!p) return;

    if (!this.isLoggedIn()) {
      alert("Veuillez vous inscrire ou vous connecter pour passer une commande.");
      this.router.navigate(['/profile']);
      return;
    }

    const user = this.auth.currentUser();
    const userName = user ? user.name : 'Client';
    const selectedNumber = this.selectedContact().phone;
    const imageUrl = 'https://mon-vrai-backend.onrender.com' + this.activeImageUrl();
    
    const message = `Bonjour BS Dressing Service, je suis ${userName}.\n\nJe souhaite commander ce meuble:\n` +
      `📦 Produit: ${p.name}\n` +
      `💰 Prix: ${p.price} FCFA\n` +
      `📊 Quantité: ${this.quantity()}\n` +
      `🖼️ Image du meuble: ${imageUrl}\n` +
      `🔗 Lien: ${window.location.href}\n\n` +
      `Merci de me contacter pour finaliser la commande.`;
    
    const whatsappUrl = `https://wa.me/${selectedNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  }

  shareProduct() {
    const p = this.product();
    if (p) {
      if (navigator.share) {
        navigator.share({
          title: p.name,
          text: `Découvrez ce meuble de rangement : ${p.name}`,
          url: window.location.href
        }).catch(err => console.log(err));
      } else {
        navigator.clipboard.writeText(window.location.href);
        alert('Lien du produit copié dans le presse-papiers !');
      }
    }
  }

  submitReview() {
    const p = this.product();
    const r = this.newRating();
    const c = this.newComment;
    
    if (p && r) {
      this.productService.submitReview(p.id, r, c).subscribe({
        next: (res) => {
          this.reviews.set([res.review, ...this.reviews()]);
          this.newRating.set(0);
          this.newComment = '';
          alert('Merci pour votre avis !');
        },
        error: (err) => alert(err.error?.message || 'Erreur lors du dépôt de l\'avis.')
      });
    }
  }
}
