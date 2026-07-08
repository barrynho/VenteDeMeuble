import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface Order {
  id: number;
  orderNumber: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'shipped' | 'delivering' | 'delivered' | 'cancelled';
  shippingMethod: 'pickup' | 'home' | 'relay';
  shippingAddress: any;
  subtotal: number;
  shippingFee: number;
  total: number;
  paymentMethod: string;
  paymentDetails: any;
  couponCode?: string;
  discountAmount: number;
  qrCode?: string;
  createdAt: string;
  items: any[];
  deliveryPersonId?: number;
  deliveryStatus?: 'pending' | 'accepted' | 'picked_up' | 'in_transit' | 'delivered';
  estimatedDeliveryTime?: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly apiUrl = 'https://ventedemeuble1.onrender.com/api/orders';

  constructor(private http: HttpClient, private auth: AuthService) {}

  createOrder(orderData: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, orderData, { headers: this.auth.getHeaders() });
  }

  getOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(this.apiUrl, { headers: this.auth.getHeaders() });
  }

  getOrderById(id: number): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/${id}`, { headers: this.auth.getHeaders() });
  }

  downloadInvoice(orderId: number, orderNumber: string) {
    this.http.get(`${this.apiUrl}/${orderId}/invoice`, {
      headers: this.auth.getHeaders(),
      responseType: 'blob'
    }).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `facture-${orderNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => console.error('Invoice download failed:', err)
    });
  }
}
