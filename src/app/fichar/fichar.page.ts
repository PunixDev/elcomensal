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
  IonGrid,
  IonRow,
  IonCol,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonLabel,
  IonItem,
  IonText,
  IonBadge
} from '@ionic/angular/standalone';
import { DataService, Empleado, Fichaje } from '../data.service';
import { ActivatedRoute } from '@angular/router';
import { Subscription, firstValueFrom } from 'rxjs';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-fichar',
  templateUrl: './fichar.page.html',
  styleUrls: ['./fichar.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonGrid,
    IonRow,
    IonCol,
    IonButton,
    IonIcon,
    IonCard,
    IonCardContent,
    IonLabel,
    IonItem,
    IonText,
    IonBadge,
    CommonModule,
    FormsModule
  ]
})
export class FicharPage implements OnInit, OnDestroy {
  barId: string = '';
  pin: string = '';
  
  empleados: Empleado[] = [];
  empleadoIdentificado: Empleado | null = null;
  ultimoFichaje: Fichaje | null = null;
  
  teclas = [1, 2, 3, 4, 5, 6, 7, 8, 9, "borrar", 0, "enter"];
  
  private empleadosSub: Subscription | null = null;

  constructor(
    private dataService: DataService,
    private route: ActivatedRoute,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.barId = this.dataService.getBarId();
    this.empleadosSub = this.dataService.getEmpleados(this.barId).subscribe(emps => {
      this.empleados = emps.filter(e => e.activo);
    });
  }

  ngOnDestroy() {
    if (this.empleadosSub) this.empleadosSub.unsubscribe();
  }

  teclaPulsada(tecla: number | string) {
    if (this.empleadoIdentificado) {
        // Si ya hay alguien identificado, no aceptar más teclas hasta que fiche o cancele
        return;
    }
    
    if (tecla === 'borrar') {
      this.pin = this.pin.slice(0, -1);
    } else if (tecla === 'enter') {
      this.verificarPin();
    } else {
      if (this.pin.length < 4) {
        this.pin += tecla;
      }
      if (this.pin.length === 4) {
         // Auto-verificar al llegar a 4 dígitos para mayor fluidez
         this.verificarPin();
      }
    }
  }

  async verificarPin() {
    if (this.pin.length !== 4) return;
    
    const empleado = this.empleados.find(e => e.pin === this.pin);
    if (!empleado) {
       this.mostrarToast('PIN incorrecto o empleado inactivo', 'danger');
       this.pin = '';
       return;
    }
    
    this.empleadoIdentificado = empleado;
    await this.buscarUltimoFichaje(empleado.id);
  }

  async buscarUltimoFichaje(empleadoId: string) {
    // Buscar los últimos fichajes de este usuario (como está ordenado por fecha desc, coger el primero de este usuario)
    const todosFichajes = await firstValueFrom(this.dataService.getFichajes(this.barId));
    const susFichajes = todosFichajes.filter(f => f.empleadoId === empleadoId);
    
    if (susFichajes.length > 0) {
        // Están ordenados de más reciente a más antiguo si getFichajes tiene orderBy('fecha', 'desc')
        this.ultimoFichaje = susFichajes[0]; 
    } else {
        this.ultimoFichaje = null;
    }
  }

  async registrarFichaje(tipo: 'ENTRADA' | 'SALIDA') {
    if (!this.empleadoIdentificado) return;
    
    const nuevoFichaje: Omit<Fichaje, 'id'> = {
      empleadoId: this.empleadoIdentificado.id,
      empleadoNombre: this.empleadoIdentificado.nombre,
      fecha: new Date().toISOString(),
      tipo: tipo
    };

    try {
        await this.dataService.addFichaje(this.barId, nuevoFichaje);
        this.mostrarToast(`Registro de ${tipo} guardado correctamente. ¡Hola ${this.empleadoIdentificado.nombre}!`, 'success');
        this.resetear();
    } catch (err) {
        this.mostrarToast('Error al registrar fichaje', 'danger');
    }
  }

  resetear() {
    this.pin = '';
    this.empleadoIdentificado = null;
    this.ultimoFichaje = null;
  }

  async mostrarToast(mensaje: string, color: string) {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 2500,
      color: color,
      position: 'top'
    });
    await toast.present();
  }
}
