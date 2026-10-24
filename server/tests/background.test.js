// Vercel runtime boundary
jest.mock('@vercel/functions', () => ({ waitUntil: jest.fn() }));
const { waitUntil } = require('@vercel/functions');
const { runInBackground } = require('../background');

beforeEach(() => {
  waitUntil.mockClear();
});

afterEach(() => {
  delete process.env.VERCEL;
});

describe('runInBackground', () => {
  test('on Vercel, hands the work to waitUntil', async () => {
    process.env.VERCEL = '1';
    const result = runInBackground(Promise.resolve('written'));

    expect(waitUntil).toHaveBeenCalledTimes(1);
    await expect(waitUntil.mock.calls[0][0]).resolves.toBe('written');
    await expect(result).resolves.toBe('written');
  });

  test('off Vercel, does not call waitUntil but still lets the work finish', async () => {
    const result = runInBackground(Promise.resolve('written'));

    expect(waitUntil).not.toHaveBeenCalled();
    await expect(result).resolves.toBe('written');
  });

  test('swallows a rejected write so logging can never fail a request', async () => {
    process.env.VERCEL = '1';
    const result = runInBackground(Promise.reject(new Error('DB down')));

    await expect(result).resolves.toBeUndefined();
    await expect(waitUntil.mock.calls[0][0]).resolves.toBeUndefined();
  });

  test('tolerates a non-promise value without throwing', async () => {
    process.env.VERCEL = '1';
    await expect(runInBackground(undefined)).resolves.toBeUndefined();
  });
});
