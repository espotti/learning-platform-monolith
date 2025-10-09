import { CoursesService } from '../../src/services/courses.service';
import { db } from '../../src/db';

jest.mock('../../src/db', () => ({
  db: {
    query: jest.fn()
  }
}));

describe('CoursesService', () => {
  const mockDb = db as jest.Mocked<typeof db>;

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('createCourse', () => {
    it('should create course with instructor ID from instructor user', async () => {
      const courseData = {
        title: 'TypeScript Basics',
        description: 'Learn TypeScript',
        price_cents: 4999
      };

      mockDb.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          title: courseData.title,
          description: courseData.description,
          price_cents: courseData.price_cents,
          instructor_id: 5,
          published: false,
          created_at: new Date()
        }],
        rowCount: 1
      } as any);

      const result = await CoursesService.createCourse(courseData, 5, 'instructor');

      expect(result.id).toBe(1);
      expect(result.instructor_id).toBe(5);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO courses'),
        [courseData.title, courseData.description, courseData.price_cents, 5]
      );
    });

    it('should create course with specified instructor_id for admin', async () => {
      const courseData = {
        title: 'TypeScript Basics',
        description: 'Learn TypeScript',
        price_cents: 4999,
        instructor_id: 10
      };

      mockDb.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          title: courseData.title,
          description: courseData.description,
          price_cents: courseData.price_cents,
          instructor_id: courseData.instructor_id,
          published: false,
          created_at: new Date()
        }],
        rowCount: 1
      } as any);

      const result = await CoursesService.createCourse(courseData, 1, 'admin');

      expect(result.instructor_id).toBe(10);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO courses'),
        [courseData.title, courseData.description, courseData.price_cents, courseData.instructor_id]
      );
    });

    it('should create course with admin ID when instructor_id not specified', async () => {
      const courseData = {
        title: 'TypeScript Basics',
        description: 'Learn TypeScript',
        price_cents: 4999
      };

      mockDb.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          title: courseData.title,
          description: courseData.description,
          price_cents: courseData.price_cents,
          instructor_id: 2,
          published: false,
          created_at: new Date()
        }],
        rowCount: 1
      } as any);

      const result = await CoursesService.createCourse(courseData, 2, 'admin');

      expect(result.instructor_id).toBe(2);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO courses'),
        [courseData.title, courseData.description, courseData.price_cents, 2]
      );
    });

    it('should throw error when student tries to create course', async () => {
      const courseData = {
        title: 'TypeScript Basics',
        description: 'Learn TypeScript',
        price_cents: 4999
      };

      await expect(CoursesService.createCourse(courseData, 3, 'student'))
        .rejects
        .toThrow('Insufficient permissions to create course');
    });

    it('should use correct database query structure', async () => {
      const courseData = {
        title: 'TypeScript Basics',
        description: 'Learn TypeScript',
        price_cents: 4999
      };

      mockDb.query.mockResolvedValueOnce({
        rows: [{ id: 1, title: 'TypeScript Basics', instructor_id: 5 }],
        rowCount: 1
      } as any);

      await CoursesService.createCourse(courseData, 5, 'instructor');

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringMatching(/INSERT INTO courses/),
        expect.any(Array)
      );
    });

    it('should handle null description by passing null to database', async () => {
      const courseData = {
        title: 'TypeScript Basics',
        description: null as any,
        price_cents: 4999
      };

      mockDb.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          title: courseData.title,
          description: null,
          price_cents: courseData.price_cents,
          instructor_id: 5,
          published: false,
          created_at: new Date()
        }],
        rowCount: 1
      } as any);

      const result = await CoursesService.createCourse(courseData, 5, 'instructor');

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO courses'),
        [courseData.title, null, courseData.price_cents, 5]
      );
      expect(result.description).toBeNull();
    });
  });

  describe('getCourseById', () => {
    it('should return course without instructor when not requested', async () => {
      const mockCourse = {
        id: 1,
        title: 'TypeScript Basics',
        description: 'Learn TypeScript',
        price_cents: 4999,
        instructor_id: 5,
        published: true,
        created_at: new Date()
      };

      mockDb.query.mockResolvedValueOnce({
        rows: [mockCourse],
        rowCount: 1
      } as any);

      const result = await CoursesService.getCourseById(1);

      expect(result).toEqual(mockCourse);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [1]
      );
    });

    it('should return course with instructor when requested', async () => {
      const mockCourse = {
        id: 1,
        title: 'TypeScript Basics',
        description: 'Learn TypeScript',
        price_cents: 4999,
        instructor_id: 5,
        published: true,
        created_at: new Date(),
        instructor_name: 'John Instructor'
      };

      mockDb.query.mockResolvedValueOnce({
        rows: [mockCourse],
        rowCount: 1
      } as any);

      const result = await CoursesService.getCourseById(1, true);

      expect(result?.instructor).toEqual({ id: 5, name: 'John Instructor' });
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('LEFT JOIN users'),
        [1]
      );
    });

    it('should return null when course not found', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      } as any);

      const result = await CoursesService.getCourseById(999);

      expect(result).toBeNull();
    });

    it('should use correct query structure', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [{ id: 1 }],
        rowCount: 1
      } as any);

      await CoursesService.getCourseById(1);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [1]
      );
    });
  });

  describe('updateCourse', () => {
    it('should update course title', async () => {
      const updates = { title: 'Updated Title' };
      const mockUpdatedCourse = {
        id: 1,
        title: 'Updated Title',
        description: 'Original description',
        price: 4999,
        instructor_id: 5,
        is_published: false,
        created_at: new Date(),
        updated_at: new Date()
      };

      mockDb.query.mockResolvedValueOnce({
        rows: [mockUpdatedCourse],
        rowCount: 1
      } as any);

      const result = await CoursesService.updateCourse(1, updates);

      expect(result?.title).toBe('Updated Title');
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE courses'),
        expect.arrayContaining(['Updated Title', 1])
      );
    });

    it('should update course description', async () => {
      const updates = { description: 'New description' };
      
      mockDb.query.mockResolvedValueOnce({
        rows: [{ id: 1, description: 'New description' }],
        rowCount: 1
      } as any);

      const result = await CoursesService.updateCourse(1, updates);

      expect(result?.description).toBe('New description');
    });

    it('should update course price', async () => {
      const updates = { price_cents: 5999 };
      
      mockDb.query.mockResolvedValueOnce({
        rows: [{ id: 1, price_cents: 5999 }],
        rowCount: 1
      } as any);

      const result = await CoursesService.updateCourse(1, updates);

      expect(result?.price_cents).toBe(5999);
    });

    it('should update instructor_id', async () => {
      const updates = { instructor_id: 10 };
      
      mockDb.query.mockResolvedValueOnce({
        rows: [{ id: 1, instructor_id: 10 }],
        rowCount: 1
      } as any);

      const result = await CoursesService.updateCourse(1, updates);

      expect(result?.instructor_id).toBe(10);
    });

    it('should update multiple fields', async () => {
      const updates = {
        title: 'New Title',
        description: 'New description',
        price_cents: 5999
      };
      
      mockDb.query.mockResolvedValueOnce({
        rows: [{ id: 1, ...updates }],
        rowCount: 1
      } as any);

      const result = await CoursesService.updateCourse(1, updates);

      expect(result?.title).toBe('New Title');
      expect(result?.description).toBe('New description');
      expect(result?.price_cents).toBe(5999);
    });

    it('should return current course when no fields to update', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [{ id: 1, title: 'Existing' }],
        rowCount: 1
      } as any);

      const result = await CoursesService.updateCourse(1, {});

      expect(result?.id).toBe(1);
      expect(mockDb.query).toHaveBeenCalled();
    });

    it('should return null when course not found', async () => {
      const updates = { title: 'Updated Title' };
      
      mockDb.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      } as any);

      const result = await CoursesService.updateCourse(999, updates);

      expect(result).toBeNull();
    });
  });

  describe('togglePublished', () => {
    it('should publish a course', async () => {
      const mockCourse = {
        id: 1,
        title: 'TypeScript Basics',
        published: true
      };

      mockDb.query.mockResolvedValueOnce({
        rows: [mockCourse],
        rowCount: 1
      } as any);

      const result = await CoursesService.togglePublished(1, true);

      expect(result?.published).toBe(true);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE courses'),
        [true, 1]
      );
    });

    it('should unpublish a course', async () => {
      const mockCourse = {
        id: 1,
        title: 'TypeScript Basics',
        published: false
      };

      mockDb.query.mockResolvedValueOnce({
        rows: [mockCourse],
        rowCount: 1
      } as any);

      const result = await CoursesService.togglePublished(1, false);

      expect(result?.published).toBe(false);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE courses'),
        [false, 1]
      );
    });

    it('should return null when course not found', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      } as any);

      const result = await CoursesService.togglePublished(999, true);

      expect(result).toBeNull();
    });
  });

  describe('listCourses', () => {
    it('should return courses with default pagination', async () => {
      const mockCourses = [
        { id: 1, title: 'Course 1', instructor_id: 5, instructor_name: 'John', price_cents: 4999, published: true, created_at: new Date(), description: null },
        { id: 2, title: 'Course 2', instructor_id: 6, instructor_name: 'Jane', price_cents: 5999, published: true, created_at: new Date(), description: null }
      ];

      mockDb.query
        .mockResolvedValueOnce({ rows: [{ total: '2' }] } as any)
        .mockResolvedValueOnce({ rows: mockCourses } as any);

      const result = await CoursesService.listCourses();

      expect(result.courses.length).toBe(2);
      expect(result.courses[0].instructor).toEqual({ id: 5, name: 'John' });
      expect(result.courses[1].instructor).toEqual({ id: 6, name: 'Jane' });
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.totalPages).toBe(1);
    });

    it('should filter by search term', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ total: '1' }] } as any)
        .mockResolvedValueOnce({ rows: [{ id: 1, title: 'TypeScript Course', instructor_id: 5, price_cents: 4999, published: true, created_at: new Date(), description: null }] } as any);

      await CoursesService.listCourses({ search: 'TypeScript' });

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE'),
        expect.arrayContaining(['%TypeScript%'])
      );
    });

    it('should filter by published_only', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ total: '5' }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      await CoursesService.listCourses({ published_only: true });

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('published = true'),
        expect.any(Array)
      );
    });

    it('should filter by instructor_id', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ total: '3' }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      await CoursesService.listCourses({ instructor_id: 5 });

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('instructor_id = $'),
        expect.arrayContaining([5])
      );
    });

    it('should apply multiple filters', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ total: '1' }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      await CoursesService.listCourses({
        search: 'TypeScript',
        published_only: true,
        instructor_id: 5
      });

      const countQuery = mockDb.query.mock.calls[0][0];
      expect(countQuery).toContain('WHERE');
      expect(countQuery).toContain('published = true');
    });

    it('should calculate pagination correctly', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ total: '25' }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      const result = await CoursesService.listCourses({ page: 2, limit: 10 });

      expect(result.pagination.page).toBe(2);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.total).toBe(25);
      expect(result.pagination.totalPages).toBe(3);
    });

    it('should include instructor information', async () => {
      const mockCourses = [
        {
          id: 1,
          title: 'Course 1',
          instructor_id: 5,
          instructor_name: 'John Instructor',
          price_cents: 4999,
          published: true,
          created_at: new Date(),
          description: null
        }
      ];

      mockDb.query
        .mockResolvedValueOnce({ rows: [{ total: '1' }] } as any)
        .mockResolvedValueOnce({ rows: mockCourses } as any);

      const result = await CoursesService.listCourses();

      expect(result.courses[0].instructor).toEqual({ id: 5, name: 'John Instructor' });
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('LEFT JOIN users'),
        expect.any(Array)
      );
    });
  });

  describe('canModifyCourse', () => {
    it('should allow admin to modify any course', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [{ id: 1, instructor_id: 5 }],
        rowCount: 1
      } as any);

      const result = await CoursesService.canModifyCourse(1, 1, 'admin');

      expect(result).toBe(true);
    });

    it('should allow instructor to modify own course', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [{ id: 1, instructor_id: 5 }],
        rowCount: 1
      } as any);

      const result = await CoursesService.canModifyCourse(1, 5, 'instructor');

      expect(result).toBe(true);
    });

    it('should not allow instructor to modify other instructor course', async () => {
      const mockCourse = {
        id: 1,
        instructor_id: 10,
        title: 'Course',
        price_cents: 4999,
        published: true,
        created_at: new Date(),
        description: null
      };
      
      mockDb.query.mockResolvedValueOnce({
        rows: [mockCourse],
        rowCount: 1
      } as any);

      const result = await CoursesService.canModifyCourse(1, 5, 'instructor');

      expect(result).toBe(false);
    });

    it('should not allow student to modify course', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [{ id: 1, instructor_id: 5 }],
        rowCount: 1
      } as any);

      const result = await CoursesService.canModifyCourse(1, 3, 'student');

      expect(result).toBe(false);
    });

    it('should return false when course not found', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      } as any);

      const result = await CoursesService.canModifyCourse(999, 5, 'instructor');

      expect(result).toBe(false);
    });
  });

  describe('deleteCourse', () => {
    it('should delete course successfully', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 1
      } as any);

      const result = await CoursesService.deleteCourse(1);

      expect(result).toBe(true);
      expect(mockDb.query).toHaveBeenCalledWith(
        'DELETE FROM courses WHERE id = $1',
        [1]
      );
    });

    it('should return false when course not found', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'DELETE',
        oid: 0,
        fields: []
      } as any);

      const result = await CoursesService.deleteCourse(999);

      expect(result).toBe(false);
    });

    it('should handle null rowCount by treating as false', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [],
        rowCount: null,
        command: 'DELETE',
        oid: 0,
        fields: []
      } as any);

      const result = await CoursesService.deleteCourse(999);

      expect(result).toBe(false);
    });
  });

  describe('getCourseOverview', () => {
    it('should return complete overview with all stats', async () => {
      const mockCourse = {
        id: 1,
        title: 'TypeScript Basics',
        published: true,
        instructor_id: 5,
        instructor_name: 'John Instructor',
        created_at: new Date()
      };

      mockDb.query
        .mockResolvedValueOnce({ rows: [mockCourse] } as any) // Course query
        .mockResolvedValueOnce({ rows: [{ total: '5' }] } as any) // Lessons count
        .mockResolvedValueOnce({ rows: [{ active: '8', completed: '2' }] } as any) // Enrollments
        .mockResolvedValueOnce({ rows: [{ average_progress: '65.5' }] } as any) // Progress
        .mockResolvedValueOnce({ rows: [{ total_quizzes: '3', total_questions: '15' }] } as any) // Quizzes
        .mockResolvedValueOnce({ rows: [{ total: '2' }] } as any); // Certificates

      const result = await CoursesService.getCourseOverview(1);

      expect(result?.id).toBe(1);
      expect(result?.title).toBe('TypeScript Basics');
      expect(result?.totalLessons).toBe(5);
      expect(result?.enrollments.active).toBe(8);
      expect(result?.enrollments.completed).toBe(2);
      expect(result?.averageProgress).toBe(66); // Rounded from 65.5
      expect(result?.quizzes.total).toBe(3);
      expect(result?.quizzes.totalQuestions).toBe(15);
      expect(result?.certificatesIssued).toBe(2);
    });

    it('should return null when course not found', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      } as any);

      const result = await CoursesService.getCourseOverview(999);

      expect(result).toBeNull();
    });

    it('should handle zero enrollments and lessons', async () => {
      const mockCourse = {
        id: 1,
        title: 'New Course',
        instructor_id: 5,
        instructor_name: 'John',
        published: false,
        created_at: new Date()
      };

      mockDb.query
        .mockResolvedValueOnce({ rows: [mockCourse] } as any) // Course query
        .mockResolvedValueOnce({ rows: [{ total: '0' }] } as any) // Lessons
        .mockResolvedValueOnce({ rows: [{ active: '0', completed: '0' }] } as any) // Enrollments
        .mockResolvedValueOnce({ rows: [{ average_progress: '0' }] } as any) // Progress
        .mockResolvedValueOnce({ rows: [{ total_quizzes: '0', total_questions: '0' }] } as any) // Quizzes
        .mockResolvedValueOnce({ rows: [{ total: '0' }] } as any); // Certificates

      const result = await CoursesService.getCourseOverview(1);

      expect(result?.totalLessons).toBe(0);
      expect(result?.enrollments.active).toBe(0);
      expect(result?.enrollments.completed).toBe(0);
      expect(result?.averageProgress).toBe(0);
      expect(result?.quizzes.total).toBe(0);
      expect(result?.certificatesIssued).toBe(0);
    });

    it('should execute queries in parallel', async () => {
      const mockCourse = { id: 1, title: 'Course', instructor_id: 5, instructor_name: 'John', published: true, created_at: new Date() };

      mockDb.query
        .mockResolvedValueOnce({ rows: [mockCourse] } as any) // Course query
        .mockResolvedValueOnce({ rows: [{ total: '5' }] } as any) // Lessons
        .mockResolvedValueOnce({ rows: [{ active: '3', completed: '1' }] } as any) // Enrollments
        .mockResolvedValueOnce({ rows: [{ average_progress: '50' }] } as any) // Progress
        .mockResolvedValueOnce({ rows: [{ total_quizzes: '2', total_questions: '10' }] } as any) // Quizzes
        .mockResolvedValueOnce({ rows: [{ total: '1' }] } as any); // Certificates

      await CoursesService.getCourseOverview(1);

      expect(mockDb.query).toHaveBeenCalledTimes(6);
    });

    it('should use default "Unknown" when instructor_name is null', async () => {
      const mockCourse = {
        id: 1,
        title: 'Course',
        published: true,
        instructor_id: 5,
        instructor_name: null,
        created_at: new Date()
      };

      mockDb.query
        .mockResolvedValueOnce({ rows: [mockCourse] } as any) // Course query
        .mockResolvedValueOnce({ rows: [{ total: '5' }] } as any) // Lessons
        .mockResolvedValueOnce({ rows: [{ active: '3', completed: '1' }] } as any) // Enrollments
        .mockResolvedValueOnce({ rows: [{ average_progress: '50' }] } as any) // Progress
        .mockResolvedValueOnce({ rows: [{ total_quizzes: '2', total_questions: '10' }] } as any) // Quizzes
        .mockResolvedValueOnce({ rows: [{ total: '1' }] } as any); // Certificates

      const result = await CoursesService.getCourseOverview(1);

      expect(result?.instructor.name).toBe('Unknown');
    });

    it('should handle missing query result values with defaults', async () => {
      const mockCourse = {
        id: 1,
        title: 'Course',
        published: true,
        instructor_id: 5,
        instructor_name: 'John',
        created_at: new Date()
      };

      mockDb.query
        .mockResolvedValueOnce({ rows: [mockCourse] } as any) // Course query
        .mockResolvedValueOnce({ rows: [{}] } as any) // Lessons - missing total
        .mockResolvedValueOnce({ rows: [{}] } as any) // Enrollments - missing active/completed
        .mockResolvedValueOnce({ rows: [{}] } as any) // Progress - missing average_progress
        .mockResolvedValueOnce({ rows: [{}] } as any) // Quizzes - missing counts
        .mockResolvedValueOnce({ rows: [{}] } as any); // Certificates - missing total

      const result = await CoursesService.getCourseOverview(1);

      expect(result?.totalLessons).toBe(0);
      expect(result?.enrollments.active).toBe(0);
      expect(result?.enrollments.completed).toBe(0);
      expect(result?.averageProgress).toBe(0);
      expect(result?.quizzes.total).toBe(0);
      expect(result?.quizzes.totalQuestions).toBe(0);
      expect(result?.certificatesIssued).toBe(0);
    });
  });
});
