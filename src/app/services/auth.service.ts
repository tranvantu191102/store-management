import { inject, Injectable } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, user } from '@angular/fire/auth';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface UserData {
  uid: string;
  email: string;
  displayName?: string;
  createdAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private auth: Auth = inject(Auth)

  user$ = user(this.auth);

  /**
   * Register a new user with email and password
   * Returns an Observable of UserData
   */
  register(email: string, password: string, displayName?: string): Observable<UserData> {
    return from(createUserWithEmailAndPassword(this.auth, email, password)).pipe(
      map((userCredential) => ({
        uid: userCredential.user.uid,
        email: userCredential.user.email || email,
        displayName: displayName || email.split('@')[0],
        createdAt: new Date()
      })),
      catchError((error) => throwError(() => this.handleError(error)))
    );
  }

  /**
   * Login with email and password
   * Returns an Observable that completes when login is successful
   */
  login(email: string, password: string): Observable<void> {
    return from(signInWithEmailAndPassword(this.auth, email, password)).pipe(
      map(() => undefined),
      catchError((error) => throwError(() => this.handleError(error)))
    );
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    return this.auth.currentUser;
  }

  /**
   * Handle Firebase errors
   */
  private handleError(error: any): Error {
    let errorMessage = 'An error occurred';

    if (error.code) {
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Email is already in use';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak (minimum 6 characters)';
          break;
        case 'auth/user-not-found':
          errorMessage = 'User not found';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Invalid email or password';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Operation not allowed';
          break;
        default:
          errorMessage = error.message || 'An error occurred';
      }
    }

    return new Error(errorMessage);
  }
}
