import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonLabel,
  IonItem,
  IonSegment,
  IonSegmentButton,
  IonModal, // Added
  IonButtons, // Added
} from '@ionic/angular/standalone';
import { DataService, Producto, Categoria } from './data.service';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { doc, getDoc } from '@angular/fire/firestore';

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
    IonButton,
    IonIcon,
    IonCard,
    IonCardContent,
    FormsModule,
    IonSegment,
    IonSegmentButton,
    IonModal, // Added
    IonButtons, // Added
    IonItem, // Añadido para solucionar error NG8001
    IonLabel, // Añadido para solucionar error NG8001
    CommonModule,
  ],
})
export class CartaPage implements OnInit {
  mesa: string = '';
  categorias$: Observable<Categoria[]> = undefined!;
  productos$: Observable<Producto[]> = undefined!;
  comandas$: Observable<any[]> = undefined!;
  productos: Producto[] = [];
  categorias: Categoria[] = [];
  historialComandasMesa: any[] = [];
  seleccionados: { [id: string]: { cantidad: number; opciones: string[] } } =
    {};
  opcionSeleccionTemp: { [id: string]: string } = {};
  comandaMesa: any = null;
  categoriaSeleccionada: string = '';
  pagoSolicitado: boolean = false;
  barId: string = '';
  mostrarResumenPago: boolean = false;
  modalResumenAbierto = false;
  mostrarHistorial: boolean = false;
  mostrarCarta: boolean = true;

  // Variables para imagen y nombre del restaurante
  restauranteNombre: string = '';
  restauranteImg: string = '';

  // Imagen ampliada para modal
  imagenAmpliada: string | null = null;

  constructor(
    private dataService: DataService,
    private route: ActivatedRoute
  ) {}

  async ngOnInit() {
    // Usar barId de la ruta si existe (path param), si no, query param, si no, localStorage
    this.route.paramMap.subscribe(async (params) => {
      const barIdFromPath = params.get('barId');
      this.route.queryParams.subscribe(async (qparams) => {
        this.mesa = qparams['mesa'] || '';
        if (barIdFromPath) {
          this.barId = barIdFromPath;
          localStorage.setItem('barId', this.barId);
        } else if (qparams['barId']) {
          this.barId = qparams['barId'];
          localStorage.setItem('barId', this.barId);
        } else if (localStorage.getItem('barId')) {
          this.barId = localStorage.getItem('barId')!;
        }
        if (!this.barId) {
          console.log(
            '[DEBUG] barId no encontrado en path, query ni localStorage. Params:',
            params,
            'Query:',
            qparams,
            'localStorage:',
            localStorage.getItem('barId')
          );
          alert(
            'No se ha encontrado el identificador del bar. Escanee el QR correcto o contacte con el establecimiento.'
          );
          return;
        }
        // Si el barId viene de la URL (usuario no logueado), fuerza la carga desde Firestore
        console.log('[DEBUG] Llamada a Firestore con barId:', this.barId);
        this.categorias$ = this.dataService.getCategorias(this.barId);
        this.productos$ = this.dataService.getProductos(this.barId);
        this.comandas$ = this.dataService.getComandas(this.barId);
        this.categorias$.subscribe((cats) => {
          console.log('[DEBUG] Respuesta Firestore categorias:', cats);
        });
        this.productos$.subscribe((prods) => {
          console.log('[DEBUG] Respuesta Firestore productos:', prods);
        });
        this.comandas$.subscribe((comandas) => {
          console.log('[DEBUG] Respuesta Firestore comandas:', comandas);
          const antesPago = this.pagoSolicitado;
          this.historialComandasMesa = comandas
            .filter((c: any) => c.mesa == this.mesa)
            .sort(
              (a: any, b: any) =>
                new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
            );
          this.comandaMesa = this.historialComandasMesa[0] || null;
          this.pagoSolicitado = this.historialComandasMesa.some(
            (c: any) => c.estado === 'pago_pendiente'
          );
          // Si ya no hay comandas para la mesa, limpiar la vista local
          if (this.historialComandasMesa.length === 0) {
            this.comandaMesa = null;
            this.pagoSolicitado = false;
            this.seleccionados = {};
            this.opcionSeleccionTemp = {};
          }
        });
        this.categorias$.subscribe((cats) => {
          this.categorias = cats;
          if (this.categorias.length && !this.categoriaSeleccionada) {
            this.categoriaSeleccionada = this.categorias[0].nombre;
          }
        });
        this.productos$.subscribe((prods) => {
          this.productos = prods;
        });
      });
    });
  }

