import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonList,
  IonItem,
  IonIcon,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonInput,
  IonGrid,
  IonRow,
  IonCol,
  IonBadge,
  IonDatetime,
  IonDatetimeButton,
  IonModal
} from '@ionic/angular/standalone';
import { DataService, Empleado, Fichaje } from '../data.service';
import { Observable, Subscription, BehaviorSubject, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { AlertController, ToastController } from '@ionic/angular';

@Component({
  selector: 'app-empleados',
  templateUrl: './empleados.page.html',
  styleUrls: ['./empleados.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonList,
    IonItem,
    IonIcon,
    IonButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonInput,
    IonGrid,
    IonRow,
    IonCol,
    IonBadge,
    IonDatetime,
    IonDatetimeButton,
    IonModal,
    CommonModule,
    FormsModule
  ]
})
export class EmpleadosPage implements OnInit, OnDestroy {
  seccionActual: 'plantilla' | 'registros' = 'plantilla';
  barId: string = '';
  
  // Empleados
  empleados$: Observable<Empleado[]>;
  nuevoNombre: string = '';
  nuevoPin: string = '';
  
  // Registros
  fichajes$: Observable<Fichaje[]>;
  filtroFechaInput: string = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  filtroFechaObj: string = this.filtroFechaInput;
  fichajesFiltrados$: Observable<Fichaje[]>;

  private filtroFechaSubject = new BehaviorSubject<string>(new Date().toISOString().split('T')[0]);

  constructor(
    private dataService: DataService,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    this.barId = this.dataService.getBarId();
    this.empleados$ = this.dataService.getEmpleados(this.barId);
    this.fichajes$ = this.dataService.getFichajes(this.barId);

    this.fichajesFiltrados$ = combineLatest([this.fichajes$, this.filtroFechaSubject]).pipe(
      map(([fichajes, fechaFiltro]) => {
        if (!fechaFiltro) return fichajes;
        // Filter by prefix of ISO string (YYYY-MM-DD)
        return fichajes.filter(f => f.fecha && f.fecha.startsWith(fechaFiltro));
      })
    );
  }

  ngOnInit() {}
  ngOnDestroy() {}

  segmentChanged(event: any) {
    this.seccionActual = event.detail.value;
  }

  actualizarFiltroFecha(event: any) {
     this.filtroFechaObj = event.detail.value;
     const val = event.detail.value;
     this.filtroFechaInput = val;
     const formattedDate = val.split('T')[0];
     this.filtroFechaSubject.next(formattedDate);
  }

  async agregarEmpleado() {
    if (!this.nuevoNombre.trim() || !this.nuevoPin.trim()) {
      this.mostrarToast('Por favor, rellena todos los campos.', 'warning');
      return;
    }
    
    if (this.nuevoPin.length < 4) {
      this.mostrarToast('El PIN debe tener al menos 4 dígitos.', 'warning');
      return;
    }

    try {
      await this.dataService.addEmpleado(this.barId, {
        nombre: this.nuevoNombre.trim(),
        pin: this.nuevoPin.trim(),
        activo: true
      });
      this.nuevoNombre = '';
      this.nuevoPin = '';
      this.mostrarToast('Empleado añadido correctamente.', 'success');
    } catch (err) {
      this.mostrarToast('Error al añadir empleado.', 'danger');
    }
  }

  async cambiarEstadoEmpleado(empleado: Empleado) {
    empleado.activo = !empleado.activo;
    await this.dataService.updateEmpleado(this.barId, empleado);
  }

  async eliminarEmpleado(empleado: Empleado) {
    const alert = await this.alertController.create({
      header: 'Confirmar Eliminación',
      message: `¿Estás seguro de eliminar a ${empleado.nombre}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { 
          text: 'Eliminar', 
          role: 'destructive',
          handler: () => {
             this.dataService.deleteEmpleado(this.barId, empleado.id);
             this.mostrarToast('Empleado eliminado.', 'success');
          }
        }
      ]
    });
    await alert.present();
  }

  // Exports currently viewed logs to PDF
  async exportarInformePDF() {
    this.fichajesFiltrados$.subscribe(async (fichajes) => {
      if (!fichajes || fichajes.length === 0) {
        this.mostrarToast('No hay registros en la fecha seleccionada para exportar.', 'warning');
        return;
      }

      const jsPDF = (await import('jspdf')).jsPDF;
      const doc = new jsPDF();
      let y = 15;
      
      doc.setFontSize(18);
      doc.text(`Informe de Control Horario - ${this.filtroFechaInput.split('T')[0]}`, 14, y);
      y += 10;
      
      doc.setFontSize(12);
      
      // Basic table drawing
      doc.text('Empleado', 15, y);
      doc.text('Hora', 80, y);
      doc.text('Acción', 130, y);
      y += 5;
      doc.line(14, y, 196, y);
      y += 5;
      
      fichajes.forEach(f => {
         const date = new Date(f.fecha);
         const time = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
         
         doc.text(f.empleadoNombre, 15, y);
         doc.text(time, 80, y);
         doc.text(f.tipo, 130, y);
         y += 7;
         
         if (y > 280) {
            doc.addPage();
            y = 15;
         }
      });
      
      doc.save(`Fichajes_${this.barId}_${this.filtroFechaInput.split('T')[0]}.pdf`);
    }).unsubscribe();
  }

  async mostrarToast(mensaje: string, color: string) {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 2500,
      color: color,
      position: 'bottom'
    });
    await toast.present();
  }
}
