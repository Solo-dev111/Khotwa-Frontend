import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LanguageService } from '../../core/services/language.service';
@Component({
 selector:'app-info', imports:[RouterLink],
 template:`<section class="info-page">
 @if (route.snapshot.data['page'] === 'about') {
 <span class="eyebrow">KHOTWA</span><h1>{{t('من نحن','About us')}}</h1>
 <p>{{t('خطوة منصة تعليمية تتيح للطلاب اكتشاف الدورات والتعلم من المدربين في مجالات متنوعة، وتساعد المدربين على تنظيم دوراتهم ومحتواها.','Khotwa is a learning platform where students discover courses and learn from instructors in different fields. Instructors can organize their courses and content.')}}</p>
 <h2>{{t('ماذا تقدم خطوة؟','What does Khotwa offer?')}}</h2>
 <p>{{t('البحث عن الدورات حسب المجال والمستوى والسعر، حفظ المفضلة، متابعة الدروس والحصول على شهادة بعد إكمال الدورة.','Search courses by category, level and price, save favorites, track lessons and earn a certificate on completion.')}}</p>
 <a routerLink="/" fragment="catalog">{{t('استكشف الدورات','Explore courses')}} ↗</a>
 } @else {
 <h1>{{t('الأسئلة الشائعة','Frequently asked questions')}}</h1>
 <section id="getting-started"><h2>{{t('كيف أبدأ التعلم؟','How do I start?')}}</h2><p>{{t('أنشئ حساب طالب أو سجّل الدخول، ثم اختر دورة من الصفحة الرئيسية وافتح تفاصيلها للتسجيل.','Create a student account or sign in, select a course from the home page and open its details to enroll.')}}</p></section>
 <details><summary>{{t('كيف أحفظ دورة؟','How do I save a course?')}}</summary><p>{{t('سجّل الدخول كطالب واضغط زر المفضلة، ثم ارجع إليها من صفحة المفضلة.','Sign in as a student, select the favorite button, then open your Favorites page.')}}</p></details>
 <details><summary>{{t('كيف أحصل على الشهادة؟','How do I get a certificate?')}}</summary><p>{{t('أكمل جميع دروس الدورة المسجل بها ثم افتح الشهادة من صفحة التفاصيل.','Complete all lessons in an enrolled course, then open the certificate from its details page.')}}</p></details>
 <details><summary>{{t('هل الدفع حقيقي؟','Is payment real?')}}</summary><p>{{t('الدفع في النسخة التعليمية الحالية تجريبي.','Payment in the current educational version is simulated.')}}</p></details>
 <a routerLink="/" fragment="catalog">{{t('استكشف الدورات','Explore courses')}} ↗</a>
 }
 </section>`,
 styles:[`.info-page{max-width:850px;margin:0 auto;padding:56px 24px 80px;line-height:1.9}.eyebrow{font-size:12px;color:var(--clay)}h1{font-size:clamp(30px,5vw,42px);margin:0 0 20px}h2{font-size:22px;margin-top:28px}p{color:var(--ink-soft)}details{border-top:1px solid var(--line);padding:15px 0}summary{cursor:pointer;font-weight:600}a{display:inline-block;color:var(--forest);font-weight:600;margin-top:20px}`]
})
export class Info {
 route=inject(ActivatedRoute);language=inject(LanguageService);
 t(ar:string,en:string){return this.language.current()==='ar'?ar:en;}
}