  async cargarDatosRestaurante() {
    try {
      const barDoc = doc(this.dataService['firestore'], `bares/${this.barId}`);
      const barSnap = await getDoc(barDoc);
      if (barSnap.exists()) {
        const data: any = barSnap.data();
        this.restauranteNombre = data.nombre || '';
        this.restauranteImg = data.imagen || '';
      }
    } catch (e) {
      this.restauranteNombre = '';
      this.restauranteImg = '';
    }
  }

  solicitarPago() {
    // Descargar el historial en PDF antes de solicitar el pago
    this.descargarInformeMesa();
    this.comandas$.subscribe((comandas) => {
      this.historialComandasMesa
        .filter((c: any) => c.mesa == this.mesa && c.estado !== 'pagado')
        .forEach((c: any) => {
          c.estado = 'pago_pendiente';
          this.dataService.updateComanda(this.barId, c);
        });
      this.mostrarResumenPago = true;
      this.pagoSolicitado = true;
      // Recargar la página una sola vez tras solicitar el pago
      if (!window['pagoRecargado']) {
        window['pagoRecargado'] = true;
        setTimeout(() => window.location.reload(), 300);
      }
    });
  }

  confirmarSolicitarPago() {
    if (confirm('¿Desea solicitar el pago?')) {
      this.solicitarPago();
    }
  }

  cerrarResumenPago() {
    this.mostrarResumenPago = false;
  }

