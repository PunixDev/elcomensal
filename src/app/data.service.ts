import { Injectable } from '@angular/core';
import {
  Firestore,
  collectionData,
  collection,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  docData,
  query,
  where,
  orderBy,
} from '@angular/fire/firestore';
import { Observable, firstValueFrom } from 'rxjs';

export interface Categoria {
  id: string;
  nombre: string;
  nombreTrad?: string;
}

export interface Producto {
  id: string;
  nombre: string;
  nombreTrad?: string;
  categoria: string;
  precio: number;
  imagen?: string | null;
  descripcion?: string;
  descripcionTrad?: string;
  alergenos?: string;
  alergenosTrad?: string;
  opciones?: string[];
  opcionesTrad?: string[];
}

export interface BarRegistro {
  nombre: string;
  usuario: string;
  password: string;
  correo: string;
}

@Injectable({ providedIn: 'root' })
export class DataService {
  constructor(private firestore: Firestore) {}

  // --- CATEGORÍAS ---
  getCategorias(barId: string): Observable<Categoria[]> {
    const ref = collection(this.firestore, `bares/${barId}/categorias`);
    return collectionData(ref, { idField: 'id' }) as Observable<Categoria[]>;
  }

  addCategoria(barId: string, categoria: Omit<Categoria, 'id'>) {
    const ref = collection(this.firestore, `bares/${barId}/categorias`);
    return addDoc(ref, categoria);
  }

  updateCategoria(barId: string, categoria: Categoria) {
    const ref = doc(
      this.firestore,
      `bares/${barId}/categorias/${categoria.id}`
    );
    return setDoc(ref, categoria);
  }

  deleteCategoria(barId: string, id: string) {
    const ref = doc(this.firestore, `bares/${barId}/categorias/${id}`);
    return deleteDoc(ref);
  }

  // --- PRODUCTOS ---
  getProductos(barId: string): Observable<Producto[]> {
    const ref = collection(this.firestore, `bares/${barId}/productos`);
    return collectionData(ref, { idField: 'id' }) as Observable<Producto[]>;
  }

  addProducto(barId: string, producto: Omit<Producto, 'id'>) {
    const ref = collection(this.firestore, `bares/${barId}/productos`);
    return addDoc(ref, producto);
  }

  updateProducto(barId: string, producto: Producto) {
    const ref = doc(this.firestore, `bares/${barId}/productos/${producto.id}`);
    return setDoc(ref, producto);
  }

  deleteProducto(barId: string, id: string) {
    const ref = doc(this.firestore, `bares/${barId}/productos/${id}`);
    return deleteDoc(ref);
  }

  // --- COMANDAS ---
  getComandas(barId: string): Observable<any[]> {
    const ref = collection(this.firestore, `bares/${barId}/comandas`);
    return collectionData(ref, { idField: 'id' }) as Observable<any[]>;
  }

  addComanda(barId: string, comanda: any) {
    // Asegura que el campo estado nunca sea undefined
    if (comanda.estado === undefined) {
      comanda.estado = 'pendiente'; // Valor por defecto
    }
    const ref = collection(this.firestore, `bares/${barId}/comandas`);
    return addDoc(ref, comanda);
  }

  updateComanda(barId: string, comanda: any) {
    const ref = doc(this.firestore, `bares/${barId}/comandas/${comanda.id}`);
    return setDoc(ref, comanda);
  }

  deleteComanda(barId: string, id: string) {
    const ref = doc(this.firestore, `bares/${barId}/comandas/${id}`);
    return deleteDoc(ref);
  }

  // --- USUARIOS (para login y administración) ---
  getUsuarios(barId: string): Observable<any[]> {
    const ref = collection(this.firestore, `bares/${barId}/usuarios`);
    return collectionData(ref, { idField: 'id' }) as Observable<any[]>;
  }

  addUsuario(barId: string, usuario: { usuario: string; password: string }) {
    const ref = collection(this.firestore, `bares/${barId}/usuarios`);
    return addDoc(ref, usuario);
  }

