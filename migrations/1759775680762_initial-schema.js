/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
  // Users table
  pgm.createTable('users', {
    id: 'id',
    email: { type: 'varchar(255)', notNull: true, unique: true },
    password_hash: { type: 'varchar(255)', notNull: true },
    name: { type: 'varchar(255)', notNull: true },
    role: { 
      type: 'varchar(20)', 
      notNull: true, 
      check: "role IN ('admin', 'instructor', 'student')",
      default: 'student'
    },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
  });

  // Courses table
  pgm.createTable('courses', {
    id: 'id',
    title: { type: 'varchar(255)', notNull: true },
    description: { type: 'text' },
    price_cents: { type: 'integer', notNull: true, check: 'price_cents >= 0' },
    published: { type: 'boolean', notNull: true, default: false },
    instructor_id: { 
      type: 'integer', 
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE'
    },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
  });

  // Lessons table
  pgm.createTable('lessons', {
    id: 'id',
    course_id: { 
      type: 'integer', 
      notNull: true,
      references: 'courses(id)',
      onDelete: 'CASCADE'
    },
    title: { type: 'varchar(255)', notNull: true },
    content_md: { type: 'text' },
    video_url: { type: 'varchar(500)' },
    position: { type: 'integer', notNull: true },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
  });

  // Quizzes table
  pgm.createTable('quizzes', {
    id: 'id',
    course_id: { 
      type: 'integer', 
      notNull: true,
      references: 'courses(id)',
      onDelete: 'CASCADE'
    },
    title: { type: 'varchar(255)', notNull: true },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
  });

  // Quiz questions table
  pgm.createTable('quiz_questions', {
    id: 'id',
    quiz_id: { 
      type: 'integer', 
      notNull: true,
      references: 'quizzes(id)',
      onDelete: 'CASCADE'
    },
    prompt: { type: 'text', notNull: true },
    choices: { type: 'jsonb', notNull: true },
    correct_index: { type: 'integer', notNull: true },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
  });

  // Enrollments table
  pgm.createTable('enrollments', {
    id: 'id',
    user_id: { 
      type: 'integer', 
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE'
    },
    course_id: { 
      type: 'integer', 
      notNull: true,
      references: 'courses(id)',
      onDelete: 'CASCADE'
    },
    status: { 
      type: 'varchar(20)', 
      notNull: true, 
      check: "status IN ('active', 'completed', 'refunded')",
      default: 'active'
    },
    enrolled_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
  });

  // Quiz submissions table
  pgm.createTable('quiz_submissions', {
    id: 'id',
    quiz_id: { 
      type: 'integer', 
      notNull: true,
      references: 'quizzes(id)',
      onDelete: 'CASCADE'
    },
    user_id: { 
      type: 'integer', 
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE'
    },
    answers: { type: 'jsonb', notNull: true },
    score: { type: 'integer', notNull: true },
    submitted_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
  });

  // Lesson progress table
  pgm.createTable('lesson_progress', {
    id: 'id',
    enrollment_id: { 
      type: 'integer', 
      notNull: true,
      references: 'enrollments(id)',
      onDelete: 'CASCADE'
    },
    lesson_id: { 
      type: 'integer', 
      notNull: true,
      references: 'lessons(id)',
      onDelete: 'CASCADE'
    },
    completed: { type: 'boolean', notNull: true, default: false },
    completed_at: { type: 'timestamp' },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
  });

  // Certificates table
  pgm.createTable('certificates', {
    id: 'id',
    user_id: { 
      type: 'integer', 
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE'
    },
    course_id: { 
      type: 'integer', 
      notNull: true,
      references: 'courses(id)',
      onDelete: 'CASCADE'
    },
    code: { type: 'varchar(100)', notNull: true, unique: true },
    issued_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
  });

  // Outbox events table (for notifications)
  pgm.createTable('outbox_events', {
    id: 'id',
    event_type: { type: 'varchar(100)', notNull: true },
    payload: { type: 'jsonb', notNull: true },
    processed: { type: 'boolean', notNull: true, default: false },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
    processed_at: { type: 'timestamp' }
  });

  // Create indexes for better performance
  pgm.createIndex('users', 'email');
  pgm.createIndex('courses', 'instructor_id');
  pgm.createIndex('courses', 'published');
  pgm.createIndex('lessons', 'course_id');
  pgm.createIndex('lessons', ['course_id', 'position']);
  pgm.createIndex('quizzes', 'course_id');
  pgm.createIndex('quiz_questions', 'quiz_id');
  pgm.createIndex('enrollments', 'user_id');
  pgm.createIndex('enrollments', 'course_id');
  pgm.createIndex('enrollments', ['user_id', 'course_id'], { unique: true });
  pgm.createIndex('quiz_submissions', 'quiz_id');
  pgm.createIndex('quiz_submissions', 'user_id');
  pgm.createIndex('lesson_progress', 'enrollment_id');
  pgm.createIndex('lesson_progress', 'lesson_id');
  pgm.createIndex('lesson_progress', ['enrollment_id', 'lesson_id'], { unique: true });
  pgm.createIndex('certificates', 'user_id');
  pgm.createIndex('certificates', 'course_id');
  pgm.createIndex('certificates', 'code');
  pgm.createIndex('certificates', ['user_id', 'course_id'], { unique: true });
  pgm.createIndex('outbox_events', 'processed');
  pgm.createIndex('outbox_events', 'created_at');
};

exports.down = pgm => {
  // Drop tables in reverse order to handle foreign key constraints
  pgm.dropTable('outbox_events');
  pgm.dropTable('certificates');
  pgm.dropTable('lesson_progress');
  pgm.dropTable('quiz_submissions');
  pgm.dropTable('enrollments');
  pgm.dropTable('quiz_questions');
  pgm.dropTable('quizzes');
  pgm.dropTable('lessons');
  pgm.dropTable('courses');
  pgm.dropTable('users');
};
