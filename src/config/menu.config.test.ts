import { describe, expect, it } from 'vitest';
import { MENU_SIDEBAR } from './menu.config';

function findGroup(title: string) {
  const facilities = MENU_SIDEBAR.find((item) => item.title === 'Facilities');
  return facilities?.children?.find((item) => item.title === title);
}

function findChildren(title: string) {
  return findGroup(title)?.children?.map((item) => item.title) ?? [];
}

describe('MENU_SIDEBAR — Facilities submenu order', () => {
  it('lists Halls / Settings first under Community Hall', () => {
    expect(findChildren('Community Hall')).toEqual(['Halls / Settings', 'Booking Calendar', 'Booking List']);
  });

  it('lists Closures / Settings first under Swimming Pool', () => {
    expect(findChildren('Swimming Pool')).toEqual([
      'Closures / Settings',
      'Pool Access',
      'Current Users',
      'Usage History',
    ]);
  });

  it('routes Halls / Settings and Closures / Settings to distinct paths, not the same shared URL', () => {
    const hallsSettings = findGroup('Community Hall')?.children?.find((item) => item.title === 'Halls / Settings');
    const closuresSettings = findGroup('Swimming Pool')?.children?.find((item) => item.title === 'Closures / Settings');

    expect(hallsSettings?.path).toBe('/facilities/community-hall/settings');
    expect(closuresSettings?.path).toBe('/facilities/swimming-pool/settings');
  });
});
