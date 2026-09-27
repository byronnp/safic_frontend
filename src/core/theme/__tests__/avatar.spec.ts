import { describe, expect, it } from 'vitest';

import { colorAvatar, iniciales } from '../avatar';

describe('avatar', () => {
  it('toma las iniciales sin palabras menores', () => {
    expect(iniciales('Conjunto Jardines del Valle')).toBe('JV');
    expect(iniciales('María Rodríguez')).toBe('MR');
    expect(iniciales('Conjunto Los Arupos')).toBe('AR');
  });

  it('da siempre el mismo color al mismo id', () => {
    expect(colorAvatar(7)).toEqual(colorAvatar(7));
  });
});
