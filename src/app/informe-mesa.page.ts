import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButton,
  IonList,
  IonItem,
  IonLabel,
  IonButtons,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItemDivider,
} from '@ionic/angular/standalone';
import { DataService } from './data.service';

@Component({
  selector: 'app-informe-mesa',
  templateUrl: './informe-mesa.page.html',
  styleUrls: [],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButton,
    IonList,
    IonItem,
    IonLabel,
    IonButtons,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItemDivider,
  ],
})
export class InformeMesaPage implements OnInit {
  mesa: string = '';
  comandas: any[] = [];
  productos: any[] = [];
  seleccionados: any[] = [];
  barId: string = '';
  unidades: any[] = [];
  tachados: any[] = [];

  unidadesAgrupadas: any[] = [];
  seleccionadasAgrupadas: { [key: string]: number } = {};
  tachadasAgrupadas: { [key: string]: number } = {};

  constructor(
    private route: ActivatedRoute,
    private dataService: DataService,
    private router: Router
  ) {
    this.barId = this.dataService.getBarId();
  }

  async ngOnInit() {
    this.mesa = this.route.snapshot.paramMap.get('mesa') || '';
    this.dataService.getComandas(this.barId).subscribe((comandas) => {
      this.comandas = comandas.filter(
        (c: any) =>
          (c.mesa || '').trim().toLowerCase() === this.mesa.trim().toLowerCase()
      );
      // Agrupar productos por id+nombre+opciones
      const agrupadas: { [key: string]: any } = {};
      for (const comanda of this.comandas) {
        for (const item of comanda.items) {
          const key =
            item.id +
            '|' +
            item.nombre +
            '|' +
            (item.opciones ? item.opciones.join(',') : '');
          if (!agrupadas[key]) {
            agrupadas[key] = {
              ...item,
              cantidad: 0,
              _key: key,
              _opciones: item.opciones ? [...item.opciones] : [],
              _comandas: [],
            };
          }
          agrupadas[key].cantidad += item.cantidad;
          agrupadas[key]._comandas.push({
            comandaId: comanda.id,
            fecha: comanda.fecha,
          });
        }
      }
      this.unidadesAgrupadas = Object.values(agrupadas);
    });
    this.dataService.getProductos(this.barId).subscribe((productos) => {
      this.productos = productos;
    });
  }

  getTotalSeleccionado() {
    let total = 0;
    for (const unidad of this.unidadesAgrupadas) {
      const prod = this.productos.find((p: any) => p.id === unidad.id);
      const sel = this.seleccionadasAgrupadas[unidad._key] || 0;
      total += prod ? prod.precio * sel : 0;
    }
    return total;
  }

  sumarSeleccion(unidad: any) {
    const key = unidad._key;
    const max = unidad.cantidad - (this.tachadasAgrupadas[key] || 0);
    if ((this.seleccionadasAgrupadas[key] || 0) < max) {
      this.seleccionadasAgrupadas[key] =
        (this.seleccionadasAgrupadas[key] || 0) + 1;
    }
  }
  restarSeleccion(unidad: any) {
    const key = unidad._key;
    if ((this.seleccionadasAgrupadas[key] || 0) > 0) {
      this.seleccionadasAgrupadas[key] =
        (this.seleccionadasAgrupadas[key] || 0) - 1;
    }
  }
  marcarPagados() {
    for (const key in this.seleccionadasAgrupadas) {
      if (this.seleccionadasAgrupadas[key]) {
        this.tachadasAgrupadas[key] =
          (this.tachadasAgrupadas[key] || 0) + this.seleccionadasAgrupadas[key];
        this.seleccionadasAgrupadas[key] = 0;
      }
    }
  }
  unidadesPendientes(unidad: any) {
    const key = unidad._key;
    return unidad.cantidad - (this.tachadasAgrupadas[key] || 0);
  }
  unidadesTachadas(unidad: any) {
    const key = unidad._key;
    return this.tachadasAgrupadas[key] || 0;
  }

  volver() {
    this.router.navigate(['/admin']);
  }
}
