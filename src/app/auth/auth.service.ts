import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';

import { AuthData } from './auth-data.model';
import { environment } from '../../environments/environment';

const BAKEND_URL =  environment.apiUrl + '/user/';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticated = false;
  private token: string;
  private tokenTimer: any;
  private userId: string;
  private authStatusListner = new Subject<boolean>();

  constructor(private http: HttpClient, private router: Router) { }

  getIsAuth() {
    return this.isAuthenticated;
  }

  getUserId() {
    return this.userId;
  }

  getAuthSatusListner() {
    return this.authStatusListner.asObservable();
  }

  getToken() {
    return this.token;
  }

  createUser(email: string, password: string) {
    const authData: AuthData = {email: email, password: password};
    this.http.post<{token: string}>(BAKEND_URL + '/signup', authData)
      .subscribe(() => {
        this.router.navigate(['/']);
      }, error => {
        this.authStatusListner.next(false);
      });
  }

  login(email: string, password: string) {
    const authData: AuthData = {email: email, password: password};
    this.http.post<{token: string, expiresIn: number, userId: string}>(BAKEND_URL + '/login', authData)
      .subscribe(response => {
        const token = response.token;
        this.token = token;
        if (token) {
          const expiresInDuration = response.expiresIn;
          this.setAuthTimer(expiresInDuration);
          console.log(expiresInDuration);
          this.isAuthenticated = true;
          this.userId = response.userId;
          this.authStatusListner.next(true);
          const now = new Date();
          const expirationDate = new Date(now.getTime() + expiresInDuration * 1000);
          console.log(expirationDate);
          this.saveAuthData(token, expirationDate, this.userId);
          this.router.navigate(['/']);
        // console.log(response);
        }
      }, error => {
        this.authStatusListner.next(false);
      });
  }

  autoAuthUser() {
    const authInfomation = this.getAuthData();
    if (!authInfomation) {
      return;
    }
    const now = new Date();
    const expiresIn = authInfomation.expirationDate.getTime() - now.getTime();
    if (expiresIn > 0) {
      this.token = authInfomation.token;
      this.isAuthenticated = true;
      this.userId = authInfomation.userId;
      this.setAuthTimer(expiresIn / 1000);
      this.authStatusListner.next(true);
    }
  }

  logout() {
    this.token = null;
    this.isAuthenticated = false;
    this.authStatusListner.next(false);
    this.userId = null;
    clearTimeout(this.tokenTimer);
    this.clearAuthData();
    this.router.navigate(['/']);
  }

  private setAuthTimer(duration: number) {
    console.log('Setting timer: ' + duration);
    this.tokenTimer = setTimeout(() => {
      this.logout();
    }, duration * 1000);
  }

  private saveAuthData(token: string, expirationDate: Date, userId: string) {
    localStorage.setItem('token', token);
    localStorage.setItem('expiration', expirationDate.toISOString());
    localStorage.setItem('userId', userId);
  }

  private clearAuthData() {
    localStorage.removeItem('token');
    localStorage.removeItem('expiration');
    localStorage.removeItem('userId');
  }

  private getAuthData() {
    const token = localStorage.getItem('token');
    const expirationDate = localStorage.getItem('expiration');
    const userId = localStorage.getItem('userId');
    if (!token || !expirationDate) {
      return;
    }
    return {
      token: token,
      expirationDate: new Date(expirationDate),
      userId: userId
    };
  }
}
