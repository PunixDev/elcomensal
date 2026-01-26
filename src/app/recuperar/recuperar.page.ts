import { Component } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonText,
  IonButtons,
  IonIcon,
  IonCard,
  IonCardContent,
  IonSpinner,
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../data.service';
import { Router, RouterModule } from '@angular/router';
import { TranslateService, TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-recuperar',
  templateUrl: './recuperar.page.html',
  styleUrls: ['./recuperar.page.scss'],
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonText,
    IonButtons,
    IonIcon,
    IonCard,
    IonCardContent,
    IonSpinner,
    CommonModule,
    FormsModule,
    RouterModule,
    TranslateModule,
  ],
})
export class RecuperarPage {
  correo = '';
  usuario = '';
  barId = '';
  nuevaPassword = '';
  confirmarPassword = '';
  error = '';
  exito = '';
  mostrarCambio = false;

  loading = false;

  constructor(
    private dataService: DataService,
    private router: Router,
    private translate: TranslateService
  ) {}

  async enviarEnlaceRecuperacion() {
    if (!this.correo) return;
    this.error = '';
    this.exito = '';
    this.loading = true;

    const res = await this.dataService.recuperarPassword(this.correo);
    if (res.success) {
      this.exito = this.translate.instant('RECOVER.SUCCESS_MESSAGE');
      // Limpiar el campo para evitar envíos múltiples accidentales
      this.correo = '';
    } else {
      if (res.error === 'auth/user-not-found') {
        this.error = this.translate.instant('RECOVER.ERROR_NOT_FOUND');
      } else {
        this.error = this.translate.instant('RECOVER.ERROR_MESSAGE');
      }
    }
    this.loading = false;
  }

  goBack() {
    this.router.navigate(['/login']);
  }
}
