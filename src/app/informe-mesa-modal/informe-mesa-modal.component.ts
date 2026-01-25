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
  @Input() categorias: any[] = [];
  @Input() comanderos: any[] = [];
  @Input() filtroComanderoId: string = 'todos';

  // Optional function inputs passed from parent
  @Input() actualizarEstadoComanda:
    | ((comanda: any, estado: string) => void)
    | null = null;
  @Input() confirmarMarcarMesaPagada: ((mesa: string) => void) | null = null;
  @Input() getPrecioProducto: ((id: string) => number) | null = null;
  @Input() goToInformeMesa: ((mesa: string) => void) | null = null;
  @Input() updateComanda: ((comanda: any) => void) | null = null;

  constructor(private modalController: ModalController) {}

  incrementarCantidad(comanda: any, itemIndex: number) {
    if (!comanda.items || !comanda.items[itemIndex]) return;
    comanda.items[itemIndex].cantidad++;
    this.guardarCambios(comanda);
  }

  decrementarCantidad(comanda: any, itemIndex: number) {
    if (!comanda.items || !comanda.items[itemIndex]) return;
    if (comanda.items[itemIndex].cantidad > 1) {
      comanda.items[itemIndex].cantidad--;
      this.guardarCambios(comanda);
    } else {
      if (confirm('¿Eliminar este producto del pedido?')) {
        comanda.items.splice(itemIndex, 1);
        if (comanda.items.length === 0) {
           // Si no quedan items, quizás deberíamos eliminar la comanda entera?
           // Por seguridad, dejemos la comanda vacía o eliminemos.
           // La logica actual de AdminPage puede que no espere comandas vacias.
           // Pero updateComanda debería manejarlo.
        }
        this.guardarCambios(comanda);
      }
    }
  }

  guardarCambios(comanda: any) {
    // Recalcular total local si es necesario, aunque informeTotal es Input.
    // Emitir cambio al padre.
    // Try to use updateComanda input if available, otherwise fallback to actualizarEstadoComanda if it supports generic updates
    if (this.updateComanda) {
      this.updateComanda(comanda);
    } else if (this.actualizarEstadoComanda) {
      // AdminPage uses updateComanda(barId, comanda) inside this callback usually
      this.actualizarEstadoComanda(comanda, comanda.estado);
    }
  }

  cerrar() {
    this.modalController.dismiss(null, 'close');
  }

  getComanderoName(comanderoId: string | null): string {
    if (!comanderoId) return 'General';
    const c = this.comanderos.find((com) => com.id === comanderoId);
    return c ? (c.descripcion || `Comandero ${c.numero}`) : 'General';
  }

  imprimirInformeMesa() {
    if (!this.informeMesa || !this.informeMesa.length) return;

    // 1. Filtrar solo las que están en estado "Recibido"
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

    // 2. Agrupar items por Comandero
    // Map: comanderoId -> [{ comandaId, comandaFecha, comandaObs, items: [...] }]
    const grupos: { [id: string]: any } = {};

    aImprimir.forEach((comanda) => {
      comanda.items.forEach((item: any) => {
        const prod = this.productos.find((p) => p.id === item.id);
        const catId = prod?.categoria;
        const cat = this.categorias.find((c) => c.id === catId);
        const cId = cat?.comanderoId || 'null';

        if (!grupos[cId]) {
          grupos[cId] = {
            comanderoNombre: this.getComanderoName(cat?.comanderoId),
            comandas: {}, // grouped by comanda id to preserve obs/date
          };
        }

        if (!grupos[cId].comandas[comanda.id]) {
          grupos[cId].comandas[comanda.id] = {
            fecha: comanda.fecha,
            observaciones: comanda.observaciones,
            items: [],
          };
        }
        grupos[cId].comandas[comanda.id].items.push(item);
      });
    });

    // 3. Ejecutar impresiones para cada grupo
    // Nota: window.print() es bloqueante en algunos navegadores, pero procedemos
    Object.keys(grupos).forEach((cId) => {
      const grupo = grupos[cId];
      let contenido = `<div style="font-family: 'Courier New', Courier, monospace; max-width: 300px; margin: 0 auto; color: #000;">`;
      contenido += `<h1 style="text-align: center; margin-bottom: 5px; font-size: 1.5em; border-bottom: 2px solid #000;">${grupo.comanderoNombre.toUpperCase()}</h1>`;
      contenido += `<h2 style="text-align: center; margin-top: 0;">MESA ${this.mesaActual}</h2>`;
      contenido += `<div style="text-align: center; font-size: 0.8em; margin-bottom: 15px;">${new Date().toLocaleString()}</div>`;

      Object.keys(grupo.comandas).forEach((comId) => {
        const comData = grupo.comandas[comId];
        contenido += `<div style="margin-bottom: 15px; border-top: 1px dashed #000; padding-top: 5px;">`;
        contenido += `<ul style="list-style: none; padding: 0; margin: 5px 0;">`;

        comData.items.forEach((item: any) => {
          contenido += `<li style="font-size: 1.25em; margin-bottom: 5px;"><strong>${item.cantidad}x</strong> ${item.nombre}</li>`;
          if (item.opciones && item.opciones.length) {
            contenido += `<li style="font-size: 0.95em; padding-left: 20px; font-style: italic;">- ${item.opciones.join(', ')}</li>`;
          }
        });

        contenido += `</ul>`;
        if (comData.observaciones) {
          contenido += `<div style="font-size: 1em; background: #eee; padding: 5px; border: 1px solid #ccc;"><strong>OBS:</strong> ${comData.observaciones}</div>`;
        }
        contenido += `</div>`;
      });

      contenido += `<div style="text-align: center; margin-top: 20px; font-weight: bold; border-top: 2px solid #000; padding-top: 5px;">*** FIN TICKET ***</div>`;
      contenido += `</div>`;

      const w = window.open('', '_blank');
      if (w) {
        w.document.write(
          `<!doctype html><html><head><title>${grupo.comanderoNombre} - Mesa ${this.mesaActual}</title></head><body>${contenido}</body></html>`
        );
        w.document.close();
        w.focus();
        w.print();
        w.close();
      }
    });

    // 4. Actualizar estados automáticamente al imprimir
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
    // Update local object immediately for instant UI feedback in the modal
    if (comanda) {
      comanda.estado = estado;
    }
    if (this.actualizarEstadoComanda) {
      this.actualizarEstadoComanda(comanda, estado);
    }
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
