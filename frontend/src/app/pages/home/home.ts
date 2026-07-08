import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductService, Product, Category } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { productImageUrl, API_BASE } from '../../config/contact.config';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <!-- Hero Promo Slider -->
    <div class="hero-slider">
      <div class="slide" [style.background-image]="'linear-gradient(to right, rgba(0,0,0,0.65), rgba(0,0,0,0.25)), url(' + currentBanner() + ')'">
        <div class="slide-content">
          <span class="slide-tag">Nouveautés</span>
          <h2>BS DRESSING SERVICE</h2>
          <p>Découvrez notre sélection de meubles de rangement élégants et fonctionnels. Profitez de réductions exclusives.</p>
          <button class="btn-shop" routerLink="/search">Découvrir nos Meubles</button>
        </div>
      </div>
      <!-- Slider dots -->
      <div class="slider-dots">
        <span *ngFor="let banner of banners; let idx = index" 
              [class.active]="idx === activeSlideIndex()" 
              (click)="setSlide(idx)"></span>
      </div>
    </div>

    <!-- Quick Categories (Flex-Wrap Grid) -->
    <div class="section-container">
      <h3 class="section-title text-center-desktop">Nos Catégories</h3>
      <div class="categories-grid">
        <div class="category-circle-card" 
             *ngFor="let cat of categories()"
             [routerLink]="['/search']" [queryParams]="{ category: cat.slug }">
          <div class="circle-image">
            <img [src]="'https://mon-vrai-backend.onrender.com' + cat.imageUrl" [alt]="cat.name" />
          </div>
          <span>{{ cat.name }}</span>
        </div>
      </div>
    </div>

    <!-- Promotional Section (Responsive Grid) -->
    <div class="section-container">
      <div class="section-title">
        <h3>Meubles en Promotion</h3>
        <a routerLink="/search" [queryParams]="{ isPromo: true }">Voir tout</a>
      </div>
      <div class="responsive-grid">
        <div class="product-card-grid" *ngFor="let prod of promoProducts()">
          <div class="image-wrapper" [routerLink]="['/product', prod.id]">
            <img [src]="productImageUrl(prod.images[0]?.imageUrl)" [alt]="prod.name" />
            <span class="discount-badge">-{{ prod.discountPercentage }}%</span>
          </div>
          <div class="product-info">
            <span class="brand">{{ prod.brand }}</span>
            <h4 class="name">{{ prod.name }}</h4>
            <div class="price-container">
              <span class="price-new">{{ prod.price }} FCFA</span>
              <span class="price-old" *ngIf="prod.oldPrice">{{ prod.oldPrice }} FCFA</span>
            </div>
          </div>
          <button class="fav-btn" (click)="toggleFav(prod)">
            <i class="bi" [class.bi-heart-fill]="isFav(prod.id)" [class.bi-heart]="!isFav(prod.id)"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Trending Grid -->
    <div class="section-container">
      <div class="section-title">
        <h3>Meubles Populaires</h3>
        <a routerLink="/search" [queryParams]="{ isPopular: true }">Voir tout</a>
      </div>
      <div class="responsive-grid">
        <div class="product-card-grid" *ngFor="let prod of popularProducts()">
          <div class="image-wrapper" [routerLink]="['/product', prod.id]">
            <img [src]="productImageUrl(prod.images[0]?.imageUrl)" [alt]="prod.name" />
            <span class="discount-badge" *ngIf="prod.isPromo">-{{ prod.discountPercentage }}%</span>
          </div>
          <div class="product-info">
            <span class="brand">{{ prod.brand }}</span>
            <h4 class="name">{{ prod.name }}</h4>
            <div class="price-container">
              <span class="price-new">{{ prod.price }} FCFA</span>
              <span class="price-old" *ngIf="prod.oldPrice">{{ prod.oldPrice }} FCFA</span>
            </div>
          </div>
          <button class="fav-btn" (click)="toggleFav(prod)">
            <i class="bi" [class.bi-heart-fill]="isFav(prod.id)" [class.bi-heart]="!isFav(prod.id)"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Recommendations (Recently viewed grid) -->
    <div class="section-container" *ngIf="recentlyViewed().length > 0">
      <h3 class="section-title">Récemment Consultés</h3>
      <div class="responsive-grid">
        <div class="product-card-grid" *ngFor="let prod of recentlyViewed()">
          <div class="image-wrapper" [routerLink]="['/product', prod.id]">
            <img [src]="productImageUrl(prod.images[0]?.imageUrl)" [alt]="prod.name" />
          </div>
          <div class="product-info">
            <span class="brand">{{ prod.brand }}</span>
            <h4 class="name">{{ prod.name }}</h4>
            <div class="price-container">
              <span class="price-new">{{ prod.price }} FCFA</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .hero-slider {
      width: 100%;
      height: 520px;
      position: relative;
      overflow: hidden;
    }
    @media (max-width: 768px) {
      .hero-slider {
        height: 300px;
      }
    }
    .slide {
      width: 100%;
      height: 100%;
      background-size: cover;
      background-position: center;
      display: flex;
      align-items: flex-end;
      padding: 4rem 3rem;
      transition: background-image 0.5s ease-in-out;
    }
    @media (max-width: 768px) {
      .slide {
        padding: 2rem 1.5rem;
      }
    }
    .slide-content {
      color: #FFFFFF;
      max-width: 600px;
      animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .slide-tag {
      font-size: 0.8rem;
      font-weight: 700;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: var(--gold-accent);
      margin-bottom: 0.6rem;
      display: inline-block;
    }
    .slide-content h2 {
      font-size: 3rem;
      font-weight: 800;
      margin-bottom: 0.8rem;
      letter-spacing: 0.05em;
      line-height: 1.1;
    }
    @media (max-width: 768px) {
      .slide-content h2 {
        font-size: 1.8rem;
      }
    }
    .slide-content p {
      font-size: 1.05rem;
      opacity: 0.9;
      margin-bottom: 1.8rem;
      font-weight: 450;
      line-height: 1.5;
    }
    @media (max-width: 768px) {
      .slide-content p {
        font-size: 0.85rem;
        margin-bottom: 1rem;
      }
    }
    .btn-shop {
      background-color: #FFFFFF;
      color: #000000;
      border: none;
      padding: 0.9rem 2rem;
      font-family: var(--font-display);
      font-weight: 700;
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      cursor: pointer;
      transition: var(--transition-smooth);
      border-radius: 2px;
    }
    .btn-shop:hover {
      background-color: #000000;
      color: #FFFFFF;
    }
    .btn-shop:active {
      transform: scale(0.97);
    }
    .slider-dots {
      position: absolute;
      bottom: 20px;
      right: 30px;
      display: flex;
      gap: 8px;
    }
    .slider-dots span {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: rgba(255, 255, 255, 0.4);
      cursor: pointer;
      transition: var(--transition-smooth);
    }
    .slider-dots span.active {
      background-color: #FFFFFF;
      width: 24px;
      border-radius: 4px;
    }
    .section-container {
      margin-top: 3rem;
      margin-bottom: 3rem;
      padding: 0 1rem;
    }
    .text-center-desktop {
      text-align: center;
      margin-bottom: 2rem;
    }
    .categories-grid {
      display: flex;
      justify-content: center;
      gap: 2.2rem;
      flex-wrap: wrap;
      padding: 1rem;
    }
    .category-circle-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.6rem;
      cursor: pointer;
      flex-shrink: 0;
      transition: var(--transition-smooth);
    }
    .category-circle-card:hover {
      transform: translateY(-4px);
    }
    .category-circle-card .circle-image {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      overflow: hidden;
      border: 2px solid var(--border-color);
      transition: var(--transition-smooth);
    }
    .category-circle-card:hover .circle-image {
      border-color: var(--gold-accent);
      box-shadow: var(--card-shadow);
    }
    .category-circle-card img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .category-circle-card span {
      font-size: 0.88rem;
      font-weight: 700;
      color: var(--text-primary);
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .product-card-grid {
      position: relative;
      background-color: var(--bg-secondary);
      border-radius: var(--border-radius-sm);
      overflow: hidden;
      transition: var(--transition-smooth);
      border: 1px solid var(--border-color);
    }
    .product-card-grid:hover {
      transform: translateY(-6px);
      box-shadow: var(--card-shadow);
    }
    .image-wrapper {
      width: 100%;
      height: 340px;
      overflow: hidden;
      position: relative;
      cursor: pointer;
      background-color: var(--bg-tertiary);
    }
    @media (max-width: 768px) {
      .image-wrapper {
        height: 210px;
      }
    }
    .image-wrapper img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: var(--transition-smooth);
    }
    .image-wrapper:hover img {
      transform: scale(1.04);
    }
    .discount-badge {
      position: absolute;
      top: 10px;
      left: 10px;
      background-color: var(--danger);
      color: #FFFFFF;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 0.25rem 0.5rem;
      border-radius: 2px;
      text-transform: uppercase;
    }
    .product-info {
      padding: 1rem;
    }
    .brand {
      font-size: 0.72rem;
      text-transform: uppercase;
      color: var(--text-muted);
      font-weight: 700;
      letter-spacing: 0.06em;
    }
    .name {
      font-size: 0.92rem;
      font-weight: 600;
      margin: 0.2rem 0 0.4rem 0;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .price-container {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }
    .price-new {
      font-size: 1rem;
      font-weight: 800;
      color: var(--text-primary);
    }
    .price-old {
      font-size: 0.85rem;
      text-decoration: line-through;
      color: var(--text-muted);
    }
    .fav-btn {
      position: absolute;
      top: 10px;
      right: 10px;
      background: rgba(255, 255, 255, 0.9);
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #000000;
      font-size: 0.95rem;
      cursor: pointer;
      box-shadow: 0 3px 8px rgba(0,0,0,0.08);
      transition: var(--transition-smooth);
    }
    body.dark-theme .fav-btn {
      background: rgba(18, 18, 22, 0.9);
      color: #FFFFFF;
    }
    .fav-btn:hover {
      transform: scale(1.1);
    }
    .fav-btn:active {
      transform: scale(0.88);
    }
    .fav-btn i.bi-heart-fill {
      color: var(--danger);
    }
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(24px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `]
})
export class HomeComponent implements OnInit {
  productService = inject(ProductService);
  cartService = inject(CartService);

  productImageUrl = productImageUrl;

  banners = [
    `${API_BASE}/uploads/WhatsApp Image 2026-07-01 at 20.31.11.jpeg`,
    `${API_BASE}/uploads/WhatsApp Image 2026-07-01 at 20.31.12.jpeg`,
    `${API_BASE}/uploads/WhatsApp Image 2026-07-01 at 20.31.13.jpeg`
  ];
  
  activeSlideIndex = signal(0);
  
  categories = signal<Category[]>([]);
  promoProducts = signal<Product[]>([]);
  popularProducts = signal<Product[]>([]);
  
  currentBanner = signal('https://mon-vrai-backend.onrender.com/uploads/banniere.jpeg');
  recentlyViewed = this.productService.recentlyViewed;

  constructor() {}

  ngOnInit() {
    this.loadData();
    this.startBannerRotation();
  }

  loadData() {
    // Categories
    this.productService.getCategories().subscribe(res => this.categories.set(res));

    // Promo Products
    this.productService.getProducts({ isPromo: 'true' }).subscribe(res => this.promoProducts.set(res));

    // Popular Products
    this.productService.getProducts({ isPopular: 'true' }).subscribe(res => this.popularProducts.set(res));
  }

  startBannerRotation() {
    setInterval(() => {
      this.activeSlideIndex.set((this.activeSlideIndex() + 1) % this.banners.length);
    }, 5000);
  }

  setSlide(idx: number) {
    this.activeSlideIndex.set(idx);
  }

  isFav(id: number): boolean {
    return this.productService.isFavorite(id);
  }

  toggleFav(product: Product) {
    this.productService.toggleFavorite(product);
  }
}
