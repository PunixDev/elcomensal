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
import { Router } from '@angular/router';

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
  ],
})
export class LoginPage implements OnInit {
  usuario = '';
  password = '';
  error = '';

  constructor(private router: Router) {}

  ngOnInit() {}

  login() {
    // Usuario y contraseña fijos para demo
    if (this.usuario === 'admin' && this.password === 'admin') {
      this.error = '';
      localStorage.setItem('isLoggedIn', 'true');
      this.router.navigate(['/admin']);
    } else {
      this.error = 'Usuario o contraseña incorrectos';
    }
  }
}
