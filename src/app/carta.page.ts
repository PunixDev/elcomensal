// ...existing code...
// ...existing code...
// ...existing code...
// ...existing code...
// ...existing code...
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButton,
  IonIcon,
  IonLabel,
  IonItem,
  IonSegment,
  IonSegmentButton,
  IonModal, // Added
  IonButtons, // Added
  IonFab,
  IonFabButton,
  IonBadge,
  ModalController // Added to imports
} from '@ionic/angular/standalone';
import { DataService, Producto, Categoria, Promotion } from './data.service';
import { FormsModule } from '@angular/forms';
import { Observable, firstValueFrom, Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { doc, getDoc } from '@angular/fire/firestore';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ConfirmPedidoModalComponent } from './confirm-pedido-modal/confirm-pedido-modal.component';
import { CalculadoraSeparadaModalComponent } from './calculadora-separada-modal/calculadora-separada-modal.component';
import { LanguageSelectorComponent } from './language-selector.component';
import { PopoverController, AlertController, ToastController } from '@ionic/angular';
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
    IonIcon,
    FormsModule,
    IonSegment,
    IonSegmentButton,
    IonModal,
    IonButtons,
    IonItem,
    IonLabel,
    CommonModule,
    TranslateModule,
    TranslateModule,
    IonFab,
    IonFabButton,
    IonBadge,
  ],
  providers: [PopoverController],
})
export class CartaPage implements OnInit, OnDestroy {
  cabeceraImagen: string | null = null;
  mesa: string = '';
  categorias$: Observable<Categoria[]> = undefined!;
  productos$: Observable<Producto[]> = undefined!;
  comandas$: Observable<any[]> = undefined!;
  productos: Producto[] = [];
  categorias: Categoria[] = [];
  promotions: Promotion[] = [];
  promotions$: Observable<Promotion[]> = undefined!;
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
  googleReviewUrl: string = '';
  mostrarResumenPago: boolean = false;
  modalResumenAbierto = false;
  mostrarHistorial: boolean = false;
  mostrarCarta: boolean = true;

  // Variables para imagen y nombre del restaurante
  restauranteNombre: string = '';
  restauranteImg: string = '';

  // Imagen ampliada para modal
  imagenAmpliada: string | null = null;
  // Estado temporal para editar una comanda desde la UI
  editingComanda: any = null;
  editarModalAbierto = false;
  // Nombre del producto de la suscripción (para controlar si mostrar selector)
  subscriptionProductName: string | null = null;

  // Subscription cleanup
  private routeSubs: Subscription[] = [];
  private dataSubs: Subscription[] = [];

  constructor(
    private dataService: DataService,
    private route: ActivatedRoute,
    private popoverController: PopoverController,
    private languageService: LanguageService,
    private alertController: AlertController,
    private modalController: ModalController, // Added
    private translateService: TranslateService,
    private toastController: ToastController
  ) {}

  async ngOnInit() {
    // Leer nombre del producto de la suscripción (si fue guardado en localStorage)
    this.subscriptionProductName = localStorage.getItem(
      'subscriptionProductName'
    );
    // Usar barId de la ruta si existe (path param), si no, query param, si no, localStorage
    const routeSub = this.route.paramMap.subscribe(async (params) => {
      const barIdFromPath = params.get('barId');
      const querySub = this.route.queryParams.subscribe(async (qparams) => {
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

        // Limpiar suscripciones de datos anteriores si cambia el barId o params
        this.clearDataSubs();

        // Si el barId viene de la URL (usuario no logueado), fuerza la carga desde Firestore
        console.log('[DEBUG] Llamada a Firestore con barId:', this.barId);
        
        const pagoRealizado = qparams['pagoRealizado'];
        if (pagoRealizado === 'true') {
          // Remove query param from url silently
          window.history.replaceState({}, document.title, window.location.pathname + `?mesa=${this.mesa}&barId=${this.barId}`);
          setTimeout(() => {
             this.procesarPagoExitoso();
          }, 1000);
        }

        // Cargar configuración adicional (Reviews, Impresoras...)
        this.dataSubs.push(
          this.dataService.getBarConfig(this.barId).subscribe(config => {
              this.googleReviewUrl = config?.googleReviewUrl || '';
          })
        );
        
        // Recuperar imagen de cabecera
        this.dataSubs.push(
          this.dataService
            .getCabeceraImagen(this.barId)
            .subscribe((data: any) => {
              this.cabeceraImagen = data?.imagen || null;
            })
        );
        this.categorias$ = this.dataService.getCategorias(this.barId);
        this.productos$ = this.dataService.getProductos(this.barId);
        this.comandas$ = this.dataService.getComandas(this.barId);
        this.promotions$ = this.dataService.getPromotions(this.barId);

        this.dataSubs.push(
          this.promotions$.subscribe((promos) => {
            this.promotions = promos;
            console.log('[DEBUG] Promotions:', this.promotions);
          })
        );
        // Cargar datos adicionales del restaurante (incluyendo plan/subscription)
        this.cargarDatosRestaurante();

        this.dataSubs.push(
          this.categorias$.subscribe((cats) => {
            console.log('[DEBUG] Respuesta Firestore categorias:', cats);
            // Filtrar categorías que no estén ocultas
            this.categorias = (cats || []).filter((c) => !c.oculta);
          })
        );
        this.dataSubs.push(
          this.productos$.subscribe((prods) => {
            console.log('[DEBUG] Respuesta Firestore productos:', prods);
            this.productos = prods;
          })
        );
        this.dataSubs.push(
          this.comandas$.subscribe((comandas) => {
            console.log('[DEBUG] Respuesta Firestore comandas:', comandas);
            const antesPago = this.pagoSolicitado;
            this.historialComandasMesa = comandas
              .filter((c: any) => c.mesa == this.mesa)
              // Filtramos las llamadas al camarero para que no salgan en el historial del cliente
              .filter(
                (c: any) => !c.items.some((i: any) => i.id === 'call_waiter')
              )
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
          })
        );
      });
      this.routeSubs.push(querySub);
    });
    this.routeSubs.push(routeSub);
  }

