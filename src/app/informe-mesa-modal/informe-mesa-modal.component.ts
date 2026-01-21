import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonBadge,
  ModalController,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-informe-mesa-modal',
  templateUrl: './informe-mesa-modal.component.html',
  styleUrls: ['./informe-mesa-modal.component.scss'],
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonBadge,
    CommonModule,
    FormsModule,
    TranslateModule,
  ],
})
export class InformeMesaModalComponent {
  @Input() informeMesa: any[] = [];
  @Input() informeTotal: number = 0;
  @Input() mesaActual: string = '';
  @Input() productos: any[] = [];
  // Optional function inputs passed from parent
  @Input() actualizarEstadoComanda:
    | ((comanda: any, estado: string) => void)
    | null = null;
  @Input() confirmarMarcarMesaPagada: ((mesa: string) => void) | null = null;
  @Input() getPrecioProducto: ((id: string) => number) | null = null;
  @Input() goToInformeMesa: ((mesa: string) => void) | null = null;

  constructor(private modalController: ModalController) {}

  cerrar() {
    this.modalController.dismiss(null, 'close');
  }

  imprimirInformeMesa() {
    if (!this.informeMesa || !this.informeMesa.length) return;

    // Filtrar solo las que están en estado "Recibido" (las que muestran el botón "Marcar En preparación")
    const aImprimir = this.informeMesa.filter(
      (comanda) =>
        comanda.estado !== 'preparando' &&
        comanda.estado !== 'preparado' &&
        comanda.estado !== 'pago_pendiente'
    );

    if (aImprimir.length === 0) {
      alert('No hay nuevos pedidos pendientes de impresión.');
      return;
    }

    // Construir contenido para imprimir
    let contenido = `<div style="font-family: Arial, sans-serif; max-width: 300px; margin: 0 auto;">`;
    contenido += `<h2 style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 5px;">MESA ${this.mesaActual}</h2>`;
    
    aImprimir.forEach((comanda: any, idx: number) => {
      contenido += `<div style="margin-bottom: 15px;">`;
      contenido += `<div style="font-size: 0.8em; color: #666;">Fecha: ${new Date(comanda.fecha).toLocaleString()}</div>`;
      contenido += `<ul style="list-style: none; padding: 0; margin: 5px 0;">`;
      
      (comanda.items || []).forEach((item: any) => {
        contenido += `<li style="font-size: 1.1em; margin-bottom: 3px;"><strong>${item.cantidad}x</strong> ${item.nombre}</li>`;
        if (item.opciones && item.opciones.length) {
          contenido += `<li style="font-size: 0.9em; padding-left: 20px; color: #333;">- ${item.opciones.join(', ')}</li>`;
        }
      });
      
      contenido += `</ul>`;
      if (comanda.observaciones) {
        contenido += `<div style="font-size: 0.9em; background: #eee; padding: 5px;"><strong>OBS:</strong> ${comanda.observaciones}</div>`;
      }
      contenido += `</div>`;
      contenido += `<hr style="border: 0; border-top: 1px dashed #000;" />`;
    });
    
    contenido += `<div style="text-align: center; margin-top: 10px; font-weight: bold;">*** FIN TICKET ***</div>`;
    contenido += `</div>`;

    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(
      `<!doctype html><html><head><title>Cocina - Mesa ${this.mesaActual}</title></head><body>${contenido}</body></html>`
    );
    w.document.close();
    w.focus();
    w.print();
    w.close();

    // Actualizar estados automáticamente al imprimir
    aImprimir.forEach((comanda) => {
      this.aplicarEstado(comanda, 'preparando');
    });
  }

  imprimirTotal() {
    if (!this.informeMesa || !this.informeMesa.length) return;

    // Construir contenido para imprimir el total (todas las comandas)
    let contenido = `<div style="font-family: Arial, sans-serif; max-width: 300px; margin: 0 auto;">`;
    contenido += `<h2 style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 5px;">MESA ${this.mesaActual}</h2>`;
    contenido += `<h3 style="text-align: center; margin-top: 5px;">Ticket Resumen</h3>`;
    
    this.informeMesa.forEach((comanda: any, idx: number) => {
      contenido += `<div style="margin-bottom: 10px; border-bottom: 1px dashed #ccc; padding-bottom: 5px;">`;
      contenido += `<div style="font-size: 0.8em; color: #666;">Fecha: ${new Date(comanda.fecha).toLocaleString()}</div>`;
      contenido += `<ul style="list-style: none; padding: 0; margin: 5px 0;">`;
      
      (comanda.items || []).forEach((item: any) => {
        const precio = this.getPrecioProducto ? this.getPrecioProducto(item.id) : 0;
        contenido += `<li style="font-size: 1em; display: flex; justify-content: space-between;">`;
        contenido += `<span><strong>${item.cantidad}x</strong> ${item.nombre}</span>`;
        contenido += `<span>${(precio * item.cantidad).toFixed(2)}€</span>`;
        contenido += `</li>`;
        if (item.opciones && item.opciones.length) {
          contenido += `<li style="font-size: 0.85em; padding-left: 15px; color: #555;">- ${item.opciones.join(', ')}</li>`;
        }
      });
      
      contenido += `</ul>`;
      if (comanda.observaciones) {
        contenido += `<div style="font-size: 0.85em; background: #f9f9f9; padding: 3px;"><strong>OBS:</strong> ${comanda.observaciones}</div>`;
      }
      contenido += `</div>`;
    });
    
    contenido += `<div style="margin-top: 15px; border-top: 2px solid #000; padding-top: 10px; text-align: right; font-size: 1.2em;">`;
    contenido += `<strong>TOTAL: ${this.informeTotal.toFixed(2)} €</strong>`;
    contenido += `</div>`;
    
    contenido += `<div style="text-align: center; margin-top: 20px; font-weight: bold;">*** GRACIAS POR SU VISITA ***</div>`;
    contenido += `</div>`;

    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(
      `<!doctype html><html><head><title>Total - Mesa ${this.mesaActual}</title></head><body>${contenido}</body></html>`
    );
    w.document.close();
    w.focus();
    w.print();
    w.close();
  }

  async descargarInformeMesa() {
    try {
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
            const precio = this.getPrecioProducto
              ? this.getPrecioProducto(item.id)
              : 0;
            doc.text(
              `- ${item.nombre} x${item.cantidad} (${precio}€ c/u)`,
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
    } catch (err) {
      console.error('Error generando PDF', err);
    }
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
          const precio = this.getPrecioProducto
            ? this.getPrecioProducto(item.id)
            : 0;
          texto += ` | Precio: ${(precio * item.cantidad).toFixed(2)} EUR\n`;
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

  aplicarEstado(comanda: any, estado: string) {
    if (this.actualizarEstadoComanda)
      this.actualizarEstadoComanda(comanda, estado);
  }

  marcarMesaPagada() {
    if (this.confirmarMarcarMesaPagada)
      this.confirmarMarcarMesaPagada(this.mesaActual);
  }

  hacerCalculoPorSeparado() {
    if (this.goToInformeMesa) {
      this.cerrar();
      this.goToInformeMesa(this.mesaActual);
    }
  }
}
