import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FicharPage } from './fichar.page';

describe('FicharPage', () => {
  let component: FicharPage;
  let fixture: ComponentFixture<FicharPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(FicharPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
