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
import { DataService } from '../data.service';
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
    // Filtrar productos seleccionados y crear resumen del pedido
    const productosPedido = this.productosAgrupados
      .filter((prod) => this.seleccionados[prod.id] > 0)
      .map((prod) => ({
        id: prod.id,
        nombre: prod.nombre,
        cantidad: this.seleccionados[prod.id],
        opciones: prod.opciones,
        precio: prod.precio,
      }));

    // Restar las cantidades seleccionadas de los productos agrupados
    for (const pedido of productosPedido) {
      // Buscar la entrada correspondiente en productosAgrupados
      const prodIndex = this.productosAgrupados.findIndex((p) => {
        if (p.id !== pedido.id) return false;
        // comparar opciones (ambas arrays) conservativamente
        const a = p.opciones || [];
        const b = pedido.opciones || [];
        return (
          a.length === b.length &&
          a.every((val: any, i: number) => val === b[i])
        );
      });
      if (prodIndex !== -1) {
        const target = this.productosAgrupados[prodIndex];
        // Restar la cantidad seleccionada, sin bajar de 0
        target.cantidad = Math.max(0, target.cantidad - pedido.cantidad);
        // Si la cantidad queda 0, se eliminará más abajo
      }
      // Resetear la selección del producto
      this.seleccionados[pedido.id] = 0;
    }

    // Eliminar productos cuya cantidad sea 0
    this.productosAgrupados = this.productosAgrupados.filter(
      (p) => p.cantidad > 0
    );

    // Aquí puedes enviar `productosPedido` al backend o mostrar un resumen
    // console.log('Pedido por separado:', productosPedido);
  }

  imprimir() {
    const element = document.getElementById('printable-report');
    if (!element) {
      console.error('Área imprimible no encontrada');
      return;
    }
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      console.error('No se pudo abrir la ventana de impresión');
      return;
    }
    const styles = `
      <style>
        body { font-family: Arial, Helvetica, sans-serif; margin: 20px; }
        h2 { font-size: 18px; }
        ion-card { box-shadow: none; }
      </style>
    `;
    printWindow.document.write(
      '<html><head><title>Informe Mesa - ' +
        this.mesa +
        '</title>' +
        styles +
        '</head><body>'
    );
    printWindow.document.write(element.innerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    // Asegurar que el contenido se cargue antes de imprimir
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      // printWindow.close();
    };
  }

  volver() {
    this.router.navigate(['/admin']);
  }
}
