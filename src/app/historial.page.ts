import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonButtons,
  IonBackButton,
  IonDatetime,
  IonButton,
  IonSegment,
  IonSegmentButton,
  IonAccordion,
  IonAccordionGroup,
  IonBadge,
  IonListHeader,
  IonNote,
  IonGrid,
  IonRow,
  IonCol,
  IonText
} from '@ionic/angular/standalone';
import { DataService } from './data.service';
import { Observable, firstValueFrom } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageSelectorComponent } from './language-selector.component';
import { LanguageService } from './language.service';
import { PopoverController } from '@ionic/angular';

@Component({
  selector: 'app-historial',
  templateUrl: './historial.page.html',
  styleUrls: ['./historial.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonButtons,
    IonBackButton,
    IonDatetime,
    IonButton,
    IonSegment,
    IonSegmentButton,
    IonAccordion,
    IonAccordionGroup,
    IonBadge,
    IonListHeader,
    IonNote,
    IonGrid,
    IonRow,
    IonCol,
    IonText,
    TranslateModule,
    LanguageSelectorComponent,
  ],
  providers: [PopoverController],
})
export class HistorialPage implements OnInit {
  historial$: Observable<any[]>;
  filtroFecha: string = '';
  filtroMesa: string = '';
  barId: string = '';
  historialFiltrado: any[] = [];
  agrupadoPorMesa: any = {};
  mesas: string[] = [];
  resumenDia: { total: number; mesas: number } = { total: 0, mesas: 0 };

  constructor(
    private dataService: DataService,
    private languageService: LanguageService,
    private popoverController: PopoverController,
    private translateService: TranslateService
  ) {
    this.barId = this.dataService.getBarId();
    this.historial$ = this.dataService.getHistorial(this.barId);
  }

  async ngOnInit() {
    // Al abrir la página, mostrar los pedidos de hoy
    this.filtroFecha = new Date().toISOString().slice(0, 10);
    await this.aplicarFiltrosAsync();
  }

  setFecha(event: any) {
    const value = event?.detail?.value;
    this.filtroFecha = Array.isArray(value) ? value[0] || '' : value || '';
  }

  async aplicarFiltrosAsync() {
    // Siempre que se pulse aplicar filtros, limpiar el filtro de mesa
    this.filtroMesa = '';
    if (!this.filtroFecha) {
      this.historialFiltrado = [];
      this.agrupadoPorMesa = {};
      this.mesas = [];
      this.resumenDia = { total: 0, mesas: 0 };
      return;
    }
    const fecha = this.filtroFecha;
    // No filtrar por mesa en la consulta, solo por fecha
    const obs = this.dataService.getHistorialFiltrado(this.barId, fecha);
    const pedidos = await firstValueFrom(obs);
    
    // Filtrar para dar preferencia a 'resumen_mesa' si existen ambos tipos para la misma mesa
    // o simplemente mostrar todo lo que venga (aunque ahora solo guardaremos resumen_mesa)
    this.historialFiltrado = pedidos;
    this.agrupadoPorMesa = {};
    
    pedidos.forEach((p) => {
      const mesaKey = p['mesa'] || 'Sin mesa';
      if (!this.agrupadoPorMesa[mesaKey]) this.agrupadoPorMesa[mesaKey] = [];
      this.agrupadoPorMesa[mesaKey].push(p);
    });
    
    this.mesas = Object.keys(this.agrupadoPorMesa);
    this.resumenDia = {
      total: this.mesas.reduce((acc, mesa) => acc + this.getTotalMesa(mesa), 0),
      mesas: this.mesas.length,
    };
  }

  filtrarSoloVistaMesa() {
    // No hace nada, solo fuerza el refresco de la vista por ngModel
  }

  getTotalMesa(mesa: string): number {
    if (!this.agrupadoPorMesa[mesa]) return 0;
    // Sumar todos los totales de todos los registros de la mesa (resumen_mesa y comandas individuales)
    return this.agrupadoPorMesa[mesa].reduce(
      (sum: number, p: any) => sum + (p.total || 0),
      0
    );
  }

  imprimirTicket(registro: any) {
    if (!registro) return;

    const fechaTicket = new Date(registro.pagadoEn || registro.fecha).toLocaleString();
    const mesa = registro.mesa || 'N/A';
    const total = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(registro.total || 0);

    let itemsHtml = '';
    
    if (registro.tipo === 'resumen_mesa' && registro.pedidos) {
      registro.pedidos.forEach((p: any) => {
        const horaPedido = new Date(p.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        itemsHtml += `<div style="font-size: 10px; border-bottom: 1px dashed #ccc; margin-top: 5px;">Pedido: ${horaPedido}</div>`;
        p.items.forEach((item: any) => {
          itemsHtml += `
            <div style="display: flex; justify-content: space-between; font-size: 12px; margin: 2px 0;">
              <span>${item.cantidad}x ${item.nombre}</span>
            </div>
            ${item.opciones?.length ? `<div style="font-size: 10px; color: #666; margin-left: 10px;">+ ${item.opciones.join(', ')}</div>` : ''}
          `;
        });
      });
    } else if (registro.items) {
      registro.items.forEach((item: any) => {
        itemsHtml += `
          <div style="display: flex; justify-content: space-between; font-size: 12px; margin: 2px 0;">
            <span>${item.cantidad}x ${item.nombre}</span>
          </div>
          ${item.opciones?.length ? `<div style="font-size: 10px; color: #666; margin-left: 10px;">+ ${item.opciones.join(', ')}</div>` : ''}
        `;
      });
    }

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Ticket - Mesa ${mesa}</title>
            <style>
              body { font-family: 'Courier New', Courier, monospace; width: 80mm; margin: 0 auto; padding: 10px; }
              .header { text-align: center; border-bottom: 1px solid #000; padding-bottom: 10px; margin-bottom: 10px; }
              .footer { text-align: center; border-top: 1px solid #000; padding-top: 10px; margin-top: 10px; font-size: 12px; }
              .total { display: flex; justify-content: space-between; font-weight: bold; font-size: 16px; margin-top: 15px; border-top: 1px double #000; padding-top: 5px; }
              @media print { body { width: 100%; } }
            </style>
          </head>
          <body>
            <div class="header">
              <h2 style="margin: 0;">${this.translateService.instant('HISTORY.TICKET_PAYMENT')}</h2>
              <div style="font-size: 12px; margin-top: 5px;">${this.translateService.instant('HISTORY.TABLE')}: ${mesa.toUpperCase()}</div>
              <div style="font-size: 10px;">${this.translateService.instant('HISTORY.DATE')}: ${fechaTicket}</div>
            </div>
            <div class="items">
              ${itemsHtml}
            </div>
            <div class="total">
              <span>TOTAL</span>
              <span>${total}</span>
            </div>
            <div class="footer">
              <p>${this.translateService.instant('COMMON.THANKS_VISIT')}</p>
            </div>
            <script>
              window.onload = function() { window.print(); window.close(); }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
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