  private clearDataSubs() {
    this.dataSubs.forEach((s) => s.unsubscribe());
    this.dataSubs = [];
  }

  ngOnDestroy() {
    this.clearDataSubs();
    this.routeSubs.forEach((s) => s.unsubscribe());
  }

  async cargarDatosRestaurante() {
    try {
      const barDoc = doc(this.dataService['firestore'], `bares/${this.barId}`);
      const barSnap = await getDoc(barDoc);
      if (barSnap.exists()) {
        const data: any = barSnap.data();
        this.restauranteNombre = data.nombre || '';
        this.restauranteImg = data.imagen || '';
        // Intentar obtener el nombre del producto/plan de la suscripción desde Firestore
        const planFromDoc =
          data.subscriptionProductName ||
          (data.subscription &&
            data.subscription.items &&
            data.subscription.items[0]?.product?.name) ||
          data.planName ||
          null;
        if (planFromDoc) {
          this.subscriptionProductName = planFromDoc;
          try {
            localStorage.setItem('subscriptionProductName', planFromDoc);
          } catch (e) {
            // Silenciar si el almacenamiento falla
            console.warn(
              'No se pudo guardar subscriptionProductName en localStorage',
              e
            );
          }
        }

        // Guardar idioma por defecto del restaurante en localStorage si existe
        if (data.defaultLanguage) {
          try {
            localStorage.setItem('defaultLanguage', data.defaultLanguage);
          } catch (e) {
            console.warn(
              'No se pudo guardar defaultLanguage en localStorage',
              e
            );
          }
        }
      }
    } catch (e) {
      this.restauranteNombre = '';
      this.restauranteImg = '';
    }
  }

  async solicitarPago() {
    // Descargar el historial en PDF antes de solicitar el pago
    this.descargarInformeMesa();
    
    // Usar el historial local que ya tenemos suscrito/cargado
    this.historialComandasMesa
      .filter((c: any) => c.mesa == this.mesa && c.estado !== 'pagado')
      .forEach((c: any) => {
        c.estado = 'pago_pendiente';
        this.dataService.updateComanda(this.barId, c);
      });

    this.mostrarResumenPago = true;
    this.pagoSolicitado = true;

    // Ya no es necesario recargar la página si los observables de DataService funcionan bien,
    // pero si se prefiere mantener la lógica de "pago solicitado" visualmente limpia:
    if (!window['pagoRecargado']) {
      window['pagoRecargado'] = true;
      // Comprobamos si hay URL de google para reseñas antes de recargar
      if (this.googleReviewUrl) {
         await this.mostrarAlertaResena();
      } else {
         setTimeout(() => window.location.reload(), 500);
      }
    } else if (this.googleReviewUrl) {
       await this.mostrarAlertaResena();
    }
  }

