// Central place for domain constants shared by models and controllers.

const ROLES = ['student', 'admin', 'staff'];

const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

const STATUSES = [
  'Submitted',
  'Under Review',
  'Assigned',
  'In Progress',
  'Resolved',
  'Closed',
  'Rejected',
];

// Allowed status workflow transitions
const TRANSITIONS = {
  Submitted: ['Under Review', 'Rejected'],
  'Under Review': ['Assigned', 'Rejected'],
  Assigned: ['In Progress'],
  'In Progress': ['Resolved'],
  Resolved: ['Closed'],
  Closed: [],
  Rejected: [],
};

// Status groups used by dashboard filters / statistics
const STATUS_GROUPS = {
  pending: ['Submitted', 'Under Review', 'Assigned'],
  inprogress: ['In Progress'],
  resolved: ['Resolved', 'Closed'],
  rejected: ['Rejected'],
};

const DEPARTMENTS = [
  'Computer Science',
  'Information Technology',
  'Electronics & Communication',
  'Electrical & Electronics',
  'Mechanical Engineering',
  'Civil Engineering',
  'Business Administration',
];

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

module.exports = { ROLES, PRIORITIES, STATUSES, TRANSITIONS, STATUS_GROUPS, DEPARTMENTS, YEARS };
