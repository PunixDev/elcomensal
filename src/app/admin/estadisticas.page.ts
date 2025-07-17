import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonLabel,
  IonItem,
  IonButton,
  IonSpinner,
  IonIcon,
  IonSelect,
  IonSelectOption,
  IonButtons,
  IonBackButton,
  IonSegment,
  IonSegmentButton,
  PopoverController,
} from '@ionic/angular/standalone';
import { DataService } from '../data.service';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageService } from '../language.service';
import { LanguageSelectorComponent } from '../language-selector.component';

@Component({
  selector: 'app-estadisticas',
  templateUrl: './estadisticas.page.html',
  styleUrls: ['./estadisticas.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonLabel,
    IonButton,
    IonSpinner,
    IonIcon,
    IonSelect,
    IonSelectOption,
    IonButtons,
    IonBackButton,
    IonSegment,
    IonSegmentButton,
    CommonModule,
    FormsModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
    TranslateModule,
  ],
})
export class EstadisticasPage implements OnInit {
  fechaInicio: string = '';
  fechaFin: string = '';
  cargando = false;
  ventasPorProducto: { nombre: string; cantidad: number }[] = [];
  productos: any[] = [];
  productosSeleccionados: string[] = [];
  barId: string;
  fechaInicioDate: Date = new Date();
  fechaFinDate: Date = new Date();
  showCalendarInicio = false;
  showCalendarFin = false;

  // Variables para el segundo contenedor
  fechaInicio2Date: Date = new Date();
  fechaFin2Date: Date = new Date();
  categorias2Seleccionadas: string[] = [];
  cargandoRanking = false;
  ranking: { nombre: string; categoria: string; cantidad: number }[] = [];
  categorias: any[] = [];
  categorias1Seleccionadas: string[] = [];
  seccionActiva: string = 'ventas'; // Controla qué sección se muestra
  // Variables para el tercer contenedor (Ingresos)
  fechaInicio3Date: Date = new Date();
  fechaFin3Date: Date = new Date();
  categorias3Seleccionadas: string[] = [];
  cargandoIngresos = false;
  ingresosPorPeriodo: { fecha: string; ingresos: number }[] = [];
  ingresosTotales: number = 0;
  ticketMedio: number = 0;
  totalPedidos: number = 0;

  // Variables para el cuarto contenedor (Franjas Horarias)
  fechaInicio4Date: Date = new Date();
  fechaFin4Date: Date = new Date();
  categorias4Seleccionadas: string[] = [];
  cargandoFranjas = false;
  ventasPorFranja: { hora: string; dia: string; ventas: number }[] = [];
  horasPico: string[] = [];
  diasPico: string[] = [];

  constructor(
    private dataService: DataService,
    private languageService: LanguageService,
    private popoverController: PopoverController
  ) {
    this.barId = this.dataService.getBarId();
  }

  ngOnInit() {
    // Por defecto, mostrar la última semana
    const hoy = new Date();
    const hace7 = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000);
    this.fechaInicio = hace7.toISOString();
    this.fechaFin = hoy.toISOString();
    // Inicializar fechas para el segundo contenedor
    this.fechaInicio2Date = new Date(hace7);
    this.fechaFin2Date = new Date(hoy);
    // Inicializar fechas para el tercer contenedor
    this.fechaInicio3Date = new Date(hace7);
    this.fechaFin3Date = new Date(hoy);
    // Inicializar fechas para el cuarto contenedor
    this.fechaInicio4Date = new Date(hace7);
    this.fechaFin4Date = new Date(hoy);

