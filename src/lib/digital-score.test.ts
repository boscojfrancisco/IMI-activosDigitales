import assert from 'node:assert/strict';
import test from 'node:test';
import catalog from '../data/digital-index-catalog.json';
import { initialVariableStatus, isNewerObservation, scoreLevels } from './digital-score';

const initial = Object.fromEntries(catalog.map(variable => [variable.id, initialVariableStatus(variable.id)]));
const allActive = Object.fromEntries(catalog.map(variable => [variable.id, 'activa' as const]));

test('initial coverage excludes B4, B5 and B6 and scales scores to 100', () => {
  const levels = Object.fromEntries(catalog.map(variable => [variable.id, 3]));
  const result = scoreLevels(levels, catalog, initial);
  assert.equal(result.maximoActivo, 88);
  assert.equal(result.total, 100);
  assert.equal(result.dimensionA, 100);
  assert.equal(result.dimensionB, 100);
});

test('inactive observations do not affect scores, and all-active reproduces raw points', () => {
  const levels = Object.fromEntries(catalog.map(variable => [variable.id, 0]));
  levels.A1 = 3;
  levels.B4 = 3;
  assert.equal(scoreLevels(levels, catalog, initial).total, 20 / 88 * 100);
  assert.equal(scoreLevels(levels, catalog, allActive).total, 26);
  assert.equal(scoreLevels(levels, catalog, allActive).maximoActivo, 100);
});

test('missing observations count as level zero without rounding intermediate results', () => {
  const result = scoreLevels({ B2: 1 }, catalog, initial);
  assert.equal(result.total, (8 / 3) / 88 * 100);
  assert.equal(result.dimensionB, (8 / 3) / 28 * 100);
  assert.equal(result.dimensionA, 0);
});

test('latest observation uses date, then visit source, then upload order', () => {
  const old = { id: 7, fechaObservacion: '2026-11-10', fuente: 'W' };
  assert.equal(isNewerObservation({ id: 8, fechaObservacion: '2026-11-11', fuente: 'S' }, old), true);
  assert.equal(isNewerObservation({ id: 6, fechaObservacion: '2026-11-10', fuente: 'V' }, old), true);
  assert.equal(isNewerObservation({ id: 9, fechaObservacion: '2026-11-10', fuente: 'S' }, old), true);
  assert.equal(isNewerObservation({ id: 10, fechaObservacion: '2026-11-09', fuente: 'V' }, old), false);
});
