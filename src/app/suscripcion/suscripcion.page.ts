import { Component } from '@angular/core';
import { StripeService } from '../stripe.service';
import { IonContent, IonButton } from '@ionic/angular/standalone';
import { TranslateService, TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-suscripcion',
  standalone: true,
  imports: [IonContent, IonButton, TranslateModule],
  template: `
    <ion-content>
      <h2>{{ 'SUBSCRIPTION.TITLE' | translate }}</h2>
      <p>{{ 'SUBSCRIPTION.DESCRIPTION' | translate }}</p>
      <ion-button (click)="pagar()">{{
        'SUBSCRIPTION.BUTTON' | translate
      }}</ion-button>
    </ion-content>
  `,
})
export class SuscripcionPage {
  constructor(
    private stripeService: StripeService,
    private translate: TranslateService
  ) {}

  async pagar() {
    // Debes obtener el sessionId desde tu backend
    const sessionId = await this.getSessionIdFromBackend();
    this.stripeService.redirectToCheckout(sessionId);
  }

  async getSessionIdFromBackend(): Promise<string> {
    // Llama a tu backend para crear la sesión de Stripe
    // return await this.http.post<{id: string}>('/api/create-checkout-session', {}).toPromise().then(r => r.id);
    alert(this.translate.instant('SUBSCRIPTION.STRIPE_ALERT'));
    return '';
  }
}
