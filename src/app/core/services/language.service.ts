
import {
  Injectable,
  signal,
  inject,
  afterNextRender
} from '@angular/core';

import {
  DOCUMENT,
  isPlatformBrowser
} from '@angular/common';

import { PLATFORM_ID } from '@angular/core';

type Language = 'ar' | 'en';

const translations = {
  ar: {
    brand: 'خُطوة',
    courses: 'الدورات',
    headline: 'تعلم شيئاً جديداً. كل يوم.',
    introduction: 'دورات في البرمجة والتصميم والمهارات الرقمية، يقدمها مدربون يساعدونك على التقدم.',
    catalog: 'استكشف الدورات',
    catalogDescription: 'ابحث عن المهارة التي تريد تعلمها.',
    search: 'ابحث عن دورة...',
    category: 'التصنيف',
    allCategories: 'جميع التصنيفات',
    level: 'المستوى',
    allLevels: 'كل المستويات',
    beginner: 'مبتدئ',
    intermediate: 'متوسط',
    advanced: 'متقدم',
    minPrice: 'أقل سعر',
    maxPrice: 'أعلى سعر',
    apply: 'بحث وتصفية',
    reset: 'مسح الفلاتر',
    loading: 'جاري تحميل الدورات...',
    empty: 'لا توجد دورات مطابقة لبحثك.',
    error: 'تعذر تحميل الدورات. تأكد من تشغيل الـ API.',
    retry: 'إعادة المحاولة',
    free: 'مجاني',
    lessons: 'دروس',
    instructor: 'المدرب',
    previous: 'السابق',
    next: 'التالي',
    page: 'صفحة',
    of: 'من',
    result: 'دورة',
    footer: 'خُطوة — تعلم على طريقتك',

    login: 'تسجيل الدخول',
    register: 'إنشاء حساب',
    logout: 'تسجيل الخروج',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    fullName: 'الاسم الكامل',
    student: 'طالب',
    instructorRole: 'مدرب',
    adminRole: 'أدمن (مدير النظام)',
    checkingRegistration: 'جاري التحقق من حالة التسجيل...',
    firstAdminHint: 'أنشئ حساب الأدمن أولاً لإدارة المنصة. يختفي هذا الخيار بمجرد تسجيل أي حساب.',
    adminUnavailable: 'لم يعد إنشاء أول حساب أدمن متاحاً.',
    accountType: 'نوع الحساب',
    loginTitle: 'مرحباً بعودتك',
    loginDescription: 'سجّل الدخول لمتابعة رحلتك التعليمية.',
    registerTitle: 'ابدأ رحلتك مع خُطوة',
    registerDescription: 'أنشئ حساباً وتعلّم أو شارك معرفتك مع الآخرين.',
    noAccount: 'ليس لديك حساب؟',
    haveAccount: 'لديك حساب بالفعل؟',
    createAccount: 'إنشاء الحساب',
    loggingIn: 'جاري تسجيل الدخول...',
    registering: 'جاري إنشاء الحساب...',
    invalidLogin: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
    emailExists: 'هذا البريد الإلكتروني مستخدم بالفعل.',
    authError: 'حدث خطأ في الاتصال بالخادم. حاول مجدداً.',
    passwordHint: '8 أحرف على الأقل',
    welcome: 'أهلاً'
  },
  en: {
    brand: 'Khotwa',
    courses: 'Courses',
    headline: 'Learn something new. Every day.',
    introduction: 'Courses in programming, design, and digital skills, taught by instructors who help you grow.',
    catalog: 'Explore courses',
    catalogDescription: 'Find the skill you want to learn.',
    search: 'Search courses...',
    category: 'Category',
    allCategories: 'All categories',
    level: 'Level',
    allLevels: 'All levels',
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
    minPrice: 'Minimum price',
    maxPrice: 'Maximum price',
    apply: 'Search & filter',
    reset: 'Clear filters',
    loading: 'Loading courses...',
    empty: 'No courses match your search.',
    error: 'Could not load courses. Check that the API is running.',
    retry: 'Try again',
    free: 'Free',
    lessons: 'lessons',
    instructor: 'Instructor',
    previous: 'Previous',
    next: 'Next',
    page: 'Page',
    of: 'of',
    result: 'courses',
    footer: 'Khotwa — Learn your way',

    login: 'Log in',
    register: 'Sign up',
    logout: 'Log out',
    email: 'Email address',
    password: 'Password',
    fullName: 'Full name',
    student: 'Student',
    instructorRole: 'Instructor',
    adminRole: 'Admin (Administrator)',
    checkingRegistration: 'Checking registration status...',
    firstAdminHint: 'Create the administrator first to manage the platform. This option disappears once any account exists.',
    adminUnavailable: 'Initial administrator registration is no longer available.',
    accountType: 'Account type',
    loginTitle: 'Welcome back',
    loginDescription: 'Sign in to continue your learning journey.',
    registerTitle: 'Begin your journey with Khotwa',
    registerDescription: 'Create an account to learn or share your knowledge.',
    noAccount: "Don't have an account?",
    haveAccount: 'Already have an account?',
    createAccount: 'Create account',
    loggingIn: 'Signing in...',
    registering: 'Creating account...',
    invalidLogin: 'Incorrect email or password.',
    emailExists: 'This email address is already registered.',
    authError: 'Could not connect to the server. Please try again.',
    passwordHint: 'At least 8 characters',
    welcome: 'Welcome'
  }
};

type TranslationKey = keyof typeof translations.ar;

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private document = inject(DOCUMENT);
  private platformId = inject(PLATFORM_ID);

  current = signal<Language>('ar');

  constructor() {
    afterNextRender(() => {
      const saved = localStorage.getItem('khotwa-language');
      this.setLanguage(saved === 'en' ? 'en' : 'ar');
    });
  }

  text(key: TranslationKey): string {
    return translations[this.current()][key];
  }

  formatCurrency(value: number): string {
    const amount = new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 2
    }).format(value);
    return this.current() === 'ar' ? `${amount} ر.ي` : `${amount} YER`;
  }

  currencyLabel(): string {
    return this.current() === 'ar' ? 'ر.ي' : 'YER';
  }

  setLanguage(language: Language): void {
    this.current.set(language);

    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('khotwa-language', language);
      this.document.documentElement.lang = language;
      this.document.documentElement.dir =
        language === 'ar' ? 'rtl' : 'ltr';
    }
  }

  toggle(): void {
    this.setLanguage(
      this.current() === 'ar' ? 'en' : 'ar'
    );
  }

  levelName(level: string): string {
    switch (level.toLowerCase()) {
      case 'beginner':
        return this.text('beginner');
      case 'intermediate':
        return this.text('intermediate');
      case 'advanced':
        return this.text('advanced');
      default:
        return level;
    }
  }
}
