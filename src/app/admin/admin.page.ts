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
  IonButton,
  IonItemDivider,
  IonModal,
  PopoverController,
} from '@ionic/angular/standalone';
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
    IonLabel,
    IonButton,
    IonItemDivider,
    IonModal,
    CommonModule,
    FormsModule,
    TranslateModule,
  ],
})
export class AdminPage implements OnInit {
  comandas$: Observable<any[]>;
  productos$: Observable<any[]>;
  usuarios$: Observable<any[]>;
  comandas: any[] = [];
  comandasPorMesa: { [mesa: string]: any[] } = {};
  informeMesa: any = null;
  informeTotal: number = 0;
  mostrarInforme: boolean = false;
  usuarioLogado: string = '';
  nuevoUsuario: string = '';
  nuevaPassword: string = '';
  barId: string;
  productos: any[] = [];
  mesaActual: string = ''; // Nueva variable para guardar la mesa actual
  isSubscribed: boolean = false;
  trialActive: boolean = false;

  constructor(
    private router: Router,
    private dataService: DataService,
    private languageService: LanguageService,
    private popoverController: PopoverController
  ) {
    this.barId = this.dataService.getBarId();
    this.comandas$ = this.dataService.getComandas(this.barId);
    this.productos$ = this.dataService.getProductos(this.barId);
    this.usuarios$ = this.dataService.getUsuarios(this.barId);
  }

  ngOnInit() {
    const logged = localStorage.getItem('isLoggedIn');
    if (logged !== 'true') {
      this.router.navigate(['/login']);
    }
    this.usuarioLogado = localStorage.getItem('usuario') || '';
    this.comandas$.subscribe((todas) => {
      this.comandas = todas;
      this.comandasPorMesa = {};
      todas.forEach((c) => {
        if (!this.comandasPorMesa[c.mesa]) this.comandasPorMesa[c.mesa] = [];
        this.comandasPorMesa[c.mesa].push(c);
      });
    });
    this.productos$.subscribe((productos) => {
      this.productos = productos;
    });
    // Lógica de suscripción (simulada, requiere backend real para producción)
    const usuario = localStorage.getItem('usuario');
    const trialStart = localStorage.getItem('trialStart');
    const isSubscribed = localStorage.getItem('isSubscribed');
    if (!trialStart) {
      // Primer login: inicia trial
      localStorage.setItem('trialStart', new Date().toISOString());
      this.trialActive = true;
    } else {
      const now = new Date();
      const trialDate = new Date(trialStart);
      this.trialActive =
        now.getTime() - trialDate.getTime() < 30 * 24 * 60 * 60 * 1000;
    }
    this.isSubscribed = isSubscribed === 'true';
    if (!this.isSubscribed && !this.trialActive) {
      alert(
        'Tu periodo de prueba ha finalizado. Debes suscribirte para continuar.'
      );
      this.router.navigate(['/suscripcion']);
    }
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
      this.informeMesa = comandas;
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
      this.mostrarInforme = true;
      this.mesaActual = mesa; // Guardamos la mesa actual para imprimir/descargar
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
    localStorage.removeItem('isLoggedIn');
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
}
