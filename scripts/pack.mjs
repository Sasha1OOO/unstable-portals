// Собирает автономный архив: dist/index.html + лаунчер + инструкция → portal-lab-app.zip
// Запуск: npm run pack  (перед этим нужен npm run build)
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { platform } from 'node:os';

const STAGE = 'dist-archive/portal-lab-app';
const OUT = 'portal-lab-app.zip';

if (!existsSync('dist/index.html')) {
  console.error('Нет dist/index.html — сначала выполните: npm run build');
  process.exit(1);
}

rmSync('dist-archive', { recursive: true, force: true });
mkdirSync(STAGE, { recursive: true });
cpSync('dist/index.html', `${STAGE}/index.html`);

writeFileSync(
  `${STAGE}/Запустить.bat`,
  '@echo off\r\nrem Открывает приложение в браузере по умолчанию. Node не нужен.\r\nstart "" "%~dp0index.html"\r\n',
);
writeFileSync(
  `${STAGE}/Запустить.command`,
  '#!/bin/sh\ncd "$(dirname "$0")"\nopen index.html 2>/dev/null || xdg-open index.html\n',
);
writeFileSync(
  `${STAGE}/ЧИТАЙ.txt`,
  [
    'Лаборатория нестабильных порталов — автономная сборка',
    '',
    'Запуск: двойной клик по «Запустить.bat» (Windows) или «Запустить.command» (macOS),',
    'либо просто откройте index.html в любом браузере. Node и интернет не нужны.',
    '',
    'Вкладки: Панель смотрителя · AI Worklog · Чеклист.',
    'Исходники, тесты и README — в репозитории проекта.',
  ].join('\n'),
);

rmSync(OUT, { force: true });
if (platform() === 'win32') {
  execFileSync(
    'powershell',
    ['-NoProfile', '-Command', `Compress-Archive -Path '${STAGE}' -DestinationPath '${OUT}' -Force`],
    { stdio: 'inherit' },
  );
} else {
  execFileSync('zip', ['-r', OUT, 'portal-lab-app'], { cwd: 'dist-archive', stdio: 'inherit' });
  cpSync(`dist-archive/${OUT}`, OUT);
}
console.log(`Готово: ${OUT}`);
