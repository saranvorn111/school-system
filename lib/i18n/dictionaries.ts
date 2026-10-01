/**
 * All translated text lives here. To translate more of the app:
 *   1. add a key to `en` (TypeScript then requires it in `km` too),
 *   2. use it with `const t = useT()` → `t("your.key")` in a client component,
 *      or `const t = await getT()` in a server component.
 */
export const locales = ["en", "km"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";
export const LOCALE_COOKIE = "locale";

export const localeNames: Record<Locale, string> = { en: "English", km: "ខ្មែរ" };

const en = {
  "app.name": "School System",

  // Portals and navigation
  "portal.admin": "Admin portal",
  "portal.teacher": "Teacher portal",
  "portal.student": "Student portal",
  "nav.group.admin": "Administration",
  "nav.group.teacher": "Teaching",
  "nav.group.student": "My studies",
  "nav.dashboard": "Dashboard",
  "nav.users": "Users",
  "nav.organization": "Departments & programs",
  "nav.academics": "Years & terms",
  "nav.courses": "Courses",
  "nav.sections": "Sections & enrollment",
  "nav.gradeApprovals": "Grade approvals",
  "nav.audit": "Audit log",
  "nav.reports": "Reports",
  "nav.myClasses": "My classes",
  "nav.timetable": "Timetable",
  "nav.attendance": "Attendance",
  "nav.grades": "Grades",

  // Breadcrumbs
  "crumb.admin": "Admin",
  "crumb.teacher": "Teacher",
  "crumb.student": "Student",
  "crumb.new": "New",
  "crumb.sections": "Sections",

  // Navbar
  "navbar.account": "My account",
  "navbar.logout": "Log out",
  "navbar.logoutFailed": "Couldn't log out. Please try again.",
  "navbar.theme": "Switch between light and dark theme",
  "navbar.language": "Language",
  "navbar.openMenu": "Open account menu",
  "navbar.notifications": "Notifications",
  "navbar.markAllRead": "Mark all as read",
  "navbar.noNotifications": "You have no notifications.",
  "banner.tempPassword": "You are using a temporary password.",
  "banner.changeNow": "Change it now",

  // Login
  "login.title": "Welcome back",
  "login.subtitle": "Log in with your email, student ID or employee ID.",
  "login.identifier": "Email or ID",
  "login.password": "Password",
  "login.submit": "Log in",
  "login.submitting": "Logging in…",
  "login.networkError": "Couldn't reach the server. Please try again.",
  "login.hero": "One place to run your school.",
  "login.feature1.title": "Attendance in seconds",
  "login.feature1.text": "Teachers mark a whole class with one tap.",
  "login.feature2.title": "Grades with approval",
  "login.feature2.text": "Draft, review, approve, then publish to students.",
  "login.feature3.title": "Secure by design",
  "login.feature3.text": "Every action is permission-checked and audited.",
  "login.audience": "Students · Teachers · Administrators",

  // Page titles and descriptions
  "page.adminDashboard.title": "Admin dashboard",
  "page.users.title": "Users",
  "page.users.description": "Admins, teachers and students who can sign in.",
  "page.newUser.title": "New user",
  "page.newUser.description": "A temporary password is generated. The user must change it at first login.",
  "page.organization.title": "Departments & programs",
  "page.organization.description": "The academic structure students and teachers belong to.",
  "page.academics.title": "Academic years & terms",
  "page.academics.description": "The current term is used for dashboards, timetables and new sections.",
  "page.courses.title": "Courses",
  "page.courses.description": "The course catalog. Sections are created per term from these courses.",
  "page.sections.title": "Sections & enrollment",
  "page.sections.description": "Class sections per term: schedule, teacher, room and students.",
  "page.gradeApprovals.title": "Grade approvals",
  "page.gradeApprovals.description": "Submitted grades wait here for approval, then for publishing to students.",
  "page.audit.title": "Audit log",
  "page.audit.description": "Every sensitive change: who, what, when, and the values before and after.",
  "page.reports.title": "Reports",
  "page.reports.description": "Enrollment, attendance and grade results per section, with students who need attention.",
  "page.teacherDashboard.title": "Teacher dashboard",
  "page.myClasses.title": "My classes",
  "page.myClasses.description": "Sections you teach. Open one to take attendance or enter grades.",
  "page.studentDashboard.title": "My dashboard",
  "page.timetable.title": "My timetable",
  "page.myAttendance.title": "My attendance",
  "page.myAttendance.description": "Present and late both count as attended.",
  "page.myGrades.title": "My grades",
  "page.myGrades.description": "Only grades that have been approved and published appear here.",
  "page.account.title": "My account",
  "page.account.description": "Your profile, password and signed-in devices.",
} as const;

export type TranslationKey = keyof typeof en;

const km: Record<TranslationKey, string> = {
  "app.name": "ប្រព័ន្ធគ្រប់គ្រងសាលា",

  "portal.admin": "ផ្នែកអ្នកគ្រប់គ្រង",
  "portal.teacher": "ផ្នែកគ្រូបង្រៀន",
  "portal.student": "ផ្នែកសិស្ស",
  "nav.group.admin": "រដ្ឋបាល",
  "nav.group.teacher": "ការបង្រៀន",
  "nav.group.student": "ការសិក្សារបស់ខ្ញុំ",
  "nav.dashboard": "ផ្ទាំងគ្រប់គ្រង",
  "nav.users": "អ្នកប្រើប្រាស់",
  "nav.organization": "ដេប៉ាតឺម៉ង់ និងកម្មវិធីសិក្សា",
  "nav.academics": "ឆ្នាំសិក្សា និងឆមាស",
  "nav.courses": "មុខវិជ្ជា",
  "nav.sections": "ថ្នាក់ និងការចុះឈ្មោះ",
  "nav.gradeApprovals": "ការអនុម័តពិន្ទុ",
  "nav.audit": "កំណត់ហេតុសវនកម្ម",
  "nav.reports": "របាយការណ៍",
  "nav.myClasses": "ថ្នាក់របស់ខ្ញុំ",
  "nav.timetable": "កាលវិភាគ",
  "nav.attendance": "វត្តមាន",
  "nav.grades": "ពិន្ទុ",

  "crumb.admin": "អ្នកគ្រប់គ្រង",
  "crumb.teacher": "គ្រូបង្រៀន",
  "crumb.student": "សិស្ស",
  "crumb.new": "បង្កើតថ្មី",
  "crumb.sections": "ថ្នាក់",

  "navbar.account": "គណនីរបស់ខ្ញុំ",
  "navbar.logout": "ចាកចេញ",
  "navbar.logoutFailed": "មិនអាចចាកចេញបានទេ។ សូមព្យាយាមម្តងទៀត។",
  "navbar.theme": "ប្ដូររវាងផ្ទៃភ្លឺ និងផ្ទៃងងឹត",
  "navbar.language": "ភាសា",
  "navbar.openMenu": "បើកម៉ឺនុយគណនី",
  "navbar.notifications": "ការជូនដំណឹង",
  "navbar.markAllRead": "សម្គាល់ថាបានអានទាំងអស់",
  "navbar.noNotifications": "អ្នកមិនមានការជូនដំណឹងទេ។",
  "banner.tempPassword": "អ្នកកំពុងប្រើពាក្យសម្ងាត់បណ្ដោះអាសន្ន។",
  "banner.changeNow": "ប្ដូរឥឡូវនេះ",

  "login.title": "សូមស្វាគមន៍",
  "login.subtitle": "ចូលប្រើដោយអ៊ីមែល អត្តលេខសិស្ស ឬអត្តលេខបុគ្គលិក។",
  "login.identifier": "អ៊ីមែល ឬអត្តលេខ",
  "login.password": "ពាក្យសម្ងាត់",
  "login.submit": "ចូលប្រើ",
  "login.submitting": "កំពុងចូល…",
  "login.networkError": "មិនអាចភ្ជាប់ទៅម៉ាស៊ីនមេបានទេ។ សូមព្យាយាមម្តងទៀត។",
  "login.hero": "កន្លែងតែមួយសម្រាប់គ្រប់គ្រងសាលារបស់អ្នក។",
  "login.feature1.title": "ស្រង់វត្តមានក្នុងរយៈពេលខ្លី",
  "login.feature1.text": "គ្រូអាចស្រង់វត្តមានទាំងថ្នាក់ដោយចុចតែម្តង។",
  "login.feature2.title": "ពិន្ទុមានការអនុម័ត",
  "login.feature2.text": "ព្រាង ពិនិត្យ អនុម័ត រួចផ្សព្វផ្សាយដល់សិស្ស។",
  "login.feature3.title": "សុវត្ថិភាពតាំងពីដំបូង",
  "login.feature3.text": "រាល់សកម្មភាពត្រូវបានពិនិត្យសិទ្ធិ និងកត់ត្រាទុក។",
  "login.audience": "សិស្ស · គ្រូបង្រៀន · អ្នកគ្រប់គ្រង",

  "page.adminDashboard.title": "ផ្ទាំងគ្រប់គ្រងរដ្ឋបាល",
  "page.users.title": "អ្នកប្រើប្រាស់",
  "page.users.description": "អ្នកគ្រប់គ្រង គ្រូបង្រៀន និងសិស្សដែលអាចចូលប្រើបាន។",
  "page.newUser.title": "អ្នកប្រើប្រាស់ថ្មី",
  "page.newUser.description": "ពាក្យសម្ងាត់បណ្ដោះអាសន្នត្រូវបានបង្កើត។ អ្នកប្រើត្រូវប្ដូរវានៅពេលចូលលើកដំបូង។",
  "page.organization.title": "ដេប៉ាតឺម៉ង់ និងកម្មវិធីសិក្សា",
  "page.organization.description": "រចនាសម្ព័ន្ធសិក្សាដែលសិស្ស និងគ្រូបង្រៀនស្ថិតនៅ។",
  "page.academics.title": "ឆ្នាំសិក្សា និងឆមាស",
  "page.academics.description": "ឆមាសបច្ចុប្បន្នត្រូវបានប្រើសម្រាប់ផ្ទាំងគ្រប់គ្រង កាលវិភាគ និងថ្នាក់ថ្មី។",
  "page.courses.title": "មុខវិជ្ជា",
  "page.courses.description": "បញ្ជីមុខវិជ្ជា។ ថ្នាក់ត្រូវបានបង្កើតតាមឆមាសពីមុខវិជ្ជាទាំងនេះ។",
  "page.sections.title": "ថ្នាក់ និងការចុះឈ្មោះ",
  "page.sections.description": "ថ្នាក់តាមឆមាស៖ កាលវិភាគ គ្រូបង្រៀន បន្ទប់ និងសិស្ស។",
  "page.gradeApprovals.title": "ការអនុម័តពិន្ទុ",
  "page.gradeApprovals.description": "ពិន្ទុដែលបានដាក់ស្នើរង់ចាំការអនុម័តនៅទីនេះ រួចផ្សព្វផ្សាយដល់សិស្ស។",
  "page.audit.title": "កំណត់ហេតុសវនកម្ម",
  "page.audit.description": "រាល់ការផ្លាស់ប្ដូរសំខាន់ៗ៖ នរណា អ្វី ពេលណា និងតម្លៃមុននិងក្រោយ។",
  "page.reports.title": "របាយការណ៍",
  "page.reports.description": "ការចុះឈ្មោះ វត្តមាន និងលទ្ធផលពិន្ទុតាមថ្នាក់ ព្រមទាំងសិស្សដែលត្រូវការការយកចិត្តទុកដាក់។",
  "page.teacherDashboard.title": "ផ្ទាំងគ្រប់គ្រងគ្រូបង្រៀន",
  "page.myClasses.title": "ថ្នាក់របស់ខ្ញុំ",
  "page.myClasses.description": "ថ្នាក់ដែលអ្នកបង្រៀន។ បើកថ្នាក់ណាមួយដើម្បីស្រង់វត្តមាន ឬបញ្ចូលពិន្ទុ។",
  "page.studentDashboard.title": "ផ្ទាំងរបស់ខ្ញុំ",
  "page.timetable.title": "កាលវិភាគរបស់ខ្ញុំ",
  "page.myAttendance.title": "វត្តមានរបស់ខ្ញុំ",
  "page.myAttendance.description": "មានវត្តមាន និងមកយឺត ត្រូវរាប់ថាបានចូលរៀន។",
  "page.myGrades.title": "ពិន្ទុរបស់ខ្ញុំ",
  "page.myGrades.description": "មានតែពិន្ទុដែលបានអនុម័ត និងផ្សព្វផ្សាយប៉ុណ្ណោះដែលបង្ហាញនៅទីនេះ។",
  "page.account.title": "គណនីរបស់ខ្ញុំ",
  "page.account.description": "ព័ត៌មានផ្ទាល់ខ្លួន ពាក្យសម្ងាត់ និងឧបករណ៍ដែលបានចូលប្រើ។",
};

export const dictionaries: Record<Locale, Record<TranslationKey, string>> = { en, km };

export const isLocale = (value: unknown): value is Locale => locales.includes(value as Locale);

export function translate(locale: Locale, key: TranslationKey) {
  return dictionaries[locale][key] ?? dictionaries[defaultLocale][key];
}
