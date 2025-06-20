import { Injectable } from '@angular/core';

export interface Categoria {
  id: number;
  nombre: string;
}

export interface Producto {
  id: number;
  nombre: string;
  categoria: string;
  precio: number;
  imagen?: string | null;
  descripcion?: string;
  ingredientes?: string;
  opciones?: string[];
}

@Injectable({ providedIn: 'root' })
export class DataService {
  getCategorias(): Categoria[] {
    const data = localStorage.getItem('categorias');
    return data ? JSON.parse(data) : [];
  }

  saveCategorias(categorias: Categoria[]) {
    localStorage.setItem('categorias', JSON.stringify(categorias));
  }

  getProductos(): Producto[] {
    const data = localStorage.getItem('productos');
    return data ? JSON.parse(data) : [];
  }

  saveProductos(productos: Producto[]) {
    localStorage.setItem('productos', JSON.stringify(productos));
  }

  // Comandas para pedidos de clientes
  getComandas(): any[] {
    return JSON.parse(localStorage.getItem('comandas') || '[]');
  }

  saveComanda(comanda: any) {
    const comandas = this.getComandas();
    comanda.estado = comanda.estado || undefined; // Permite estado inicial undefined
    comandas.push(comanda);
    localStorage.setItem('comandas', JSON.stringify(comandas));
  }

  clearComandas() {
    localStorage.removeItem('comandas');
  }

  // Limpia todas las comandas de una mesa específica
  clearComandasMesa(mesa: string) {
    const comandas = this.getComandas();
    const filtradas = comandas.filter((c: any) => c.mesa !== mesa);
    localStorage.setItem('comandas', JSON.stringify(filtradas));
  }
}
