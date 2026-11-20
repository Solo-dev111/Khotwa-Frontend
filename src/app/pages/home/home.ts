import { FavoriteButton } from '../../shared/favorite-button/favorite-button';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';

import {
  Component,
  inject,
  signal,
  afterNextRender
} from '@angular/core';

import { FormsModule } from '@angular/forms';

import { LanguageService } from '../../core/services/language.service';

import {
  CourseService,
  Course,
  Category
} from '../../core/services/course.service';

@Component({
  selector: 'app-home',
imports: [FormsModule, RouterLink, DecimalPipe, FavoriteButton],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {

  language = inject(LanguageService);
  private courseService = inject(CourseService);
  private route = inject(ActivatedRoute);

  // Reactive data
  courses = signal<Course[]>([]);
  categories = signal<Category[]>([]);

  loading = signal(true);
  error = signal(false);

  totalPages = signal(0);
  totalCount = signal(0);

  // Filters
  search = '';
  categoryId: number | null = null;
  level = '';
  minPrice: number | null = null;
  maxPrice: number | null = null;

  pageNumber = 1;
  pageSize = 6;

  constructor() {
    // Runs in browser after the initial render
    afterNextRender(() => {
      this.loadCategories();
      this.route.queryParamMap.subscribe(params => {
        const query = params.get('search');
        if (query !== null) this.search = query;
        this.pageNumber = 1;
        this.loadCourses();
      });
    });
  }

  loadCategories(): void {
    this.courseService.getCategories().subscribe({
      next: (response) => {
        this.categories.set(response.items);
      },
      error: (err) => {
        console.error('Categories error:', err);
      }
    });
  }

  loadCourses(): void {
    this.loading.set(true);
    this.error.set(false);

    this.courseService.getCourses({
      search: this.search,
      categoryId: this.categoryId,
      level: this.level,
      minPrice: this.minPrice,
      maxPrice: this.maxPrice,
      pageNumber: this.pageNumber,
      pageSize: this.pageSize
    }).subscribe({
      next: (response) => {
        this.courses.set(response.items);
        this.totalPages.set(response.totalPages);
        this.totalCount.set(response.totalCount);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Courses API error:', err);
        this.error.set(true);
        this.loading.set(false);
      }
    });
  }

  applyFilters(): void {
    this.pageNumber = 1;
    this.loadCourses();
  }

  resetFilters(): void {
    this.search = '';
    this.categoryId = null;
    this.level = '';
    this.minPrice = null;
    this.maxPrice = null;
    this.pageNumber = 1;

    this.loadCourses();
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;

    this.pageNumber = page;
    this.loadCourses();
  }

  selectCategory(categoryId: number): void {
    this.categoryId = this.categoryId === categoryId ? null : categoryId;
    this.applyFilters();
  }
  useFallback(event: Event): void {
    const image = event.target as HTMLImageElement;
    if (!image.src.endsWith('/images/course-cover.svg')) {
      image.src = '/images/course-cover.svg';
    }
  }
}
