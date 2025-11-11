export interface Signature {
  name: string;
  title: string;
  enabled: boolean;
}

export interface SchoolInfo {
  mainTitle: string;
  name: string;
  reportCardTitle: string;
  gradeLevel: string;
  academicYear: string;
  principalMessage: string;
  signatures: Signature[];
}

export interface Subject {
  name: string;
  grades: (number | null)[];
}

export interface Student {
  id: string;
  name: string;
  subjects: Subject[];
  includeInReportCard: boolean;
}

export interface Classroom {
  id: string;
  name: string;
  students: Student[];
}

export interface AppSettings {
  fontFamilyBody: string;
  fontFamilyHeading: string;
  baseFontSize: number;
  reportCardTemplate: string;
  availableFonts: { name: string; value: string }[];
  showReportCardChart: boolean;
  reportCardChartHeight: number;
}

export interface EnrichedSubject extends Subject {
  average: number | null;
}

export interface EnrichedStudentData extends Student {
  subjects: EnrichedSubject[];
  totalAverage: number | null;
  rank: number | null;
}

export interface SubjectClassMetrics {
  name: string;
  average: number;
  min: number;
  max: number;
}
