exports.up = function(knex) {
  return knex.schema
    // Schools table (tenant isolation)
    .createTable('schools', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('name').notNullable();
      table.string('code').unique().notNullable();
      table.string('email').unique().notNullable();
      table.string('phone');
      table.text('address');
      table.string('logo_url');
      table.string('website');
      table.enum('status', ['active', 'suspended', 'trial', 'inactive']).defaultTo('trial');
      table.enum('subscription_tier', ['basic', 'premium', 'enterprise']).defaultTo('basic');
      table.json('branding_config').defaultTo('{}');
      table.json('settings').defaultTo('{}');
      table.timestamps(true, true);
    })
    
    // Users table (global with school association)
    .createTable('users', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
      table.string('email').notNullable();
      table.string('password_hash').notNullable();
      table.string('first_name').notNullable();
      table.string('last_name').notNullable();
      table.string('phone');
      table.string('avatar_url');
      table.date('date_of_birth');
      table.enum('gender', ['male', 'female', 'other']);
      table.text('address');
      table.enum('status', ['active', 'inactive', 'suspended']).defaultTo('active');
      table.timestamp('last_login');
      table.json('preferences').defaultTo('{}');
      table.timestamps(true, true);
      
      // Unique constraint on email within school
      table.unique(['email', 'school_id']);
    })

    // Roles table
    .createTable('roles', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('name').notNullable();
      table.string('slug').unique().notNullable();
      table.text('description');
      table.json('permissions').defaultTo('[]');
      table.boolean('is_system_role').defaultTo(false);
      table.timestamps(true, true);
    })

    // User roles junction table
    .createTable('user_roles', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.uuid('role_id').references('id').inTable('roles').onDelete('CASCADE');
      table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
      table.timestamps(true, true);
      
      table.unique(['user_id', 'role_id', 'school_id']);
    })

    // System audit logs
    .createTable('audit_logs', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
      table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
      table.string('action').notNullable();
      table.string('entity_type');
      table.uuid('entity_id');
      table.json('old_values');
      table.json('new_values');
      table.string('ip_address');
      table.string('user_agent');
      table.timestamps(true, true);
    })

    // Academic years table
    .createTable('academic_years', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
      table.string('name').notNullable();
      table.date('start_date').notNullable();
      table.date('end_date').notNullable();
      table.boolean('is_current').defaultTo(false);
      table.timestamps(true, true);
      
      table.unique(['school_id', 'name']);
    })

    // Classes/Grades table
    .createTable('classes', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
      table.uuid('academic_year_id').references('id').inTable('academic_years').onDelete('CASCADE');
      table.string('name').notNullable();
      table.string('section');
      table.integer('capacity');
      table.uuid('class_teacher_id').references('id').inTable('users').onDelete('SET NULL');
      table.timestamps(true, true);
      
      table.unique(['school_id', 'academic_year_id', 'name', 'section']);
    })

    // Subjects table
    .createTable('subjects', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('school_id').references('id').inTable('schools').onDelete('CASCADE');
      table.string('name').notNullable();
      table.string('code').notNullable();
      table.text('description');
      table.integer('credits').defaultTo(1);
      table.timestamps(true, true);
      
      table.unique(['school_id', 'code']);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('subjects')
    .dropTableIfExists('classes')
    .dropTableIfExists('academic_years')
    .dropTableIfExists('audit_logs')
    .dropTableIfExists('user_roles')
    .dropTableIfExists('roles')
    .dropTableIfExists('users')
    .dropTableIfExists('schools');
};