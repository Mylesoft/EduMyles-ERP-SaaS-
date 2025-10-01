export interface EventBusEvent {
  id: string;
  type: string;
  source: string; // Module ID that published the event
  tenantId: string;
  timestamp: Date;
  data: Record<string, any>;
  metadata?: EventMetadata;
}

export interface EventMetadata {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  correlationId?: string;
  version?: string;
  retryCount?: number;
}

export interface EventSubscription {
  id: string;
  eventType: string;
  moduleId: string;
  handler: string;
  active: boolean;
  priority: number;
  createdAt: Date;
}

export interface EventHandler {
  (event: EventBusEvent): Promise<void>;
}

// Standard event types across modules
export enum StandardEventTypes {
  // User events
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_DELETED = 'user.deleted',
  USER_LOGIN = 'user.login',
  USER_LOGOUT = 'user.logout',

  // Student events
  STUDENT_ENROLLED = 'student.enrolled',
  STUDENT_GRADUATED = 'student.graduated',
  STUDENT_TRANSFERRED = 'student.transferred',

  // Academic events
  GRADE_ADDED = 'grade.added',
  GRADE_UPDATED = 'grade.updated',
  ASSIGNMENT_CREATED = 'assignment.created',
  ASSIGNMENT_SUBMITTED = 'assignment.submitted',
  ATTENDANCE_MARKED = 'attendance.marked',
  CLASS_SCHEDULED = 'class.scheduled',
  SEMESTER_STARTED = 'semester.started',
  SEMESTER_ENDED = 'semester.ended',

  // Financial events
  PAYMENT_RECEIVED = 'payment.received',
  INVOICE_GENERATED = 'invoice.generated',
  FEE_STRUCTURE_UPDATED = 'fee_structure.updated',
  SCHOLARSHIP_AWARDED = 'scholarship.awarded',

  // Communication events
  MESSAGE_SENT = 'message.sent',
  NOTIFICATION_CREATED = 'notification.created',
  ANNOUNCEMENT_PUBLISHED = 'announcement.published',
  EMAIL_SENT = 'email.sent',
  SMS_SENT = 'sms.sent',

  // Module events
  MODULE_INSTALLED = 'module.installed',
  MODULE_UNINSTALLED = 'module.uninstalled',
  MODULE_ENABLED = 'module.enabled',
  MODULE_DISABLED = 'module.disabled',
  MODULE_UPDATED = 'module.updated',

  // System events
  BACKUP_COMPLETED = 'system.backup.completed',
  MAINTENANCE_STARTED = 'system.maintenance.started',
  MAINTENANCE_COMPLETED = 'system.maintenance.completed',
  ERROR_OCCURRED = 'system.error.occurred'
}

// Event data interfaces for common events
export interface UserCreatedEventData {
  userId: string;
  email: string;
  role: string;
  tenantId: string;
}

export interface GradeAddedEventData {
  studentId: string;
  subjectId: string;
  grade: number;
  maxGrade: number;
  teacherId: string;
  assignmentId?: string;
  examId?: string;
}

export interface AttendanceMarkedEventData {
  studentId: string;
  classId: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  markedBy: string;
}

export interface PaymentReceivedEventData {
  studentId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  transactionId: string;
  feeType: string;
}

export interface MessageSentEventData {
  fromUserId: string;
  toUserIds: string[];
  subject?: string;
  content: string;
  messageType: 'email' | 'sms' | 'push' | 'internal';
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

// Event bus interface
export interface EventBus {
  publish(event: Omit<EventBusEvent, 'id' | 'timestamp'>): Promise<void>;
  subscribe(eventType: string, handler: EventHandler, options?: SubscriptionOptions): Promise<string>;
  unsubscribe(subscriptionId: string): Promise<void>;
  getSubscriptions(moduleId: string): Promise<EventSubscription[]>;
}

export interface SubscriptionOptions {
  priority?: number;
  filter?: (event: EventBusEvent) => boolean;
  retryPolicy?: RetryPolicy;
}

export interface RetryPolicy {
  maxRetries: number;
  backoffMultiplier: number;
  maxBackoffDelay: number;
}