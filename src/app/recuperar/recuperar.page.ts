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
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../data.service';
import { Router } from '@angular/router';
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
    CommonModule,
    FormsModule,
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

  constructor(
    private dataService: DataService,
    private router: Router,
    private translate: TranslateService
  ) {}

  async buscarUsuario() {
    this.error = '';
    this.exito = '';
    this.mostrarCambio = false;
    const res = await this.dataService.buscarUsuarioPorCorreo(this.correo);
    if (res) {
      this.usuario = res.usuario;
      this.barId = res.barId;
      this.mostrarCambio = true;
    } else {
      this.error = this.translate.instant('RECOVER.ERROR_NOT_FOUND');
    }
  }

  async cambiarPassword() {
    this.error = '';
    this.exito = '';
    if (this.nuevaPassword !== this.confirmarPassword) {
      this.error = this.translate.instant('RECOVER.ERROR_PASSWORDS_NOT_MATCH');
      return;
    }
    try {
      await this.dataService.cambiarPasswordUsuario(
        this.barId,
        this.usuario,
        this.nuevaPassword
      );
      this.exito = this.translate.instant('RECOVER.SUCCESS');
      setTimeout(() => this.router.navigate(['/login']), 2000);
    } catch (e) {
      this.error = this.translate.instant('RECOVER.ERROR_UPDATE');
    }
  }
}
