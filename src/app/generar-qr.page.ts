import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonInput,
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButtons,
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-generar-qr',
  templateUrl: './generar-qr.page.html',
  styleUrls: ['./generar-qr.page.scss'],
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonInput,
    IonButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButtons, // Asegura que IonButtons está importado
    CommonModule,
    FormsModule,
  ],
})
export class GenerarQrPage {
  mesa: string = '';
  qrUrl: string = '';
  barId: string = '';

  constructor(private router: Router) {
    // Obtener barId del usuario logado (ajusta según tu lógica de login)
    const usuario = localStorage.getItem('usuario');
    this.barId = usuario ? usuario : 'bar-demo';
  }

  goToAdmin() {
    this.router.navigate(['/admin']);
  }

  generarQR() {
    if (!this.mesa) return;
    // URL base de la carta pública con barId
    const baseUrl =
      window.location.origin +
      '/carta/' +
      encodeURIComponent(this.barId) +
      '?mesa=' +
      encodeURIComponent(this.mesa);
    this.qrUrl =
      'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' +
      encodeURIComponent(baseUrl);
  }

  descargarQR() {
    if (!this.qrUrl) return;
    const link = document.createElement('a');
    link.href = this.qrUrl;
    link.download = `qr-mesa-${this.mesa}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  imprimirQR() {
    if (!this.qrUrl) return;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`
        <html><head><title>Imprimir QR Mesa ${this.mesa}</title></head><body style='text-align:center;'>
        <h2>QR Mesa ${this.mesa}</h2>
        <img src='${this.qrUrl}' style='background:#fff; padding:8px; border-radius:8px;'/><br><br>
        <button onclick='window.print()' style='font-size:1.2em;padding:0.5em 2em;'>Imprimir</button>
        </body></html>
      `);
      win.document.close();
    }
  }
}
