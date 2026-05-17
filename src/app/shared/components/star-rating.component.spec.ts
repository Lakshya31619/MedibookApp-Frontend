import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StarRatingComponent } from './star-rating.component';

describe('StarRatingComponent', () => {
  let component: StarRatingComponent;
  let fixture: ComponentFixture<StarRatingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StarRatingComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(StarRatingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have 5 stars', () => {
    expect(component.stars).toEqual([1, 2, 3, 4, 5]);
  });

  // ── fillPercent ─────────────────────────────────────────────────────────

  it('fillPercent should return 100 for fully filled stars', () => {
    component.value = 4;
    expect(component.fillPercent(1)).toBe(100);
    expect(component.fillPercent(4)).toBe(100);
  });

  it('fillPercent should return 0 for empty stars', () => {
    component.value = 3;
    expect(component.fillPercent(4)).toBe(0);
    expect(component.fillPercent(5)).toBe(0);
  });

  it('fillPercent should return partial percent for fractional rating', () => {
    component.value = 3.5;
    expect(component.fillPercent(4)).toBe(50);
  });

  it('fillPercent should return 0 for value 0', () => {
    component.value = 0;
    expect(component.fillPercent(1)).toBe(0);
  });

  // ── starFill ─────────────────────────────────────────────────────────────

  it('starFill should return amber color for fully filled star', () => {
    component.value = 5;
    expect(component.starFill(1)).toBe('#f59e0b');
    expect(component.starFill(5)).toBe('#f59e0b');
  });

  it('starFill should return transparent for empty star', () => {
    component.value = 2;
    expect(component.starFill(3)).toBe('transparent');
    expect(component.starFill(5)).toBe('transparent');
  });

  it('starFill should return gradient url for partial star', () => {
    component.value = 3.7;
    const fill = component.starFill(4);
    expect(fill).toContain('url(#grad-');
  });

  // ── starStroke ────────────────────────────────────────────────────────────

  it('starStroke should return amber for filled stars', () => {
    component.value = 3;
    expect(component.starStroke(1)).toBe('#f59e0b');
    expect(component.starStroke(3)).toBe('#f59e0b');
  });

  it('starStroke should return gray for empty stars', () => {
    component.value = 2;
    expect(component.starStroke(3)).toBe('#d1d5db');
    expect(component.starStroke(5)).toBe('#d1d5db');
  });

  // ── display ───────────────────────────────────────────────────────────────

  it('display should return value when not interactive', () => {
    component.value = 3;
    component.interactive = false;
    component.hovered = 5;
    expect(component.display).toBe(3);
  });

  it('display should return hovered value when interactive and hovering', () => {
    component.value = 3;
    component.interactive = true;
    component.hovered = 5;
    expect(component.display).toBe(5);
  });

  it('display should return value when interactive but not hovering', () => {
    component.value = 3;
    component.interactive = true;
    component.hovered = 0;
    expect(component.display).toBe(3);
  });

  // ── onSelect ──────────────────────────────────────────────────────────────

  it('onSelect should emit the selected star number', () => {
    let emitted: number | undefined;
    component.valueChange.subscribe((v: number) => (emitted = v));
    component.onSelect(4);
    expect(emitted).toBe(4);
  });

  // ── showLabel ─────────────────────────────────────────────────────────────

  it('should render label when showLabel is true and value > 0', () => {
    component.value = 4.3;
    component.showLabel = true;
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('4.3');
  });

  it('should not render label when showLabel is false', () => {
    component.value = 4.3;
    component.showLabel = false;
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('4.3');
  });

  // ── count ─────────────────────────────────────────────────────────────────

  it('should render count when count is provided', () => {
    component.count = 42;
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('42');
  });

  it('should not render count when count is null', () => {
    component.count = null;
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('(');
  });

  // ── unique uid ────────────────────────────────────────────────────────────

  it('should generate a unique uid', () => {
    const c2 = new StarRatingComponent();
    expect(component.uid).not.toBe(c2.uid);
  });
});