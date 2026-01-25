import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { CalculadoraSeparadaModalComponent } from './calculadora-separada-modal.component';

describe('CalculadoraSeparadaModalComponent', () => {
  let component: CalculadoraSeparadaModalComponent;
  let fixture: ComponentFixture<CalculadoraSeparadaModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CalculadoraSeparadaModalComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(CalculadoraSeparadaModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
