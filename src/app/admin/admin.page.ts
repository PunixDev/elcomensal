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
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { DataService } from '../data.service';
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

  constructor(private router: Router, private dataService: DataService) {
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
    (this.comandasPorMesa[mesa] || []).forEach((c) =>
      this.dataService.deleteComanda(this.barId, c.id)
    );
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
}
