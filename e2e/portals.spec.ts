import { expect, test, type Page } from '@playwright/test';

const API = 'http://localhost:4199/api';
const ADV = 'http://localhost:6173';
const SAC = 'http://localhost:6174';
const ADMIN = 'http://localhost:6175';

async function signIn(page: Page, url: string, name: string) {
  await page.goto(url);
  await page.getByRole('button', { name: new RegExp(name) }).click();
}

test.beforeAll(async ({ request }) => {
  await request.post(`${API}/_reset`);
});

test('advertiser: dashboard, campaign detail and brand-first wizard', async ({ page }) => {
  await signIn(page, ADV, 'Aditi Rao');
  await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  await expect(page.getByText('Tanishq Rivaah — Festive Q3').first()).toBeVisible();

  await page.goto(`${ADV}/campaigns/CMP-2419`);
  await expect(page.getByRole('heading', { name: 'Tanishq Rivaah — Festive Q3' })).toBeVisible();
  await expect(page.getByText(/Placements \(\d+\)/).first()).toBeVisible();

  await page.goto(`${ADV}/campaigns/new`);
  await expect(page.getByText('Campaign information').first()).toBeVisible();
  await expect(page.getByText('Brand', { exact: true }).first()).toBeVisible();
});

test('SAC: KYC queue and dashboard', async ({ page }) => {
  await signIn(page, SAC, 'Sana Qureshi');
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  await page.goto(`${SAC}/approvals/clients`);
  await expect(page.getByText('Sunrise Foods & Beverages LLP')).toBeVisible();
});

test('admin: overview and SAC detail', async ({ page }) => {
  await signIn(page, ADMIN, 'Harshit Thakkar');
  await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  await page.goto(`${ADMIN}/tenants/sacs/SAC-PVRM`);
  await expect(page.getByRole('heading', { name: /PVR INOX Media Sales/ })).toBeVisible();
});

test('cross-portal: SAC approval reaches the advertiser', async ({ page, request }) => {
  const res = await request.post(`${API}/sac/campaigns/CMP-2436/decision`, {
    headers: { 'x-slate-user': 'U-ROHAN' },
    data: { decision: 'approve', note: null }
  });
  expect(res.ok()).toBeTruthy();
  await signIn(page, ADV, 'Aditi Rao');
  await page.goto(`${ADV}/campaigns/CMP-2436`);
  await expect(page.getByRole('heading', { name: 'Amul Dark — Winter lobby' })).toBeVisible();
  await expect(page.getByText('Scheduled').first()).toBeVisible();
});
