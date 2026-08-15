"use client";

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowRight, 
  Cpu, 
  Building2, 
  Clock, 
  BookOpen, 
  Briefcase, 
  Award, 
  Sparkles, 
  X, 
  Layers, 
  FileText,
  Activity,
  Scale
} from 'lucide-react';

const collegesDatabase: { [key: string]: any } = {
  "engineering": {
    name: "كلية الهندسة",
    theme: "indigo",
    glowColor: "bg-indigo-500/10",
    iconColor: "text-indigo-400",
    description: "تعد كلية الهندسة والعمارة من الكليات الرائدة بجامعة إب، حيث تقدم برامج أكاديمية متميزة تهدف إلى إعداد مهندسين ذوي كفاءة عالية قادرين على الابتكار وتشييد المستقبل الرقمي والعمراني.",
    careerPaths: [
      "مهندس أنظمة مدمجة وإنترنت الأشياء (IoT)",
      "مطور برمجيات متقدمة وحلول حوسبة سحابية",
      "أخصائي تصميم معماري وإظهار فني ثلاثي الأبعاد",
      "مدير تنفيذي للمشاريع الإنشائية والبنى التحتية بمحافظة إب"
    ],
    tabs: {
      "computer-control": {
        name: "هندسة الحاسبات والتحكم",
        icon: Cpu,
        headOfDept: "أ.د. محمد الشبيبي (مشرف أكاديمي رئيسي)",
        duration: 5,
        studyPlan: {
          1: [
            { code: "MATH101", name: "رياضيات عامة 1", hours: 3, preren: "لا يوجد", desc: "أساسيات التفاضل والتكامل، الدوال الرياضية وتطبيقاتها الهندسية." },
            { code: "PHYS101", name: "فيزياء عامة (كهرباء ومغناطيسية)", hours: 3, preren: "لا يوجد", desc: "دراسة الشحنات الكهربائية، قانون كولوم، والدوائر الكهربائية البسيطة." }
          ],
          2: [
            { code: "EE201", name: "دوائر كهربائية 1", hours: 3, preren: "PHYS101", desc: "تحليل الدوائر المستمرة والمترددة باستخدام نظريات شبكات التوصيل." }
          ],
          3: [
            { code: "EC301", name: "إلكترونيات تناظرية ورقمية", hours: 4, preren: "EE201", desc: "تصميم الدوائر باستخدام الترانزستور والدايود وبوابات المنطق الرقمية." }
          ],
          4: [
            { code: "CE402", name: "الأنظمة المدمجة وإنترنت الأشياء", hours: 4, preren: "EC301", desc: "برمجة المتحكمات الدقيقة لربط الحساسات الطرفية سحابياً بكفاءة." }
          ],
          5: [
            { code: "GP501", name: "مشروع التخرج الأكاديمي الموحد", hours: 6, preren: "إتمام 120 ساعة", desc: "تصميم وبناء نظام هندسي متكامل يحل مشكلة تقنية واقعية." }
          ]
        },
        gradProjects: [
          {
            title: "منصة جامعة إب الذكية (Ibb Smart University Platform)",
            designer: "م. محمد الشبيبي وفريقه الهندسي المتميز",
            desc: "نظام أكاديمي وسحابي متكامل يخدم الطلاب والكادر الأكاديمي عبر بوابات رصد تفاعلية، ومكتبة ذكية إلكترونية معززة بخصائص الأتمتة المبتكرة ورصد الدرجات حرارياً وبصرياً."
          }
        ]
      },
      "civil": {
        name: "الهندسة المدنية",
        icon: Building2,
        headOfDept: "أ.د. مهندس مدني خبير",
        duration: 5,
        studyPlan: {
          1: [{ code: "CIV101", name: "رسم هندسي AutoCAD", hours: 3, preren: "لا يوجد", desc: "أساسيات الإسقاط الهندسي والرسم ثنائي الأبعاد." }],
          5: [{ code: "CIV501", name: "تصميم الخرسانة المسلحة المتقدمة", hours: 4, preren: "إتمام المستويات السابقة", desc: "تصميم الأبراج المقاومة للرياح والزلازل." }]
        },
        gradProjects: [
          {
            title: "تصميم ودراسة إنشائية لبرج سكني مقاوم للهزات الأرضية في محافظة إب",
            designer: "خريجو الهندسة المدنية",
            desc: "دراسة إنشائية متكاملة لبرج مرتفع يتكون من 15 طابقاً مع فحص للتربة السائدة في المنحدرات الجبلية لمحافظة إب."
          }
        ]
      },
      "architecture": {
        name: "الهندسة المعمارية",
        icon: Building2,
        headOfDept: "أ.د. معمار مبتكر",
        duration: 5,
        studyPlan: {
          1: [{ code: "ARC101", name: "التصميم المعماري 1", hours: 4, preren: "لا يوجد", desc: "تنمية الخيال البصري وتصميم كتل فراغية أولية وتحليل المساحات الجمالية." }],
          5: [{ code: "ARC501", name: "العمارة المستدامة وتكنولوجيا البناء", hours: 5, preren: "إتمام المستويات السابقة", desc: "توظيف الطاقة الشمسية والعزل الحراري لتصميم مبانٍ صفرية الطاقة وصديقة للبيئة." }]
        },
        gradProjects: [
          {
            title: "تصميم المركز الثقافي البيئي الفاخر في محافظة إب",
            designer: "خريجو الهندسة المعمارية",
            desc: "مشروع ريادي يستلهم خطوطه من جبال وطبيعة محافظة إب الخضراء لتصميم مبنى صديق للبيئة يعتمد كلياً على الطاقة المتجددة ومواد البناء المحلية."
          }
        ]
      },
      "telecom": {
        name: "هندسة الاتصالات",
        icon: Cpu,
        headOfDept: "أ.د. مهندس اتصالات رقمي",
        duration: 5,
        studyPlan: {
          1: [{ code: "TEL101", name: "مبادئ هندسة الاتصالات والترددات", hours: 3, preren: "لا يوجد", desc: "أساسيات تعديل الإشارات والتعرف على نطاقات الطيف الراديوي." }],
          5: [{ code: "TEL501", name: "شبكات الجيل الخامس والألياف الضوئية", hours: 4, preren: "إتمام المستويات السابقة", desc: "دراسة معمارية الـ 5G وانتشار الموجات اللاسلكية وتصميم شبكات الفايبر المتقدمة." }]
        },
        gradProjects: [
          {
            title: "محاكاة وتحليل شبكة الاتصالات اللاسلكية الذكية لربط كليات جامعة إب",
            designer: "خريجو هندسة الاتصالات",
            desc: "بناء نموذج افتراضي يحاكي انتشار الإشارات وسرعات البث فائقة السرعة لربط الكليات ببعضها بأقل معدل تأخير."
          }
        ]
      }
    }
  },
  "medicine": {
    name: "كلية الطب والعلوم الصحية",
    theme: "emerald",
    glowColor: "bg-emerald-500/10",
    iconColor: "text-emerald-400",
    description: "تعتبر كلية الطب والعلوم الصحية بجامعة إب من أرقى الكليات الطبية في اليمن، حيث تلتزم بتوفير تعليم طبي متميز ومعتمد دولياً يسهم في رفع كفاءة النظام الصحي ورعاية المرضى.",
    careerPaths: [
      "طبيب بشري عام بالمستشفيات والعيادات الطبية",
      "أخصائي مختبرات طبية وتحاليل جزيئية متقدمة",
      "ممرض رعاية طوارئ وحالات حرجة بمراكز العناية الفائقة",
      "باحث أكاديمي في مجالات الطب السريري والوقائي"
    ],
    tabs: {
      "general-medicine": {
        name: "الطب البشري",
        icon: Activity,
        headOfDept: "أ.د. طبيب جراح متميز",
        duration: 7, 
        studyPlan: {
          1: [
            { code: "MED101", name: "علم التشريح البشري العام 1", hours: 4, preren: "لا يوجد", desc: "دراسة تفصيلية لهيكل وأعضاء جسم الإنسان والجهاز العضلي العظمي." },
            { code: "MED102", name: "علم وظائف الأعضاء (الفيزيولوجيا)", hours: 4, preren: "لا يوجد", desc: "فهم آليات عمل الأجهزة الحيوية المختلفة مثل القلب والتنفس." }
          ],
          4: [
            { code: "MED401", name: "علم الأمراض السريري (Pathology)", hours: 4, preren: "إتمام العلوم الأساسية", desc: "دراسة التغيرات النسيجية والخلية المسببة للأمراض المختلفة." }
          ],
          7: [
            { code: "MED701", name: "سنة الامتياز الطبي والتدريب العملي المكثف", hours: 12, preren: "إتمام كافة المستويات", desc: "تدريب سريري مكثف في أقسام الباطنية، الجراحة، والأطفال بالمستشفيات المعتمدة بإب." }
          ]
        },
        gradProjects: [
          {
            title: "دراسة سريرية حول انتشار وباء الكوليرا في المناطق الريفية لمحافظة إب",
            designer: "أطباء الامتياز المتميزين",
            desc: "بحث ميداني شامل لتقييم مصادر المياه وطرق الوقاية والحد من انتشار الأوبئة تحت إشراف هيئة مستشفى الثورة العام بإب."
          }
        ]
      },
      "labs": {
        name: "المختبرات الطبية",
        icon: Activity,
        headOfDept: "أ.د. محلل مخبري بارع",
        duration: 4, 
        studyPlan: {
          1: [{ code: "LAB101", name: "كيمياء حيوية عامة", hours: 3, preren: "لا يوجد", desc: "دراسة الجزيئات الحيوية والبروتينات والإنزيمات في الجسم البشري." }]
        },
        gradProjects: [
          {
            title: "تقييم دقة الفحوصات السريعة لتشخيص الملاريا مقارنة بالفحص المجهري التقليدي",
            designer: "خريجو علوم المختبرات",
            desc: "دراسة مقارنة لعينات دم حقيقية لتقييم جودة الفحوصات في مختبرات الصحة العامة بجامعة إب."
          }
        ]
      },
      "nursing": { // 🌟 إضافة قسم التمريض كاملاً هنا ليصبح متوفراً وبقوة!
        name: "التمريض",
        icon: Activity,
        headOfDept: "أ.د. أخصائي تمريض قدير",
        duration: 4, 
        studyPlan: {
          1: [
            { code: "NUR101", name: "أساسيات التمريض السريري 1", hours: 3, preren: "لا يوجد", desc: "مدخل تاريخي وتطبيقي لمهنة التمريض والمهارات الأساسية لرعاية المرضى ومراقبة العلامات الحيوية." }
          ],
          4: [
            { code: "NUR401", name: "تمريض الحالات الحرجة والطوارئ", hours: 4, preren: "إتمام المستويات السابقة", desc: "الرعاية المتقدمة لمرضى العناية المركزة وأقسام الحوادث والطوارئ." }
          ]
        },
        gradProjects: [
          {
            title: "تقييم وعي الكادر التمريضي حول مكافحة العدوى في غرف العمليات بمستشفيات إب",
            designer: "خريجو قسم التمريض المتميزين",
            desc: "دراسة ميدانية وتطبيقية لتقييم معايير التعقيم والجودة بداخل مشافي محافظة إب العامة لحماية سلامة المرضى."
          }
        ]
      }
    }
  },
  "dentistry": {
    name: "كلية طب وجراحة الفم والأسنان",
    theme: "sky",
    glowColor: "bg-sky-500/10",
    iconColor: "text-sky-400",
    description: "تقدم كلية طب وجراحة الفم والأسنان برامج تدريبية وعلمية مجهزة بأحدث العيادات والمعامل الرقمية لضمان تخريج أطباء أسنان قادرين على تقديم رعاية علاجية وتجميلية متطورة.",
    careerPaths: [
      "طبيب وجراح فم وأسنان متخصص",
      "أخصائي تقويم أسنان وعلاجات تحفظية تجميلية",
      "أخصائي جراحة الوجه والفكين وزراعة الأسنان الرقمية"
    ],
    tabs: {
      "dent-surgery": {
        name: "طب وجراحة الفم والأسنان",
        icon: Activity,
        headOfDept: "أ.د. جراح أسنان بارع",
        duration: 5, 
        studyPlan: {
          1: [
            { code: "DENT101", name: "تشريح الأسنان والوجه والفكين", hours: 3, preren: "لا يوجد", desc: "دراسة تفصيلية لبنية وتضاريس الأسنان البشرية ومحيطها التشريحي البشري." }
          ],
          5: [
            { code: "DENT501", name: "عيادات الجراحة والزراعة التدريبية", hours: 6, preren: "إتمام المستويات السابقة", desc: "تطبيق عملي مباشر في عيادات الكلية لعلاج المرضى وزراعة الأسنان تحت إشراف نخبة من الأطباء." }
          ]
        },
        gradProjects: [
          {
            title: "تصميم وتنفيذ حملة علاجية لتوعية وقاية أطفال المدارس في إب من تسوس الأسنان",
            designer: "خريجو كلية طب الأسنان",
            desc: "مشروع ميداني وتطبيقي قام بتقديم رعاية وقائية وتطبيق الفلورايد لأكثر من 500 طالب في مدارس مدينة إب."
          }
        ]
      }
    }
  },
  "admin": {
    name: "كلية العلوم الإدارية",
    theme: "amber",
    glowColor: "bg-amber-500/10",
    iconColor: "text-amber-400",
    description: "تسعى كلية العلوم الإدارية إلى تقديم تعليم ريادي متميز في مجالات إدارة الأعمال، المحاسبة، والعلوم المالية لرفد السوق المحلي بكوادر قيادية تدعم الاقتصاد الوطني والتطور المؤسسي.",
    careerPaths: [
      "مدير تنفيذي ومستشار إداري وتطوير أعمال للشركات",
      "محاسب قانوني ومدقق مالي خارجي معتمد للشركات والبنوك",
      "مخطط مالي وأخصائي استثمار وتحليل مخاطر بالبنوك الرقمية"
    ],
    tabs: {
      "bba": {
        name: "إدارة الأعمال",
        icon: Building2,
        headOfDept: "أ.د. إداري ومستشار متميز",
        duration: 4, 
        studyPlan: {
          1: [{ code: "MGT101", name: "مبادئ إدارة الأعمال الحديثة", hours: 3, preren: "لا يوجد", desc: "مفاهيم التخطيط، التنظيم، التوجيه، والرقابة بداخل المؤسسات التجارية." }],
          4: [{ code: "MGT401", name: "الإدارة الاستراتيجية وصناعة القرار", hours: 3, preren: "MGT101", desc: "رسم الخطط طويلة المدى للشركات وتحليل البيئة التنافسية الخارجية." }]
        },
        gradProjects: [
          {
            title: "خطة استراتيجية مقترحة لإدارة وتطوير المشاريع الصغيرة في محافظة إب سياحياً",
            designer: "خريجو قسم إدارة الأعمال",
            desc: "دراسة استقصائية لبناء دليل متكامل يهدف لدعم ريادة الأعمال السياحية للشباب في المحافظة الخضراء."
          }
        ]
      },
      "accounting": {
        name: "المحاسبة",
        icon: Building2,
        headOfDept: "أ.د. مدقق مالي خبير",
        duration: 4,
        studyPlan: {
          1: [{ code: "ACC101", name: "مبادئ المحاسبة المالية 1", hours: 3, preren: "لا يوجد", desc: "تسجيل العمليات المالية، دفاتر اليومية والاستاذ وإعداد القوائم الختامية." }]
        },
        gradProjects: [
          {
            title: "تطوير نظام محاسبي إلكتروني مقترح للمستشفيات والمراكز الطبية الحكومية في إب",
            designer: "خريجو قسم المحاسبة",
            desc: "تصميم دورة مستندية ومحاسبية رقمية تلائم الاحتياجات المالية للقطاع الصحي والمشافي العامة."
          }
        ]
      },
      "finance": {
        name: "العلوم المالية والمصرفية",
        icon: Building2,
        headOfDept: "أ.د. مستشار مالي ومصرفي",
        duration: 4,
        studyPlan: {
          1: [{ code: "FIN101", name: "مبادئ التمويل والاستثمار", hours: 3, preren: "لا يوجد", desc: "أساسيات التقييم المالي، القيمة الزمنية للنقود، ومبادئ الاستثمار في الأسهم والسندات." }]
        },
        gradProjects: [
          {
            title: "تقييم أداء البنوك الرقمية وتطبيقات الدفع الإلكتروني في السوق اليمني في إب",
            designer: "خريجو العلوم المالية والمصرفية",
            desc: "تحليل جودة وتحديات التحول الرقمي النقدي بداخل محافظة إب ومقارنتها بالبنوك التقليدية."
          }
        ]
      }
    }
  },
  "law": {
    name: "كلية الشريعة والقانون",
    theme: "purple",
    glowColor: "bg-purple-500/10",
    iconColor: "text-purple-400",
    description: "تلتزم كلية الشريعة والقانون بترسيخ المبادئ القانونية والفقهية المعتدلة، وتخريج كوادر قضائية وحقوقية قادرة على الدفاع عن الحقوق وتحقيق العدالة بضمير مهني يقظ.",
    careerPaths: [
      "محامٍ معتمد ومستشار قانوني رسمي للكيانات",
      "معاون قضائي أو باحث حقوقي في وزارة العدل والمحاكم",
      "أخصائي صياغة تشريعات وعقود وصفقات دولية ومحلية"
    ],
    tabs: {
      "sharia-law": {
        name: "الشريعة والقانون",
        icon: Scale,
        headOfDept: "أ.د. فقيه وقاضٍ متميز",
        duration: 4, 
        studyPlan: {
          1: [
            { code: "LAW101", name: "مدخل لدراسة الشريعة والقانون البشري", hours: 3, preren: "لا يوجد", desc: "التعريف بالقواعد القانونية والفرق بينها وبين القواعد الفقهية والدستورية." }
          ],
          4: [
            { code: "LAW401", name: "القانون الدولي العام والبحار", hours: 3, preren: "LAW101", desc: "دراسة المعاهدات الدولية، والسيادة والمنظمات العالمية والمحاكم الدولية." }
          ]
        },
        gradProjects: [
          {
            title: "مدى ملاءمة القوانين المحلية للتعامل مع الجرائم الإلكترونية الرقمية والابتزاز في اليمن",
            designer: "خريجو الشريعة والقانون",
            desc: "دراسة تحليلية تشريعية تهدف لاقتراح تعديلات ومواد قانونية صارمة لتأمين المجتمع رقمياً وحماية الخصوصية."
          }
        ]
      }
    }
  }
};