  async mostrarAlertaResena() {
    const alert = await this.alertController.create({
      header: '¡Gracias por tu visita!',
      message: '¿Te ha gustado la experiencia? Nos ayudaría mucho si nos dejas una pequeña reseña en Google.',
      buttons: [
        {
          text: 'En otro momento',
          role: 'cancel',
          handler: () => {
             setTimeout(() => window.location.reload(), 500);
          }
        },
        {
          text: 'Dejar reseña',
          handler: () => {
            window.open(this.googleReviewUrl, '_blank');
            setTimeout(() => window.location.reload(), 500);
          }
        }
      ]
    });
    await alert.present();
    
    // Fallback if dismissed by backdrop click
    alert.onDidDismiss().then(() => {
        setTimeout(() => window.location.reload(), 500);
    });
  }

  async confirmarSolicitarPago() {
    const alert = await this.alertController.create({
      header: this.translateService.instant('MENU.REQUEST_PAYMENT'),
      message: this.translateService.instant('MENU.CONFIRM_PAYMENT_REQUEST'),
      buttons: [
        {
          text: this.translateService.instant('MENU.CANCEL'),
          role: 'cancel'
        },
        {
          text: this.translateService.instant('MENU.CONFIRM'),
          handler: async () => {
            await this.solicitarPago();
          }
        }
      ]
    });
    await alert.present();
  }

  cerrarResumenPago() {
    this.mostrarResumenPago = false;
  }

