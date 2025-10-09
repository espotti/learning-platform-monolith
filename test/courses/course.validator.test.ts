import { CourseValidator } from '../../src/utils/validation';

describe('CourseValidator', () => {
  describe('validateCreateCourse', () => {
    it('should validate valid course data', () => {
      const validData = {
        title: 'Introduction to TypeScript',
        description: 'Learn TypeScript from scratch',
        price_cents: 4999,
        instructor_id: 1
      };

      const result = CourseValidator.validateCreateCourse(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should fail when title is missing', () => {
      const invalidData = {
        description: 'Learn TypeScript from scratch',
        price_cents: 4999,
        instructor_id: 1
      };

      const result = CourseValidator.validateCreateCourse(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({ field: 'title', message: expect.any(String) });
    });

    it('should fail when title is empty', () => {
      const invalidData = {
        title: '',
        description: 'Learn TypeScript from scratch',
        price_cents: 4999,
        instructor_id: 1
      };

      const result = CourseValidator.validateCreateCourse(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({ field: 'title', message: 'Title is required and must be a string' });
    });

    it('should fail when title is too long', () => {
      const invalidData = {
        title: 'a'.repeat(256),
        description: 'Learn TypeScript from scratch',
        price_cents: 4999,
        instructor_id: 1
      };

      const result = CourseValidator.validateCreateCourse(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({ field: 'title', message: expect.stringContaining('255') });
    });

    it('should fail when description is not a string', () => {
      const invalidData = {
        title: 'Introduction to TypeScript',
        description: 123,
        price_cents: 4999,
        instructor_id: 1
      };

      const result = CourseValidator.validateCreateCourse(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({ field: 'description', message: 'Description must be a string' });
    });

    it('should fail when price is missing', () => {
      const invalidData = {
        title: 'Introduction to TypeScript',
        description: 'Learn TypeScript from scratch',
        instructor_id: 1
      };

      const result = CourseValidator.validateCreateCourse(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({ field: 'price_cents', message: 'Price is required' });
    });

    it('should fail when price is invalid', () => {
      const invalidData = {
        title: 'Introduction to TypeScript',
        description: 'Learn TypeScript from scratch',
        price_cents: 'invalid',
        instructor_id: 1
      };

      const result = CourseValidator.validateCreateCourse(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({ field: 'price_cents', message: expect.stringContaining('valid number') });
    });

    it('should fail when price is negative', () => {
      const invalidData = {
        title: 'Introduction to TypeScript',
        description: 'Learn TypeScript from scratch',
        price_cents: -100,
        instructor_id: 1
      };

      const result = CourseValidator.validateCreateCourse(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({ field: 'price_cents', message: expect.stringContaining('negative') });
    });

    it('should fail when instructor_id is invalid', () => {
      const invalidData = {
        title: 'Introduction to TypeScript',
        description: 'Learn TypeScript from scratch',
        price_cents: 4999,
        instructor_id: 'invalid'
      };

      const result = CourseValidator.validateCreateCourse(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({ field: 'instructor_id', message: expect.stringContaining('positive integer') });
    });

    it('should accept course without description', () => {
      const validData = {
        title: 'Introduction to TypeScript',
        price_cents: 4999,
        instructor_id: 1
      };

      const result = CourseValidator.validateCreateCourse(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  describe('validateUpdateCourse', () => {
    it('should validate valid partial update', () => {
      const validData = {
        title: 'Updated Title'
      };

      const result = CourseValidator.validateUpdateCourse(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should validate multiple field updates', () => {
      const validData = {
        title: 'Updated Title',
        description: 'Updated description',
        price_cents: 5999
      };

      const result = CourseValidator.validateUpdateCourse(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should fail when title is empty', () => {
      const invalidData = {
        title: ''
      };

      const result = CourseValidator.validateUpdateCourse(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({ field: 'title', message: 'Title cannot be empty' });
    });

    it('should fail when title is too long', () => {
      const invalidData = {
        title: 'a'.repeat(256)
      };

      const result = CourseValidator.validateUpdateCourse(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({ field: 'title', message: expect.stringContaining('255') });
    });

    it('should fail when price is invalid', () => {
      const invalidData = {
        price_cents: 'invalid'
      };

      const result = CourseValidator.validateUpdateCourse(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({ field: 'price_cents', message: expect.stringContaining('valid number') });
    });

    it('should fail when price is negative', () => {
      const invalidData = {
        price_cents: -100
      };

      const result = CourseValidator.validateUpdateCourse(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({ field: 'price_cents', message: expect.stringContaining('negative') });
    });

    it('should allow updating instructor_id', () => {
      const validData = {
        instructor_id: 5
      };

      const result = CourseValidator.validateUpdateCourse(validData);

      expect(result.isValid).toBe(true);
    });

    it('should validate empty update object', () => {
      const emptyData = {};

      const result = CourseValidator.validateUpdateCourse(emptyData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  describe('normalizePrice', () => {
    it('should handle number as cents', () => {
      expect(CourseValidator.normalizePrice(4999)).toBe(4999);
    });

    it('should convert number with decimals to cents', () => {
      expect(CourseValidator.normalizePrice(49.99)).toBe(4999);
    });

    it('should handle string as cents', () => {
      expect(CourseValidator.normalizePrice('4999')).toBe(4999);
    });

    it('should convert string with decimals to cents', () => {
      expect(CourseValidator.normalizePrice('49.99')).toBe(4999);
    });

    it('should return null for invalid string', () => {
      expect(CourseValidator.normalizePrice('invalid')).toBeNull();
    });

    it('should return null for null', () => {
      expect(CourseValidator.normalizePrice(null)).toBeNull();
    });

    it('should return null for undefined', () => {
      expect(CourseValidator.normalizePrice(undefined)).toBeNull();
    });

    it('should return null for NaN', () => {
      expect(CourseValidator.normalizePrice(NaN)).toBeNull();
    });

    it('should return null for Infinity', () => {
      expect(CourseValidator.normalizePrice(Infinity)).toBeNull();
    });

    it('should handle zero', () => {
      expect(CourseValidator.normalizePrice(0)).toBe(0);
    });

    it('should handle very small decimal', () => {
      expect(CourseValidator.normalizePrice(0.01)).toBe(1);
    });

    it('should round to nearest cent', () => {
      expect(CourseValidator.normalizePrice(49.995)).toBe(5000);
    });
  });

  describe('validatePagination', () => {
    it('should return default values when no params provided', () => {
      const result = CourseValidator.validatePagination({});

      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should validate valid page and limit', () => {
      const result = CourseValidator.validatePagination({ page: '2', limit: '20' });

      expect(result.page).toBe(2);
      expect(result.limit).toBe(20);
    });

    it('should clamp negative page to 1', () => {
      const result = CourseValidator.validatePagination({ page: '-5' });

      expect(result.page).toBe(1);
    });

    it('should clamp zero page to 1', () => {
      const result = CourseValidator.validatePagination({ page: '0' });

      expect(result.page).toBe(1);
    });

    it('should use default limit for limit above 100', () => {
      const result = CourseValidator.validatePagination({ limit: '150' });

      expect(result.limit).toBe(10);
    });

    it('should handle invalid string for page', () => {
      const result = CourseValidator.validatePagination({ page: 'invalid' });

      expect(result.page).toBe(1);
    });

    it('should handle invalid string for limit', () => {
      const result = CourseValidator.validatePagination({ limit: 'invalid' });

      expect(result.limit).toBe(10);
    });

    it('should handle number inputs', () => {
      const result = CourseValidator.validatePagination({ page: 3, limit: 25 } as any);

      expect(result.page).toBe(3);
      expect(result.limit).toBe(25);
    });

    it('should use default limit for negative limit', () => {
      const result = CourseValidator.validatePagination({ limit: '-10' });

      expect(result.limit).toBe(10);
    });
  });

  describe('sanitizeSearch', () => {
    it('should return valid search string', () => {
      const result = CourseValidator.sanitizeSearch('TypeScript Course');

      expect(result).toBe('TypeScript Course');
    });

    it('should trim whitespace', () => {
      const result = CourseValidator.sanitizeSearch('  TypeScript Course  ');

      expect(result).toBe('TypeScript Course');
    });

    it('should return undefined for empty input', () => {
      const result = CourseValidator.sanitizeSearch('');

      expect(result).toBeUndefined();
    });

    it('should return undefined for whitespace only', () => {
      const result = CourseValidator.sanitizeSearch('   ');

      expect(result).toBeUndefined();
    });

    it('should return undefined for non-string types', () => {
      expect(CourseValidator.sanitizeSearch(123 as any)).toBeUndefined();
      expect(CourseValidator.sanitizeSearch(null as any)).toBeUndefined();
      expect(CourseValidator.sanitizeSearch({} as any)).toBeUndefined();
    });

    it('should return undefined for undefined', () => {
      const result = CourseValidator.sanitizeSearch(undefined as any);

      expect(result).toBeUndefined();
    });

    it('should handle special characters', () => {
      const result = CourseValidator.sanitizeSearch('TypeScript & React!');

      expect(result).toBe('TypeScript & React!');
    });
  });
});
