import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService, UserProfile } from '../../services/auth.service';
import { OrderService, Order } from '../../services/order.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="top-bar">
      <h1 class="logo-title">Mon Espace Client</h1>
      <button class="logout-btn" *ngIf="isLoggedIn()" (click)="logout()">
        <i class="bi bi-box-arrow-right"></i> Déconnexion
      </button>
    </div>

    <!-- 1. NOT LOGGED IN: Auth screen (Split layout, Nike / ASOS style) -->
    <div class="auth-wrapper" *ngIf="!isLoggedIn()">
      <div class="auth-container">
        <!-- Tabs Switcher -->
        <div class="auth-tabs">
          <button [class.active]="authTab() === 'login'" (click)="authTab.set('login')">Se connecter</button>
          <button [class.active]="authTab() === 'register'" (click)="authTab.set('register')">S'inscrire</button>
        </div>

        <!-- Login Form -->
        <form class="auth-form" *ngIf="authTab() === 'login'" (submit)="login()">
          <div class="form-group">
            <label>Adresse e-mail</label>
            <input type="email" class="input-premium" [(ngModel)]="loginEmail" name="email" placeholder="client@ecom.com" required />
          </div>
          <div class="form-group">
            <label>Mot de passe</label>
            <input type="password" class="input-premium" [(ngModel)]="loginPassword" name="password" placeholder="••••••••" required />
          </div>
          <button type="submit" class="btn-premium mt-1" [disabled]="submitting()">Connexion</button>
        </form>

        <!-- Register Form -->
        <form class="auth-form" *ngIf="authTab() === 'register'" (submit)="register()">
          <div class="form-group">
            <label>Nom complet *</label>
            <input type="text" class="input-premium" [(ngModel)]="regName" name="name" placeholder="Jean Dupont" required />
          </div>
          <div class="form-group">
            <label>Adresse e-mail *</label>
            <input type="email" class="input-premium" [(ngModel)]="regEmail" name="email" placeholder="jean.dupont@exemple.com" required />
          </div>
          <div class="form-group">
            <label>Téléphone *</label>
            <input type="tel" class="input-premium" [(ngModel)]="regPhone" name="phone" placeholder="+242 06 888 88 88" required />
          </div>
          <div class="form-group">
            <label>Mot de passe *</label>
            <input type="password" class="input-premium" [(ngModel)]="regPassword" name="password" placeholder="Minimum 6 caractères" required />
          </div>
          <button type="submit" class="btn-premium mt-1" [disabled]="submitting()">Créer mon compte</button>
        </form>

        <!-- Social Logins -->
        <div class="social-divider">
          <span>Ou continuer avec</span>
        </div>
        <div class="social-buttons">
          <button class="btn-social google" (click)="socialLogin('Google')">
            <i class="bi bi-google"></i> Google
          </button>
          <button class="btn-social apple" (click)="socialLogin('Apple')">
            <i class="bi bi-apple"></i> Apple
          </button>
        </div>

        <!-- Delivery Person Registration Link -->
        <div class="delivery-registration-section">
          <p class="delivery-text">Vous êtes livreur ?</p>
          <button class="btn-premium btn-delivery-registration" routerLink="/delivery-login">
            <i class="bi bi-truck"></i> Créer un compte livreur
          </button>
        </div>
      </div>
    </div>

    <!-- 2. LOGGED IN: Profile dashboard structure -->
    <div class="profile-layout-container" *ngIf="isLoggedIn()">
      
      <!-- Left Dashboard Sidebar -->
      <aside class="profile-sidebar">
        <!-- User header card -->
        <div class="user-summary-card">
          <div class="avatar">{{ getInitials(user()!.name) }}</div>
          <div class="user-meta">
            <h2>{{ user()!.name }}</h2>
            <p>{{ user()!.email }}</p>
            <span class="role-badge" *ngIf="user()!.role === 'admin'">Admin</span>
          </div>
        </div>

        <!-- Sidebar Navigation items -->
        <nav class="sidebar-menu-links">
          <button [class.active]="activeTab() === 'orders'" (click)="activeTab.set('orders')">
            <i class="bi bi-bag"></i> Historique des commandes
          </button>
          <button [class.active]="activeTab() === 'addresses'" (click)="activeTab.set('addresses')">
            <i class="bi bi-geo-alt"></i> Adresses de livraison
          </button>
          <button [class.active]="activeTab() === 'account'" (click)="activeTab.set('account')">
            <i class="bi bi-person-gear"></i> Informations du profil
          </button>
          <button class="admin-link-btn" *ngIf="isAdmin()" routerLink="/admin">
            <i class="bi bi-shield-lock"></i> Administration E-shop
          </button>
        </nav>
      </aside>

      <!-- Right Active Panel -->
      <section class="profile-content-panel">
        
        <!-- Tab: Orders List -->
        <div *ngIf="activeTab() === 'orders'">
          <div class="panel-header">
            <h3>Historique de mes commandes ({{ orders().length }})</h3>
          </div>
          <div class="order-history-list" *ngIf="orders().length > 0; else noOrdersTpl">
            <div class="order-row" *ngFor="let ord of orders()">
              <div class="order-row-info">
                <h4>{{ ord.orderNumber }}</h4>
                <span class="order-date">Date: {{ formatDate(ord.createdAt) }}</span>
                <span class="status-lbl" [class]="ord.status">{{ getStatusLabel(ord.status) }}</span>
              </div>
              <div class="order-row-actions">
                <span class="order-price">{{ ord.total }} €</span>
                <div class="action-btn-row">
                  <button class="btn-action shadow-sm" [routerLink]="['/order-tracking', ord.id]">Suivre le colis</button>
                  <button class="btn-action pdf shadow-sm" (click)="downloadInvoice(ord)" title="Facture PDF">
                    <i class="bi bi-file-earmark-pdf"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <ng-template #noOrdersTpl>
            <div class="empty-tab-state">
              <i class="bi bi-bag-x"></i>
              <p>Vous n'avez pas encore passé de commande.</p>
              <button class="btn-premium search-btn-empty" routerLink="/search">Visiter la boutique</button>
            </div>
          </ng-template>
        </div>

        <!-- Tab: Addresses Manager -->
        <div *ngIf="activeTab() === 'addresses'">
          <div class="panel-header">
            <h3>Mes adresses enregistrées ({{ user()!.addresses?.length || 0 }})</h3>
          </div>
          
          <div class="addresses-grid">
            <div class="address-card" *ngFor="let addr of user()!.addresses; let idx = index">
              <div class="addr-header">
                <h4>{{ addr.label || 'Adresse' }}</h4>
                <button class="delete-addr-btn" (click)="deleteAddress(idx)"><i class="bi bi-x-lg"></i></button>
              </div>
              <p><b>Destinataire :</b> {{ addr.name }}</p>
              <p><b>Téléphone :</b> {{ addr.phone }}</p>
              <p><b>Rue :</b> {{ addr.street }}</p>
              <p><b>Ville :</b> {{ addr.city }}, {{ addr.country }}</p>
            </div>
          </div>

          <!-- Add Address Block Form -->
          <div class="add-addr-card" *ngIf="showAddAddrForm(); else newAddrBtnTpl">
            <h4>Enregistrer une nouvelle adresse</h4>
            <div class="form-group mt-1">
              <label>Nom de l'adresse (ex: Bureau, Domicile)</label>
              <input type="text" class="input-premium" [(ngModel)]="newLabel" placeholder="Domicile" />
            </div>
            <div class="form-group">
              <label>Rue / Numéro de porte</label>
              <input type="text" class="input-premium" [(ngModel)]="newStreet" placeholder="ex: 12 Rue Marien Ngouabi" />
            </div>
            <div class="form-group">
              <label>Ville</label>
              <input type="text" class="input-premium" [(ngModel)]="newCity" placeholder="ex: Brazzaville" />
            </div>
            <div class="add-addr-actions">
              <button class="btn-premium save-addr-btn" (click)="saveAddress()">Enregistrer</button>
              <button class="btn-outline cancel-addr-btn" (click)="showAddAddrForm.set(false)">Annuler</button>
            </div>
          </div>
          <ng-template #newAddrBtnTpl>
            <button class="btn-outline add-addr-trigger-btn" (click)="showAddAddrForm.set(true)">
              + Ajouter une adresse de livraison
            </button>
          </ng-template>
        </div>

        <!-- Tab: Account Details info view -->
        <div *ngIf="activeTab() === 'account'">
          <div class="panel-header">
            <h3>Informations personnelles</h3>
          </div>
          <div class="account-details-form">
            <div class="form-group">
              <label>Nom complet</label>
              <input type="text" class="input-premium" [value]="user()!.name" disabled />
            </div>
            <div class="form-group">
              <label>Adresse e-mail</label>
              <input type="email" class="input-premium" [value]="user()!.email" disabled />
            </div>
            <div class="form-group">
              <label>Téléphone de contact</label>
              <input type="tel" class="input-premium" [value]="user()!.phone || 'Non renseigné'" disabled />
            </div>
          </div>
        </div>
      </section>
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
    .logo-title {
      font-size: 1.4rem !important;
      font-weight: 700;
    }
    .logout-btn {
      background: none;
      border: none;
      color: var(--danger);
      font-size: 0.85rem;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.3rem;
    }

    /* Auth Wrapper centered */
    .auth-wrapper {
      padding: 4rem 1rem;
      max-width: 450px;
      margin: 0 auto;
    }
    .auth-container {
      background-color: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-sm);
      padding: 2rem;
    }
    .auth-tabs {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      border-bottom: 2px solid var(--border-color);
      margin-bottom: 1.5rem;
    }
    .auth-tabs button {
      background: none;
      border: none;
      padding: 0.8rem 0;
      font-family: var(--font-display);
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      color: var(--text-muted);
      transition: var(--transition-smooth);
    }
    .auth-tabs button.active {
      color: var(--text-primary);
      border-bottom: 2px solid var(--accent-color);
    }
    .auth-form .form-group {
      margin-bottom: 1rem;
    }
    .auth-form label {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-secondary);
      display: block;
      margin-bottom: 0.3rem;
    }
    .auth-form input {
      border-radius: 4px !important;
    }
    .social-divider {
      text-align: center;
      margin: 1.5rem 0 1rem 0;
      position: relative;
    }
    .social-divider::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      width: 100%;
      height: 1px;
      background-color: var(--border-color);
      z-index: 1;
    }
    .social-divider span {
      background-color: var(--bg-secondary);
      padding: 0 0.8rem;
      font-size: 0.78rem;
      color: var(--text-muted);
      position: relative;
      z-index: 2;
    }
    .social-buttons {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.8rem;
    }
    .btn-social {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem;
      border-radius: 4px;
      font-family: var(--font-display);
      font-size: 0.85rem;
      font-weight: 600;
      border: 1px solid var(--border-color);
      cursor: pointer;
      background-color: var(--bg-primary);
      color: var(--text-primary);
      transition: var(--transition-smooth);
    }

    /* Delivery Registration Section */
    .delivery-registration-section {
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border-color);
      text-align: center;
    }
    .delivery-text {
      font-size: 0.85rem;
      color: var(--text-secondary);
      margin-bottom: 0.8rem;
    }
    .btn-delivery-registration {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }
    .btn-delivery-registration i {
      font-size: 1.1rem;
    }

    /* Widescreen dashboard layout grid */
    .profile-layout-container {
      display: grid;
      grid-template-columns: 300px 1fr;
      gap: 3rem;
      padding: 2rem 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    /* Left Sidebar */
    .profile-sidebar {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .user-summary-card {
      background-color: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-sm);
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .avatar {
      width: 55px;
      height: 55px;
      border-radius: 50%;
      background-color: var(--gold-accent);
      color: #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-display);
      font-size: 1.4rem;
      font-weight: 700;
    }
    .user-meta h2 {
      font-size: 1.05rem;
      font-weight: 700;
    }
    .user-meta p {
      font-size: 0.8rem;
      color: var(--text-secondary);
    }
    .role-badge {
      font-size: 0.65rem;
      font-weight: 700;
      background-color: var(--accent-color);
      color: var(--accent-text);
      padding: 0.15rem 0.4rem;
      border-radius: 3px;
      text-transform: uppercase;
      display: inline-block;
      margin-top: 0.3rem;
    }

    .sidebar-menu-links {
      display: flex;
      flex-direction: column;
      border: 1px solid var(--border-color);
      background-color: var(--bg-secondary);
      border-radius: var(--border-radius-sm);
      overflow: hidden;
    }
    .sidebar-menu-links button {
      background: none;
      border: none;
      padding: 0.95rem 1.2rem;
      text-align: left;
      font-size: 0.88rem;
      font-weight: 600;
      color: var(--text-secondary);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      transition: var(--transition-smooth);
      border-bottom: 1px solid var(--border-color);
    }
    .sidebar-menu-links button:last-child {
      border-bottom: none;
    }
    .sidebar-menu-links button:hover {
      background-color: var(--accent-light);
      color: var(--text-primary);
    }
    .sidebar-menu-links button.active {
      background-color: var(--accent-color);
      color: var(--accent-text);
    }
    .admin-link-btn {
      color: var(--gold-accent) !important;
    }
    .admin-link-btn:hover {
      background-color: rgba(197, 168, 128, 0.1) !important;
    }

    /* Right Active Panel */
    .profile-content-panel {
      flex: 1;
    }
    .panel-header {
      margin-bottom: 1.5rem;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.8rem;
    }
    .panel-header h3 {
      font-size: 1.15rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    /* Orders History */
    .order-history-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .order-row {
      background-color: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-sm);
      padding: 1.2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .order-row-info h4 {
      font-size: 1rem;
      font-weight: 700;
    }
    .order-date {
      font-size: 0.8rem;
      color: var(--text-secondary);
      display: block;
      margin-bottom: 0.3rem;
    }
    .status-lbl {
      font-size: 0.65rem;
      font-weight: 700;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      text-transform: uppercase;
      display: inline-block;
    }
    .status-lbl.pending { background-color: rgba(245, 158, 11, 0.1); color: var(--warning); }
    .status-lbl.confirmed { background-color: rgba(0, 71, 171, 0.1); color: #0047AB; }
    .status-lbl.preparing { background-color: rgba(197, 168, 128, 0.15); color: var(--gold-accent); }
    .status-lbl.shipped { background-color: rgba(16, 185, 129, 0.1); color: var(--success); }
    .status-lbl.delivering { background-color: rgba(16, 185, 129, 0.1); color: var(--success); }
    .status-lbl.delivered { background-color: rgba(16, 185, 129, 0.1); color: var(--success); }
    .status-lbl.cancelled { background-color: rgba(239, 68, 68, 0.1); color: var(--danger); }

    .order-row-actions {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.5rem;
    }
    .order-price {
      font-size: 1.05rem;
      font-weight: 800;
    }
    .action-btn-row {
      display: flex;
      gap: 0.5rem;
    }
    .btn-action {
      border: 1px solid var(--border-color);
      background-color: var(--bg-primary);
      padding: 0.4rem 0.8rem;
      font-size: 0.8rem;
      font-weight: 600;
      border-radius: 4px;
      cursor: pointer;
      transition: var(--transition-smooth);
    }
    .btn-action:hover {
      background-color: var(--accent-color);
      color: var(--accent-text);
      border-color: var(--accent-color);
    }
    .btn-action.pdf {
      padding: 0.4rem 0.6rem;
      color: var(--danger);
      font-size: 0.9rem;
    }
    .btn-action.pdf:hover {
      background-color: var(--danger);
      color: #FFFFFF;
      border-color: var(--danger);
    }

    .empty-tab-state {
      text-align: center;
      padding: 4rem 1rem;
      background-color: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-sm);
    }
    .empty-tab-state i {
      font-size: 3rem;
      color: var(--text-muted);
      margin-bottom: 0.8rem;
      display: block;
    }
    .search-btn-empty {
      width: auto !important;
      font-size: 0.8rem !important;
      margin-top: 1rem;
    }

    /* Addresses manager */
    .addresses-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .address-card {
      background-color: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-sm);
      padding: 1.2rem;
      position: relative;
    }
    .address-card p {
      font-size: 0.82rem;
      color: var(--text-secondary);
      margin-bottom: 0.2rem;
    }
    .add-addr-card {
      background-color: var(--bg-secondary);
      border: 1px dashed var(--border-color);
      border-radius: var(--border-radius-sm);
      padding: 1.5rem;
    }
    .add-addr-card h4 {
      font-size: 0.9rem;
      font-weight: 700;
      margin-bottom: 0.8rem;
    }
    .add-addr-card input {
      border-radius: 4px !important;
      margin-bottom: 0.8rem;
    }
    .add-addr-actions {
      display: flex;
      gap: 0.6rem;
      margin-top: 0.5rem;
    }
    .save-addr-btn, .cancel-addr-btn {
      width: auto !important;
      padding: 0.5rem 1.2rem !important;
      font-size: 0.8rem !important;
      border-radius: 4px !important;
    }
    .add-addr-trigger-btn {
      width: 100%;
      padding: 0.8rem;
      font-size: 0.85rem;
      border-radius: 4px;
    }

    /* Personal info details form styling */
    .account-details-form {
      max-width: 500px;
      background-color: var(--bg-secondary);
      border: 1px solid var(--border-color);
      padding: 1.5rem;
      border-radius: var(--border-radius-sm);
    }
    .account-details-form input {
      border-radius: 4px !important;
    }

    /* RESPONSIVE CONVERSION */
    @media (max-width: 1024px) {
      .profile-layout-container {
        grid-template-columns: 1fr;
        gap: 2rem;
      }
      .addresses-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ProfileComponent implements OnInit {
  auth = inject(AuthService);
  orderService = inject(OrderService);
  router = inject(Router);

  authTab = signal<'login' | 'register'>('login');
  activeTab = signal<'orders' | 'addresses' | 'account'>('orders');
  
  isLoggedIn = this.auth.isLoggedIn;
  isAdmin = this.auth.isAdmin;
  user = this.auth.currentUser;
  
  orders = signal<Order[]>([]);

  // View folds
  showAddresses = signal(true);
  showOrders = signal(true);
  showAddAddrForm = signal(false);

  // Forms inputs
  submitting = signal(false);
  loginEmail = '';
  loginPassword = '';

  regName = '';
  regEmail = '';
  regPhone = '';
  regPassword = '';

  // New address inputs
  newLabel = '';
  newStreet = '';
  newCity = '';

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR');
  }

  constructor() {}

  ngOnInit() {
    if (this.isLoggedIn()) {
      this.loadOrderHistory();
    }
  }

  login() {
    this.submitting.set(true);
    this.auth.login({ email: this.loginEmail, password: this.loginPassword }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.loadOrderHistory();
        alert('Heureux de vous revoir !');
      },
      error: (err) => {
        this.submitting.set(false);
        alert(err.error?.message || 'Identifiants invalides.');
      }
    });
  }

  register() {
    this.submitting.set(true);
    const body = {
      name: this.regName,
      email: this.regEmail,
      phone: this.regPhone,
      password: this.regPassword
    };

    this.auth.register(body).subscribe({
      next: () => {
        this.submitting.set(false);
        this.loadOrderHistory();
        alert('Compte créé avec succès !');
      },
      error: (err) => {
        this.submitting.set(false);
        alert(err.error?.message || 'Erreur lors de la création du compte.');
      }
    });
  }

  socialLogin(platform: string) {
    // Mock login
    alert(`Simulation de connexion sécurisée avec ${platform}...`);
  }

  logout() {
    this.auth.logout();
    this.orders.set([]);
  }

  loadOrderHistory() {
    this.orderService.getOrders().subscribe({
      next: (res) => this.orders.set(res),
      error: (err) => console.error(err)
    });
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  }

  getStatusLabel(status: string): string {
    const labels: any = {
      pending: 'En attente',
      confirmed: 'Confirmée',
      preparing: 'Préparation',
      shipped: 'Expédiée',
      delivering: 'Livraison',
      delivered: 'Livrée',
      cancelled: 'Annulée'
    };
    return labels[status] || status;
  }

  saveAddress() {
    const userObj = this.user();
    if (!userObj) return;

    if (!this.newStreet.trim() || !this.newCity.trim()) {
      alert('Veuillez remplir la rue et la ville.');
      return;
    }

    const currentAddresses = userObj.addresses ? [...userObj.addresses] : [];
    currentAddresses.push({
      label: this.newLabel.trim() || 'Adresse',
      name: userObj.name,
      phone: userObj.phone || '',
      street: this.newStreet.trim(),
      city: this.newCity.trim(),
      country: 'Congo'
    });

    this.auth.updateProfile({ addresses: currentAddresses }).subscribe({
      next: () => {
        this.showAddAddrForm.set(false);
        this.newLabel = '';
        this.newStreet = '';
        this.newCity = '';
        alert('Adresse enregistrée !');
      },
      error: (err) => alert('Erreur d\'enregistrement de l\'adresse.')
    });
  }

  deleteAddress(index: number) {
    const userObj = this.user();
    if (!userObj || !userObj.addresses) return;

    const currentAddresses = [...userObj.addresses];
    currentAddresses.splice(index, 1);

    this.auth.updateProfile({ addresses: currentAddresses }).subscribe({
      next: () => alert('Adresse supprimée.'),
      error: (err) => alert('Erreur de suppression.')
    });
  }

  downloadInvoice(order: Order) {
    this.orderService.downloadInvoice(order.id, order.orderNumber);
  }
}
