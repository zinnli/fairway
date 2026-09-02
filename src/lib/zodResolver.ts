import type { FieldErrors, Resolver } from 'react-hook-form';
import type { ZodType } from 'zod';

/**
 * React Hook Form ↔ Zod 연결.
 * @hookform/resolvers를 새로 넣지 않으려고 직접 둔다 — 하는 일이 이게 전부다.
 * 필드당 첫 번째 오류만 쓴다. 화면에 한 줄만 붙기 때문이다.
 */
export function zodResolver<T extends Record<string, unknown>>(schema: ZodType<T>): Resolver<T> {
  return async (values) => {
    const result = schema.safeParse(values);
    if (result.success) return { values: result.data, errors: {} };

    const errors: Record<string, { type: string; message: string }> = {};
    for (const issue of result.error.issues) {
      const key = String(issue.path[0] ?? '');
      if (key && !errors[key]) errors[key] = { type: 'validation', message: issue.message };
    }
    return { values: {}, errors: errors as FieldErrors<T> };
  };
}
