import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DeliveryService } from '../../services/delivery.service';
import { MessageService } from '../../services/message.service';

@Component({
  selector: 'app-delivery-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './delivery-dashboard.component.html',
  styleUrls: ['./delivery-dashboard.component.css']
})
export class DeliveryDashboardComponent implements OnInit {
  deliveryPerson: any;
  assignedOrders: any[] = [];
  selectedOrder: any = null;
  loading = true;
  unreadCount = 0;
  newMessage = '';

  constructor(
    private deliveryService: DeliveryService,
    private messageService: MessageService,
    private router: Router
  ) {}

  ngOnInit() {
    const token = localStorage.getItem('deliveryToken');
    const personData = localStorage.getItem('deliveryPerson');

    if (!token || !personData) {
      this.router.navigate(['/delivery-login']);
      return;
    }

    this.deliveryPerson = JSON.parse(personData);
    this.messageService.initSocket(token);
    this.setupSocketListeners();
    this.loadDashboardData(token);
  }

  setupSocketListeners() {
    this.messageService.onNewNotification().subscribe((notification) => {
      this.unreadCount++;
      this.showNotification(notification);
    });

    this.messageService.onNewMessage().subscribe((message) => {
      if (this.selectedOrder && this.selectedOrder.id === message.orderId) {
        // Si on est sur la conversation, recharger les messages
        this.loadOrderMessages(this.selectedOrder.id);
      }
    });
  }

  loadDashboardData(token: string) {
    this.loading = true;

    this.deliveryService.getAssignedOrders(token).subscribe({
      next: (orders) => {
        this.assignedOrders = orders;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des commandes:', error);
        this.loading = false;
      }
    });

    this.messageService.getUnreadCount(token).subscribe({
      next: (response) => {
        this.unreadCount = response.unreadCount;
      }
    });
  }

  selectOrder(order: any) {
    this.selectedOrder = order;
    this.messageService.joinOrderRoom(order.id);
    this.loadOrderMessages(order.id);
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.selectedOrder) return;

    const messageData = {
      orderId: this.selectedOrder.id,
      content: this.newMessage,
      receiverId: this.selectedOrder.userId,
      receiverType: 'client'
    };

    this.messageService.sendMessage(messageData);
    this.newMessage = '';
  }

  loadOrderMessages(orderId: number) {
    const token = localStorage.getItem('deliveryToken');
    if (!token) return;
    
    this.messageService.getOrderMessages(orderId, token).subscribe({
      next: (messages) => {
        if (this.selectedOrder) {
          this.selectedOrder.messages = messages;
        }
      }
    });
  }

  acceptOrder(orderId: number) {
    const token = localStorage.getItem('deliveryToken');
    if (!token) return;
    
    this.deliveryService.acceptOrder(orderId, token).subscribe({
      next: () => {
        const currentToken = localStorage.getItem('deliveryToken');
        if (currentToken) this.loadDashboardData(currentToken);
      },
      error: (error) => {
        console.error('Erreur lors de l\'acceptation:', error);
      }
    });
  }

  updateDeliveryStatus(orderId: number, status: string) {
    const token = localStorage.getItem('deliveryToken');
    if (!token) return;
    
    this.deliveryService.updateDeliveryStatus(orderId, token, status, undefined).subscribe({
      next: () => {
        const currentToken = localStorage.getItem('deliveryToken');
        if (currentToken) this.loadDashboardData(currentToken);
      },
      error: (error) => {
        console.error('Erreur lors de la mise à jour:', error);
      }
    });
  }

  toggleAvailability() {
    const token = localStorage.getItem('deliveryToken');
    if (!token) return;
    
    const newStatus = !this.deliveryPerson.isAvailable;
    
    this.deliveryService.updateAvailability(newStatus, token).subscribe({
      next: () => {
        this.deliveryPerson.isAvailable = newStatus;
        localStorage.setItem('deliveryPerson', JSON.stringify(this.deliveryPerson));
      },
      error: (error) => {
        console.error('Erreur lors de la mise à jour de disponibilité:', error);
      }
    });
  }

  logout() {
    localStorage.removeItem('deliveryToken');
    localStorage.removeItem('deliveryPerson');
    this.messageService.disconnect();
    this.router.navigate(['/delivery-login']);
  }

  showNotification(notification: any) {
    // Vous pouvez utiliser une bibliothèque de notifications ici
    alert(`${notification.title}: ${notification.message}`);
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      pending: '#ffc107',
      accepted: '#17a2b8',
      picked_up: '#fd7e14',
      in_transit: '#007bff',
      delivered: '#28a745'
    };
    return colors[status] || '#6c757d';
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      pending: 'En attente',
      accepted: 'Accepté',
      picked_up: 'Récupéré',
      in_transit: 'En livraison',
      delivered: 'Livré'
    };
    return labels[status] || status;
  }
}