export default function CollegeDetailPage({ params }: { params: any }) {
  const resolvedParams = use<{ collegeId: string }>(params);
  const { collegeId } = resolvedParams;

  const router = useRouter();
  const college = collegesDatabase[collegeId];

  // الحالة للتحكم بالتبويب الفعال
  const [activeTab, setActiveTab] = useState<string>(
    college ? Object.keys(college.tabs)[0] : ""
  );
  const [activeLevel, setActiveLevel] = useState<number>(1);
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);

  // 🧠 ذكاء برمجي: قراءة التبويب المرسل من الرابط (Query Param) لتحديده فورياً عند فتح الصفحة
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const queryParams = new URLSearchParams(window.location.search);
      const tabParam = queryParams.get('tab');
      if (tabParam && college && college.tabs[tabParam]) {
        setActiveTab(tabParam);
      }
    }
  }, [college]);

  if (!college) {
    return (
      <div className="min-h-screen bg-[#F1F5F9] flex flex-col items-center justify-center text-center p-6" dir="rtl">
        <h2 className="text-lg font-black text-rose-600">⚠️ عذراً، الكلية المطلوبة غير موجودة بنظام جامعة إب حالياً!</h2>
        <Link href="/departments" className="mt-4 text-xs font-black bg-indigo-600 text-white px-6 py-3 rounded-xl shadow-md">
          العودة لدليل الكليات الرئيسي
        </Link>
      </div>
    );
  }

  const currentDept = college.tabs[activeTab] || Object.values(college.tabs)[0];
  const DeptIcon = currentDept?.icon || Cpu;

  const levelsArray = Array.from({ length: currentDept?.duration || 4 }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-800 flex flex-col justify-between font-sans relative overflow-hidden" dir="rtl">
      
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute w-[600px] h-[600px] rounded-full bg-sky-400/10 blur-[140px] top-[-10%] right-[-10%]" />
        <div className="absolute w-[500px] h-[500px] rounded-full bg-emerald-400/10 blur-[130px] bottom-[-10%] left-[-10%]" />
      </div>

      <div className="max-w-[1400px] w-full mx-auto px-4 py-8 relative z-10 flex-grow space-y-8">
        
        <div className="flex items-center justify-between">
          <Link 
            href="/departments" 
            className="text-xs font-black text-indigo-600 hover:text-indigo-700 bg-white border border-slate-200 hover:border-indigo-300 px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة لدليل الكليات الرئيسي</span>
          </Link>
          
          <div className="flex items-center gap-2 text-[10px] font-mono bg-white/60 text-slate-400 border px-3 py-1.5 rounded-xl font-bold select-none">
            {collegeId.toUpperCase()} COLLEGE // NODE SYSTEM v2.0
          </div>
        </div>

        <div className="border border-white/60 bg-[#0A2540] text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative overflow-hidden">
          <div className={`absolute w-64 h-64 rounded-full ${college.glowColor} blur-3xl -top-10 -left-10 pointer-events-none`} />
          
          <div className="space-y-2 relative z-10 text-right">
            <div className="flex items-center gap-2 text-sky-400 font-black text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>أقسام جامعة إب المعتمدة رسمياً</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">{college.name}</h1>
            <p className="text-xs text-slate-300 font-medium max-w-xl leading-relaxed">
              {college.description}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 relative z-10 select-none">
            {Object.keys(college.tabs).map((key) => {
              const TabIcon = college.tabs[key].icon || Cpu;
              return (
                <button
                  key={key}
                  onClick={() => {
                    setActiveTab(key);
                    setActiveLevel(1); 
                  }}
                  className={`text-xs font-black px-4 py-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === key 
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-md' 
                      : 'bg-white/10 border-white/5 hover:bg-white/15 text-slate-200'
                  }`}
                >
                  <TabIcon className="w-4 h-4" />
                  <span>{college.tabs[key].name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {currentDept ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            <div className="lg:col-span-1 space-y-6">
              <div className="border border-white/60 bg-white/50 backdrop-blur-xl rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-3 border-b pb-3 border-slate-200">
                  <div className={`p-3 bg-indigo-50 rounded-2xl border border-indigo-100 ${college.iconColor}`}>
                    <DeptIcon className="w-5 h-5" />
                  </div>
                  <div className="text-right">
                    <h2 className="text-sm font-black text-slate-900">{currentDept.name}</h2>
                    <p className="text-[10px] text-slate-400 font-mono">القسم: {currentDept.headOfDept}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 font-bold leading-relaxed text-right">
                  يركز تخصص {currentDept.name} بجامعة إب على إكساب الطالب المهارات النظرية والتطبيقية اللازمة لمواكبة احتياجات سوق العمل وتحقيق الريادة والتميز في هذا المجال.
                </p>
              </div>

              <div className="border border-white/60 bg-[#0B1528] text-white rounded-3xl p-6 shadow-md space-y-4 relative overflow-hidden">
                <div className="absolute w-24 h-24 rounded-full bg-indigo-500/10 blur-2xl top-0 left-0 pointer-events-none" />
                <div className="flex items-center gap-2 text-indigo-400 border-b border-slate-800 pb-3 justify-start">
                  <Briefcase className="w-4 h-4" />
                  <h3 className="text-xs font-black">أين سيعمل خريج هذا القسم؟</h3>
                </div>
                <ul className="space-y-2 text-right">
                  {college.careerPaths.map((career: string, idx: number) => (
                    <li key={idx} className="text-xs font-bold text-slate-300 flex items-start gap-2 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                      <span>{career}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-8">
              <div className="border border-white/60 bg-white/50 backdrop-blur-xl rounded-3xl p-6 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4 border-slate-200">
                  <div className="flex items-center gap-2 justify-start">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-xs font-black text-slate-900">الخطة الدراسية المعتمدة والتفاعلية للأعوام الدراسية</h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-1 select-none justify-end">
                    {levelsArray.map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => setActiveLevel(lvl)}
                        className={`text-[10px] font-black px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                          activeLevel === lvl 
                            ? 'bg-[#0A2540] border-[#0A2540] text-white shadow-sm' 
                            : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        مستوى {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentDept.studyPlan[activeLevel] && currentDept.studyPlan[activeLevel].length > 0 ? (
                    currentDept.studyPlan[activeLevel].map((course: any, idx: number) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedCourse(course)}
                        className="w-full text-right border border-slate-200/60 bg-white hover:border-indigo-500 hover:shadow-sm rounded-2xl p-4 transition-all flex flex-col justify-between items-start gap-3 group/course cursor-pointer"
                      >
                        <div className="w-full flex justify-between items-center">
                          <span className="text-[10px] font-mono font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                            {course.code}
                          </span>
                          <span className="text-[10px] font-black text-indigo-600 group-hover/course:translate-x-[-4px] transition-transform flex items-center gap-1">
                            <span>معاينة المنهج</span>
                            <ArrowRight className="w-3 h-3 rotate-180" />
                          </span>
                        </div>
                        <div>
                          <h4 className="font-black text-xs text-slate-900 line-clamp-1">{course.name}</h4>
                          <div className="flex items-center gap-3 mt-1 text-[10px] font-bold text-slate-400">
                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {course.hours} ساعات معتمدة</span>
                            <span>•</span>
                            <span>المتطلب: {course.preren}</span>
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="col-span-2 text-center py-6 text-slate-400 font-bold text-xs">
                      📖 المناهج المتبقية قيد المراجعة والاعتماد الفوري من مجلس الجامعة الأكاديمي.
                    </div>
                  )}
                </div>
              </div>

              {currentDept.gradProjects && currentDept.gradProjects.length > 0 && (
                <div className="border border-white/60 bg-white/50 backdrop-blur-xl rounded-3xl p-6 shadow-sm space-y-6">
                  <div className="flex items-center gap-2 border-b pb-4 border-slate-200 justify-start">
                    <Award className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-xs font-black text-slate-900">أبرز مشاريع التخرج المعتمدة بالقسم (لوحة شرف الخريجين)</h3>
                  </div>

                  <div className="space-y-4">
                    {currentDept.gradProjects.map((project: any, idx: number) => (
                      <div 
                        key={idx}
                        className="border border-slate-200/80 bg-white rounded-2xl p-5 space-y-3 relative overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                      >
                        {activeTab === 'computer-control' && idx === 0 && (
                          <span className="absolute top-0 left-0 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[8px] font-black px-3 py-1.5 rounded-br-2xl shadow-sm uppercase select-none animate-pulse">
                            ⭐ مـشـروع قـيـادي مـمـتـاز
                          </span>
                        )}

                        <div className="space-y-1 text-right">
                          <h4 className="font-black text-xs text-slate-900 flex items-center gap-1.5 justify-start">
                            <FileText className="w-4 h-4 text-indigo-600" />
                            <span>{project.title}</span>
                          </h4>
                          <p className="text-[10px] font-black text-indigo-600">من تصميم: {project.designer}</p>
                        </div>

                        <p className="text-xs text-slate-500 font-semibold leading-relaxed text-right">
                          {project.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400 font-bold">📭 لا يوجد تخصصات متوفرة حالياً في هذه الكلية.</div>
        )}
      </div>

      {selectedCourse && (
        <div className="fixed inset-0 bg-slate-950/80 z-[999] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl flex flex-col overflow-hidden shadow-2xl relative">
            <div className="bg-[#0A2540] px-6 py-5 flex justify-between items-center text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 text-sky-400 rounded-xl">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="text-right">
                  <h4 className="text-xs font-black">{selectedCourse.name}</h4>
                  <p className="text-[10px] text-slate-400 font-mono">رقم المادة: {selectedCourse.code} // IBB UNI</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedCourse(null)}
                className="p-2 rounded-xl bg-white/5 hover:bg-rose-600/20 hover:text-rose-400 text-slate-400 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-right">
              <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-500 select-none">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-black">الساعات المعتمدة:</p>
                  <p className="text-xs font-black text-[#0A2540] mt-0.5">{selectedCourse.hours} ساعات دراسية</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-black">المتطلب السابق للمادة:</p>
                  <p className="text-xs font-black text-indigo-600 mt-0.5">{selectedCourse.preren}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <h5 className="text-[10px] font-black text-slate-400 select-none">توصيف ونهج المادة الدراسي:</h5>
                <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                  {selectedCourse.desc}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-4 flex justify-end border-t border-slate-200/60 select-none">
              <button 
                type="button" 
                onClick={() => setSelectedCourse(null)}
                className="bg-[#0A2540] hover:opacity-95 text-white text-xs font-black px-5 py-2.5 rounded-xl shadow-sm cursor-pointer transition-all active:scale-95"
              >
                فهمت المنهج بالكامل
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="w-full py-4 text-center text-[10px] font-mono tracking-widest z-10 border-t border-white bg-white/80 backdrop-blur-md rounded-xl shadow-sm text-slate-400 select-none print:hidden">
        IBB UNIVERSITY ACADEMIC PORTAL SYSTEM v2.0.0
      </footer>
    </div>
  );
}