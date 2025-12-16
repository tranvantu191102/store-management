import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface SensorReading {
  temperature: number;
  humidity: number;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class SensorHistoryService {
  private maxReadings = 100;
  private readingsSubject = new BehaviorSubject<SensorReading[]>([]);
  readings$ = this.readingsSubject.asObservable();

  constructor() {}

  /**
   * Add a new sensor reading to history
   */
  addReading(temperature: number, humidity: number): void {
    const readings = this.readingsSubject.value;
    const newReading: SensorReading = {
      temperature,
      humidity,
      timestamp: Date.now()
    };

    readings.push(newReading);

    // Keep only last maxReadings
    if (readings.length > this.maxReadings) {
      readings.shift();
    }

    this.readingsSubject.next([...readings]);
  }

  /**
   * Get average temperature from readings
   */
  getAverageTemperature(): number {
    const readings = this.readingsSubject.value;
    if (readings.length === 0) return 0;
    const sum = readings.reduce((acc, r) => acc + r.temperature, 0);
    return sum / readings.length;
  }

  /**
   * Get average humidity from readings
   */
  getAverageHumidity(): number {
    const readings = this.readingsSubject.value;
    if (readings.length === 0) return 0;
    const sum = readings.reduce((acc, r) => acc + r.humidity, 0);
    return sum / readings.length;
  }

  /**
   * Get max temperature
   */
  getMaxTemperature(): number {
    const readings = this.readingsSubject.value;
    if (readings.length === 0) return 0;
    return Math.max(...readings.map(r => r.temperature));
  }

  /**
   * Get min temperature
   */
  getMinTemperature(): number {
    const readings = this.readingsSubject.value;
    if (readings.length === 0) return 0;
    return Math.min(...readings.map(r => r.temperature));
  }

  /**
   * Get max humidity
   */
  getMaxHumidity(): number {
    const readings = this.readingsSubject.value;
    if (readings.length === 0) return 0;
    return Math.max(...readings.map(r => r.humidity));
  }

  /**
   * Get min humidity
   */
  getMinHumidity(): number {
    const readings = this.readingsSubject.value;
    if (readings.length === 0) return 0;
    return Math.min(...readings.map(r => r.humidity));
  }

  /**
   * Clear all readings
   */
  clearReadings(): void {
    this.readingsSubject.next([]);
  }

  /**
   * Get all readings
   */
  getAllReadings(): SensorReading[] {
    return this.readingsSubject.value;
  }
}
