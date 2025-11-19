import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonButton,
  IonItem,
  IonInput,
  IonSpinner,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonList,
  IonLabel,
  IonIcon,
  ModalController,
} from '@ionic/angular/standalone';
import { DataService, Producto, Categoria } from '../data.service';
import { Observable } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-edit-product-modal',
  templateUrl: './edit-product-modal.component.html',
  styleUrls: ['./edit-product-modal.component.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonButton,
    IonItem,
    IonInput,
    IonSpinner,
    IonSelect,
    IonSelectOption,
    IonTextarea,
    IonList,
    IonLabel,
    IonIcon,
    CommonModule,
    FormsModule,
    TranslateModule,
  ],
})
export class EditProductModalComponent {
  @Input() producto!: Producto;
  @Input() categorias$!: Observable<Categoria[]>;

  editNombre = '';
  editCategoria = '';
  editPrecio: number | null = null;
  editImagen: string | null = null;
  editDescripcion = '';
  editAlergenos = '';
  editOpciones: string[] = [];
  editOpcionTemp = '';
  barId: string;
  backendUrl: string;
  isLoading = false;

  constructor(
    private modalController: ModalController,
    private dataService: DataService
  ) {
    this.barId = this.dataService.getBarId();
    this.backendUrl =
      window.location.hostname === 'localhost'
        ? 'http://localhost:3000'
        : 'https://backendelcomensal.onrender.com';
  }

  ngOnInit() {
    this.editNombre = this.producto.nombre;
    this.editCategoria = this.producto.categoria;
    this.editPrecio = this.producto.precio;
    this.editImagen = this.producto.imagen || null;
    this.editDescripcion = this.producto.descripcion || '';
    this.editAlergenos = this.producto.alergenos || '';
    this.editOpciones = this.producto.opciones
      ? [...this.producto.opciones]
      : [];
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

  onEditImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.compressImage(file).then((compressedDataUrl) => {
        this.editImagen = compressedDataUrl;
      });
    }
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

  private arraysEqualTrim(a: string[], b: string[]) {
    if (!a && !b) return true;
    if (!a || !b) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if ((a[i] || '').trim() !== (b[i] || '').trim()) return false;
    }
    return true;
  }

  async guardarEdicion() {
    if (
      this.editNombre.trim() &&
      this.editCategoria &&
      this.editPrecio != null
    ) {
      this.isLoading = true;
      try {
        // Detectar si se han modificado campos traducibles
        const nombreChanged =
          this.editNombre.trim() !== (this.producto.nombre || '');
        const descripcionChanged =
          (this.editDescripcion || '') !== (this.producto.descripcion || '');
        const alergenosChanged =
          (this.editAlergenos || '') !== (this.producto.alergenos || '');
        const opcionesChanged = !this.arraysEqualTrim(
          this.editOpciones || [],
          this.producto.opciones || []
        );

        const translatableChanged =
          nombreChanged ||
          descripcionChanged ||
          alergenosChanged ||
          opcionesChanged;

        if (!translatableChanged) {
          // No hay cambios en campos traducibles: actualizar solo campos editados y preservar traducciones
          const producto: Producto = {
            id: this.producto.id,
            nombre: this.editNombre.trim(),
            categoria: this.editCategoria,
            precio: this.editPrecio,
            imagen: this.editImagen || null,
            descripcion: this.editDescripcion,
            alergenos: this.editAlergenos,
            opciones: [...this.editOpciones],
          };
          await this.dataService.updateProducto(this.barId, producto);
          this.modalController.dismiss(producto, 'confirm');
          return;
        }

        // Si hay cambios en campos traducibles, solicitar traducción al backend
        const request = {
          nombre: this.editNombre.trim(),
          descripcion: this.editDescripcion,
          alergenos: this.editAlergenos,
          opciones: [...this.editOpciones],
          nombreEn: '',
          descripcionEn: '',
          alergenosEn: '',
          opcionesEn: this.editOpciones.map(() => ''),
          nombreFr: '',
          descripcionFr: '',
          alergenosFr: '',
          opcionesFr: this.editOpciones.map(() => ''),
          nombreDe: '',
          descripcionDe: '',
          alergenosDe: '',
          opcionesDe: this.editOpciones.map(() => ''),
          nombreIt: '',
          descripcionIt: '',
          alergenosIt: '',
          opcionesIt: this.editOpciones.map(() => ''),
        };

        try {
          const response = await fetch(`${this.backendUrl}/translate-dish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request),
          });
          const result = await response.json();
          if (result.success) {
            const productoTraducido: Producto = {
              ...result.data,
              id: this.producto.id,
              categoria: this.editCategoria,
              precio: this.editPrecio,
              imagen: this.editImagen || null,
            };
            await this.dataService.updateProducto(
              this.barId,
              productoTraducido
            );
            this.modalController.dismiss(productoTraducido, 'confirm');
          } else {
            alert('Error en la traducción');
          }
        } catch (error) {
          console.error('Error al traducir:', error);
          alert('Error al traducir el producto');
        }
      } finally {
        this.isLoading = false;
      }
    }
  }

  cancelarEdicion() {
    this.modalController.dismiss(null, 'cancel');
  }

  getNombreCategoria(cat: Categoria | undefined): string {
    if (!cat) return '';
    return typeof cat.nombre === 'string' ? cat.nombre : '';
  }
}
