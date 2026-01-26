import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonInput,
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButtons,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonList,
  IonItem,
  IonThumbnail,
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { PopoverController } from '@ionic/angular';
import { LanguageService } from './language.service';
import { LanguageSelectorComponent } from './language-selector.component';

@Component({
  selector: 'app-generar-qr',
  templateUrl: './generar-qr.page.html',
  styleUrls: ['./generar-qr.page.scss'],
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonInput,
    IonButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButtons,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonList,
    IonItem,
    IonThumbnail,
    CommonModule,
    FormsModule,
    TranslateModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [PopoverController],
})
export class GenerarQrPage {
  selectedMode: 'single' | 'multiple' | 'range' = 'single';
  
  // Inputs
  mesa: string = '';
  multipleMesas: string = '';
  rangeStart: number = 1;
  rangeEnd: number = 10;

  // Results
  generatedQrs: Array<{ name: string; url: string; cardUrl: string }> = [];
  
  barId: string = '';

  constructor(
    private router: Router,
    private popoverController: PopoverController,
    private languageService: LanguageService
  ) {
    const usuario = localStorage.getItem('usuario');
    this.barId = usuario ? usuario : 'bar-demo';
  }

  goToAdmin() {
    this.router.navigate(['/admin']);
  }

  generarQR() {
    this.generatedQrs = [];
    let mesasToGenerate: string[] = [];

    if (this.selectedMode === 'single') {
      if (!this.mesa) return;
      mesasToGenerate.push(this.mesa);
    } else if (this.selectedMode === 'multiple') {
      if (!this.multipleMesas) return;
      mesasToGenerate = this.multipleMesas
        .split(',')
        .map((m) => m.trim())
        .filter((m) => m.length > 0);
    } else if (this.selectedMode === 'range') {
      if (this.rangeStart > this.rangeEnd) return;
      for (let i = this.rangeStart; i <= this.rangeEnd; i++) {
        mesasToGenerate.push(i.toString());
      }
    }

    mesasToGenerate.forEach((mesa) => {
      let publicOrigin = window.location.origin;
      // Si estamos en Electron (protocolo capacitor-electron), forzar la URL web real
      if (publicOrigin.startsWith('capacitor-electron')) {
        publicOrigin = 'https://elrestaurante.store';
      }
      
      const baseUrl =
        publicOrigin +
        '/carta/' +
        encodeURIComponent(this.barId) +
        '?mesa=' +
        encodeURIComponent(mesa);
      
      const qrUrl =
        'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' +
        encodeURIComponent(baseUrl);
      
      this.generatedQrs.push({
        name: mesa,
        url: qrUrl,
        cardUrl: baseUrl
      });
    });
  }

  descargarQR(qr: { name: string; url: string }) {
    const link = document.createElement('a');
    link.href = qr.url;
    link.download = `qr-mesa-${qr.name}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  imprimirQR(qr: { name: string; url: string }) {
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`
        <html><head><title>Imprimir QR Mesa ${qr.name}</title></head><body style='text-align:center; font-family: sans-serif; padding: 20px;'>
        <div style="border: 2px solid #eee; padding: 20px; border-radius: 15px; display: inline-block;">
          <h2 style="color: #1268be; margin-top: 0;">Mesa ${qr.name}</h2>
          <img src='${qr.url}' style='background:#fff; padding:10px; border: 1px solid #ddd; border-radius:8px; width: 250px; height: 250px;'/><br><br>
          <p style="color: #666; font-size: 0.9em;">Escanea para ver nuestra carta</p>
        </div>
        <script>window.onload = function() { window.print(); window.close(); }</script>
        </body></html>
      `);
      win.document.close();
    }
  }

  imprimirTodos() {
    if (this.generatedQrs.length === 0) return;
    const win = window.open('', '_blank');
    if (win) {
      let content = `
        <html><head><title>Imprimir todos los QRs</title>
        <style>
          body { font-family: sans-serif; padding: 10px; }
          .qr-container { 
            display: inline-block; 
            width: 30%; 
            margin: 1%; 
            padding: 15px; 
            border: 1px solid #eee; 
            text-align: center; 
            page-break-inside: avoid;
            border-radius: 10px;
          }
          .qr-container h2 { margin-top: 0; color: #1268be; font-size: 1.2em; }
          .qr-container img { width: 100%; max-width: 180px; }
          .qr-container p { font-size: 0.8em; color: #666; }
          @media print {
            .qr-container { border: 1px solid #ddd; }
          }
        </style>
        </head><body>
      `;

      this.generatedQrs.forEach((qr) => {
        content += `
          <div class="qr-container">
            <h2>Mesa ${qr.name}</h2>
            <img src='${qr.url}' />
            <p>Escanea para ver la carta</p>
          </div>
        `;
      });

      content += `
        <script>window.onload = function() { window.print(); window.close(); }</script>
        </body></html>
      `;
      win.document.write(content);
      win.document.close();
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
