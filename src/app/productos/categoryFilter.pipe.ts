import { Pipe, PipeTransform } from '@angular/core';
import { Producto } from '../data.service';

@Pipe({
  name: 'categoryFilter',
  standalone: true,
})
export class CategoryFilterPipe implements PipeTransform {
  transform(productos: Producto[] | null, categoria: string): Producto[] {
    if (!productos) return [];
    return productos.filter((p) => p.categoria === categoria);
  }
}
