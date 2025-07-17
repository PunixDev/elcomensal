import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-suscripcion',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './suscripcion.page.html',
  styleUrls: ['./suscripcion.page.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SuscripcionPage {
  loading = false;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    if (
      !document.querySelector(
        'script[src="https://js.stripe.com/v3/pricing-table.js"]'
      )
    ) {
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/pricing-table.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }
}
