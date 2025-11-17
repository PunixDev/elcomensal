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

  constructor(
    private modalController: ModalController,
    private dataService: DataService
  ) {
    this.barId = this.dataService.getBarId();
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

  guardarEdicion() {
    if (
      this.editNombre.trim() &&
      this.editCategoria &&
      this.editPrecio != null
    ) {
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
      this.dataService.updateProducto(this.barId, producto);
      this.modalController.dismiss(producto, 'confirm');
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
