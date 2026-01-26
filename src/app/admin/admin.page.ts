import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonMenu,
  IonList,
  IonItem,
  IonIcon,
  IonButtons,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonLabel,
  IonBadge,
  IonButton,
  IonModal,
  IonSpinner,
  IonInput,
  PopoverController,
  AlertController,
  MenuController,
  IonChip,
} from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular/standalone';
import { InformeMesaModalComponent } from '../informe-mesa-modal/informe-mesa-modal.component';
import { Router } from '@angular/router';
import { DataService } from '../data.service';
import { LanguageService } from '../language.service';
import { LanguageSelectorComponent } from '../language-selector.component';
import { TranslateModule } from '@ngx-translate/core';
import { Observable, firstValueFrom, Subscription } from 'rxjs';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.page.html',
  styleUrls: ['./admin.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonMenu,
    IonList,
    IonItem,
    IonIcon,
    IonButtons,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonBadge,
    IonLabel,
    IonButton,
    IonSpinner,
    IonModal,
    IonInput,
    IonChip,
    CommonModule,
    FormsModule,
    TranslateModule,
  ],
})
export class AdminPage implements OnInit, OnDestroy {
  modalNombreBarAbierto: boolean = false;
  backendUrl!: string;
  customerId!: string;

  public abrirModalNombreBar() {
    this.modalNombreBarAbierto = true;
  }

  public cerrarModalNombreBar() {
    this.modalNombreBarAbierto = false;
  }
  barNombre: string = '';
  cabeceraImagen: string | null = null;
  comandas$: Observable<any[]>;
  productos$: Observable<any[]>;
  usuarios$: Observable<any[]>;
  categorias$: Observable<any[]>;
  comanderos$: Observable<any[]>;
  
  comandas: any[] = [];
  comandasPorMesa: { [mesa: string]: any[] } = {};
  mesasOrdenadas: Array<{ key: string; value: any[] }> = [];
  mesasExpanded: { [mesa: string]: boolean } = {};
  informeMesa: any = null;
  informeTotal: number = 0;
  mostrarInforme: boolean = false;
  usuarioLogado: string = '';
  nuevoUsuario: string = '';
  nuevaPassword: string = '';
  barId: string;
  productos: any[] = [];
  categorias: any[] = [];
  comanderos: any[] = [];
  filtroComanderoId: string = 'todos';

  mesaActual: string = '';
  isSubscribed: boolean = true;
  trialActive: boolean = false;
  remainingTrialDays: number = 0;
  isLoading: boolean = true;
  cardExpanded: boolean = true;
  showManageInMenu: boolean = false;
  subscriptionProductName: string | null = null;
  
  // Logic for automatic printing
  private printingInitialized = false;
  autoPrintEnabled = true; 
  private qzConnected = false;

