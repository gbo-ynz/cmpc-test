import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';

// jsdom does not implement object URLs (used for image previews and downloads).
URL.createObjectURL = vi.fn(() => 'blob:preview');
URL.revokeObjectURL = vi.fn();
// Nor scrollIntoView (used by SuccessBanner); every real browser has it.
Element.prototype.scrollIntoView = vi.fn();

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.clearAllMocks();
});
