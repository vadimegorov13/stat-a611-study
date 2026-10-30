import type { Target } from '../lib/targets.ts';
import { useNav } from '../state/nav.tsx';
import { LessonView } from '../views/LessonView.tsx';
import { PracticeView, QuestionView } from '../views/PracticeView.tsx';
import { DocView, GlossaryView, HomeView, IssuesView, LecturesView, LectureView, NotesView, ProgressView, ResourcesView } from '../views/OtherViews.tsx';
import { PdfViewer } from './PdfViewer.tsx';
import { NoteEditor } from './NoteEditor.tsx';
import { WebView } from './WebView.tsx';
import { QuickRef } from './QuickRef.tsx';
import { VizView } from '../views/VizView.tsx';

/** Render any target, either as the main view or inside a reference-pane tab. */
export function TargetView({ target, from }: { target: Target; from: 'main' | 'pane' }) {
  const { navigate, paneReplace } = useNav();
  switch (target.kind) {
    case 'home':
      return <HomeView />;
    case 'lesson':
      return <LessonView id={target.id} anchor={target.anchor} from={from} />;
    case 'lectures':
      return <LecturesView />;
    case 'lecture':
      return <LectureView id={target.id} from={from} />;
    case 'practice':
      return <PracticeView mode={target.mode} lessonId={target.lessonId} />;
    case 'question':
      return <QuestionView id={target.id} from={from} />;
    case 'notes':
      return <NotesView />;
    case 'note':
      return from === 'main' ? <NotesView id={target.id} /> : <NoteEditor id={target.id} from="pane" />;
    case 'progress':
      return <ProgressView />;
    case 'doc':
      return <DocView id={target.id} from={from} />;
    case 'issues':
      return <IssuesView from={from} />;
    case 'resources':
      return <ResourcesView from={from} />;
    case 'reference':
      return (
        <div className="reference-page">
          <h1>Formulas, notation &amp; notes</h1>
          <p className="muted small">
            Every formula from the lessons, study guides and formula reference, the course notation, distribution summaries, glossary terms, your starred items, and your notes.
            Star (☆) anything to keep it in Saved. The same list is always one click away from the ∑ button (⌘/Ctrl+J).
          </p>
          <QuickRef variant="page" initialTab={target.tab ?? 'all'} />
        </div>
      );
    case 'viz':
      return <VizView tool={target.tool} opt={target.opt} from={from} />;
    case 'glossary':
      return <GlossaryView term={target.term} from={from} />;
    case 'web':
      return <WebView url={target.url} title={target.title} label={target.label} />;
    case 'pdf':
      return (
        <PdfViewer
          key={target.sourceId}
          sourceId={target.sourceId}
          page={target.page}
          onPage={(page) => (from === 'pane' ? paneReplace({ ...target, page }) : navigate({ ...target, page }, { replace: true }))}
        />
      );
  }
}
