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
  IonSpinner,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonButtons,
  IonBackButton,
  IonTextarea,
  IonIcon,
  IonItemDivider,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonBadge,
  IonChip,
  IonSearchbar,
} from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular/standalone';
import { DataService, Producto, Categoria } from '../data.service';
import { Observable } from 'rxjs';
import { CategoryFilterPipe } from './categoryFilter.pipe';
import { SearchFilterPipe } from './searchFilter.pipe';
import { TranslateModule } from '@ngx-translate/core';
import { EditProductModalComponent } from '../edit-product-modal/edit-product-modal.component';
import { ImportMenuModalComponent } from '../import-menu-modal/import-menu-modal.component';

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
    IonSpinner,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonButtons,
    IonBackButton,
    IonTextarea,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonBadge,
    IonChip,
    IonSearchbar,
    CommonModule,
    FormsModule,
    CategoryFilterPipe,
    SearchFilterPipe,
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
  barId: string;
  intentadoAgregar = false;
  categorias: Categoria[] = [];
  categoriasConOpen: { nombre: string; id: string; _open: boolean }[] = [];
  backendUrl: string;
  isAdding = false;
  searchTerm = '';

  constructor(
    private dataService: DataService,
    private modalController: ModalController
  ) {
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
    this.backendUrl =
      window.location.hostname === 'localhost'
        ? 'http://localhost:3000'
        : 'https://backendelcomensal.onrender.com';
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
      this.isAdding = true;
      // Preparar el objeto para traducción
      const request = {
        nombre: this.nuevoNombre.trim(),
        precio: this.nuevoPrecio,
        descripcion: this.nuevaDescripcion,
        alergenos: this.nuevosAlergenos,
        opciones: [...this.nuevasOpciones],
        nombreEn: '',
        descripcionEn: '',
        alergenosEn: '',
        opcionesEn: this.nuevasOpciones.map(() => ''),
        nombreFr: '',
        descripcionFr: '',
        alergenosFr: '',
        opcionesFr: this.nuevasOpciones.map(() => ''),
        nombreDe: '',
        descripcionDe: '',
        alergenosDe: '',
        opcionesDe: this.nuevasOpciones.map(() => ''),
        nombreIt: '',
        descripcionIt: '',
        alergenosIt: '',
        opcionesIt: this.nuevasOpciones.map(() => ''),
      };

      try {
        const response = await fetch(`${this.backendUrl}/translate-dish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
        });
        const result = await response.json();
        if (result.success) {
          const nuevo = {
            ...result.data,
            categoria: this.nuevaCategoria,
            imagen: this.nuevaImagen || null,
          };
          console.log('Campos enviados a agregarProducto:', nuevo);
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
        } else {
          alert('Error en la traducción');
        }
      } catch (error) {
        console.error('Error al traducir:', error);
        alert('Error al traducir el producto');
      } finally {
        this.isAdding = false;
      }
    }
  }

  private compressImage(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d')!;
          const maxWidth = 800;
          const maxHeight = 800;
          let { width, height } = img;

          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          resolve(compressedDataUrl);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.compressImage(file).then((compressedDataUrl) => {
        this.nuevaImagen = compressedDataUrl;
      });
    }
  }

  eliminarProducto(id: string) {
    this.dataService.deleteProducto(this.barId, id);
  }

  async iniciarEdicion(producto: Producto) {
    const modal = await this.modalController.create({
      component: EditProductModalComponent,
      componentProps: {
        producto: producto,
        categorias$: this.categorias$,
      },
    });
    modal.present();
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

  async abrirImportarModal() {
    const modal = await this.modalController.create({
      component: ImportMenuModalComponent,
      componentProps: {
        existingCategories: this.categorias,
      },
    });
    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data && data.imported) {
      // Refresh or show success message if needed, though observables should update automatically
    }
  }

  getNombreCategoria(cat: Categoria | undefined): string {
    if (!cat) return '';
    return typeof cat.nombre === 'string' ? cat.nombre : '';
  }

  async togglerAgotado(producto: Producto) {
    const nuevoEstado = !producto.agotado;
    await this.dataService.updateProducto(this.barId, {
      ...producto,
      agotado: nuevoEstado,
    });
  }
}
