import { describe, it, expect } from 'vitest';
import { formatZipCode, formatNipCode } from '../../../src/helpers/helpers';

describe('formatZipCode', () => {
  it('formats a 5-digit code as XX-XXX', () => {
    expect(formatZipCode('00001')).toBe('00-001');
  });

  it('strips non-digit characters before formatting', () => {
    expect(formatZipCode('00-001')).toBe('00-001');
  });

  it('returns an empty string for empty input', () => {
    expect(formatZipCode('')).toBe('');
  });
});

describe('formatNipCode', () => {
  it('formats a 10-digit NIP as XXX-XXX-XX-XX', () => {
    expect(formatNipCode('1234567890')).toBe('123-456-78-90');
  });

  it('returns partial formatting for shorter input', () => {
    expect(formatNipCode('123456')).toBe('123-456');
  });

  it('returns an empty string for empty input', () => {
    expect(formatNipCode('')).toBe('');
  });
});