import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { OrderService, Order } from '../../services/order.service';
import { MessageService } from '../../services/message.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-order-tracking',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="top-bar">
      <button routerLink="/profile" class="back-btn"><i class="bi bi-chevron-left"></i></button>
      <h1 class="logo-title">Suivi de commande</h1>
      <div></div>
    </div>

    <div class="tracking-body" *ngIf="order(); else loadingTpl">
      <!-- Order header card -->
      <div class="tracking-card header-card">
        <div class="hdr-row">
          <span>Commande <b>{{ order()!.orderNumber }}</b></span>
          <span class="status-badge" [class]="order()!.status">{{ getStatusLabel(order()!.status) }}</span>
        </div>
        <p class="date-lbl">Passée le {{ formatDate(order()!.createdAt) }} à {{ formatTime(order()!.createdAt) }}</p>
        <div class="price-row">
          <span>Montant Total</span>
          <span class="total-price">{{ order()!.total }} €</span>
        </div>
      </div>

      <!-- Animated Status Timeline -->
      <div class="tracking-card timeline-card" *ngIf="order()!.status !== 'cancelled'; else cancelledTpl">
        <h3>Statut de livraison</h3>
        <div class="timeline">
          <div class="timeline-item" *ngFor="let step of steps; let idx = index" [class.completed]="idx <= activeStepIndex()" [class.active]="idx === activeStepIndex()">
            <div class="bullet">
              <i class="bi bi-check-lg" *ngIf="idx < activeStepIndex()"></i>
              <span class="dot" *ngIf="idx === activeStepIndex()"></span>
            </div>
            <div class="timeline-content">
              <h4>{{ step.label }}</h4>
              <p>{{ step.desc }}</p>
            </div>
          </div>
        </div>
      </div>

      <ng-template #cancelledTpl>
        <div class="tracking-card cancelled-card">
          <i class="bi bi-x-circle-fill"></i>
          <h3>Commande Annulée</h3>
          <p>Cette commande a été annulée. Si vous avez déjà effectué le paiement, veuillez contacter le service client via WhatsApp.</p>
        </div>
      </ng-template>

      <!-- QR Code & PDF Invoice download -->
      <div class="tracking-card qr-card" *ngIf="order()!.status !== 'cancelled'">
        <h3>Retrait & Facturation</h3>
        <p>Présentez ce QR Code en magasin ou au livreur pour valider la réception.</p>
        <div class="qr-wrapper" *ngIf="order()!.qrCode">
          <img [src]="order()!.qrCode" alt="QR Code Commande" />
        </div>
        <button class="btn-outline download-btn" (click)="downloadInvoice()">
          <i class="bi bi-file-earmark-pdf"></i> Télécharger la Facture PDF
        </button>
      </div>

      <!-- Shipping destination recap -->
      <div class="tracking-card address-card">
        <h3>Adresse de livraison</h3>
        <div class="address-details">
          <h4>{{ order()!.shippingAddress.name }}</h4>
          <p class="phone"><i class="bi bi-telephone"></i> {{ order()!.shippingAddress.phone }}</p>
          <p *ngIf="order()!.shippingMethod !== 'pickup'"><i class="bi bi-geo-alt"></i> {{ order()!.shippingAddress.street }}, {{ order()!.shippingAddress.city }}, {{ order()!.shippingAddress.country }}</p>
          <p *ngIf="order()!.shippingMethod === 'pickup'"><i class="bi bi-shop"></i> Retrait en Boutique Premium Brazzaville</p>
          <p class="instructions" *ngIf="order()!.shippingAddress.instructions">
            <b>Note livreur:</b> "{{ order()!.shippingAddress.instructions }}"
          </p>
        </div>
      </div>

      <!-- Chat with delivery person -->
      <div class="tracking-card chat-card" *ngIf="order()!.deliveryPersonId && order()!.status !== 'cancelled'">
        <h3>💬 Discuter avec le livreur</h3>
        <div class="chat-messages">
          <div class="message" 
               *ngFor="let message of messages()"
               [class.sent]="message.senderType === 'client'"
               [class.received]="message.senderType === 'delivery_person'">
            <div class="message-content">{{ message.content }}</div>
            <div class="message-time">{{ formatTime(message.createdAt) }}</div>
          </div>
          <div *ngIf="messages().length === 0" class="no-messages">
            Aucun message. Commencez la conversation avec le livreur.
          </div>
        </div>
        <div class="chat-input">
          <input type="text" 
                 placeholder="Écrivez votre message..." 
                 [(ngModel)]="newMessage"
                 (keyup.enter)="sendMessage()">
          <button (click)="sendMessage()" class="btn-send">
            <i class="bi bi-send-fill"></i>
          </button>
        </div>
      </div>
    </div>

    <ng-template #loadingTpl>
      <div class="loading-state">
        <div class="skeleton card-sk"></div>
        <div class="skeleton card-sk timeline-sk"></div>
      </div>
    </ng-template>
  `,
  styles: [`
    .back-btn {
      background: none;
      border: none;
      color: var(--text-primary);
      font-size: 1.25rem;
      cursor: pointer;
    }
    .logo-title {
      font-size: 1.2rem !important;
      font-weight: 700;
    }
    .tracking-body {
      padding: 1rem;
    }
    .tracking-card {
      background-color: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-md);
      padding: 1.2rem;
      margin-bottom: 1rem;
    }
    .header-card .hdr-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.2rem;
      font-size: 0.95rem;
    }
    .status-badge {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.25rem 0.6rem;
      border-radius: 20px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    /* Status Badge colors */
    .status-badge.pending { background-color: rgba(245, 158, 11, 0.1); color: var(--warning); }
    .status-badge.confirmed { background-color: rgba(0, 71, 171, 0.1); color: #0047AB; }
    .status-badge.preparing { background-color: rgba(197, 168, 128, 0.15); color: var(--gold-accent); }
    .status-badge.shipped { background-color: rgba(16, 185, 129, 0.1); color: var(--success); }
    .status-badge.delivering { background-color: rgba(16, 185, 129, 0.1); color: var(--success); }
    .status-badge.delivered { background-color: rgba(16, 185, 129, 0.1); color: var(--success); }
    .status-badge.cancelled { background-color: rgba(239, 68, 68, 0.1); color: var(--danger); }

    .date-lbl {
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-bottom: 1rem;
    }
    .price-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid var(--border-color);
      padding-top: 0.8rem;
      font-weight: 500;
    }
    .total-price {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--text-primary);
    }
    .timeline-card h3, .qr-card h3, .address-card h3 {
      font-size: 0.9rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-secondary);
      margin-bottom: 1.2rem;
    }

    /* Timeline */
    .timeline {
      display: flex;
      flex-direction: column;
      position: relative;
      padding-left: 25px;
    }
    .timeline::before {
      content: '';
      position: absolute;
      left: 7px;
      top: 10px;
      bottom: 20px;
      width: 2px;
      background-color: var(--border-color);
      z-index: 1;
    }
    .timeline-item {
      position: relative;
      padding-bottom: 1.5rem;
    }
    .timeline-item:last-child {
      padding-bottom: 0;
    }
    .bullet {
      position: absolute;
      left: -25px;
      top: 2px;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background-color: var(--bg-secondary);
      border: 2px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2;
      transition: var(--transition-smooth);
    }
    .timeline-item.completed .bullet {
      background-color: var(--success);
      border-color: var(--success);
      color: #FFFFFF;
      font-size: 0.6rem;
    }
    .timeline-item.active .bullet {
      border-color: var(--gold-accent);
      background-color: var(--bg-primary);
    }
    .timeline-item.active .bullet .dot {
      width: 6px;
      height: 6px;
      background-color: var(--gold-accent);
      border-radius: 50%;
      display: inline-block;
    }
    .timeline-content h4 {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text-muted);
      transition: var(--transition-smooth);
    }
    .timeline-item.completed .timeline-content h4,
    .timeline-item.active .timeline-content h4 {
      color: var(--text-primary);
    }
    .timeline-content p {
      font-size: 0.78rem;
      color: var(--text-muted);
    }

    /* QR Code */
    .qr-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    .qr-card p {
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-bottom: 1rem;
    }
    .qr-wrapper {
      background-color: #FFFFFF;
      padding: 0.8rem;
      border-radius: var(--border-radius-md);
      box-shadow: 0 4px 10px rgba(0,0,0,0.05);
      margin-bottom: 1.2rem;
      display: inline-flex;
    }
    .qr-wrapper img {
      width: 130px;
      height: 130px;
    }
    .download-btn {
      width: 100%;
      font-size: 0.85rem;
      gap: 0.4rem;
    }

    /* Cancelled */
    .cancelled-card {
      text-align: center;
      color: var(--danger);
      padding: 2rem 1rem;
    }
    .cancelled-card i {
      font-size: 3rem;
      margin-bottom: 0.8rem;
    }
    .cancelled-card h3 {
      font-size: 1.2rem;
      color: var(--danger);
      margin-bottom: 0.4rem;
    }
    .cancelled-card p {
      font-size: 0.85rem;
      color: var(--text-secondary);
    }

    /* Address */
    .address-details h4 {
      font-size: 0.95rem;
      font-weight: 600;
      margin-bottom: 0.4rem;
    }
    .address-details p {
      font-size: 0.85rem;
      color: var(--text-secondary);
      margin-bottom: 0.2rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .address-details i {
      color: var(--text-muted);
    }
    .instructions {
      background-color: var(--bg-primary);
      padding: 0.6rem 0.8rem;
      border-radius: var(--border-radius-sm);
      margin-top: 0.6rem;
      font-size: 0.8rem !important;
      border-left: 3px solid var(--gold-accent);
    }

    /* Chat */
    .chat-card {
      display: flex;
      flex-direction: column;
    }
    .chat-messages {
      max-height: 300px;
      overflow-y: auto;
      background-color: var(--bg-primary);
      border-radius: var(--border-radius-sm);
      padding: 1rem;
      margin-bottom: 1rem;
      min-height: 150px;
    }
    .message {
      margin-bottom: 1rem;
      max-width: 75%;
    }
    .message.sent {
      margin-left: auto;
    }
    .message.received {
      margin-right: auto;
    }
    .message-content {
      padding: 0.75rem 1rem;
      border-radius: 12px;
      margin-bottom: 0.3rem;
      font-size: 0.85rem;
      line-height: 1.4;
    }
    .message.sent .message-content {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .message.received .message-content {
      background-color: var(--bg-secondary);
      color: var(--text-primary);
      border: 1px solid var(--border-color);
    }
    .message-time {
      font-size: 0.7rem;
      color: var(--text-muted);
      text-align: right;
    }
    .no-messages {
      text-align: center;
      color: var(--text-muted);
      font-size: 0.85rem;
      padding: 2rem 1rem;
    }
    .chat-input {
      display: flex;
      gap: 0.5rem;
    }
    .chat-input input {
      flex: 1;
      padding: 0.75rem 1rem;
      border: 2px solid var(--border-color);
      border-radius: var(--border-radius-sm);
      font-size: 0.9rem;
      background-color: var(--bg-primary);
      color: var(--text-primary);
    }
    .chat-input input:focus {
      outline: none;
      border-color: #667eea;
    }
    .btn-send {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 0.75rem 1.25rem;
      border-radius: var(--border-radius-sm);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .btn-send:hover {
      opacity: 0.9;
    }

    /* Skeleton */
    .loading-state {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .card-sk {
      height: 120px;
      border-radius: var(--border-radius-md);
    }
    .timeline-sk {
      height: 250px;
    }
  `]
})
export class OrderTrackingComponent implements OnInit {
  route = inject(ActivatedRoute);
  orderService = inject(OrderService);
  messageService = inject(MessageService);

  order = signal<Order | null>(null);
  messages = signal<any[]>([]);
  newMessage = '';
  private token = '';
  
  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR');
  }

  formatTime(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  steps = [
    { label: 'En attente', desc: 'Commande enregistrée, en attente de traitement.' },
    { label: 'Confirmée', desc: 'Votre commande a été validée par la boutique.' },
    { label: 'Préparation', desc: 'Vos articles sont en cours d\'emballage.' },
    { label: 'Expédiée', desc: 'Le colis a été remis au service de livraison.' },
    { label: 'En livraison', desc: 'Le livreur est en route vers votre adresse.' },
    { label: 'Livrée', desc: 'Colis reçu. Merci de votre fidélité !' }
  ];

  constructor() {}

  ngOnInit() {
    this.token = localStorage.getItem('token') || '';
    if (this.token) {
      this.messageService.initSocket(this.token);
      this.setupSocketListeners();
    }
    
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      if (id) {
        this.loadOrder(id);
      }
    });
  }

  setupSocketListeners() {
    this.messageService.onNewMessage().subscribe((message) => {
      if (this.order() && this.order()!.id === message.orderId) {
        this.messages.update(current => [...current, message]);
      }
    });

    this.messageService.onNewNotification().subscribe((notification) => {
      // Afficher notification
      console.log('Notification:', notification);
    });
  }

  loadOrder(id: number) {
    this.orderService.getOrderById(id).subscribe({
      next: (res) => {
        this.order.set(res);
        if (res.deliveryPersonId) {
          this.loadMessages(id);
          this.messageService.joinOrderRoom(id);
        }
      },
      error: (err) => console.error(err)
    });
  }

  loadMessages(orderId: number) {
    if (!this.token) return;
    
    this.messageService.getOrderMessages(orderId, this.token).subscribe({
      next: (msgs) => this.messages.set(msgs),
      error: (err) => console.error('Erreur chargement messages:', err)
    });
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.order() || !this.token) return;

    const messageData = {
      orderId: this.order()!.id,
      content: this.newMessage,
      senderType: 'client',
      senderId: this.getUserIdFromToken(),
      receiverId: this.order()!.deliveryPersonId,
      receiverType: 'delivery_person'
    };

    this.messageService.sendMessage(messageData);
    this.newMessage = '';
  }

  getUserIdFromToken(): number {
    // Simple parsing - en production, utiliser une méthode plus robuste
    try {
      const payload = JSON.parse(atob(this.token.split('.')[1]));
      return payload.id;
    } catch {
      return 0;
    }
  }

  activeStepIndex(): number {
    const status = this.order()?.status;
    if (!status) return 0;
    if (status === 'pending') return 0;
    if (status === 'confirmed') return 1;
    if (status === 'preparing') return 2;
    if (status === 'shipped') return 3;
    if (status === 'delivering') return 4;
    if (status === 'delivered') return 5;
    return 0;
  }

  getStatusLabel(status: string): string {
    const labels: any = {
      pending: 'En attente',
      confirmed: 'Confirmée',
      preparing: 'En préparation',
      shipped: 'Expédiée',
      delivering: 'En cours de livraison',
      delivered: 'Livrée',
      cancelled: 'Annulée'
    };
    return labels[status] || status;
  }

  downloadInvoice() {
    const o = this.order();
    if (o) {
      this.orderService.downloadInvoice(o.id, o.orderNumber);
    }
  }

  ngOnDestroy() {
    if (this.order()) {
      this.messageService.leaveOrderRoom(this.order()!.id);
    }
    this.messageService.disconnect();
  }
}
