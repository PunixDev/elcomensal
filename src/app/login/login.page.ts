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
} from '@ionic/angular/standalone';
import { Router, RouterModule } from '@angular/router';
import { DataService } from '../data.service';
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
    CommonModule,
    FormsModule,
    RouterModule,
  ],
})
export class LoginPage implements OnInit {
  usuario = '';
  password = '';
  error = '';
  loading = false;

  constructor(private router: Router, private dataService: DataService) {}

  ngOnInit() {}

  async login() {
    this.error = '';
    this.loading = true;
    try {
      const result = await this.dataService.loginMultiBar(
        this.usuario,
        this.password
      );
      if (result) {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('usuario', result.barId); // Guardar barId real
        this.router.navigate(['/admin']);
      } else {
        this.error = 'Usuario o contraseña incorrectos';
      }
    } catch (e) {
      this.error = 'Error de conexión o de base de datos';
    }
    this.loading = false;
  }
}
