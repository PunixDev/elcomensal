import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SobreNosotrosPage } from './sobre-nosotros.page';

describe('SobreNosotrosPage', () => {
  let component: SobreNosotrosPage;
  let fixture: ComponentFixture<SobreNosotrosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SobreNosotrosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
