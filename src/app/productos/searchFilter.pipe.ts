import { Pipe, PipeTransform } from '@angular/core';
import { Producto } from '../data.service';

@Pipe({
  name: 'searchFilter',
  standalone: true
})
export class SearchFilterPipe implements PipeTransform {
  transform(productos: Producto[] | null, searchTerm: string): Producto[] {
    if (!productos) return [];
    if (!searchTerm || searchTerm.trim() === '') return productos;

    const term = searchTerm.toLowerCase().trim();
    return productos.filter(p => 
      p.nombre.toLowerCase().includes(term) || 
      (p.descripcion && p.descripcion.toLowerCase().includes(term))
    );
  }
}
