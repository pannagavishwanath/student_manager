import { addDays } from '../utils/helpers.js';

const now = new Date().toISOString();

export const sampleTasks = [
  {
    taskId: 'task-1', userId: 'demo-user',
    title: 'DBMS Assignment 3: Normalization',
    description: 'Solve questions 1 to 10 on 1NF, 2NF, 3NF and BCNF.',
    subject: 'Database Systems', taskType: 'Assignment', priority: 'High',
    dueDate: addDays(-2), status: 'pending', createdAt: now, updatedAt: now,
  },
  {
    taskId: 'task-2', userId: 'demo-user',
    title: 'Data Structures Mid-Term Exam',
    description: 'Chapters 1 to 5: arrays, linked lists, stacks, queues, trees.',
    subject: 'Data Structures', taskType: 'Exam', priority: 'High',
    dueDate: addDays(2), status: 'pending', createdAt: now, updatedAt: now,
  },
  {
    taskId: 'task-3', userId: 'demo-user',
    title: 'Physics Lab Record',
    description: 'Complete the observation table and graph for Experiment 6.',
    subject: 'Physics', taskType: 'Assignment', priority: 'Medium',
    dueDate: addDays(0), status: 'pending', createdAt: now, updatedAt: now,
  },
  {
    taskId: 'task-4', userId: 'demo-user',
    title: 'Mini Project: Student Task Manager',
    description: 'Finish the React frontend and prepare the demo.',
    subject: 'Computer Science', taskType: 'Project', priority: 'High',
    dueDate: addDays(9), status: 'pending', createdAt: now, updatedAt: now,
  },
  {
    taskId: 'task-5', userId: 'demo-user',
    title: 'Revise Integration Formulas',
    description: '',
    subject: 'Mathematics', taskType: 'Study', priority: 'Low',
    dueDate: addDays(5), status: 'pending', createdAt: now, updatedAt: now,
  },
  {
    taskId: 'task-6', userId: 'demo-user',
    title: 'English Essay: Technology in Education',
    description: '800 words, submit as PDF.',
    subject: 'English', taskType: 'Assignment', priority: 'Medium',
    dueDate: addDays(14), status: 'pending', createdAt: now, updatedAt: now,
  },
  {
    taskId: 'task-7', userId: 'demo-user',
    title: 'Maths Quiz Preparation',
    description: 'Practice 20 problems from the quiz worksheet.',
    subject: 'Mathematics', taskType: 'Exam', priority: 'Medium',
    dueDate: addDays(-5), status: 'completed', createdAt: now, updatedAt: now,
  },
  {
    taskId: 'task-8', userId: 'demo-user',
    title: 'Library Book Return',
    description: '',
    subject: 'Other', taskType: 'Other', priority: 'Low',
    dueDate: addDays(-1), status: 'completed', createdAt: now, updatedAt: now,
  },
];

export const sampleMaterials = [
  {
    materialId: 'mat-1', userId: 'demo-user', taskId: 'task-1',
    fileName: 'DBMS_Assignment_3.pdf', fileType: 'application/pdf', fileSize: 482133,
    s3Key: 'sample/DBMS_Assignment_3.pdf', uploadedAt: now,
  },
  {
    materialId: 'mat-2', userId: 'demo-user', taskId: null,
    fileName: 'DataStructures_Notes.docx',
    fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    fileSize: 215040, s3Key: 'sample/DataStructures_Notes.docx', uploadedAt: now,
  },
];