  enviarPedido() {
    // Validar que todos los productos con opciones tengan al menos una seleccionada
    for (const id of this.seleccionadosKeys()) {
      const prod = this.productos.find((p) => p.id === id);
      if (prod && prod.opciones && prod.opciones.length > 0) {
        if (
          !this.seleccionados[id].opciones ||
          this.seleccionados[id].opciones.length === 0
        ) {
          alert(
            'Debes seleccionar una opción para el producto: ' + prod.nombre
          );
          return;
        }
      }
    }
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
      estado: 'pendiente', // Estado inicial para la comanda
    };
    this.dataService.addComanda(this.barId, pedido);
    this.seleccionados = {};
    this.opcionSeleccionTemp = {};
    alert('¡Pedido enviado!');
  }

  async pagarMesa() {
    const confirmar = confirm(
      '¿Quieres descargar el informe de todos los pedidos de la mesa antes de pagar?'
    );
    if (confirmar) {
      this.descargarInformeMesa();
    }
    // Limpiar todas las comandas de la mesa
    this.comandas$.subscribe((comandas) => {
      const comandasMesa = comandas.filter((c: any) => c.mesa == this.mesa);
      comandasMesa.forEach((c: any) => {
        this.dataService.deleteComanda(this.barId, c.id);
      });
    });
    this.mostrarResumenPago = false;
    this.pagoSolicitado = false;
    this.comandaMesa = null;
    this.historialComandasMesa = [];
    this.seleccionados = {};
    this.opcionSeleccionTemp = {};
    alert('La mesa ha sido limpiada.');
  }

  async descargarInformeMesa() {
    // Agrupar productos por id+nombre+opciones
    const agrupados: {
      [key: string]: {
        nombre: string;
        opciones: string[];
        cantidad: number;
        precio: number;
      };
    } = {};
    for (const comanda of this.historialComandasMesa) {
      for (const item of comanda.items) {
        const prod = this.productos.find((p) => p.id === item.id);
        if (!prod) continue;
        const key =
          item.id +
          '|' +
          (item.nombre || '') +
          '|' +
          (item.opciones ? item.opciones.join(',') : '');
        if (!agrupados[key]) {
          agrupados[key] = {
            nombre: item.nombre,
            opciones: item.opciones || [],
            cantidad: 0,
            precio: prod.precio,
          };
        }
        agrupados[key].cantidad += item.cantidad;
      }
    }
    // Generar PDF agrupado
    const jsPDF = (await import('jspdf')).jsPDF;
    const doc = new jsPDF();
    let y = 10;
    doc.setFontSize(16);
    doc.text(`Informe de mesa ${this.mesa}`, 10, y);
    y += 10;
    if (Object.keys(agrupados).length > 0) {
      doc.setFontSize(13);
      Object.values(agrupados).forEach((item) => {
        let linea = `- ${item.nombre}`;
        if (item.opciones.length) {
          linea += ` (${item.opciones.join(', ')})`;
        }
        linea += ` x${item.cantidad} (${item.precio.toFixed(2)}€ c/u)`;
        doc.text(linea, 12, y);
        y += 7;
      });
      y += 4;
      doc.setFontSize(14);
      doc.text(`Total: ${this.getTotalHistorialMesa().toFixed(2)} €`, 10, y);
    } else {
      doc.text('No hay datos para esta mesa.', 10, y);
    }
    doc.save(`informe_mesa_${this.mesa}.pdf`);
  }

  // Devuelve true si el producto requiere opción y no se ha seleccionado ninguna
  productoRequiereOpcionNoSeleccionada(producto: Producto): boolean {
    return !!(
      producto.opciones &&
      producto.opciones.length > 0 &&
      (!this.seleccionados[producto.id] ||
        !this.seleccionados[producto.id].opciones ||
        this.seleccionados[producto.id].opciones.length === 0)
    );
  }

  // Nueva función para saber si el botón añadir debe estar habilitado
  puedeAgregarProducto(prod: Producto): boolean {
    if (prod.opciones && prod.opciones.length > 0) {
      return !!this.opcionSeleccionTemp[prod.id];
    }
    return true;
  }

  // Nueva función para manejar la selección única de opción sin modificar el resumen
  onSeleccionOpcion(producto: Producto, opcion: string) {
    this.opcionSeleccionTemp[producto.id] = opcion;
  }

  agregarProducto(producto: Producto) {
    if (this.pagoSolicitado) return;
    let opcionSeleccionada = '';
    if (producto.opciones && producto.opciones.length > 0) {
      opcionSeleccionada = this.opcionSeleccionTemp[producto.id];
      if (!opcionSeleccionada) {
        alert('Debes seleccionar una opción para este producto.');
        return;
      }
    }
    if (!this.seleccionados[producto.id]) {
      this.seleccionados[producto.id] = { cantidad: 1, opciones: [] };
    } else {
      this.seleccionados[producto.id].cantidad++;
    }
    if (producto.opciones && producto.opciones.length > 0) {
      this.seleccionados[producto.id].opciones = [opcionSeleccionada];
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

  seleccionadosKeys(): string[] {
    return Object.keys(this.seleccionados);
  }

  seleccionarCategoria(nombre: string) {
    this.categoriaSeleccionada = nombre;
  }

  getProductosPorCategoriaSeleccionada() {
    // Si no hay categoría seleccionada pero hay categorías, selecciona la primera
    if (!this.categoriaSeleccionada && this.categorias.length) {
      this.categoriaSeleccionada = this.categorias[0].nombre;
    }
    if (!this.categoriaSeleccionada) return this.productos;
    return this.productos.filter(
      (p) => p.categoria === this.categoriaSeleccionada
    );
  }

  getNombreProducto(id: string) {
    const prod = this.productos.find((p) => p.id === id);
    return prod ? prod.nombre : '';
  }

  getPrecioProducto(id: string): number {
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

  getOpcionSeleccionada(producto: Producto): string {
    return this.opcionSeleccionTemp[producto.id] || '';
  }

  abrirResumenPedido() {
    this.modalResumenAbierto = true;
  }

  abrirImagenAmpliada(url: string) {
    this.imagenAmpliada = url;
  }

  cerrarImagenAmpliada() {
    this.imagenAmpliada = null;
  }
}
