import { inject, Injectable } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, user } from '@angular/fire/auth';
import { Firestore, collection, doc, setDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

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
  private firestore: Firestore = inject(Firestore)

  user$ = user(this.auth);

  /**
   * Register a new user with email and password
   */
  async register(email: string, password: string, displayName?: string): Promise<UserData> {
    try {
      console.log('Registering user with email:', email, 'and displayName:', displayName, '...');
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      const uid = userCredential.user.uid;

      // Store user data in Firestore
      const userRef = doc(this.firestore, 'users', uid);
      const userData: UserData = {
        uid,
        email,
        displayName: displayName || email.split('@')[0],
        createdAt: new Date()
      };

      await setDoc(userRef, userData);
      return userData;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<void> {
    try {
      await signInWithEmailAndPassword(this.auth, email, password);
    } catch (error) {
      throw this.handleError(error);
    }
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
