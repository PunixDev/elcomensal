import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonGrid,
  IonRow,
  IonCol,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonText,
  IonButtons,
  IonIcon,
  PopoverController,
} from '@ionic/angular/standalone';
import { Router, RouterModule } from '@angular/router';
import { DataService } from '../data.service';
import { LanguageService } from '../language.service';
import { LanguageSelectorComponent } from '../language-selector.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonGrid,
    IonRow,
    IonCol,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonText,
    IonButtons,
    IonIcon,
    CommonModule,
    FormsModule,
    RouterModule,
    TranslateModule,
  ],
})
export class LoginPage implements OnInit {
  usuario = '';
  password = '';
  error = '';
  loading = false;

  constructor(
    private router: Router,
    private dataService: DataService,
    private languageService: LanguageService,
    private popoverController: PopoverController,
    private translate: TranslateService
  ) {}

  ngOnInit() {}

  async login() {
    this.error = '';
    this.loading = true;
    try {
      const result = await this.dataService.loginMultiBar(
        this.usuario,
        this.password
      );
      if (result) {
        console.log('Correo del usuario:', result.usuario.correo);
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('usuario', result.barId); // Guardar barId real
        localStorage.setItem('correo', result.usuario.correo);
        // Obtener y guardar trialStart
        this.dataService.getTrialStart(result.barId).subscribe((data: any) => {
          const trialStart = data?.trialStart || new Date().toISOString();
          localStorage.setItem('trialStart', trialStart);
        });
        this.router.navigate(['/admin']);
      } else {
        this.error = this.translate.instant('LOGIN.ERROR_INVALID');
      }
    } catch (e) {
      this.error = this.translate.instant('LOGIN.ERROR_CONNECTION');
    }
    this.loading = false;
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
