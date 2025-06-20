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
  ],
})
export class CategoriasPage implements OnInit {
  categorias: Categoria[] = [];
  nuevaCategoria = '';
  editando: number | null = null;
  editNombre = '';

  constructor(private dataService: DataService) {}

  ngOnInit() {
    this.categorias = this.dataService.getCategorias();
  }

  agregarCategoria() {
    if (this.nuevaCategoria.trim()) {
      const nueva: Categoria = {
        id: Date.now(),
        nombre: this.nuevaCategoria.trim(),
      };
      this.categorias.push(nueva);
      this.dataService.saveCategorias(this.categorias);
      this.nuevaCategoria = '';
    }
  }

  eliminarCategoria(id: number) {
    this.categorias = this.categorias.filter((c) => c.id !== id);
    this.dataService.saveCategorias(this.categorias);
    // Forzar recarga desde localStorage para asegurar actualización
    this.categorias = this.dataService.getCategorias();
  }

  iniciarEdicion(categoria: Categoria) {
    this.editando = categoria.id;
    this.editNombre = categoria.nombre;
  }

  guardarEdicion(id: number) {
    const cat = this.categorias.find((c) => c.id === id);
    if (cat && this.editNombre.trim()) {
      cat.nombre = this.editNombre.trim();
      this.dataService.saveCategorias(this.categorias);
      this.editando = null;
      this.editNombre = '';
      // Forzar recarga desde localStorage para asegurar actualización
      this.categorias = this.dataService.getCategorias();
    }
  }

  cancelarEdicion() {
    this.editando = null;
    this.editNombre = '';
  }
}
