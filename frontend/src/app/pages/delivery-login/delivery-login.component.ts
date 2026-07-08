import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DeliveryService } from '../../services/delivery.service';

@Component({
  selector: 'app-delivery-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './delivery-login.component.html',
  styleUrls: ['./delivery-login.component.css']
})
export class DeliveryLoginComponent {
  isLoginMode = true;
  loginData = { email: '', password: '' };
  registerData = {
    email: '',
    password: '',
    name: '',
    phone: '',
    vehicleType: 'moto',
    vehicleNumber: ''
  };
  errorMessage = '';
  successMessage = '';

  constructor(
    private deliveryService: DeliveryService,
    private router: Router
  ) {}

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
    this.errorMessage = '';
    this.successMessage = '';
  }

  onLogin() {
    this.deliveryService.login(this.loginData).subscribe({
      next: (response) => {
        localStorage.setItem('deliveryToken', response.token);
        localStorage.setItem('deliveryPerson', JSON.stringify(response.deliveryPerson));
        this.router.navigate(['/delivery-dashboard']);
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Erreur lors de la connexion';
      }
    });
  }

  onRegister() {
    this.deliveryService.register(this.registerData).subscribe({
      next: (response) => {
        this.successMessage = 'Compte créé avec succès! Connectez-vous maintenant.';
        this.isLoginMode = true;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Erreur lors de la création du compte';
      }
    });
  }

  socialLogin(platform: string) {
    // Mock login
    alert(`Simulation de connexion sécurisée avec ${platform}...`);
  }
}
