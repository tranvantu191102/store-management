import { Injectable, inject } from '@angular/core';
import { Database, ref, onValue, off } from '@angular/fire/database';
import { BehaviorSubject, Observable } from 'rxjs';

export interface InventoryTransaction {
  date: string;
  amount: number;
  ton_sau: number;
  type: 'NHAP' | 'XUAT';
}

export interface AlarmEvent {
  timestamp: string;
  event: string;
}

export interface DoorEvent {
  timestamp: string;
  event: string;
}

@Injectable({
  providedIn: 'root'
})
export class WarehouseService {
  private database: Database = inject(Database);

  private currentInventorySubject = new BehaviorSubject<number>(0);
  private historySubject = new BehaviorSubject<InventoryTransaction[]>([]);
  private alarmHistorySubject = new BehaviorSubject<AlarmEvent[]>([]);
  private doorHistorySubject = new BehaviorSubject<DoorEvent[]>([]);
  private isLoadingSubject = new BehaviorSubject<boolean>(true);

  currentInventory$ = this.currentInventorySubject.asObservable();
  history$ = this.historySubject.asObservable();
  alarmHistory$ = this.alarmHistorySubject.asObservable();
  doorHistory$ = this.doorHistorySubject.asObservable();
  isLoading$ = this.isLoadingSubject.asObservable();

  constructor() {}

  /**
   * Listen to real-time warehouse data from Firebase
   * Expects data at path: /warehouse with quantity and history
   */
  listenToWarehouseData(): void {
    const warehouseRef = ref(this.database, 'warehouse');

    onValue(
      warehouseRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();

          // Get current inventory (quantity)
          const currentInventory = data.quantity || 0;
          this.currentInventorySubject.next(currentInventory);

          // Get history transactions
          if (data.history) {
            const transactions: InventoryTransaction[] = [];
            const alarmEvents: AlarmEvent[] = [];
            const doorEvents: DoorEvent[] = [];

            // Process alarm history
            if (data.history.alarm) {
              Object.keys(data.history.alarm).forEach((timestamp) => {
                const alarm = data.history.alarm[timestamp];
                alarmEvents.push({
                  timestamp,
                  event: alarm.event || 'ALARM'
                });
              });

              // Sort by timestamp descending (newest first)
              alarmEvents.sort((a, b) => {
                return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
              });

              this.alarmHistorySubject.next(alarmEvents);
            }

            // Process door history
            if (data.history.door) {
              Object.keys(data.history.door).forEach((timestamp) => {
                const door = data.history.door[timestamp];
                doorEvents.push({
                  timestamp,
                  event: door.event || 'OPEN'
                });
              });

              // Sort by timestamp descending (newest first)
              doorEvents.sort((a, b) => {
                return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
              });

              this.doorHistorySubject.next(doorEvents);
            }

            // Convert history object to array and sort by date descending
            Object.keys(data.history).forEach((key) => {
              const transaction = data.history[key];
              // Skip alarm and door keys as they're processed separately
              if (key !== 'alarm' && key !== 'door' && transaction.amount !== undefined) {
                transactions.push({
                  date: key,
                  amount: transaction.amount || 0,
                  ton_sau: transaction.ton_sau || 0,
                  type: transaction.type || 'NHAP'
                });
              }
            });

            // Sort by date descending (newest first)
            transactions.sort((a, b) => {
              return new Date(b.date).getTime() - new Date(a.date).getTime();
            });

            this.historySubject.next(transactions);
          }

          this.isLoadingSubject.next(false);
        }
      },
      (error) => {
        console.error('Error reading warehouse data:', error);
        this.isLoadingSubject.next(false);
      }
    );
  }

  /**
   * Stop listening to warehouse data
   */
  stopListening(): void {
    const warehouseRef = ref(this.database, 'warehouse');
    off(warehouseRef);
  }

  /**
   * Get current inventory quantity
   */
  getCurrentInventory(): number {
    return this.currentInventorySubject.value;
  }

  /**
   * Get transaction history
   */
  getHistory(): InventoryTransaction[] {
    return this.historySubject.value;
  }

  /**
   * Get alarm history
   */
  getAlarmHistory(): AlarmEvent[] {
    return this.alarmHistorySubject.value;
  }

  /**
   * Get door history
   */
  getDoorHistory(): DoorEvent[] {
    return this.doorHistorySubject.value;
  }

  /**
   * Format date string to readable format
   * Input format: 2025-12-20_20-11-20 (YYYY-MM-DD_HH-mm-ss)
   */
  formatDate(dateString: string): string {
    try {
      const [datePart, timePart] = dateString.split('_');
      const [year, month, day] = datePart.split('-').map(Number);
      const [hour, minute, second] = timePart.split('-').map(Number);

      const date = new Date(year, month - 1, day, hour, minute, second);

      return date.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return dateString;
    }
  }

  /**
   * Get transaction type label
   */
  getTransactionTypeLabel(type: 'NHAP' | 'XUAT'): string {
    return type === 'NHAP' ? 'Nhập Hàng' : 'Xuất Hàng';
  }

  /**
   * Get transaction type color
   */
  getTransactionTypeColor(type: 'NHAP' | 'XUAT'): string {
    return type === 'NHAP' ? '#4CAF50' : '#FF6F00';
  }

  /**
   * Format timestamp for alarm/door events
   * Input format: 2026-01-05_16-37-41
   */
  formatTimestamp(timestamp: string): string {
    return this.formatDate(timestamp);
  }

  /**
   * Get event type label
   */
  getEventLabel(event: string): string {
    switch (event) {
      case 'ALARM':
        return 'Cảnh Báo';
      case 'OPEN':
        return 'Mở Cửa';
      default:
        return event;
    }
  }

  /**
   * Get event type color
   */
  getEventColor(event: string): string {
    switch (event) {
      case 'ALARM':
        return '#F44336';
      case 'OPEN':
        return '#2196F3';
      default:
        return '#9E9E9E';
    }
  }
}
