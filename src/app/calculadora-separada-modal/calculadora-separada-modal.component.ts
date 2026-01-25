import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonCheckbox,
  IonFooter,
  ModalController
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';

interface GroupedItem {
  id: string; // aggregated ID (productID + options)
  nombre: string;
  opciones: string[];
  precio: number;
  totalQty: number;
  selectedQty: number;
}

@Component({
  selector: 'app-calculadora-separada-modal',
  templateUrl: './calculadora-separada-modal.component.html',
  styleUrls: ['./calculadora-separada-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonCheckbox,
    IonFooter,
    TranslateModule
  ]
})
export class CalculadoraSeparadaModalComponent implements OnInit {
  @Input() historial: any[] = [];
  @Input() productos: any[] = [];
  
  groupedItems: GroupedItem[] = [];
  totalSeleccionado: number = 0;

  constructor(private modalController: ModalController) {}

  ngOnInit() {
    this.groupItems();
  }

  groupItems() {
    const map = new Map<string, GroupedItem>();

    this.historial.forEach((comanda) => {
      if (comanda.items && Array.isArray(comanda.items)) {
        comanda.items.forEach((item: any) => {
          const qty = item.cantidad || 1;
          // Get price
          let price = item.precio;
          if (price === undefined && this.productos.length) {
             const p = this.productos.find(pr => pr.id === item.id);
             price = p ? p.precio : 0;
          }
          
          // Create a composite key based on Product ID and Options
          // Sort options to ensure consistency if order changes (though normally order is preserved)
          const options = item.opciones || [];
          const sortedOptions = [...options].sort().join('|');
          const key = `${item.id}::${sortedOptions}`;

          if (map.has(key)) {
            const existing = map.get(key)!;
            existing.totalQty += qty;
          } else {
            map.set(key, {
              id: key,
              nombre: item.nombre,
              opciones: options,
              precio: price || 0,
              totalQty: qty,
              selectedQty: 0
            });
          }
        });
      }
    });
    
    this.groupedItems = Array.from(map.values());
  }

  calcularTotal() {
    this.totalSeleccionado = this.groupedItems
      .reduce((sum, i) => sum + (i.precio * i.selectedQty), 0);
  }

  increment(item: GroupedItem) {
    if (item.selectedQty < item.totalQty) {
      item.selectedQty++;
      this.calcularTotal();
    }
  }

  decrement(item: GroupedItem) {
    if (item.selectedQty > 0) {
      item.selectedQty--;
      this.calcularTotal();
    }
  }

  cerrar() {
    this.modalController.dismiss();
  }
}
