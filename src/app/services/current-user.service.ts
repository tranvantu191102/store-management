import { inject, Injectable } from '@angular/core';
import { Auth, user, User } from '@angular/fire/auth';
import { Observable } from 'rxjs';

/**
 * Utility service for managing current authentication state
 * Provides easy access to current user observable throughout the app
 */
@Injectable({
  providedIn: 'root'
})
export class CurrentUserService {
  /**
   * Observable that emits the current authenticated user
   * Emits null when no user is logged in
   */

  private auth : Auth = inject(Auth);
  currentUser$ = user(this.auth);


  /**
   * Get synchronously the current user (may be null)
   */
  getCurrentUserSync(): User | null {
    return this.auth.currentUser;
  }

  /**
   * Check if user is currently authenticated
   */
  isAuthenticated(): boolean {
    return this.auth.currentUser !== null;
  }

  /**
   * Get current user's UID
   */
  getCurrentUserUID(): string | null {
    return this.auth.currentUser?.uid || null;
  }

  /**
   * Get current user's email
   */
  getCurrentUserEmail(): string | null {
    return this.auth.currentUser?.email || null;
  }

  /**
   * Wait for authentication to be determined
   * Useful for app initialization
   */
  waitForAuthInitialization(): Observable<User | null> {
    return this.currentUser$;
  }
}
