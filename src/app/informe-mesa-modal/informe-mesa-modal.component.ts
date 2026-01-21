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
  IonCheckbox,
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
    CommonModule,
    FormsModule,
    IonCheckbox,
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

  // Track selected comandas by id
  selectedComandas: { [id: string]: boolean } = {};

  toggleSeleccionada(comanda: any, checked: boolean) {
    if (!comanda || !comanda.id) return;
    this.selectedComandas[comanda.id] = !!checked;
  }

  anySeleccionada(): boolean {
    return Object.values(this.selectedComandas).some(Boolean);
  }

  imprimirSeleccionados() {
    const seleccionadas = (this.informeMesa || []).filter(
      (c: any) => c && c.id && this.selectedComandas[c.id]
    );
    if (!seleccionadas.length)
      return alert('No hay comandas seleccionadas para imprimir.');

    // Construir contenido para imprimir solo las comandas seleccionadas
    let contenido = `<div>`;
    contenido += `<h2>Informe de mesa ${this.mesaActual}</h2>`;
    seleccionadas.forEach((comanda: any, idx: number) => {
      contenido += `<h3>Comanda #${idx + 1} - Fecha: ${new Date(
        comanda.fecha
      ).toLocaleString()}</h3>`;
      contenido += `<ul>`;
      (comanda.items || []).forEach((item: any) => {
        const precio = this.getPrecioProducto
          ? this.getPrecioProducto(item.id)
          : 0;
        contenido += `<li>${item.nombre} x${item.cantidad}`;
        if (item.opciones && item.opciones.length)
          contenido += ` (Opciones: ${item.opciones.join(', ')})`;
        contenido += ` - ${(precio * item.cantidad).toFixed(2)} EUR`;
        contenido += `</li>`;
      });
      contenido += `</ul>`;
      if (comanda.observaciones)
        contenido += `<div><strong>Observaciones:</strong> ${comanda.observaciones}</div>`;
      contenido += `<hr/>`;
    });
    contenido += `</div>`;

    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(
      `<!doctype html><html><head><title>Informe seleccionado</title></head><body>${contenido}</body></html>`
    );
    w.document.close();
    w.focus();
    w.print();
    w.close();
  }

  cerrar() {
    this.modalController.dismiss(null, 'close');
  }

  imprimirInformeMesa() {
    const contenido = document.getElementById('informe-mesa')?.innerHTML;
    if (!contenido) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(
      `<!doctype html><html><head><title>Informe</title></head><body>${contenido}</body></html>`
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
