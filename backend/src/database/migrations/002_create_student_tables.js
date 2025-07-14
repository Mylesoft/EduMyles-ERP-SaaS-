exports.up = function(knex) {
  return knex.schema
    // Students table (extends users)
    .createTable('students', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
      table.string('student_number').notNullable();
      table.date('admission_date');
      table.string('guardian_name');
      table.string('guardian_phone');
      table.string('guardian_email');
      table.text('medical_conditions');
      table.text('special_needs');
      table.string('emergency_contact');
      table.string('emergency_phone');
      table.timestamps(true, true);
      
      table.unique(['school_id', 'student_number']);
    })

    // Student enrollments (class assignments per academic year)
    .createTable('student_enrollments', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('student_id').references('id').inTable('students').onDelete('CASCADE');
      table.uuid('class_id').references('id').inTable('classes').onDelete('CASCADE');
      table.uuid('academic_year_id').references('id').inTable('academic_years').onDelete('CASCADE');
      table.date('enrollment_date');
      table.enum('status', ['active', 'transferred', 'graduated', 'dropped']).defaultTo('active');
      table.timestamps(true, true);
      
      table.unique(['student_id', 'academic_year_id']);
    })

    // Attendance records
    .createTable('attendance', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('student_id').references('id').inTable('students').onDelete('CASCADE');
      table.uuid('class_id').references('id').inTable('classes').onDelete('CASCADE');
      table.uuid('teacher_id').references('id').inTable('users').onDelete('SET NULL');
      table.date('date').notNullable();
      table.enum('status', ['present', 'absent', 'late', 'excused']).notNullable();
      table.text('remarks');
      table.timestamps(true, true);
      
      table.unique(['student_id', 'date']);
    })

    // Assignments
    .createTable('assignments', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('teacher_id').references('id').inTable('users').onDelete('CASCADE');
      table.uuid('subject_id').references('id').inTable('subjects').onDelete('CASCADE');
      table.uuid('class_id').references('id').inTable('classes').onDelete('CASCADE');
      table.string('title').notNullable();
      table.text('description');
      table.text('instructions');
      table.datetime('due_date');
      table.integer('total_marks').defaultTo(100);
      table.json('attachments').defaultTo('[]');
      table.enum('status', ['draft', 'published', 'closed']).defaultTo('draft');
      table.timestamps(true, true);
    })

    // Assignment submissions
    .createTable('assignment_submissions', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('assignment_id').references('id').inTable('assignments').onDelete('CASCADE');
      table.uuid('student_id').references('id').inTable('students').onDelete('CASCADE');
      table.text('content');
      table.json('attachments').defaultTo('[]');
      table.datetime('submitted_at');
      table.integer('marks_obtained');
      table.text('teacher_feedback');
      table.datetime('graded_at');
      table.uuid('graded_by').references('id').inTable('users').onDelete('SET NULL');
      table.enum('status', ['pending', 'submitted', 'graded', 'late']).defaultTo('pending');
      table.timestamps(true, true);
      
      table.unique(['assignment_id', 'student_id']);
    })

    // Grades/Marks
    .createTable('grades', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('student_id').references('id').inTable('students').onDelete('CASCADE');
      table.uuid('subject_id').references('id').inTable('subjects').onDelete('CASCADE');
      table.uuid('class_id').references('id').inTable('classes').onDelete('CASCADE');
      table.uuid('academic_year_id').references('id').inTable('academic_years').onDelete('CASCADE');
      table.string('assessment_type'); // Quiz, Test, Exam, Assignment
      table.string('assessment_name');
      table.integer('marks_obtained');
      table.integer('total_marks');
      table.string('grade');
      table.text('remarks');
      table.uuid('teacher_id').references('id').inTable('users').onDelete('SET NULL');
      table.date('assessment_date');
      table.timestamps(true, true);
    })

    // Fee structures
    .createTable('fee_structures', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
      table.uuid('academic_year_id').references('id').inTable('academic_years').onDelete('CASCADE');
      table.uuid('class_id').references('id').inTable('classes').onDelete('CASCADE');
      table.string('fee_type').notNullable(); // Tuition, Transport, Meals, etc.
      table.decimal('amount', 10, 2).notNullable();
      table.string('frequency'); // Monthly, Termly, Annual
      table.date('due_date');
      table.text('description');
      table.timestamps(true, true);
    })

    // Fee payments
    .createTable('fee_payments', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('student_id').references('id').inTable('students').onDelete('CASCADE');
      table.uuid('fee_structure_id').references('id').inTable('fee_structures').onDelete('CASCADE');
      table.string('payment_reference').unique();
      table.decimal('amount_paid', 10, 2).notNullable();
      table.string('payment_method'); // Cash, Bank Transfer, M-Pesa, Stripe
      table.date('payment_date');
      table.string('transaction_id');
      table.enum('status', ['pending', 'completed', 'failed', 'refunded']).defaultTo('pending');
      table.text('remarks');
      table.timestamps(true, true);
    })

    // Timetables
    .createTable('timetables', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('class_id').references('id').inTable('classes').onDelete('CASCADE');
      table.uuid('subject_id').references('id').inTable('subjects').onDelete('CASCADE');
      table.uuid('teacher_id').references('id').inTable('users').onDelete('CASCADE');
      table.enum('day_of_week', ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']);
      table.time('start_time');
      table.time('end_time');
      table.string('room');
      table.timestamps(true, true);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('timetables')
    .dropTableIfExists('fee_payments')
    .dropTableIfExists('fee_structures')
    .dropTableIfExists('grades')
    .dropTableIfExists('assignment_submissions')
    .dropTableIfExists('assignments')
    .dropTableIfExists('attendance')
    .dropTableIfExists('student_enrollments')
    .dropTableIfExists('students');
};