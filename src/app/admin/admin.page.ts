import { Component, OnInit } from '@angular/core';
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
  IonMenuButton,
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
  IonItemDivider,
  IonModal,
  IonSpinner,
  PopoverController,
  AlertController,
  MenuController,
} from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular/standalone';
import { InformeMesaModalComponent } from '../informe-mesa-modal/informe-mesa-modal.component';
import { Router } from '@angular/router';
import { DataService } from '../data.service';
import { LanguageService } from '../language.service';
import { LanguageSelectorComponent } from '../language-selector.component';
import { TranslateModule } from '@ngx-translate/core';
import { Observable } from 'rxjs';

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
    IonMenuButton,
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
    IonItemDivider,
    IonModal,
    IonSpinner,
    CommonModule,
    FormsModule,
    TranslateModule,
    InformeMesaModalComponent,
  ],
})
export class AdminPage implements OnInit {
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
  mesaActual: string = ''; // Nueva variable para guardar la mesa actual
  isSubscribed: boolean = true;
  trialActive: boolean = false;
  remainingTrialDays: number = 0;
  isLoading: boolean = true;
  // Controla si la tarjeta superior está desplegada (true) o plegada (false)
  cardExpanded: boolean = true;
  // Controla si el enlace "Gestionar suscripción" aparece en el menú lateral
  showManageInMenu: boolean = false;
  // Nombre del producto de la suscripción (Basic, Estándar, Premium, etc.)
  subscriptionProductName: string | null = null;

  modificarCabecera() {
    // Crear input file dinámicamente
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
  }

  toggleMenu() {
    this.menuController.toggle();
  }

