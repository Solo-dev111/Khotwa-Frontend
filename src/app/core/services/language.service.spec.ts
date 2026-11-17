import { TestBed } from '@angular/core/testing';
import { LanguageService } from './language.service';

describe('LanguageService currency formatting', () => {
  let language: LanguageService;

  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: { getItem: () => null, setItem: () => undefined }
    });
    TestBed.configureTestingModule({ providers: [LanguageService] });
    language = TestBed.inject(LanguageService);
  });

  it('formats Yemeni rials in Arabic without converting the stored value', () => {
    language.setLanguage('ar');
    expect(language.formatCurrency(10000)).toBe('10,000 ر.ي');
  });

  it('formats Yemeni rials in English without converting the stored value', () => {
    language.setLanguage('en');
    expect(language.formatCurrency(10000)).toBe('10,000 YER');
  });
});
