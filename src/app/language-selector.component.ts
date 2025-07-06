import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  PopoverController,
} from '@ionic/angular/standalone';
import { LanguageService, Language } from './language.service';

@Component({
  selector: 'app-language-selector',
  standalone: true,
  imports: [CommonModule, IonList, IonItem, IonLabel, IonIcon],
  template: `
    <ion-list>
      <ion-item
        *ngFor="let language of languages"
        button
        (click)="selectLanguage(language.code)"
        [class.selected]="language.code === currentLanguage"
      >
        <ion-label>
          <div class="language-option">
            <span class="flag">{{ language.flag }}</span>
            <span class="name">{{ language.name }}</span>
          </div>
        </ion-label>
        <ion-icon
          *ngIf="language.code === currentLanguage"
          name="checkmark"
          slot="end"
          color="primary"
        >
        </ion-icon>
      </ion-item>
    </ion-list>
  `,
  styles: [
    `
      .language-option {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .flag {
        font-size: 20px;
      }

      .name {
        font-weight: 500;
      }

      .selected {
        --background: var(--ion-color-primary-tint);
        --color: var(--ion-color-primary-contrast);
      }

      ion-item {
        --padding-start: 16px;
        --padding-end: 16px;
      }
    `,
  ],
})
export class LanguageSelectorComponent implements OnInit {
  languages: Language[] = [];
  currentLanguage: string = 'es';

  constructor(
    private languageService: LanguageService,
    private popoverController: PopoverController
  ) {}

  ngOnInit() {
    this.languages = this.languageService.availableLanguages;
    this.currentLanguage = this.languageService.getCurrentLanguage();
  }

  selectLanguage(languageCode: string) {
    this.languageService.setLanguage(languageCode);
    this.popoverController.dismiss();
  }
}
