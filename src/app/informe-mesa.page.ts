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
import { TranslateModule } from '@ngx-translate/core';

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
    TranslateModule,
  ],
})
export class InformeMesaPage implements OnInit {
  mesa: string = '';
  comandas: any[] = [];
  productos: any[] = [];
  barId: string = '';
  productosAgrupados: any[] = [];
  seleccionados: { [key: string]: number } = {};

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
      this.agruparProductos();
    });
    this.dataService.getProductos(this.barId).subscribe((productos) => {
      this.productos = productos;
      this.agruparProductos();
    });
  }

  agruparProductos() {
    if (!this.comandas.length || !this.productos.length) return;
    const agrupados: { [key: string]: any } = {};
    for (const comanda of this.comandas) {
      for (const item of comanda.items) {
        const key =
          item.id + '|' + (item.opciones ? item.opciones.join(',') : '');
        if (!agrupados[key]) {
          const prod = this.productos.find((p: any) => p.id === item.id);
          agrupados[key] = {
            id: item.id,
            nombre: prod ? prod.nombre : item.nombre,
            opciones: item.opciones || [],
            cantidad: 0,
            precio: prod ? prod.precio : 0,
          };
        }
        agrupados[key].cantidad += item.cantidad;
      }
    }
    this.productosAgrupados = Object.values(agrupados);
    // Inicializar seleccionados si no existe
    for (const prod of this.productosAgrupados) {
      if (this.seleccionados[prod.id] === undefined) {
        this.seleccionados[prod.id] = 0;
      }
    }
  }

  sumarSeleccion(prod: any) {
    if (this.seleccionados[prod.id] < prod.cantidad) {
      this.seleccionados[prod.id]++;
    }
  }
  restarSeleccion(prod: any) {
    if (this.seleccionados[prod.id] > 0) {
      this.seleccionados[prod.id]--;
    }
  }

  getTotalSeleccionado() {
    let total = 0;
    for (const prod of this.productosAgrupados) {
      total += prod.precio * (this.seleccionados[prod.id] || 0);
    }
    return total;
  }

  pedirPorSeparado() {
    // Filtrar productos seleccionados
    const productosPedido = this.productosAgrupados
      .filter((prod) => this.seleccionados[prod.id] > 0)
      .map((prod) => ({
        id: prod.id,
        nombre: prod.nombre,
        cantidad: this.seleccionados[prod.id],
        opciones: prod.opciones,
        precio: prod.precio,
      }));
    // Eliminar de la lista los productos seleccionados
    this.productosAgrupados = this.productosAgrupados.filter(
      (prod) => !this.seleccionados[prod.id] || this.seleccionados[prod.id] < 1
    );
    // Limpiar seleccionados de los eliminados
    for (const prod of productosPedido) {
      this.seleccionados[prod.id] = 0;
    }
    // Puedes mostrar un resumen o enviar a la base de datos aquí si lo necesitas
    // alert('Pedido por separado:\n' + JSON.stringify(productosPedido, null, 2));
  }

  volver() {
    this.router.navigate(['/admin']);
  }
}
