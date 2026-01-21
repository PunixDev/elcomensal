import { Component } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonButton,
  IonIcon,
  IonButtons,
} from '@ionic/angular/standalone';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { PopoverController } from '@ionic/angular';
import { LanguageSelectorComponent } from '../language-selector.component';
import { LanguageService } from '../language.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    IonButtons,
    CommonModule,
    TranslateModule,
    RouterLink,
  ],
  providers: [PopoverController],
})
export class HomePage {
  logoExists = true;

  constructor(
    private router: Router,
    private popoverController: PopoverController,
    private languageService: LanguageService
  ) {}

  goToLogin() {
    this.router.navigate(['/login']);
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
