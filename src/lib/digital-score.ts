export type VariableStatus = 'activa' | 'en_relevamiento';
export type ScoredVariable = { id: string; dimension: string; points: number };
export type DatedObservation = { fechaObservacion: string; fuente: string; id: number };

export function isNewerObservation(candidate: DatedObservation, previous?: DatedObservation): boolean {
  if (!previous) return true;
  if (candidate.fechaObservacion !== previous.fechaObservacion) return candidate.fechaObservacion > previous.fechaObservacion;
  const candidateVisit = candidate.fuente === 'V';
  const previousVisit = previous.fuente === 'V';
  if (candidateVisit !== previousVisit) return candidateVisit;
  return candidate.id > previous.id;
}

export const initialVariableStatus = (id: string): VariableStatus =>
  ['B4', 'B5', 'B6'].includes(id) ? 'en_relevamiento' : 'activa';

export function scoreLevels(
  levels: Record<string, number>,
  variables: readonly ScoredVariable[],
  statuses: Record<string, VariableStatus>
) {
  const active = variables.filter(variable => statuses[variable.id] === 'activa');
  const maximoActivo = active.reduce((sum, variable) => sum + variable.points, 0);
  const byDimension = (dimension: string) => {
    const dimensionVariables = active.filter(variable => variable.dimension === dimension);
    const maximum = dimensionVariables.reduce((sum, variable) => sum + variable.points, 0);
    const obtained = dimensionVariables.reduce((sum, variable) => sum + variable.points * (levels[variable.id] ?? 0) / 3, 0);
    return maximum ? obtained / maximum * 100 : 0;
  };
  const obtained = active.reduce((sum, variable) => sum + variable.points * (levels[variable.id] ?? 0) / 3, 0);
  return {
    dimensionA: byDimension('A'),
    dimensionB: byDimension('B'),
    total: maximoActivo ? obtained / maximoActivo * 100 : 0,
    maximoActivo
  };
}
