
import { Routes } from '@angular/router';

import { Home } from './pages/home/home';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';

import { Categories } from './pages/admin/categories/categories';
import { Users } from './pages/admin/users/users';
import { Courses as AdminCourses } from './pages/admin/courses/courses';
import { Orders } from './pages/admin/orders/orders';

import { Courses } from './pages/instructor/courses/courses';
import { Lessons } from './pages/instructor/lessons/lessons';

import { CourseDetails } from './pages/course-details/course-details';
import { MyCourses } from './pages/my-courses/my-courses';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [

  {
    path: '',
    component: Home,
    title: 'Khotwa - Home'
  },

  {
    path: 'login',
    component: Login,
    title: 'Khotwa - Login'
  },

  {
    path: 'register',
    component: Register,
    title: 'Khotwa - Register'
  },

  // ADMIN
  {
    path: 'admin/categories',
    component: Categories,
    canActivate: [roleGuard],
    data: { roles: ['Admin'] },
    title: 'Khotwa - Categories'
  },

  {
    path: 'admin/users',
    component: Users,
    canActivate: [roleGuard],
    data: { roles: ['Admin'] },
    title: 'Khotwa - Manage Users'
  },

  {
    path: 'admin/courses',
    component: AdminCourses,
    canActivate: [roleGuard],
    data: { roles: ['Admin'] },
    title: 'Khotwa - Manage Courses'
  },

  {
    path: 'admin/orders',
    component: Orders,
    canActivate: [roleGuard],
    data: { roles: ['Admin'] },
    title: 'Khotwa - Manage Orders'
  },

  // INSTRUCTOR
  {
    path: 'instructor/courses',
    component: Courses,
    canActivate: [roleGuard],
    data: { roles: ['Instructor'] },
    title: 'Khotwa - Instructor Courses'
  },

  {
    path: 'instructor/lessons',
    redirectTo: 'instructor/courses',
    pathMatch: 'full'
  },

  {
    path: 'instructor/courses/:courseId/lessons',
    component: Lessons,
    canActivate: [roleGuard],
    data: { roles: ['Instructor', 'Admin'] },
    title: 'Khotwa - Course Lessons'
  },

  // STUDENT
  {
    path: 'courses/:id',
    component: CourseDetails,
    title: 'Khotwa - Course Details'
  },

  {
    path: 'my-courses',
    component: MyCourses,
    canActivate: [roleGuard],
    data: { roles: ['Student'] },
    title: 'Khotwa - My Courses'
  },

  // NOT FOUND
  {
    path: '**',
    redirectTo: ''
  }

];
