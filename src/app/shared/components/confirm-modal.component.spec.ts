import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmModalComponent } from './confirm-modal.component';

describe('ConfirmModalComponent', () => {
  let component: ConfirmModalComponent;
  let fixture: ComponentFixture<ConfirmModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmModalComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(ConfirmModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not render content when open is false', () => {
    component.open = false;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.fixed')).toBeNull();
  });

  it('should render content when open is true', () => {
    component.open = true;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.fixed')).toBeTruthy();
  });

  it('should display title and message inputs', () => {
    component.open = true;
    component.title = 'Delete Record';
    component.message = 'This cannot be undone.';
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Delete Record');
    expect(text).toContain('This cannot be undone.');
  });

  it('should display custom confirm and cancel button text', () => {
    component.open = true;
    component.confirmText = 'Yes, delete';
    component.cancelText = 'No, keep';
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Yes, delete');
    expect(text).toContain('No, keep');
  });

  it('should emit confirmed with empty reason when onConfirm() called without requireReason', () => {
    let emitted: string | undefined;
    component.confirmed.subscribe((v: string) => (emitted = v));
    component.onConfirm();
    expect(emitted).toBe('');
  });

  it('should emit confirmed with reason string when onConfirm() called', () => {
    let emitted: string | undefined;
    component.confirmed.subscribe((v: string) => (emitted = v));
    component.reason = 'Patient no-show';
    component.onConfirm();
    expect(emitted).toBe('Patient no-show');
  });

  it('should clear reason after confirm', () => {
    component.reason = 'some reason';
    component.onConfirm();
    expect(component.reason).toBe('');
  });

  it('should emit cancelled when onCancel() called', () => {
    let emitted = false;
    component.cancelled.subscribe(() => (emitted = true));
    component.onCancel();
    expect(emitted).toBeTrue();
  });

  it('should clear reason after cancel', () => {
    component.reason = 'some reason';
    component.onCancel();
    expect(component.reason).toBe('');
  });

  it('should show reason textarea when requireReason is true', () => {
    component.open = true;
    component.requireReason = true;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('textarea')).toBeTruthy();
  });

  it('should not show reason textarea when requireReason is false', () => {
    component.open = true;
    component.requireReason = false;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('textarea')).toBeNull();
  });
});