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
import { Router } from '@angular/router';
import { DataService } from '../data.service';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.page.html',
  styleUrls: ['./registro.page.scss'],
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
  ],
})
export class RegistroPage {
  nombreBar = '';
  usuarioAdmin = '';
  password = '';
  correo = '';
  error = '';
  exito = '';

  constructor(private dataService: DataService, private router: Router) {}

  async registrarBar() {
    this.error = '';
    this.exito = '';
    if (
      !this.nombreBar ||
      !this.usuarioAdmin ||
      !this.password ||
      !this.correo
    ) {
      this.error = 'Completa todos los campos.';
      return;
    }
    try {
      await this.dataService.registrarBar({
        nombre: this.nombreBar,
        usuario: this.usuarioAdmin,
        password: this.password,
        correo: this.correo,
      });
      this.exito = '¡Bar registrado correctamente! Ya puedes iniciar sesión.';
      setTimeout(() => this.router.navigate(['/login']), 2000);
    } catch (e) {
      this.error =
        'Error al registrar el bar. Intenta con otro usuario o correo.';
    }
  }
}
