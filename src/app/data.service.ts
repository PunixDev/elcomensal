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
  getDoc,
  docData,
  query,
  where,
  orderBy,
} from '@angular/fire/firestore';
import { Observable, firstValueFrom } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

export interface Categoria {
  id: string;
  nombre: string;
  nombreEn?: string;
  nombreFr?: string;
  nombreDe?: string;
  nombreIt?: string;
  orden?: number;
  oculta?: boolean;
  comanderoId?: string;
}

export interface Comandero {
  id: string;
  numero: number;
  descripcion: string;
}

export interface Producto {
  id: string;
  nombre: string;
  categoria: string;
  precio: number;
  imagen?: string | null;
  descripcion?: string;
  alergenos?: string;
  opciones?: string[];
  nombreEn?: string;
  descripcionEn?: string;
  alergenosEn?: string;
  opcionesEn?: string[];
  nombreFr?: string;
  descripcionFr?: string;
  alergenosFr?: string;
  opcionesFr?: string[];
  nombreDe?: string;
  descripcionDe?: string;
  alergenosDe?: string;
  opcionesDe?: string[];
  nombreIt?: string;
  descripcionIt?: string;
  alergenosIt?: string;
  opcionesIt?: string[];
  agotado?: boolean;
}

export interface BarRegistro {
  nombre: string;
  usuario: string;
  password: string;
  correo: string;
  trialStart: string;
  // Idioma predeterminado del bar (código: 'es'|'en'|'it'|'de'|'fr')
  defaultLanguage?: string;
}

export interface Promotion {
  id: string;
  name: string;
  type: '2x1' | 'discount_percent' | 'discount_fixed';
  value?: number; // e.g. 20 for 20% or 5 for 5€
  days: number[]; // 0-6 (Sun-Sat)
  startTime: string; // "18:00"
  endTime: string; // "20:00"
  productIds: string[]; // Specific products or empty for ALL
  active: boolean;
}

@Injectable({ providedIn: 'root' })
export class DataService {
  // Cache sencillo para Observables compartidos para evitar múltiples escuchas
  private cache: { [key: string]: Observable<any> } = {};

  constructor(private firestore: Firestore) {}

  private getCachedObservable<T>(key: string, observableQuery: Observable<T>): Observable<T> {
    if (!this.cache[key]) {
      // refCount: true hace que cuando no haya suscriptores se desconecte de Firestore
      // bufferSize: 1 recuerda el último valor para nuevos suscriptores inmediatos
      this.cache[key] = observableQuery.pipe(
        shareReplay({ bufferSize: 1, refCount: true })
      );
    }
    return this.cache[key];
  }

  // Obtiene la imagen de cabecera en bares/{barId}/cabecera/imagen
  getCabeceraImagen(barId: string) {
    const key = `cabecera-${barId}`;
    const ref = doc(this.firestore, `bares/${barId}/cabecera/imagen`);
    return this.getCachedObservable(key, docData(ref));
  }

  // Obtiene el trialStart del bar - OPTIMIZADO: Lectura única (no real-time)
  async getTrialStart(barId: string) {
    const ref = doc(this.firestore, `bares/${barId}`);
    return getDoc(ref).then(snap => snap.data());
  }

  // Guarda la imagen de cabecera en bares/{barId}/cabecera
  async guardarCabeceraImagen(barId: string, imagenBase64: string) {
    const ref = doc(this.firestore, `bares/${barId}/cabecera/imagen`);
    await setDoc(ref, { imagen: imagenBase64 });
  }

  // --- CATEGORÍAS ---
  getCategorias(barId: string): Observable<Categoria[]> {
    const key = `categorias-${barId}`;
    const ref = collection(this.firestore, `bares/${barId}/categorias`);
    const q = query(ref, orderBy('orden', 'asc'));
    return this.getCachedObservable(key, collectionData(q, { idField: 'id' })) as Observable<Categoria[]>;
  }

  async addCategoria(barId: string, categoria: Omit<Categoria, 'id'>) {
    const ref = collection(this.firestore, `bares/${barId}/categorias`);
    // Obtener categorías existentes para calcular el siguiente `orden`
    const existing =
      (await firstValueFrom(
        collectionData(ref, { idField: 'id' }) as Observable<any[]>
      )) || [];
    const maxOrden = existing.reduce((m, c) => {
      const o = typeof c.orden === 'number' ? c.orden : -1;
      return Math.max(m, o);
    }, -1);
    const newOrden = maxOrden + 1;
    const toAdd = { ...categoria, orden: newOrden } as any;
    return addDoc(ref, toAdd);
  }

  updateCategoria(barId: string, categoria: Categoria) {
    const ref = doc(
      this.firestore,
      `bares/${barId}/categorias/${categoria.id}`
    );
    // Usar merge para no sobreescribir campos existentes (p.ej. `orden`)
    return setDoc(ref, categoria, { merge: true });
  }

