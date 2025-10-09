import { Request, Response } from 'express';
import { coursesController } from '../../src/controllers/courses.controller';
import { CoursesService } from '../../src/services/courses.service';
import { CourseValidator } from '../../src/utils/validation';

jest.mock('../../src/services/courses.service', () => ({
  CoursesService: {
    createCourse: jest.fn(),
    getCourseById: jest.fn(),
    updateCourse: jest.fn(),
    togglePublished: jest.fn(),
    listCourses: jest.fn(),
    canModifyCourse: jest.fn(),
    deleteCourse: jest.fn(),
    getCourseOverview: jest.fn()
  }
}));

jest.mock('../../src/utils/validation', () => ({
  CourseValidator: {
    validateCreateCourse: jest.fn(),
    validateUpdateCourse: jest.fn(),
    normalizePrice: jest.fn(),
    validatePagination: jest.fn(),
    sanitizeSearch: jest.fn()
  }
}));

const mockCoursesService = CoursesService as jest.Mocked<typeof CoursesService>;
const mockCourseValidator = CourseValidator as jest.Mocked<typeof CourseValidator>;

const mockRequest = (overrides: any = {}): Request => ({
  query: {},
  params: {},
  body: {},
  user: undefined,
  requestId: 'test-request-id-123',
  ...overrides
} as Request);

