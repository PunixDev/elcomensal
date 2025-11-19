import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AvisoLegalPage } from './aviso-legal.page';

describe('AvisoLegalPage', () => {
  let component: AvisoLegalPage;
  let fixture: ComponentFixture<AvisoLegalPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AvisoLegalPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
