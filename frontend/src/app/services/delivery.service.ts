import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DeliveryService {
  private apiUrl = 'https://mon-vrai-backend.onrender.com/api/delivery';

  constructor(private http: HttpClient) {}

  // Inscription livreur
  register(deliveryData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, deliveryData);
  }

  // Connexion livreur
  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials);
  }

  // Obtenir le profil
  getProfile(token: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  // Mettre à jour la disponibilité
  updateAvailability(isAvailable: boolean, token: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/availability`, { isAvailable }, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  // Mettre à jour la localisation
  updateLocation(location: any, token: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/location`, location, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  // Obtenir les commandes assignées
  getAssignedOrders(token: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/orders`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  // Accepter une commande
  acceptOrder(orderId: number, token: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/orders/${orderId}/accept`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  // Mettre à jour le statut de livraison
  updateDeliveryStatus(orderId: number, token: string, status: string, estimatedTime?: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/orders/${orderId}/status`, { 
      status, 
      estimatedDeliveryTime: estimatedTime 
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }
}
