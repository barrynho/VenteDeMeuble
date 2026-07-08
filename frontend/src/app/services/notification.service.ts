import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'order' | 'delivery' | 'message';
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationSubject = new Subject<Notification>();
  private notificationId = 0;

  notifications$ = this.notificationSubject.asObservable();

  show(notification: Omit<Notification, 'id'>) {
    const newNotification: Notification = {
      ...notification,
      id: this.notificationId++,
      duration: notification.duration || 4000
    };
    this.notificationSubject.next(newNotification);
  }

  success(title: string, message: string) {
    this.show({ title, message, type: 'success' });
  }

  error(title: string, message: string) {
    this.show({ title, message, type: 'error', duration: 6000 });
  }

  warning(title: string, message: string) {
    this.show({ title, message, type: 'warning' });
  }

  info(title: string, message: string) {
    this.show({ title, message, type: 'info' });
  }

  order(title: string, message: string) {
    this.show({ title, message, type: 'order', duration: 5000 });
  }

  delivery(title: string, message: string) {
    this.show({ title, message, type: 'delivery', duration: 5000 });
  }

  message(title: string, message: string) {
    this.show({ title, message, type: 'message', duration: 4000 });
  }
}
