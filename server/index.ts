import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.ts';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const courseRoot = path.resolve(process.env.STUDY_COURSE_ROOT ?? path.join(appRoot, 'course'));
const contentDir = path.resolve(process.env.STUDY_CONTENT_DIR ?? path.join(courseRoot, 'study-content'));
const userDataDir = path.resolve(process.env.STUDY_USER_DATA ?? path.join(appRoot, 'user-data'));
const port = Number(process.env.STUDY_APP_PORT ?? 4611);
const HOST = '127.0.0.1';

const { app, close } = createApp({
  appRoot,
  courseRoot,
  contentDir,
  userDataDir,
  serveStatic: process.env.NODE_ENV === 'production',
});

const server = app.listen(port, HOST, () => {
  const mode = process.env.NODE_ENV === 'production' ? '' : ' (API only; the Vite dev server serves the UI on :5173)';
  console.log(`STAT A611 study app: http://${HOST}:${port}${mode}`);
  console.log(`Notes: ${path.join(userDataDir, 'notes')}`);
});
server.on('error', (e: NodeJS.ErrnoException) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Is the app already running? Set STUDY_APP_PORT to use another port.`);
    process.exit(1);
  }
  throw e;
});
for (const sig of ['SIGINT', 'SIGTERM'] as const) {
  process.on(sig, () => {
    close();
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 500).unref();
  });
}
