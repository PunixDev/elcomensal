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
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonModal,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonDatetime,
  IonChip,
  AlertController,
  IonToggle,
  IonNote
} from '@ionic/angular/standalone';
import { DataService, Promotion, Producto } from '../../data.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-promotions',
  template: `
    <ion-header [translucent]="true">
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/admin"></ion-back-button>
        </ion-buttons>
        <ion-title>Promociones</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="openModal()">
            <ion-icon name="add" slot="start"></ion-icon>
            Nueva
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <ion-list>
        <ion-item *ngFor="let promo of promotions$ | async">
          <ion-label>
            <h2>{{ promo.name }}</h2>
            <p>{{ getTypeLabel(promo.type) }} | {{ getTimeRange(promo) }}</p>
            <p style="font-size: 0.8em; color: var(--ion-color-medium);">
              <span *ngFor="let day of promo.days">{{ getDayName(day) }} </span>
            </p>
          </ion-label>
          <ion-chip [color]="promo.active ? 'success' : 'medium'" slot="end">
            {{ promo.active ? 'Activa' : 'Inactiva' }}
          </ion-chip>
          <ion-button fill="clear" color="primary" (click)="openModal(promo)">
            <ion-icon name="create-outline"></ion-icon>
          </ion-button>
          <ion-button fill="clear" color="danger" (click)="deletePromotion(promo)">
            <ion-icon name="trash-outline"></ion-icon>
          </ion-button>
        </ion-item>
        
        <div *ngIf="(promotions$ | async)?.length === 0" class="empty-state">
            <ion-icon name="pricetags-outline"></ion-icon>
            <p>No hay promociones activas</p>
        </div>
      </ion-list>

      <ion-modal [isOpen]="isModalOpen" (didDismiss)="closeModal()">
        <ng-template>
          <ion-header>
            <ion-toolbar>
              <ion-title>{{ editingId ? 'Editar' : 'Nueva' }} Promoción</ion-title>
              <ion-buttons slot="end">
                <ion-button (click)="closeModal()">Cancelar</ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>
          <ion-content class="ion-padding">
            <ion-list>
              <ion-item>
                <ion-label position="stacked">Nombre (ej. Happy Hour)</ion-label>
                <ion-input [(ngModel)]="currentPromo.name" placeholder="Nombre de la promoción"></ion-input>
              </ion-item>
              
              <ion-item>
                <ion-label position="stacked">Tipo de Oferta</ion-label>
                <ion-select [(ngModel)]="currentPromo.type">
                  <ion-select-option value="2x1">2x1</ion-select-option>
                  <ion-select-option value="discount_percent">Descuento %</ion-select-option>
                </ion-select>
              </ion-item>

              <ion-item *ngIf="currentPromo.type === 'discount_percent'">
                <ion-label position="stacked">Porcentaje (%)</ion-label>
                <ion-input type="number" [(ngModel)]="currentPromo.value" placeholder="20"></ion-input>
              </ion-item>

              <ion-item>
                <ion-label position="stacked">Días activos</ion-label>
                <ion-select [(ngModel)]="currentPromo.days" multiple="true">
                  <ion-select-option [value]="1">Lunes</ion-select-option>
                  <ion-select-option [value]="2">Martes</ion-select-option>
                  <ion-select-option [value]="3">Miércoles</ion-select-option>
                  <ion-select-option [value]="4">Jueves</ion-select-option>
                  <ion-select-option [value]="5">Viernes</ion-select-option>
                  <ion-select-option [value]="6">Sábado</ion-select-option>
                  <ion-select-option [value]="0">Domingo</ion-select-option>
                </ion-select>
              </ion-item>

              <ion-item>
                <ion-label position="stacked">Hora Inicio</ion-label>
                <ion-input type="time" [(ngModel)]="currentPromo.startTime"></ion-input>
              </ion-item>

              <ion-item>
                <ion-label position="stacked">Hora Fin</ion-label>
                <ion-input type="time" [(ngModel)]="currentPromo.endTime"></ion-input>
              </ion-item>
              
              <ion-item>
                 <ion-label>Activa</ion-label>
                 <ion-toggle slot="end" [(ngModel)]="currentPromo.active"></ion-toggle>
              </ion-item>

              <ion-item>
                <ion-label position="stacked">Productos (Opcional)</ion-label>
                <ion-select [(ngModel)]="currentPromo.productIds" multiple="true" placeholder="Todos los productos">
                  <ion-select-option *ngFor="let prod of productos$ | async" [value]="prod.id">
                    {{ prod.nombre }}
                  </ion-select-option>
                </ion-select>
                <ion-note slot="helper">Si no seleccionas ninguno, se aplica a TODOS.</ion-note>
              </ion-item>

            </ion-list>
            
            <div class="ion-padding">
                <ion-button expand="block" (click)="savePromotion()" [disabled]="!isFormValid()">Guardar</ion-button>
            </div>
          </ion-content>
        </ng-template>
      </ion-modal>

    </ion-content>
  `,
  styles: [`
    .empty-state {
        text-align: center;
        margin-top: 50px;
        color: var(--ion-color-medium);
        
        ion-icon {
            font-size: 64px;
            margin-bottom: 20px;
        }
        p {
            font-size: 18px;
        }
    }
  `],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonList, IonItem, IonLabel, IonButton, IonIcon, CommonModule, FormsModule, IonModal, IonInput, IonSelect, IonSelectOption, IonChip, IonDatetime, IonToggle, IonNote]
})
export class PromotionsPage implements OnInit {
  barId: string;
  promotions$: Observable<Promotion[]>;
  productos$: Observable<Producto[]>; // Added products observable
  isModalOpen = false;
  editingId: string | null = null;
  
