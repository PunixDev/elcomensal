import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonBackButton,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-aviso-legal',
  templateUrl: './aviso-legal.page.html',
  styleUrls: ['./aviso-legal.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonBackButton,
    CommonModule,
    FormsModule,
  ],
})
export class AvisoLegalPage implements OnInit {
  constructor() {}

  ngOnInit() {}
}
