const db = require('../database/connection');

const tenantMiddleware = async (req, res, next) => {
  try {
    // Skip tenant check for super admins
    if (req.user.permissions.includes('manage_all_schools')) {
      // For super admins, we might want to allow school_id in query/body to switch context
      const targetSchoolId = req.query.school_id || req.body.school_id || req.user.school_id;
      
      if (targetSchoolId && targetSchoolId !== req.user.school_id) {
        // Verify the target school exists
        const school = await db('schools')
          .where('id', targetSchoolId)
          .first();
          
        if (!school) {
          return res.status(404).json({
            error: 'School not found',
            message: 'The specified school does not exist'
          });
        }
        
        req.tenant = {
          schoolId: targetSchoolId,
          schoolName: school.name,
          schoolCode: school.code,
          isSuperAdminContext: true
        };
      } else {
        req.tenant = {
          schoolId: req.user.school_id,
          schoolName: req.user.school_name,
          schoolCode: req.user.school_code,
          isSuperAdminContext: false
        };
      }
    } else {
      // For non-super admins, enforce their school context
      if (!req.user.school_id) {
        return res.status(403).json({
          error: 'No school context',
          message: 'User is not associated with any school'
        });
      }

      // Check if user's school is active
      if (req.user.school_status !== 'active') {
        return res.status(403).json({
          error: 'School suspended',
          message: 'Your school account has been suspended'
        });
      }

      req.tenant = {
        schoolId: req.user.school_id,
        schoolName: req.user.school_name,
        schoolCode: req.user.school_code,
        isSuperAdminContext: false
      };
    }

    next();
  } catch (error) {
    console.error('Tenant middleware error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to establish tenant context'
    });
  }
};

// Helper function to add school filter to queries
const addSchoolFilter = (query, schoolId) => {
  return query.where('school_id', schoolId);
};

// Helper function to ensure data belongs to current school
const ensureSchoolOwnership = async (tableName, recordId, schoolId) => {
  const record = await db(tableName)
    .where('id', recordId)
    .where('school_id', schoolId)
    .first();
    
  return !!record;
};

module.exports = {
  tenantMiddleware,
  addSchoolFilter,
  ensureSchoolOwnership
};