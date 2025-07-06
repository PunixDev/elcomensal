import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private apiUrl = 'https://traduccionbackend.onrender.com/translate';
  private idiomas = [
    { code: 'en', name: 'Inglés' },
    { code: 'fr', name: 'Francés' },
    { code: 'de', name: 'Alemán' },
    { code: 'it', name: 'Italiano' },
    // No incluyas 'es' porque ya tienes el original
  ];

  constructor(private http: HttpClient) {}

  traducirATodos(texto: string, source: string = 'es'): Observable<any[]> {
    const peticiones = this.idiomas.map((idioma) =>
      this.http.post<any>(this.apiUrl, {
        text: texto,
        source,
        target: idioma.code,
      })
    );
    return forkJoin(peticiones);
  }
}
