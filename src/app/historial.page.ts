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
  IonSegment,
  IonSegmentButton,
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
    IonSegment,
    IonSegmentButton,
    TranslateModule,
  ],
})
export class HistorialPage implements OnInit {
  historial$: Observable<any[]>;
  filtroFecha: string = '';
  filtroMesa: string = '';
  barId: string = '';
  historialFiltrado: any[] = [];
  agrupadoPorMesa: any = {};
  mesas: string[] = [];
  resumenDia: { total: number; mesas: number } = { total: 0, mesas: 0 };

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
    // Siempre que se pulse aplicar filtros, limpiar el filtro de mesa
    this.filtroMesa = '';
    if (!this.filtroFecha) {
      this.historialFiltrado = [];
      this.agrupadoPorMesa = {};
      this.mesas = [];
      this.resumenDia = { total: 0, mesas: 0 };
      return;
    }
    const fecha = this.filtroFecha;
    // No filtrar por mesa en la consulta, solo por fecha
    const obs = this.dataService.getHistorialFiltrado(this.barId, fecha);
    const pedidos = await firstValueFrom(obs);
    let filtrados = pedidos;
    this.historialFiltrado = filtrados;
    this.agrupadoPorMesa = {};
    filtrados.forEach((p) => {
      const mesaKey = p['mesa'] || 'Sin mesa';
      if (!this.agrupadoPorMesa[mesaKey]) this.agrupadoPorMesa[mesaKey] = [];
      this.agrupadoPorMesa[mesaKey].push(p);
    });
    this.mesas = Object.keys(this.agrupadoPorMesa);
    this.resumenDia = {
      total: this.mesas.reduce((acc, mesa) => acc + this.getTotalMesa(mesa), 0),
      mesas: this.mesas.length,
    };
    // No modificar filtroMesa aquí, así el filtro visual permanece
  }

  filtrarSoloVistaMesa() {
    // No hace nada, solo fuerza el refresco de la vista por ngModel
  }

  getTotalMesa(mesa: string): number {
    if (!this.agrupadoPorMesa[mesa]) return 0;
    // Sumar todos los totales de todos los registros de la mesa (resumen_mesa y comandas individuales)
    return this.agrupadoPorMesa[mesa].reduce(
      (sum: number, p: any) => sum + (p.total || 0),
      0
    );
  }
}
