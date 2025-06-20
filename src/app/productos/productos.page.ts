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
  productos: Producto[] = [];
  categorias: Categoria[] = [];
  nuevoNombre = '';
  nuevaCategoria = '';
  nuevaImagen: string | null = null;
  nuevaDescripcion = '';
  nuevosIngredientes = '';
  nuevasOpciones: string[] = [];
  opcionTemp = '';
  nuevoPrecio: number | null = null;
  editando: number | null = null;
  editNombre = '';
  editCategoria = '';
  editPrecio: number | null = null;
  editImagen: string | null = null;
  editDescripcion = '';
  editIngredientes = '';
  editOpciones: string[] = [];
  editOpcionTemp = '';

  constructor(private dataService: DataService) {}

  ngOnInit() {
    this.productos = this.dataService.getProductos();
    this.categorias = this.dataService.getCategorias();
  }

  agregarProducto() {
    if (
      this.nuevoNombre.trim() &&
      this.nuevaCategoria &&
      this.nuevoPrecio != null
    ) {
      const nuevo: Producto = {
        id: Date.now(),
        nombre: this.nuevoNombre.trim(),
        categoria: this.nuevaCategoria,
        precio: this.nuevoPrecio,
        imagen: this.nuevaImagen || null,
        descripcion: this.nuevaDescripcion,
        ingredientes: this.nuevosIngredientes,
        opciones: [...this.nuevasOpciones],
      };
      this.productos.push(nuevo);
      this.dataService.saveProductos(this.productos);
      this.nuevoNombre = '';
      this.nuevaCategoria = '';
      this.nuevoPrecio = null;
      this.nuevaImagen = null;
      this.nuevaDescripcion = '';
      this.nuevosIngredientes = '';
      this.nuevasOpciones = [];
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

  eliminarProducto(id: number) {
    this.productos = this.productos.filter((p) => p.id !== id);
    this.dataService.saveProductos(this.productos);
  }

  iniciarEdicion(producto: Producto) {
    this.editando = producto.id;
    this.editNombre = producto.nombre;
    this.editCategoria = producto.categoria;
    this.editPrecio = producto.precio;
    this.editImagen = producto.imagen || null;
    this.editDescripcion = producto.descripcion || '';
    this.editIngredientes = producto.ingredientes || '';
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

  guardarEdicion(id: number) {
    const prod = this.productos.find((p) => p.id === id);
    if (
      prod &&
      this.editNombre.trim() &&
      this.editCategoria &&
      this.editPrecio != null
    ) {
      prod.nombre = this.editNombre.trim();
      prod.categoria = this.editCategoria;
      prod.precio = this.editPrecio;
      prod.imagen = this.editImagen || null;
      prod.descripcion = this.editDescripcion;
      prod.ingredientes = this.editIngredientes;
      prod.opciones = [...this.editOpciones];
      this.dataService.saveProductos(this.productos);
      this.editando = null;
      this.editNombre = '';
      this.editCategoria = '';
      this.editPrecio = null;
      this.editImagen = null;
      this.editDescripcion = '';
      this.editIngredientes = '';
      this.editOpciones = [];
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
