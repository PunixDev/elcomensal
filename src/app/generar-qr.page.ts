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
import { DataService } from './data.service';
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
  adminPrinterName: string = '';

  constructor(
    private router: Router,
    private popoverController: PopoverController,
    private languageService: LanguageService,
    private dataService: DataService
  ) {
    const usuario = localStorage.getItem('usuario');
    this.barId = usuario ? usuario : 'bar-demo';
    
    // Configuración del bar
    this.dataService.getBarConfig(this.barId).subscribe(config => {
      this.adminPrinterName = config?.adminPrinterName || '';
    });
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
        'https://api.qrserver.com/v1/create-qr-code/?size=500x500&format=svg&data=' +
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

  async imprimirQR(qr: { name: string; url: string }) {
    const html = `
      <html><head><title>Imprimir QR Mesa ${qr.name}</title>
      <style>
        @page { size: auto; margin: 0mm; }
        body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
        .container { text-align: center; border: 2px solid #1268be; padding: 40px; border-radius: 20px; width: 80%; max-width: 500px; }
        .title { color: #1268be; font-size: 3rem; margin-bottom: 20px; font-weight: bold; }
        .qr-img { width: 100%; height: auto; max-width: 400px; }
        .footer { color: #666; font-size: 1.2rem; margin-top: 20px; }
      </style>
      </head><body>
      <div class="container">
        <div class="title">Mesa ${qr.name}</div>
        <img src='${qr.url}' class="qr-img" /><br>
        <div class="footer">Escanee para ver nuestra carta</div>
      </div>
      </body></html>
    `;

    const electronAPI = (window as any).electronAPI;
    if (electronAPI && this.adminPrinterName) {
      try {
        await electronAPI.printToPrinter(html, this.adminPrinterName);
        console.log('QR printed via Native Bridge');
      } catch (e) {
        this.fallbackPrint(html, `QR Mesa ${qr.name}`);
      }
    } else {
      this.fallbackPrint(html, `QR Mesa ${qr.name}`);
    }
  }

  async imprimirTodos() {
    if (this.generatedQrs.length === 0) return;
    let content = `
      <html><head><title>Imprimir todos los QRs</title>
      <style>
        @page { size: A4; margin: 10mm; }
        body { font-family: sans-serif; margin: 0; display: flex; flex-wrap: wrap; justify-content: center; }
        .qr-container { 
          width: 45%; 
          margin: 15px; 
          padding: 20px; 
          border: 1px solid #1268be; 
          text-align: center; 
          page-break-inside: avoid;
          border-radius: 15px;
          box-sizing: border-box;
        }
        .qr-container h2 { margin: 0 0 10px 0; color: #1268be; font-size: 1.8rem; }
        .qr-container img { width: 100%; max-width: 250px; height: auto; }
        .qr-container p { font-size: 1rem; color: #666; margin-top: 10px; }
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

    content += `</body></html>`;

    const electronAPI = (window as any).electronAPI;
    if (electronAPI && this.adminPrinterName) {
      try {
        await electronAPI.printToPrinter(content, this.adminPrinterName);
        console.log('All QRs printed via Native Bridge');
      } catch (e) {
        this.fallbackPrint(content, 'Todos los QRs');
      }
    } else {
      this.fallbackPrint(content, 'Todos los QRs');
    }
  }

  fallbackPrint(html: string, title: string) {
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.write(`<script>window.onload = function() { window.print(); window.close(); }</script>`);
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
