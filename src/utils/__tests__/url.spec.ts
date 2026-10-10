import { describe, expect, it } from 'vitest';

import { urlSegura } from '../url';

describe('urlSegura', () => {
  it('acepta https y http solo en el equipo local', () => {
    expect(urlSegura('https://bucket.ejemplo.ec/a.jpg?firma=x')).toBe(
      'https://bucket.ejemplo.ec/a.jpg?firma=x',
    );
    expect(urlSegura('http://localhost:9100/a.jpg')).toBe('http://localhost:9100/a.jpg');
    expect(urlSegura('http://ejemplo.ec/a.jpg')).toBeNull();
  });

  it('rechaza esquemas peligrosos y vacíos', () => {
    expect(urlSegura('javascript:alert(1)')).toBeNull();
    expect(urlSegura('data:text/html,<script>1</script>')).toBeNull();
    expect(urlSegura('JaVaScRiPt:alert(1)')).toBeNull();
    expect(urlSegura('')).toBeNull();
    expect(urlSegura(null)).toBeNull();
    expect(urlSegura(undefined)).toBeNull();
  });
});
