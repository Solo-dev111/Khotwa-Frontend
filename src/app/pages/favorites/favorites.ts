import {Component,inject,afterNextRender} from '@angular/core';
import {RouterLink} from '@angular/router';
import {FavoriteService} from '../../core/services/favorite.service';
import {FavoriteButton} from '../../shared/favorite-button/favorite-button';
import {LanguageService} from '../../core/services/language.service';
@Component({selector:'app-favorites',imports:[RouterLink,FavoriteButton],template:`
<section class="favorites"><header><h1>{{t('المفضلة','Favorites')}}</h1><p>{{t('الدورات التي حفظتها للرجوع إليها لاحقاً.','Courses saved for later.')}}</p></header>
@if(service.failed()){<p role="alert">{{t('تعذر تحميل المفضلة','Could not load favorites')}}</p><button (click)="service.load()">{{t('إعادة المحاولة','Retry')}}</button>}
@else if(service.busy()){<p>{{t('جاري التحميل...','Loading...')}}</p>}
@else if(!service.courses().length){<p>{{t('لا توجد دورات محفوظة بعد.','No saved courses yet.')}}</p><a routerLink="/">{{t('استكشف الدورات','Explore courses')}}</a>}
@else{<div class="grid">@for(course of service.courses();track course.id){<article><a [routerLink]="['/courses',course.id]"><img [src]="course.thumbnailUrl || '/images/course-cover.svg'" (error)="fallback($event)" [alt]="course.title"/></a><app-favorite-button [courseId]="course.id"/><div class="info"><small>{{course.categoryName}}</small><h2>{{course.title}}</h2><p>{{course.instructorName}}</p><strong>{{language.formatCurrency(course.price)}}</strong><a [routerLink]="['/courses',course.id]">{{t('عرض التفاصيل','View course')}}</a></div></article>}</div>}
</section>`,styles:[`.favorites{max-width:1180px;margin:auto;padding:32px 24px 60px}.favorites h1{font-size:32px}.favorites header{margin-bottom:24px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:20px}article{position:relative;overflow:hidden;border:1px solid #d8ded5;border-radius:10px;background:white}img{width:100%;aspect-ratio:16/9;object-fit:cover;display:block}app-favorite-button{position:absolute;inset-block-start:12px;inset-inline-end:12px}.info{padding:18px}.info h2{font-size:19px;margin:8px 0}.info a{display:block;margin-top:12px;color:#355b48;font-weight:600}`]})
export class Favorites {
 service=inject(FavoriteService);language=inject(LanguageService);
 constructor(){afterNextRender(()=>this.service.load());}
 t(ar:string,en:string){return this.language.current()==='ar'?ar:en;}
 fallback(event:Event){const img=event.target as HTMLImageElement;if(!img.src.endsWith('/images/course-cover.svg'))img.src='/images/course-cover.svg';}
}
