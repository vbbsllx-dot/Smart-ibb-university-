"use client";

import React, { useState } from 'react';
import { 
  TrendingUp, 
  SlidersHorizontal, 
  Award, 
  AlertTriangle, 
  Search, 
  Save, 
  FileSpreadsheet, 
  Printer, 
  CheckCircle,
  BookOpen,
  FileText,
  PlayCircle,
  Pencil,
  Trash2
} from 'lucide-react';

const departmentNamesMap: { [key: string | number]: string } = {
  1: 'هندسة الحاسبات والتحكم', 2: 'الهندسة المدنية', 3: 'الهندسة المعمارية', 4: 'هندسة الاتصالات',
  5: 'الطب البشري', 6: 'المختبرات الطبية', 7: 'التمريض', 8: 'طب وجراحة الفم والأسنان',
  9: 'الشريعة والقانون', 10: 'إدارة الأعمال', 11: 'المحاسبة', 12: 'العلوم المالية والمصرفية'
};

const levelNamesMap: { [key: string | number]: string } = {
  1: 'المستوى الأول', 2: 'المستوى الثاني', 3: 'المستوى الثالث', 4: 'المستوى الرابع', 5: 'المستوى الخامس'
};

interface StudentRosterTableProps {
  selectedResource: any;
  studentsRoster: any[];
  customColumns: string[];
  setCustomColumns: React.Dispatch<React.SetStateAction<string[]>>;
  cellData: any;
  setCellData: React.Dispatch<React.SetStateAction<any>>;
  onCellChange: (studentId: string, colName: string, value: string) => void;
  onSaveAllData: () => void;
  isSaving: boolean;
  onExportToExcel: () => void;
}