  ngOnInit() {
    this.backendUrl =
      window.location.hostname === 'localhost'
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
    this.dataService.getCabeceraImagen(this.barId).subscribe((data: any) => {
      this.cabeceraImagen = data?.imagen || null;
    });
    // Cargar trialStart desde DB
    this.dataService.getTrialStart(this.barId).subscribe((data: any) => {
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
    this.comandas$.subscribe((todas) => {
      this.comandas = todas;
      this.comandasPorMesa = {};
      todas.forEach((c) => {
        if (!this.comandasPorMesa[c.mesa]) this.comandasPorMesa[c.mesa] = [];
        this.comandasPorMesa[c.mesa].push(c);
      });
      this.recomputeMesasOrdenadas();
    });
    this.productos$.subscribe((productos) => {
      this.productos = productos;
    });

    // Auto-plegar la tarjeta superior 5 segundos después de cargar la página
    setTimeout(() => {
      this.cardExpanded = false;
    }, 5000);
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
    comanda.estado = estado;
    this.dataService.updateComanda(this.barId, comanda);
  }

  marcarMesaPagada(mesa: string) {
    // Normalizar el nombre de la mesa al guardar en historial
    const mesaNormalizada = String(mesa).trim().toLowerCase();
    const pedidosMesa = (this.comandasPorMesa[mesa] || []).map((c) => ({
      ...c,
      mesa: mesaNormalizada, // Guardar la mesa normalizada
      total: c.items.reduce((subtotal: number, item: any) => {
        const prod = this.productos.find((p: any) => p.id === item.id);
        return subtotal + (prod ? prod.precio * item.cantidad : 0);
      }, 0),
      pagadoEn: new Date().toISOString(),
      fechaDia: c.fecha
        ? c.fecha.slice(0, 10)
        : new Date().toISOString().slice(0, 10),
    }));
    // Guardar en historial cada comanda
    pedidosMesa.forEach((pedido) => {
      this.dataService.addHistorial(this.barId, pedido);
    });
    // Guardar informe resumen de la mesa
    if (pedidosMesa.length) {
      const informeMesa = {
        mesa: mesaNormalizada,
        pedidos: pedidosMesa,
        total: pedidosMesa.reduce((sum, p) => sum + (p.total || 0), 0),
        pagadoEn: new Date().toISOString(),
        fechaDia: pedidosMesa[0].fechaDia,
        tipo: 'resumen_mesa',
      };
      this.dataService.addHistorial(this.barId, informeMesa);
    }
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
    const entradas = Object.keys(this.comandasPorMesa).map((k) => ({
      key: k,
      value: this.comandasPorMesa[k] || [],
    }));

    const mesaPriority = (m: { key: string; value: any[] }) => {
      const v = m.value || [];
      // Filtrar items de llamada al camarero para la prioridad de estado de pedido,
      // pero si hay llamada al camarero debe tener alta prioridad visual.
      // Aquí definimos prioridad:
      // -1: llamada camarero (muy urgente)
      // 0: pago pendiente
      // 1: pedido no preparado
      // 2: todo ok/preparado
      if (v.some((c) => c.items.some((i: any) => i.id === 'call_waiter'))) return -1;
      if (v.some((c) => c.estado === 'pago_pendiente')) return 0;
      // Filtrar comandas que solo sean llamadas al camarero para no afectar la logica de cocina si no queremos
      const pedidosComida = v.filter(c => !c.items.some((i:any) => i.id === 'call_waiter'));
      if (pedidosComida.some((c) => c.estado !== 'preparado')) return 1;
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

  badgeColor(mesa: { key: string; value: any[] }) {
    const v = mesa.value || [];
    if (v.some((c) => c.estado === 'pago_pendiente')) return 'danger';
    if (v.some((c) => c.estado === 'preparando')) return 'warning';
    if (v.every((c) => c.estado === 'preparado')) return 'success';
    return 'medium';
  }

  badgeLabel(mesa: { key: string; value: any[] }) {
    const v = mesa.value || [];
    if (v.some((c) => c.estado === 'pago_pendiente')) return 'Pago pendiente';
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

  verInformeMesa(mesa: string) {
    this.productos$.subscribe((productos) => {
      const comandas = this.comandasPorMesa[mesa] || [];
      // Ordenar las comandas: primero las que son accionables
      // - prioridad 0: estado 'preparando' (muestran botón 'Preparado')
      // - prioridad 1: estados distintos de 'preparado' y 'pago_pendiente' (muestran botón 'En preparación')
      // - prioridad 2: resto (por ejemplo 'preparado' o 'pago_pendiente')
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
      this.informeTotal = comandas.reduce((total, comanda) => {
        return (
          total +
          comanda.items.reduce((subtotal: number, item: any) => {
            const prod = productos.find((p: any) => p.id === item.id);
            return subtotal + (prod ? prod.precio * item.cantidad : 0);
          }, 0)
        );
      }, 0);
      console.log('Total de la mesa', mesa, ':', this.informeTotal);
      this.mesaActual = mesa; // Guardamos la mesa actual para imprimir/descargar
      (async () => {
        const modal = await this.modalController.create({
          component: InformeMesaModalComponent,
          componentProps: {
            informeMesa: this.informeMesa,
            informeTotal: this.informeTotal,
            mesaActual: mesa,
            productos: this.productos,
            actualizarEstadoComanda: (comanda: any, estado: string) =>
              this.actualizarEstadoComanda(comanda, estado),
            confirmarMarcarMesaPagada: (m: string) =>
              this.confirmarMarcarMesaPagada(m),
            getPrecioProducto: (id: string) => this.getPrecioProducto(id),
            goToInformeMesa: (m: string) => this.goToInformeMesa(m),
          },
        });
        await modal.present();
      })();
    });
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

  agregarUsuario() {
    if (!this.nuevoUsuario || !this.nuevaPassword) return;
    this.usuarios$.subscribe((usuarios) => {
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
    });
  }

  eliminarUsuario(usuarioId: string) {
    if (!usuarioId) return;
    // No eliminar admin por seguridad
    this.usuarios$.subscribe((usuarios) => {
      const user = usuarios.find((u: any) => u.id === usuarioId);
      if (user && user.usuario !== 'admin') {
        this.dataService.deleteComanda(this.barId, usuarioId); // Cambia a deleteUsuario si implementas ese método
      }
    });
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  goToCategorias() {
    this.router.navigate(['/categorias']);
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

  goToEstadisticas() {
    this.router.navigate(['/admin/estadisticas']);
  }

  imprimirInformeMesa() {
    // Imprime solo el contenido del informe
    const printContents = document.getElementById('informe-mesa')?.innerHTML;
    if (printContents) {
      const originalContents = document.body.innerHTML;
      document.body.innerHTML = printContents;
      window.print();
      document.body.innerHTML = originalContents;
      location.reload(); // Recarga para restaurar el estado
    }
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
  
  // Helper para obtener las comandas de comida (excluyendo llamadas)
  getComandasComida(mesa: { key: string; value: any[] }): any[] {
    const v = mesa.value || [];
    return v.filter((c) => !c.items.some((i: any) => i.id === 'call_waiter'));
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
}
