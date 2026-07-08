import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthService } from './auth.service';

export interface Category {
  id: number;
  name: string;
  slug: string;
  imageUrl?: string;
}

export interface Color {
  id: number;
  name: string;
  hexCode: string;
}

export interface Size {
  id: number;
  name: string;
}

export interface ProductVariant {
  id: number;
  productId: number;
  colorId: number;
  sizeId: number;
  stock: number;
  color?: Color;
  size?: Size;
}

export interface ProductImage {
  id: number;
  productId: number;
  colorId?: number;
  imageUrl: string;
  color?: Color;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string;
  price: number;
  oldPrice?: number;
  discountPercentage: number;
  stock: number;
  rating: number;
  brand?: string;
  isPopular: boolean;
  isPromo: boolean;
  isAvailable: boolean;
  categoryId: number;
  category?: Category;
  images: ProductImage[];
  variants: ProductVariant[];
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly baseUrl = 'https://ventedemeuble1.onrender.com/api';
  
  // Local states
  readonly favorites = signal<Product[]>([]);
  readonly recentlyViewed = signal<Product[]>([]);

  constructor(private http: HttpClient, private auth: AuthService) {
    this.loadFavorites();
    this.loadRecentlyViewed();
  }

  // --- CATALOG API ---

  getProducts(filters: any = {}): Observable<Product[]> {
    let params = new HttpParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        if (Array.isArray(filters[key])) {
          filters[key].forEach((val: any) => {
            params = params.append(key, val);
          });
        } else {
          params = params.set(key, filters[key]);
        }
      }
    });

    return this.http.get<Product[]>(`${this.baseUrl}/products`, { params });
  }

  getProductById(id: number): Observable<{ product: Product; similarProducts: Product[] }> {
    return this.http.get<{ product: Product; similarProducts: Product[] }>(`${this.baseUrl}/products/${id}`).pipe(
      tap(res => this.addToRecentlyViewed(res.product))
    );
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.baseUrl}/categories`);
  }

  createCategory(categoryData: { name: string, slug?: string, imageUrl?: string }): Observable<Category> {
    return this.http.post<Category>(`${this.baseUrl}/categories`, categoryData, { headers: this.auth.getHeaders() });
  }

  // --- REVIEWS API ---

  getReviews(productId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/reviews/${productId}`);
  }

  submitReview(productId: number, rating: number, comment: string): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/reviews/${productId}`,
      { rating, comment },
      { headers: this.auth.getHeaders() }
    );
  }

  // --- FAVORITES / WISHLIST STATE (LocalStorage) ---

  private loadFavorites() {
    const saved = localStorage.getItem('favorites');
    if (saved) {
      this.favorites.set(JSON.parse(saved));
    }
  }

  toggleFavorite(product: Product) {
    const current = this.favorites();
    const exists = current.some(p => p.id === product.id);
    
    let updated: Product[];
    if (exists) {
      updated = current.filter(p => p.id !== product.id);
    } else {
      updated = [...current, product];
    }
    
    this.favorites.set(updated);
    localStorage.setItem('favorites', JSON.stringify(updated));
  }

  isFavorite(productId: number): boolean {
    return this.favorites().some(p => p.id === productId);
  }

  // --- RECENTLY VIEWED (LocalStorage) ---

  private loadRecentlyViewed() {
    const saved = localStorage.getItem('recentlyViewed');
    if (saved) {
      this.recentlyViewed.set(JSON.parse(saved));
    }
  }

  private addToRecentlyViewed(product: Product) {
    let current = this.recentlyViewed().filter(p => p.id !== product.id); // remove duplicates
    current = [product, ...current].slice(0, 5); // keep top 5
    this.recentlyViewed.set(current);
    localStorage.setItem('recentlyViewed', JSON.stringify(current));
  }
}
