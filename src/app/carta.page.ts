// ...existing code...
// ...existing code...
// ...existing code...
// ...existing code...
// ...existing code...
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
import { TranslateModule } from '@ngx-translate/core';
import { LanguageSelectorComponent } from './language-selector.component';
import { PopoverController } from '@ionic/angular';
import { LanguageService } from './language.service';

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
    IonModal,
    IonButtons,
    IonItem,
    IonLabel,
    CommonModule,
    TranslateModule,
    LanguageSelectorComponent,
  ],
  providers: [PopoverController],
})
export class CartaPage implements OnInit {
  cabeceraImagen: string | null = null;
  mesa: string = '';
  categorias$: Observable<Categoria[]> = undefined!;
  productos$: Observable<Producto[]> = undefined!;
  comandas$: Observable<any[]> = undefined!;
  productos: Producto[] = [];
  categorias: Categoria[] = [];
  historialComandasMesa: any[] = [];
  // Cambia la clave de seleccionados a id+opcion para distinguir productos con opción
  seleccionados: {
    [key: string]: { cantidad: number; id: string; opcion: string };
  } = {};
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
    private route: ActivatedRoute,
    private popoverController: PopoverController,
    private languageService: LanguageService
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
        // Recuperar imagen de cabecera
        this.dataService
          .getCabeceraImagen(this.barId)
          .subscribe((data: any) => {
            this.cabeceraImagen = data?.imagen || null;
          });
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

  agregarProducto(producto: Producto) {
    if (this.pagoSolicitado) return;
    let opcionSeleccionada = '';
    let key = producto.id;
    if (producto.opciones && producto.opciones.length > 0) {
      opcionSeleccionada = this.opcionSeleccionTemp[producto.id];
      if (!opcionSeleccionada) {
        alert('Debes seleccionar una opción para este producto.');
        return;
      }
      key = producto.id + '|' + opcionSeleccionada;
    }
    if (!this.seleccionados[key]) {
      this.seleccionados[key] = {
        cantidad: 1,
        id: producto.id,
        opcion: opcionSeleccionada,
      };
    } else {
      this.seleccionados[key].cantidad++;
    }
  }

  quitarProducto(producto: Producto) {
    if (this.pagoSolicitado) return;
    // Buscar todas las claves que correspondan a este producto (con o sin opción)
    const keys = Object.keys(this.seleccionados).filter((k) =>
      k.startsWith(producto.id)
    );
    for (const key of keys) {
      if (this.seleccionados[key].cantidad > 0) {
        this.seleccionados[key].cantidad--;
        if (this.seleccionados[key].cantidad <= 0) {
          delete this.seleccionados[key];
        }
        break;
      }
    }
  }

