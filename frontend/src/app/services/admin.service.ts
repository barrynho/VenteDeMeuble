import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly apiUrl = 'https://mon-vrai-backend.onrender.com/api/admin';

  constructor(private http: HttpClient, private auth: AuthService) {}

  private getMultipartHeaders(): HttpHeaders {
    // Note: Do NOT set Content-Type header when sending FormData; 
    // the browser needs to set it automatically with the boundary!
    const token = this.auth.token();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  // --- STATS ---
  getStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stats`, { headers: this.auth.getHeaders() });
  }

  // --- ORDERS ---
  getOrders(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/orders`, { headers: this.auth.getHeaders() });
  }

  updateOrderStatus(orderId: number, status: string): Observable<any> {
    return this.http.put<any>(
      `${this.apiUrl}/orders/${orderId}/status`,
      { status },
      { headers: this.auth.getHeaders() }
    );
  }

  // --- PRODUCTS CRUD ---
  createProduct(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/products`, formData, { headers: this.getMultipartHeaders() });
  }

  updateProduct(productId: number, formData: FormData): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/products/${productId}`, formData, { headers: this.getMultipartHeaders() });
  }

  deleteProduct(productId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/products/${productId}`, { headers: this.auth.getHeaders() });
  }

  // --- COUPONS CRUD ---
  getCoupons(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/coupons`, { headers: this.auth.getHeaders() });
  }

  createCoupon(couponData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/coupons`, couponData, { headers: this.auth.getHeaders() });
  }

  updateCoupon(couponId: number, couponData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/coupons/${couponId}`, couponData, { headers: this.auth.getHeaders() });
  }

  deleteCoupon(couponId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/coupons/${couponId}`, { headers: this.auth.getHeaders() });
  }

  // --- CSV EXPORT ---
  exportSalesCSV() {
    this.http.get(`${this.apiUrl}/exports/sales`, {
      headers: this.auth.getHeaders(),
      responseType: 'blob'
    }).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ventes-export.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => console.error('CSV Export failed:', err)
    });
  }
}
