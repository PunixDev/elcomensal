import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';

export interface Language {
  code: string;
  name: string;
  flag: string;
}

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  private currentLanguage = new BehaviorSubject<string>('es');
  public currentLanguage$ = this.currentLanguage.asObservable();

  public availableLanguages: Language[] = [
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
  ];

  constructor(private translate: TranslateService) {
    this.initializeLanguage();
  }

  private initializeLanguage() {
    // Get language from localStorage or use default
    const savedLanguage = localStorage.getItem('app-language') || 'es';
    this.setLanguage(savedLanguage);
  }

  setLanguage(languageCode: string) {
    if (this.availableLanguages.find((lang) => lang.code === languageCode)) {
      this.translate.use(languageCode);
      this.currentLanguage.next(languageCode);
      localStorage.setItem('app-language', languageCode);
    }
  }

  getCurrentLanguage(): string {
    return this.currentLanguage.value;
  }

  getLanguageFlag(code: string): string {
    const language = this.availableLanguages.find((lang) => lang.code === code);
    return language ? language.flag : '🇪🇸';
  }

  getLanguageName(code: string): string {
    const language = this.availableLanguages.find((lang) => lang.code === code);
    return language ? language.name : 'Español';
  }
}
