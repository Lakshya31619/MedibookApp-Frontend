import { StatusBadgePipe, FormatTimePipe, FormatDatePipe } from './status.pipe';

describe('StatusBadgePipe', () => {
  let pipe: StatusBadgePipe;

  beforeEach(() => { pipe = new StatusBadgePipe(); });

  it('should transform PENDING to badge-pending', () => {
    expect(pipe.transform('PENDING')).toBe('badge-pending');
  });

  it('should transform APPROVED to badge-approved', () => {
    expect(pipe.transform('APPROVED')).toBe('badge-approved');
  });

  it('should transform REJECTED to badge-rejected', () => {
    expect(pipe.transform('REJECTED')).toBe('badge-rejected');
  });

  it('should transform SCHEDULED to badge-scheduled', () => {
    expect(pipe.transform('SCHEDULED')).toBe('badge-scheduled');
  });

  it('should transform COMPLETED to badge-completed', () => {
    expect(pipe.transform('COMPLETED')).toBe('badge-completed');
  });

  it('should transform CANCELLED to badge-cancelled', () => {
    expect(pipe.transform('CANCELLED')).toBe('badge-cancelled');
  });

  it('should transform NO_SHOW to badge-no-show', () => {
    expect(pipe.transform('NO_SHOW')).toBe('badge-no-show');
  });

  it('should fall back to badge-pending for unknown statuses', () => {
    expect(pipe.transform('UNKNOWN')).toBe('badge-pending');
    expect(pipe.transform('')).toBe('badge-pending');
    expect(pipe.transform('random')).toBe('badge-pending');
  });
});

describe('FormatTimePipe', () => {
  let pipe: FormatTimePipe;

  beforeEach(() => { pipe = new FormatTimePipe(); });

  it('should return empty string for falsy input', () => {
    expect(pipe.transform('')).toBe('');
  });

  it('should format midnight as 12:00 AM', () => {
    expect(pipe.transform('00:00')).toBe('12:00 AM');
  });

  it('should format noon as 12:00 PM', () => {
    expect(pipe.transform('12:00')).toBe('12:00 PM');
  });

  it('should format 09:05 as 9:05 AM', () => {
    expect(pipe.transform('09:05')).toBe('9:05 AM');
  });

  it('should format 13:30 as 1:30 PM', () => {
    expect(pipe.transform('13:30')).toBe('1:30 PM');
  });

  it('should format 23:59 as 11:59 PM', () => {
    expect(pipe.transform('23:59')).toBe('11:59 PM');
  });

  it('should pad single-digit minutes with a zero', () => {
    expect(pipe.transform('09:05')).toContain('05');
  });
});

describe('FormatDatePipe', () => {
  let pipe: FormatDatePipe;

  beforeEach(() => { pipe = new FormatDatePipe(); });

  it('should return empty string for falsy input', () => {
    expect(pipe.transform('')).toBe('');
  });

  it('should return a non-empty string for a valid date', () => {
    const result = pipe.transform('2026-06-01');
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });

  it('should include the year in the formatted output', () => {
    const result = pipe.transform('2026-06-01');
    expect(result).toContain('2026');
  });

  it('should produce different output for different dates', () => {
    const r1 = pipe.transform('2026-01-01');
    const r2 = pipe.transform('2026-12-31');
    expect(r1).not.toBe(r2);
  });
});