  modificarCabecera() {
    // ... (unchanged)
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (event: any) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (e: any) => {
          const imagenBase64 = e.target.result;
          try {
            await this.dataService.guardarCabeceraImagen(
              this.barId,
              imagenBase64
            );
            alert('Imagen de cabecera actualizada correctamente');
          } catch (err) {
            console.error('Error al guardar la imagen de cabecera:', err);
            alert('Error al guardar la imagen de cabecera');
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  }

  constructor(
    private router: Router,
    private dataService: DataService,
    private languageService: LanguageService,
    private popoverController: PopoverController,
    private alertController: AlertController,
    private modalController: ModalController,
    private menuController: MenuController
  ) {
    this.barId = this.dataService.getBarId();
    this.comandas$ = this.dataService.getComandas(this.barId);
    this.productos$ = this.dataService.getProductos(this.barId);
    this.usuarios$ = this.dataService.getUsuarios(this.barId);
    this.categorias$ = this.dataService.getCategorias(this.barId);
    this.comanderos$ = this.dataService.getComanderos(this.barId);
  }

  toggleMenu() {
    this.menuController.toggle();
  }

  // Subscription cleanup
  private subs: Subscription[] = [];

  ngOnInit() {
    this.backendUrl =
      window.location.hostname === 'localhost' && window.location.protocol === 'http:'
        ? 'http://localhost:3000'
        : 'https://backendelcomensal.onrender.com';
    // Leer valor guardado previamente (si existe)
    this.subscriptionProductName = localStorage.getItem(
      'subscriptionProductName'
    );
    const email = localStorage.getItem('correo');
    if (email) {
      fetch(`${this.backendUrl}/get-customer-by-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
        .then((res) => {
          if (res.status === 404) {
            console.log('usuario no encontrado en stripe');
            this.isSubscribed = false;
            this.isLoading = false;
            return;
          }
          return res.json();
        })
        .then((data) => {
          if (!data) return; // Skip if 404
          this.customerId = data.customerId;
          console.log(
            'Llamando check-subscription con customerId:',
            this.customerId
          );
          // Llamada al backend para verificar suscripción
          fetch(`${this.backendUrl}/check-subscription`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ customerId: this.customerId }),
          })
            .then(async (response) => {
              if (response.status === 200) {
                const data = await response.json();
                console.log('Resultado check-subscription:', data);
                this.isSubscribed = data.isSubscribed === true;
                // Guardar el nombre del producto de la suscripción en localStorage si existe
                if (
                  data.items &&
                  Array.isArray(data.items) &&
                  data.items.length > 0 &&
                  data.items[0].product &&
                  data.items[0].product.name
                ) {
                  const productName = data.items[0].product.name;
                  localStorage.setItem('subscriptionProductName', productName);
                  this.subscriptionProductName = productName;
                } else {
                  localStorage.removeItem('subscriptionProductName');
                  this.subscriptionProductName = null;
                }
                this.isLoading = false;
              } else if (response.status === 500) {
                const error = await response.json();
                console.log('Error check-subscription:', error);
                if (!this.trialActive) {
                  alert(
                    'Tu periodo de prueba ha finalizado. Debes suscribirte para continuar.'
                  );
                  this.router.navigate(['/suscripcion']);
                }
              }
            })
            .catch((err) => {
              console.error('Error al verificar suscripción:', err);
              if (!this.trialActive) {
                alert(
                  'Tu periodo de prueba ha finalizado. Debes suscribirte para continuar.'
                );
                this.router.navigate(['/suscripcion']);
              }
              this.isLoading = false;
            });
        })
        .catch((err) => {
          console.error('Error obteniendo customerId:', err);
          this.isLoading = false;
        });
    }
    const logged = localStorage.getItem('isLoggedIn');
    if (logged !== 'true') {
      this.router.navigate(['/login']);
      return;
    }
    this.usuarioLogado = localStorage.getItem('usuario') || '';
    // Cargar imagen de cabecera
    this.subs.push(
      this.dataService.getCabeceraImagen(this.barId).subscribe((data: any) => {
        this.cabeceraImagen = data?.imagen || null;
      })
    );
    // Cargar trialStart desde DB - AHORA ES PROMESA (ONE-TIME FETCH)
    this.dataService.getTrialStart(this.barId).then((data: any) => {
      let trialStart = data?.trialStart;
      if (!trialStart) {
        // Si no existe, establecerlo ahora
        trialStart = new Date().toISOString();
        // Opcional: guardar en DB, pero por ahora solo local
      }
      const now = new Date();
      const trialDate = new Date(trialStart);
      this.trialActive =
        now.getTime() - trialDate.getTime() < 30 * 24 * 60 * 60 * 1000;
      if (this.trialActive) {
        const diffMs =
          30 * 24 * 60 * 60 * 1000 - (now.getTime() - trialDate.getTime());
        this.remainingTrialDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
      }
    });

    // Gestionar suscripciones manualmente para evitar leaks
    this.subs.push(
      this.comandas$.subscribe((todas) => {
        this.comandas = todas;
        this.comandasPorMesa = {};
        todas.forEach((c) => {
          if (!this.comandasPorMesa[c.mesa]) this.comandasPorMesa[c.mesa] = [];
          this.comandasPorMesa[c.mesa].push(c);
        });

        // AUTO-PRINT LOGIC
        if (this.printingInitialized && this.autoPrintEnabled) {
             const newOrders = todas.filter(c => 
                c.estado !== 'preparando' && 
                c.estado !== 'preparado' && 
                c.estado !== 'pago_pendiente' &&
                !c.items.some((i: any) => i.id === 'call_waiter') // Don't print waiter calls usually
             );
             if (newOrders.length > 0) {
                 this.autoPrintComandas(newOrders);
             }
        }
        this.printingInitialized = true;

        this.recomputeMesasOrdenadas();
      })
    );
    this.subs.push(
      this.productos$.subscribe((productos) => {
        this.productos = productos;
        this.recomputeMesasOrdenadas();
      })
    );
    this.subs.push(
      this.categorias$.subscribe((cats) => {
        this.categorias = cats;
        this.recomputeMesasOrdenadas();
      })
    );
    this.subs.push(
      this.comanderos$.subscribe((coms) => {
        this.comanderos = coms;
      })
    );

    // Auto-plegar la tarjeta superior 5 segundos después de cargar la página
    setTimeout(() => {
      this.cardExpanded = false;
    }, 5000);

    this.initQZ();
  }

  async initQZ() {
    const qz = (window as any).qz;
    if (!qz) return;

    try {
      if (!qz.websocket.isActive()) {
        await qz.websocket.connect();
        console.log('QZ Tray connected');
        this.qzConnected = true;
      }
    } catch (e) {
      console.error('Error connecting to QZ Tray', e);
    }
  }
  
  cambiarFiltroComandero(id: string) {
    this.filtroComanderoId = id;
    this.recomputeMesasOrdenadas();
  }

  isItemVisible(itemId: string): boolean {
    if (this.filtroComanderoId === 'todos') return true;
    const prod = this.productos.find(p => p.id === itemId);
    if (!prod) return false;
    const cat = this.categorias.find(c => c.id === prod.categoria);
    if (!cat) return false;
    return cat.comanderoId === this.filtroComanderoId;
  }

  ngOnDestroy() {
    this.subs.forEach((s) => s.unsubscribe());
  }

  async irAMesa(event: Event) {
    event.stopPropagation();
    const alert = await this.alertController.create({
      header: 'Ir a Mesa',
      message: 'Introduce el número de mesa:',
      inputs: [
        {
          name: 'mesa',
          type: 'text',
          placeholder: 'Nº Mesa',
        },
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Ir',
          handler: (data) => {
            if (data.mesa) {
              let publicOrigin = window.location.origin;
              if (publicOrigin.startsWith('capacitor-electron')) {
                publicOrigin = 'https://elrestaurante.store';
              }
              const url = `${publicOrigin}/carta/${this.barId}?mesa=${data.mesa}`;
              
              const electronAPI = (window as any).electronAPI;
              if (electronAPI && electronAPI.openExternal) {
                // Abre en el navegador del sistema si es Electron
                electronAPI.openExternal(url);
              } else {
                // Abre en nueva pestaña si es web normal
                window.open(url, '_blank');
              }
            }
          },
        },
      ],
    });
    await alert.present();
  }

  toggleTopCard() {
    this.cardExpanded = !this.cardExpanded;
  }

  // Determina si el selector de idioma debe mostrarse.
  // Ocultamos el selector para planes 'Basic' y 'Estándar' (tolerando acentos y mayúsculas).
  get showLanguageSelector(): boolean {
    if (!this.subscriptionProductName) return true; // por defecto mostrar
    const normalized = this.subscriptionProductName
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase();
    return !(normalized === 'basic' || normalized === 'estandar');
  }

  async confirmarLimpiarComandas() {
    const alert = await this.alertController.create({
      header: 'Confirmar',
      message:
        '¿Está usted seguro de eliminar todas las comandas de todas las mesas?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          handler: () => {
            console.log('Cancelado');
          },
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.limpiarComandas();
          },
        },
      ],
    });

    await alert.present();
  }

  async confirmarMarcarMesaPagada(mesa: string) {
    const alert = await this.alertController.create({
      header: 'Confirmar',
      message: 'Va a marcar el pedido como pagado. ¿Desea confirmar? ',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          handler: () => {
            console.log('Cancelado marcar mesa pagada');
          },
        },
        {
          text: 'Confirmar',
          handler: () => {
            this.marcarMesaPagada(mesa);
            this.modalController.dismiss();
          },
        },
      ],
    });

    await alert.present();
  }

  limpiarComandas() {
    this.comandas.forEach((c) =>
      this.dataService.deleteComanda(this.barId, c.id)
    );
  }

  actualizarEstadoComanda(comanda: any, estado: string) {
    if (!comanda || typeof comanda !== 'object') {
      console.error('Comanda inválida:', comanda);
      return;
    }
    // IMPORTANT: Retrieve the original comanda from the main list.
    // The 'comanda' passed here might be a filtered copy from getComandasComida,
    // which may have missing items. We must NOT save the filtered copy.
    const originalComanda = this.comandas.find(c => c.id === comanda.id);
    if (originalComanda) {
      const updated = { ...originalComanda, estado: estado };
      this.dataService.updateComanda(this.barId, updated);
    } else {
      console.warn('Original comanda not found, using passed object (risk of data loss if filtered)');
      comanda.estado = estado;
      this.dataService.updateComanda(this.barId, comanda);
    }
  }

  // Nueva función para guardar cambios en los items (cantidades, eliminaciones)
  guardarComandaModificada(comanda: any) {
    if (!comanda || !comanda.id) return;
    
    // Si la comanda está filtrada (por comandero), "comanda.items" puede tener solo un subset.
    // PERO, en este caso, estamos visualizando la comanda "modificada" en el modal.
    // Si 'filtroComanderoId' está activo, 'comanda.items' en el modal SOLO tiene los items de ese comandero.
    // Si guardamos eso directamente, borraremos los items de otros comanderos.
    // ¡CUIDADO!
    
    const original = this.comandas.find(c => c.id === comanda.id);
    if (!original) {
        // Fallback: guardar lo que nos llega (peligroso si estaba filtrado, pero inevitable si no tenemos original)
        this.dataService.updateComanda(this.barId, comanda);
        return;
    }

    if (this.filtroComanderoId !== 'todos') {
        // MERGE LOGIC:
        // Los items en 'comanda.items' son los que se ven en el modal (y se han modificado).
        // Los items que NO están en 'comanda.items' (porque fueron filtrados) deben conservarse del original.
        // Pero espera... si el modal recibe una COPIA filtrada, ¿cómo sabemos si un item se eliminó porque el usuario lo borró o porque estaba filtrado?
        // Ah, 'verInformeMesa' crea una copia filtrada:
        // comandas = comandas.map(c => { ... items: filteredItems ... })
        
        // Si el usuario modifica esa copia, solo modifica los items visibles.
        // Entonces, para guardar:
        // 1. Tomar los items "intactos" del original (los que no son visibles en este filtro).
        // 2. Tomar los items "modificados" del modal (los que son visibles).
        // Nota: Si el usuario borró un item en el modal, ya no estará en comanda.items.
        
        // Identificar items que deberían ser visibles en este filtro:
        const itemsNoVisibles = original.items.filter((i: any) => 
             i.id === 'call_waiter' || !this.isItemVisible(i.id)
        );
        
        // Los items en el objeto modificado 'comanda' son los visibles (y quizás modificados).
        const itemsVisiblesYModificados = comanda.items; // Estos ya están filtrados y editados en el modal.
        
        const itemsFinales = [...itemsNoVisibles, ...itemsVisiblesYModificados];
        
        const updated = {
            ...original,
            items: itemsFinales,
            // Estado y otros campos deberían venir de 'comanda' si se modificaron, o mantenerse.
            // En este caso solo modificamos items en el modal con +/-.
        };
        this.dataService.updateComanda(this.barId, updated);
        
    } else {
        // Si no hay filtro, el modal tiene TODOS los items. Podemos confiar en comanda.items (salvo que sea paranoico).
        // Mejor hacer merge seguro de propiedades.
        const updated = {
            ...original,
            items: comanda.items 
        };
        this.dataService.updateComanda(this.barId, updated);
    }
  }

  marcarMesaPagada(mesa: string) {
    // Normalizar el nombre de la mesa al guardar en historial
    const mesaNormalizada = String(mesa).trim().toLowerCase();
    const hoy = new Date().toISOString();
    const hoyDia = hoy.slice(0, 10);

    const pedidosMesa = (this.comandasPorMesa[mesa] || []).map((c) => ({
      ...c,
      mesa: mesaNormalizada,
      total: c.items.reduce((subtotal: number, item: any) => {
        const prod = this.productos.find((p: any) => p.id === item.id);
        return subtotal + (prod ? prod.precio * item.cantidad : 0);
      }, 0),
      pagadoEn: hoy,
      fechaDia: c.fecha ? c.fecha.slice(0, 10) : hoyDia,
    }));

    // Guardar únicamente el informe resumen de la mesa (Ticket Total)
    if (pedidosMesa.length) {
      const informeMesa = {
        mesa: mesaNormalizada,
        pedidos: pedidosMesa,
        total: pedidosMesa.reduce((sum, p) => sum + (p.total || 0), 0),
        pagadoEn: hoy,
        fecha: hoy, // CAMPO CRITICO PARA EL ORDERBY DE FIRESTORE
        fechaDia: hoyDia,
        tipo: 'resumen_mesa',
      };
      this.dataService.addHistorial(this.barId, informeMesa);
    }

    // Elimar las comandas activas de la base de datos
    (this.comandasPorMesa[mesa] || []).forEach((c) => {
      this.dataService.deleteComanda(this.barId, c.id);
    });

    // Forzar actualización inmediata de la lista de comandas
    this.comandas = this.comandas.filter((c) => c.mesa !== mesa);
    this.comandasPorMesa[mesa] = [];
    this.recomputeMesasOrdenadas();
  }

  /**
   * Reconstruye `mesasOrdenadas` a partir de `comandasPorMesa`.
   * Ordena por prioridad:
   *  - prioridad 0: tiene al menos una comanda con estado 'pago_pendiente'
   *  - prioridad 1: tiene alguna comanda con estado diferente a 'preparado' (urgente)
   *  - prioridad 2: todas las comandas están 'preparado' (menos urgente)
   * Dentro de la misma prioridad, ordena por la fecha más reciente (desc).
   */
  recomputeMesasOrdenadas() {
    let entradas = Object.keys(this.comandasPorMesa).map((k) => ({
      key: k,
      value: this.comandasPorMesa[k] || [],
    }));
    
    // Filter mesas based on visible items
    entradas = entradas.filter(mesa => {
      const v = mesa.value || [];
      // If filtering by comandero, exclude 'pago_pendiente' or 'call_waiter'?
      // Assuming we want to show the table if it has ANY relevant item or special status that affects the comandero?
      // Actually user said: "desde cocina solamente vean los productos que le afectan".
      // So if I am Kitchen, I only see tables with Kitchen items.
      
      // If filtering is active...
      if (this.filtroComanderoId !== 'todos') {
         const hasVisibleItems = v.some(c => 
           c.items.some((i: any) => i.id !== 'call_waiter' && this.isItemVisible(i.id))
         );
         // What if it is a waiter call? Typically waiter calls go to everyone or specific?
         // Let's assume Waiter Calls (call_waiter) are relevant to EVERYONE or maybe just Bar/Waiters.
         // For now, if filtered, show only if has visible items (food/drink).
         return hasVisibleItems;
      }
      
      return true;
    });

    const mesaPriority = (m: { key: string; value: any[] }) => {
      const v = m.value || [];
      // Filtrar items de llamada al camarero para la prioridad de estado de pedido,
      // pero si hay llamada al camarero debe tener alta prioridad visual.
      // Aquí definimos prioridad:
      // -1: llamada camarero (muy urgente)
      // 0: pago pendiente
      // 1: pedido no preparado (solo de items visibles)
      // 2: todo ok/preparado
      
      // Note: If we are in "Cocina" mode, maybe "Pago pendiente" or "Call Waiter" is not relevant?
      // But typically "Call Waiter" is high urgency. Let's keep it visible in 'todos' but hidden in specific comandero view?
      // In the filter above, I filtered out mesas without visible items.
      
      if (v.some((c) => c.items.some((i: any) => i.id === 'call_waiter'))) return -1;
      if (v.some((c) => c.estado === 'pago_pendiente')) return 0;
      
      // Filtrar comandas que solo sean llamadas al camarero para no afectar la logica de cocina
      const pedidosComida = v.filter(c => !c.items.some((i:any) => i.id === 'call_waiter'));
      
      // IMPORTANT: Check status of VISIBLE items only
      const hasUnprepared = pedidosComida.some(c => 
        c.items.some((i: any) => this.isItemVisible(i.id)) && // Should contain at least one visible item
        c.estado !== 'preparado' 
        // Note: c.estado is per comanda, not per item.
        // If the comanda is not prepared, it is not prepared for EVERYONE.
        // But if I am Kitchen, and the order has Drink(Bar) and Food(Kitchen), and it is 'pendiente'.
        // It shows as 'pendiente'.
      );
      
      if (hasUnprepared) return 1;
      return 2;
    };

    const latestFecha = (m: { key: string; value: any[] }) => {
      const v = m.value || [];
      let max = 0;
      v.forEach((c) => {
        const t = c && c.fecha ? new Date(c.fecha).getTime() : 0;
        if (t > max) max = t;
      });
      return max;
    };

    entradas.sort((a, b) => {
      const pa = mesaPriority(a);
      const pb = mesaPriority(b);
      if (pa !== pb) return pa - pb; // prioridad asc (-1 primero)
      // misma prioridad: mesas con más reciente comanda primero
      const ta = latestFecha(a);
      const tb = latestFecha(b);
      if (ta !== tb) return tb - ta;
      // fallback: ordenar numéricamente si es posible, sino lexicográfico
      const na = parseInt(a.key as any, 10);
      const nb = parseInt(b.key as any, 10);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return String(a.key).localeCompare(String(b.key));
    });

    this.mesasOrdenadas = entradas;
  }

  toggleMesa(mesaKey: string) {
    this.mesasExpanded[mesaKey] = !this.mesasExpanded[mesaKey];
  }

  getPreviewItems(mesa: { key: string; value: any[] }): any[] {
    try {
      const items = mesa?.value?.[0]?.items;
      if (Array.isArray(items)) return items.slice(0, 3);
    } catch (e) {}
    return [];
  }

  getPreviewCount(mesa: { key: string; value: any[] }): number {
    try {
      const items = mesa?.value?.[0]?.items;
      if (Array.isArray(items)) return items.length;
    } catch (e) {}
    return 0;
  }

  getComensales(mesa: { key: string; value: any[] }): number | undefined {
    return mesa.value?.find((c) => c.numeroComensales)?.numeroComensales;
  }

  badgeColor(mesa: { key: string; value: any[] }) {
    const v = mesa.value || [];
    if (v.some((c) => c.estado === 'pago_pendiente')) return 'danger';
    // Prioridad para "Recibido": si hay alguna comanda que no esté ni preparando ni preparada
    if (
      v.some(
        (c) =>
          c.estado !== 'preparando' &&
          c.estado !== 'preparado' &&
          c.estado !== 'pago_pendiente'
      )
    )
      return 'medium';
    if (v.some((c) => c.estado === 'preparando')) return 'warning';
    if (v.every((c) => c.estado === 'preparado')) return 'success';
    return 'medium';
  }

  badgeLabel(mesa: { key: string; value: any[] }) {
    const v = mesa.value || [];
    if (v.some((c) => c.estado === 'pago_pendiente')) return 'Pago pendiente';
    // Prioridad para "Recibido"
    if (
      v.some(
        (c) =>
          c.estado !== 'preparando' &&
          c.estado !== 'preparado' &&
          c.estado !== 'pago_pendiente'
      )
    )
      return 'Recibido';
    if (v.some((c) => c.estado === 'preparando')) return 'En preparación';
    if (v.every((c) => c.estado === 'preparado')) return 'Preparado';
    return 'Recibido';
  }

  getLatestFecha(mesa: { key: string; value: any[] }) {
    const v = mesa.value || [];
    let max = 0;
    v.forEach((c) => {
      const t = c && c.fecha ? new Date(c.fecha).getTime() : 0;
      if (t > max) max = t;
    });
    return max ? new Date(max) : null;
  }

  getTimeAgo(date: Date | null) {
    if (!date) return '';
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'ahora';
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  }

  mesaSolicitaPago(comandas: any[]): boolean {
    return (
      Array.isArray(comandas) &&
      comandas.some((c) => c.estado === 'pago_pendiente')
    );
  }

  async verInformeMesa(mesa: string) {
    const productos = await firstValueFrom(this.productos$);
    let comandas = this.comandasPorMesa[mesa] || [];
    
    // Filter items inside comandas based on active filter
    if (this.filtroComanderoId !== 'todos') {
        comandas = comandas.map(c => {
            const filteredItems = c.items.filter((i: any) => 
                // Always show Waiter Calls if necessary, or filter them too. 
                // Previous logic excluded Waiter Calls from food lists properly.
                // Here we want to show items RELEVANT to the comandero.
                i.id !== 'call_waiter' && this.isItemVisible(i.id)
            );
            return { ...c, items: filteredItems };
        }).filter(c => c.items.length > 0);
    }

    // Ordenar las comandas (using existing logic, but on filtered list)
    const rank = (c: any) => {
      if (!c || typeof c !== 'object') return 3;
      if (c.estado === 'preparando') return 0;
      if (c.estado !== 'preparado' && c.estado !== 'pago_pendiente') return 1;
      return 2;
    };
    this.informeMesa = [...comandas].sort((a: any, b: any) => {
      const ra = rank(a);
      const rb = rank(b);
      if (ra !== rb) return ra - rb;
      const ta = a && a.fecha ? new Date(a.fecha).getTime() : 0;
      const tb = b && b.fecha ? new Date(b.fecha).getTime() : 0;
      return tb - ta; // más recientes primero
    });
    
    this.informeTotal = this.informeMesa.reduce((total: number, comanda: any) => {
      return (
        total +
        comanda.items.reduce((subtotal: number, item: any) => {
          const prod = productos.find((p: any) => p.id === item.id);
          return subtotal + (prod ? prod.precio * item.cantidad : 0);
        }, 0)
      );
    }, 0);
    console.log('Total de la mesa (filtrado)', mesa, ':', this.informeTotal);
    this.mesaActual = mesa; // Guardamos la mesa actual para imprimir/descargar
    const modal = await this.modalController.create({
      component: InformeMesaModalComponent,
      componentProps: {
        informeMesa: this.informeMesa,
        informeTotal: this.informeTotal,
        mesaActual: mesa,
        productos: this.productos,
        categorias: this.categorias,
        comanderos: this.comanderos,
        filtroComanderoId: this.filtroComanderoId,
        actualizarEstadoComanda: (comanda: any, estado: string) =>
          this.actualizarEstadoComanda(comanda, estado),
        confirmarMarcarMesaPagada: (m: string) =>
          this.confirmarMarcarMesaPagada(m),
        getPrecioProducto: (id: string) => this.getPrecioProducto(id),
        updateComanda: (comanda: any) => this.guardarComandaModificada(comanda),
        goToInformeMesa: (m: string) => this.goToInformeMesa(m),
      },
    });
    await modal.present();
  }

  cerrarInformeMesa() {
    this.mostrarInforme = false;
    this.informeMesa = null;
    this.informeTotal = 0;
  }

  getPrecioProducto(id: string): number {
    const prod = this.productos.find((p: any) => p.id === id);
    return prod ? prod.precio : 0;
  }

  async agregarUsuario() {
    if (!this.nuevoUsuario || !this.nuevaPassword) return;
    const usuarios = await firstValueFrom(this.usuarios$);
    if (usuarios.find((u: any) => u.usuario === this.nuevoUsuario)) {
      alert('El usuario ya existe');
      return;
    }
    this.dataService.addUsuario(this.barId, {
      usuario: this.nuevoUsuario,
      password: this.nuevaPassword,
    });
    this.nuevoUsuario = '';
    this.nuevaPassword = '';
  }

  async eliminarUsuario(usuarioId: string) {
    if (!usuarioId) return;
    // No eliminar admin por seguridad
    const usuarios = await firstValueFrom(this.usuarios$);
    const user = usuarios.find((u: any) => u.id === usuarioId);
    if (user && user.usuario !== 'admin') {
      this.dataService.deleteComanda(this.barId, usuarioId); // Cambia a deleteUsuario si implementas ese método
    }
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  goToCategorias() {
    this.router.navigate(['/categorias']);
  }

  goToComanderos() {
    this.router.navigate(['/comanderos']);
  }

  goToProductos() {
    this.router.navigate(['/productos']);
  }

  goToGenerarQR() {
    this.router.navigate(['/generar-qr']);
  }

  goToHistorial() {
    this.router.navigate(['/historial']);
  }

  goToAnalytics() {
    this.router.navigate(['/admin/analytics']);
  }

  goToPromotions() {
    this.router.navigate(['/admin/promotions']);
  }

  goToEstadisticas() {
    this.router.navigate(['/admin/estadisticas']);
  }

  imprimirInformeMesa() {
    // Esta función es delegada ahora al componente InformeMesaModalComponent.
    // Si se necesitara imprimir desde aquí, se recomienda usar el método de ventana temporal.
    console.warn('imprimirInformeMesa en admin.page.ts está obsoleta. Use el modal.');
  }

  goToSuscripcion() {
    console.log('Navegando a Suscripción');
    this.router.navigate(['/suscripcion']);
  }

  async descargarInformeMesa() {
    // Descarga el informe como PDF usando jsPDF
    const jsPDF = (await import('jspdf')).jsPDF;
    const doc = new jsPDF();
    let y = 10;
    doc.setFontSize(16);
    doc.text(`Informe de mesa ${this.mesaActual}`, 10, y);
    y += 10;
    if (this.informeMesa && this.informeMesa.length > 0) {
      this.informeMesa.forEach((comanda: any, idx: number) => {
        doc.setFontSize(12);
        doc.text(`Comanda #${idx + 1}`, 10, y);
        y += 7;
        comanda.items.forEach((item: any) => {
          doc.text(
            `- ${item.nombre} x${item.cantidad} (${this.getPrecioProducto(
              item.id
            )}€ c/u)`,
            12,
            y
          );
          y += 6;
        });
        y += 2;
      });
      y += 4;
      doc.setFontSize(14);
      doc.text(`Total: ${this.informeTotal.toFixed(2)} €`, 10, y);
    } else {
      doc.text('No hay datos para esta mesa.', 10, y);
    }
    doc.save(`informe_mesa_${this.mesaActual}.pdf`);
  }

  descargarInforme() {
    let texto = 'Resumen de pedidos\n\n';
    if (this.informeMesa && this.informeMesa.length) {
      this.informeMesa.forEach((comanda: any) => {
        texto += `Fecha: ${new Date(comanda.fecha).toLocaleString()}\n`;
        comanda.items.forEach((item: any) => {
          texto += `- ${item.nombre} x${item.cantidad}`;
          if (item.opciones && item.opciones.length) {
            texto += ` (Opciones: ${item.opciones.join(', ')})`;
          }
          texto += ` | Precio: ${(
            this.getPrecioProducto(item.id) * item.cantidad
          ).toFixed(2)} EUR\n`;
        });
        texto += '\n';
      });
      texto += `TOTAL: ${this.informeTotal.toFixed(2)} EUR\n`;
    } else {
      texto += 'No hay pedidos para esta mesa.\n';
    }
    const blob = new Blob([texto], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'informe_mesa.txt';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  goToInformeMesa(mesa: string) {
    this.router.navigate(['/informe-mesa', mesa]);
  }

  getTotalMesa(comandas: any[]): number {
    if (!Array.isArray(comandas) || !this.productos) return 0;
    return comandas.reduce((total, comanda) => {
      // Ignorar comandas que son solo llamadas al camarero en el total monetario
      if (comanda.items.some((i: any) => i.id === 'call_waiter')) return total;
      return (
        total +
        comanda.items.reduce((subtotal: number, item: any) => {
          const prod = this.productos.find((p: any) => p.id === item.id);
          return subtotal + (prod ? prod.precio * item.cantidad : 0);
        }, 0)
      );
    }, 0);
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

  gestionarSuscripcion() {
    fetch(`${this.backendUrl}/create-customer-portal-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId: this.customerId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.url) {
          window.open(data.url, '_blank');
        } else {
          alert('No se pudo obtener el enlace de gestión de suscripción.');
        }
      })
      .catch(() => {
        alert('Error al conectar con el portal de Stripe.');
      });
  }
  // Helper para saber si una mesa tiene una llamada de camarero activa
  mesaTieneLlamada(mesa: { key: string; value: any[] }): boolean {
    const v = mesa.value || [];
    return v.some((c) => c.items.some((i: any) => i.id === 'call_waiter'));
  }
  
  // Helper para obtener las comandas de comida (excluyendo llamadas) y filtrando por comandero
  getComandasComida(mesa: { key: string; value: any[] }): any[] {
    const v = mesa.value || [];
    // We map to new objects to avoid mutating the original comanda with valid items for other views
    return v.map(c => {
       const filteredItems = c.items.filter((i: any) => 
         i.id !== 'call_waiter' && this.isItemVisible(i.id)
       );
       return { ...c, items: filteredItems };
    }).filter(c => c.items.length > 0);
  }

  // Método para "atender" la llamada (borrar la notificacion)
  atenderLlamada(mesaKey: string, event?: Event) {
    if (event) event.stopPropagation();
    const llamadas = (this.comandasPorMesa[mesaKey] || []).filter((c) => 
      c.items.some((i: any) => i.id === 'call_waiter')
    );
    llamadas.forEach((c) => {
       this.dataService.deleteComanda(this.barId, c.id);
    });
  }

  getComanderoName(comanderoId: string | null): string {
    if (!comanderoId) return 'General';
    const c = this.comanderos.find((com) => com.id === comanderoId);
    return c ? (c.descripcion || `Comandero ${c.numero}`) : 'General';
  }

  async autoPrintComandas(aImprimir: any[]) {
    if (!aImprimir || !aImprimir.length) return;

    // 1. Group items by Comandero
    const grupos: { [id: string]: any } = {};

    aImprimir.forEach((comanda) => {
      comanda.items.forEach((item: any) => {
        const prod = this.productos.find((p) => p.id === item.id);
        const catId = prod?.categoria;
        const cat = this.categorias.find((c) => c.id === catId);
        const cId = cat?.comanderoId || 'null';

        if (!grupos[cId]) {
          const comandero = this.comanderos.find(c => c.id === cId);
          grupos[cId] = {
            comanderoNombre: this.getComanderoName(cId),
            printerName: comandero?.printerName || null,
            comandas: {},
          };
        }

        if (!grupos[cId].comandas[comanda.id]) {
          grupos[cId].comandas[comanda.id] = {
            fecha: comanda.fecha,
            observaciones: comanda.observaciones,
            items: [],
            mesa: comanda.mesa,
          };
        }
        grupos[cId].comandas[comanda.id].items.push(item);
      });
    });

    // 2. Execute printing for each group
    const qz = (window as any).qz;

    for (const cId of Object.keys(grupos)) {
      const grupo = grupos[cId];
      let html = `<div style="font-family: 'Courier New', Courier, monospace; max-width: 250px; color: #000; font-size: 14px;">`;
      html += `<h1 style="text-align: center; font-size: 1.4em; border-bottom: 2px solid #000; margin-bottom: 5px;">${grupo.comanderoNombre.toUpperCase()}</h1>`;
      
      const mesasInvolved = [...new Set(Object.values(grupo.comandas).map((c: any) => c.mesa))].join(', ');
      html += `<h2 style="text-align: center; font-size: 1.8em; margin: 5px 0;">MESA ${mesasInvolved}</h2>`;
      html += `<div style="text-align: center; font-size: 0.7em; margin-bottom: 10px;">${new Date().toLocaleString()}</div>`;

      Object.keys(grupo.comandas).forEach((comId) => {
        const comData = grupo.comandas[comId];
        html += `<div style="border-top: 1px dashed #000; padding-top: 5px; margin-bottom: 10px;">`;
        html += `<ul style="list-style: none; padding: 0; margin: 5px 0;">`;

        comData.items.forEach((item: any) => {
          html += `<li style="font-size: 1.3em; margin-bottom: 3px;"><strong>${item.cantidad}x</strong> ${item.nombre}</li>`;
          if (item.opciones && item.opciones.length) {
            html += `<li style="font-size: 0.9em; padding-left: 15px; font-style: italic;">- ${item.opciones.join(', ')}</li>`;
          }
        });

        html += `</ul>`;
        if (comData.observaciones) {
          html += `<div style="font-size: 0.9em; background: #f0f0f0; padding: 4px; border: 1px solid #ddd;"><strong>OBS:</strong> ${comData.observaciones}</div>`;
        }
        html += `</div>`;
      });

      html += `<div style="text-align: center; margin-top: 15px; font-weight: bold; border-top: 1px solid #000;">*** FIN TICKET ***</div>`;
      html += `</div>`;

      // Integrated Native Printing (Electron)
      const electronAPI = (window as any).electronAPI;
      if (electronAPI && grupo.printerName) {
        try {
          await electronAPI.printToPrinter(html, grupo.printerName);
          console.log(`Printed to ${grupo.printerName} via Native Electron Bridge`);
        } catch (err) {
          console.error(`Native printing failed for ${grupo.printerName}`, err);
          this.fallbackPrint(html, grupo.comanderoNombre, mesasInvolved);
        }
      } else if (this.qzConnected && grupo.printerName) {
        // Fallback for QZ Tray if still present/used
        try {
          const qz = (window as any).qz;
          const config = qz.configs.create(grupo.printerName);
          const data = [{
            type: 'pixel',
            format: 'html',
            flavor: 'plain',
            data: html
          }];
          await qz.print(config, data);
          console.log(`Printed to ${grupo.printerName} via QZ`);
        } catch (err) {
          console.error(`Error printing to ${grupo.printerName} via QZ`, err);
          this.fallbackPrint(html, grupo.comanderoNombre, mesasInvolved);
        }
      } else {
        // Fallback to standard window.print()
        this.fallbackPrint(html, grupo.comanderoNombre, mesasInvolved);
      }
    }

    // 3. Update states automatically
    aImprimir.forEach((comanda) => {
      this.actualizarEstadoComanda(comanda, 'preparando');
    });
  }

  fallbackPrint(contenido: string, title: string, mesa: string) {
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(
        `<!doctype html><html><head><title>${title} - Mesa ${mesa}</title></head><body>${contenido}</body></html>`
      );
      w.document.close();
      w.focus();
      w.print();
      w.close();
    }
  }
}
