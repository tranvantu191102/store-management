import { Injectable } from '@angular/core';
import { Database, ref, onValue, off } from '@angular/fire/database';
import { BehaviorSubject, Observable } from 'rxjs';
import { SensorHistoryService } from './sensor-history.service';

export interface StoreMetrics {
  temperature: number;
  humidity: number;
  timestamp: number;
  status: 'optimal' | 'warning' | 'critical';
}

export interface SensorData {
  temperature: number;
  humidity: number;
  lastUpdated: Date;
}

@Injectable({
  providedIn: 'root'
})
export class IoTService {
  private temperatureSubject = new BehaviorSubject<number>(0);
  private humiditySubject = new BehaviorSubject<number>(0);
  private motionSubject = new BehaviorSubject<boolean>(false);
  private statusSubject = new BehaviorSubject<'optimal' | 'warning' | 'critical'>('optimal');
  private lastUpdatedSubject = new BehaviorSubject<Date>(new Date());
  private isLoadingSubject = new BehaviorSubject<boolean>(true);

  temperature$ = this.temperatureSubject.asObservable();
  humidity$ = this.humiditySubject.asObservable();
  motion$ = this.motionSubject.asObservable();
  status$ = this.statusSubject.asObservable();
  lastUpdated$ = this.lastUpdatedSubject.asObservable();
  isLoading$ = this.isLoadingSubject.asObservable();

  constructor(
    private database: Database,
    private sensorHistory: SensorHistoryService
  ) {}

  /**
   * Listen to real-time sensor data from Firebase
   * Expects data at path: /warehouse with temperature and humidity
   * Expects motion at path: /motion (same level as warehouse)
   */
  listenToSensorData(): void {
    const sensorRef = ref(this.database, 'warehouse');
    const motionRef = ref(this.database, 'motion');

    // Listen to sensor data (temperature and humidity)
    onValue(
      sensorRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const temperature = parseFloat(data.temperature) || 0;
          const humidity = parseFloat(data.humidity) || 0;

          this.temperatureSubject.next(temperature);
          this.humiditySubject.next(humidity);
          this.lastUpdatedSubject.next(new Date());
          this.isLoadingSubject.next(false);

          // Add to history
          this.sensorHistory.addReading(temperature, humidity);

          // Determine status based on temperature and humidity
          this.updateStatus(temperature, humidity);
        }
      },
      (error) => {
        console.error('Error reading sensor data:', error);
        this.isLoadingSubject.next(false);
      }
    );

    // Listen to motion data separately
    onValue(
      motionRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const motion = snapshot.val();
          this.motionSubject.next(motion);
        }
      },
      (error) => {
        console.error('Error reading motion data:', error);
      }
    );
  }

  /**
   * Stop listening to sensor data
   */
  stopListening(): void {
    const sensorRef = ref(this.database, 'warehouse');
    const motionRef = ref(this.database, 'motion');
    off(sensorRef);
    off(motionRef);
  }

  /**
   * Get current temperature
   */
  getTemperature(): number {
    return this.temperatureSubject.value;
  }

  /**
   * Get current humidity
   */
  getHumidity(): number {
    return this.humiditySubject.value;
  }

  /**
   * Get current motion status
   */
  getMotion(): boolean {
    return this.motionSubject.value;
  }

  /**
   * Get current status
   */
  getStatus(): 'optimal' | 'warning' | 'critical' {
    return this.statusSubject.value;
  }

  /**
   * Determine status based on temperature and humidity ranges
   * Optimal: 16-26°C and 30-60% humidity
   * Warning: 12-30°C and 20-70% humidity
   * Critical: Outside warning ranges
   */
  private updateStatus(temperature: number, humidity: number): void {
    const tempOptimal = temperature >= 16 && temperature <= 26;
    const humidityOptimal = humidity >= 30 && humidity <= 60;

    const tempWarning = temperature >= 12 && temperature <= 30;
    const humidityWarning = humidity >= 20 && humidity <= 70;

    if (tempOptimal && humidityOptimal) {
      this.statusSubject.next('optimal');
    } else if (tempWarning && humidityWarning) {
      this.statusSubject.next('warning');
    } else {
      this.statusSubject.next('critical');
    }
  }
}
