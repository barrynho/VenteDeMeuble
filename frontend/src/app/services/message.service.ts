import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private apiUrl = 'https://mon-vrai-backend.onrender.com/api/messages';
  private socket: Socket | null = null;

  constructor(private http: HttpClient) {}

  // Initialiser Socket.io
  initSocket(token?: string): void {
    if (this.socket) {
      this.socket.disconnect();
    }
    const authOpts = token ? { token } : {};
    this.socket = io('https://mon-vrai-backend.onrender.com', {
      auth: authOpts,
      transports: ['websocket']
    });
  }

  // Envoyer un message
  sendMessage(messageData: any): void {
    if (this.socket) {
      this.socket.emit('send_message', messageData);
    }
  }

  // Écouter les nouveaux messages
  onNewMessage(): Observable<any> {
    return new Observable(observer => {
      if (this.socket) {
        this.socket.on('new_message', (message) => {
          observer.next(message);
        });
      }
    });
  }

  // Écouter les notifications
  onNewNotification(): Observable<any> {
    return new Observable(observer => {
      if (this.socket) {
        this.socket.on('new_notification', (notification) => {
          observer.next(notification);
        });
      }
    });
  }

  // Écouter les notifications administrateur
  onAdminNotification(): Observable<any> {
    return new Observable(observer => {
      if (this.socket) {
        this.socket.on('admin_notification', (notification) => {
          observer.next(notification);
        });
      }
    });
  }

  // Écouter le nombre de visiteurs en direct
  onVisitorCountUpdate(): Observable<number> {
    return new Observable(observer => {
      if (this.socket) {
        this.socket.on('visitor_count_update', (count: number) => {
          observer.next(count);
        });
      }
    });
  }

  // Marquer les messages comme lus
  markMessagesRead(orderId: number, token: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/order/${orderId}/read`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  // Obtenir les messages d'une commande
  getOrderMessages(orderId: number, token: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/order/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  // Obtenir les conversations de l'utilisateur
  getUserConversations(token: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/conversations/user`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  // Obtenir les conversations du livreur
  getDeliveryConversations(token: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/conversations/delivery`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  // Obtenir le nombre de messages non lus
  getUnreadCount(token: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/unread/count`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  // Rejoindre une room de commande
  joinOrderRoom(orderId: number): void {
    if (this.socket) {
      this.socket.emit('join_order', orderId);
    }
  }

  // Quitter une room de commande
  leaveOrderRoom(orderId: number): void {
    if (this.socket) {
      this.socket.emit('leave_order', orderId);
    }
  }

  // Déconnexion
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}
