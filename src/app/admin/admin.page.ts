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
  comandas: any[] = [];
  comandasPorMesa: { [mesa: string]: any[] } = {};
  informeMesa: any = null;
  informeTotal: number = 0;
  mostrarInforme: boolean = false;

  constructor(private router: Router, private dataService: DataService) {}

  ngOnInit() {
    const logged = localStorage.getItem('isLoggedIn');
    if (logged !== 'true') {
      this.router.navigate(['/login']);
    }
    this.cargarComandas();
  }

  cargarComandas() {
    const todas = this.dataService.getComandas();
    this.comandas = todas;
    // Agrupa por mesa
    this.comandasPorMesa = {};
    todas.forEach((c) => {
      if (!this.comandasPorMesa[c.mesa]) this.comandasPorMesa[c.mesa] = [];
      this.comandasPorMesa[c.mesa].push(c);
    });
  }

  limpiarComandas() {
    this.dataService.clearComandas();
    this.cargarComandas();
  }

  actualizarEstadoComanda(idx: number, estado: string) {
    const comandas = this.dataService.getComandas();
    comandas[idx].estado = estado;
    localStorage.setItem('comandas', JSON.stringify(comandas));
    this.cargarComandas();
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

  // Marcar mesa como pagada desde el panel admin
  marcarMesaPagada(mesa: string) {
    this.dataService.clearComandasMesa(mesa);
    this.cargarComandas();
  }

  mesaSolicitaPago(comandas: any[]): boolean {
    return (
      Array.isArray(comandas) &&
      comandas.some((c) => c.estado === 'pago_pendiente')
    );
  }

  verInformeMesa(mesa: string) {
    setTimeout(() => {
      const comandas = this.comandasPorMesa[mesa] || [];
      this.informeMesa = comandas;
      this.informeTotal = comandas.reduce((total, comanda) => {
        return (
          total +
          comanda.items.reduce((subtotal: number, item: any) => {
            const productos = JSON.parse(
              localStorage.getItem('productos') || '[]'
            );
            const prod = productos.find((p: any) => p.id === item.id);
            return subtotal + (prod ? prod.precio * item.cantidad : 0);
          }, 0)
        );
      }, 0);
      this.mostrarInforme = true;
    }, 0);
  }

  cerrarInformeMesa() {
    this.mostrarInforme = false;
    this.informeMesa = null;
    this.informeTotal = 0;
  }

  getPrecioProducto(id: number): number {
    const productos = JSON.parse(localStorage.getItem('productos') || '[]');
    const prod = productos.find((p: any) => p.id === id);
    return prod ? prod.precio : 0;
  }
}
