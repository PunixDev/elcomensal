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
  IonItemDivider,
} from '@ionic/angular/standalone';
import { DataService, Producto, Categoria } from '../data.service';
import { Observable } from 'rxjs';
import { CategoryFilterPipe } from './categoryFilter.pipe';
import { TranslateModule } from '@ngx-translate/core';

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
    CategoryFilterPipe,
    TranslateModule,
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
  categorias: Categoria[] = [];
  categoriasConOpen: { nombre: string; id: string; _open: boolean }[] = [];

  constructor(private dataService: DataService) {
    this.barId = this.dataService.getBarId();
    this.productos$ = this.dataService.getProductos(this.barId);
    this.categorias$ = this.dataService.getCategorias(this.barId);
    this.categorias$.subscribe((cats) => {
      this.categorias = cats;
      this.categoriasConOpen = cats.map((cat) => ({
        ...cat,
        _open: false,
      }));
    });
  }

  ngOnInit() {}

  async agregarProducto() {
    this.intentadoAgregar = true;
    if (
      this.nuevoNombre &&
      this.nuevoNombre.trim() &&
      this.nuevaCategoria &&
      this.nuevoPrecio != null
    ) {
      // Traducción automática a los idiomas soportados
      const idiomas = [
        { key: 'en', name: 'Inglés' },
        { key: 'fr', name: 'Francés' },
        { key: 'de', name: 'Alemán' },
        { key: 'it', name: 'Italiano' },
      ];
      const apiKey = 'AQUI_TU_API_KEY'; // Poner tu clave de Google Translate API
      const translateText = async (text: string, target: string) => {
        if (!text) return '';
        try {
          const res = await fetch(
            `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ q: text, target, format: 'text' }),
            }
          );
          const data = await res.json();
          return data.data.translations[0].translatedText || '';
        } catch (e) {
          return '';
        }
      };
      // Traducir todos los campos relevantes
      const traducciones: any = {};
      for (const idioma of idiomas) {
        traducciones[
          `nombre${idioma.key.charAt(0).toUpperCase() + idioma.key.slice(1)}`
        ] = await translateText(this.nuevoNombre, idioma.key);
        traducciones[
          `descripcion${
            idioma.key.charAt(0).toUpperCase() + idioma.key.slice(1)
          }`
        ] = await translateText(this.nuevaDescripcion, idioma.key);
        traducciones[
          `alergenos${idioma.key.charAt(0).toUpperCase() + idioma.key.slice(1)}`
        ] = await translateText(this.nuevosAlergenos, idioma.key);
        if (this.nuevasOpciones && this.nuevasOpciones.length) {
          traducciones[
            `opciones${
              idioma.key.charAt(0).toUpperCase() + idioma.key.slice(1)
            }`
          ] = [];
          for (const op of this.nuevasOpciones) {
            traducciones[
              `opciones${
                idioma.key.charAt(0).toUpperCase() + idioma.key.slice(1)
              }`
            ].push(await translateText(op, idioma.key));
          }
        }
      }
      const nuevo = {
        nombre: this.nuevoNombre.trim(),
        categoria: this.nuevaCategoria,
        precio: this.nuevoPrecio,
        imagen: this.nuevaImagen || null,
        descripcion: this.nuevaDescripcion,
        alergenos: this.nuevosAlergenos,
        opciones: [...this.nuevasOpciones],
        ...traducciones,
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
      // Mensaje de éxito
      alert('Producto añadido con éxito');
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

  getNombreCategoria(cat: Categoria | undefined): string {
    if (!cat) return '';
    return typeof cat.nombre === 'string' ? cat.nombre : '';
  }
}
