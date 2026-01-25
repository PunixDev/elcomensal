import { Component, OnInit, OnDestroy } from '@angular/core';
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
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonBadge,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
} from '@ionic/angular/standalone';
import { DataService, Categoria, Comandero } from '../data.service';
import { Observable, Subscription, firstValueFrom } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageService } from '../language.service';
import { CategorySearchFilterPipe } from './categorySearchFilter.pipe';

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
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonBadge,
    IonBadge,
    IonSearchbar,
    IonSelect,
    IonSelectOption,
    CommonModule,
    FormsModule,
    TranslateModule,
    CategorySearchFilterPipe,
  ],
})
export class CategoriasPage implements OnInit {
  categorias$: Observable<Categoria[]>;
  ordenes: { [id: string]: number } = {};
  private categoriasSub?: Subscription;
  nuevaCategoria = '';
  editando: string | null = null;
  editNombre = '';
  barId: string;
  mensajeExito = '';
  backendUrl: string;
  searchTerm = '';
  comanderos$: Observable<Comandero[]>;
  nuevoComanderoId: string | null = null;
  editComanderoId: string | null = null;
  private comanderosList: Comandero[] = [];
  private comanderosSub?: Subscription;
  
  constructor(
    private dataService: DataService,
    private languageService: LanguageService
  ) {
    this.barId = this.dataService.getBarId();
    this.categorias$ = this.dataService.getCategorias(this.barId);
    this.comanderos$ = this.dataService.getComanderos(this.barId);
    this.backendUrl =
      window.location.hostname === 'localhost'
        ? 'http://localhost:3000'
        : 'https://backendelcomensal.onrender.com';
  }

  ngOnInit() {
    this.categoriasSub = this.categorias$.subscribe((list) => {
      (list || []).forEach((cat) => {
        if (!cat || cat.id == null) return;
        this.ordenes[cat.id] =
          typeof cat.orden === 'number' ? cat.orden : this.ordenes[cat.id] ?? 0;
      });
    });

    this.comanderosSub = this.comanderos$.subscribe((list) => {
      this.comanderosList = list || [];
    });
  }

  ngOnDestroy() {
    this.categoriasSub?.unsubscribe();
    this.comanderosSub?.unsubscribe();
  }

