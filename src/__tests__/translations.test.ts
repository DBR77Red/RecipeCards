/**
 * Verifies that every locale implements all keys defined in the Translations interface.
 * Catches missing translation keys at test time rather than at runtime.
 */
import { translations } from '../i18n/translations';
import type { Translations, Language } from '../i18n/translations';

// Pull the key list from the English locale (which is always complete by convention).
const ENGLISH_KEYS = Object.keys(translations.en) as (keyof Translations)[];
const LOCALES = Object.keys(translations) as Language[];

describe('translations completeness', () => {
  for (const locale of LOCALES) {
    describe(`locale: ${locale}`, () => {
      for (const key of ENGLISH_KEYS) {
        it(`has key "${key}"`, () => {
          expect(translations[locale]).toHaveProperty(key);
        });

        it(`"${key}" is not an empty string`, () => {
          const value = (translations[locale] as any)[key];
          if (typeof value === 'string') {
            expect(value.length).toBeGreaterThan(0);
          }
          // function values (e.g. previewReceiveCount) are allowed — no string check
        });
      }

      it('has no extra keys not in the Translations interface', () => {
        const localeKeys = Object.keys(translations[locale]);
        const extraKeys = localeKeys.filter(k => !ENGLISH_KEYS.includes(k as keyof Translations));
        expect(extraKeys).toHaveLength(0);
      });
    });
  }
});

describe('translation functions', () => {
  it('previewReceiveCount returns a non-empty string', () => {
    for (const locale of LOCALES) {
      const fn = translations[locale].previewReceiveCount;
      expect(typeof fn(1)).toBe('string');
      expect(fn(1).length).toBeGreaterThan(0);
      expect(fn(42).length).toBeGreaterThan(0);
    }
  });

  it('deleteDraftBody returns a non-empty string', () => {
    for (const locale of LOCALES) {
      const fn = translations[locale].deleteDraftBody;
      expect(typeof fn('My Recipe')).toBe('string');
      expect(fn('My Recipe').length).toBeGreaterThan(0);
    }
  });

  it('deleteBatchTitle returns a string containing the count', () => {
    for (const locale of LOCALES) {
      const fn = translations[locale].deleteBatchTitle;
      const result = fn(3);
      expect(typeof result).toBe('string');
      expect(result).toMatch(/3/);
    }
  });

  it('deckPosition returns a string containing current and total', () => {
    for (const locale of LOCALES) {
      const fn = translations[locale].deckPosition;
      const result = fn(2, 5);
      expect(typeof result).toBe('string');
      expect(result).toMatch(/2/);
      expect(result).toMatch(/5/);
    }
  });
});
