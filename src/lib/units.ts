// The course's units, in teaching order. The sidebar and the home-page course path both group lessons this way.
import type { CourseBundle } from '../../shared/types.ts';

export interface Unit {
  title: string;
  ids: string[];
}

export const UNITS: Unit[] = [
  { title: 'Describing data', ids: ['01-data', '02-summary', '03-boxplots'] },
  { title: 'Probability', ids: ['04-events', '05-counting', '06-rules'] },
  { title: 'Discrete random variables', ids: ['07-expectation', '08-geometric', '09-binomial', '10-hypergeometric', '11-poisson'] },
  { title: 'Continuous random variables', ids: ['12-continuous', '13-gamma', '14-spread-rules', '15-mgf'] },
  { title: 'Several variables & estimation', ids: ['16-joint', '17-covariance', '18-regression', '19-estimation', '20-sampling'] },
];

/** Units with every lesson in the pack accounted for; anything new appears under "More". */
export function courseUnits(course: CourseBundle): Unit[] {
  const known = new Set(UNITS.flatMap((u) => u.ids));
  const extra = course.lessons.filter((l) => !known.has(l.id)).map((l) => l.id);
  return extra.length ? [...UNITS, { title: 'More', ids: extra }] : UNITS;
}
