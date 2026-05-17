import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ToastService] });
    service = TestBed.inject(ToastService);
  });

  // ── Initial state ─────────────────────────────────────────────────────────

  it('should start with empty toasts signal', () => {
    expect(service.toasts()).toEqual([]);
  });

  // ── show ──────────────────────────────────────────────────────────────────

  it('should add a toast when show() is called', () => {
    service.show('success', 'Operation successful');
    const toasts = service.toasts();
    expect(toasts.length).toBe(1);
    expect(toasts[0].type).toBe('success');
    expect(toasts[0].message).toBe('Operation successful');
    expect(toasts[0].id).toBeTruthy();
  });

  it('should assign default duration of 4000ms', () => {
    service.show('info', 'Info message');
    expect(service.toasts()[0].duration).toBe(4000);
  });

  it('should accept custom duration', () => {
    service.show('warning', 'Custom duration', 8000);
    expect(service.toasts()[0].duration).toBe(8000);
  });

  it('should auto-dismiss after the specified duration', fakeAsync(() => {
    service.show('success', 'Auto dismiss', 2000);
    expect(service.toasts().length).toBe(1);
    tick(2000);
    expect(service.toasts().length).toBe(0);
  }));

  it('should generate unique IDs for multiple toasts', () => {
    service.show('success', 'Toast A');
    service.show('error', 'Toast B');
    const [a, b] = service.toasts();
    expect(a.id).not.toBe(b.id);
  });

  it('should support multiple toasts simultaneously', () => {
    service.show('success', 'First');
    service.show('error', 'Second');
    service.show('info', 'Third');
    expect(service.toasts().length).toBe(3);
  });

  // ── dismiss ───────────────────────────────────────────────────────────────

  it('should remove a toast by id via dismiss()', () => {
    service.show('success', 'To be dismissed');
    const id = service.toasts()[0].id;
    service.dismiss(id);
    expect(service.toasts().length).toBe(0);
  });

  it('should not affect other toasts when dismissing one', () => {
    service.show('success', 'Keep me');
    service.show('error', 'Dismiss me');
    const [first, second] = service.toasts();
    service.dismiss(second.id);
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].id).toBe(first.id);
  });

  it('should do nothing when dismissing a non-existent id', () => {
    service.show('info', 'Existing toast');
    service.dismiss('non-existent-id');
    expect(service.toasts().length).toBe(1);
  });

  // ── success / error / info / warning helpers ──────────────────────────────

  it('success() should add a toast with type success', () => {
    service.success('Saved successfully');
    expect(service.toasts()[0].type).toBe('success');
    expect(service.toasts()[0].message).toBe('Saved successfully');
  });

  it('error() should add a toast with type error', () => {
    service.error('Something went wrong');
    expect(service.toasts()[0].type).toBe('error');
    expect(service.toasts()[0].message).toBe('Something went wrong');
  });

  it('info() should add a toast with type info', () => {
    service.info('Just so you know');
    expect(service.toasts()[0].type).toBe('info');
  });

  it('warning() should add a toast with type warning', () => {
    service.warning('Be careful');
    expect(service.toasts()[0].type).toBe('warning');
  });

  it('helper methods should accept custom duration', fakeAsync(() => {
    service.success('Fast', 1000);
    expect(service.toasts()[0].duration).toBe(1000);
    tick(1000);
    expect(service.toasts().length).toBe(0);
  }));

  // ── auto-dismiss timing ───────────────────────────────────────────────────

  it('should not dismiss before duration elapses', fakeAsync(() => {
    service.show('info', 'Still here', 3000);
    tick(2999);
    expect(service.toasts().length).toBe(1);
    tick(1);
    expect(service.toasts().length).toBe(0);
  }));

  it('should dismiss each toast independently based on its duration', fakeAsync(() => {
    service.show('success', 'Short', 1000);
    service.show('info', 'Long', 5000);
    tick(1000);
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].message).toBe('Long');
    tick(4000);
    expect(service.toasts().length).toBe(0);
  }));
});