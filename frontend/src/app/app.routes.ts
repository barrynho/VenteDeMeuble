import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home';
import { SearchComponent } from './pages/search/search';
import { ProductDetailComponent } from './pages/product-detail/product-detail';
import { CartComponent } from './pages/cart/cart';
import { CheckoutComponent } from './pages/checkout/checkout';
import { OrderTrackingComponent } from './pages/order-tracking/order-tracking';
import { ProfileComponent } from './pages/profile/profile';
import { AdminComponent } from './pages/admin/admin';
import { DeliveryLoginComponent } from './pages/delivery-login/delivery-login.component';
import { DeliveryDashboardComponent } from './pages/delivery-dashboard/delivery-dashboard.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'search', component: SearchComponent },
  { path: 'product/:id', component: ProductDetailComponent },
  { path: 'cart', component: CartComponent },
  { path: 'checkout', component: CheckoutComponent },
  { path: 'order-tracking/:id', component: OrderTrackingComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'admin', component: AdminComponent },
  { path: 'delivery-login', component: DeliveryLoginComponent },
  { path: 'delivery-dashboard', component: DeliveryDashboardComponent },
  { path: '**', redirectTo: '' }
];
