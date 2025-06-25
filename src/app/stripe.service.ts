import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StripeService {
  async redirectToCheckout(sessionId: string) {
    const stripe = (window as any).Stripe('pk_test_TU_CLAVE_PUBLICA'); // Reemplaza por tu clave pública
    await stripe.redirectToCheckout({ sessionId });
  }
}
