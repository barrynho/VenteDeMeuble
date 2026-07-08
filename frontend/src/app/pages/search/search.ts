import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService, Product, Category } from '../../services/product.service';
import { productImageUrl } from '../../config/contact.config';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="search-layout-container">
      
      <!-- Filters Sidebar (Static left column on desktop, Drawer sheet on mobile) -->
      <aside class="filters-sidebar" [class.open]="showFiltersDrawer()">
        <div class="sidebar-hdr">
          <h3>Filtres de recherche</h3>
          <button class="close-btn" (click)="toggleFilters(false)">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <div class="sidebar-body">
          <!-- Categories -->
          <div class="filter-group">
            <h4>Catégories</h4>
            <div class="pills-container">
              <span 
                class="pill-choice" 
                *ngFor="let cat of categories()"
                [class.selected]="selectedCategory() === cat.slug"
                (click)="selectedCategory.set(selectedCategory() === cat.slug ? null : cat.slug)">
                {{ cat.name }}
              </span>
            </div>
          </div>

          <!-- Prices -->
          <div class="filter-group">
            <h4>Tranche de prix (FCFA)</h4>
            <div class="price-inputs">
              <input type="number" placeholder="Min" [(ngModel)]="minPrice" />
              <span class="dash">-</span>
              <input type="number" placeholder="Max" [(ngModel)]="maxPrice" />
            </div>
          </div>

          <!-- Promo toggle -->
          <div class="filter-toggle-row">
            <label for="promo-toggle">En promotion uniquement</label>
            <input type="checkbox" id="promo-toggle" [(ngModel)]="selectedPromo" />
          </div>
        </div>

        <div class="sidebar-ftr">
          <button class="btn-premium" (click)="applyFilters()">Appliquer les Filtres</button>
        </div>
      </aside>

      <!-- Sidebar Mobile Drawer Overlay backdrop -->
      <div class="drawer-overlay" *ngIf="showFiltersDrawer()" (click)="toggleFilters(false)"></div>

      <!-- Main Results Display -->
      <div class="search-results-section">
        
        <!-- Search Input Bar -->
        <div class="search-header-row">
          <div class="search-input-wrapper">
            <i class="bi bi-search search-icon"></i>
            <input 
              type="text" 
              class="search-input" 
              placeholder="Rechercher un meuble (ex: Armoire, Étagère, Commode...)" 
              [(ngModel)]="searchQuery"
              (ngModelChange)="onSearchChange()"
              (keyup.enter)="triggerSearch()"
            />
            <button class="clear-btn" *ngIf="searchQuery()" (click)="clearSearch()">
              <i class="bi bi-x"></i>
            </button>
          </div>

          <!-- Mobile Filter Trigger Button -->
          <button class="filter-trigger-btn" (click)="toggleFilters(true)">
            <i class="bi bi-sliders"></i> <span>Filtres</span>
          </button>
        </div>

        <!-- Search Suggestions Overlay box -->
        <div class="search-suggestions-overlay" *ngIf="showSuggestions() && (history().length > 0 || suggestions().length > 0)">
          <!-- History -->
          <div class="overlay-section" *ngIf="history().length > 0 && !searchQuery()">
            <div class="section-hdr">
              <h5>Historique des recherches</h5>
              <button (click)="clearHistory()">Effacer</button>
            </div>
            <div class="chips-container">
              <span class="chip" *ngFor="let item of history()" (click)="selectSearch(item)">
                {{ item }} <i class="bi bi-arrow-up-left"></i>
              </span>
            </div>
          </div>

          <!-- Live Suggestions -->
          <div class="overlay-section" *ngIf="suggestions().length > 0">
            <h5>Suggestions</h5>
            <ul class="suggestion-list">
              <li *ngFor="let sug of suggestions()" [routerLink]="['/product', sug.id]" (click)="showSuggestions.set(false)">
                <i class="bi bi-search"></i> {{ sug.name }} <span>dans {{ sug.brand }}</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Active Filters pill tags row -->
        <div class="active-filters-tags" *ngIf="hasActiveFilters()">
          <span class="filter-pill" *ngIf="activeCategory()">
            Catégorie: {{ activeCategory() }} <i class="bi bi-x" (click)="resetFilter('category')"></i>
          </span>
          <span class="filter-pill" *ngIf="promoOnly()">
            Promo uniquement <i class="bi bi-x" (click)="resetFilter('promo')"></i>
          </span>
          <button class="clear-all-btn" (click)="resetAllFilters()">Tout réinitialiser</button>
        </div>

        <!-- Grid Header: Result count and Sort Selector -->
        <div class="grid-header-row">
          <span class="results-count">{{ products().length }} meubles trouvés</span>
          <div class="sort-wrapper">
            <label>Trier par :</label>
            <select class="sort-select" [(ngModel)]="sortBy" (ngModelChange)="loadProducts()">
              <option value="newest">Nouveautés</option>
              <option value="price_asc">Prix croissant</option>
              <option value="price_desc">Prix décroissant</option>
              <option value="popular">Mieux notés</option>
            </select>
          </div>
        </div>

        <!-- Products Grid (Responsive Grid standard) -->
        <div class="responsive-grid no-padding-sides" *ngIf="!loading()">
          <div class="product-card-grid" *ngFor="let prod of products()">
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

        <!-- Skeleton Loader -->
        <div class="responsive-grid no-padding-sides" *ngIf="loading()">
          <div class="skeleton-card" *ngFor="let i of [1, 2, 3, 4, 5, 6]">
            <div class="skeleton img-sk"></div>
            <div class="info-sk">
              <div class="skeleton line-sk brand-sk"></div>
              <div class="skeleton line-sk name-sk"></div>
              <div class="skeleton line-sk price-sk"></div>
            </div>
          </div>
        </div>

        <!-- No Results -->
        <div class="empty-state-card" *ngIf="!loading() && products().length === 0">
          <i class="bi bi-search-heart"></i>
          <h4>Aucun meuble ne correspond</h4>
          <p>Essayez de modifier vos critères ou de réinitialiser vos filtres.</p>
          <button class="btn-outline mt-1" (click)="resetAllFilters()">Réinitialiser les filtres</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .search-layout-container {
      display: flex;
      gap: 2rem;
      padding: 2rem 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    /* Left Sidebar Filters (Desktop layout static) */
    .filters-sidebar {
      width: 280px;
      flex-shrink: 0;
      background-color: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-sm);
      padding: 1.5rem;
      align-self: flex-start;
      position: sticky;
      top: 90px;
      height: calc(100vh - 120px);
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }

    .sidebar-hdr {
      margin-bottom: 1.2rem;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.6rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .sidebar-hdr h3 {
      font-size: 1rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .sidebar-hdr .close-btn {
      display: none; /* Desktop hides close button */
      background: none;
      border: none;
      font-size: 1.1rem;
      color: var(--text-primary);
      cursor: pointer;
    }

    .sidebar-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .filter-group h4 {
      font-size: 0.8rem;
      color: var(--text-secondary);
      margin-bottom: 0.6rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 700;
    }

    .pills-container {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
    }

    .pill-choice {
      padding: 0.35rem 0.75rem;
      background-color: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 4px;
      font-size: 0.78rem;
      cursor: pointer;
      font-weight: 600;
      transition: var(--transition-smooth);
    }

    .pill-choice.selected {
      background-color: var(--accent-color);
      color: var(--accent-text);
      border-color: var(--accent-color);
    }

    .price-inputs {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }

    .price-inputs input {
      flex: 1;
      border: 1px solid var(--border-color);
      background-color: var(--bg-primary);
      color: var(--text-primary);
      padding: 0.5rem 0.7rem;
      border-radius: 4px;
      font-size: 0.82rem;
      outline: none;
    }

    .price-inputs input:focus {
      border-color: var(--accent-color);
    }

    .price-inputs .dash {
      color: var(--text-muted);
    }

    .color-options {
      display: flex;
      flex-wrap: wrap;
      gap: 0.6rem;
    }

    .color-options button {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 1px solid rgba(0,0,0,0.1);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #FFFFFF;
      transition: var(--transition-smooth);
    }

    .color-options button.white-border {
      border: 1px solid var(--border-color);
      color: #000000;
    }

    .color-options button.active {
      transform: scale(1.15);
      box-shadow: 0 0 0 2px var(--accent-color);
    }

    .size-options {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.4rem;
    }

    .size-options button {
      border: 1px solid var(--border-color);
      background-color: var(--bg-primary);
      color: var(--text-primary);
      padding: 0.4rem 0;
      text-align: center;
      font-size: 0.8rem;
      font-weight: 600;
      border-radius: 4px;
      cursor: pointer;
      transition: var(--transition-smooth);
    }

    .size-options button.active {
      background-color: var(--accent-color);
      color: var(--accent-text);
      border-color: var(--accent-color);
    }

    .filter-toggle-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;
      border-top: 1px solid var(--border-color);
      margin-top: 0.5rem;
    }

    .filter-toggle-row label {
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
    }

    .filter-toggle-row input {
      width: 16px;
      height: 16px;
      accent-color: var(--accent-color);
      cursor: pointer;
    }

    .sidebar-ftr {
      margin-top: 1.5rem;
      border-top: 1px solid var(--border-color);
      padding-top: 1rem;
    }

    /* Right Search Section */
    .search-results-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      position: relative;
    }

    /* Search bar Header */
    .search-header-row {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .search-input-wrapper {
      flex: 1;
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-input {
      width: 100%;
      background-color: var(--bg-secondary);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      padding: 0.85rem 3rem;
      border-radius: var(--border-radius-sm);
      font-size: 0.95rem;
      outline: none;
      transition: var(--transition-smooth);
    }

    .search-input:focus {
      border-color: var(--accent-color);
      background-color: var(--bg-primary);
    }

    .search-icon {
      position: absolute;
      left: 16px;
      color: var(--text-secondary);
      font-size: 1.1rem;
    }

    .clear-btn {
      position: absolute;
      right: 16px;
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 1.4rem;
    }

    .filter-trigger-btn {
      display: none; /* Hidden on desktop */
      background-color: var(--bg-secondary);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      padding: 0 1.2rem;
      border-radius: var(--border-radius-sm);
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      font-size: 0.9rem;
      font-weight: 600;
    }

    /* Suggestions Overlay */
    .search-suggestions-overlay {
      position: absolute;
      top: 60px;
      left: 0;
      right: 0;
      background-color: var(--bg-primary);
      z-index: 100;
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-sm);
      box-shadow: var(--card-shadow);
      padding: 1.5rem;
    }

    .overlay-section {
      margin-bottom: 1.2rem;
    }

    .overlay-section h5 {
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-bottom: 0.6rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .section-hdr {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .section-hdr button {
      background: none;
      border: none;
      color: var(--gold-accent);
      font-size: 0.8rem;
      cursor: pointer;
    }

    .chips-container {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.4rem;
    }

    .chip {
      background-color: var(--bg-secondary);
      border: 1px solid var(--border-color);
      padding: 0.4rem 0.9rem;
      border-radius: var(--border-radius-lg);
      font-size: 0.8rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-weight: 500;
    }

    .chip i {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    .suggestion-list {
      list-style: none;
      padding: 0;
    }

    .suggestion-list li {
      padding: 0.65rem 0;
      border-bottom: 1px solid var(--border-color);
      font-size: 0.9rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.8rem;
      transition: var(--transition-smooth);
    }

    .suggestion-list li:hover {
      padding-left: 5px;
      color: var(--gold-accent);
    }

    .suggestion-list li span {
      font-size: 0.78rem;
      color: var(--text-muted);
    }

    /* Active filters tags row */
    .active-filters-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 1rem;
      align-items: center;
    }

    .filter-pill {
      background-color: var(--accent-light);
      color: var(--text-primary);
      border: 1px solid var(--border-color);
      font-size: 0.75rem;
      padding: 0.35rem 0.8rem;
      border-radius: 4px;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-weight: 600;
    }

    .filter-pill i {
      cursor: pointer;
      font-size: 0.9rem;
      color: var(--text-secondary);
      transition: var(--transition-smooth);
    }

    .filter-pill i:hover {
      color: var(--danger);
    }

    .clear-all-btn {
      background: none;
      border: none;
      color: var(--danger);
      font-size: 0.78rem;
      font-weight: 700;
      cursor: pointer;
      padding: 0.2rem 0.5rem;
    }

    /* Grid Header sorts */
    .grid-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 0.8rem;
      border-bottom: 1px solid var(--border-color);
      margin-bottom: 1rem;
    }

    .results-count {
      font-size: 0.88rem;
      color: var(--text-secondary);
      font-weight: 600;
    }

    .sort-wrapper {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
    }

    .sort-wrapper label {
      color: var(--text-secondary);
      font-weight: 500;
    }

    .sort-select {
      border: 1px solid var(--border-color);
      background-color: var(--bg-secondary);
      padding: 0.3rem 0.6rem;
      border-radius: 4px;
      font-size: 0.82rem;
      font-weight: 700;
      color: var(--text-primary);
      outline: none;
      cursor: pointer;
    }

    /* Skeletons */
    .skeleton-card {
      background-color: var(--bg-secondary);
      border-radius: var(--border-radius-sm);
      overflow: hidden;
      margin-bottom: 0.5rem;
      border: 1px solid var(--border-color);
    }

    .skeleton-card .img-sk {
      height: 320px;
      width: 100%;
    }

    .info-sk {
      padding: 1rem;
    }

    .line-sk {
      height: 10px;
      border-radius: 2px;
      margin-bottom: 0.5rem;
    }

    .brand-sk { width: 40%; }
    .name-sk { width: 70%; }
    .price-sk { width: 25%; }

    /* Empty state */
    .empty-state-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 6rem 2rem;
      text-align: center;
      background-color: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-sm);
    }

    .empty-state-card i {
      font-size: 3.5rem;
      color: var(--text-muted);
      margin-bottom: 1rem;
    }

    .empty-state-card h4 {
      font-size: 1.15rem;
      font-weight: 600;
      margin-bottom: 0.4rem;
    }

    .empty-state-card p {
      font-size: 0.9rem;
      color: var(--text-secondary);
      margin-bottom: 1.2rem;
    }

    /* Overwrites */
    .no-padding-sides {
      padding: 1rem 0 !important;
    }
    .mt-1 { margin-top: 0.5rem; }

    /* Product card overrides from Home to match premium styling */
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
      height: 320px;
      overflow: hidden;
      position: relative;
      cursor: pointer;
    }
    @media (max-width: 768px) {
      .image-wrapper {
        height: 200px;
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
    .fav-btn i.bi-heart-fill {
      color: var(--danger);
    }

    /* RESPONSIVE LAYOUT CONVERSION FOR SIDEBAR */
    @media (max-width: 1024px) {
      .filters-sidebar {
        position: fixed;
        top: 0;
        bottom: 0;
        left: 0;
        width: 300px;
        height: 100%;
        background-color: var(--bg-primary);
        z-index: 10001;
        transform: translateX(-100%);
        transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        border-radius: 0;
      }
      .filters-sidebar.open {
        transform: translateX(0);
      }
      .sidebar-hdr .close-btn {
        display: block; /* Show close button on mobile sheet */
      }
      .filter-trigger-btn {
        display: flex; /* Show toggle button on mobile header */
      }
    }
    
    @media (max-width: 768px) {
      .search-layout-container {
        padding: 1rem;
      }
    }
  `]
})
export class SearchComponent implements OnInit {
  productService = inject(ProductService);
  route = inject(ActivatedRoute);

  searchQuery = signal('');
  suggestions = signal<Product[]>([]);
  history = signal<string[]>([]);
  showSuggestions = signal(false);
  
  loading = signal(false);
  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  
  showFiltersDrawer = signal(false);
  
  // Filters local states
  selectedCategory = signal<string | null>(null);
  selectedPromo = false;
  minPrice?: number;
  maxPrice?: number;
  sortBy = 'newest';

  // Active filters strings (for tags)
  activeCategory = signal<string | null>(null);
  promoOnly = signal<boolean>(false);

  productImageUrl = productImageUrl;

  constructor() {
    // Listen to query parameters to auto-fill searches (e.g. from homepage category clicks)
    this.route.queryParams.subscribe(params => {
      if (params['category']) {
        this.selectedCategory.set(params['category']);
        this.activeCategory.set(params['category']);
      }
      if (params['onlyFavorites'] === 'true') {
        // Set up filters or load favorites logic
      }
      if (params['isPromo'] === 'true') {
        this.selectedPromo = true;
        this.promoOnly.set(true);
      }
      if (params['isPopular'] === 'true') {
        this.sortBy = 'popular';
      }
      this.loadProducts();
    });
  }

  ngOnInit() {
    this.loadHistory();
    this.loadCategories();
  }

  loadCategories() {
    this.productService.getCategories().subscribe(res => this.categories.set(res));
  }

  loadHistory() {
    const saved = localStorage.getItem('searchHistory');
    if (saved) {
      this.history.set(JSON.parse(saved));
    }
  }

  onSearchChange() {
    const q = this.searchQuery().trim();
    if (q.length > 1) {
      this.showSuggestions.set(true);
      this.productService.getProducts({ search: q }).subscribe(res => {
        this.suggestions.set(res.slice(0, 5));
      });
    } else {
      this.suggestions.set([]);
    }
  }

  triggerSearch() {
    const q = this.searchQuery().trim();
    if (q) {
      this.saveQueryToHistory(q);
      this.showSuggestions.set(false);
      this.loadProducts();
    }
  }

  selectSearch(q: string) {
    this.searchQuery.set(q);
    this.showSuggestions.set(false);
    this.loadProducts();
  }

  clearSearch() {
    this.searchQuery.set('');
    this.suggestions.set([]);
    this.loadProducts();
  }

  private saveQueryToHistory(q: string) {
    let list = this.history().filter(item => item !== q);
    list = [q, ...list].slice(0, 6);
    this.history.set(list);
    localStorage.setItem('searchHistory', JSON.stringify(list));
  }

  clearHistory() {
    this.history.set([]);
    localStorage.removeItem('searchHistory');
  }

  toggleFilters(open: boolean) {
    this.showFiltersDrawer.set(open);
  }

  hasActiveFilters(): boolean {
    return !!(this.activeCategory() || this.promoOnly());
  }

  applyFilters() {
    this.activeCategory.set(this.selectedCategory());
    this.promoOnly.set(this.selectedPromo);

    this.toggleFilters(false);
    this.loadProducts();
  }

  resetFilter(type: string) {
    if (type === 'category') { this.selectedCategory.set(null); this.activeCategory.set(null); }
    if (type === 'promo') { this.selectedPromo = false; this.promoOnly.set(false); }
    this.loadProducts();
  }

  resetAllFilters() {
    this.selectedCategory.set(null); this.activeCategory.set(null);
    this.selectedPromo = false;
    this.promoOnly.set(false);
    this.minPrice = undefined;
    this.maxPrice = undefined;
    this.searchQuery.set('');
    this.loadProducts();
  }

  loadProducts() {
    this.loading.set(true);
    
    // Check if only favorites flag is active
    const isOnlyFav = this.route.snapshot.queryParams['onlyFavorites'] === 'true';
    if (isOnlyFav) {
      // Load local favorites instead of HTTP query
      setTimeout(() => {
        this.products.set(this.productService.favorites());
        this.loading.set(false);
      }, 300);
      return;
    }

    const filterObj: any = {
      search: this.searchQuery().trim() || null,
      category: this.selectedCategory(),
      isPromo: this.selectedPromo ? 'true' : null,
      minPrice: this.minPrice,
      maxPrice: this.maxPrice,
      sortBy: this.sortBy
    };

    this.productService.getProducts(filterObj).subscribe({
      next: (res) => {
        this.products.set(res);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  isFav(id: number): boolean {
    return this.productService.isFavorite(id);
  }

  toggleFav(product: Product) {
    this.productService.toggleFavorite(product);
  }
}