    this.dataService.getProductos(this.barId).subscribe((prods) => {
      this.productos = prods;
    });
    this.dataService.getCategorias(this.barId).subscribe((cats) => {
      this.categorias = cats;
    });
    // Quitar las llamadas automáticas a cargarEstadisticas, cargarRanking, cargarIngresos y cargarFranjas
  }

  cambiarSeccion() {
    // Limpiar datos al cambiar de sección
    switch (this.seccionActiva) {
      case 'ventas':
        this.ventasPorProducto = [];
        break;
      case 'ranking':
        this.ranking = [];
        break;
      case 'ingresos':
        this.ingresosPorPeriodo = [];
        this.ingresosTotales = 0;
        this.ticketMedio = 0;
        this.totalPedidos = 0;
        break;
      case 'franjas':
        this.ventasPorFranja = [];
        this.horasPico = [];
        this.diasPico = [];
        break;
    }
  }

  async cargarEstadisticas() {
    this.cargando = true;
    const fechaIni = this.fechaInicioDate;
    const fechaFin = this.fechaFinDate;
    const productosSeleccionados = this.productosSeleccionados;
    const categoriasSeleccionadas = this.categorias1Seleccionadas;
    const historial =
      (await this.dataService.getHistorial(this.barId).toPromise()) || [];
    // Filtrar por fecha
    const filtrados = historial.filter((h) => {
      const f = new Date(h['fecha']);
      return f >= fechaIni && f <= fechaFin;
    });
    // Agrupar ventas por producto
    let ventas: { [id: string]: { nombre: string; cantidad: number } } = {};
    for (const reg of filtrados) {
      for (const item of reg['items'] || []) {
        if (
          (productosSeleccionados.length === 0 ||
            productosSeleccionados.includes(item.id)) &&
          (categoriasSeleccionadas.length === 0 ||
            categoriasSeleccionadas.includes(item.categoria))
        ) {
          if (!ventas[item.id]) {
            ventas[item.id] = { nombre: item.nombre, cantidad: 0 };
          }
          ventas[item.id].cantidad += item.cantidad;
        }
      }
    }
    this.ventasPorProducto = Object.values(ventas);
    this.cargando = false;
    this.renderChart();
  }

  renderChart() {
    // Destruir gráfico anterior si existe
    if ((window as any).ventasChartInstance) {
      (window as any).ventasChartInstance.destroy();
    }

    if ((window as any).Chart && this.ventasPorProducto.length) {
      const ctx = (
        document.getElementById('ventasChart') as HTMLCanvasElement
      )?.getContext('2d');
      if (!ctx) return;

      (window as any).ventasChartInstance = new (window as any).Chart(ctx, {
        type: 'bar',
        data: {
          labels: this.ventasPorProducto.map((v) => v.nombre),
          datasets: [
            {
              label: 'Unidades vendidas',
              data: this.ventasPorProducto.map((v) => v.cantidad),
              backgroundColor: 'rgba(226, 114, 91, 0.8)',
              borderColor: '#E2725B',
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: true },
            title: {
              display: true,
              text: 'Ventas por producto',
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Cantidad vendida',
              },
            },
            x: {
              title: {
                display: true,
                text: 'Productos',
              },
            },
          },
        },
      });
    }
  }

  setFechaInicio(event: any) {
    const date = Array.isArray(event) ? event[0] : event;
    this.fechaInicioDate = date;
    this.fechaInicio = date.toISOString();
    this.showCalendarInicio = false;
    // Quitar carga automática
  }
  setFechaFin(event: any) {
    const date = Array.isArray(event) ? event[0] : event;
    this.fechaFinDate = date;
    this.fechaFin = date.toISOString();
    this.showCalendarFin = false;
    // Quitar carga automática
  }
  setFechaInicioMaterial(event: any) {
    this.fechaInicioDate = event.value;
    this.fechaInicio = event.value ? event.value.toISOString() : '';
    // Quitar carga automática
  }
  setFechaFinMaterial(event: any) {
    this.fechaFinDate = event.value;
    this.fechaFin = event.value ? event.value.toISOString() : '';
    // Quitar carga automática
  }
  // Formateador para mostrar la fecha en dd/MM/AAAA
  get fechaInicioFormateada(): string {
    return this.formatearFecha(this.fechaInicioDate);
  }
  get fechaFinFormateada(): string {
    return this.formatearFecha(this.fechaFinDate);
  }
  get fechaFin2Formateada(): string {
    return this.formatearFecha(this.fechaFin2Date);
  }
  get fechaInicio2Formateada(): string {
    return this.formatearFecha(this.fechaInicio2Date);
  }
  get fechaFin3Formateada(): string {
    return this.formatearFecha(this.fechaFin3Date);
  }
  get fechaInicio3Formateada(): string {
    return this.formatearFecha(this.fechaInicio3Date);
  }
  get fechaFin4Formateada(): string {
    return this.formatearFecha(this.fechaFin4Date);
  }
  get fechaInicio4Formateada(): string {
    return this.formatearFecha(this.fechaInicio4Date);
  }

  formatearFecha(date: Date): string {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  setFechaInicio2Material(event: any) {
    this.fechaInicio2Date = event.value;
    // Quitar carga automática
  }
  setFechaFin2Material(event: any) {
    this.fechaFin2Date = event.value;
    // Quitar carga automática
  }

  setFechaInicio3Material(event: any) {
    this.fechaInicio3Date = event.value;
    // Quitar carga automática
  }
  setFechaFin3Material(event: any) {
    this.fechaFin3Date = event.value;
    // Quitar carga automática
  }

  setFechaInicio4Material(event: any) {
    this.fechaInicio4Date = event.value;
    // Quitar carga automática
  }
  setFechaFin4Material(event: any) {
    this.fechaFin4Date = event.value;
    // Quitar carga automática
  }

  async cargarRanking() {
    this.cargandoRanking = true;
    const fechaIni = this.fechaInicio2Date;
    const fechaFin = this.fechaFin2Date;
    const categoriasSeleccionadas = this.categorias2Seleccionadas;
    const historial: any[] =
      (await this.dataService.getHistorial(this.barId).toPromise()) ?? [];
    // Filtrar por fecha
    const filtrados = historial.filter((h) => {
      const f = new Date(h.fecha);
      return f >= fechaIni && f <= fechaFin;
    });
    // Agrupar ventas por producto y categoría
    let ranking: {
      [id: string]: { nombre: string; categoria: string; cantidad: number };
    } = {};
    for (const reg of filtrados) {
      for (const item of reg.items || []) {
        if (
          categoriasSeleccionadas.length === 0 ||
          categoriasSeleccionadas.includes(item.categoria)
        ) {
          if (!ranking[item.id]) {
            ranking[item.id] = {
              nombre: item.nombre,
              categoria: item.categoria,
              cantidad: 0,
            };
          }
          ranking[item.id].cantidad += item.cantidad;
        }
      }
    }
    this.ranking = Object.values(ranking).sort(
      (a, b) => b.cantidad - a.cantidad
    );
    this.cargandoRanking = false;
  }

  async cargarIngresos() {
    this.cargandoIngresos = true;
    const fechaIni = this.fechaInicio3Date;
    const fechaFin = this.fechaFin3Date;
    const categoriasSeleccionadas = this.categorias3Seleccionadas;
    const historial: any[] =
      (await this.dataService.getHistorial(this.barId).toPromise()) ?? [];
    // Filtrar por fecha
    const filtrados = historial.filter((h) => {
      const f = new Date(h.fecha);
      return f >= fechaIni && f <= fechaFin;
    });
    // Agrupar ingresos por día
    let ingresosPorDia: {
      [fecha: string]: { ingresos: number; pedidos: number };
    } = {};
    for (const reg of filtrados) {
      const fecha = reg.fecha.split('T')[0];
      let total = 0;
      for (const item of reg.items || []) {
        if (
          categoriasSeleccionadas.length === 0 ||
          categoriasSeleccionadas.includes(item.categoria)
        ) {
          total += (item.precio || 0) * (item.cantidad || 1);
        }
      }
      if (!ingresosPorDia[fecha])
        ingresosPorDia[fecha] = { ingresos: 0, pedidos: 0 };
      ingresosPorDia[fecha].ingresos += total;
      ingresosPorDia[fecha].pedidos += 1;
    }
    this.ingresosPorPeriodo = Object.entries(ingresosPorDia).map(
      ([fecha, v]) => ({ fecha, ingresos: v.ingresos })
    );
    this.ingresosTotales = Object.values(ingresosPorDia).reduce(
      (acc, v) => acc + v.ingresos,
      0
    );
    this.totalPedidos = Object.values(ingresosPorDia).reduce(
      (acc, v) => acc + v.pedidos,
      0
    );
    this.ticketMedio =
      this.totalPedidos > 0 ? this.ingresosTotales / this.totalPedidos : 0;
    this.cargandoIngresos = false;
    this.renderIngresosChart();
  }

  renderIngresosChart() {
    // Renderizar gráfico de ingresos por fecha
    if ((window as any).Chart && this.ingresosPorPeriodo.length) {
      const ctx = (
        document.getElementById('ingresosChart') as HTMLCanvasElement
      )?.getContext('2d');
      if (!ctx) return;

      // Destruir gráfico anterior si existe
      if ((window as any).ingresosChartInstance) {
        (window as any).ingresosChartInstance.destroy();
      }

      (window as any).ingresosChartInstance = new (window as any).Chart(ctx, {
        type: 'line',
        data: {
          labels: this.ingresosPorPeriodo.map((v) => {
            const fecha = new Date(v.fecha);
            return fecha.toLocaleDateString('es-ES', {
              day: '2-digit',
              month: '2-digit',
            });
          }),
          datasets: [
            {
              label: 'Ingresos diarios (€)',
              data: this.ingresosPorPeriodo.map((v) => v.ingresos),
              backgroundColor: 'rgba(226, 114, 91, 0.2)',
              borderColor: '#E2725B',
              borderWidth: 2,
              fill: true,
              tension: 0.4,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: true },
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function (value: any) {
                  return value + '€';
                },
              },
            },
          },
        },
      });
    }
  }

  async cargarFranjas() {
    this.cargandoFranjas = true;
    const fechaIni = this.fechaInicio4Date;
    const fechaFin = this.fechaFin4Date;
    const categoriasSeleccionadas = this.categorias4Seleccionadas;
    const historial: any[] =
      (await this.dataService.getHistorial(this.barId).toPromise()) ?? [];
    // Filtrar por fecha
    const filtrados = historial.filter((h) => {
      const f = new Date(h.fecha);
      return f >= fechaIni && f <= fechaFin;
    });
    // Agrupar ventas por hora y día
    let franjas: {
      [key: string]: { hora: string; dia: string; ventas: number };
    } = {};
    for (const reg of filtrados) {
      const fecha = new Date(reg.fecha);
      const dia = fecha.toLocaleDateString('es-ES', { weekday: 'short' });
      const hora = fecha.getHours().toString().padStart(2, '0') + ':00';
      let total = 0;
      for (const item of reg.items || []) {
        if (
          categoriasSeleccionadas.length === 0 ||
          categoriasSeleccionadas.includes(item.categoria)
        ) {
          total += item.cantidad;
        }
      }
      const key = `${hora}-${dia}`;
      if (!franjas[key]) franjas[key] = { hora, dia, ventas: 0 };
      franjas[key].ventas += total;
    }
    this.ventasPorFranja = Object.values(franjas);
    // Calcular horas y días pico
    const horas = Array.from(new Set(this.ventasPorFranja.map((f) => f.hora)));
    const dias = Array.from(new Set(this.ventasPorFranja.map((f) => f.dia)));
    const ventasPorHora = horas.map((hora) => ({
      hora,
      total: this.ventasPorFranja
        .filter((f) => f.hora === hora)
        .reduce((sum, f) => sum + f.ventas, 0),
    }));
    const ventasPorDia = dias.map((dia) => ({
      dia,
      total: this.ventasPorFranja
        .filter((f) => f.dia === dia)
        .reduce((sum, f) => sum + f.ventas, 0),
    }));
    this.horasPico = ventasPorHora
      .sort((a, b) => b.total - a.total)
      .slice(0, 3)
      .map((h) => h.hora);
    this.diasPico = ventasPorDia
      .sort((a, b) => b.total - a.total)
      .slice(0, 3)
      .map((d) => d.dia);
    this.cargandoFranjas = false;
    this.renderFranjasChart();
  }

  renderFranjasChart() {
    // Renderizar mapa de calor de franjas horarias
    if ((window as any).Chart && this.ventasPorFranja.length) {
      const ctx = (
        document.getElementById('franjasChart') as HTMLCanvasElement
      )?.getContext('2d');
      if (!ctx) return;

      // Destruir gráfico anterior si existe
      if ((window as any).franjasChartInstance) {
        (window as any).franjasChartInstance.destroy();
      }

      const dias = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
      const horas = Array.from(
        { length: 24 },
        (_, i) => `${i.toString().padStart(2, '0')}:00`
      );

      // Preparar datos para el gráfico de barras agrupadas por hora
      const ventasPorHora = horas.map((hora) => {
        return this.ventasPorFranja
          .filter((f) => f.hora === hora)
          .reduce((sum, f) => sum + f.ventas, 0);
      });

      (window as any).franjasChartInstance = new (window as any).Chart(ctx, {
        type: 'bar',
        data: {
          labels: horas,
          datasets: [
            {
              label: 'Ventas por hora',
              data: ventasPorHora,
              backgroundColor: 'rgba(226, 114, 91, 0.8)',
              borderColor: '#E2725B',
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: true },
            title: {
              display: true,
              text: 'Distribución de ventas por hora del día',
            },
          },
          scales: {
            x: {
              title: {
                display: true,
                text: 'Hora del día',
              },
            },
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Número de ventas',
              },
            },
          },
        },
      });
    }
  }

  getVentasPorFranja(hora: string, dia: string): number {
    const venta = this.ventasPorFranja.find(
      (v) => v.hora === hora && v.dia === dia
    );
    return venta ? venta.ventas : 0;
  }

  // Métodos para el selector de idioma
  getCurrentLanguageFlag(): string {
    return this.languageService.getLanguageFlag(
      this.languageService.getCurrentLanguage()
    );
  }

  async presentLanguagePopover(event: any) {
    const popover = await this.popoverController.create({
      component: LanguageSelectorComponent,
      event: event,
      translucent: true,
      cssClass: 'language-popover',
    });
    return await popover.present();
  }

  // Métodos de ayuda para estadísticas
  getTotalVentasProductos(): number {
    return this.ventasPorProducto.reduce((total, v) => total + v.cantidad, 0);
  }

  getProductoMasVendido(): string {
    if (this.ventasPorProducto.length === 0) return 'N/A';
    const masVendido = this.ventasPorProducto.reduce((prev, current) =>
      prev.cantidad > current.cantidad ? prev : current
    );
    return masVendido.nombre;
  }

  getPromedioVentasDiarias(): number {
    if (this.ingresosPorPeriodo.length === 0) return 0;
    return this.ingresosTotales / this.ingresosPorPeriodo.length;
  }

  getDiaMasVentas(): string {
    if (this.diasPico.length === 0) return 'N/A';
    return this.diasPico[0];
  }

  getHoraMasVentas(): string {
    if (this.horasPico.length === 0) return 'N/A';
    return this.horasPico[0];
  }

  // Método para exportar datos (opcional para futuras mejoras)
  exportarDatos() {
    let datos = '';
    switch (this.seccionActiva) {
      case 'ventas':
        datos = JSON.stringify(this.ventasPorProducto, null, 2);
        break;
      case 'ranking':
        datos = JSON.stringify(this.ranking, null, 2);
        break;
      case 'ingresos':
        datos = JSON.stringify(
          {
            ingresosPorPeriodo: this.ingresosPorPeriodo,
            ingresosTotales: this.ingresosTotales,
            ticketMedio: this.ticketMedio,
            totalPedidos: this.totalPedidos,
          },
          null,
          2
        );
        break;
      case 'franjas':
        datos = JSON.stringify(
          {
            ventasPorFranja: this.ventasPorFranja,
            horasPico: this.horasPico,
            diasPico: this.diasPico,
          },
          null,
          2
        );
        break;
    }
    console.log('Datos de estadísticas:', datos);
  }
}
