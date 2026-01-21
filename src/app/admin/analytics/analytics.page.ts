import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonIcon,
  IonButton,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  PopoverController,
} from '@ionic/angular/standalone';
import { DataService } from '../../data.service';
import { firstValueFrom, Observable } from 'rxjs';
import { LanguageService } from '../../language.service';
import { LanguageSelectorComponent } from '../../language-selector.component';
import { TranslateModule } from '@ngx-translate/core';

interface SalesMetric {
  name: string;
  value: number; // For revenue
  percentage: number;
  index: number;
}

interface ProductMetric {
  name: string;
  quantity: number;
  percentage: number;
}

@Component({
  selector: 'app-analytics',
  templateUrl: './analytics.page.html',
  styleUrls: ['./analytics.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonGrid,
    IonRow,
    IonCol,
    IonIcon,
    IonButton,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    CommonModule,
    FormsModule,
    TranslateModule,
  ],
})
export class AnalyticsPage implements OnInit {
  barId: string;
  
  // Data holder
  rawHistory: any[] = [];
  products: any[] = [];
  categories: any[] = [];

  // Metrics
  totalRevenue: number = 0;
  totalOrders: number = 0;
  averageTicket: number = 0;
  topHour: number | string = '-';

  // Charts data
  salesByCategory: SalesMetric[] = [];
  topProducts: ProductMetric[] = [];

  // Filter
  timeFilter: 'all' | 'month' | 'week' = 'all';

  constructor(
    private dataService: DataService,
    private languageService: LanguageService,
    private popoverController: PopoverController
  ) {
    this.barId = this.dataService.getBarId();
  }

  async ngOnInit() {
    await this.refreshData();
  }

  async refreshData() {
    try {
      const [history, productos, categorias] = await Promise.all([
        firstValueFrom(this.dataService.getHistorial(this.barId)),
        firstValueFrom(this.dataService.getProductos(this.barId)),
        firstValueFrom(this.dataService.getCategorias(this.barId))
      ]);

      this.rawHistory = history;
      this.products = productos;
      this.categories = categorias;

      this.calculateMetrics();
      
    } catch (error) {
      console.error('Error fetching analytics data', error);
    }
  }

  calculateMetrics() {
    if (!this.rawHistory || this.rawHistory.length === 0) {
      this.resetMetrics();
      return;
    }

    // Filter by date
    let filteredHistory = [...this.rawHistory];
    const now = new Date();
    
    if (this.timeFilter === 'month') {
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      filteredHistory = filteredHistory.filter(item => {
        const d = new Date(item.fecha || item.pagadoEn);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });
    } else if (this.timeFilter === 'week') {
      // Simple approximation for this week (last 7 days could be another option)
      // Getting start of week (Monday)
      // For simplicity, let's use "last 7 days" or reset to Monday? 
      // Let's do start of current week (Monday)
      const day = now.getDay() || 7; // Get current day number, converting Sun(0) to 7
      if(day !== 1) now.setHours(-24 * (day - 1)); // Set to prev Monday
      else now.setHours(0,0,0,0);
      
      const startOfWeek = now.getTime();
      
      filteredHistory = filteredHistory.filter(item => {
        const d = new Date(item.fecha || item.pagadoEn).getTime();
        return d >= startOfWeek;
      });
    }

    // Calculate Summary stats
    this.totalRevenue = filteredHistory.reduce((acc, item) => acc + (item.total || 0), 0);
    this.totalOrders = filteredHistory.length;
    this.averageTicket = this.totalOrders > 0 ? this.totalRevenue / this.totalOrders : 0;

    // Calculate Top Hour
    const hoursCount: {[key: number]: number} = {};
    filteredHistory.forEach(item => {
        const d = new Date(item.fecha || item.pagadoEn);
        const hour = d.getHours();
        hoursCount[hour] = (hoursCount[hour] || 0) + 1;
    });
    
    let maxOrdersInHour = 0;
    let busiestHour = -1;
    Object.entries(hoursCount).forEach(([hour, count]) => {
        if(count > maxOrdersInHour) {
            maxOrdersInHour = count;
            busiestHour = parseInt(hour, 10);
        }
    });
    this.topHour = busiestHour >= 0 ? busiestHour : '-';


    // Calculate Sales By Category
    // Need to iterate items in orders
    const categoryRevenue: {[id: string]: number} = {};
    const productSales: {[id: string]: number} = {}; // id -> quantity

    filteredHistory.forEach(order => {
        // Handle 'resumen_mesa' structure which has 'pedidos' array
        if(order.tipo === 'resumen_mesa' && order.pedidos) {
             order.pedidos.forEach((pedido: any) => {
                 this.processOrderItems(pedido.items, categoryRevenue, productSales);
             });
        }
        // Handle legacy or direct orders if any (future proofing)
        else if(order.items) {
             this.processOrderItems(order.items, categoryRevenue, productSales);
        }
    });

    // Prepare Category Data
    let totalCatRevenue = 0;
    this.salesByCategory = this.categories.map((cat, idx) => {
        const val = categoryRevenue[cat.id] || 0;
        totalCatRevenue += val;
        return {
            name: cat.nombre,
            value: val,
            percentage: 0,
            index: idx
        };
    }).sort((a,b) => b.value - a.value);

    // Calc percentages
    if(totalCatRevenue > 0) {
        this.salesByCategory.forEach(c => c.percentage = (c.value / totalCatRevenue) * 100);
    }
    
    // Remove empty categories from chart to clean up
    this.salesByCategory = this.salesByCategory.filter(c => c.value > 0);


    // Prepare Top Products Data
    // Map IDs to Names
    let maxQty = 0;
    const prodArray = Object.entries(productSales).map(([id, qty]) => {
        const prod = this.products.find(p => p.id === id);
        if(qty > maxQty) maxQty = qty;
        return {
            name: prod ? prod.nombre : 'Desconocido',
            quantity: qty,
            percentage: 0
        };
    }).sort((a,b) => b.quantity - a.quantity).slice(0, 10); // Top 10

    if(maxQty > 0) {
        prodArray.forEach(p => p.percentage = (p.quantity / maxQty) * 100);
    }

    this.topProducts = prodArray;

  }

  processOrderItems(items: any[], categoryRevenue: any, productSales: any) {
      if(!items) return;
      items.forEach(item => {
          const product = this.products.find(p => p.id === item.id);
          if(product) {
              // Add to category
              const catId = product.categoria;
              const price = product.precio * item.cantidad;
              categoryRevenue[catId] = (categoryRevenue[catId] || 0) + price;

              // Add to product sales
              productSales[item.id] = (productSales[item.id] || 0) + item.cantidad;
          }
      });
  }

  resetMetrics() {
      this.totalRevenue = 0;
      this.totalOrders = 0;
      this.averageTicket = 0;
      this.topHour = '-';
      this.salesByCategory = [];
      this.topProducts = [];
  }

  getColor(index: number): string {
    const colors = [
      '#3880ff', // primary
      '#2dd36f', // success
      '#ffc409', // warning
      '#eb445a', // danger
      '#5260ff', // tertiary
      '#92949c', // medium
      '#222428', // dark
    ];
    return colors[index % colors.length];
  }

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
      showBackdrop: true,
      backdropDismiss: true,
    });
    return await popover.present();
  }
}
