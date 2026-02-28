import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet, IonButton } from '@ionic/angular/standalone';
import { LanguageService } from './language.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [IonApp, IonRouterOutlet, CommonModule, RouterModule, IonButton],
})
export class AppComponent implements OnInit {
  showCookieBanner: boolean = false;

  constructor(private languageService: LanguageService) {}

  ngOnInit() {
    // Check if user has already accepted or declined cookies
    const cookieConsent = localStorage.getItem('cookieConsent');
    if (!cookieConsent) {
      setTimeout(() => {
        this.showCookieBanner = true;
      }, 1500); // Delayed show so it doesn't pop instantly 
    }
  }

  acceptCookies() {
    localStorage.setItem('cookieConsent', 'accepted');
    this.showCookieBanner = false;
    // Here you would normally initialize Google Analytics or Facebook Pixel
  }

  declineCookies() {
    localStorage.setItem('cookieConsent', 'declined');
    this.showCookieBanner = false;
    // Here you would ensure non-essential cookies are blocked
  }
}
