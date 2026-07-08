import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { ProductService, Product, Category, Color, Size } from '../../services/product.service';
import { MessageService } from '../../services/message.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="top-bar">
      <button routerLink="/profile" class="back-btn"><i class="bi bi-chevron-left"></i> Profil</button>
      <h1 class="logo-title">Administration</h1>
      <div></div>
    </div>

    <!-- Admin Sub-navigation Tabs -->
    <div class="admin-tabs">
      <button [class.active]="activeTab() === 'dashboard'" (click)="activeTab.set('dashboard')">
        <i class="bi bi-speedometer2"></i> Stats
      </button>
      <button [class.active]="activeTab() === 'products'" (click)="activeTab.set('products')">
        <i class="bi bi-box-seam"></i> Produits
      </button>
      <button [class.active]="activeTab() === 'orders'" (click)="activeTab.set('orders')">
        <i class="bi bi-receipt"></i> Ventes
      </button>
      <button [class.active]="activeTab() === 'coupons'" (click)="activeTab.set('coupons')">
        <i class="bi bi-tag"></i> Coupons
      </button>
    </div>

    <div class="admin-body">
      
      <!-- ================== TAB: STATS & DASHBOARD ================== -->
      <div *ngIf="activeTab() === 'dashboard'">
        <!-- Stats key cards grid -->
        <div class="stats-grid">
          <div class="stat-card">
            <span class="lbl">Chiffre d'affaires</span>
            <h3>{{ stats().totalRevenue | number:'1.2-2' }} FCFA</h3>
            <div class="icon-wrap color-rev"><i class="bi bi-currency-euro"></i></div>
          </div>
          <div class="stat-card">
            <span class="lbl">Commandes</span>
            <h3>{{ stats().totalOrders }}</h3>
            <div class="icon-wrap color-ord"><i class="bi bi-bag"></i></div>
          </div>
          <div class="stat-card">
            <span class="lbl">Vêtements vendus</span>
            <h3>{{ stats().totalProductsSold }}</h3>
            <div class="icon-wrap color-qty"><i class="bi bi-tag"></i></div>
          </div>
          <div class="stat-card">
            <span class="lbl">Clients inscrits</span>
            <h3>{{ stats().totalClients }}</h3>
            <div class="icon-wrap color-usr"><i class="bi bi-people"></i></div>
          </div>
          <div class="stat-card active-visitors-card">
            <span class="lbl">Visiteurs en ligne</span>
            <h3>{{ liveVisitorCount() }}</h3>
            <div class="icon-wrap color-online"><i class="bi bi-broadcast"></i></div>
          </div>
        </div>

        <!-- Recent New Users List -->
        <div class="admin-card" *ngIf="recentNewUsers().length > 0">
          <h3>Nouveaux clients (En direct)</h3>
          <div class="table-scroll">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>E-mail</th>
                  <th>Téléphone</th>
                  <th>Date d'inscription</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let u of recentNewUsers()">
                  <td><b>{{ u.name }}</b></td>
                  <td>{{ u.email }}</td>
                  <td>{{ u.phone || 'N/A' }}</td>
                  <td>{{ formatDate(u.createdAt) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Monthly Sales Native SVG Chart -->
        <div class="admin-card chart-card">
          <h3>Ventes par mois (Année courante)</h3>
          <div class="chart-wrapper" *ngIf="stats().salesByMonth?.length > 0; else noChartTpl">
            <!-- Simple, highly customized SVG bar chart -->
            <svg viewBox="0 0 500 200" class="svg-chart">
              <!-- Grid lines -->
              <line x1="40" y1="20" x2="480" y2="20" stroke="var(--border-color)" stroke-dasharray="4,4" />
              <line x1="40" y1="80" x2="480" y2="80" stroke="var(--border-color)" stroke-dasharray="4,4" />
              <line x1="40" y1="140" x2="480" y2="140" stroke="var(--border-color)" />
              
              <!-- Draw bars -->
              <g *ngFor="let bar of stats().salesByMonth; let i = index">
                <!-- Bar height calculations -->
                <rect 
                  [attr.x]="55 + i * 36" 
                  [attr.y]="140 - getBarHeight(bar.sales)" 
                  width="18" 
                  [attr.height]="getBarHeight(bar.sales)" 
                  fill="var(--gold-accent)" 
                  rx="3"
                />
                <!-- Label month -->
                <text 
                  [attr.x]="64 + i * 36" 
                  y="158" 
                  text-anchor="middle" 
                  font-size="8" 
                  fill="var(--text-secondary)">
                  {{ getMonthName(bar.month) }}
                </text>
                <!-- Sales value above bar -->
                <text 
                  [attr.x]="64 + i * 36" 
                  [attr.y]="134 - getBarHeight(bar.sales)" 
                  text-anchor="middle" 
                  font-size="7" 
                  font-weight="bold"
                  fill="var(--text-primary)">
                  {{ bar.sales | number:'1.0-0' }}FCFA
                </text>
              </g>
            </svg>
          </div>
          <ng-template #noChartTpl>
            <p class="no-data-msg">Pas encore de données de ventes pour générer le graphique.</p>
          </ng-template>
        </div>


      </div>

      <!-- ================== TAB: PRODUCTS CRUD ================== -->
      <div *ngIf="activeTab() === 'products'">
        <div class="action-header">
          <h3>Catalogue Produits ({{ products().length }})</h3>
          <div style="display: flex; gap: 0.5rem;">
            <button class="btn-outline add-btn" (click)="addCategory()">+ Nouvelle Catégorie</button>
            <button class="btn-premium add-btn" (click)="openProductModal()">+ Ajouter un produit</button>
          </div>
        </div>

        <div class="products-list-admin">
          <div class="admin-item-row" *ngFor="let prod of products()">
            <div class="row-thumbnail">
              <img [src]="'https://mon-vrai-backend.onrender.com' + (prod.images[0]?.imageUrl || '/uploads/zara_wool_coat.png')" [alt]="prod.name" />
            </div>
            <div class="row-info">
              <h4>{{ prod.name }}</h4>
              <p>{{ prod.brand }} - {{ prod.price }} FCFA - Stock: <b>{{ prod.stock }}</b></p>
            </div>
            <div class="row-actions">
              <button class="btn-icon edit-btn" (click)="openProductModal(prod)" title="Modifier"><i class="bi bi-pencil"></i></button>
              <button class="btn-icon delete-btn" (click)="deleteProduct(prod.id)" title="Supprimer"><i class="bi bi-trash"></i></button>
            </div>
          </div>
        </div>

        <!-- Product Editor Dialog overlay -->
        <div class="modal-overlay" *ngIf="showProductModal()" (click)="closeProductModal()"></div>
        <div class="modal-dialog" [class.open]="showProductModal()">
          <div class="modal-hdr">
            <h3>{{ editingProduct() ? 'Modifier le Produit' : 'Créer un Produit' }}</h3>
            <button (click)="closeProductModal()"><i class="bi bi-x-lg"></i></button>
          </div>
          
          <div class="modal-body">
            <div class="form-group">
              <label>Nom complet du produit *</label>
              <input type="text" class="input-premium" [(ngModel)]="prodForm.name" />
            </div>
            <div class="grid-inputs">
              <div class="form-group">
                <label>Prix (FCFA) *</label>
                <input type="number" class="input-premium" [(ngModel)]="prodForm.price" />
              </div>
              <div class="form-group">
                <label>Ancien prix (si promotion)</label>
                <input type="number" class="input-premium" [(ngModel)]="prodForm.oldPrice" />
              </div>
            </div>
            <div class="grid-inputs">
              <div class="form-group">
                <label>Catégorie *</label>
                <select class="input-premium" [(ngModel)]="prodForm.categoryId">
                  <option *ngFor="let cat of categories()" [value]="cat.id">{{ cat.name }}</option>
                </select>
              </div>
              <div class="form-group">
                <label>Stock global *</label>
                <input type="number" class="input-premium" [(ngModel)]="prodForm.stock" placeholder="Quantité totale" />
              </div>
            </div>
            <div class="form-group">
              <label>Description du produit</label>
              <textarea class="input-premium comment-box" [(ngModel)]="prodForm.description"></textarea>
            </div>

            <!-- Upload Multiple Files -->
            <div class="form-group">
              <label>Téléverser des photos (Plusieurs photos possibles)</label>
              <input type="file" multiple (change)="onFileSelect($event)" accept="image/*" class="mt-1" />
            </div>

            <!-- Les variantes (tailles, couleurs) ont été retirées -->

            <!-- Flags -->
            <div class="flags-row">
              <label><input type="checkbox" [(ngModel)]="prodForm.isPopular" /> Populaire (Tendance)</label>
              <label><input type="checkbox" [(ngModel)]="prodForm.isPromo" /> En Promotion</label>
            </div>
          </div>

          <div class="modal-ftr">
            <button class="btn-premium" (click)="saveProduct()">Enregistrer</button>
          </div>
        </div>
      </div>

      <!-- ================== TAB: ORDERS MONITORING ================== -->
      <div *ngIf="activeTab() === 'orders'">
        <div class="action-header">
          <h3>Commandes Clients</h3>
          <button class="btn-premium csv-btn" (click)="exportSales()"><i class="bi bi-file-earmark-spreadsheet"></i> Exporter CSV</button>
        </div>

        <div class="admin-orders-list">
          <div class="order-admin-card" *ngFor="let ord of orders()">
            <div class="card-line">
              <span><b>{{ ord.orderNumber }}</b> - {{ ord.user?.name }}</span>
              <span class="order-total-lbl">{{ ord.total }} FCFA</span>
            </div>
            <p class="meta-line">Client: {{ ord.user?.email }} | Tél: {{ ord.user?.phone }}</p>
            <p class="meta-line date">Date: {{ formatDate(ord.createdAt) }}</p>
            
            <!-- Items ordered in details -->
            <div class="order-items-detail-list">
              <span *ngFor="let sub of ord.items" class="sub-item-badge">
                {{ sub.product?.name }} ({{ sub.size?.name }}/{{ sub.color?.name }}) x{{ sub.quantity }}
              </span>
            </div>
            
            <div class="status-change-row">
              <label>Statut :</label>
              <select [value]="ord.status" (change)="updateOrderStatus(ord.id, $event)">
                <option value="pending">En attente</option>
                <option value="confirmed">Confirmée</option>
                <option value="preparing">Préparation</option>
                <option value="shipped">Expédiée</option>
                <option value="delivering">En livraison</option>
                <option value="delivered">Livrée</option>
                <option value="cancelled">Annulée</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- ================== TAB: COUPONS CRUD ================== -->
      <div *ngIf="activeTab() === 'coupons'">
        <div class="action-header">
          <h3>Gestion des Coupons</h3>
          <button class="btn-premium add-btn" (click)="openCouponModal()">+ Créer un Coupon</button>
        </div>

        <div class="coupons-list-admin">
          <div class="admin-item-row" *ngFor="let coup of coupons()">
            <div class="row-info">
              <h4>{{ coup.code }}</h4>
              <p>Type: <b>{{ coup.type }}</b> | Valeur: <b>{{ coup.value }}</b> | Min. Commande: {{ coup.minOrderValue }} FCFA</p>
              <span class="expires-date" *ngIf="coup.expiresAt">Expire le: {{ formatDate(coup.expiresAt) }}</span>
            </div>
            <div class="row-actions">
              <button class="btn-icon edit-btn" (click)="openCouponModal(coup)" title="Modifier"><i class="bi bi-pencil"></i></button>
              <button class="btn-icon delete-btn" (click)="deleteCoupon(coup.id)" title="Supprimer"><i class="bi bi-trash"></i></button>
            </div>
          </div>
        </div>

        <!-- Coupon Modal dialog -->
        <div class="modal-overlay" *ngIf="showCouponModal()" (click)="closeCouponModal()"></div>
        <div class="modal-dialog coupon-modal" [class.open]="showCouponModal()">
          <div class="modal-hdr">
            <h3>{{ editingCoupon() ? 'Modifier le Coupon' : 'Créer un Coupon' }}</h3>
            <button (click)="closeCouponModal()"><i class="bi bi-x-lg"></i></button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Code Promo (ex: REDUC30) *</label>
              <input type="text" class="input-premium" [(ngModel)]="couponForm.code" placeholder="Code unique" />
            </div>
            <div class="form-group">
              <label>Type de réduction *</label>
              <select class="input-premium" [(ngModel)]="couponForm.type">
                <option value="percent">Pourcentage (%)</option>
                <option value="fixed">Montant fixe (FCFA)</option>
                <option value="free_shipping">Livraison gratuite</option>
              </select>
            </div>
            <div class="grid-inputs">
              <div class="form-group">
                <label>Valeur *</label>
                <input type="number" class="input-premium" [(ngModel)]="couponForm.value" />
              </div>
              <div class="form-group">
                <label>Achat Minimum requis (FCFA)</label>
                <input type="number" class="input-premium" [(ngModel)]="couponForm.minOrderValue" />
              </div>
            </div>
            <div class="form-group">
              <label>Date d'expiration</label>
              <input type="date" class="input-premium" [(ngModel)]="couponForm.expiresAt" />
            </div>
            <div class="form-group">
              <label><input type="checkbox" [(ngModel)]="couponForm.isActive" /> Actif</label>
            </div>
          </div>
          <div class="modal-ftr">
            <button class="btn-premium" (click)="saveCoupon()">Enregistrer le Coupon</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .back-btn {
      background: none;
      border: none;
      color: var(--text-primary);
      font-size: 0.95rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-weight: 500;
    }
    .logo-title {
      font-size: 1.3rem !important;
      font-weight: 700;
    }

    /* Tabs */
    .admin-tabs {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      background-color: var(--bg-secondary);
      border-bottom: 1px solid var(--border-color);
    }
    .admin-tabs button {
      background: none;
      border: none;
      padding: 1rem 0.2rem;
      font-family: var(--font-display);
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      color: var(--text-secondary);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.3rem;
      transition: var(--transition-smooth);
    }
    .admin-tabs button.active {
      color: var(--gold-accent);
      border-bottom: 2px solid var(--gold-accent);
      background-color: rgba(197, 168, 128, 0.05);
    }

    .admin-body {
      padding: 1rem;
    }

    /* Key stats cards */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.8rem;
      margin-bottom: 1.2rem;
    }
    .stat-card {
      background-color: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-md);
      padding: 1rem;
      position: relative;
    }
    .stat-card .lbl {
      font-size: 0.75rem;
      color: var(--text-secondary);
      display: block;
      margin-bottom: 0.3rem;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }
    .stat-card h3 {
      font-size: 1.25rem;
      font-weight: 800;
    }
    .icon-wrap {
      position: absolute;
      right: 12px;
      bottom: 12px;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.85rem;
    }
    .color-rev { background-color: rgba(16, 185, 129, 0.15); color: var(--success); }
    .color-ord { background-color: rgba(0, 71, 171, 0.15); color: #0047AB; }
    .color-qty { background-color: rgba(197, 168, 128, 0.2); color: var(--gold-accent); }
    .color-usr { background-color: rgba(245, 158, 11, 0.15); color: var(--warning); }
    .color-online { background-color: rgba(255, 0, 0, 0.15); color: #FF0000; animation: pulse-dot 2s infinite; }

    @keyframes pulse-dot {
      0% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.1); opacity: 0.8; }
      100% { transform: scale(1); opacity: 1; }
    }

    .active-visitors-card {
      border: 1px solid rgba(255, 0, 0, 0.3) !important;
    }

    .admin-card {
      background-color: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-md);
      padding: 1.2rem;
      margin-bottom: 1rem;
    }
    .admin-card h3 {
      font-size: 0.9rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 1rem;
      color: var(--text-secondary);
    }

    /* Charts */
    .chart-wrapper {
      width: 100%;
      padding-top: 0.5rem;
    }
    .svg-chart {
      width: 100%;
      height: auto;
    }

    /* Admin Tables */
    .table-scroll {
      width: 100%;
      overflow-x: auto;
    }
    .admin-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
      text-align: left;
    }
    .admin-table th {
      font-weight: 700;
      color: var(--text-secondary);
      border-bottom: 1px solid var(--border-color);
      padding: 0.6rem 0.8rem;
    }
    .admin-table td {
      padding: 0.6rem 0.8rem;
      border-bottom: 1px solid var(--border-color);
    }

    /* Catalog admin CRUD list */
    .action-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.2rem;
    }
    .action-header h3 {
      font-size: 0.95rem;
      font-weight: 700;
    }
    .add-btn, .csv-btn {
      width: auto !important;
      font-size: 0.8rem !important;
      padding: 0.5rem 1rem !important;
    }
    .csv-btn {
      background-color: #10B981 !important; /* Green for CSV */
      color: #FFFFFF !important;
      gap: 0.4rem;
    }
    .admin-item-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      background-color: var(--bg-secondary);
      border: 1px solid var(--border-color);
      padding: 0.8rem;
      border-radius: var(--border-radius-md);
      margin-bottom: 0.6rem;
    }
    .row-thumbnail {
      width: 50px;
      height: 60px;
      border-radius: 4px;
      overflow: hidden;
    }
    .row-thumbnail img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .row-info {
      flex: 1;
    }
    .row-info h4 {
      font-size: 0.88rem;
      font-weight: 600;
    }
    .row-info p {
      font-size: 0.8rem;
      color: var(--text-secondary);
    }
    .row-actions {
      display: flex;
      gap: 0.4rem;
    }
    .btn-icon {
      width: 32px;
      height: 32px;
      border-radius: var(--border-radius-md);
      border: 1px solid var(--border-color);
      background-color: var(--bg-primary);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.85rem;
    }
    .edit-btn { color: var(--gold-accent); }
    .delete-btn { color: var(--danger); }

    /* Dialog modal overlays */
    .modal-overlay {
      position: fixed;
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(0,0,0,0.5);
      z-index: 1000;
    }
    .modal-dialog {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background-color: var(--bg-primary);
      border-top-left-radius: var(--border-radius-lg);
      border-top-right-radius: var(--border-radius-lg);
      z-index: 1001;
      padding: 1.5rem;
      max-height: 85vh;
      overflow-y: auto;
      transform: translateY(100%);
      transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .modal-dialog.open {
      transform: translateY(0);
    }
    .modal-hdr {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.8rem;
      margin-bottom: 1rem;
    }
    .modal-hdr h3 {
      font-size: 1.15rem;
      font-weight: 700;
    }
    .modal-hdr button {
      background: none;
      border: none;
      font-size: 1.1rem;
      color: var(--text-primary);
      cursor: pointer;
    }
    .modal-body {
      display: flex;
      flex-direction: column;
      gap: 0.8rem;
    }
    .form-group label {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-secondary);
      display: block;
      margin-bottom: 0.2rem;
    }
    .grid-inputs {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.8rem;
    }
    .comment-box {
      height: 60px;
      resize: none;
    }
    .flags-row {
      display: flex;
      gap: 1.5rem;
      padding: 0.5rem 0;
    }
    .flags-row label {
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-weight: 500;
      cursor: pointer;
    }
    .modal-ftr {
      margin-top: 1.5rem;
      border-top: 1px solid var(--border-color);
      padding-top: 1rem;
    }

    /* Variants list editor */
    .variants-matrix-container {
      background-color: var(--bg-secondary);
      border: 1px dashed var(--border-color);
      padding: 0.8rem;
      border-radius: var(--border-radius-md);
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .matrix-row {
      display: grid;
      grid-template-columns: 2fr 2fr 1.5fr 1fr;
      gap: 0.4rem;
      align-items: center;
    }
    .matrix-row select, .matrix-row input {
      border: 1px solid var(--border-color);
      padding: 0.4rem;
      font-size: 0.8rem;
      border-radius: 4px;
      background-color: var(--bg-primary);
      color: var(--text-primary);
      outline: none;
    }
    .matrix-row button {
      background: none;
      border: none;
      color: var(--danger);
      cursor: pointer;
      font-size: 0.95rem;
    }
    .add-variant-btn {
      padding: 0.4rem !important;
      font-size: 0.75rem !important;
      border-radius: 4px;
    }

    /* Orders tab admin */
    .admin-orders-list {
      display: flex;
      flex-direction: column;
      gap: 0.8rem;
    }
    .order-admin-card {
      background-color: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-md);
      padding: 1rem;
    }
    .order-admin-card .card-line {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.9rem;
      margin-bottom: 0.2rem;
    }
    .order-total-lbl {
      font-weight: 800;
      font-size: 1.05rem;
    }
    .meta-line {
      font-size: 0.78rem;
      color: var(--text-secondary);
    }
    .meta-line.date {
      color: var(--text-muted);
      margin-bottom: 0.5rem;
    }
    .order-items-detail-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      margin-bottom: 0.8rem;
      border-bottom: 1px dashed var(--border-color);
      padding-bottom: 0.6rem;
    }
    .sub-item-badge {
      background-color: var(--bg-primary);
      border: 1px solid var(--border-color);
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      color: var(--text-secondary);
    }
    .status-change-row {
      display: flex;
      align-items: center;
      gap: 0.8rem;
      font-size: 0.85rem;
    }
    .status-change-row select {
      border: 1px solid var(--border-color);
      padding: 0.3rem 0.6rem;
      border-radius: 4px;
      background-color: var(--bg-primary);
      color: var(--text-primary);
      font-weight: 600;
      outline: none;
    }

    /* Coupons admin */
    .coupons-list-admin {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }
    .expires-date {
      font-size: 0.75rem;
      color: var(--danger);
      font-weight: 500;
    }
    .no-data-msg {
      font-size: 0.85rem;
      color: var(--text-muted);
      text-align: center;
      padding: 2rem 0;
    }
    .mt-1 { margin-top: 0.5rem; }
  `]
})
export class AdminComponent implements OnInit {
  adminService = inject(AdminService);
  productService = inject(ProductService);
  messageService = inject(MessageService);
  notificationService = inject(NotificationService);
  router = inject(Router);

  liveVisitorCount = signal<number>(0);
  recentNewUsers = signal<any[]>([]);

  activeTab = signal<'dashboard' | 'products' | 'orders' | 'coupons'>('dashboard');
  
  stats = signal<any>({});
  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  orders = signal<any[]>([]);
  coupons = signal<any[]>([]);

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR');
  }

  addCategory() {
    const name = prompt("Entrez le nom de la nouvelle catégorie :");
    if (name) {
      this.productService.createCategory({ name }).subscribe(cat => {
        this.categories.update(cats => [...cats, cat]);
        alert("Catégorie ajoutée avec succès !");
      });
    }
  }

  // Modals visibility
  showProductModal = signal(false);
  editingProduct = signal<Product | null>(null);
  showCouponModal = signal(false);
  editingCoupon = signal<any | null>(null);

  // Colors & sizes metadata
  colors: Color[] = [
    { id: 1, name: 'Noir', hexCode: '#111111' },
    { id: 2, name: 'Blanc', hexCode: '#FFFFFF' },
    { id: 3, name: 'Rouge', hexCode: '#E50914' },
    { id: 4, name: 'Bleu', hexCode: '#0047AB' },
    { id: 5, name: 'Vert', hexCode: '#10B981' },
    { id: 6, name: 'Beige', hexCode: '#F5F5DC' }
  ];
  sizes: Size[] = [
    { id: 1, name: 'XS' },
    { id: 2, name: 'S' },
    { id: 3, name: 'M' },
    { id: 4, name: 'L' },
    { id: 5, name: 'XL' },
    { id: 6, name: 'XXL' },
    { id: 7, name: 'XXXL' }
  ];

  // Forms states
  prodForm = {
    name: '',
    price: 0,
    oldPrice: null as number | null,
    brand: '',
    categoryId: 1,
    description: '',
    isPopular: false,
    isPromo: false,
    stock: 0
  };

  couponForm = {
    code: '',
    type: 'percent',
    value: 0,
    minOrderValue: 0,
    expiresAt: '',
    isActive: true
  };

  selectedFiles: File[] = [];

  constructor() {}

  ngOnInit() {
    this.loadDashboardData();

    // Ecouter le nombre de visiteurs
    this.messageService.onVisitorCountUpdate().subscribe((count) => {
      this.liveVisitorCount.set(count);
    });

    // Ecouter les notifications d'inscription
    this.messageService.onAdminNotification().subscribe((notif: any) => {
      // Afficher un toast
      this.notificationService.show(notif);
      
      // Si c'est une nouvelle inscription, on l'ajoute à la liste des récents
      if (notif.title === 'Nouveau client inscrit !' && notif.user) {
        this.recentNewUsers.update(users => [notif.user, ...users].slice(0, 5)); // Keep only 5 most recent
      }
    });
  }

  loadDashboardData() {
    this.adminService.getStats().subscribe(res => this.stats.set(res));
    this.productService.getProducts().subscribe(res => this.products.set(res));
    this.productService.getCategories().subscribe(res => this.categories.set(res));
    this.adminService.getOrders().subscribe(res => this.orders.set(res));
    this.adminService.getCoupons().subscribe(res => this.coupons.set(res));
  }

  // --- CHART HELPERS ---
  getBarHeight(sales: string | number): number {
    const val = parseFloat(sales as string);
    if (!val) return 0;
    // Map max sales to max height of 100px
    const maxVal = Math.max(...this.stats().salesByMonth.map((b: any) => parseFloat(b.sales)), 1);
    return (val / maxVal) * 100;
  }

  getMonthName(mNum: number): string {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    return months[mNum - 1] || mNum.toString();
  }

  // --- PRODUCTS CRUD ---
  openProductModal(product: Product | null = null) {
    if (product) {
      this.editingProduct.set(product);
      this.prodForm = {
        name: product.name,
        price: parseFloat(product.price as any),
        oldPrice: product.oldPrice ? parseFloat(product.oldPrice as any) : null,
        brand: product.brand || '',
        categoryId: product.categoryId,
        description: product.description || '',
        isPopular: product.isPopular,
        isPromo: product.isPromo,
        stock: product.stock || 0
      };
    } else {
      this.editingProduct.set(null);
      this.prodForm = {
        name: '',
        price: 0,
        oldPrice: null,
        brand: '',
        categoryId: this.categories()[0]?.id || 1,
        description: '',
        isPopular: false,
        isPromo: false,
        stock: 0
      };
    }
    this.selectedFiles = [];
    this.showProductModal.set(true);
  }

  closeProductModal() {
    this.showProductModal.set(false);
  }

  // remove variants functions

  onFileSelect(event: any) {
    if (event.target.files) {
      this.selectedFiles = Array.from(event.target.files);
    }
  }

  saveProduct() {
    if (!this.prodForm.name.trim() || !this.prodForm.price) {
      alert('Veuillez saisir au moins le nom et le prix.');
      return;
    }

    const formData = new FormData();
    formData.append('name', this.prodForm.name);
    formData.append('price', this.prodForm.price.toString());
    if (this.prodForm.oldPrice) formData.append('oldPrice', this.prodForm.oldPrice.toString());
    formData.append('brand', this.prodForm.brand);
    formData.append('categoryId', this.prodForm.categoryId.toString());
    formData.append('description', this.prodForm.description);
    formData.append('isPopular', this.prodForm.isPopular.toString());
    formData.append('isPromo', this.prodForm.isPromo.toString());
    formData.append('stock', this.prodForm.stock.toString());

    this.selectedFiles.forEach(file => {
      formData.append('images', file, file.name);
    });

    const obs = this.editingProduct() 
      ? this.adminService.updateProduct(this.editingProduct()!.id, formData)
      : this.adminService.createProduct(formData);

    obs.subscribe({
      next: () => {
        this.closeProductModal();
        this.loadDashboardData();
        alert('Produit enregistré avec succès !');
      },
      error: (err) => alert(err.error?.message || 'Erreur d\'enregistrement.')
    });
  }

  deleteProduct(id: number) {
    if (confirm('Voulez-vous vraiment supprimer ce produit ?')) {
      this.adminService.deleteProduct(id).subscribe({
        next: () => {
          this.loadDashboardData();
          alert('Produit supprimé.');
        }
      });
    }
  }

  // --- ORDERS ---
  updateOrderStatus(orderId: number, event: any) {
    const select = event.target as HTMLSelectElement;
    this.adminService.updateOrderStatus(orderId, select.value).subscribe({
      next: () => {
        this.loadDashboardData();
        alert('Statut mis à jour et client notifié !');
      }
    });
  }

  exportSales() {
    this.adminService.exportSalesCSV();
  }

  // --- COUPONS ---
  openCouponModal(coupon: any | null = null) {
    if (coupon) {
      this.editingCoupon.set(coupon);
      this.couponForm = {
        code: coupon.code,
        type: coupon.type,
        value: parseFloat(coupon.value),
        minOrderValue: parseFloat(coupon.minOrderValue),
        expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().split('T')[0] : '',
        isActive: coupon.isActive
      };
    } else {
      this.editingCoupon.set(null);
      this.couponForm = {
        code: '',
        type: 'percent',
        value: 10,
        minOrderValue: 30,
        expiresAt: '',
        isActive: true
      };
    }
    this.showCouponModal.set(true);
  }

  closeCouponModal() {
    this.showCouponModal.set(false);
  }

  saveCoupon() {
    if (!this.couponForm.code.trim() || !this.couponForm.value) {
      alert('Veuillez saisir le code et la valeur de la réduction.');
      return;
    }

    const obs = this.editingCoupon()
      ? this.adminService.updateCoupon(this.editingCoupon()!.id, this.couponForm)
      : this.adminService.createCoupon(this.couponForm);

    obs.subscribe({
      next: () => {
        this.closeCouponModal();
        this.loadDashboardData();
        alert('Coupon enregistré !');
      },
      error: (err) => alert(err.error?.message || 'Erreur d\'enregistrement.')
    });
  }

  deleteCoupon(id: number) {
    if (confirm('Supprimer ce code promo ?')) {
      this.adminService.deleteCoupon(id).subscribe({
        next: () => {
          this.loadDashboardData();
          alert('Coupon supprimé.');
        }
      });
    }
  }
}
