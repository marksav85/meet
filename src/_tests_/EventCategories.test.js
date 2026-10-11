import { EVENT_CATEGORIES, getEventCategory } from '../event-categories';
import mockData from '../mock-data';

test.each(EVENT_CATEGORIES)('extracts $name from its description marker', ({ name }) => {
  expect(getEventCategory({ summary: 'Unrelated title', description: `Welcome!\nCategory: ${name}\nEvent information` })).toBe(name);
});
test('accepts case differences, surrounding spaces and Windows line endings', () => {
  expect(getEventCategory({ description: 'Welcome\r\n  category: cloud & devops  \r\nDetails' })).toBe('Cloud & DevOps');
});
test('recognizes Calendar HTML line breaks and ampersands', () => {
  expect(getEventCategory({ description: '<div>Welcome</div><div><b>Category:</b> AI &amp; Emerging Tech</div>' })).toBe('AI & Emerging Tech');
});
test.each([undefined, null, {}, { description: 42 }, { summary: 'React' }, { description: 'Category: Other' }, { description: 'Category:' }, { description: 'About Category: Web Development' }, { description: 'Category: Web Development\nCategory: Cloud & DevOps' }, { description: 'Category: Web Development\nCategory: Web Development' }])('ignores missing, invalid or ambiguous metadata: %p', (event) => {
  expect(getEventCategory(event)).toBeNull();
});
test('legacy mock fixtures remain categorized without title inference', () => {
  expect(mockData.every((event) => getEventCategory(event) === 'Web Development')).toBe(true);
});
