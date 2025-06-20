import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
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
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButtons,
  IonModal,
} from '@ionic/angular/standalone';
import { DataService, Producto, Categoria } from './data.service';

@Component({
  selector: 'app-carta',
  templateUrl: './carta.page.html',
  styleUrls: ['./carta.page.scss'],
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
    IonButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButtons,
    IonModal,
    CommonModule,
  ],
})
export class CartaPage implements OnInit {
  mesa: string = '';
  categorias: Categoria[] = [];
  productos: Producto[] = [];
  seleccionados: { [id: number]: { cantidad: number; opciones: string[] } } =
    {};
  comandaMesa: any = null;
  categoriaSeleccionada: string = '';
  historialComandasMesa: any[] = [];
  pagoSolicitado: boolean = false;

  constructor(
    private dataService: DataService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.categorias = this.dataService.getCategorias();
    this.productos = this.dataService.getProductos();
    this.route.queryParams.subscribe((params) => {
      this.mesa = params['mesa'] || '';
      this.cargarComandaMesa();
    });
    if (this.categorias.length) {
      this.categoriaSeleccionada = this.categorias[0].nombre;
    }
  }

  solicitarPago() {
    // Marca todas las comandas de la mesa como 'pago_pendiente' para que el admin lo vea
    const comandas = JSON.parse(localStorage.getItem('comandas') || '[]');
    let modificado = false;
    comandas.forEach((c: any) => {
      if (c.mesa == this.mesa && c.estado !== 'pagado') {
        c.estado = 'pago_pendiente';
        modificado = true;
      }
    });
    if (modificado) {
      localStorage.setItem('comandas', JSON.stringify(comandas));
    }
    this.mostrarResumenPago = true;
    this.pagoSolicitado = true;
  }

  // Al cargar comandas, detecta si hay pago solicitado
  cargarComandaMesa() {
    if (!this.mesa) return;
    const comandas = JSON.parse(localStorage.getItem('comandas') || '[]');
    this.historialComandasMesa = comandas
      .filter((c: any) => c.mesa == this.mesa)
      .sort(
        (a: any, b: any) =>
          new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      );
    this.comandaMesa = this.historialComandasMesa[0] || null;
    // Si alguna comanda está en pago_pendiente, bloquea añadir
    this.pagoSolicitado = this.historialComandasMesa.some(
      (c: any) => c.estado === 'pago_pendiente'
    );
  }

  cerrarResumenPago() {
    this.mostrarResumenPago = false;
  }

  enviarPedido() {
    const pedido = {
      mesa: this.mesa,
      fecha: new Date().toISOString(),
      items: this.seleccionadosKeys().map((id) => {
        const prod = this.productos.find((p) => p.id === id);
        return {
          id: prod?.id,
          nombre: prod?.nombre,
          cantidad: this.seleccionados[id].cantidad,
          opciones: this.seleccionados[id].opciones,
        };
      }),
    };
    // Guardar pedido en localStorage (simulación de backend)
    const pedidos = JSON.parse(localStorage.getItem('comandas') || '[]');
    pedidos.push(pedido);
    localStorage.setItem('comandas', JSON.stringify(pedidos));
    this.seleccionados = {};
    alert('¡Pedido enviado!');
    this.cargarComandaMesa();
  }

  pagarMesa() {
    this.mostrarResumenPago = true;
  }

  mostrarResumenPago: boolean = false;

  agregarProducto(producto: Producto) {
    if (this.pagoSolicitado) return;
    if (!this.seleccionados[producto.id]) {
      this.seleccionados[producto.id] = { cantidad: 1, opciones: [] };
    } else {
      this.seleccionados[producto.id].cantidad++;
    }
  }

  quitarProducto(producto: Producto) {
    if (this.pagoSolicitado) return;
    if (this.seleccionados[producto.id]) {
      this.seleccionados[producto.id].cantidad--;
      if (this.seleccionados[producto.id].cantidad <= 0) {
        delete this.seleccionados[producto.id];
      }
    }
  }

  toggleOpcion(producto: Producto, opcion: string) {
    if (this.pagoSolicitado) return;
    const sel = this.seleccionados[producto.id];
    if (!sel) return;
    const idx = sel.opciones.indexOf(opcion);
    if (idx > -1) {
      sel.opciones.splice(idx, 1);
    } else {
      sel.opciones.push(opcion);
    }
  }

  seleccionadosKeys(): number[] {
    return Object.keys(this.seleccionados).map((id: string) => +id);
  }

  seleccionarCategoria(nombre: string) {
    this.categoriaSeleccionada = nombre;
  }

  getProductosPorCategoriaSeleccionada() {
    return this.productos.filter(
      (p) => p.categoria === this.categoriaSeleccionada
    );
  }

  getNombreProducto(id: number) {
    const prod = this.productos.find((p) => p.id === id);
    return prod ? prod.nombre : '';
  }

  getPrecioProducto(id: number): number {
    const prod = this.productos.find((p) => p.id === id);
    return prod ? prod.precio : 0;
  }

  getTotalPedido(): number {
    return this.seleccionadosKeys().reduce((total, id) => {
      const precio = this.getPrecioProducto(id);
      const cantidad = this.seleccionados[id].cantidad;
      return total + precio * cantidad;
    }, 0);
  }

  getTotalHistorialMesa(): number {
    return this.historialComandasMesa.reduce((total, comanda) => {
      return (
        total +
        comanda.items.reduce((subtotal: number, item: any) => {
          const prod = this.productos.find((p) => p.id === item.id);
          return subtotal + (prod ? prod.precio * item.cantidad : 0);
        }, 0)
      );
    }, 0);
  }
}
