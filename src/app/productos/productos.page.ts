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
import { ModalController } from '@ionic/angular/standalone';
import { DataService, Producto, Categoria } from '../data.service';
import { Observable } from 'rxjs';
import { CategoryFilterPipe } from './categoryFilter.pipe';
import { TranslateModule } from '@ngx-translate/core';
import { EditProductModalComponent } from '../edit-product-modal/edit-product-modal.component';

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
    EditProductModalComponent,
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

  getNombreCategoria(cat: Categoria | undefined): string {
    if (!cat) return '';
    return typeof cat.nombre === 'string' ? cat.nombre : '';
  }
}
