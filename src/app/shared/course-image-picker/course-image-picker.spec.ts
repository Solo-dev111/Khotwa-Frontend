import { isCourseImageUrlValid } from './course-image-picker';

describe('Course image URL validation', () => {
  it('permits an optional image and direct HTTP or HTTPS links', () => {
    expect(isCourseImageUrlValid(null)).toBe(true);
    expect(isCourseImageUrlValid('')).toBe(true);
    expect(isCourseImageUrlValid(' https://example.com/course.png ')).toBe(true);
    expect(isCourseImageUrlValid('http://localhost:5163/uploads/courses/example.webp')).toBe(true);
  });

  it('rejects non-web protocols and invalid links', () => {
    expect(isCourseImageUrlValid('not a url')).toBe(false);
    expect(isCourseImageUrlValid('javascript:alert(1)')).toBe(false);
    expect(isCourseImageUrlValid('file:///C:/photo.png')).toBe(false);
  });
});
