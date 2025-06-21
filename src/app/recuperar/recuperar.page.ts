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
  ],
})
export class RecuperarPage {
  correo = '';
  usuario = '';
  barId = '';
  nuevaPassword = '';
  error = '';
  exito = '';
  mostrarCambio = false;

  constructor(private dataService: DataService, private router: Router) {}

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
      this.error = 'No se encontró ningún usuario con ese correo.';
    }
  }

  async cambiarPassword() {
    this.error = '';
    this.exito = '';
    try {
      await this.dataService.cambiarPasswordUsuario(
        this.barId,
        this.usuario,
        this.nuevaPassword
      );
      this.exito = 'Contraseña actualizada. Ya puedes iniciar sesión.';
      setTimeout(() => this.router.navigate(['/login']), 2000);
    } catch (e) {
      this.error = 'Error al actualizar la contraseña.';
    }
  }
}
