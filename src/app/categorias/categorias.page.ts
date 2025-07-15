import { Component, OnInit } from '@angular/core';
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
} from '@ionic/angular/standalone';
import { DataService, Categoria } from '../data.service';
import { Observable } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-categorias',
  templateUrl: './categorias.page.html',
  styleUrls: ['./categorias.page.scss'],
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
    CommonModule,
    FormsModule,
    TranslateModule,
  ],
})
export class CategoriasPage implements OnInit {
  categorias$: Observable<Categoria[]>;
  nuevaCategoria = '';
  editando: string | null = null;
  editNombre = '';
  barId: string;
  mensajeExito = '';

  constructor(private dataService: DataService) {
    this.barId = this.dataService.getBarId();
    this.categorias$ = this.dataService.getCategorias(this.barId);
  }

  ngOnInit() {}

  agregarCategoria() {
    if (this.nuevaCategoria.trim()) {
      const nueva = {
        nombre: this.nuevaCategoria.trim(),
      };
      this.dataService.addCategoria(this.barId, nueva);
      this.nuevaCategoria = '';
      this.mensajeExito = 'Categoría añadida correctamente';
      setTimeout(() => {
        this.mensajeExito = '';
      }, 2500);
    }
  }

  eliminarCategoria(id: string) {
    this.dataService.deleteCategoria(this.barId, id);
  }

  iniciarEdicion(categoria: Categoria) {
    this.editando = categoria.id;
    this.editNombre = categoria.nombre as string;
  }

  guardarEdicion(id: string) {
    if (this.editando && this.editNombre.trim()) {
      const categoria: Categoria = {
        id: this.editando!,
        nombre: this.editNombre.trim(),
      };
      this.dataService.updateCategoria(this.barId, categoria);
      this.editando = null;
      this.editNombre = '';
    }
  }

  cancelarEdicion() {
    this.editando = null;
    this.editNombre = '';
  }

  getNombreCategoria(cat: Categoria): string {
    if (!cat) return '';
    return typeof cat.nombre === 'string' ? cat.nombre : '';
  }
}
