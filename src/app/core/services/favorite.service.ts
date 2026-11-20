import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../config/api.config';
import { Course } from './course.service';
import { AuthService } from './auth.service';

@Injectable({providedIn:'root'})
export class FavoriteService {
 private http=inject(HttpClient);
 private auth=inject(AuthService);
 private url=API_BASE_URL+'/Favorites';
 private owner=signal<number|null>(null);
 private saved=signal<Course[]>([]);
 private loaded=signal(false);
 private pending=signal(false);
 private error=signal(false);
 private version=0;
 private userId(){const u=this.auth.currentUser();return u?.role==='Student'?u.userId:null;}
 readonly courses=computed(()=>this.owner()===this.userId()?this.saved():[]);
 readonly busy=computed(()=>this.owner()===this.userId()&&this.pending());
 readonly ready=computed(()=>this.owner()===this.userId()&&this.loaded());
 readonly failed=computed(()=>this.owner()===this.userId()&&this.error());
 private scope():number|null {
   const id=this.userId();
   if(id!==this.owner()){this.version++;this.owner.set(id);this.saved.set([]);this.pending.set(false);this.error.set(false);this.loaded.set(false);}
   return id;
 }
 load():void {
   const id=this.scope();if(id===null||this.pending())return;
   const version=++this.version;this.pending.set(true);this.error.set(false);
   this.http.get<Course[]>(this.url).subscribe({
     next: courses=>{if(version!==this.version||id!==this.userId())return;this.saved.set(courses);this.loaded.set(true);this.pending.set(false);},
     error:()=>{if(version!==this.version||id!==this.userId())return;this.error.set(true);this.loaded.set(false);this.pending.set(false);}
   });
 }
 has(id:number):boolean {return this.courses().some(c=>c.id===id);}
 toggle(id:number):void {
   const owner=this.scope();if(owner===null||this.pending()||!this.loaded())return;
   const version=++this.version;this.pending.set(true);this.error.set(false);
   const req=this.has(id)?this.http.delete<void>(this.url+'/'+id):this.http.put<void>(this.url+'/'+id,{});
   req.subscribe({next:()=>{if(version!==this.version||owner!==this.userId())return;this.pending.set(false);this.load();},error:()=>{if(version!==this.version||owner!==this.userId())return;this.pending.set(false);this.error.set(true);}});
 }
}
