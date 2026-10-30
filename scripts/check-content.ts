// Verify the content import: pack + supplements load with no integrity problems, and the pack's own validator passes.
// The pack validator rewrites VALIDATION.md, so it runs against a temporary copy to leave study-content/ untouched.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadCourse, loadSourcePages } from '../server/content.ts';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const courseRoot = path.resolve(process.env.STUDY_COURSE_ROOT ?? path.join(appRoot, 'course'));
const contentDir = path.join(courseRoot, 'study-content');

const { bundle, problems } = loadCourse({ courseRoot, contentDir, supplementDir: path.join(appRoot, 'content') }, { notesDir: '', userDataDir: '' });
const pages = loadSourcePages(contentDir, bundle.sources);
const by = (bank: string) => bundle.questions.filter((q) => q.bank === bank).length;
console.log(`Lessons: ${bundle.lessons.length}  Guides: ${Object.keys(bundle.guides).length}  Questions: ${bundle.questions.length} (pack ${by('pack')}, supplemental ${by('supplemental')})`);
console.log(`Sources: ${bundle.sources.length} PDFs, ${pages.length} extracted pages  Glossary: ${bundle.glossary.length}  Review items: ${bundle.reviewItems.length}`);
if (problems.length) {
  console.error(`Content problems:\n  ${problems.join('\n  ')}`);
  process.exit(1);
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pack-validate-'));
try {
  fs.cpSync(contentDir, path.join(tmp, 'study-content'), { recursive: true });
  fs.symlinkSync(path.join(courseRoot, 'Notes'), path.join(tmp, 'Notes'));
  const out = execFileSync('python3', ['-I', path.join(tmp, 'study-content', 'validate_content.py')], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  console.log(out.split('\n').filter((l) => l.startsWith('- Passed')).join('\n'));
  console.log('OK: app import checks and the content-pack validator passed.');
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
