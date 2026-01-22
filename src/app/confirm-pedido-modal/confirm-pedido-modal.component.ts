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
  IonCol
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
    TranslateModule
  ]
})
export class ConfirmPedidoModalComponent implements OnInit {
  @Input() items: { nombre: string; cantidad: number; precio: number; opciones?: string[] }[] = [];
  @Input() total: number = 0;
  
  observaciones: string = '';

  constructor(private modalController: ModalController) {}

  ngOnInit() {}

  cancelar() {
    this.modalController.dismiss(null, 'cancel');
  }

  confirmar() {
    this.modalController.dismiss({
      confirm: true,
      observaciones: this.observaciones
    }, 'confirm');
  }
}
