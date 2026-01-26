import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonGrid,
  IonRow,
  IonCol,
  IonItem,
  IonInput,
  IonButton,
  IonList,
  IonLabel,
  IonButtons,
  IonBackButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
} from '@ionic/angular/standalone';
import { DataService, Comandero } from '../data.service';
import { Observable, Subscription } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-comanderos',
  templateUrl: './comanderos.page.html',
  styleUrls: ['./comanderos.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonGrid,
    IonRow,
    IonCol,
    IonItem,
    IonInput,
    IonButton,
    IonList,
    IonLabel,
    IonButtons,
    IonBackButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    CommonModule,
    FormsModule,
    TranslateModule,
  ],
})
export class ComanderosPage implements OnInit {
  comanderos$: Observable<Comandero[]>;
  barId: string;
  
  // Form fields
  nuevoNumero: number | null = null;
  nuevaDescripcion: string = '';
  nuevaImpresora: string = '';

  // Edit fields
  editando: string | null = null;
  editNumero: number | null = null;
  editDescripcion: string = '';
  editImpresora: string = '';

  constructor(private dataService: DataService) {
    this.barId = this.dataService.getBarId();
    this.comanderos$ = this.dataService.getComanderos(this.barId);
  }

  ngOnInit() {}

  async agregarComandero() {
    if (this.nuevoNumero !== null && this.nuevaDescripcion.trim()) {
      await this.dataService.addComandero(this.barId, {
        numero: this.nuevoNumero,
        descripcion: this.nuevaDescripcion.trim(),
        printerName: this.nuevaImpresora.trim(),
      });
      this.nuevoNumero = null;
      this.nuevaDescripcion = '';
      this.nuevaImpresora = '';
    }
  }

  eliminarComandero(id: string) {
    if (confirm('¿Estás seguro de eliminar este comandero?')) {
      this.dataService.deleteComandero(this.barId, id);
    }
  }

  iniciarEdicion(comandero: Comandero) {
    this.editando = comandero.id;
    this.editNumero = comandero.numero;
    this.editDescripcion = comandero.descripcion;
    this.editImpresora = comandero.printerName || '';
  }

  async guardarEdicion() {
    if (this.editando && this.editNumero !== null && this.editDescripcion.trim()) {
      await this.dataService.updateComandero(this.barId, {
        id: this.editando,
        numero: this.editNumero,
        descripcion: this.editDescripcion.trim(),
        printerName: this.editImpresora.trim(),
      });
      this.cancelarEdicion();
    }
  }

  cancelarEdicion() {
    this.editando = null;
    this.editNumero = null;
    this.editDescripcion = '';
    this.editImpresora = '';
  }
}
