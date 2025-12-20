import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { IoTService } from '../../services/iot.service';
import { SensorHistoryService } from '../../services/sensor-history.service';
import { WarehouseService } from '../../services/warehouse.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {

  private authService: AuthService = inject(AuthService);
  private iotService: IoTService = inject(IoTService);
  private sensorHistory: SensorHistoryService = inject(SensorHistoryService);
  private warehouseService: WarehouseService = inject(WarehouseService);
  private router: Router = inject(Router);

  user$ = this.authService.user$;
  temperature$ = this.iotService.temperature$;
  humidity$ = this.iotService.humidity$;
  motion$ = this.iotService.motion$;
  status$ = this.iotService.status$;
  lastUpdated$ = this.iotService.lastUpdated$;
  isLoading$ = this.iotService.isLoading$;
  sensorReadings$ = this.sensorHistory.readings$;

  // Warehouse inventory
  currentInventory$ = this.warehouseService.currentInventory$;
  inventoryHistory$ = this.warehouseService.history$;
  warehouseLoading$ = this.warehouseService.isLoading$;

  // Theft Alert variables
  intruderAlert$ = new BehaviorSubject<boolean>(false);
  alertMessage = 'Phát Hiện Cảnh Báo Trộm!';
  alertTime: Date | null = null;

  ngOnInit(): void {
    this.iotService.listenToSensorData();
    this.warehouseService.listenToWarehouseData();
    this.checkMotionAlert();
  }

  ngOnDestroy(): void {
    this.iotService.stopListening();
    this.warehouseService.stopListening();
  }

  async logout(): Promise<void> {
    try {
      await this.authService.logout();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  // Check motion signal from Firebase and trigger alert
  private checkMotionAlert(): void {
    this.motion$.subscribe((motion) => {
      console.log('Motion value:', motion);
      if (motion) {
        console.log('Motion detected! Triggering theft alert...');
        this.triggerTheftAlert();
      }
    });
  }

  triggerTheftAlert(): void {
    this.alertTime = new Date();
    this.intruderAlert$.next(true);

    // Auto dismiss alert after 8 seconds
    setTimeout(() => {
      this.intruderAlert$.next(false);
    }, 8000);
  }

  dismissAlert(): void {
    this.intruderAlert$.next(false);
  }

  getTemperatureGauge(temp: number): number {
    // Map temperature to percentage (0-50°C for display)
    return Math.max(0, Math.min(100, (temp / 50) * 100));
  }

  getHumidityGauge(humidity: number): number {
    // Humidity is already 0-100%
    return Math.max(0, Math.min(100, humidity));
  }

  getTemperatureFillColor(temp: number): string {
    if (temp < 10) return '#2196F3'; // Blue - Cold
    if (temp < 16) return '#4CAF50'; // Green - Cool
    if (temp <= 26) return '#4CAF50'; // Green - Optimal
    if (temp <= 30) return '#FFC107'; // Yellow - Warm
    if (temp <= 35) return '#FF9800'; // Orange - Hot
    return '#F44336'; // Red - Very Hot
  }

  getHumidityFillColor(humidity: number): string {
    if (humidity < 20) return '#FF6F00'; // Orange - Too Dry
    if (humidity < 30) return '#FFC107'; // Yellow - Low
    if (humidity <= 60) return '#4CAF50'; // Green - Optimal
    if (humidity <= 70) return '#FFC107'; // Yellow - High
    return '#F44336'; // Red - Too Humid
  }

  getTemperatureStatus(temp: number): string {
    if (temp >= 16 && temp <= 26) return 'optimal';
    if (temp >= 12 && temp <= 30) return 'warning';
    return 'critical';
  }

  getTemperatureStatusText(temp: number): string {
    if (temp >= 16 && temp <= 26) return 'Khoảng Tối Ưu';
    if (temp >= 12 && temp <= 30) return 'Khoảng Cảnh Báo';
    return 'Khoảng Nguy Hiểm';
  }

  getHumidityStatus(humidity: number): string {
    if (humidity >= 30 && humidity <= 60) return 'optimal';
    if (humidity >= 20 && humidity <= 70) return 'warning';
    return 'critical';
  }

  getHumidityStatusText(humidity: number): string {
    if (humidity >= 30 && humidity <= 60) return 'Khoảng Tối Ưu';
    if (humidity >= 20 && humidity <= 70) return 'Khoảng Cảnh Báo';
    return 'Khoảng Nguy Hiểm';
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'optimal':
        return 'Tối Ưu';
      case 'warning':
        return 'Cảnh Báo';
      case 'critical':
        return 'Nguy Hiểm';
      default:
        return 'Không Xác Định';
    }
  }

  // Warehouse methods
  getTransactionTypeLabel(type: 'NHAP' | 'XUAT'): string {
    return this.warehouseService.getTransactionTypeLabel(type);
  }

  getTransactionTypeColor(type: 'NHAP' | 'XUAT'): string {
    return this.warehouseService.getTransactionTypeColor(type);
  }

  formatDate(dateString: string): string {
    return this.warehouseService.formatDate(dateString);
  }
}

