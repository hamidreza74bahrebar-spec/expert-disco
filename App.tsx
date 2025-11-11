import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { initialClassroomsData, initialSchoolInfo, initialSettings, initialSubjectNames } from './constants';
import { Student, SchoolInfo, AppSettings, Classroom, EnrichedStudentData, SubjectClassMetrics } from './types';
import { calculateAllStudentMetrics, calculateSubjectClassMetrics } from './services/calculationService';

import GradesView from './components/GradesView';
import ReportCardView from './components/ReportCardView';
import RankingView from './components/RankingView';
import SubjectComparisonView from './components/SubjectComparisonView';
import SettingsView from './components/SettingsView';
import StudentChartSheetView from './components/StudentChartSheetView';
import ManageSavesModal from './components/ManageSavesModal';

import { Edit, FileText, BarChart3, TrendingUp, Sliders, Save, FolderOpen } from 'lucide-react';

type View = 'grades' | 'report-card' | 'ranking' | 'subject-comparison' | 'chart-sheet' | 'settings';

const App: React.FC = () => {
  const [classrooms, setClassrooms] = useState<Classroom[]>(() => {
    const saved = localStorage.getItem('classrooms_data');
    return saved ? JSON.parse(saved) : initialClassroomsData;
  });
  const [activeClassroomId, setActiveClassroomId] = useState<string>(classrooms[0]?.id || '');
  
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo>(() => {
    const saved = localStorage.getItem('school_info');
    return saved ? JSON.parse(saved) : initialSchoolInfo;
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('app_settings');
    const parsed = saved ? JSON.parse(saved) : initialSettings;
    // Ensure availableFonts is always populated
    if (!parsed.availableFonts || parsed.availableFonts.length === 0) {
      parsed.availableFonts = initialSettings.availableFonts;
    }
    return parsed;
  });

  const [activeView, setActiveView] = useState<View>('grades');
  const [subjectNames, setSubjectNames] = useState<string[]>(() => {
      const saved = localStorage.getItem('subject_names');
      return saved ? JSON.parse(saved) : initialSubjectNames;
  });
  const [isSavesModalOpen, setIsSavesModalOpen] = useState(false);
  const [savedStatesList, setSavedStatesList] = useState<string[]>([]);

  const activeClassroom = useMemo(() => classrooms.find(c => c.id === activeClassroomId), [classrooms, activeClassroomId]);
  const activeStudents = useMemo(() => activeClassroom?.students || [], [activeClassroom]);

  const setStudentsForActiveClassroom = (newStudents: Student[] | ((prev: Student[]) => Student[])) => {
    setClassrooms(prevClassrooms => prevClassrooms.map(c => {
      if (c.id === activeClassroomId) {
        const students = typeof newStudents === 'function' ? newStudents(c.students) : newStudents;
        return { ...c, students };
      }
      return c;
    }));
  };

  const [subjectInclusion, setSubjectInclusion] = useState<{ [key: string]: boolean }>(() => {
      const saved = localStorage.getItem('subject_inclusion');
      if (saved) return JSON.parse(saved);
      const inclusion: { [key: string]: boolean } = {};
      subjectNames.forEach(name => {
          inclusion[name] = true;
      });
      return inclusion;
  });

  const enrichedStudentData = useMemo<EnrichedStudentData[]>(() => {
    return calculateAllStudentMetrics(activeStudents, subjectInclusion);
  }, [activeStudents, subjectInclusion]);

  const subjectClassMetrics = useMemo<SubjectClassMetrics[]>(() => {
      return calculateSubjectClassMetrics(activeStudents, subjectNames);
  }, [activeStudents, subjectNames]);

  useEffect(() => {
    document.documentElement.style.setProperty('--font-family-body', settings.fontFamilyBody);
    document.documentElement.style.setProperty('--font-family-heading', settings.fontFamilyHeading);
    document.documentElement.style.setProperty('--font-size-base', `${settings.baseFontSize}px`);
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('classrooms_data', JSON.stringify(classrooms));
    localStorage.setItem('school_info', JSON.stringify(schoolInfo));
    localStorage.setItem('app_settings', JSON.stringify(settings));
    localStorage.setItem('subject_names', JSON.stringify(subjectNames));
    localStorage.setItem('subject_inclusion', JSON.stringify(subjectInclusion));
    localStorage.setItem('active_classroom_id', activeClassroomId);
  }, [classrooms, schoolInfo, settings, subjectNames, subjectInclusion, activeClassroomId]);

  const handleSubjectNameChange = (subjectIndex: number, newName: string) => {
    const oldName = subjectNames[subjectIndex];
    const newSubjectNames = [...subjectNames];
    newSubjectNames[subjectIndex] = newName;
    setSubjectNames(newSubjectNames);

    setClassrooms(prev => prev.map(c => ({
        ...c,
        students: c.students.map(s => ({
            ...s,
            subjects: s.subjects.map(sub => sub.name === oldName ? { ...sub, name: newName } : sub)
        }))
    })));

    setSubjectInclusion(prev => {
        const newInclusion = { ...prev };
        if (oldName in newInclusion) {
            newInclusion[newName] = newInclusion[oldName];
            delete newInclusion[oldName];
        } else {
            newInclusion[newName] = true;
        }
        return newInclusion;
    });
  };
  
  const handleAddSubject = (subjectName: string) => {
    if(subjectNames.includes(subjectName)) {
        alert("درسی با این نام از قبل وجود دارد.");
        return;
    }
    const newSubjectNames = [...subjectNames, subjectName];
    setSubjectNames(newSubjectNames);

    setClassrooms(prev => prev.map(c => ({
        ...c,
        students: c.students.map(s => ({
            ...s,
            subjects: [...s.subjects, { name: subjectName, grades: Array(7).fill(null) }]
        }))
    })));

    setSubjectInclusion(prev => ({ ...prev, [subjectName]: true }));
  };
  
  const handleDeleteSubject = (subjectNameToDelete: string) => {
    setSubjectNames(prev => prev.filter(name => name !== subjectNameToDelete));

    setClassrooms(prev => prev.map(c => ({
        ...c,
        students: c.students.map(s => ({
            ...s,
            subjects: s.subjects.filter(sub => sub.name !== subjectNameToDelete)
        }))
    })));

    setSubjectInclusion(prev => {
        const newInclusion = { ...prev };
        delete newInclusion[subjectNameToDelete];
        return newInclusion;
    });
  };

  const handleStudentInclusionChange = (studentId: string, isIncluded: boolean) => {
    setStudentsForActiveClassroom(prev => prev.map(student => 
        student.id === studentId ? { ...student, includeInReportCard: isIncluded } : student
    ));
  };
  
  const handleSaveState = (name: string) => {
    const state = {
      classrooms,
      schoolInfo,
      settings,
      subjectNames,
      subjectInclusion,
      activeClassroomId,
    };
    localStorage.setItem(`saved_state_${name}`, JSON.stringify(state));
    updateSavedStatesList();
    alert(`وضعیت با نام "${name}" ذخیره شد.`);
  };

  const handleLoadState = (name: string) => {
    const savedState = localStorage.getItem(`saved_state_${name}`);
    if (savedState) {
      if (window.confirm(`آیا مطمئن هستید که می‌خواهید وضعیت "${name}" را بارگذاری کنید؟ تمام تغییرات فعلی از بین خواهند رفت.`)) {
        const state = JSON.parse(savedState);
        setClassrooms(state.classrooms);
        setSchoolInfo(state.schoolInfo);
        setSettings(state.settings);
        setSubjectNames(state.subjectNames);
        setSubjectInclusion(state.subjectInclusion);
        setActiveClassroomId(state.activeClassroomId);
        setIsSavesModalOpen(false);
        alert(`وضعیت "${name}" با موفقیت بارگذاری شد.`);
      }
    }
  };

  const handleDeleteState = (name: string) => {
    if (window.confirm(`آیا مطمئن هستید که می‌خواهید وضعیت ذخیره شده "${name}" را حذف کنید؟`)) {
      localStorage.removeItem(`saved_state_${name}`);
      updateSavedStatesList();
    }
  };
  
  const handleExportState = () => {
    const state = {
      classrooms,
      schoolInfo,
      settings,
      subjectNames,
      subjectInclusion,
      activeClassroomId,
    };
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const date = new Date().toLocaleDateString('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
    link.download = `grade_system_backup_${date}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  const handleImportState = (fileContent: string) => {
    try {
        const state = JSON.parse(fileContent);
        if (!state.classrooms || !state.schoolInfo || !state.settings || !state.subjectNames || !state.subjectInclusion || !state.activeClassroomId) {
            throw new Error('ساختار فایل نامعتبر است یا فایل کامل نیست.');
        }
        
        if (window.confirm(`آیا مطمئن هستید که می‌خواهید این وضعیت را بارگذاری کنید؟ تمام تغییرات فعلی از بین خواهند رفت.`)) {
            const parsedSettings = state.settings;
            if (!parsedSettings.availableFonts || parsedSettings.availableFonts.length === 0) {
              parsedSettings.availableFonts = initialSettings.availableFonts;
            }

            setClassrooms(state.classrooms);
            setSchoolInfo(state.schoolInfo);
            setSettings(parsedSettings);
            setSubjectNames(state.subjectNames);
            setSubjectInclusion(state.subjectInclusion);
            setActiveClassroomId(state.activeClassroomId);
            setIsSavesModalOpen(false);
            alert(`وضعیت با موفقیت از فایل بارگذاری شد.`);
        }
    } catch (e: any) {
        console.error("Error importing state:", e);
        alert(`خطا در بارگذاری فایل: ${e.message}`);
    }
  };

  const updateSavedStatesList = useCallback(() => {
    const keys = Object.keys(localStorage)
      .filter(key => key.startsWith('saved_state_'))
      .map(key => key.replace('saved_state_', ''));
    setSavedStatesList(keys);
  }, []);

  useEffect(() => {
    updateSavedStatesList();
  }, [updateSavedStatesList]);

  const navItems = [
    { id: 'grades', label: 'ورود نمرات', icon: Edit },
    { id: 'report-card', label: 'کارنامه', icon: FileText },
    { id: 'chart-sheet', label: 'کارنامه تحلیلی', icon: BarChart3 },
    { id: 'ranking', label: 'رتبه‌بندی', icon: TrendingUp },
    { id: 'subject-comparison', label: 'تحلیل دروس', icon: BarChart3 },
    { id: 'settings', label: 'تنظیمات', icon: Sliders },
  ];

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      <header className="bg-white shadow-md print:hidden">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-700">{schoolInfo.mainTitle}</h1>
          <div className="flex items-center gap-x-4">
             <select
                value={activeClassroomId}
                onChange={(e) => setActiveClassroomId(e.target.value)}
                className="p-2 border border-gray-300 bg-white rounded-md focus:ring-2 focus:ring-blue-500"
              >
                {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            <button onClick={() => setIsSavesModalOpen(true)} className="flex items-center gap-x-2 text-gray-600 hover:text-blue-600">
              <FolderOpen size={20} />
              <span>مدیریت</span>
            </button>
          </div>
        </div>
        <nav className="bg-gray-50 border-t border-b border-gray-200">
          <div className="container mx-auto px-4 flex justify-center items-center gap-x-2">
            {navItems.map(item => (
                <button
                    key={item.id}
                    onClick={() => setActiveView(item.id as View)}
                    className={`flex items-center gap-x-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors duration-200 ${
                        activeView === item.id
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-blue-500 hover:border-blue-300'
                    }`}
                >
                    <item.icon size={18} />
                    {item.label}
                </button>
            ))}
          </div>
        </nav>
      </header>
      <main className="container mx-auto p-4 md:p-6">
        {activeView === 'grades' && <GradesView students={enrichedStudentData} setStudents={setStudentsForActiveClassroom} subjectNames={subjectNames} onSubjectNameChange={handleSubjectNameChange} onAddSubject={handleAddSubject} onDeleteSubject={handleDeleteSubject} subjectInclusion={subjectInclusion} onSubjectInclusionChange={(name, included) => setSubjectInclusion(p => ({...p, [name]: included}))} onStudentInclusionChange={handleStudentInclusionChange} />}
        {activeView === 'report-card' && <ReportCardView students={enrichedStudentData.filter(s => s.includeInReportCard)} schoolInfo={schoolInfo} className={activeClassroom?.name || ''} settings={settings} setSettings={setSettings} />}
        {activeView === 'ranking' && <RankingView students={enrichedStudentData.filter(s => s.includeInReportCard)} />}
        {activeView === 'subject-comparison' && <SubjectComparisonView subjectMetrics={subjectClassMetrics} onDeleteSubject={handleDeleteSubject} />}
        {activeView === 'chart-sheet' && <StudentChartSheetView students={enrichedStudentData.filter(s => s.includeInReportCard)} schoolInfo={schoolInfo} className={activeClassroom?.name || ''} settings={settings} setSettings={setSettings} />}
        {activeView === 'settings' && <SettingsView schoolInfo={schoolInfo} setSchoolInfo={setSchoolInfo} settings={settings} setSettings={setSettings} />}
      </main>
      <ManageSavesModal
        isOpen={isSavesModalOpen}
        onClose={() => setIsSavesModalOpen(false)}
        savedStates={savedStatesList}
        onSave={handleSaveState}
        onLoad={handleLoadState}
        onDelete={handleDeleteState}
        onExport={handleExportState}
        onImport={handleImportState}
      />
    </div>
  );
};

export default App;
