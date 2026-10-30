// Unsubmitted answers, kept per question in localStorage so navigating away does not lose typed work.
// (Scratch work is stored on disk; this only covers the answer box until it is submitted.)
import { useCallback, useState } from 'react';
import { load, save } from './persist.ts';

type Drafts = Record<string, string>;

export function useAnswerDraft(qid: string): [string, (v: string) => void, () => void] {
  const [value, setValue] = useState<string>(() => load<Drafts>('answerDrafts', {})[qid] ?? '');
  const set = useCallback(
    (v: string) => {
      setValue(v);
      const all = load<Drafts>('answerDrafts', {});
      if (v) all[qid] = v;
      else delete all[qid];
      save('answerDrafts', all);
    },
    [qid],
  );
  const clear = useCallback(() => set(''), [set]);
  return [value, set, clear];
}
