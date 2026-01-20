import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonItem,
  IonInput,
  IonSpinner,
  ModalController,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { DataService, Categoria } from '../data.service';

@Component({
  selector: 'app-import-menu-modal',
  templateUrl: './import-menu-modal.component.html',
  styleUrls: ['./import-menu-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonItem,
    IonInput,
    IonSpinner,
  ],
})
export class ImportMenuModalComponent implements OnInit {
  @Input() existingCategories: Categoria[] = [];
  
  mode: 'image' | 'url' = 'image';
  selectedImage: string | null = null;
  menuUrl: string = '';
  isProcessing = false;
  statusMessage = '';
  barId: string;
  backendUrl: string;

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

  ngOnInit() {}

  cancel() {
    this.modalController.dismiss();
  }

  onModeChange() {
    this.statusMessage = '';
  }

  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.compressImage(file).then((result) => {
        this.selectedImage = result;
      });
    }
  }

  private compressImage(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const img = new Image();
        img.onload = () => {
          let canvas = document.createElement('canvas');
          let ctx = canvas.getContext('2d')!;
          // Reduced resolution to avoid Payload Too Large (default limit usually 100kb)
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
          
          // Quality 0.6 to reduce size
          let quality = 0.6;
          let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          
          // If still too large (>100KB approx), reduce usage
          // 100KB = ~133,333 base64 chars. Leave margin for JSON overhead.
          // Try to reach ~95,000 chars to be safe if limit is 100kb
          const MAX_LENGTH = 95000; 
          
          while (compressedDataUrl.length > MAX_LENGTH && quality > 0.3) {
             quality -= 0.1;
             compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          }
          
          // If still too large after quality reduction, scale aggressively
          if (compressedDataUrl.length > MAX_LENGTH) {
             const scale = 0.7; // 70% of current size
             const newWidth = width * scale;
             const newHeight = height * scale;
             
             canvas = document.createElement('canvas');
             canvas.width = newWidth;
             canvas.height = newHeight;
             ctx = canvas.getContext('2d')!;
             ctx.drawImage(img, 0, 0, newWidth, newHeight);
             compressedDataUrl = canvas.toDataURL('image/jpeg', 0.5);
          }

          resolve(compressedDataUrl);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  async processMenu() {
    this.isProcessing = true;
    this.statusMessage = 'Enviando menú a la IA...';

    const payload: any = {};
    
    if (this.mode === 'image' && this.selectedImage) {
      payload.image = this.selectedImage;
    } else if (this.mode === 'url' && this.menuUrl) {
      payload.url = this.menuUrl;
    } else {
      this.isProcessing = false;
      return;
    }

    try {
      const response = await fetch(`${this.backendUrl}/parse-menu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success && result.data && result.data.categories) {
        this.statusMessage = 'Procesando respuesta...';
        await this.importData(result.data.categories);
        this.modalController.dismiss({ imported: true });
      } else {
        this.statusMessage = 'Error: No se pudo analizar el menú.';
        console.error('Menu parse failed:', result);
      }
    } catch (error) {
      console.error('Error processing menu:', error);
      this.statusMessage = 'Error de conexión con el servidor de IA.';
    } finally {
      this.isProcessing = false;
    }
  }

  async importData(importedCategories: any[]) {
    let categoriesAdded = 0;
    let productsAdded = 0;

    for (const catData of importedCategories) {
      // 1. Check if category exists
      let categoryId = '';
      const existingCat = this.existingCategories.find(
        (c) => c.nombre.toLowerCase() === catData.name.toLowerCase()
      );

      if (existingCat) {
        categoryId = existingCat.id;
      } else {
        // Create new category
        this.statusMessage = `Creando categoría: ${catData.name}...`;
        const newCatRef = await this.dataService.addCategoria(this.barId, {
          nombre: catData.name,
          nombreEn: catData.nameEn || '',
          nombreFr: catData.nameFr || '',
          nombreDe: catData.nameDe || '',
          nombreIt: catData.nameIt || '',
        });
        categoryId = newCatRef.id;
        categoriesAdded++;
      }

      // 2. Add products
      if (catData.products && Array.isArray(catData.products)) {
        for (const prod of catData.products) {
          this.statusMessage = `Añadiendo producto: ${prod.nombre}...`;
          await this.dataService.addProducto(this.barId, {
            nombre: prod.nombre,
            categoria: categoryId,
            precio: typeof prod.precio === 'number' ? prod.precio : 0,
            descripcion: prod.descripcion || '',
            alergenos: prod.alergenos || '',
            opciones: prod.opciones || [],
            // Translations
            nombreEn: prod.nombreEn || '',
            descripcionEn: prod.descripcionEn || '',
            alergenosEn: prod.alergenosEn || '',
            opcionesEn: prod.opcionesEn || [],
            
            nombreFr: prod.nombreFr || '',
            descripcionFr: prod.descripcionFr || '',
            alergenosFr: prod.alergenosFr || '',
            opcionesFr: prod.opcionesFr || [],

            nombreDe: prod.nombreDe || '',
            descripcionDe: prod.descripcionDe || '',
            alergenosDe: prod.alergenosDe || '',
            opcionesDe: prod.opcionesDe || [],

            nombreIt: prod.nombreIt || '',
            descripcionIt: prod.descripcionIt || '',
            alergenosIt: prod.alergenosIt || '',
            opcionesIt: prod.opcionesIt || [],
          });
          productsAdded++;
        }
      }
    }
    
    this.statusMessage = `Importación completada: ${categoriesAdded} categorías y ${productsAdded} productos añadidos.`;
    // Short delay to let user read
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
}
