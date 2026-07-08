import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface UserProfile {
  id: number;
  email: string;
  name: string;
  phone: string;
  role: 'client' | 'admin';
  addresses: any[];
  paymentMethods: any[];
  photoUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = 'https://mon-vrai-backend.onrender.com/api/auth';
  
  // Signals for reactive state management
  readonly currentUser = signal<UserProfile | null>(null);
  readonly token = signal<string | null>(null);
  
  readonly isLoggedIn = computed(() => this.currentUser() !== null);
  readonly isAdmin = computed(() => this.currentUser()?.role === 'admin');

  constructor(private http: HttpClient) {
    this.loadStorage();
  }

  private loadStorage() {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      this.token.set(savedToken);
      this.currentUser.set(JSON.parse(savedUser));
    }
  }

  getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token()}`
    });
  }

  register(userData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, userData).pipe(
      tap(res => this.saveSession(res.token, res.user))
    );
  }

  login(credentials: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap(res => this.saveSession(res.token, res.user))
    );
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.token.set(null);
    this.currentUser.set(null);
  }

  fetchProfile(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/profile`, { headers: this.getHeaders() }).pipe(
      tap(res => {
        this.currentUser.set(res.user);
        localStorage.setItem('user', JSON.stringify(res.user));
      })
    );
  }

  updateProfile(profileData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/profile`, profileData, { headers: this.getHeaders() }).pipe(
      tap(res => {
        this.currentUser.set(res.user);
        localStorage.setItem('user', JSON.stringify(res.user));
      })
    );
  }

  private saveSession(token: string, user: UserProfile) {
    this.token.set(token);
    this.currentUser.set(user);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }
}
