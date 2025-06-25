import { Component } from '@angular/core';
import { StripeService } from '../stripe.service';
import { IonContent, IonButton } from '@ionic/angular/standalone';

@Component({
  selector: 'app-suscripcion',
  standalone: true,
  imports: [IonContent, IonButton],
  template: `
    <ion-content>
      <h2>Suscríbete</h2>
      <p>Prueba gratis 1 mes, luego 15 €/mes.</p>
      <ion-button (click)="pagar()">Suscribirse</ion-button>
    </ion-content>
  `,
})
export class SuscripcionPage {
  constructor(private stripeService: StripeService) {}

  async pagar() {
    // Debes obtener el sessionId desde tu backend
    const sessionId = await this.getSessionIdFromBackend();
    this.stripeService.redirectToCheckout(sessionId);
  }

  async getSessionIdFromBackend(): Promise<string> {
    // Llama a tu backend para crear la sesión de Stripe
    // return await this.http.post<{id: string}>('/api/create-checkout-session', {}).toPromise().then(r => r.id);
    alert('Debes implementar un backend para obtener el sessionId de Stripe.');
    return '';
  }
}
