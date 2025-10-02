export interface DatabaseConnection {
  url: string;
  maxConnections?: number;
  ssl?: boolean;
}

export interface DatabaseMigration {
  id: string;
  name: string;
  version: string;
  up: string;
  down: string;
  runAt?: Date;
}

// Student Management Types

export interface StudentEnrollment {
  id: string;
  tenantId: string;
  studentId: string;
  academicYearId: string;
  gradeId: string;
  classId: string;
  admissionNumber: string;
  admissionDate: Date;
  status: EnrollmentStatus;
  previousSchool?: string;
  transferCertificate?: string;
  medicalInfo?: Record<string, any>;
  emergencyContacts: Array<{
    name: string;
    relationship: string;
    phone: string;
    email?: string;
    address?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export enum EnrollmentStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  TRANSFERRED = 'TRANSFERRED',
  GRADUATED = 'GRADUATED',
  DROPPED = 'DROPPED'
}

export interface Attendance {
  id: string;
  tenantId: string;
  studentId: string;
  classId: string;
  subjectId?: string;
  date: Date;
  status: AttendanceStatus;
  timeIn?: Date;
  timeOut?: Date;
  remarks?: string;
  markedByUserId: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  EXCUSED = 'EXCUSED',
  HALF_DAY = 'HALF_DAY'
}

export interface GradeRecord {
  id: string;
  tenantId: string;
  studentId: string;
  subjectId: string;
  assessmentId?: string;
  academicYearId: string;
  semesterId?: string;
  gradeType: GradeType;
  maxMarks: number;
  obtainedMarks: number;
  percentage: number;
  grade?: string;
  remarks?: string;
  gradedByUserId: string;
  gradedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum GradeType {
  QUIZ = 'QUIZ',
  ASSIGNMENT = 'ASSIGNMENT',
  MIDTERM = 'MIDTERM',
  FINAL = 'FINAL',
  PROJECT = 'PROJECT',
  PARTICIPATION = 'PARTICIPATION',
  OTHER = 'OTHER'
}

// Assessment & Examination Types

export interface Assessment {
  id: string;
  tenantId: string;
  title: string;
  description?: string;
  assessmentType: AssessmentType;
  subjectId: string;
  classId: string;
  totalMarks: number;
  passingMarks: number;
  duration?: number; // in minutes
  instructions?: string;
  scheduledDate?: Date;
  startTime?: Date;
  endTime?: Date;
  status: AssessmentStatus;
  createdByUserId: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum AssessmentType {
  QUIZ = 'QUIZ',
  ASSIGNMENT = 'ASSIGNMENT',
  MIDTERM_EXAM = 'MIDTERM_EXAM',
  FINAL_EXAM = 'FINAL_EXAM',
  PROJECT = 'PROJECT',
  PRACTICAL = 'PRACTICAL',
  ORAL = 'ORAL'
}

export enum AssessmentStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface Question {
  id: string;
  tenantId: string;
  assessmentId?: string;
  type: QuestionType;
  question: string;
  options?: Array<{
    id: string;
    text: string;
    isCorrect?: boolean;
  }>;
  correctAnswer?: string;
  marks: number;
  difficulty: DifficultyLevel;
  explanation?: string;
  tags: string[];
  createdByUserId: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TRUE_FALSE = 'TRUE_FALSE',
  SHORT_ANSWER = 'SHORT_ANSWER',
  ESSAY = 'ESSAY',
  FILL_IN_BLANK = 'FILL_IN_BLANK',
  MATCHING = 'MATCHING'
}

export enum DifficultyLevel {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD'
}

export interface AssessmentSubmission {
  id: string;
  tenantId: string;
  assessmentId: string;
  studentId: string;
  answers: Record<string, any>;
  score?: number;
  percentage?: number;
  submittedAt?: Date;
  autoGraded: boolean;
  manualReview: boolean;
  feedback?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportCard {
  id: string;
  tenantId: string;
  studentId: string;
  academicYearId: string;
  semesterId?: string;
  overallGrade?: string;
  overallPercentage?: number;
  rank?: number;
  totalStudents?: number;
  attendance?: {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    percentage: number;
  };
  remarks?: string;
  teacherComments?: string;
  principalComments?: string;
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Communication & Messaging Types

export interface Message {
  id: string;
  tenantId: string;
  fromUserId: string;
  toUserIds: string[];
  subject?: string;
  content: string;
  messageType: MessageType;
  priority: Priority;
  readBy: string[];
  attachments: Array<{
    id: string;
    name: string;
    url: string;
    size: number;
    mimeType: string;
  }>;
  parentId?: string;
  sentAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum MessageType {
  DIRECT = 'DIRECT',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  BROADCAST = 'BROADCAST',
  SYSTEM = 'SYSTEM'
}

export enum Priority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export interface Notification {
  id: string;
  tenantId: string;
  userId: string;
  title: string;
  content: string;
  type: NotificationType;
  data?: Record<string, any>;
  read: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum NotificationType {
  ASSIGNMENT = 'ASSIGNMENT',
  GRADE = 'GRADE',
  ATTENDANCE = 'ATTENDANCE',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  PAYMENT = 'PAYMENT',
  EVENT = 'EVENT',
  SYSTEM = 'SYSTEM'
}

// Timetable & Scheduling Types

export interface TimeSlot {
  id: string;
  tenantId: string;
  name: string;
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  dayOfWeek: number; // 1-7 (Monday-Sunday)
  isBreak: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimetableEntry {
  id: string;
  tenantId: string;
  classId: string;
  subjectId?: string;
  teacherId?: string;
  timeSlotId: string;
  roomId?: string;
  dayOfWeek: number; // 1-7 (Monday-Sunday)
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Room {
  id: string;
  tenantId: string;
  name: string;
  code?: string;
  roomType: RoomType;
  capacity?: number;
  location?: string;
  facilities: string[];
  isAvailable: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum RoomType {
  CLASSROOM = 'CLASSROOM',
  LAB = 'LAB',
  LIBRARY = 'LIBRARY',
  AUDITORIUM = 'AUDITORIUM',
  GYMNASIUM = 'GYMNASIUM',
  OFFICE = 'OFFICE',
  OTHER = 'OTHER'
}

// Financial Management Types

export interface FeeStructure {
  id: string;
  tenantId: string;
  name: string;
  academicYearId: string;
  gradeId?: string;
  feeType: FeeType;
  amount: number;
  dueDate?: Date;
  isRecurring: boolean;
  frequency?: Frequency;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum FeeType {
  TUITION = 'TUITION',
  ADMISSION = 'ADMISSION',
  LIBRARY = 'LIBRARY',
  LABORATORY = 'LABORATORY',
  SPORTS = 'SPORTS',
  TRANSPORT = 'TRANSPORT',
  EXAM = 'EXAM',
  LATE_FEE = 'LATE_FEE',
  OTHER = 'OTHER'
}

export enum Frequency {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  ANNUALLY = 'ANNUALLY'
}

export interface Payment {
  id: string;
  tenantId: string;
  studentId: string;
  feeStructureId: string;
  amount: number;
  paidAmount?: number;
  paymentDate?: Date;
  dueDate: Date;
  status: PaymentStatus;
  paymentMethod?: PaymentMethod;
  transactionId?: string;
  receiptNumber?: string;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  PARTIAL = 'PARTIAL',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

export enum PaymentMethod {
  CASH = 'CASH',
  CHEQUE = 'CHEQUE',
  CARD = 'CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  UPI = 'UPI',
  WALLET = 'WALLET',
  OTHER = 'OTHER'
}

// Event & Calendar Types

export interface CalendarEvent {
  id: string;
  tenantId: string;
  title: string;
  description?: string;
  eventType: CalendarEventType;
  startDate: Date;
  endDate?: Date;
  isAllDay: boolean;
  location?: string;
  organizer?: string;
  targetAudience: string[]; // roles, grades, classes
  attachments: Array<{
    id: string;
    name: string;
    url: string;
    size: number;
    mimeType: string;
  }>;
  isPublic: boolean;
  createdByUserId: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum CalendarEventType {
  ACADEMIC = 'ACADEMIC',
  EXAM = 'EXAM',
  HOLIDAY = 'HOLIDAY',
  SPORTS = 'SPORTS',
  CULTURAL = 'CULTURAL',
  MEETING = 'MEETING',
  OTHER = 'OTHER'
}

export * from './module';