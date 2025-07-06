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

    // Mock de categorías
    this.categorias = [
      { id: '1', nombre: 'Bebidas' },
      { id: '2', nombre: 'Comida' },
      { id: '3', nombre: 'Postres' },
      { id: '4', nombre: 'Aperitivos' },
    ];

    this.cargarEstadisticas();
    this.cargarRanking();
    this.cargarIngresos();
    this.cargarFranjas();
  }

  cambiarSeccion() {
    // Cargar datos de la sección activa al cambiar
    switch (this.seccionActiva) {
      case 'ventas':
        this.cargarEstadisticas();
        break;
      case 'ranking':
        this.cargarRanking();
        break;
      case 'ingresos':
        this.cargarIngresos();
        break;
      case 'franjas':
        this.cargarFranjas();
        break;
    }
  }

  async cargarEstadisticas() {
    this.cargando = true;
    // Aquí deberías obtener las ventas del dataService filtrando por fecha y productos seleccionados
    // Simulación:
    setTimeout(() => {
      let datos = [
        { id: '1', nombre: 'Café', cantidad: 42 },
        { id: '2', nombre: 'Tostada', cantidad: 31 },
        { id: '3', nombre: 'Zumo', cantidad: 18 },
      ];
      if (this.productosSeleccionados.length) {
        datos = datos.filter((d) => this.productosSeleccionados.includes(d.id));
      }
      this.ventasPorProducto = datos.map(({ nombre, cantidad }) => ({
        nombre,
        cantidad,
      }));
      this.cargando = false;
      this.renderChart();
    }, 1000);
  }

  renderChart() {
    // Usa Chart.js o similar para renderizar la gráfica
    // Este método se debe completar con la lógica real
    if ((window as any).Chart && this.ventasPorProducto.length) {
      const ctx = (
        document.getElementById('ventasChart') as HTMLCanvasElement
      )?.getContext('2d');
      if (!ctx) return;
      new (window as any).Chart(ctx, {
        type: 'bar',
        data: {
          labels: this.ventasPorProducto.map((v) => v.nombre),
          datasets: [
            {
              label: 'Unidades vendidas',
              data: this.ventasPorProducto.map((v) => v.cantidad),
              backgroundColor: '#E2725B',
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false },
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
    this.cargarEstadisticas();
  }
  setFechaFin(event: any) {
    const date = Array.isArray(event) ? event[0] : event;
    this.fechaFinDate = date;
    this.fechaFin = date.toISOString();
    this.showCalendarFin = false;
    this.cargarEstadisticas();
  }
  setFechaInicioMaterial(event: any) {
    this.fechaInicioDate = event.value;
    this.fechaInicio = event.value ? event.value.toISOString() : '';
    this.cargarEstadisticas();
  }
  setFechaFinMaterial(event: any) {
    this.fechaFinDate = event.value;
    this.fechaFin = event.value ? event.value.toISOString() : '';
    this.cargarEstadisticas();
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
    this.cargarRanking();
  }
  setFechaFin2Material(event: any) {
    this.fechaFin2Date = event.value;
    this.cargarRanking();
  }

  setFechaInicio3Material(event: any) {
    this.fechaInicio3Date = event.value;
    this.cargarIngresos();
  }
  setFechaFin3Material(event: any) {
    this.fechaFin3Date = event.value;
    this.cargarIngresos();
  }

  setFechaInicio4Material(event: any) {
    this.fechaInicio4Date = event.value;
    this.cargarFranjas();
  }
  setFechaFin4Material(event: any) {
    this.fechaFin4Date = event.value;
    this.cargarFranjas();
  }

  async cargarRanking() {
    this.cargandoRanking = true;
    // Mock de ranking de productos más vendidos
    setTimeout(() => {
      let rankingData = [
        { nombre: 'Café Americano', categoria: 'Bebidas', cantidad: 145 },
        { nombre: 'Hamburguesa Clásica', categoria: 'Comida', cantidad: 89 },
        { nombre: 'Coca Cola', categoria: 'Bebidas', cantidad: 76 },
        { nombre: 'Tarta de Chocolate', categoria: 'Postres', cantidad: 54 },
        { nombre: 'Patatas Fritas', categoria: 'Aperitivos', cantidad: 43 },
      ];

      // Filtrar por categorías si están seleccionadas
      if (this.categorias2Seleccionadas.length) {
        rankingData = rankingData.filter((item) =>
          this.categorias2Seleccionadas.includes(
            this.categorias.find((c) => c.nombre === item.categoria)?.id || ''
          )
        );
      }

      this.ranking = rankingData;
      this.cargandoRanking = false;
    }, 1000);
  }

  async cargarIngresos() {
    this.cargandoIngresos = true;
    // Mock de datos de ingresos
    setTimeout(() => {
      let ingresosData = [
        { fecha: '2025-06-19', ingresos: 1250.5, pedidos: 45 },
        { fecha: '2025-06-20', ingresos: 980.75, pedidos: 38 },
        { fecha: '2025-06-21', ingresos: 1450.25, pedidos: 52 },
        { fecha: '2025-06-22', ingresos: 1100.0, pedidos: 41 },
        { fecha: '2025-06-23', ingresos: 1680.9, pedidos: 61 },
        { fecha: '2025-06-24', ingresos: 1320.4, pedidos: 48 },
        { fecha: '2025-06-25', ingresos: 1550.8, pedidos: 55 },
      ];

      // Filtrar por categorías si están seleccionadas (simulación)
      if (this.categorias3Seleccionadas.length) {
        // En un caso real, aquí filtrarías los ingresos por categorías
        ingresosData = ingresosData.map((item) => ({
          ...item,
          ingresos: item.ingresos * 0.7, // Simular reducción por filtro
          pedidos: Math.floor(item.pedidos * 0.7),
        }));
      }

      this.ingresosPorPeriodo = ingresosData.map(({ fecha, ingresos }) => ({
        fecha,
        ingresos,
      }));
      this.ingresosTotales = ingresosData.reduce(
        (total, item) => total + item.ingresos,
        0
      );
      this.totalPedidos = ingresosData.reduce(
        (total, item) => total + item.pedidos,
        0
      );
      this.ticketMedio =
        this.totalPedidos > 0 ? this.ingresosTotales / this.totalPedidos : 0;

      this.cargandoIngresos = false;
      this.renderIngresosChart();
    }, 1000);
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
    // Mock de datos de franjas horarias
    setTimeout(() => {
      // Datos simulados: ventas por hora y día de la semana
      const dias = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
      const horas = Array.from(
        { length: 24 },
        (_, i) => `${i.toString().padStart(2, '0')}:00`
      );

      let franjasData: { hora: string; dia: string; ventas: number }[] = [];

      // Generar datos simulados
      dias.forEach((dia) => {
        horas.forEach((hora) => {
          let ventas = 0;
          const horaNum = parseInt(hora.split(':')[0]);

          // Simular patrones realistas de ventas
          if (dia === 'Sáb' || dia === 'Dom') {
            // Fines de semana: más actividad durante el día
            if (horaNum >= 10 && horaNum <= 23) {
              ventas = Math.floor(Math.random() * 30) + 10;
            } else {
              ventas = Math.floor(Math.random() * 5);
            }
          } else {
            // Días laborables: picos en desayuno, almuerzo y cena
            if (
              (horaNum >= 7 && horaNum <= 9) ||
              (horaNum >= 12 && horaNum <= 14) ||
              (horaNum >= 19 && horaNum <= 22)
            ) {
              ventas = Math.floor(Math.random() * 25) + 15;
            } else if (horaNum >= 15 && horaNum <= 18) {
              ventas = Math.floor(Math.random() * 15) + 5;
            } else {
              ventas = Math.floor(Math.random() * 8);
            }
          }

          franjasData.push({ hora, dia, ventas });
        });
      });

      // Filtrar por categorías si están seleccionadas (simulación)
      if (this.categorias4Seleccionadas.length) {
        franjasData = franjasData.map((item) => ({
          ...item,
          ventas: Math.floor(item.ventas * 0.8), // Simular reducción por filtro
        }));
      }

      this.ventasPorFranja = franjasData;

      // Calcular horas y días pico
      const ventasPorHora = horas.map((hora) => ({
        hora,
        total: franjasData
          .filter((f) => f.hora === hora)
          .reduce((sum, f) => sum + f.ventas, 0),
      }));

      const ventasPorDia = dias.map((dia) => ({
        dia,
        total: franjasData
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
    }, 1000);
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
}