  enviarPedido() {
    // Validar que todos los productos con opciones tengan opción seleccionada
    for (const key of this.seleccionadosKeys()) {
      const prod = this.productos.find(
        (p) => p.id === this.seleccionados[key].id
      );
      if (prod && prod.opciones && prod.opciones.length > 0) {
        if (!this.seleccionados[key].opcion) {
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
      items: this.seleccionadosKeys().map((key) => {
        const prod = this.productos.find(
          (p) => p.id === this.seleccionados[key].id
        );
        return {
          id: prod?.id,
          nombre: prod?.nombre,
          cantidad: this.seleccionados[key].cantidad,
          opciones: this.seleccionados[key].opcion
            ? [this.seleccionados[key].opcion]
            : [],
        };
      }),
      estado: 'pendiente',
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
    // Genera un PDF tipo ticket de bar con el historial de pedidos
    const jsPDF = (await import('jspdf')).jsPDF;
    const doc = new jsPDF({ unit: 'mm', format: [80, 297] }); // Ticket 8cm ancho
    let y = 10;
    doc.setFontSize(12);
    doc.text(this.restauranteNombre || 'TICKET', 40, y, { align: 'center' });
    y += 8;
    doc.setFontSize(10);
    doc.text('Mesa: ' + (this.mesa || '-'), 10, y);
    y += 6;
    doc.text('Fecha: ' + new Date().toLocaleString(), 10, y);
    y += 8;
    doc.setFontSize(11);
    doc.text('--- PEDIDOS ---', 10, y);
    y += 6;
    for (const comanda of this.historialComandasMesa) {
      doc.setFontSize(9);
      doc.text(
        (comanda.fecha ? new Date(comanda.fecha).toLocaleString() : '-') + '',
        10,
        y
      );
      y += 5;
      for (const item of comanda.items) {
        let linea = `${item.nombre} x${item.cantidad}`;
        if (item.opciones && item.opciones.length) {
          linea += ` (${item.opciones.join(', ')})`;
        }
        const prod = this.productos.find((p) => p.id === item.id);
        const precio = prod ? prod.precio : 0;
        linea += `  ${(precio * item.cantidad).toFixed(2)}€`;
        doc.text(linea, 12, y);
        y += 5;
      }
      y += 2;
    }
    y += 4;
    doc.setFontSize(11);
    doc.text('TOTAL: ' + this.getTotalHistorialMesa().toFixed(2) + ' €', 10, y);
    doc.save(`ticket_mesa_${this.mesa || 'sin_mesa'}.pdf`);
  }

  // Devuelve true si el producto requiere opción y no se ha seleccionado ninguna
  productoRequiereOpcionNoSeleccionada(producto: Producto): boolean {
    // Buscar si existe alguna selección para este producto con opción
    const keys = Object.keys(this.seleccionados).filter((k) =>
      k.startsWith(producto.id + '|')
    );
    return !!(
      producto.opciones &&
      producto.opciones.length > 0 &&
      keys.every(
        (key) => !this.seleccionados[key] || !this.seleccionados[key].opcion
      )
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

  getNombreProducto(key: string) {
    const prod = this.productos.find(
      (p) => p.id === this.seleccionados[key].id
    );
    let nombre = prod ? prod.nombre : '';
    if (this.seleccionados[key].opcion) {
      nombre += ' (' + this.seleccionados[key].opcion + ')';
    }
    return nombre;
  }

  getPrecioProducto(key: string): number {
    const prod = this.productos.find(
      (p) => p.id === this.seleccionados[key].id
    );
    return prod ? prod.precio : 0;
  }

  seleccionadosKeys(): string[] {
    return Object.keys(this.seleccionados);
  }

  seleccionarCategoria(id: string) {
    this.categoriaSeleccionada = id;
  }

  getNombreCategoria(cat?: Categoria): string {
    if (!cat) return '';
    // Restaurar el comportamiento clásico: solo devolver el string tal cual se guardó
    return typeof cat.nombre === 'string' ? cat.nombre : '';
  }

  getProductosPorCategoriaSeleccionada() {
    if (!this.categoriaSeleccionada && this.categorias.length) {
      this.categoriaSeleccionada = this.categorias[0].id;
    }
    if (!this.categoriaSeleccionada) return this.productos;
    return this.productos.filter(
      (p) => p.categoria === this.categoriaSeleccionada
    );
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

  abrirResumenPedido() {
    this.modalResumenAbierto = true;
  }

  abrirImagenAmpliada(url: string) {
    this.imagenAmpliada = url;
  }

  cerrarImagenAmpliada() {
    this.imagenAmpliada = null;
  }

  // Devuelve la opción seleccionada para un producto (para ion-segment)
  getOpcionSeleccionada(producto: Producto): string {
    return this.opcionSeleccionTemp[producto.id] || '';
  }

  getCurrentLanguageFlag(): string {
    return this.languageService.getLanguageFlag(
      this.languageService.getCurrentLanguage()
    );
  }

  async presentLanguagePopover(event: any) {
    const popover = await this.popoverController.create({
      component: LanguageSelectorComponent,
      event: event,
      translucent: true,
      showBackdrop: true,
      backdropDismiss: true,
    });
    return await popover.present();
  }

  getCategoriaSeleccionada(): Categoria | undefined {
    return this.categorias.find((c) => c.id === this.categoriaSeleccionada);
  }
}