export default function StudentRosterTable({
  selectedResource,
  studentsRoster,
  customColumns,
  setCustomColumns,
  cellData,
  setCellData,
  onCellChange,
  onSaveAllData,
  isSaving,
  onExportToExcel
}: StudentRosterTableProps) {
  
  const [searchTerm, setSearchTerm] = useState('');
  const [newColumnName, setNewColumnName] = useState('');
  const [editingCol, setEditingCol] = useState<string | null>(null);
  const [tempColName, setTempColName] = useState('');

  const handleRenameColumn = (oldName: string, newName: string) => {
    if (!newName.trim() || oldName === newName) return;
    if (customColumns.includes(newName.trim())) {
      alert('⚠️ هذا الاسم موجود بالفعل في الكشف!');
      return;
    }

    setCustomColumns(customColumns.map(c => c === oldName ? newName.trim() : c));

    setCellData((prev: any) => {
      const updated = { ...prev };
      Object.keys(updated).forEach(studentId => {
        if (updated[studentId][oldName] !== undefined) {
          updated[studentId][newName.trim()] = updated[studentId][oldName];
          delete updated[studentId][oldName]; 
        }
      });
      return updated;
    });
  };

  const handleAddColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColumnName.trim()) return;
    if (customColumns.includes(newColumnName.trim())) return alert('هذا العمود موجود مسبقاً!');
    setCustomColumns([...customColumns, newColumnName.trim()]);
    newColumnName === ''; 
    setNewColumnName('');
  };

  const handleAddTemplateColumn = (colName: string) => {
    if (customColumns.includes(colName)) return;
    setCustomColumns([...customColumns, colName]);
  };

  const filteredStudents = studentsRoster.filter(student => {
    return student.name.includes(searchTerm) || student.student_id.includes(searchTerm);
  });

  const computeClassStats = () => {
    if (customColumns.length === 0 || filteredStudents.length === 0) return null;
    const targetCol = customColumns[0];
    let totalScore = 0;
    let gradedCount = 0;
    let successCount = 0;
    let highest = 0;
    let lowest = 100;

    filteredStudents.forEach(s => {
      const val = cellData[s.student_id]?.[targetCol];
      if (val && !isNaN(Number(val))) {
        const score = Number(val);
        totalScore += score;
        gradedCount++;
        if (score >= 50) successCount++;
        if (score > highest) highest = score;
        if (score < lowest) lowest = score;
      }
    });

    if (gradedCount === 0) return null;
    return {
      average: (totalScore / gradedCount).toFixed(1),
      successRate: ((successCount / gradedCount) * 100).toFixed(0),
      highest,
      lowest: lowest === 100 ? 0 : lowest,
      targetCol
    };
  };

  const classStats = computeClassStats();

  return (
    <section className="border border-white/60 bg-white/40 backdrop-blur-xl rounded-3xl shadow-md overflow-hidden print:border-none print:shadow-none print:bg-white animate-in fade-in duration-300 w-full">
      
      {/* 📊 لوحة الإحصائيات الفورية للمادة */}
      {selectedResource && selectedResource.resource_type === 'accredited_book' && classStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-gradient-to-r from-slate-900 to-[#0E3354] text-white border-b border-slate-700 select-none print:hidden">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl"><TrendingUp className="w-4 h-4" /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400">نسبة النجاح الفورية</p>
              <p className="text-sm font-black text-emerald-400">{classStats.successRate}%</p>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center gap-3">
            <div className="p-2 bg-sky-500/20 text-sky-400 rounded-xl"><SlidersHorizontal className="w-4 h-4" /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400">المعدل العام للدفعة</p>
              <p className="text-sm font-black text-sky-400">{classStats.average}</p>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl"><Award className="w-4 h-4" /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400">أعلى درجة مرصودة</p>
              <p className="text-sm font-black text-amber-400">{classStats.highest}</p>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center gap-3">
            <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl"><AlertTriangle className="w-4 h-4" /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400">أدنى درجة مرصودة</p>
              <p className="text-sm font-black text-rose-400">{classStats.lowest}</p>
            </div>
          </div>
        </div>
      )}

      {/* ترويسة الجدول مع محرك البحث */}
      <div className="bg-white/80 border-b border-slate-200/60 px-6 py-4 flex flex-col gap-4 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-3.5 rounded-full bg-sky-600" />
            <h3 className="text-xs font-black text-slate-900">
              {/* 💡 تم التعديل هنا لقراءة الحقل المحدث dep_id لعرض اسم القسم ديناميكياً وبدون تفجير الـ undefined */}
              {selectedResource ? `كشف طلاب: [ ${departmentNamesMap[Number(selectedResource.dep_id)] || departmentNamesMap[selectedResource.dep_id] || 'قسم الكلية'} - ${levelNamesMap[Number(selectedResource.level_id)] || levelNamesMap[selectedResource.level_id]} ]` : "كشف الطلاب المرن"}
            </h3>
          </div>

          {selectedResource && selectedResource.resource_type === 'accredited_book' && (
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder="ابحث بالاسم أو الرقم الأكاديمي..."
                className="w-full pl-3 pr-8 py-2 border border-slate-200 rounded-xl text-xs bg-white font-semibold focus:outline-none focus:border-indigo-500 shadow-inner text-right"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* أزرار القوالب الجاهزة للأعمدة */}
        {selectedResource && selectedResource.resource_type === 'accredited_book' && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 select-none">
            <span className="text-[10px] font-black text-slate-500">📋 قوالب رصد سريعة:</span>
            <button type="button" onClick={() => handleAddTemplateColumn("الحضور والغياب (10 درجات)")} className="text-[10px] font-black bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer">+ الحضور</button>
            <button type="button" onClick={() => handleAddTemplateColumn("الامتحان النصفي (20 درجة)")} className="text-[10px] font-black bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer">+ الامتحان النصفي</button>
            <button type="button" onClick={() => handleAddTemplateColumn("الواجبات والتقارير (10 درجات)")} className="text-[10px] font-black bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer">+ الواجبات</button>
            <button type="button" onClick={() => handleAddTemplateColumn("المجموع الإجمالي (100 درجة)")} className="text-[10px] font-black bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer">+ المجموع النهائي</button>
            
            <form onSubmit={handleAddColumn} className="mr-auto flex items-center gap-1">
              <input 
                type="text" 
                placeholder="عمود مخصص جديد..." 
                className="p-1.5 border border-slate-200 rounded-lg text-[10px] bg-white focus:outline-none font-semibold shadow-inner text-right"
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
              />
              <button type="submit" className="bg-[#0A2540] text-white text-[10px] font-black px-2.5 py-1.5 rounded-lg shadow-sm cursor-pointer hover:opacity-95">
                + إضافة
              </button>
            </form>
          </div>
        )}
      </div>

      {/* شريط الإجراءات والملفات */}
      {selectedResource && selectedResource.resource_type === 'accredited_book' && (
        <div className="bg-slate-50/80 border-b p-3 flex flex-wrap justify-between items-center gap-2 print:hidden select-none">
          <button 
            onClick={onSaveAllData} disabled={isSaving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
          >
            <Save className="w-4 h-4" /> {isSaving ? 'جاري المزامنة والحفظ...' : 'حفظ الكشف نهائياً بقاعدة البيانات'}
          </button>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={onExportToExcel}
              className="bg-white hover:bg-slate-100 text-slate-700 border text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> تصدير Excel
            </button>
            <button 
              onClick={() => window.print()}
              className="bg-white hover:bg-slate-100 text-slate-700 border text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-sky-600" /> طباعة كـ PDF
            </button>
          </div>
        </div>
      )}

      {/* الجدول الفعلي للطلاب */}
      {selectedResource && selectedResource.resource_type === 'accredited_book' ? (
        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full text-right text-xs print:text-slate-900 print:border-collapse print:border">
            <thead className="bg-white/60 text-slate-500 font-bold border-b border-slate-200/60 select-none print:bg-slate-100 print:text-slate-900">
              <tr className="print:border-b-2 print:border-slate-900">
                <th className="px-6 py-4 font-black text-slate-800 print:border print:p-2">الرقم الأكاديمي</th>
                <th className="px-6 py-4 font-black text-slate-800 print:border print:p-2">الأسماء</th>
                <th className="px-6 py-4 font-black text-slate-800 print:border print:p-2">المستوى</th>
                <th className="px-6 py-4 text-center font-black text-slate-800 print:border print:p-2">الحالة</th>
                
                {customColumns.map((col, index) => (
                  <th key={index} className="px-4 py-3 text-center text-sky-700 font-black border-r border-slate-200/60 bg-sky-50/30 relative group print:text-slate-900 print:bg-slate-100 print:border print:p-2">
                    
                    {editingCol === col ? (
                      <div className="flex items-center gap-1 justify-center print:hidden">
                        <input 
                          type="text"
                          value={tempColName}
                          onChange={(e) => setTempColName(e.target.value)}
                          className="p-1 text-[10px] border border-sky-400 rounded-md bg-white text-slate-800 focus:outline-none font-bold w-28 text-center shadow-inner"
                          autoFocus
                        />
                        <button 
                          type="button"
                          onClick={() => {
                            handleRenameColumn(col, tempColName);
                            setEditingCol(null);
                          }}
                          className="p-1 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-black transition-colors"
                        >
                          ✓
                        </button>
                        <button 
                          type="button"
                          onClick={() => setEditingCol(null)}
                          className="p-1 rounded bg-rose-100 hover:bg-rose-200 text-rose-700 font-black transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <span className="drop-shadow-sm">{col}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 print:hidden">
                          <button 
                            type="button"
                            onClick={() => {
                              setEditingCol(col);
                              setTempColName(col);
                            }}
                            className="p-1 rounded bg-sky-100 hover:bg-sky-200 text-sky-700 transition-colors cursor-pointer"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button 
                            type="button"
                            onClick={() => setCustomColumns(customColumns.filter(c => c !== col))}
                            className="p-1 rounded bg-rose-100 hover:bg-rose-200 text-rose-700 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                    <span className="hidden print:block">{col}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/40 font-medium bg-white/20 print:bg-white">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student, idx) => (
                  <tr key={idx} className="hover:bg-white/60 transition-colors print:hover:bg-white print:border-b">
                    <td className="px-6 py-4 font-mono font-black text-slate-600 print:border print:p-2 print:text-slate-900">{student.student_id}</td>
                    <td className="px-6 py-4 font-extrabold text-slate-900 print:border print:p-2">{student.name}</td>
                    {/* 💡 تعديل عرض المستوى ليقرأ الخارطة الرقمية لتجنب ظهور الأرقام الجافة في الكشوفات */}
                    <td className="px-6 py-4 text-slate-500 font-bold print:border print:p-2 print:text-slate-700">
                      {levelNamesMap[Number(student.level_id)] || student.level || `المستوى ${student.level_id}`}
                    </td>
                    <td className="px-6 py-4 text-center print:border print:p-2">
                      <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-3 py-1 rounded-full border border-emerald-100 print:bg-white print:text-slate-900 print:border-none">
                        {student.status || 'منتظم'}
                      </span>
                    </td>

                    {customColumns.map((col, index) => {
                      const cellValue = cellData[student.student_id]?.[col] || '';
                      
                      let heatmapClass = "bg-white text-slate-800 focus:border-sky-400";
                      if (cellValue !== '' && !isNaN(Number(cellValue))) {
                        const score = Number(cellValue);
                        if (score < 50 && score > 0) {
                          heatmapClass = "bg-rose-50/80 text-rose-700 border-rose-200 focus:border-rose-400 font-bold";
                        } else if (score >= 85) {
                          heatmapClass = "bg-emerald-50/80 text-emerald-700 border-emerald-200 focus:border-emerald-400 font-bold";
                        }
                      }

                      return (
                        <td key={index} className="px-2 py-2 border-r border-slate-200 text-center min-w-[130px] print:border print:p-2">
                          <input 
                            type="text" 
                            placeholder="..."
                            className={`w-full p-1.5 border border-slate-200 rounded-lg text-center shadow-inner focus:outline-none transition-all text-[11px] print:hidden ${heatmapClass}`}
                            value={cellValue}
                            onChange={(e) => onCellChange(student.student_id, col, e.target.value)}
                          />
                          <span className="hidden print:block font-black text-center">{cellValue || "---"}</span>
                        </td>
                      );
                    })}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4 + customColumns.length} className="text-center py-8 text-slate-400 font-bold">📭 لا يوجد نتائج مطابقة للبحث الحالي.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : selectedResource ? (
        <div className="text-center py-16 text-emerald-600 bg-emerald-50/40 border border-dashed border-emerald-200 rounded-2xl font-bold text-xs space-y-2 m-6 p-6 print:hidden">
          <p className="text-sm font-black flex items-center gap-2 justify-center">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span>تم بث الملف واقتناص الغلاف بنجاح لرفوف مكتبة الطلاب!</span>
          </p>
          <p className="text-[11px] text-slate-500 font-medium max-w-xl mx-auto leading-relaxed text-center">
            هذا المرجع مصنف كـ [ {selectedResource.resource_type === 'summary_pdf' ? '📖 mlخص PDF محاضرات' : '🎥 فيديو تعليمي مسجل'} ]. المواد المساعدة والإثرائية تفتح على شكل أغلفة تفاعلية ناصعة لدى الطلاب ولا تتطلب كشوفات حضور أو دفاتر رصد في لوحة الدكتور.
          </p>
        </div>
      ) : (
        <div className="text-center py-16 text-slate-400 bg-white/30 font-bold text-xs select-none space-y-2 print:hidden">
          <p>📥 شاشة المراقبة مغلقة حالياً.</p>
          <p className="text-[11px] text-slate-400 font-medium">الرجاء اختيار أو تحديد مادة واحدة من قائمة الكروت الدائرية الأنيقة أعلاه لتفعيل الرصد الفوري.</p>
        </div>
      )}
    </section>
  );
}