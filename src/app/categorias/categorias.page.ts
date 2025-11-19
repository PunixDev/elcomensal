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
} from '@ionic/angular/standalone';
import { DataService, Categoria } from '../data.service';
import { Observable, Subscription } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageService } from '../language.service';

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
    TranslateModule,
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

  constructor(
    private dataService: DataService,
    private languageService: LanguageService
  ) {
    this.barId = this.dataService.getBarId();
    this.categorias$ = this.dataService.getCategorias(this.barId);
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
  }

  ngOnDestroy() {
    this.categoriasSub?.unsubscribe();
  }

  async agregarCategoria() {
    if (this.nuevaCategoria.trim()) {
      // Preparar el objeto para traducción
      const request = {
        nombre: this.nuevaCategoria.trim(),
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
        const result = await response.json();
        if (result.success) {
          this.dataService.addCategoria(this.barId, result.data);
          this.nuevaCategoria = '';
          this.mensajeExito = 'Categoría añadida correctamente';
          setTimeout(() => {
            this.mensajeExito = '';
          }, 2500);
        } else {
          alert('Error en la traducción de la categoría');
        }
      } catch (error) {
        console.error('Error al traducir la categoría:', error);
        alert('Error al traducir la categoría');
      }
    }
  }

  eliminarCategoria(id: string) {
    this.dataService.deleteCategoria(this.barId, id);
  }

  iniciarEdicion(categoria: Categoria) {
    this.editando = categoria.id;
    this.editNombre = categoria.nombre as string;
  }

  async guardarEdicion(id: string) {
    if (this.editando && this.editNombre.trim()) {
      // Preparar el objeto para traducción
      const request = {
        nombre: this.editNombre.trim(),
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
        const result = await response.json();
        if (result.success) {
          const categoria: Categoria = {
            id: this.editando!,
            ...result.data,
          };
          this.dataService.updateCategoria(this.barId, categoria);
          this.editando = null;
          this.editNombre = '';
        } else {
          alert('Error en la traducción de la categoría');
        }
      } catch (error) {
        console.error('Error al traducir la categoría:', error);
        alert('Error al traducir la categoría');
      }
    }
  }

  cancelarEdicion() {
    this.editando = null;
    this.editNombre = '';
  }

  guardarOrden(id: string) {
    const val = Number(this.ordenes[id]);
    if (isNaN(val)) return;
    const categoria: any = { id, orden: val };
    this.dataService.updateCategoria(this.barId, categoria);
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
}
