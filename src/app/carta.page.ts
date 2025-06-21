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
  IonSegment,
  IonSegmentButton,
} from '@ionic/angular/standalone';
import { DataService, Producto, Categoria } from './data.service';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

declare var google: any;

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
    FormsModule,
    IonSegment,
    IonSegmentButton,
    CommonModule,
  ],
})
export class CartaPage implements OnInit {
  mesa: string = '';
  categorias$: Observable<Categoria[]>;
  productos$: Observable<Producto[]>;
  comandas$: Observable<any[]>;
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
  idioma: string = 'es';
  idiomas = [
    { code: 'es', label: 'Español' },
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français' },
    { code: 'it', label: 'Italiano' },
    { code: 'de', label: 'Deutsch' },
  ];
  textos: any = {};
  textosBase: any = {
    carta: 'Carta',
    mesa: 'Mesa',
    resumen: 'Resumen del pedido',
    total: 'Total',
    enviarPedido: 'Enviar pedido',
    sinPedido: 'Sin pedido',
    noProductos: 'No hay productos en el pedido de esta mesa.',
    pagoSolicitado: 'Pago solicitado',
    pagoSolicitadoMsg:
      'El pago de esta mesa ha sido solicitado. No se pueden añadir más productos hasta que el administrador confirme el pago.',
    alergenos: 'Alergenos',
    opciones: 'Opciones',
    anadir: 'Añadir',
    quitar: 'Quitar',
    categoria: 'Categoría',
    precio: 'Precio',
  };

  constructor(
    private dataService: DataService,
    private route: ActivatedRoute,
    private http: HttpClient
  ) {
    this.barId = this.dataService.getBarId();
    this.categorias$ = this.dataService.getCategorias(this.barId);
    this.productos$ = this.dataService.getProductos(this.barId);
    this.comandas$ = this.dataService.getComandas(this.barId);
  }

  ngOnInit() {
    this.route.queryParams.subscribe((qparams) => {
      this.mesa = qparams['mesa'] || '';
      this.comandas$.subscribe((comandas) => {
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
      });
    });
    this.categorias$.subscribe((cats) => {
      this.categorias = cats;
      if (this.categorias.length) {
        this.categoriaSeleccionada = this.categorias[0].nombre;
      }
    });
    this.productos$.subscribe((prods) => {
      this.productos = prods;
    });
    this.setIdioma('es');
    this.initGoogleTranslate();
  }

  initGoogleTranslate() {
    if ((window as any).google && (window as any).google.translate) {
      this.renderGoogleTranslate();
    } else {
      const script = document.createElement('script');
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      document.body.appendChild(script);
      (window as any).googleTranslateElementInit = () => {
        this.renderGoogleTranslate();
      };
    }
  }

  renderGoogleTranslate() {
    new google.translate.TranslateElement({
      pageLanguage: 'es',
      includedLanguages: 'es,en,fr,it,de',
      layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
      autoDisplay: false
    }, 'google_translate_element');
  }

  setIdioma(idioma: string) {
    this.idioma = idioma;
    // Traduce textos base
    const keys = Object.keys(this.textosBase);
    const traducciones: any = {};
    let pendientes = keys.length;
    keys.forEach((k) => {
      this.traducir(this.textosBase[k], idioma).then((trad) => {
        traducciones[k] = trad;
        pendientes--;
        if (pendientes === 0) {
          this.textos = traducciones;
        }
      });
    });
    // Traduce categorías
    if (this.categorias && this.categorias.length) {
      this.categorias.forEach((cat) => {
        this.traducir(cat.nombre, idioma).then(
          (trad) => (cat.nombreTrad = trad)
        );
      });
    }
    // Traduce productos
    if (this.productos && this.productos.length) {
      this.productos.forEach((prod) => {
        this.traducir(prod.nombre, idioma).then(
          (trad) => (prod.nombreTrad = trad)
        );
        if (prod.descripcion) {
          this.traducir(prod.descripcion, idioma).then(
            (trad) => (prod.descripcionTrad = trad)
          );
        }
        if (prod.alergenos) {
          this.traducir(prod.alergenos, idioma).then(
            (trad) => (prod.alergenosTrad = trad)
          );
        }
        if (prod.opciones && prod.opciones.length) {
          if (!prod.opcionesTrad) prod.opcionesTrad = [];
          prod.opciones.forEach((op, idx) => {
            this.traducir(op, idioma).then(
              (trad) => (prod.opcionesTrad![idx] = trad)
            );
          });
        }
      });
    }
  }

  traducir(texto: string, idioma: string): Promise<string> {
    if (!texto || idioma === 'es') return Promise.resolve(texto);
    return this.http
      .post<any>('https://translate.argosopentech.com/translate', {
        q: texto,
        source: 'es',
        target: idioma,
        format: 'text',
      })
      .toPromise()
      .then((res) => res.translatedText)
      .catch(() => texto);
  }

  solicitarPago() {
    this.comandas$.subscribe((comandas) => {
      this.historialComandasMesa
        .filter((c: any) => c.mesa == this.mesa && c.estado !== 'pagado')
        .forEach((c: any) => {
          c.estado = 'pago_pendiente';
          this.dataService.updateComanda(this.barId, c);
        });
      this.mostrarResumenPago = true;
      this.pagoSolicitado = true;
    });
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

  pagarMesa() {
    this.mostrarResumenPago = true;
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
}
