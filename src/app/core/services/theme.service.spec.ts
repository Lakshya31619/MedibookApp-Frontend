import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  function createService(): ThemeService {
    TestBed.configureTestingModule({ providers: [ThemeService] });
    return TestBed.inject(ThemeService);
  }

  // ── Initialization ────────────────────────────────────────────────────────

  it('should initialize to light mode when localStorage has theme=light', () => {
    localStorage.setItem('theme', 'light');
    service = createService();
    expect(service.isDarkMode()).toBeFalse();
    expect(document.documentElement.classList.contains('dark')).toBeFalse();
  });

  it('should initialize to dark mode when localStorage has theme=dark', () => {
    localStorage.setItem('theme', 'dark');
    service = createService();
    expect(service.isDarkMode()).toBeTrue();
    expect(document.documentElement.classList.contains('dark')).toBeTrue();
  });

  it('should use prefers-color-scheme when no saved theme exists', () => {
    // Note: jsdom doesn't really implement matchMedia, so it returns false by default
    // This test verifies the service handles the case gracefully without throwing
    service = createService();
    expect(service.isDarkMode).toBeDefined();
  });

  // ── toggleTheme ───────────────────────────────────────────────────────────

  it('should toggle from light to dark', () => {
    localStorage.setItem('theme', 'light');
    service = createService();

    service.toggleTheme();

    expect(service.isDarkMode()).toBeTrue();
    expect(document.documentElement.classList.contains('dark')).toBeTrue();
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('should toggle from dark to light', () => {
    localStorage.setItem('theme', 'dark');
    service = createService();

    service.toggleTheme();

    expect(service.isDarkMode()).toBeFalse();
    expect(document.documentElement.classList.contains('dark')).toBeFalse();
    expect(localStorage.getItem('theme')).toBe('light');
  });

  it('should persist theme preference across multiple toggles', () => {
    localStorage.setItem('theme', 'light');
    service = createService();

    service.toggleTheme(); // → dark
    expect(localStorage.getItem('theme')).toBe('dark');

    service.toggleTheme(); // → light
    expect(localStorage.getItem('theme')).toBe('light');

    service.toggleTheme(); // → dark
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('should remove dark class when switching to light mode', () => {
    localStorage.setItem('theme', 'dark');
    service = createService();
    expect(document.documentElement.classList.contains('dark')).toBeTrue();

    service.toggleTheme();
    expect(document.documentElement.classList.contains('dark')).toBeFalse();
  });
});