  currentPromo: Partial<Promotion> = {
    name: '',
    type: '2x1',
    value: 0,
    days: [],
    startTime: '00:00',
    endTime: '23:59',
    productIds: [],
    active: true
  };

  constructor(
      private dataService: DataService,
      private alertController: AlertController
  ) {
    this.barId = this.dataService.getBarId();
    this.promotions$ = this.dataService.getPromotions(this.barId);
    this.productos$ = this.dataService.getProductos(this.barId); // Initialize products
  }

  ngOnInit() {}

  openModal(promo?: Promotion) {
    if (promo) {
      this.editingId = promo.id;
      this.currentPromo = { ...promo };
      // Ensure specific fields like productIds are initialized if upgrading from old data
      if (!this.currentPromo.productIds) this.currentPromo.productIds = [];
    } else {
      this.editingId = null;
      this.currentPromo = {
        name: '',
        type: '2x1',
        value: 0,
        days: [0,1,2,3,4,5,6],
        startTime: '18:00',
        endTime: '20:00',
        productIds: [],
        active: true
      };
    }
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  async savePromotion() {
    if(!this.currentPromo.name) return;

    // Validate logic if needed
    
    try {
        if(this.editingId) {
            await this.dataService.updatePromotion(this.barId, { ...this.currentPromo, id: this.editingId } as Promotion);
        } else {
            await this.dataService.addPromotion(this.barId, this.currentPromo as Omit<Promotion, 'id'>);
        }
        this.closeModal();
    } catch (e) {
        console.error(e);
    }
  }

  async deletePromotion(promo: Promotion) {
      const alert = await this.alertController.create({
          header: 'Confirmar',
          message: '¿Estás seguro de eliminar esta promoción?',
          buttons: [
              { text: 'Cancelar', role: 'cancel' },
              { text: 'Eliminar', handler: () => this.dataService.deletePromotion(this.barId, promo.id) }
          ]
      });
      await alert.present();
  }

  getTypeLabel(type: string) {
      if(type === '2x1') return '2x1';
      if(type === 'discount_percent') return 'Descuento %';
      return type;
  }
  
  getTimeRange(promo: Promotion) {
      return `${promo.startTime} - ${promo.endTime}`;
  }

  getDayName(day: number) {
      const days = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
      return days[day];
  }

  isFormValid(): boolean {
    if (!this.currentPromo.name || !this.currentPromo.name.trim()) return false;
    if (!this.currentPromo.days || this.currentPromo.days.length === 0) return false;
    if (!this.currentPromo.startTime || !this.currentPromo.endTime) return false;
    
    if (this.currentPromo.type === 'discount_percent') {
        if (!this.currentPromo.value || this.currentPromo.value <= 0) return false;
    }
    
    return true;
  }
}