  async agregarCategoria() {
    if (this.nuevaCategoria.trim()) {
      const nombreLimpio = this.nuevaCategoria.trim();
      // Preparar el objeto para traducción
      const request = {
        nombre: nombreLimpio,
        nombreEn: '',
        nombreFr: '',
        nombreDe: '',
        nombreIt: '',
      };

      try {
        const response = await fetch(`${this.backendUrl}/translate-category`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
        });
        
        if (!response.ok) throw new Error('Network response not ok');
        
        const result = await response.json();
        if (result.success) {
          const newCat: any = {
             ...result.data,
             comanderoId: this.nuevoComanderoId || undefined,
          };
          this.dataService.addCategoria(this.barId, newCat);
        } else {
          throw new Error('Translation failed');
        }
      } catch (error) {
        console.error('Error al traducir la categoría, guardando local:', error);
        // Fallback: Add category with only the primary name
        const fallbackCat: any = {
          nombre: nombreLimpio,
          nombreEn: nombreLimpio,
          nombreFr: nombreLimpio,
          nombreDe: nombreLimpio,
          nombreIt: nombreLimpio,
          comanderoId: this.nuevoComanderoId || undefined,
          orden: 99
        };
        this.dataService.addCategoria(this.barId, fallbackCat);
      } finally {
        this.nuevaCategoria = '';
        this.nuevoComanderoId = null;
        this.mensajeExito = 'Categoría añadida correctamente';
        setTimeout(() => {
          this.mensajeExito = '';
        }, 3000);
      }
    }
  }

  eliminarCategoria(id: string) {
    this.dataService.deleteCategoria(this.barId, id);
  }

  iniciarEdicion(categoria: Categoria) {
    this.editando = categoria.id;
    this.editNombre = categoria.nombre as string;
    this.editComanderoId = categoria.comanderoId || null;
  }

  async guardarEdicion(id: string) {
    if (this.editando && this.editNombre.trim()) {
      const categorias = await firstValueFrom(this.categorias$);
      const original = categorias.find(c => c.id === id);
      const nombreLimpio = this.editNombre.trim();

      // Check if only the comandero changed
      if (original && original.nombre === nombreLimpio && original.comanderoId === (this.editComanderoId || null)) {
        this.editando = null;
        return;
      }

      // If name hasn't changed, just update the comandero without translating
      if (original && original.nombre === nombreLimpio) {
        const categoria: Categoria = {
          ...original,
          comanderoId: this.editComanderoId || undefined,
        };
        this.dataService.updateCategoria(this.barId, categoria);
        this.editando = null;
        this.editNombre = '';
        this.editComanderoId = null;
        return;
      }

      // If name changed, try to translate
      const request = {
        nombre: nombreLimpio,
        nombreEn: '',
        nombreFr: '',
        nombreDe: '',
        nombreIt: '',
      };

      try {
        const response = await fetch(`${this.backendUrl}/translate-category`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
        });
        
        if (!response.ok) throw new Error('Network response was not ok');
        
        const result = await response.json();
        if (result.success) {
          const categoria: Categoria = {
            id: this.editando!,
            ...result.data,
            comanderoId: this.editComanderoId || undefined,
          };
          this.dataService.updateCategoria(this.barId, categoria);
        } else {
          throw new Error('Translation result unsuccessful');
        }
      } catch (error) {
        console.error('Error al traducir la categoría, guardando sin traducción:', error);
        // Fallback: Save without updating other translations if service is down
        if (original) {
          const categoria: Categoria = {
            ...original,
            nombre: nombreLimpio,
            comanderoId: this.editComanderoId || undefined,
          };
          this.dataService.updateCategoria(this.barId, categoria);
        }
      } finally {
        this.editando = null;
        this.editNombre = '';
        this.editComanderoId = null;
      }
    }
  }

  cancelarEdicion() {
    this.editando = null;
    this.editNombre = '';
    this.editComanderoId = null;
  }

  async guardarOrden(id: string) {
    const nuevoOrden = Number(this.ordenes[id]);
    if (isNaN(nuevoOrden) || nuevoOrden < 1) return;

    // Obtener la lista actual de categorías
    const categorias = await firstValueFrom(this.categorias$);
    if (!categorias) return;

    // Crear copia ordenable
    // Asumimos que si no tienen orden, es 0
    let sorted = [...categorias].sort((a, b) => (a.orden || 0) - (b.orden || 0));

    // Encontrar el elemento que se mueve
    const currentIndex = sorted.findIndex((c) => c.id === id);
    if (currentIndex === -1) return;

    const itemToMove = sorted[currentIndex];

    // Remover de la posición actual
    sorted.splice(currentIndex, 1);

    // Calcular nueva posición (index 0-based)
    // Ajustar si el usuario puso un número mayor al total
    let targetIndex = nuevoOrden - 1;
    if (targetIndex < 0) targetIndex = 0;
    if (targetIndex > sorted.length) targetIndex = sorted.length;

    // Insertar en nueva posición
    sorted.splice(targetIndex, 0, itemToMove);

    // Actualizar todos los que hayan cambiado de orden
    const updates: Promise<void>[] = [];

    sorted.forEach((cat, index) => {
      const expectedOrder = index + 1;
      // Solo actualizamos si el orden difiere del que tenía o si es el item movido (para asegurar consistencia)
      // Ojo: itemToMove.orden puede ser el viejo.
      // Comparamos con los datos originales del objeto 'cat'.
      if (cat.orden !== expectedOrder) {
        updates.push(
          this.dataService.updateCategoria(this.barId, {
            id: cat.id,
            orden: expectedOrder,
          } as any)
        );
      }
    });

    await Promise.all(updates);
  }

  getNombreCategoria(cat: Categoria): string {
    if (!cat) return '';
    const lang = this.languageService.getCurrentLanguage();
    if (lang === 'en') return cat.nombreEn || cat.nombre;
    if (lang === 'fr') return cat.nombreFr || cat.nombre;
    if (lang === 'de') return cat.nombreDe || cat.nombre;
    if (lang === 'it') return cat.nombreIt || cat.nombre;
    return cat.nombre;
  }

  async toggleOculta(categoria: Categoria) {
    const nuevoEstado = !categoria.oculta;
    await this.dataService.updateCategoria(this.barId, {
      ...categoria,
      oculta: nuevoEstado,
    });
  }

  getComanderoName(id?: string): string {
    if (!id) return 'General';
    const c = this.comanderosList.find(com => com.id === id);
    return c ? c.descripcion : 'General';
  }
}
