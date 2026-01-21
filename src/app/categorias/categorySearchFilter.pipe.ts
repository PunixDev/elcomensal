import { Pipe, PipeTransform } from '@angular/core';
import { Categoria } from '../data.service';

@Pipe({
  name: 'categorySearchFilter',
  standalone: true
})
export class CategorySearchFilterPipe implements PipeTransform {
  transform(categorias: Categoria[] | null, searchTerm: string): Categoria[] {
    if (!categorias) return [];
    if (!searchTerm || searchTerm.trim() === '') {
        return [...categorias].sort((a, b) => (a.orden || 0) - (b.orden || 0));
    }

    const term = searchTerm.toLowerCase().trim();
    return categorias
      .filter(c => c.nombre.toLowerCase().includes(term))
      .sort((a, b) => (a.orden || 0) - (b.orden || 0));
  }
}
