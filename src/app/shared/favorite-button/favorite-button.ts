import {Component,inject,input,afterNextRender} from '@angular/core';
import {FavoriteService} from '../../core/services/favorite.service';
import {AuthService} from '../../core/services/auth.service';
import {LanguageService} from '../../core/services/language.service';
@Component({selector:'app-favorite-button',template:`
@if(auth.currentUser()?.role === 'Student'){
<button type="button" [attr.aria-pressed]="favorites.has(courseId())" [attr.aria-label]="label()" [title]="label()" [disabled]="favorites.busy()" (click)="click()">
<svg viewBox="0 0 24 24" [attr.fill]="favorites.has(courseId()) ? 'currentColor' : 'none'" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></svg>
@if(showLabel()){<span>{{label()}}</span>}
</button>
}`,styles:[`:host{display:inline-block}button{display:inline-flex;align-items:center;justify-content:center;gap:8px;background:white;border:1px solid #d5ded4;color:#355b48;border-radius:7px;padding:9px 12px;font:inherit;cursor:pointer}button:disabled{opacity:.6}svg{width:20px;height:20px;stroke:currentColor;stroke-width:1.6;stroke-linejoin:round}button[aria-pressed=true]{color:#ad4949}:host(.wide) button{width:100%}`]})
export class FavoriteButton {
 courseId=input.required<number>();showLabel=input(false);
 auth=inject(AuthService);favorites=inject(FavoriteService);language=inject(LanguageService);
 constructor(){afterNextRender(()=>{if(this.auth.currentUser()?.role==='Student'&&!this.favorites.ready())this.favorites.load();});}
 label(){return this.favorites.has(this.courseId())?(this.language.current()==='ar'?'إزالة من المفضلة':'Remove favorite'):(this.language.current()==='ar'?'أضف إلى المفضلة':'Add to favorites');}
 click(){if(!this.favorites.ready())this.favorites.load();else this.favorites.toggle(this.courseId());}
}
