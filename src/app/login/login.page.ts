import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonGrid,
  IonRow,
  IonCol,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonText,
  IonButtons,
  IonIcon,
  IonPopover,
  IonCard,
  IonCardHeader,
  IonCardContent,
  IonSpinner,
  PopoverController,
} from '@ionic/angular/standalone';
import { Router, RouterModule } from '@angular/router';
import { DataService } from '../data.service';
import { LanguageService } from '../language.service';
import { LanguageSelectorComponent } from '../language-selector.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonGrid,
    IonRow,
    IonCol,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonText,
    IonButtons,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardContent,
    IonSpinner,
    CommonModule,
    FormsModule,
    RouterModule,
    TranslateModule,
  ],
})
export class LoginPage implements OnInit {
  usuario = '';
  password = '';
  error = '';
  loading = false;

  constructor(
    private router: Router,
    private dataService: DataService,
    private languageService: LanguageService,
    private popoverController: PopoverController,
    private translate: TranslateService
  ) {}

  ngOnInit() {}

  async login() {
    this.error = '';
    this.loading = true;
    try {
      // Nota: 'usuario' en el input ahora se trata como el 'correo' electrónico
      const result = await this.dataService.loginMultiBar(
        this.usuario,
        this.password
      );
      if (result) {
        console.log('Login exitoso para:', result.usuario.correo);
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('usuario', result.barId); // Aquí result.barId es el UID de Auth
        localStorage.setItem('correo', result.usuario.correo);
        
        // Obtener y guardar trialStart
        this.dataService.getTrialStart(result.barId).then((data: any) => {
          const trialStart = data?.trialStart || new Date().toISOString();
          localStorage.setItem('trialStart', trialStart);
        });

        // Operación en segundo plano
        this.fetchAndSaveSubscriptionProductName(
          result.barId,
          result.usuario.correo
        ).catch((e) =>
          console.warn('No se pudo obtener subscriptionProductName', e)
        );

        this.router.navigate(['/admin']);
      } else {
        this.error = this.translate.instant('LOGIN.ERROR_INVALID');
      }
    } catch (e) {
      console.error('Login error:', e);
      this.error = this.translate.instant('LOGIN.ERROR_CONNECTION');
    }
    this.loading = false;
  }

  private async fetchAndSaveSubscriptionProductName(
    barId: string,
    correo: string
  ) {
    if (!correo) return;
    const backendUrl =
      window.location.hostname === 'localhost' && window.location.protocol === 'http:'
        ? 'http://localhost:3000'
        : 'https://backendelcomensal.onrender.com';
    try {
      const res = await fetch(`${backendUrl}/get-customer-by-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: correo }),
      });
      if (res.status === 404) {
        // usuario no encontrado: limpiar key local y en Firestore
        localStorage.removeItem('subscriptionProductName');
        try {
          await this.dataService.setSubscriptionProductName(barId, '');
        } catch (e) {}
        return;
      }
      if (res.ok) {
        const data = await res.json();
        const customerId = data.customerId;
        if (!customerId) return;
        const resp = await fetch(`${backendUrl}/check-subscription`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customerId }),
        });
        if (resp.status === 200) {
          const sub = await resp.json();
          const productName =
            sub?.items &&
            Array.isArray(sub.items) &&
            sub.items[0]?.product?.name
              ? sub.items[0].product.name
              : null;
          if (productName) {
            try {
              localStorage.setItem('subscriptionProductName', productName);
            } catch (e) {}
            try {
              await this.dataService.setSubscriptionProductName(
                barId,
                productName
              );
            } catch (e) {
              console.warn(
                'Error guardando subscriptionProductName en Firestore',
                e
              );
            }
          }
        }
      }
    } catch (e) {
      console.warn('Error fetching subscription info:', e);
    }
  }

  getCurrentLanguageFlag(): string {
    return this.languageService.getLanguageFlag(
      this.languageService.getCurrentLanguage()
    );
  }

  goHome() {
    this.router.navigate(['/home']);
  }

  async presentLanguagePopover(event: any) {
    const popover = await this.popoverController.create({
      component: LanguageSelectorComponent,
      event: event,
      translucent: true,
      showBackdrop: true,
      backdropDismiss: true,
    });
    return await popover.present();
  }
}