  deleteCategoria(barId: string, id: string) {
    const ref = doc(this.firestore, `bares/${barId}/categorias/${id}`);
    return deleteDoc(ref);
  }

  // --- PRODUCTOS ---
  getProductos(barId: string): Observable<Producto[]> {
    const key = `productos-${barId}`;
    const ref = collection(this.firestore, `bares/${barId}/productos`);
    return this.getCachedObservable(key, collectionData(ref, { idField: 'id' })) as Observable<Producto[]>;
  }

  addProducto(barId: string, producto: Omit<Producto, 'id'>) {
    const ref = collection(this.firestore, `bares/${barId}/productos`);
    return addDoc(ref, producto);
  }

  updateProducto(barId: string, producto: Producto) {
    const ref = doc(this.firestore, `bares/${barId}/productos/${producto.id}`);
    // Use merge to avoid overwriting translation fields when they're not provided
    return setDoc(ref, producto, { merge: true });
  }

  deleteProducto(barId: string, id: string) {
    const ref = doc(this.firestore, `bares/${barId}/productos/${id}`);
    return deleteDoc(ref);
  }

  // --- COMANDAS ---
  getComandas(barId: string): Observable<any[]> {
    const key = `comandas-${barId}`;
    const ref = collection(this.firestore, `bares/${barId}/comandas`);
    return this.getCachedObservable(key, collectionData(ref, { idField: 'id' })) as Observable<any[]>;
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
    const key = `usuarios-${barId}`;
    const ref = collection(this.firestore, `bares/${barId}/usuarios`);
    return this.getCachedObservable(key, collectionData(ref, { idField: 'id' })) as Observable<any[]>;
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
      trialStart: data.trialStart,
      // Guardar el idioma predeterminado del bar si viene en los datos
      defaultLanguage: (data as any).defaultLanguage || 'es',
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
    const key = `historial-${barId}`;
    const ref = collection(this.firestore, `bares/${barId}/historial`);
    const q = query(ref, orderBy('fecha', 'desc'));
    return this.getCachedObservable(key, collectionData(q, { idField: 'id' }));
  }

  // Devuelve el historial de pedidos filtrado por fecha y mesa
  // NOTE: This usually changes filters a lot, so maybe caching is less effective
  // but if frequently called with same filters, it could be useful.
  // For now, simpler to NOT cache parameterized queries or use a complex key.
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

  // Guarda el nombre del producto/plan de la suscripción en el documento del bar
  async setSubscriptionProductName(barId: string, productName: string) {
    const ref = doc(this.firestore, `bares/${barId}`);
    try {
      await updateDoc(ref, { subscriptionProductName: productName });
    } catch (e) {
      // Si update falla (p. ej. doc no existe), usar setDoc con merge
      await setDoc(
        ref,
        { subscriptionProductName: productName },
        { merge: true }
      );
    }
  }
  // --- PROMOTIONS ---
  getPromotions(barId: string): Observable<Promotion[]> {
    const key = `promotions-${barId}`;
    const ref = collection(this.firestore, `bares/${barId}/promotions`);
    return this.getCachedObservable(key, collectionData(ref, { idField: 'id' })) as Observable<Promotion[]>;
  }

  addPromotion(barId: string, promotion: Omit<Promotion, 'id'>) {
    const ref = collection(this.firestore, `bares/${barId}/promotions`);
    return addDoc(ref, promotion);
  }

  updatePromotion(barId: string, promotion: Promotion) {
    const ref = doc(this.firestore, `bares/${barId}/promotions/${promotion.id}`);
    return setDoc(ref, promotion, { merge: true });
  }

  deletePromotion(barId: string, id: string) {
    const ref = doc(this.firestore, `bares/${barId}/promotions/${id}`);
    return deleteDoc(ref);
  }
  // --- COMANDEROS ---
  getComanderos(barId: string): Observable<Comandero[]> {
    const key = `comanderos-${barId}`;
    const ref = collection(this.firestore, `bares/${barId}/comanderos`);
    const q = query(ref, orderBy('numero', 'asc'));
    return this.getCachedObservable(key, collectionData(q, { idField: 'id' })) as Observable<Comandero[]>;
  }

  addComandero(barId: string, comandero: Omit<Comandero, 'id'>) {
    const ref = collection(this.firestore, `bares/${barId}/comanderos`);
    return addDoc(ref, comandero);
  }

  updateComandero(barId: string, comandero: Comandero) {
    const ref = doc(this.firestore, `bares/${barId}/comanderos/${comandero.id}`);
    return setDoc(ref, comandero, { merge: true });
  }

  deleteComandero(barId: string, id: string) {
    const ref = doc(this.firestore, `bares/${barId}/comanderos/${id}`);
    return deleteDoc(ref);
  }
}
