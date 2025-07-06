import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonList,
  IonItemDivider,
  IonInput,
  IonButtons,
  IonBackButton,
  IonDatetime,
  IonButton,
} from '@ionic/angular/standalone';
import { DataService } from './data.service';
import { Observable, firstValueFrom } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-historial',
  templateUrl: './historial.page.html',
  styleUrls: [],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonList,
    IonItemDivider,
    IonInput,
    IonButtons,
    IonBackButton,
    IonDatetime,
    IonButton,
    TranslateModule,
  ],
})
export class HistorialPage implements OnInit {
  historial$: Observable<any[]>;
  filtroFecha: string = '';
  filtroMesa: string = '';
  barId: string = '';
  historialFiltrado: any[] = [];

  constructor(private dataService: DataService) {
    this.barId = this.dataService.getBarId();
    this.historial$ = this.dataService.getHistorial(this.barId);
  }

  async ngOnInit() {
    // Al abrir la página, mostrar los pedidos de hoy
    this.filtroFecha = new Date().toISOString().slice(0, 10);
    await this.aplicarFiltrosAsync();
  }

  setFecha(event: any) {
    const value = event?.detail?.value;
    this.filtroFecha = Array.isArray(value) ? value[0] || '' : value || '';
  }

  async aplicarFiltrosAsync() {
    if (!this.filtroFecha) {
      this.historialFiltrado = [];
      return;
    }
    const fecha = this.filtroFecha;
    // Traer todos los pedidos del día y filtrar por mesa en el frontend
    const obs = this.dataService.getHistorialFiltrado(this.barId, fecha);
    const pedidos = await firstValueFrom(obs);
    let mesa = this.filtroMesa?.trim().toLowerCase();
    if (mesa) {
      this.historialFiltrado = pedidos.filter(
        (p) => (p['mesa'] || '').trim().toLowerCase() === mesa
      );
    } else {
      this.historialFiltrado = pedidos;
    }
  }
}