  // --- REGISTRO DE BARES Y USUARIO ADMIN ---
  async registrarBar(data: BarRegistro) {
    // Verifica si ya existe un bar con ese correo o usuario admin
    const baresRef = collection(this.firestore, 'bares');
    const baresSnap = await firstValueFrom(
      collectionData(baresRef, { idField: 'id' })
    );
    if (
      baresSnap?.some(
        (b: any) => b.correo === data.correo || b.usuario === data.usuario
      )
    ) {
      throw new Error('Ya existe un bar con ese correo o usuario');
    }
    // Crea el bar
    const barDoc = await addDoc(baresRef, {
      nombre: data.nombre,
      correo: data.correo,
      usuario: data.usuario,
    });
    // Crea el usuario admin en la subcolección usuarios
    const usuariosRef = collection(
      this.firestore,
      `bares/${barDoc.id}/usuarios`
    );
    await addDoc(usuariosRef, {
      usuario: data.usuario,
      password: data.password,
      correo: data.correo,
      rol: 'admin',
    });
    return barDoc.id;
  }

  // --- RECUPERACIÓN DE CONTRASEÑA ---
  async buscarUsuarioPorCorreo(
    correo: string
  ): Promise<{ usuario: string; barId: string } | null> {
    const baresRef = collection(this.firestore, 'bares');
    const baresSnap = await firstValueFrom(
      collectionData(baresRef, { idField: 'id' })
    );
    for (const bar of baresSnap as any[]) {
      const usuariosRef = collection(
        this.firestore,
        `bares/${bar.id}/usuarios`
      );
      const usuariosSnap = await firstValueFrom(
        collectionData(usuariosRef, { idField: 'id' })
      );
      const user = (usuariosSnap as any[]).find((u) => u.correo === correo);
      if (user) {
        return { usuario: user.usuario, barId: bar.id };
      }
    }
    return null;
  }

  async cambiarPasswordUsuario(
    barId: string,
    usuario: string,
    nuevaPassword: string
  ) {
    const usuariosRef = collection(this.firestore, `bares/${barId}/usuarios`);
    const usuariosSnap = await firstValueFrom(
      collectionData(usuariosRef, { idField: 'id' })
    );
    const user = (usuariosSnap as any[]).find((u) => u.usuario === usuario);
    if (user) {
      const userDoc = doc(this.firestore, `bares/${barId}/usuarios/${user.id}`);
      await setDoc(userDoc, { ...user, password: nuevaPassword });
    } else {
      throw new Error('Usuario no encontrado');
    }
  }

  /**
   * Busca un usuario por nombre de usuario y contraseña en todos los bares.
   * Devuelve { usuario, barId } si encuentra coincidencia, o null si no.
   */
  async loginMultiBar(
    usuario: string,
    password: string
  ): Promise<{ usuario: any; barId: string } | null> {
    const baresRef = collection(this.firestore, 'bares');
    const baresSnap = await firstValueFrom(
      collectionData(baresRef, { idField: 'id' })
    );
    for (const bar of baresSnap as any[]) {
      const usuariosRef = collection(
        this.firestore,
        `bares/${bar.id}/usuarios`
      );
      const usuariosSnap = await firstValueFrom(
        collectionData(usuariosRef, { idField: 'id' })
      );
      const user = (usuariosSnap as any[]).find(
        (u) => u.usuario === usuario && u.password === password
      );
      if (user) {
        return { usuario: user, barId: bar.id };
      }
    }
    return null;
  }

  // --- Historial de pedidos ---
  // Guarda un pedido en el historial
  addHistorial(barId: string, pedido: any) {
    const ref = collection(this.firestore, `bares/${barId}/historial`);
    return addDoc(ref, pedido);
  }

  // Devuelve el historial de pedidos
  getHistorial(barId: string) {
    const ref = collection(this.firestore, `bares/${barId}/historial`);
    const q = query(ref, orderBy('fecha', 'desc'));
    return collectionData(q, { idField: 'id' });
  }

  // Devuelve el historial de pedidos filtrado por fecha y mesa
  getHistorialFiltrado(barId: string, fecha: string, mesa?: string) {
    const ref = collection(this.firestore, `bares/${barId}/historial`);
    let filtros = [where('fechaDia', '==', fecha)];
    if (mesa) {
      filtros.push(where('mesa', '==', mesa));
    }
    const q = query(ref, ...filtros, orderBy('fecha', 'desc'));
    return collectionData(q, { idField: 'id' });
  }

  // --- Utilidad: obtener barId actual (desde localStorage o auth) ---
  getBarId(): string {
    return localStorage.getItem('usuario') || 'bar-demo';
  }
}
