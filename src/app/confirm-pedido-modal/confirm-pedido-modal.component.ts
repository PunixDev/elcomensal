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
  IonItem,
  IonLabel,
  IonList,
  IonTextarea,
  IonFooter,
  IonIcon,
  ModalController,
  IonRow,
  IonCol,
  IonInput
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-confirm-pedido-modal',
  templateUrl: './confirm-pedido-modal.component.html',
  styleUrls: ['./confirm-pedido-modal.component.scss'],
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
    IonItem,
    IonLabel,
    IonList,
    IonTextarea,
    IonFooter,
    IonIcon,
    IonRow,
    IonCol,
    IonInput,
    TranslateModule
  ]
})
export class ConfirmPedidoModalComponent implements OnInit {
  @Input() items: { nombre: string; cantidad: number; precio: number; opciones?: string[] }[] = [];
  @Input() total: number = 0;
  @Input() existingDiners: number | null = null;
  numeroComensales: number | null = null;
  
  observaciones: string = '';

  constructor(private modalController: ModalController) {}

  ngOnInit() {
    // If we have existing diners, we don't need to ask again.
    // If it's null, the template will show the input.
  }

  cancelar() {
    this.modalController.dismiss(null, 'cancel');
  }

  confirmar() {
    // Validate diners if it's required (i.e., not previously set)
    if (this.existingDiners === null || this.existingDiners === undefined) {
      if (!this.numeroComensales || this.numeroComensales <= 0) {
        // You might want to show a toast or just return. 
        // For simplicity, we'll just not dismiss, or alert.
        // But since this is a modal, let's just use alert or visual feedback.
        // For now, let's assume valid input. 
        // Better: Disable the button if invalid? We'll do that in template.
        return; 
      }
    }

    this.modalController.dismiss({
      confirm: true,
      observaciones: this.observaciones,
      numeroComensales: this.numeroComensales
    }, 'confirm');
  }
}
