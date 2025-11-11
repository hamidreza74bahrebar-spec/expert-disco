import { SchoolInfo, Student, Classroom, AppSettings } from './types';
import { v4 as uuidv4 } from 'uuid';
import { toPersianDigits } from './services/calculationService';

export const NUM_SUBJECTS = 20;
export const NUM_GRADES_PER_SUBJECT = 7;

export const initialAvailableFonts = [
    { name: 'وزیرمتن', value: "'Vazirmatn', sans-serif" },
    { name: 'تنها', value: "'Tanha', sans-serif" },
    { name: 'لاله‌زار (نسخ)', value: "'Lalezar', cursive" },
    { name: 'بی نازنین', value: "'B Nazanin', sans-serif" },
    { name: 'بی تیتر', value: "'B Titr', serif" },
];

export const reportCardTemplates = [
    { name: 'پیش‌فرض', value: 'default' },
    { name: 'مدرن', value: 'modern' },
    { name: 'رسمی', value: 'formal' },
];

export const initialSettings: AppSettings = {
    fontFamilyBody: initialAvailableFonts[0].value,
    fontFamilyHeading: initialAvailableFonts[2].value,
    baseFontSize: 14,
    reportCardTemplate: reportCardTemplates[0].value,
    availableFonts: initialAvailableFonts,
    showReportCardChart: true,
    reportCardChartHeight: 150,
};

export const initialSubjectNames = Array.from({ length: NUM_SUBJECTS }, (_, i) => `درس ${toPersianDigits(i + 1)}`);

export const initialSchoolInfo: SchoolInfo = {
  mainTitle: 'سیستم جامع مدیریت نمرات و کارنامه',
  name: 'دبیرستان البرز',
  reportCardTitle: 'کارنامه تحصیلی دبیرستان البرز',
  gradeLevel: 'دهم',
  academicYear: '۱۴۰۳-۱۴۰۴',
  principalMessage: 'با آرزوی موفقیت برای تمامی دانش‌آموزان عزیز.',
  signatures: [
    { name: 'نام مدیر', title: 'مدیر مدرسه', enabled: true },
    { name: 'نام معاون', title: 'معاون آموزشی', enabled: true },
    { name: 'نام معلم', title: 'معلم راهنما', enabled: true },
  ]
};

const generateRandomGrades = (): (number | null)[] => {
  return Array.from({ length: NUM_GRADES_PER_SUBJECT }, () => {
    // Some grades can be null
    if (Math.random() > 0.9) return null;
    return parseFloat((Math.random() * 10 + 10).toFixed(2)); // Grades between 10 and 20
  });
};

const createStudent = (name: string, subjectNames: string[]): Student => ({
  id: uuidv4(),
  name,
  subjects: subjectNames.map(subjectName => ({
    name: subjectName,
    grades: generateRandomGrades(),
  })),
  includeInReportCard: true,
});

const studentNamesBank = [
  'علی رضایی', 'مریم احمدی', 'رضا حسینی', 'فاطمه محمدی', 'حسن کریمی',
  'سارا علوی', 'مهدی نوری', 'زهرا قاسمی', 'امیر جعفری', 'نگار مرادی',
  'حسین اکبری', 'آتنا صالحی', 'کیان شریفی', 'یلدا محمودی', 'پویا عزیزی',
  'نیلوفر اسدی', 'ماهان تهرانی', 'ترانه سعیدی', 'عرفان گودرزی', 'هستی داوودی'
];

const createRandomStudent = (classIndex: number, studentIndex: number, subjectNames: string[]): Student => {
  const uniqueName = `${studentNamesBank[studentIndex % studentNamesBank.length]} (${toPersianDigits(classIndex + 1)}-${toPersianDigits(studentIndex + 1)})`;
  return createStudent(uniqueName, subjectNames);
};

export const initialClassroomsData: Classroom[] = Array.from({ length: 15 }, (_, i) => ({
  id: uuidv4(),
  name: `کلاس ${toPersianDigits(101 + i)}`,
  students: Array.from({ length: 5 }, (__, j) => createRandomStudent(i, j, initialSubjectNames)),
}));