  agregarProducto(producto: Producto) {
    if (this.pagoSolicitado || producto.agotado) return;
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
    // Si el producto tiene opciones, priorizar la clave que coincide con la opción
    // actualmente seleccionada (opcionSeleccionTemp). Si no hay opción seleccionada
    // o no existe esa clave en `seleccionados`, caer en la eliminación de la primera
    // clave encontrada para el producto.
    const keys = Object.keys(this.seleccionados).filter((k) =>
      k.startsWith(producto.id)
    );

    if (!keys.length) return;

    // Intentar eliminar la variante seleccionada actualmente
    if (producto.opciones && producto.opciones.length > 0) {
      const selOption = this.opcionSeleccionTemp[producto.id];
      if (selOption) {
        const keySel = producto.id + '|' + selOption;
        if (this.seleccionados[keySel]) {
          this.seleccionados[keySel].cantidad--;
          if (this.seleccionados[keySel].cantidad <= 0)
            delete this.seleccionados[keySel];
          return;
        }
        // si no existe la clave exacta, continuar y eliminar la primera disponible
      }
    }

    // Fallback: eliminar la primera clave con cantidad > 0
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

  // Devuelve la cantidad total seleccionada para un producto (suma de todas las claves con o sin opción)
  cantidadSeleccionadaProducto(producto: Producto): number {
    const keys = Object.keys(this.seleccionados).filter((k) =>
      k.startsWith(producto.id)
    );
    return keys.reduce(
      (sum, k) => sum + (this.seleccionados[k]?.cantidad || 0),
      0
    );
  }

  // True si existe al menos una selección (con o sin opción) para el producto
  productoTieneSeleccion(producto: Producto): boolean {
    return this.cantidadSeleccionadaProducto(producto) > 0;
  }

  async enviarPedido() {
    // Preparar items para el modal
    const itemsParaModal = this.seleccionadosKeys().map((key) => {
      const prod = this.productos.find((p) => p.id === this.seleccionados[key].id);
      const cantidad = this.seleccionados[key].cantidad;
      let opcion = '';
      let nombre = prod?.nombre || '';
      
      if (this.seleccionados[key].opcion) {
        // Traducir opción si es necesario
        opcion = this.traducirOpcionParaEnvio(prod, this.seleccionados[key].opcion);
      }
      
      // Nombre traducido para mostrar en el modal (UI) - Usar getNombre para UI actual
      const nombreUI = this.getNombreProducto(key);
      const precioUnitario = this.getEffectiveItemPriceForOrder(prod, cantidad);
      
      return {
        nombre: nombreUI,
        cantidad: cantidad,
        precio: precioUnitario, // Precio unitario efectivo (con descuento si aplica)
        opciones: opcion ? [opcion] : [] // array de opciones strings
      };
    });

    const totalCalculado = this.getTotalPedido();

    const modal = await this.modalController.create({
      component: ConfirmPedidoModalComponent,
      componentProps: {
        items: itemsParaModal,
        total: totalCalculado,
        existingDiners: this.historialComandasMesa.find((c: any) => c.numeroComensales)?.numeroComensales
      },
      cssClass: 'confirm-order-modal' // Opcional, por si queremos estilos específicos
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();

    if (role === 'confirm' && data && data.confirm) {
      this.procesarEnvioPedido(data.observaciones, data.numeroComensales);
    }
  }

  procesarEnvioPedido(observaciones: string, numeroComensales?: number) {
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
          nombre: this.getNombreParaEnvio(prod) || prod?.nombre,
          cantidad: this.seleccionados[key].cantidad,
          opciones: this.seleccionados[key].opcion
            ? [
                this.traducirOpcionParaEnvio(
                  prod,
                  this.seleccionados[key].opcion
                ),
              ]
            : [],
          precio: this.getEffectiveItemPriceForOrder(prod, this.seleccionados[key].cantidad),
        };
      }),
      estado: 'pendiente',
      observaciones: observaciones || '',
      numeroComensales: numeroComensales
    };
    this.dataService.addComanda(this.barId, pedido);
    this.seleccionados = {};
    this.opcionSeleccionTemp = {};
  }

  async iniciarPagoStripe() {
    try {
      const stripeConfig = await this.dataService.getStripeConfig(this.barId);
      if (!stripeConfig || !stripeConfig.secretKey) {
        const errorMsg = this.translateService.instant('MENU.ONLINE_PAYMENT_UNAVAILABLE') || 'Este restaurante no ha configurado los pagos por móvil.';
        alert(errorMsg);
        return;
      }

      this.mostrarResumenPago = false;
      const loader = await this.toastController.create({
        message: 'Conectando con la pasarela de pago segura...',
        duration: 2500
      });
      loader.present();

      const backendUrl = window.location.hostname === 'localhost' && window.location.protocol === 'http:'
        ? 'http://localhost:3000'
        : 'https://backendelcomensal.onrender.com';

      const total = this.getTotalHistorialMesa();
      
      const returnUrl = window.location.origin + window.location.pathname + `?mesa=${this.mesa}&barId=${this.barId}&pagoRealizado=true`;

      const response = await fetch(`${backendUrl}/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total,
          secretKey: stripeConfig.secretKey,
          mesa: this.mesa,
          barNombre: this.restauranteNombre || 'Restaurante',
          returnUrl: returnUrl,
        })
      });

      const data = await response.json();
      if (data.url) {
        // Guardar estado localmente por si recarga la página
        window.location.href = data.url;
      } else {
        console.error(data);
        alert('Error iniciando el método de pago.');
      }
    } catch(err) {
      console.error(err);
      alert('Error de conexión con el banco. Inténtalo de nuevo.');
    }
  }

  async procesarPagoExitoso() {
    this.mostrarResumenPago = false;
    this.pagoSolicitado = false;
    this.comandaMesa = null;

    // We can clear the bill
    for (const c of this.historialComandasMesa) {
       await this.dataService.deleteComanda(this.barId, c.id);
    }
    
    this.historialComandasMesa = [];
    this.seleccionados = {};
    this.opcionSeleccionTemp = {};

    const alert = await this.alertController.create({
      header: '¡Pago completado!',
      message: 'Tu pago online se ha procesado con éxito. ¡Gracias por tu visita!',
      buttons: ['Aceptar']
    });
    await alert.present();
    
    // Si tiene google reviews configurado, lo mostramos
    if (this.googleReviewUrl) {
       // Esperar a que el usuario cierre el alert de éxito para no pisarse?
       alert.onDidDismiss().then(() => {
          this.mostrarAlertaResena();
       });
    }
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
  
  async abrirCalculadoraSeparada() {
    const modal = await this.modalController.create({
      component: CalculadoraSeparadaModalComponent,
      componentProps: {
        historial: this.historialComandasMesa,
        productos: this.productos
      }
    });
    await modal.present();
  }

  async descargarInformeMesa() {
    const jsPDF = (await import('jspdf')).jsPDF;
    const doc = new jsPDF({ unit: 'mm', format: [80, 297] }); // Ticket 8cm ancho
    const pageWidth = 80;
    const margin = 5;
    const contentWidth = pageWidth - margin * 2;
    let y = 10;

    // Helper para líneas divisorias
    const drawDivider = () => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("-".repeat(45), pageWidth / 2, y, { align: 'center' });
      y += 5;
    };

    // Header: Nombre del Restaurante
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(this.restauranteNombre?.toUpperCase() || 'TICKET', pageWidth / 2, y, { align: 'center' });
    y += 8;

    // Info Mesa y Fecha
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Mesa: ${this.mesa || '-'}`, margin, y);
    y += 5;
    doc.text(`Fecha: ${new Date().toLocaleString()}`, margin, y);
    y += 7;

    drawDivider();

    // Título Pedidos
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text('RESUMEN DE CONSUMO', pageWidth / 2, y, { align: 'center' });
    y += 7;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    for (const comanda of this.historialComandasMesa) {
      // Opcional: mostrar hora de cada pedido
      const hora = comanda.fecha ? new Date(comanda.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
      if (hora) {
        doc.setFont("helvetica", "oblique");
        doc.text(`Pedido: ${hora}`, margin, y);
        y += 4;
        doc.setFont("helvetica", "normal");
      }

      for (const item of comanda.items) {
        const prod = this.productos.find((p) => p.id === item.id);
        const precioUnitario = prod ? prod.precio : 0;
        const subtotal = precioUnitario * item.cantidad;

        const nombreParaMostrar = this.getNombreItemParaMostrar(item);
        const opcionesParaMostrar = this.getOpcionesItemParaMostrar(item);
        
        let textoItem = `${item.cantidad}x ${nombreParaMostrar}`;
        if (opcionesParaMostrar && opcionesParaMostrar.length) {
          textoItem += ` (${opcionesParaMostrar.join(', ')})`;
        }

        // Dividir texto si es muy largo ( wrapping )
        const lineas = doc.splitTextToSize(textoItem, contentWidth - 15);
        
        // Imprimir líneas del nombre (excepto el precio en la última o primera)
        lineas.forEach((linea: string, index: number) => {
          doc.text(linea, margin, y);
          if (index === lineas.length - 1) {
            // En la última línea del item, ponemos el precio a la derecha
            doc.text(`${subtotal.toFixed(2)}€`, pageWidth - margin, y, { align: 'right' });
          }
          y += 5;
          if (y > 280) { doc.addPage(); y = 10; } // Salto de página simple
        });
      }
      y += 2;
    }

    y += 3;
    drawDivider();

    // Total
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text('TOTAL:', margin, y);
    doc.text(`${this.getTotalHistorialMesa().toFixed(2)} €`, pageWidth - margin, y, { align: 'right' });
    y += 10;

    // Footer
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text('¡Gracias por su visita!', pageWidth / 2, y, { align: 'center' });
    y += 5;
    doc.setFontSize(8);
    doc.text('Documento no válido como factura', pageWidth / 2, y, { align: 'center' });

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
    if (!prod) return '';
    let nombre = this.getNombre(prod);
    if (this.seleccionados[key].opcion) {
      // Traducir la opción seleccionada
      const opcionesTrad = this.getOpciones(prod);
      const opcionesOrig = prod.opciones || [];
      const index = opcionesOrig.indexOf(this.seleccionados[key].opcion);
      const opcionTrad =
        index >= 0 && opcionesTrad[index]
          ? opcionesTrad[index]
          : this.seleccionados[key].opcion;
      nombre += ' (' + opcionTrad + ')';
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
    const lang = this.languageService.getCurrentLanguage();
    if (lang === 'en') return cat.nombreEn || cat.nombre;
    if (lang === 'fr') return cat.nombreFr || cat.nombre;
    if (lang === 'de') return cat.nombreDe || cat.nombre;
    if (lang === 'it') return cat.nombreIt || cat.nombre;
    return cat.nombre;
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



  isPromotionActive(promo: Promotion | null | undefined): boolean {
    if (!promo || !promo.active) return false;
    const now = new Date();
    const day = now.getDay(); // 0 (Sun) - 6 (Sat)
    if (!promo.days.includes(day)) return false;

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    const [startH, startM] = promo.startTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    
    const [endH, endM] = promo.endTime.split(':').map(Number);
    const endMinutes = endH * 60 + endM;

    // Handle overnight ranges (e.g. 22:00 - 02:00)
    if (endMinutes < startMinutes) {
       return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    }
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  }

  getBestPromotion(productId: string): Promotion | null {
      // Filter active promotions that apply to this product (or all if products empty)
      const activePromos = this.promotions.filter(p => 
          this.isPromotionActive(p) && 
          (p.productIds.length === 0 || p.productIds.includes(productId))
      );
      
      if (!activePromos.length) return null;
      
      // For now, simpler logic: take the first one (or priority?)
      // TODO: logic to pick "best" value if multiple apply
      return activePromos[0];
  }

  getDiscountedPrice(productId: string, originalPrice: number): number {
      const promo = this.getBestPromotion(productId);
      if (!promo) return originalPrice;

      if (promo.type === 'discount_percent' && promo.value) {
          return originalPrice * (1 - promo.value / 100);
      }
      // For 2x1, individual price is same, discount applies on total or quantity logic
      // But we might want to show "2x1" badge. 
      // If 2x1, we effectively halve the price for even quantities in total calculation, 
      // but unit price displayed is usually same? Or 50%? 
      // Convention: 2x1 usually means you strictly need 2.
      return originalPrice;
  }

  // Calculate total considering 2x1 Logic
  calculateTotalWithPromotions(): number {
      return this.seleccionadosKeys().reduce((total, key) => {
          const item = this.seleccionados[key];
          const product = this.productos.find(p => p.id === item.id);
          if(!product) return total;
           
          const promo = this.getBestPromotion(product.id);
          const price = product.precio;
          
          if (promo && promo.type === '2x1') {
              // Pairs are price * 1, remainders are price * 1
              // Actually 2x1 means Buy 2 Pay 1.
              // So q=1 -> pay 1. q=2 -> pay 1. q=3 -> pay 2. q=4 -> pay 2.
              // Formula: Math.ceil(qty / 2) * price
              const chargeableQty = Math.ceil(item.cantidad / 2);
              return total + (chargeableQty * price);
          } else if (promo && promo.type === 'discount_percent') {
              return total + (this.getDiscountedPrice(product.id, price) * item.cantidad);
          }
          
          return total + (price * item.cantidad);
      }, 0);
  }

  getTotalPedido(): number {
    // Override to use new calculation
    return this.calculateTotalWithPromotions();
  }

  abrirResumenPedido() {
    this.modalResumenAbierto = true;
  }

  // Aumenta la cantidad de un item en el resumen (clave directa)
  aumentarCantidadKey(key: string) {
    if (this.pagoSolicitado) return;
    if (!this.seleccionados[key]) return;
    this.seleccionados[key].cantidad++;
  }

  // Disminuye la cantidad de un item en el resumen; elimina si llega a 0
  disminuirCantidadKey(key: string) {
    if (this.pagoSolicitado) return;
    if (!this.seleccionados[key]) return;
    this.seleccionados[key].cantidad--;
    if (this.seleccionados[key].cantidad <= 0) {
      delete this.seleccionados[key];
    }
  }

  // Elimina completamente un item del resumen
  eliminarItemResumen(key: string) {
    if (this.pagoSolicitado) return;
    if (this.seleccionados[key]) delete this.seleccionados[key];
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

  // Métodos para obtener textos traducidos según el idioma actual
  getNombre(producto: Producto): string {
    const lang = this.languageService.getCurrentLanguage();
    if (lang === 'en') return producto.nombreEn || producto.nombre;
    if (lang === 'fr') return producto.nombreFr || producto.nombre;
    if (lang === 'de') return producto.nombreDe || producto.nombre;
    if (lang === 'it') return producto.nombreIt || producto.nombre;
    return producto.nombre;
  }

  getDescripcion(producto: Producto): string {
    const lang = this.languageService.getCurrentLanguage();
    if (lang === 'en')
      return producto.descripcionEn || producto.descripcion || '';
    if (lang === 'fr')
      return producto.descripcionFr || producto.descripcion || '';
    if (lang === 'de')
      return producto.descripcionDe || producto.descripcion || '';
    if (lang === 'it')
      return producto.descripcionIt || producto.descripcion || '';
    return producto.descripcion || '';
  }

  getAlergenos(producto: Producto): string {
    const lang = this.languageService.getCurrentLanguage();
    if (lang === 'en') return producto.alergenosEn || producto.alergenos || '';
    if (lang === 'fr') return producto.alergenosFr || producto.alergenos || '';
    if (lang === 'de') return producto.alergenosDe || producto.alergenos || '';
    if (lang === 'it') return producto.alergenosIt || producto.alergenos || '';
    return producto.alergenos || '';
  }

  getOpciones(producto: Producto): string[] {
    const lang = this.languageService.getCurrentLanguage();
    if (lang === 'en') return producto.opcionesEn || producto.opciones || [];
    if (lang === 'fr') return producto.opcionesFr || producto.opciones || [];
    if (lang === 'de') return producto.opcionesDe || producto.opciones || [];
    if (lang === 'it') return producto.opcionesIt || producto.opciones || [];
    return producto.opciones || [];
  }

  // Helpers para enviar datos en el idioma por defecto del restaurante
  private getDefaultLanguageForSending(): string | null {
    try {
      const dl = localStorage.getItem('defaultLanguage');
      return dl ? dl : null;
    } catch (e) {
      return null;
    }
  }

  private getNombreParaEnvio(producto?: Producto | null): string {
    if (!producto) return '';
    const dl = this.getDefaultLanguageForSending();
    if (!dl) return producto.nombre;
    if (dl === 'en') return producto.nombreEn || producto.nombre;
    if (dl === 'fr') return producto.nombreFr || producto.nombre;
    if (dl === 'de') return producto.nombreDe || producto.nombre;
    if (dl === 'it') return producto.nombreIt || producto.nombre;
    return producto.nombre;
  }

  private traducirOpcionParaEnvio(
    producto?: Producto | null,
    opcion?: string
  ): string {
    if (!producto || !opcion) return opcion || '';
    const dl = this.getDefaultLanguageForSending();
    const lists: { [k: string]: string[] } = {
      orig: producto.opciones || [],
      en: producto.opcionesEn || [],
      fr: producto.opcionesFr || [],
      de: producto.opcionesDe || [],
      it: producto.opcionesIt || [],
    };

    // Buscar índice intentando en todas las listas (original y traducidas)
    let idx = lists['orig'].indexOf(opcion);
    if (idx < 0) {
      for (const k of ['en', 'fr', 'de', 'it']) {
        const i = lists[k].indexOf(opcion);
        if (i >= 0) {
          idx = i;
          break;
        }
      }
    }

    if (idx < 0) return opcion;

    // Si no hay idioma por defecto conocido, devolvemos la original (o la traducida encontrada)
    if (!dl) return lists['orig'][idx] || opcion;

    const target =
      dl === 'en'
        ? lists['en']
        : dl === 'fr'
        ? lists['fr']
        : dl === 'de'
        ? lists['de']
        : dl === 'it'
        ? lists['it']
        : lists['orig'];

    return target && target[idx] ? target[idx] : lists['orig'][idx] || opcion;
  }

  getEffectiveItemPriceForOrder(prod: Producto | undefined, qty: number): number {
      if (!prod) return 0;
      const promo = this.getBestPromotion(prod.id);
      if (promo && promo.type === '2x1') {
           // For 2x1, we need to average the price per unit for the order record?
           // OR store total price? 
           // If we store unit price, it's tricky.
           // Easiest is to store the actual charged price per unit averaged? 
           // e.g. 2 items, price 10. Total 10. unit price 5.
           // 1 item, price 10. Total 10. unit price 10.
           const chargeable = Math.ceil(qty / 2);
           const total = chargeable * prod.precio;
           return total / qty; 
      }
      if (promo && promo.type === 'discount_percent') {
          return this.getDiscountedPrice(prod.id, prod.precio);
      }
      return prod.precio;
  }

  getTotalHistorialMesa(): number {
    return this.historialComandasMesa.reduce((total, comanda) => {
        // If comanda has pre-calculated total store, use it? No, items usually have price snapshot?
        // Admin usually saves snapshot. But if not, we try to look up or use snapshot.
        // Current logic was looking up current price. 
        // Better: use item.precio if available (snapshot), else current price.
      return (
        total +
        comanda.items.reduce((subtotal: number, item: any) => {
          // If item.precio exists, use it (historical price). Else find current.
          if (item.precio !== undefined) {
              return subtotal + (item.precio * item.cantidad);
          }
          const prod = this.productos.find((p) => p.id === item.id);
          return subtotal + (prod ? prod.precio * item.cantidad : 0);
        }, 0)
      );
    }, 0);
  }

  // Helpers para mostrar items de comanda en el idioma actual de la carta (UI)
  getNombreItemParaMostrar(item: any): string {
    if (!item) return '';
    const prod = this.productos.find((p) => p.id === item.id);
    if (prod) return this.getNombre(prod);
    return item.nombre || '';
  }

  private traducirOpcionParaMostrar(
    producto?: Producto | null,
    opcion?: string
  ): string {
    if (!producto || !opcion) return opcion || '';
    const lang = this.languageService.getCurrentLanguage();
    const lists: { [k: string]: string[] } = {
      orig: producto.opciones || [],
      en: producto.opcionesEn || [],
      fr: producto.opcionesFr || [],
      de: producto.opcionesDe || [],
      it: producto.opcionesIt || [],
    };

    // Buscar índice en cualquiera de las listas
    let idx = lists['orig'].indexOf(opcion);
    if (idx < 0) {
      for (const k of ['en', 'fr', 'de', 'it']) {
        const i = lists[k].indexOf(opcion);
        if (i >= 0) {
          idx = i;
          break;
        }
      }
    }
    if (idx < 0) return opcion;

    const target =
      lang === 'en'
        ? lists['en']
        : lang === 'fr'
        ? lists['fr']
        : lang === 'de'
        ? lists['de']
        : lang === 'it'
        ? lists['it']
        : lists['orig'];

    return target && target[idx] ? target[idx] : lists['orig'][idx] || opcion;
  }

  getOpcionesItemParaMostrar(item: any): string[] {
    if (!item || !item.opciones || !item.opciones.length) return [];
    const prod = this.productos.find((p) => p.id === item.id);
    return item.opciones.map((op: string) =>
      this.traducirOpcionParaMostrar(prod, op)
    );
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

  // Determina si el selector de idioma debe mostrarse en la carta.
  // Ocultamos el selector para planes 'Basic' y 'Estándar' (tolerando acentos y mayúsculas).
  get showLanguageSelector(): boolean {
    if (!this.subscriptionProductName) return true; // por defecto mostrar
    const normalized = this.subscriptionProductName
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase();
    return !(normalized === 'basic' || normalized === 'estandar');
  }

  // Determina si se debe mostrar el botón de añadir producto en la carta.
  // Ocultamos el botón para el plan 'Basic'.
  get showAddProduct(): boolean {
    if (!this.subscriptionProductName) return true; // por defecto mostrar
    const normalized = this.subscriptionProductName
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase();
    return normalized !== 'basic';
  }

  getCategoriaSeleccionada(): Categoria | undefined {
    return this.categorias.find((c) => c.id === this.categoriaSeleccionada);
  }

  // Abre un diálogo para editar la comanda (por ahora permite editar observaciones)
  async editarComanda(comanda: any) {
    // Abrir modal de edición con copia de la comanda para evitar modificar la original hasta guardar
    this.editingComanda = JSON.parse(JSON.stringify(comanda));
    this.editarModalAbierto = true;
  }

  // Controles dentro del modal de edición
  aumentarCantidadItem(idx: number) {
    if (!this.editingComanda) return;
    this.editingComanda.items[idx].cantidad++;
  }

  disminuirCantidadItem(idx: number) {
    if (!this.editingComanda) return;
    this.editingComanda.items[idx].cantidad--;
    if (this.editingComanda.items[idx].cantidad <= 0) {
      this.editingComanda.items.splice(idx, 1);
    }
  }

  eliminarItemEditar(idx: number) {
    if (!this.editingComanda) return;
    this.editingComanda.items.splice(idx, 1);
  }

  cancelarEdicion() {
    this.editingComanda = null;
    this.editarModalAbierto = false;
  }

  async enviarModificacionComanda() {
    if (!this.editingComanda) return;
    try {
      // Marcar la comanda para que el administrador la revise
      this.editingComanda.estado = 'modificacion_solicitada';
      // Añadir metadata para el admin (opcional)
      this.editingComanda.usuarioModifico = true;
      this.editingComanda.fechaModificacion = new Date().toISOString();
      await this.dataService.updateComanda(this.barId, this.editingComanda);
      this.editarModalAbierto = false;
      this.editingComanda = null;
      // Informar al usuario
      const ok = await this.alertController.create({
        header: 'Enviado',
        message:
          'La modificación ha sido enviada al administrador. Te informaremos cuando la apruebe.',
        buttons: ['Aceptar'],
      });
      await ok.present();
    } catch (e) {
      console.error('Error al enviar modificación', e);
      window.alert('No se pudo enviar la modificación.');
    }
  }
  async llamarCamarero() {
    if (!this.mesa) {
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'No se ha identificado la mesa.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    const header = await firstValueFrom(this.translateService.get('MENU.CALL_WAITER'));
    const confirmMessage = header + '?';

    const alert = await this.alertController.create({
      header: header,
      message: confirmMessage,
      buttons: [
        {
          text: await firstValueFrom(this.translateService.get('COMMON.CANCEL')),
          role: 'cancel'
        },
        {
          text: await firstValueFrom(this.translateService.get('COMMON.CONFIRM')),
          handler: () => {
            this.enviarAvisoCamarero();
          }
        }
      ]
    });
    await alert.present();
  }

  async enviarAvisoCamarero() {
    const aviso = {
      mesa: this.mesa,
      fecha: new Date().toISOString(),
      items: [{
        id: 'call_waiter',
        nombre: '🔔 LLAMADA CAMARERO',
        cantidad: 1,
        precio: 0,
        opciones: []
      }],
      estado: 'pendiente',
      observaciones: 'Solicitud de asistencia'
    };
    
    try {
      await this.dataService.addComanda(this.barId, aviso);
      const msg = await firstValueFrom(this.translateService.get('MENU.WAITER_CALLED'));
      const toast = await this.toastController.create({
        message: msg,
        duration: 2000,
        position: 'top',
        color: 'success',
        icon: 'notifications'
      });
      await toast.present();
    } catch (error) {
      console.error('Error enviando aviso', error);
      const toast = await this.toastController.create({
        message: 'Error al conectar con el servidor',
        duration: 2000,
        position: 'top',
        color: 'danger'
      });
      await toast.present();
    }
  }
}