const mockResponse = (): Response => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('CoursesController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockCourseValidator.validatePagination.mockReturnValue({ page: 1, limit: 10 });
    mockCourseValidator.sanitizeSearch.mockReturnValue(undefined);
    mockCourseValidator.normalizePrice.mockImplementation((price: any) => {
      if (typeof price === 'number' && !isNaN(price) && isFinite(price)) {
        return Math.round(price < 100 ? price * 100 : price);
      }
      return null;
    });
    mockCourseValidator.validateCreateCourse.mockReturnValue({ isValid: true, errors: [] });
    mockCourseValidator.validateUpdateCourse.mockReturnValue({ isValid: true, errors: [] });
  });

  describe('index - GET /courses', () => {
    it('should return only published courses for public user', async () => {
      const req = mockRequest({ query: {} });
      const res = mockResponse();

      const mockCourses = [
        { id: 1, title: 'Course 1', published: true, instructor_id: 5, price_cents: 4999, created_at: new Date(), description: null },
        { id: 2, title: 'Course 2', published: true, instructor_id: 6, price_cents: 5999, created_at: new Date(), description: null }
      ];

      mockCoursesService.listCourses.mockResolvedValue({
        courses: mockCourses,
        pagination: { page: 1, limit: 10, total: 2, totalPages: 1 }
      });

      await coursesController.index(req, res);

      expect(mockCoursesService.listCourses).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        published_only: true
      });
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        ok: true,
        data: mockCourses,
        pagination: { page: 1, limit: 10, total: 2, totalPages: 1 }
      }));
    });

    it('should return only published courses for student', async () => {
      const req = mockRequest({
        query: {},
        user: { id: 3, email: 'student@test.com', role: 'student' }
      });
      const res = mockResponse();

      mockCoursesService.listCourses.mockResolvedValue({
        courses: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
      });

      await coursesController.index(req, res);

      expect(mockCoursesService.listCourses).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        published_only: true
      });
    });

    it('should return only own courses for instructor', async () => {
      const req = mockRequest({
        query: {},
        user: { id: 5, email: 'instructor@test.com', role: 'instructor' }
      });
      const res = mockResponse();

      mockCoursesService.listCourses.mockResolvedValue({
        courses: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
      });

      await coursesController.index(req, res);

      expect(mockCoursesService.listCourses).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        instructor_id: 5
      });
    });

    it('should return all courses for admin', async () => {
      const req = mockRequest({
        query: {},
        user: { id: 1, email: 'admin@test.com', role: 'admin' }
      });
      const res = mockResponse();

      mockCoursesService.listCourses.mockResolvedValue({
        courses: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
      });

      await coursesController.index(req, res);

      expect(mockCoursesService.listCourses).toHaveBeenCalledWith({
        page: 1,
        limit: 10
      });
    });

    it('should handle pagination parameters', async () => {
      const req = mockRequest({
        query: { page: '2', limit: '20' }
      });
      const res = mockResponse();

      mockCourseValidator.validatePagination.mockReturnValue({ page: 2, limit: 20 });
      mockCoursesService.listCourses.mockResolvedValue({
        courses: [],
        pagination: { page: 2, limit: 20, total: 0, totalPages: 0 }
      });

      await coursesController.index(req, res);

      expect(mockCourseValidator.validatePagination).toHaveBeenCalledWith({ page: '2', limit: '20' });
      expect(mockCoursesService.listCourses).toHaveBeenCalledWith({
        page: 2,
        limit: 20,
        published_only: true
      });
    });

    it('should handle search query', async () => {
      const req = mockRequest({
        query: { q: 'TypeScript' }
      });
      const res = mockResponse();

      mockCourseValidator.sanitizeSearch.mockReturnValue('TypeScript');
      mockCoursesService.listCourses.mockResolvedValue({
        courses: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
      });

      await coursesController.index(req, res);

      expect(mockCourseValidator.sanitizeSearch).toHaveBeenCalledWith('TypeScript');
      expect(mockCoursesService.listCourses).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        published_only: true,
        search: 'TypeScript'
      });
    });

    it('should handle service errors', async () => {
      const req = mockRequest({ query: {} });
      const res = mockResponse();

      mockCoursesService.listCourses.mockRejectedValue(new Error('Database error'));

      await coursesController.index(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        ok: false,
        error: expect.objectContaining({
          code: 'INTERNAL_ERROR'
        })
      }));
    });
  });

  describe('create - POST /courses', () => {
    it('should return 401 when user not authenticated', async () => {
      const req = mockRequest({ body: {} });
      const res = mockResponse();

      await coursesController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        ok: false,
        error: expect.objectContaining({
          code: 'UNAUTHORIZED'
        })
      }));
    });

    it('should create course for instructor with valid data', async () => {
      const courseData = {
        title: 'TypeScript Basics',
        description: 'Learn TypeScript',
        price_cents: '49.99'
      };
      const req = mockRequest({
        body: courseData,
        user: { id: 5, email: 'instructor@test.com', role: 'instructor' }
      });
      const res = mockResponse();

      mockCourseValidator.normalizePrice.mockReturnValue(4999);
      mockCourseValidator.validateCreateCourse.mockReturnValue({
        isValid: true,
        errors: []
      });

      const mockCreatedCourse = {
        id: 1,
        title: courseData.title,
        description: courseData.description,
        price_cents: 4999,
        instructor_id: 5,
        published: false,
        created_at: new Date()
      };

      mockCoursesService.createCourse.mockResolvedValue(mockCreatedCourse);

      await coursesController.create(req, res);

      expect(mockCourseValidator.normalizePrice).toHaveBeenCalledWith('49.99');
      expect(mockCourseValidator.validateCreateCourse).toHaveBeenCalled();
      expect(mockCoursesService.createCourse).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        ok: true,
        data: mockCreatedCourse
      }));
    });

    it('should create course for admin with instructor_id', async () => {
      const courseData = {
        title: 'TypeScript Basics',
        description: 'Learn TypeScript',
        price_cents: 4999,
        instructor_id: 10
      };
      const req = mockRequest({
        body: courseData,
        user: { id: 1, email: 'admin@test.com', role: 'admin' }
      });
      const res = mockResponse();

      mockCourseValidator.normalizePrice.mockReturnValue(4999);
      mockCourseValidator.validateCreateCourse.mockReturnValue({
        isValid: true,
        errors: []
      });

      mockCoursesService.createCourse.mockResolvedValue({
        id: 1,
        ...courseData,
        published: false,
        created_at: new Date()
      });

      await coursesController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should return 400 for validation errors', async () => {
      const req = mockRequest({
        body: { title: '' },
        user: { id: 5, email: 'instructor@test.com', role: 'instructor' }
      });
      const res = mockResponse();

      mockCourseValidator.normalizePrice.mockReturnValue(null);
      mockCourseValidator.validateCreateCourse.mockReturnValue({
        isValid: false,
        errors: [
          { field: 'title', message: 'Title cannot be empty' },
          { field: 'price_cents', message: 'Price is required' }
        ]
      });

      await coursesController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        ok: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR'
        })
      }));
    });

    it('should return 403 when service denies permission', async () => {
      const req = mockRequest({
        body: { title: 'Course', price_cents: 4999 },
        user: { id: 3, email: 'student@test.com', role: 'student' }
      });
      const res = mockResponse();

      mockCourseValidator.normalizePrice.mockReturnValue(4999);
      mockCourseValidator.validateCreateCourse.mockReturnValue({
        isValid: true,
        errors: []
      });

      mockCoursesService.createCourse.mockRejectedValue(
        new Error('Insufficient permissions to create course')
      );

      await coursesController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should handle service errors', async () => {
      const req = mockRequest({
        body: { title: 'Course', price_cents: 4999 },
        user: { id: 5, email: 'instructor@test.com', role: 'instructor' }
      });
      const res = mockResponse();

      mockCourseValidator.normalizePrice.mockReturnValue(4999);
      mockCourseValidator.validateCreateCourse.mockReturnValue({
        isValid: true,
        errors: []
      });

      mockCoursesService.createCourse.mockRejectedValue(new Error('Database error'));

      await coursesController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('show - GET /courses/:id', () => {
    it('should return 400 for invalid course ID', async () => {
      const req = mockRequest({ params: { id: 'invalid' } });
      const res = mockResponse();

      await coursesController.show(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        ok: false,
        error: expect.objectContaining({
          code: 'INVALID_ID'
        })
      }));
    });

    it('should return 404 when course not found', async () => {
      const req = mockRequest({ params: { id: '999' } });
      const res = mockResponse();

      mockCoursesService.getCourseById.mockResolvedValue(null);

      await coursesController.show(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        ok: false,
        error: expect.objectContaining({
          code: 'COURSE_NOT_FOUND'
        })
      }));
    });

    it('should return published course for public user', async () => {
      const req = mockRequest({ params: { id: '1' } });
      const res = mockResponse();

      const mockCourse = {
        id: 1,
        title: 'TypeScript Basics',
        published: true,
        instructor_id: 5,
        price_cents: 4999,
        created_at: new Date(),
        description: null
      };

      mockCoursesService.getCourseById.mockResolvedValue(mockCourse);

      await coursesController.show(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        ok: true,
        data: mockCourse
      }));
    });

    it('should return 404 for unpublished course to public user', async () => {
      const req = mockRequest({ params: { id: '1' } });
      const res = mockResponse();

      const mockCourse = {
        id: 1,
        title: 'TypeScript Basics',
        published: false,
        instructor_id: 5,
        price_cents: 4999,
        created_at: new Date(),
        description: null
      };

      mockCoursesService.getCourseById.mockResolvedValue(mockCourse);

      await coursesController.show(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 404 for unpublished course to student', async () => {
      const req = mockRequest({
        params: { id: '1' },
        user: { id: 3, email: 'student@test.com', role: 'student' }
      });
      const res = mockResponse();

      const mockCourse = {
        id: 1,
        title: 'TypeScript Basics',
        published: false,
        instructor_id: 5,
        price_cents: 4999,
        created_at: new Date(),
        description: null
      };

      mockCoursesService.getCourseById.mockResolvedValue(mockCourse);

      await coursesController.show(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 404 for unpublished course to other instructor', async () => {
      const req = mockRequest({
        params: { id: '1' },
        user: { id: 10, email: 'other@test.com', role: 'instructor' }
      });
      const res = mockResponse();

      const mockCourse = {
        id: 1,
        title: 'TypeScript Basics',
        published: false,
        instructor_id: 5,
        price_cents: 4999,
        created_at: new Date(),
        description: null
      };

      mockCoursesService.getCourseById.mockResolvedValue(mockCourse);

      await coursesController.show(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return unpublished course to owner instructor', async () => {
      const req = mockRequest({
        params: { id: '1' },
        user: { id: 5, email: 'instructor@test.com', role: 'instructor' }
      });
      const res = mockResponse();

      const mockCourse = {
        id: 1,
        title: 'TypeScript Basics',
        published: false,
        instructor_id: 5,
        price_cents: 4999,
        created_at: new Date(),
        description: null
      };

      mockCoursesService.getCourseById.mockResolvedValue(mockCourse);

      await coursesController.show(req, res);

      expect(res.json).toHaveBeenCalled();
    });

    it('should return unpublished course to admin', async () => {
      const req = mockRequest({
        params: { id: '1' },
        user: { id: 1, email: 'admin@test.com', role: 'admin' }
      });
      const res = mockResponse();

      const mockCourse = {
        id: 1,
        title: 'TypeScript Basics',
        published: false,
        instructor_id: 5,
        price_cents: 4999,
        created_at: new Date(),
        description: null
      };

      mockCoursesService.getCourseById.mockResolvedValue(mockCourse);

      await coursesController.show(req, res);

      expect(res.json).toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      const req = mockRequest({ params: { id: '1' } });
      const res = mockResponse();

      mockCoursesService.getCourseById.mockRejectedValue(new Error('Database error'));

      await coursesController.show(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('update - PUT /courses/:id', () => {
    it('should return 401 when user not authenticated', async () => {
      const req = mockRequest({ params: { id: '1' }, body: {} });
      const res = mockResponse();

      await coursesController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should return 400 for invalid course ID', async () => {
      const req = mockRequest({
        params: { id: 'invalid' },
        body: {},
        user: { id: 5, email: 'instructor@test.com', role: 'instructor' }
      });
      const res = mockResponse();

      await coursesController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 403 when user cannot modify course', async () => {
      const req = mockRequest({
        params: { id: '1' },
        body: { title: 'Updated Title' },
        user: { id: 5, email: 'instructor@test.com', role: 'instructor' }
      });
      const res = mockResponse();

      mockCourseValidator.normalizePrice.mockReturnValue(null);
      mockCoursesService.canModifyCourse.mockResolvedValue(false);

      await coursesController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should return 400 for validation errors', async () => {
      const req = mockRequest({
        params: { id: '1' },
        body: { title: '' },
        user: { id: 5, email: 'instructor@test.com', role: 'instructor' }
      });
      const res = mockResponse();

      mockCourseValidator.normalizePrice.mockReturnValue(null);
      mockCoursesService.canModifyCourse.mockResolvedValue(true);
      mockCourseValidator.validateUpdateCourse.mockReturnValue({
        isValid: false,
        errors: [{ field: 'title', message: 'Title cannot be empty' }]
      });

      await coursesController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should update course successfully for owner', async () => {
      const req = mockRequest({
        params: { id: '1' },
        body: { title: 'Updated Title' },
        user: { id: 5, email: 'instructor@test.com', role: 'instructor' }
      });
      const res = mockResponse();

      mockCourseValidator.normalizePrice.mockReturnValue(null);
      mockCoursesService.canModifyCourse.mockResolvedValue(true);
      mockCourseValidator.validateUpdateCourse.mockReturnValue({
        isValid: true,
        errors: []
      });

      const mockUpdatedCourse = {
        id: 1,
        title: 'Updated Title',
        instructor_id: 5,
        published: false,
        price_cents: 4999,
        created_at: new Date(),
        description: null
      };

      mockCoursesService.updateCourse.mockResolvedValue(mockUpdatedCourse);

      await coursesController.update(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        ok: true,
        data: mockUpdatedCourse
      }));
    });

    it('should allow admin to update instructor_id', async () => {
      const req = mockRequest({
        params: { id: '1' },
        body: { instructor_id: 10 },
        user: { id: 1, email: 'admin@test.com', role: 'admin' }
      });
      const res = mockResponse();

      mockCourseValidator.normalizePrice.mockReturnValue(null);
      mockCoursesService.canModifyCourse.mockResolvedValue(true);
      mockCourseValidator.validateUpdateCourse.mockReturnValue({
        isValid: true,
        errors: []
      });

      mockCoursesService.updateCourse.mockResolvedValue({
        id: 1,
        instructor_id: 10,
        title: 'Course',
        published: false,
        price_cents: 4999,
        created_at: new Date(),
        description: null
      });

      await coursesController.update(req, res);

      expect(res.json).toHaveBeenCalled();
    });

    it('should not allow instructor to update instructor_id', async () => {
      const req = mockRequest({
        params: { id: '1' },
        body: { title: 'Updated', instructor_id: 10 },
        user: { id: 5, email: 'instructor@test.com', role: 'instructor' }
      });
      const res = mockResponse();

      mockCourseValidator.normalizePrice.mockReturnValue(null);
      mockCoursesService.canModifyCourse.mockResolvedValue(true);
      mockCourseValidator.validateUpdateCourse.mockReturnValue({
        isValid: true,
        errors: []
      });

      mockCoursesService.updateCourse.mockResolvedValue({
        id: 1,
        title: 'Updated',
        instructor_id: 5,
        published: false,
        price_cents: 4999,
        created_at: new Date(),
        description: null
      });

      await coursesController.update(req, res);

      expect(mockCoursesService.updateCourse).toHaveBeenCalledWith(1, 
        expect.not.objectContaining({ instructor_id: expect.anything() })
      );
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        ok: true
      }));
    });

    it('should update description and convert empty string to null', async () => {
      const req = mockRequest({
        params: { id: '1' },
        body: { description: '   ' },
        user: { id: 5, email: 'instructor@test.com', role: 'instructor' }
      });
      const res = mockResponse();

      mockCourseValidator.normalizePrice.mockReturnValue(null);
      mockCoursesService.canModifyCourse.mockResolvedValue(true);
      mockCourseValidator.validateUpdateCourse.mockReturnValue({
        isValid: true,
        errors: []
      });

      mockCoursesService.updateCourse.mockResolvedValue({
        id: 1,
        title: 'Course',
        instructor_id: 5,
        published: false,
        price_cents: 4999,
        created_at: new Date(),
        description: null
      });

      await coursesController.update(req, res);

      expect(mockCoursesService.updateCourse).toHaveBeenCalledWith(1, 
        expect.objectContaining({ description: null })
      );
      expect(res.json).toHaveBeenCalled();
    });

    it('should update price_cents with normalization', async () => {
      const req = mockRequest({
        params: { id: '1' },
        body: { price_cents: '49.99' },
        user: { id: 5, email: 'instructor@test.com', role: 'instructor' }
      });
      const res = mockResponse();

      mockCourseValidator.normalizePrice.mockReturnValue(4999);
      mockCoursesService.canModifyCourse.mockResolvedValue(true);
      mockCourseValidator.validateUpdateCourse.mockReturnValue({
        isValid: true,
        errors: []
      });

      mockCoursesService.updateCourse.mockResolvedValue({
        id: 1,
        title: 'Course',
        instructor_id: 5,
        published: false,
        price_cents: 4999,
        created_at: new Date(),
        description: null
      });

      await coursesController.update(req, res);

      expect(mockCourseValidator.normalizePrice).toHaveBeenCalledWith('49.99');
      expect(mockCoursesService.updateCourse).toHaveBeenCalledWith(1, 
        expect.objectContaining({ price_cents: 4999 })
      );
      expect(res.json).toHaveBeenCalled();
    });

    it('should return 404 when course not found', async () => {
      const req = mockRequest({
        params: { id: '999' },
        body: { title: 'Updated' },
        user: { id: 5, email: 'instructor@test.com', role: 'instructor' }
      });
      const res = mockResponse();

      mockCourseValidator.normalizePrice.mockReturnValue(null);
      mockCoursesService.canModifyCourse.mockResolvedValue(true);
      mockCourseValidator.validateUpdateCourse.mockReturnValue({
        isValid: true,
        errors: []
      });

      mockCoursesService.updateCourse.mockResolvedValue(null);

      await coursesController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should handle service errors', async () => {
      const req = mockRequest({
        params: { id: '1' },
        body: { title: 'Updated' },
        user: { id: 5, email: 'instructor@test.com', role: 'instructor' }
      });
      const res = mockResponse();

      mockCourseValidator.normalizePrice.mockReturnValue(null);
      mockCoursesService.canModifyCourse.mockRejectedValue(new Error('Database error'));

      await coursesController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('remove - DELETE /courses/:id', () => {
    it('should return 403 when user not authenticated', async () => {
      const req = mockRequest({ params: { id: '1' } });
      const res = mockResponse();

      await coursesController.remove(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should return 403 when user is not admin', async () => {
      const req = mockRequest({
        params: { id: '1' },
        user: { id: 5, email: 'instructor@test.com', role: 'instructor' }
      });
      const res = mockResponse();

      await coursesController.remove(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should return 400 for invalid course ID', async () => {
      const req = mockRequest({
        params: { id: 'invalid' },
        user: { id: 1, email: 'admin@test.com', role: 'admin' }
      });
      const res = mockResponse();

      await coursesController.remove(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should delete course successfully for admin', async () => {
      const req = mockRequest({
        params: { id: '1' },
        user: { id: 1, email: 'admin@test.com', role: 'admin' }
      });
      const res = mockResponse();

      mockCoursesService.deleteCourse.mockResolvedValue(true);

      await coursesController.remove(req, res);

      expect(mockCoursesService.deleteCourse).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        ok: true
      }));
    });

    it('should return 404 when course not found', async () => {
      const req = mockRequest({
        params: { id: '999' },
        user: { id: 1, email: 'admin@test.com', role: 'admin' }
      });
      const res = mockResponse();

      mockCoursesService.deleteCourse.mockResolvedValue(false);

      await coursesController.remove(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should handle service errors', async () => {
      const req = mockRequest({
        params: { id: '1' },
        user: { id: 1, email: 'admin@test.com', role: 'admin' }
      });
      const res = mockResponse();

      mockCoursesService.deleteCourse.mockRejectedValue(new Error('Database error'));

      await coursesController.remove(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('publish - POST /courses/:id/publish', () => {
    it('should return 401 when user not authenticated', async () => {
      const req = mockRequest({ params: { id: '1' } });
      const res = mockResponse();

      await coursesController.publish(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should return 400 for invalid course ID', async () => {
      const req = mockRequest({
        params: { id: 'invalid' },
        user: { id: 5, email: 'instructor@test.com', role: 'instructor' }
      });
      const res = mockResponse();

      await coursesController.publish(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 403 when user cannot modify course', async () => {
      const req = mockRequest({
        params: { id: '1' },
        user: { id: 5, email: 'instructor@test.com', role: 'instructor' }
      });
      const res = mockResponse();

      mockCoursesService.canModifyCourse.mockResolvedValue(false);

      await coursesController.publish(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should publish course successfully', async () => {
      const req = mockRequest({
        params: { id: '1' },
        user: { id: 5, email: 'instructor@test.com', role: 'instructor' }
      });
      const res = mockResponse();

      mockCoursesService.canModifyCourse.mockResolvedValue(true);
      mockCoursesService.togglePublished.mockResolvedValue({
        id: 1,
        title: 'TypeScript Basics',
        published: true,
        instructor_id: 5,
        price_cents: 4999,
        created_at: new Date(),
        description: null
      });

      await coursesController.publish(req, res);

      expect(mockCoursesService.togglePublished).toHaveBeenCalledWith(1, true);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        ok: true,
        data: expect.objectContaining({ published: true })
      }));
    });

    it('should return 404 when course not found', async () => {
      const req = mockRequest({
        params: { id: '999' },
        user: { id: 5, email: 'instructor@test.com', role: 'instructor' }
      });
      const res = mockResponse();

      mockCoursesService.canModifyCourse.mockResolvedValue(true);
      mockCoursesService.togglePublished.mockResolvedValue(null);

      await coursesController.publish(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should handle service errors', async () => {
      const req = mockRequest({
        params: { id: '1' },
        user: { id: 5, email: 'instructor@test.com', role: 'instructor' }
      });
      const res = mockResponse();

      mockCoursesService.canModifyCourse.mockRejectedValue(new Error('Database error'));

      await coursesController.publish(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('unpublish - POST /courses/:id/unpublish', () => {
    it('should return 401 when user not authenticated', async () => {
      const req = mockRequest({ params: { id: '1' } });
      const res = mockResponse();

      await coursesController.unpublish(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should return 400 for invalid course ID', async () => {
      const req = mockRequest({
        params: { id: 'invalid' },
        user: { id: 5, email: 'instructor@test.com', role: 'instructor' }
      });
      const res = mockResponse();

      await coursesController.unpublish(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 403 when user cannot modify course', async () => {
      const req = mockRequest({
        params: { id: '1' },
        user: { id: 5, email: 'instructor@test.com', role: 'instructor' }
      });
      const res = mockResponse();

      mockCoursesService.canModifyCourse.mockResolvedValue(false);

      await coursesController.unpublish(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should unpublish course successfully', async () => {
      const req = mockRequest({
        params: { id: '1' },
        user: { id: 5, email: 'instructor@test.com', role: 'instructor' }
      });
      const res = mockResponse();

      mockCoursesService.canModifyCourse.mockResolvedValue(true);
      mockCoursesService.togglePublished.mockResolvedValue({
        id: 1,
        title: 'TypeScript Basics',
        published: false,
        instructor_id: 5,
        price_cents: 4999,
        created_at: new Date(),
        description: null
      });

      await coursesController.unpublish(req, res);

      expect(mockCoursesService.togglePublished).toHaveBeenCalledWith(1, false);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        ok: true,
        data: expect.objectContaining({ published: false })
      }));
    });

    it('should return 404 when course not found', async () => {
      const req = mockRequest({
        params: { id: '999' },
        user: { id: 5, email: 'instructor@test.com', role: 'instructor' }
      });
      const res = mockResponse();

      mockCoursesService.canModifyCourse.mockResolvedValue(true);
      mockCoursesService.togglePublished.mockResolvedValue(null);

      await coursesController.unpublish(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should handle service errors', async () => {
      const req = mockRequest({
        params: { id: '1' },
        user: { id: 5, email: 'instructor@test.com', role: 'instructor' }
      });
      const res = mockResponse();

      mockCoursesService.canModifyCourse.mockRejectedValue(new Error('Database error'));

      await coursesController.unpublish(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('overview - GET /courses/:id/overview', () => {
    it('should return 400 for invalid course ID', async () => {
      const req = mockRequest({ params: { id: 'invalid' } });
      const res = mockResponse();

      await coursesController.overview(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 when overview not found', async () => {
      const req = mockRequest({ params: { id: '999' } });
      const res = mockResponse();

      mockCoursesService.getCourseOverview.mockResolvedValue(null);

      await coursesController.overview(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return published overview for public user', async () => {
      const req = mockRequest({ params: { id: '1' } });
      const res = mockResponse();

      const mockOverview = {
        id: 1,
        title: 'Course',
        published: true,
        instructor: { id: 5, name: 'John' },
        totalLessons: 5,
        enrollments: { active: 10, completed: 2 },
        averageProgress: 65,
        quizzes: { total: 3, totalQuestions: 15 },
        certificatesIssued: 2,
        updatedAt: new Date()
      };

      mockCoursesService.getCourseOverview.mockResolvedValue(mockOverview);

      await coursesController.overview(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        ok: true,
        data: mockOverview
      }));
    });

    it('should return 404 for unpublished overview to public user', async () => {
      const req = mockRequest({ params: { id: '1' } });
      const res = mockResponse();

      const mockOverview = {
        id: 1,
        title: 'Course',
        published: false,
        instructor: { id: 5, name: 'John' },
        totalLessons: 0,
        enrollments: { active: 0, completed: 0 },
        averageProgress: 0,
        quizzes: { total: 0, totalQuestions: 0 },
        certificatesIssued: 0,
        updatedAt: new Date()
      };

      mockCoursesService.getCourseOverview.mockResolvedValue(mockOverview);

      await coursesController.overview(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 404 for unpublished overview to student', async () => {
      const req = mockRequest({
        params: { id: '1' },
        user: { id: 3, email: 'student@test.com', role: 'student' }
      });
      const res = mockResponse();

      const mockOverview = {
        id: 1,
        title: 'Course',
        published: false,
        instructor: { id: 5, name: 'John' },
        totalLessons: 0,
        enrollments: { active: 0, completed: 0 },
        averageProgress: 0,
        quizzes: { total: 0, totalQuestions: 0 },
        certificatesIssued: 0,
        updatedAt: new Date()
      };

      mockCoursesService.getCourseOverview.mockResolvedValue(mockOverview);

      await coursesController.overview(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 404 for unpublished overview to other instructor', async () => {
      const req = mockRequest({
        params: { id: '1' },
        user: { id: 10, email: 'other@test.com', role: 'instructor' }
      });
      const res = mockResponse();

      const mockOverview = {
        id: 1,
        title: 'Course',
        published: false,
        instructor: { id: 5, name: 'John' },
        totalLessons: 0,
        enrollments: { active: 0, completed: 0 },
        averageProgress: 0,
        quizzes: { total: 0, totalQuestions: 0 },
        certificatesIssued: 0,
        updatedAt: new Date()
      };

      mockCoursesService.getCourseOverview.mockResolvedValue(mockOverview);

      await coursesController.overview(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return unpublished overview to owner instructor', async () => {
      const req = mockRequest({
        params: { id: '1' },
        user: { id: 5, email: 'instructor@test.com', role: 'instructor' }
      });
      const res = mockResponse();

      const mockOverview = {
        id: 1,
        title: 'Course',
        published: false,
        instructor: { id: 5, name: 'John' },
        totalLessons: 0,
        enrollments: { active: 0, completed: 0 },
        averageProgress: 0,
        quizzes: { total: 0, totalQuestions: 0 },
        certificatesIssued: 0,
        updatedAt: new Date()
      };

      mockCoursesService.getCourseOverview.mockResolvedValue(mockOverview);

      await coursesController.overview(req, res);

      expect(res.json).toHaveBeenCalled();
    });

    it('should return unpublished overview to admin', async () => {
      const req = mockRequest({
        params: { id: '1' },
        user: { id: 1, email: 'admin@test.com', role: 'admin' }
      });
      const res = mockResponse();

      const mockOverview = {
        id: 1,
        title: 'Course',
        published: false,
        instructor: { id: 5, name: 'John' },
        totalLessons: 0,
        enrollments: { active: 0, completed: 0 },
        averageProgress: 0,
        quizzes: { total: 0, totalQuestions: 0 },
        certificatesIssued: 0,
        updatedAt: new Date()
      };

      mockCoursesService.getCourseOverview.mockResolvedValue(mockOverview);

      await coursesController.overview(req, res);

      expect(res.json).toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      const req = mockRequest({ params: { id: '1' } });
      const res = mockResponse();

      mockCoursesService.getCourseOverview.mockRejectedValue(new Error('Database error'));

      await coursesController.overview(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
