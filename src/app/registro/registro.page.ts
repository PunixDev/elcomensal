import { Component } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonText,
  IonButtons,
  IonIcon,
  PopoverController,
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DataService } from '../data.service';
import { LanguageService } from '../language.service';
import { LanguageSelectorComponent } from '../language-selector.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.page.html',
  styleUrls: ['./registro.page.scss'],
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonText,
    IonButtons,
    IonIcon,
    CommonModule,
    FormsModule,
    TranslateModule,
  ],
})
export class RegistroPage {
  nombreBar = '';
  usuarioAdmin = '';
  password = '';
  correo = '';
  error = '';
  exito = '';

  constructor(
    private dataService: DataService,
    private router: Router,
    private languageService: LanguageService,
    private popoverController: PopoverController,
    private translate: TranslateService
  ) {}

  async registrarBar() {
    this.error = '';
    this.exito = '';
    if (
      !this.nombreBar ||
      !this.usuarioAdmin ||
      !this.password ||
      !this.correo
    ) {
      this.error = this.translate.instant('REGISTER.ERROR_FIELDS');
      return;
    }
    try {
      await this.dataService.registrarBar({
        nombre: this.nombreBar,
        usuario: this.usuarioAdmin,
        password: this.password,
        correo: this.correo,
      });
      this.exito = this.translate.instant('REGISTER.SUCCESS');
      setTimeout(() => this.router.navigate(['/login']), 2000);
    } catch (e) {
      this.error = this.translate.instant('REGISTER.ERROR');
    }
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
