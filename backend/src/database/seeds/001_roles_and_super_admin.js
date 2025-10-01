const bcrypt = require('bcryptjs');

exports.seed = async function(knex) {
  // Delete existing entries
  await knex('user_roles').del();
  await knex('roles').del();
  await knex('users').del();
  await knex('schools').del();

  // Insert system roles
  const roleIds = {
    superAdmin: '550e8400-e29b-41d4-a716-446655440001',
    schoolAdmin: '550e8400-e29b-41d4-a716-446655440002',
    teacher: '550e8400-e29b-41d4-a716-446655440003',
    student: '550e8400-e29b-41d4-a716-446655440004',
    parent: '550e8400-e29b-41d4-a716-446655440005',
    alumni: '550e8400-e29b-41d4-a716-446655440006'
  };

  await knex('roles').insert([
    {
      id: roleIds.superAdmin,
      name: 'Super Admin',
      slug: 'super-admin',
      description: 'Mylesoft internal administrators with full system access',
      permissions: JSON.stringify([
        'manage_all_schools',
        'manage_users',
        'view_system_logs',
        'manage_billing',
        'system_configuration'
      ]),
      is_system_role: true
    },
    {
      id: roleIds.schoolAdmin,
      name: 'School Administrator',
      slug: 'school-admin',
      description: 'School-level administrators with full school management access',
      permissions: JSON.stringify([
        'manage_school',
        'manage_students',
        'manage_staff',
        'manage_academics',
        'manage_finances',
        'view_reports',
        'manage_communications'
      ]),
      is_system_role: true
    },
    {
      id: roleIds.teacher,
      name: 'Teacher/Staff',
      slug: 'teacher',
      description: 'Teaching staff with classroom and academic management access',
      permissions: JSON.stringify([
        'manage_classes',
        'manage_assignments',
        'mark_attendance',
        'enter_grades',
        'communicate_with_parents',
        'view_student_records'
      ]),
      is_system_role: true
    },
    {
      id: roleIds.student,
      name: 'Student',
      slug: 'student',
      description: 'Students with access to academic information and assignments',
      permissions: JSON.stringify([
        'view_assignments',
        'submit_assignments',
        'view_grades',
        'view_attendance',
        'communicate_with_teachers'
      ]),
      is_system_role: true
    },
    {
      id: roleIds.parent,
      name: 'Parent/Guardian',
      slug: 'parent',
      description: 'Parents/guardians with access to their children\'s information',
      permissions: JSON.stringify([
        'view_child_progress',
        'view_child_attendance',
        'communicate_with_teachers',
        'make_fee_payments',
        'view_school_events'
      ]),
      is_system_role: true
    },
    {
      id: roleIds.alumni,
      name: 'Alumni',
      slug: 'alumni',
      description: 'Former students with alumni portal access',
      permissions: JSON.stringify([
        'access_alumni_network',
        'mentor_students',
        'donate_to_school',
        'attend_alumni_events'
      ]),
      is_system_role: true
    }
  ]);

  // Create Mylesoft internal school for super admins
  const mylesoftSchoolId = '550e8400-e29b-41d4-a716-446655440000';
  await knex('schools').insert({
    id: mylesoftSchoolId,
    name: 'Mylesoft Technologies',
    code: 'MYLESOFT',
    email: 'admin@mylesoft.com',
    phone: '+254700000000',
    address: 'Nairobi, Kenya',
    status: 'active',
    subscription_tier: 'enterprise',
    branding_config: JSON.stringify({
      primaryColor: '#1F2937',
      secondaryColor: '#3B82F6',
      logo: '/assets/mylesoft-logo.png'
    }),
    settings: JSON.stringify({
      isInternal: true,
      allowGlobalAccess: true
    })
  });

  // Create super admin user
  const superAdminUserId = '550e8400-e29b-41d4-a716-446655440100';
  const hashedPassword = await bcrypt.hash('SuperAdmin@2024', 12);

  await knex('users').insert({
    id: superAdminUserId,
    school_id: mylesoftSchoolId,
    email: 'superadmin@mylesoft.com',
    password_hash: hashedPassword,
    first_name: 'Super',
    last_name: 'Admin',
    phone: '+254700000001',
    status: 'active'
  });

  // Assign super admin role
  await knex('user_roles').insert({
    user_id: superAdminUserId,
    role_id: roleIds.superAdmin,
    school_id: mylesoftSchoolId
  });

  console.log('✅ System roles and super admin user created successfully');
  console.log('📧 Super Admin Email: superadmin@mylesoft.com');
  console.log('🔑 Super Admin Password: SuperAdmin@2024');
};