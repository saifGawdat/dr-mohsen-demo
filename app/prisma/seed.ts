/**
 * Development seed: one admin from the environment, the settings row, and the
 * approved prototype content (12 specialties, the doctor directory, the
 * procedure accordion and the FAQ set). Safe to run more than once — every
 * write is an upsert on a natural key, and rows that are no longer part of the
 * approved content are pruned.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SPECIALTIES: {
  slug: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
}[] = [
  { slug: "dental", nameEn: "Dentistry", nameAr: "أسنان", descriptionEn: "Dentistry & oral surgery", descriptionAr: "أسنان وجراحة الفم" },
  { slug: "gyn", nameEn: "Gynaecology", nameAr: "نساء وتوليد", descriptionEn: "Gynaecology & fertility", descriptionAr: "نساء وتوليد وخصوبة" },
  { slug: "aesthetic", nameEn: "Aesthetics", nameAr: "تجميل", descriptionEn: "Aesthetic medicine & surgery", descriptionAr: "تجميل طبي وجراحي" },
  { slug: "ent", nameEn: "ENT", nameAr: "أنف وأذن", descriptionEn: "ENT & sinus surgery", descriptionAr: "أنف وأذن وجيوب أنفية" },
  { slug: "general", nameEn: "General surgery", nameAr: "جراحة عامة", descriptionEn: "General & laparoscopic", descriptionAr: "جراحة عامة ومناظير" },
  { slug: "ortho", nameEn: "Orthopaedics", nameAr: "عظام", descriptionEn: "Orthopaedics & joints", descriptionAr: "عظام ومفاصل" },
  { slug: "ophthal", nameEn: "Ophthalmology", nameAr: "عيون", descriptionEn: "Ophthalmology", descriptionAr: "طب العيون" },
  { slug: "derma", nameEn: "Dermatology", nameAr: "جلدية وليزر", descriptionEn: "Dermatology & laser", descriptionAr: "جلدية وليزر" },
  { slug: "peds", nameEn: "Paediatrics", nameAr: "أطفال", descriptionEn: "Paediatrics & neonatology", descriptionAr: "أطفال وحديثي الولادة" },
  { slug: "urology", nameEn: "Urology", nameAr: "مسالك بولية", descriptionEn: "Urology & lithotripsy", descriptionAr: "مسالك بولية وتفتيت حصوات" },
  { slug: "gastro", nameEn: "Endoscopy", nameAr: "مناظير وجهاز هضمي", descriptionEn: "Gastroenterology & endoscopy", descriptionAr: "جهاز هضمي ومناظير" },
  { slug: "pain", nameEn: "Pain clinic", nameAr: "عيادة علاج الألم", descriptionEn: "Pain management clinic", descriptionAr: "عيادة علاج الألم" },
];

const DOCTORS: {
  slug: string;
  nameEn: string;
  nameAr: string;
  titleEn: string;
  titleAr: string;
  specialty: string;
  cityEn?: string;
  cityAr?: string;
  experienceYears?: number;
  featured?: boolean;
  active?: boolean;
  order: number;
}[] = [
  {
    slug: "dr-mohsen",
    nameEn: "Dr. Mohsen Mamdouh",
    nameAr: "د. محسن ممدوح",
    titleEn: "Team lead · Anaesthesia & pain management",
    titleAr: "قائد الفريق · تخدير وعلاج ألم",
    specialty: "pain",
    featured: true,
    order: 0,
  },
  { slug: "ahmed-salem", nameEn: "Dr. Ahmed Salem", nameAr: "د. أحمد سالم", titleEn: "Oral & maxillofacial surgery", titleAr: "جراحة الفم والوجه والفكين", specialty: "dental", cityEn: "Surgical centre, Mansoura", cityAr: "مركز جراحي، المنصورة", experienceYears: 10, order: 1 },
  { slug: "heba-mansour", nameEn: "Dr. Heba Mansour", nameAr: "د. هبة منصور", titleEn: "Dentistry & orthodontics", titleAr: "أسنان وتقويم", specialty: "dental", cityEn: "Tanta", cityAr: "طنطا", experienceYears: 7, order: 2 },
  { slug: "karim-fouad", nameEn: "Dr. Karim Fouad", nameAr: "د. كريم فؤاد", titleEn: "Implantology", titleAr: "زراعة أسنان", specialty: "dental", cityEn: "Zagazig", cityAr: "الزقازيق", experienceYears: 9, order: 3 },
  { slug: "nourhan-ali", nameEn: "Dr. Nourhan Ali", nameAr: "د. نورهان علي", titleEn: "Gynaecology & obstetrics", titleAr: "نساء وتوليد", specialty: "gyn", cityEn: "Mansoura", cityAr: "المنصورة", experienceYears: 12, order: 4 },
  { slug: "maha-selim", nameEn: "Dr. Maha Selim", nameAr: "د. مها سليم", titleEn: "IVF & fertility", titleAr: "حقن مجهري وخصوبة", specialty: "gyn", cityEn: "Cairo", cityAr: "القاهرة", experienceYears: 8, order: 5 },
  { slug: "sara-abdullah", nameEn: "Dr. Sara Abdullah", nameAr: "د. سارة عبد الله", titleEn: "Non-surgical aesthetics", titleAr: "تجميل غير جراحي", specialty: "aesthetic", cityEn: "Cairo", cityAr: "القاهرة", experienceYears: 6, order: 6 },
  { slug: "omar-roshdy", nameEn: "Dr. Omar Roshdy", nameAr: "د. عمر رشدي", titleEn: "Plastic surgery", titleAr: "جراحة تجميل", specialty: "aesthetic", cityEn: "Cairo", cityAr: "القاهرة", experienceYears: 11, order: 7 },
  { slug: "mostafa-kamel", nameEn: "Dr. Mostafa Kamel", nameAr: "د. مصطفى كامل", titleEn: "Rhinology & sinus surgery", titleAr: "أنف وجيوب أنفية", specialty: "ent", cityEn: "Mansoura", cityAr: "المنصورة", experienceYears: 14, order: 8 },
  { slug: "rania-fathy", nameEn: "Dr. Rania Fathy", nameAr: "د. رانيا فتحي", titleEn: "Paediatric ENT", titleAr: "أنف وأذن للأطفال", specialty: "ent", cityEn: "Tanta", cityAr: "طنطا", experienceYears: 7, order: 9 },
  { slug: "khaled-ibrahim", nameEn: "Dr. Khaled Ibrahim", nameAr: "د. خالد إبراهيم", titleEn: "General & laparoscopic surgery", titleAr: "جراحة عامة ومناظير", specialty: "general", cityEn: "Mansoura", cityAr: "المنصورة", experienceYears: 15, order: 10 },
  { slug: "yasser-nabil", nameEn: "Dr. Yasser Nabil", nameAr: "د. ياسر نبيل", titleEn: "Gastroenterology & endoscopy", titleAr: "جهاز هضمي ومناظير", specialty: "gastro", cityEn: "Cairo", cityAr: "القاهرة", experienceYears: 9, order: 11 },
  { slug: "mona-hassan", nameEn: "Dr. Mona Hassan", nameAr: "د. منى حسن", titleEn: "Paediatrics", titleAr: "طب الأطفال", specialty: "peds", cityEn: "Tanta", cityAr: "طنطا", experienceYears: 10, order: 12 },
  // The prototype's specialty index counts one doctor in each of these four;
  // their profiles are staged until the real names are confirmed, so they
  // contribute to the count without appearing in the public directory.
  { slug: "tarek-adel", nameEn: "Dr. Tarek Adel", nameAr: "د. طارق عادل", titleEn: "Joint replacement", titleAr: "استبدال المفاصل", specialty: "ortho", cityEn: "Mansoura", cityAr: "المنصورة", experienceYears: 13, active: false, order: 13 },
  { slug: "hany-sameh", nameEn: "Dr. Hany Sameh", nameAr: "د. هاني سامح", titleEn: "Cataract & retina", titleAr: "الكاتاراكت والشبكية", specialty: "ophthal", cityEn: "Tanta", cityAr: "طنطا", experienceYears: 16, active: false, order: 14 },
  { slug: "dina-magdy", nameEn: "Dr. Dina Magdy", nameAr: "د. دينا مجدي", titleEn: "Dermatology & laser", titleAr: "جلدية وليزر", specialty: "derma", cityEn: "Cairo", cityAr: "القاهرة", experienceYears: 8, active: false, order: 15 },
  { slug: "sherif-gamal", nameEn: "Dr. Sherif Gamal", nameAr: "د. شريف جمال", titleEn: "Urology & lithotripsy", titleAr: "مسالك بولية وتفتيت حصوات", specialty: "urology", cityEn: "Mansoura", cityAr: "المنصورة", experienceYears: 12, active: false, order: 16 },
];

const PROCEDURES: {
  slug: string;
  nameEn: string;
  nameAr: string;
  category: string;
  descriptionEn: string;
  descriptionAr: string;
  durationEn: string;
  durationAr: string;
  anaesthesiaEn: string;
  anaesthesiaAr: string;
  stayEn: string;
  stayAr: string;
  includesEn: string[];
  includesAr: string[];
  order: number;
}[] = [
  {
    slug: "impacted-wisdom-tooth",
    nameEn: "Impacted wisdom tooth",
    nameAr: "ضرس العقل المدفون",
    category: "dental",
    descriptionEn: "Surgical removal of a buried or partially erupted wisdom tooth, with sedation for anxious patients.",
    descriptionAr: "خلع جراحي لضرس العقل المدفون أو المطمور جزئيًا، مع تسكين للحالات اللي بتخاف.",
    durationEn: "30–60 min",
    durationAr: "٣٠–٦٠ دقيقة",
    anaesthesiaEn: "Local, or light GA",
    anaesthesiaAr: "موضعي أو عام بسيط",
    stayEn: "Day case",
    stayAr: "بدون إقامة",
    includesEn: ["Assessment and X-ray before surgery", "Pain control plan for the days after"],
    includesAr: ["تقييم وأشعة قبل العملية", "خطة تسكين للأيام اللي بعدها"],
    order: 1,
  },
  {
    slug: "dental-implants",
    nameEn: "Dental implants",
    nameAr: "زراعة الأسنان",
    category: "dental",
    descriptionEn: "Single tooth or full-arch implants, planned on a CBCT scan before the day of surgery.",
    descriptionAr: "زراعة سن واحد أو الفك بالكامل، بخطة مبنية على أشعة مقطعية قبل يوم العملية.",
    durationEn: "45–90 min per stage",
    durationAr: "٤٥–٩٠ دقيقة للمرحلة",
    anaesthesiaEn: "Local + sedation",
    anaesthesiaAr: "موضعي + تسكين",
    stayEn: "Day case",
    stayAr: "بدون إقامة",
    includesEn: ["Scan-based surgical planning", "Anaesthetic assessment before each stage"],
    includesAr: ["تخطيط جراحي على الأشعة", "تقييم تخدير قبل كل مرحلة"],
    order: 2,
  },
  {
    slug: "rhinoplasty",
    nameEn: "Rhinoplasty",
    nameAr: "تجميل الأنف",
    category: "ent",
    descriptionEn: "Reshaping the nose for function or appearance, under general anaesthesia with monitoring throughout.",
    descriptionAr: "تعديل شكل الأنف أو تحسين التنفس، بتخدير عام ومراقبة كاملة خلال العملية.",
    durationEn: "2–3 hours",
    durationAr: "٢–٣ ساعات",
    anaesthesiaEn: "General",
    anaesthesiaAr: "عام",
    stayEn: "1 night",
    stayAr: "ليلة واحدة",
    includesEn: ["Pre-anaesthetic assessment and labs", "Post-operative pain and airway follow-up"],
    includesAr: ["تقييم تخدير وتحاليل قبل العملية", "متابعة الألم ومجرى التنفس بعد العملية"],
    order: 3,
  },
  {
    slug: "endoscopic-sinus-surgery",
    nameEn: "Endoscopic sinus surgery",
    nameAr: "منظار الجيوب الأنفية",
    category: "ent",
    descriptionEn: "Clearing blocked sinuses through the nose, with no external cuts.",
    descriptionAr: "تنظيف الجيوب الأنفية المسدودة من خلال الأنف، من غير أي جرح خارجي.",
    durationEn: "60–90 min",
    durationAr: "٦٠–٩٠ دقيقة",
    anaesthesiaEn: "General",
    anaesthesiaAr: "عام",
    stayEn: "1 night",
    stayAr: "ليلة واحدة",
    includesEn: ["CT review before the plan is set", "Controlled blood pressure during surgery"],
    includesAr: ["مراجعة الأشعة المقطعية قبل تحديد الخطة", "تحكم في ضغط الدم خلال العملية"],
    order: 4,
  },
  {
    slug: "diagnostic-hysteroscopy",
    nameEn: "Diagnostic hysteroscopy",
    nameAr: "منظار الرحم التشخيصي",
    category: "gyn",
    descriptionEn: "Looking inside the uterus to find the cause of bleeding or repeated miscarriage, with an anaesthetist present.",
    descriptionAr: "فحص تجويف الرحم لمعرفة سبب النزيف أو الإجهاض المتكرر، بحضور طبيب تخدير.",
    durationEn: "30 min",
    durationAr: "٣٠ دقيقة",
    anaesthesiaEn: "General or spinal",
    anaesthesiaAr: "عام أو نصفي",
    stayEn: "Day case",
    stayAr: "بدون إقامة",
    includesEn: ["Pre-operative labs reviewed", "Recovery-room supervision until stable"],
    includesAr: ["مراجعة التحاليل قبل الإجراء", "متابعة في الإفاقة لحد الاستقرار"],
    order: 5,
  },
  {
    slug: "liposuction-body-contouring",
    nameEn: "Liposuction & body contouring",
    nameAr: "شفط الدهون ونحت الجسم",
    category: "aesthetic",
    descriptionEn: "Removing stubborn fat from specific areas, with fluid balance and pain control handled by the anaesthetic team.",
    descriptionAr: "إزالة الدهون العنيدة من مناطق محددة، مع متابعة السوائل والألم من فريق التخدير.",
    durationEn: "2–4 hours",
    durationAr: "٢–٤ ساعات",
    anaesthesiaEn: "General or spinal",
    anaesthesiaAr: "عام أو نصفي",
    stayEn: "1 night",
    stayAr: "ليلة واحدة",
    includesEn: ["Cardiac and airway assessment beforehand", "Anti-nausea and pain plan afterwards"],
    includesAr: ["تقييم القلب ومجرى التنفس قبل العملية", "خطة لمنع الغثيان وتسكين الألم بعدها"],
    order: 6,
  },
  {
    slug: "laparoscopic-hernia-repair",
    nameEn: "Laparoscopic hernia repair",
    nameAr: "عملية الفتق بالمنظار",
    category: "general",
    descriptionEn: "Hernia repair through small openings, with a faster recovery than open surgery.",
    descriptionAr: "إصلاح الفتق من خلال فتحات صغيرة، وتعافي أسرع من الجراحة المفتوحة.",
    durationEn: "60–90 min",
    durationAr: "٦٠–٩٠ دقيقة",
    anaesthesiaEn: "General or spinal",
    anaesthesiaAr: "عام أو نصفي",
    stayEn: "1–2 nights",
    stayAr: "ليلة إلى ليلتين",
    includesEn: ["Ventilation managed for the gas used in laparoscopy", "Pain plan that allows early walking"],
    includesAr: ["إدارة التنفس مع الغاز المستخدم في المنظار", "خطة تسكين تسمح بالحركة المبكرة"],
    order: 7,
  },
  {
    slug: "gastroscopy-colonoscopy",
    nameEn: "Gastroscopy & colonoscopy",
    nameAr: "منظار المعدة والقولون",
    category: "gastro",
    descriptionEn: "Diagnostic or therapeutic endoscopy under sedation, with oxygen and breathing monitored.",
    descriptionAr: "منظار تشخيصي أو علاجي بتخدير خفيف، مع متابعة الأكسجين والتنفس.",
    durationEn: "30–45 min",
    durationAr: "٣٠–٤٥ دقيقة",
    anaesthesiaEn: "Light sedation",
    anaesthesiaAr: "تخدير خفيف",
    stayEn: "Same day",
    stayAr: "في نفس اليوم",
    includesEn: ["Fasting and medication instructions", "Escorted wake-up until fully alert"],
    includesAr: ["تعليمات الصيام والأدوية", "متابعة لغاية ما المريض يرجع فايق تمامًا"],
    order: 8,
  },
  {
    slug: "tonsils-adenoids",
    nameEn: "Tonsils & adenoids",
    nameAr: "اللوز واللحمية للأطفال",
    category: "peds",
    descriptionEn: "One of the most common childhood operations — planned around the child's weight and age.",
    descriptionAr: "من أشهر عمليات الأطفال — بخطة تخدير مبنية على وزن الطفل وسنه.",
    durationEn: "45 min",
    durationAr: "٤٥ دقيقة",
    anaesthesiaEn: "General (paediatric)",
    anaesthesiaAr: "عام (بروتوكول أطفال)",
    stayEn: "1 night",
    stayAr: "ليلة واحدة",
    includesEn: ["A parent stays with the child until sleep", "Fluid and pain plan for children"],
    includesAr: ["حد من الأهل مع الطفل لحد ما ينام", "خطة سوائل وتسكين مناسبة للأطفال"],
    order: 9,
  },
  {
    slug: "image-guided-pain-injections",
    nameEn: "Image-guided pain injections",
    nameAr: "حقن موجهة بالأشعة لعلاج الألم",
    category: "pain",
    descriptionEn: "Targeted injections for chronic back, neck and nerve pain, placed under imaging guidance.",
    descriptionAr: "حقن موجهة لعلاج ألم الظهر والرقبة والأعصاب المزمن، بتوجيه من الأشعة.",
    durationEn: "15–30 min",
    durationAr: "١٥–٣٠ دقيقة",
    anaesthesiaEn: "Local + light sedation",
    anaesthesiaAr: "موضعي + تخدير خفيف",
    stayEn: "Day case",
    stayAr: "بدون إقامة",
    includesEn: ["Full pain assessment before any injection", "Follow-up visit to measure the response"],
    includesAr: ["تقييم كامل للألم قبل أي حقن", "زيارة متابعة لقياس الاستجابة"],
    order: 10,
  },
];

const FAQS: { questionEn: string; questionAr: string; answerEn: string; answerAr: string; order: number }[] = [
  {
    questionEn: "How much does a procedure cost?",
    questionAr: "العملية بتتكلف كام؟",
    answerEn:
      "Procedure prices start from EGP 20,000. The exact price depends on the operation, the anaesthetic, the hospital and your medical history. Message us on WhatsApp at 0103 833 1309 with the procedure and any reports you have, and we will confirm the exact cost before you commit to anything.",
    answerAr:
      "أسعار العمليات بتبدأ من ٢٠ ألف جنيه. السعر النهائي بيتحدد حسب العملية، نوع التخدير، المستشفى، وتاريخك المرضي. ابعتلنا على واتساب 0103 833 1309 اسم العملية وأي تقارير معاك، وهنأكدلك التكلفة بالظبط قبل ما تلتزم بأي حاجة.",
    order: 1,
  },
  {
    questionEn: "Do I need a referral to book?",
    questionAr: "محتاج ورقة تحويل عشان أحجز؟",
    answerEn:
      "No. Book the specialty you need directly. If a referral or a specific scan would help, the team tells you after reading what you uploaded.",
    answerAr:
      "لأ. احجز التخصص اللي محتاجه مباشرة. ولو محتاج تحويل أو أشعة معينة، الفريق يقولك بعد ما يقرأ اللي رفعته.",
    order: 2,
  },
  {
    questionEn: "What can I upload, and how much?",
    questionAr: "أرفع إيه، وأد إيه؟",
    answerEn:
      "PDF, JPG or PNG — up to 10 files, 15 MB each. Labs, X-ray, CT, MRI, a discharge summary or a photo of a referral letter all work.",
    answerAr:
      "PDF أو JPG أو PNG — لحد ١٠ ملفات، ١٥ ميجا للملف. تحاليل، أشعة عادية، مقطعية، رنين، تقرير خروج، أو صورة ورقة تحويل — كله ينفع.",
    order: 3,
  },
  {
    questionEn: "How fast is the request confirmed?",
    questionAr: "الطلب بيتأكد في مدة قد إيه؟",
    answerEn:
      "During working hours, usually the same day. The team confirms the exact slot on WhatsApp once your file has been read — the time you pick online is a preference.",
    answerAr:
      "خلال ساعات العمل، وغالبًا في نفس اليوم. الفريق يأكد الموعد بالظبط على واتساب بعد ما يقرأ ملفك — والوقت اللي بتختاره أونلاين رغبة مبدئية.",
    order: 4,
  },
  {
    questionEn: "We are a hospital — how does team cover work?",
    questionAr: "إحنا مستشفى — تغطية الفريق بتمشي إزاي؟",
    answerEn:
      "Send the case mix, the dates and the expected volume. The team comes back with cover for your operating list, a member per room, and on-call readiness for what nobody scheduled.",
    answerAr:
      "ابعت نوع العمليات والتواريخ والعدد المتوقع. الفريق يرجعلك بتغطية لجدول عملياتك، وفرد لكل غرفة، وجاهزية على النداء للحالات اللي محدش بيجدولها.",
    order: 5,
  },
  {
    questionEn: "Is sedation safe for my child?",
    questionAr: "التسكين آمن لابني؟",
    answerEn:
      "Paediatric protocols are written around weight and age from infancy upwards, with monitoring matched to the child. That is a large part of what the team does every day.",
    answerAr:
      "بروتوكولات الأطفال مبنية على الوزن والسن من الرضاعة وفوق، مع مراقبة مناسبة للطفل. وده جزء كبير من شغل الفريق كل يوم.",
    order: 6,
  },
  {
    questionEn: "Can I change or cancel a request?",
    questionAr: "أقدر أغير أو ألغي الطلب؟",
    answerEn:
      "Yes — reply to the WhatsApp confirmation with your reference number, or send a new request and mention the old one. Nothing is charged for changing your mind.",
    answerAr:
      "أيوه — رد على رسالة التأكيد برقم طلبك، أو ابعت طلب جديد واذكر الطلب القديم. ومفيش أي رسوم لتغيير رأيك.",
    order: 7,
  },
];

async function main() {
  // Admin account — email and password from the environment, never committed.
  const email = (process.env.ADMIN_EMAIL ?? "admin@drmohsen.example").toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "change-me-now";
  const name = process.env.ADMIN_NAME ?? "Dr. Mohsen Mamdouh";

  await prisma.user.upsert({
    where: { email },
    update: { role: "ADMIN" },
    create: {
      email,
      name,
      role: "ADMIN",
      password: await bcrypt.hash(password, 10),
    },
  });

  // The single settings row. Environment values win so a deployment can update
  // contact details without a code change; the seed values are the live clinic
  // details, never the prototype placeholders.
  const settings = await prisma.settings.findFirst();
  const contact = {
    contactEmail: process.env.CONTACT_EMAIL ?? settings?.contactEmail ?? "info@drmohsen.example",
    contactPhone: process.env.CONTACT_PHONE ?? settings?.contactPhone ?? "0103 833 1309",
    whatsappNumber: process.env.WHATSAPP_NUMBER ?? settings?.whatsappNumber ?? "201038331309",
    openingHours: settings?.openingHours ?? "السبت للخميس، 10:00–20:00",
  };

  if (!settings) {
    await prisma.settings.create({
      data: {
        heroImageUrl: "/brand/dr-mohsen-suit.png",
        aboutImageUrl: "/brand/dr-mohsen-scrubs.png",
        ...contact,
      },
    });
  } else {
    await prisma.settings.update({ where: { id: settings.id }, data: contact });
  }

  // Specialties (natural key: slug). Prune rows from older seed rounds.
  for (const [index, s] of SPECIALTIES.entries()) {
    await prisma.specialty.upsert({
      where: { slug: s.slug },
      update: { ...s, order: index + 1 },
      create: { ...s, order: index + 1 },
    });
  }

  // Doctors (natural key: slug). Prune legacy demo profiles after inserting so
  // existing bookings keep their SetNull link rather than blocking the delete.
  for (const d of DOCTORS) {
    const specialty = await prisma.specialty.findUnique({ where: { slug: d.specialty } });
    const values = {
      nameEn: d.nameEn,
      nameAr: d.nameAr,
      titleEn: d.titleEn,
      titleAr: d.titleAr,
      cityEn: d.cityEn ?? null,
      cityAr: d.cityAr ?? null,
      experienceYears: d.experienceYears ?? null,
      featured: d.featured ?? false,
      active: d.active ?? true,
      order: d.order,
      specialtyId: specialty?.id ?? null,
    };

    await prisma.doctor.upsert({
      where: { slug: d.slug },
      update: values,
      create: { slug: d.slug, ...values },
    });
  }

  const doctorSlugs = DOCTORS.map((d) => d.slug);
  await prisma.doctor.deleteMany({ where: { slug: { notIn: doctorSlugs } } });

  const specialtySlugs = SPECIALTIES.map((s) => s.slug);
  await prisma.specialty.deleteMany({ where: { slug: { notIn: specialtySlugs } } });

  // Procedures (natural key: slug).
  for (const p of PROCEDURES) {
    await prisma.procedure.upsert({
      where: { slug: p.slug },
      update: p,
      create: p,
    });
  }
  await prisma.procedure.deleteMany({ where: { slug: { notIn: PROCEDURES.map((p) => p.slug) } } });

  // FAQs have no natural key, so match on the Arabic question and prune the
  // ones that are no longer part of the approved copy.
  for (const f of FAQS) {
    const existing = await prisma.faq.findFirst({ where: { questionAr: f.questionAr } });
    if (existing) {
      await prisma.faq.update({ where: { id: existing.id }, data: f });
    } else {
      await prisma.faq.create({ data: f });
    }
  }
  await prisma.faq.deleteMany({ where: { questionAr: { notIn: FAQS.map((f) => f.questionAr) } } });

  console.log("Seed complete: admin, settings, 12 specialties, doctors, procedures, FAQs.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => void prisma.$disconnect());
