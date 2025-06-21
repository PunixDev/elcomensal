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
  IonSelect,
  IonSelectOption,
  IonAvatar,
  IonButtons,
  IonBackButton,
  IonTextarea,
  IonIcon,
} from '@ionic/angular/standalone';
import { DataService, Producto, Categoria } from '../data.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-productos',
  templateUrl: './productos.page.html',
  styleUrls: ['./productos.page.scss'],
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
    IonSelect,
    IonSelectOption,
    IonAvatar,
    IonButtons,
    IonBackButton,
    IonTextarea,
    IonIcon,
    CommonModule,
    FormsModule,
  ],
})
export class ProductosPage implements OnInit {
  productos$: Observable<Producto[]>;
  categorias$: Observable<Categoria[]>;
  nuevoNombre = '';
  nuevaCategoria = '';
  nuevaImagen: string | null = null;
  nuevaDescripcion = '';
  nuevosAlergenos = '';
  nuevasOpciones: string[] = [];
  opcionTemp = '';
  nuevoPrecio: number | null = null;
  editando: string | null = null;
  editNombre = '';
  editCategoria = '';
  editPrecio: number | null = null;
  editImagen: string | null = null;
  editDescripcion = '';
  editAlergenos = '';
  editOpciones: string[] = [];
  editOpcionTemp = '';
  barId: string;
  intentadoAgregar = false;

  constructor(private dataService: DataService) {
    this.barId = this.dataService.getBarId();
    this.productos$ = this.dataService.getProductos(this.barId);
    this.categorias$ = this.dataService.getCategorias(this.barId);
  }

  ngOnInit() {}

  agregarProducto() {
    this.intentadoAgregar = true;
    if (
      this.nuevoNombre &&
      this.nuevoNombre.trim() &&
      this.nuevaCategoria &&
      this.nuevoPrecio != null
    ) {
      const nuevo = {
        nombre: this.nuevoNombre.trim(),
        categoria: this.nuevaCategoria,
        precio: this.nuevoPrecio,
        imagen: this.nuevaImagen || null,
        descripcion: this.nuevaDescripcion,
        alergenos: this.nuevosAlergenos,
        opciones: [...this.nuevasOpciones],
      };
      this.dataService.addProducto(this.barId, nuevo);
      this.nuevoNombre = '';
      this.nuevaCategoria = '';
      this.nuevoPrecio = null;
      this.nuevaImagen = null;
      this.nuevaDescripcion = '';
      this.nuevosAlergenos = '';
      this.nuevasOpciones = [];
      this.intentadoAgregar = false;
    }
  }

  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.nuevaImagen = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  eliminarProducto(id: string) {
    this.dataService.deleteProducto(this.barId, id);
  }

  iniciarEdicion(producto: Producto) {
    this.editando = producto.id;
    this.editNombre = producto.nombre;
    this.editCategoria = producto.categoria;
    this.editPrecio = producto.precio;
    this.editImagen = producto.imagen || null;
    this.editDescripcion = producto.descripcion || '';
    this.editAlergenos = producto.alergenos || '';
    this.editOpciones = producto.opciones ? [...producto.opciones] : [];
  }

  onEditImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.editImagen = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  guardarEdicion(id: string) {
    if (
      this.editando &&
      this.editNombre.trim() &&
      this.editCategoria &&
      this.editPrecio != null
    ) {
      const producto: Producto = {
        id: this.editando,
        nombre: this.editNombre.trim(),
        categoria: this.editCategoria,
        precio: this.editPrecio,
        imagen: this.editImagen || null,
        descripcion: this.editDescripcion,
        alergenos: this.editAlergenos,
        opciones: [...this.editOpciones],
      };
      this.dataService.updateProducto(this.barId, producto);
      this.cancelarEdicion();
    }
  }

  cancelarEdicion() {
    this.editando = null;
    this.editNombre = '';
    this.editCategoria = '';
  }

  agregarOpcion() {
    if (this.opcionTemp.trim()) {
      this.nuevasOpciones.push(this.opcionTemp.trim());
      this.opcionTemp = '';
    }
  }

  eliminarOpcion(idx: number) {
    this.nuevasOpciones.splice(idx, 1);
  }

  agregarEditOpcion() {
    if (this.editOpcionTemp.trim()) {
      this.editOpciones.push(this.editOpcionTemp.trim());
      this.editOpcionTemp = '';
    }
  }

  eliminarEditOpcion(idx: number) {
    this.editOpciones.splice(idx, 1);
  }
}
