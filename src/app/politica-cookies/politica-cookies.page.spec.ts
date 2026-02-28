import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PoliticaCookiesPage } from './politica-cookies.page';

describe('PoliticaCookiesPage', () => {
  let component: PoliticaCookiesPage;
  let fixture: ComponentFixture<PoliticaCookiesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PoliticaCookiesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
