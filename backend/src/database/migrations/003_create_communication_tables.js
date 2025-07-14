exports.up = function(knex) {
  return knex.schema
    // Messages/Communication
    .createTable('messages', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('sender_id').references('id').inTable('users').onDelete('CASCADE');
      table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
      table.string('subject').notNullable();
      table.text('content').notNullable();
      table.enum('message_type', ['personal', 'announcement', 'notification']).defaultTo('personal');
      table.enum('priority', ['low', 'medium', 'high', 'urgent']).defaultTo('medium');
      table.json('attachments').defaultTo('[]');
      table.boolean('is_read').defaultTo(false);
      table.datetime('sent_at');
      table.timestamps(true, true);
    })

    // Message recipients
    .createTable('message_recipients', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('message_id').references('id').inTable('messages').onDelete('CASCADE');
      table.uuid('recipient_id').references('id').inTable('users').onDelete('CASCADE');
      table.enum('recipient_type', ['user', 'role', 'class', 'all']).defaultTo('user');
      table.boolean('is_read').defaultTo(false);
      table.datetime('read_at');
      table.timestamps(true, true);
    })

    // School events
    .createTable('events', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
      table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
      table.string('title').notNullable();
      table.text('description');
      table.datetime('start_date').notNullable();
      table.datetime('end_date');
      table.string('location');
      table.enum('event_type', ['academic', 'sports', 'cultural', 'meeting', 'exam', 'holiday']).defaultTo('academic');
      table.enum('visibility', ['public', 'staff', 'students', 'parents', 'private']).defaultTo('public');
      table.json('attendees').defaultTo('[]');
      table.boolean('send_reminders').defaultTo(true);
      table.timestamps(true, true);
    })

    // Notifications
    .createTable('notifications', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
      table.string('title').notNullable();
      table.text('message');
      table.enum('type', ['info', 'warning', 'error', 'success']).defaultTo('info');
      table.enum('category', ['academic', 'financial', 'attendance', 'assignment', 'announcement', 'system']).defaultTo('system');
      table.json('metadata').defaultTo('{}');
      table.boolean('is_read').defaultTo(false);
      table.datetime('read_at');
      table.datetime('expires_at');
      table.timestamps(true, true);
    })

    // Alumni table (extends users)
    .createTable('alumni', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
      table.string('student_number');
      table.year('graduation_year');
      table.string('degree_program');
      table.string('current_occupation');
      table.string('company');
      table.string('industry');
      table.text('achievements');
      table.string('linkedin_profile');
      table.boolean('willing_to_mentor').defaultTo(false);
      table.boolean('willing_to_speak').defaultTo(false);
      table.timestamps(true, true);
      
      table.unique(['school_id', 'student_number']);
    })

    // Staff/Teachers table (extends users)
    .createTable('staff', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
      table.string('employee_number').notNullable();
      table.string('department');
      table.string('designation');
      table.date('join_date');
      table.decimal('salary', 10, 2);
      table.json('qualifications').defaultTo('[]');
      table.json('subjects_taught').defaultTo('[]');
      table.text('emergency_contact');
      table.string('bank_account');
      table.enum('employment_type', ['permanent', 'contract', 'part-time', 'volunteer']).defaultTo('permanent');
      table.enum('status', ['active', 'on-leave', 'suspended', 'terminated']).defaultTo('active');
      table.timestamps(true, true);
      
      table.unique(['school_id', 'employee_number']);
    })

    // Leave applications
    .createTable('leave_applications', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('staff_id').references('id').inTable('staff').onDelete('CASCADE');
      table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
      table.enum('leave_type', ['sick', 'casual', 'annual', 'maternity', 'paternity', 'emergency']).notNullable();
      table.date('start_date').notNullable();
      table.date('end_date').notNullable();
      table.integer('days_requested');
      table.text('reason');
      table.enum('status', ['pending', 'approved', 'rejected', 'cancelled']).defaultTo('pending');
      table.uuid('approved_by').references('id').inTable('users').onDelete('SET NULL');
      table.datetime('approved_at');
      table.text('approval_remarks');
      table.timestamps(true, true);
    })

    // File uploads/Documents
    .createTable('documents', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
      table.uuid('uploaded_by').references('id').inTable('users').onDelete('SET NULL');
      table.string('original_name').notNullable();
      table.string('file_name').notNullable();
      table.string('file_path').notNullable();
      table.string('mime_type');
      table.integer('file_size');
      table.enum('document_type', ['student', 'staff', 'academic', 'financial', 'administrative', 'assignment']).defaultTo('administrative');
      table.uuid('entity_id'); // Reference to student, staff, assignment, etc.
      table.string('entity_type'); // students, staff, assignments, etc.
      table.json('metadata').defaultTo('{}');
      table.timestamps(true, true);
    })

    // Reports
    .createTable('reports', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
      table.uuid('generated_by').references('id').inTable('users').onDelete('SET NULL');
      table.string('report_name').notNullable();
      table.string('report_type').notNullable();
      table.json('parameters').defaultTo('{}');
      table.json('filters').defaultTo('{}');
      table.string('file_path');
      table.enum('format', ['pdf', 'excel', 'csv']).defaultTo('pdf');
      table.enum('status', ['generating', 'completed', 'failed']).defaultTo('generating');
      table.datetime('generated_at');
      table.boolean('is_scheduled').defaultTo(false);
      table.string('schedule_frequency'); // daily, weekly, monthly
      table.timestamps(true, true);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('reports')
    .dropTableIfExists('documents')
    .dropTableIfExists('leave_applications')
    .dropTableIfExists('staff')
    .dropTableIfExists('alumni')
    .dropTableIfExists('notifications')
    .dropTableIfExists('events')
    .dropTableIfExists('message_recipients')
    .dropTableIfExists('messages');
};