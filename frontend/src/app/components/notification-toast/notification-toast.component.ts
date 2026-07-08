import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '../../services/notification.service';
import { trigger, style, animate, transition } from '@angular/animations';

@Component({
  selector: 'app-notification-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-toast.component.html',
  styleUrls: ['./notification-toast.component.css'],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ transform: 'translateX(100%)', opacity: 0 }))
      ])
    ])
  ]
})
export class NotificationToastComponent implements OnInit {
  notifications: Notification[] = [];

  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    this.notificationService.notifications$.subscribe(notification => {
      this.addNotification(notification);
    });
  }

  addNotification(notification: Notification) {
    this.notifications.push(notification);
    
    // Auto-remove after duration
    setTimeout(() => {
      this.removeNotification(notification.id);
    }, notification.duration);
  }

  removeNotification(id: number) {
    const index = this.notifications.findIndex(n => n.id === id);
    if (index > -1) {
      this.notifications.splice(index, 1);
    }
  }

  getIcon(type: string): string {
    const icons: { [key: string]: string } = {
      success: 'bi-check-circle-fill',
      error: 'bi-x-circle-fill',
      warning: 'bi-exclamation-triangle-fill',
      info: 'bi-info-circle-fill',
      order: 'bi-bag-check-fill',
      delivery: 'bi-truck-fill',
      message: 'bi-chat-dots-fill'
    };
    return icons[type] || 'bi-bell-fill';
  }

  getIconColor(type: string): string {
    const colors: { [key: string]: string } = {
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6',
      order: '#8b5cf6',
      delivery: '#06b6d4',
      message: '#ec4899'
    };
    return colors[type] || '#6b7280';
  }

  getBackgroundColor(type: string): string {
    const colors: { [key: string]: string } = {
      success: 'rgba(16, 185, 129, 0.1)',
      error: 'rgba(239, 68, 68, 0.1)',
      warning: 'rgba(245, 158, 11, 0.1)',
      info: 'rgba(59, 130, 246, 0.1)',
      order: 'rgba(139, 92, 246, 0.1)',
      delivery: 'rgba(6, 182, 212, 0.1)',
      message: 'rgba(236, 72, 153, 0.1)'
    };
    return colors[type] || 'rgba(107, 114, 128, 0.1)';
  }

  getBorderColor(type: string): string {
    const colors: { [key: string]: string } = {
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6',
      order: '#8b5cf6',
      delivery: '#06b6d4',
      message: '#ec4899'
    };
    return colors[type] || '#6b7280';
  }
}
