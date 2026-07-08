import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CartService } from './services/cart.service';
import { ProductService } from './services/product.service';
import { AuthService } from './services/auth.service';
import { MessageService } from './services/message.service';
import { NotificationService } from './services/notification.service';
import { NotificationToastComponent } from './components/notification-toast/notification-toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, NotificationToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  // Services Injection
  cartService = inject(CartService);
  productService = inject(ProductService);
  authService = inject(AuthService);
  messageService = inject(MessageService);
  notificationService = inject(NotificationService);
  router = inject(Router);

  // States
  isMobileMenuOpen = signal(false);
  activeLanguage = signal<'FR' | 'EN'>('FR');
  activeCurrency = signal<'EUR' | 'FCFA' | 'USD'>('FCFA');

  // Computed badges
  cartBadge = this.cartService.itemCount;
  favBadge = computed(() => this.productService.favorites().length);

  // Hide mobile nav bar on admin routes
  hideBottomNav = computed(() => {
    return this.router.url.startsWith('/admin') || this.router.url.startsWith('/checkout');
  });

  ngOnInit() {
    this.loadSettings();
    this.initGlobalSocket();
  }

  initGlobalSocket() {
    const token = this.authService.token();
    this.messageService.initSocket(token || undefined);
    this.messageService.onNewNotification().subscribe((notif: any) => {
      this.notificationService.show(notif);
    });
  }

  loadSettings() {
    const savedLang = localStorage.getItem('lang');
    if (savedLang) this.activeLanguage.set(savedLang as any);
    const savedCur = localStorage.getItem('currency');
    if (savedCur) this.activeCurrency.set(savedCur as any);
  }

  changeLanguage(lang: 'FR' | 'EN') {
    this.activeLanguage.set(lang);
    localStorage.setItem('lang', lang);
  }

  changeCurrency(cur: 'EUR' | 'FCFA' | 'USD') {
    this.activeCurrency.set(cur);
    localStorage.setItem('currency', cur);
  }
}
