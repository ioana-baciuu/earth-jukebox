import { describe, expect, it } from 'vitest';
import { TEAM } from '@/lib/team';

describe('public team email ownership', () => {
  it.each([
    ['Stefania Pana', 'stefaniapana365@gmail.com'],
    ['Claudia Banesanu', 'claudia.banesanu@gmail.com'],
    ['Buescu Ana Maria', 'buescuanamaria21@gmail.com'],
    ['Ioana Baciu', 'ioana.baciu.iasi@gmail.com'],
  ])('pairs %s with the supplied email', (name, email) => {
    expect(TEAM.find(member => member.name === name)?.email).toBe(email);
  });
});