import { describe, expect, it } from 'vitest';
import { resolveHttpOperation, stripOperation } from './httpOperation';

describe('resolveHttpOperation', () => {
  it('treats a bare string arg (shorthand GET) as load', () => {
    expect(resolveHttpOperation('/api/v1/buildings')).toBe('load');
  });

  it('maps GET to load', () => {
    expect(resolveHttpOperation({ url: '/api/v1/buildings' })).toBe('load');
  });

  it('maps POST to save', () => {
    expect(resolveHttpOperation({ url: '/api/v1/buildings', method: 'POST' })).toBe('save');
  });

  it('maps PUT to update', () => {
    expect(resolveHttpOperation({ url: '/api/v1/facilities/1', method: 'PUT' })).toBe('update');
  });

  it('maps PATCH to update', () => {
    expect(resolveHttpOperation({ url: '/api/v1/platform/organizations/1', method: 'PATCH' })).toBe('update');
  });

  it('maps DELETE to delete', () => {
    expect(resolveHttpOperation({ url: '/api/v1/attachments/1', method: 'DELETE' })).toBe('delete');
  });

  it('classifies a GET with a truthy search param as search, not load', () => {
    expect(
      resolveHttpOperation({ url: '/api/v1/residents', method: 'GET', params: { search: 'ahsan' } }),
    ).toBe('search');
  });

  it('classifies a GET with a truthy searchText param as search', () => {
    expect(resolveHttpOperation({ url: '/api/v1/users', params: { searchText: 'admin' } })).toBe('search');
  });

  it('ignores an empty/whitespace-only search param — falls back to load', () => {
    expect(resolveHttpOperation({ url: '/api/v1/residents', params: { search: '  ' } })).toBe('load');
    expect(resolveHttpOperation({ url: '/api/v1/residents', params: { search: undefined } })).toBe('load');
  });

  it('classifies a POST to a /search path as search, not save — explicit intent overrides the verb', () => {
    expect(resolveHttpOperation({ url: '/api/v1/residents/search', method: 'POST' })).toBe('search');
  });

  it('does not treat every POST as search just because search text happens to be in the body', () => {
    expect(
      resolveHttpOperation({ url: '/api/v1/residents', method: 'POST', body: { search: 'ahsan' } }),
    ).toBe('save');
  });

  it('excludes session-lifecycle auth calls from the POST-save fallback', () => {
    expect(resolveHttpOperation({ url: '/api/v1/auth/login', method: 'POST' })).toBe('load');
    expect(resolveHttpOperation({ url: '/api/v1/auth/refresh', method: 'POST' })).toBe('load');
    expect(resolveHttpOperation({ url: '/api/v1/auth/logout', method: 'POST' })).toBe('load');
    expect(resolveHttpOperation({ url: '/api/v1/platform/auth/login', method: 'POST' })).toBe('load');
  });

  it('does not exclude other /auth/* routes that are genuine user-submitted mutations', () => {
    // PUT /auth/me ("Update Profile") and POST /auth/register ("Register Tenant") are explicitly
    // called out in the loader spec as Update/Save examples, not session lifecycle.
    expect(resolveHttpOperation({ url: '/api/v1/auth/me', method: 'PUT' })).toBe('update');
    expect(resolveHttpOperation({ url: '/api/v1/auth/register', method: 'POST' })).toBe('save');
  });

  it('lets an explicit operation override both the HTTP method and search detection', () => {
    expect(
      resolveHttpOperation({
        url: '/api/v1/payments/1/reverse',
        method: 'POST',
        operation: 'update',
      }),
    ).toBe('update');
  });
});

describe('stripOperation', () => {
  it('removes the operation field but keeps every other FetchArgs member', () => {
    const result = stripOperation({
      url: '/api/v1/payments/1/reverse',
      method: 'POST',
      body: { reason: 'duplicate' },
      headers: { 'X-Idempotency-Key': 'key-1' },
      operation: 'update',
    });

    expect(result).toEqual({
      url: '/api/v1/payments/1/reverse',
      method: 'POST',
      body: { reason: 'duplicate' },
      headers: { 'X-Idempotency-Key': 'key-1' },
    });
    expect(result).not.toHaveProperty('operation');
  });
});
