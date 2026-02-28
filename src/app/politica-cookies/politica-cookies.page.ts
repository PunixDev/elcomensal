import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton } from '@ionic/angular/standalone';

@Component({
  selector: 'app-politica-cookies',
  templateUrl: './politica-cookies.page.html',
  styleUrls: ['./politica-cookies.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, CommonModule, FormsModule]
})
export class PoliticaCookiesPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
