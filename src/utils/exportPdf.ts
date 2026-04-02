import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { getCatById, getLogs, getWeightRecords } from './database';
import type { TFunction } from 'i18next';
import type { HydrationLevel, ActivityLevel } from '@/types';

const HYDRATION_I18N: Record<HydrationLevel, string> = {
  Low: 'log.hydrationLow',
  Normal: 'log.hydrationNormal',
  High: 'log.hydrationHigh',
};

const ACTIVITY_I18N: Record<ActivityLevel, string> = {
  Calm: 'log.activityCalm',
  Normal: 'log.activityNormal',
  Active: 'log.activityActive',
  Hyper: 'log.activityHyper',
};

export async function exportPdfReport(catId: number, t: TFunction) {
  const cat = await getCatById(catId);
  if (!cat) return;

  const logs = await getLogs(catId, 30);
  const weights = await getWeightRecords(catId);
  const currentWeight = weights.length > 0 ? weights[weights.length - 1].weight : 0;

  const logsHtml = logs
    .map(
      (log) => `
      <tr>
        <td>${log.date}</td>
        <td>${log.time}</td>
        <td>${log.litterVisits}</td>
        <td>${log.appetite}/5</td>
        <td>${t(HYDRATION_I18N[log.hydration])}</td>
        <td>${t(ACTIVITY_I18N[log.activity])}</td>
        <td>${log.notes || '-'}</td>
      </tr>`
    )
    .join('');

  const weightsHtml = weights
    .slice(-6)
    .map(
      (w) => `
      <tr>
        <td>${w.date}</td>
        <td>${w.weight.toFixed(1)} kg</td>
      </tr>`
    )
    .join('');

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; padding: 24px; color: #1A1A2E; }
  h1 { font-size: 22px; margin-bottom: 4px; }
  h2 { font-size: 16px; margin-top: 24px; margin-bottom: 8px; color: #6C63FF; }
  .subtitle { color: #888; font-size: 13px; margin-bottom: 20px; }
  .info { display: flex; gap: 24px; margin-bottom: 16px; }
  .info-item { font-size: 13px; }
  .info-label { color: #888; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { border: 1px solid #E0E0E0; padding: 6px 8px; text-align: left; }
  th { background: #F5F5FA; font-weight: 600; }
</style>
</head>
<body>
  <h1>CatTracker - ${cat.name}</h1>
  <div class="subtitle">${t('settings.exportPdfReport')} - ${new Date().toLocaleDateString()}</div>

  <div class="info">
    <span class="info-item"><span class="info-label">${t('profile.breed')}:</span> ${cat.breed}</span>
    <span class="info-item"><span class="info-label">${t('profile.gender')}:</span> ${cat.gender === 'Male' ? t('profile.male') : t('profile.female')}</span>
    <span class="info-item"><span class="info-label">${t('profile.currentWeight')}:</span> ${currentWeight > 0 ? currentWeight.toFixed(1) + ' kg' : '-'}</span>
  </div>

  ${
    weightsHtml
      ? `<h2>${t('profile.weightHistory')}</h2>
    <table>
      <thead><tr><th>${t('profile.birthday').replace('Birthday', 'Date')}</th><th>${t('profile.currentWeight')}</th></tr></thead>
      <tbody>${weightsHtml}</tbody>
    </table>`
      : ''
  }

  <h2>${t('timeline.title')} (${logs.length})</h2>
  ${
    logs.length > 0
      ? `<table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Time</th>
        <th>${t('dashboard.litterVisits')}</th>
        <th>${t('dashboard.appetite')}</th>
        <th>${t('dashboard.hydration')}</th>
        <th>${t('dashboard.activity')}</th>
        <th>Notes</th>
      </tr>
    </thead>
    <tbody>${logsHtml}</tbody>
  </table>`
      : `<p>${t('timeline.noLogsYet')}</p>`
  }
</body>
</html>`;

  const { uri } = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(uri, {
    UTI: 'com.adobe.pdf',
    mimeType: 'application/pdf',
  });
}
