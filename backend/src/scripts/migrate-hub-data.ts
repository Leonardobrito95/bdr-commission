/**
 * migrate-hub-data.ts
 *
 * Migra setores, dashboards e setores compartilhados do banco PostgreSQL do Hub (Python)
 * para o novo schema "hub" no PostgreSQL do Canaã Performance.
 *
 * Uso:
 *   npx ts-node src/scripts/migrate-hub-data.ts
 *
 * Variáveis de ambiente necessárias (além das já existentes no .env):
 *   HUB_DATABASE_URL  — connection string do PostgreSQL do Hub Python
 *                       ex: postgresql://user:pass@localhost:5432/hub_db
 */

import 'dotenv/config';
import { PrismaClient as TargetPrisma } from '@prisma/client';
import { Client as PgClient } from 'pg';

const target = new TargetPrisma();

async function main() {
  const hubUrl = process.env.HUB_DATABASE_URL;
  if (!hubUrl) {
    console.error('❌  Defina HUB_DATABASE_URL no .env antes de rodar este script.');
    process.exit(1);
  }

  const source = new PgClient({ connectionString: hubUrl });
  await source.connect();
  console.log('✅  Conectado ao banco do Hub (Python).');

  // ── Setores ────────────────────────────────────────────────────────────────
  const { rows: sectors } = await source.query(`
    SELECT id, name, slug, icon, color, description, is_active, created_at
    FROM sectors
    ORDER BY id
  `);
  console.log(`\n📂  Migrando ${sectors.length} setores...`);

  const sectorIdMap: Record<number, string> = {};

  for (const s of sectors) {
    const created = await target.hubSector.upsert({
      where:  { slug: s.slug },
      update: { name: s.name, icon: s.icon, color: s.color, description: s.description, is_active: s.is_active },
      create: { name: s.name, slug: s.slug, icon: s.icon ?? 'fa-chart-bar', color: s.color ?? '#002F4D', description: s.description, is_active: s.is_active, created_at: s.created_at },
    });
    sectorIdMap[s.id] = created.id;
    console.log(`  ✓ Setor: ${s.name} → ${created.id}`);
  }

  // ── Dashboards ─────────────────────────────────────────────────────────────
  const { rows: dashboards } = await source.query(`
    SELECT id, title, description, type, url, status, embed_mode,
           thumbnail_url, business_rules, data_sources, owner_tech,
           refresh_frequency, last_update, sector_id
    FROM dashboards
    WHERE status != 'archived'
    ORDER BY id
  `);
  console.log(`\n📊  Migrando ${dashboards.length} dashboards...`);

  const dashIdMap: Record<number, string> = {};

  for (const d of dashboards) {
    const sectorUuid = d.sector_id ? sectorIdMap[d.sector_id] : undefined;
    const created = await target.hubDashboard.create({
      data: {
        title:             d.title,
        description:       d.description,
        type:              d.type,
        url:               d.url,
        status:            d.status ?? 'active',
        embed_mode:        d.embed_mode ?? 'newtab',
        thumbnail_url:     d.thumbnail_url,
        business_rules:    d.business_rules,
        data_sources:      d.data_sources,
        owner_tech:        d.owner_tech,
        refresh_frequency: d.refresh_frequency,
        last_update:       d.last_update ?? undefined,
        sector_id:         sectorUuid ?? undefined,
      },
    });
    dashIdMap[d.id] = created.id;
    console.log(`  ✓ Dashboard: ${d.title} → ${created.id}`);
  }

  // ── Setores compartilhados ─────────────────────────────────────────────────
  const { rows: shared } = await source.query(`
    SELECT dss.dashboard_id, dss.sector_id
    FROM dashboard_shared_sectors dss
    JOIN dashboards d ON d.id = dss.dashboard_id
    WHERE d.status != 'archived'
  `);
  console.log(`\n🔗  Migrando ${shared.length} vínculos de setores compartilhados...`);

  for (const row of shared) {
    const dashUuid   = dashIdMap[row.dashboard_id];
    const sectorUuid = sectorIdMap[row.sector_id];
    if (!dashUuid || !sectorUuid) continue;
    await target.hubDashboardSharedSector.upsert({
      where:  { dashboard_id_sector_id: { dashboard_id: dashUuid, sector_id: sectorUuid } },
      update: {},
      create: { dashboard_id: dashUuid, sector_id: sectorUuid },
    });
    console.log(`  ✓ Dashboard ${dashUuid} ↔ Setor ${sectorUuid}`);
  }

  await source.end();
  await target.$disconnect();
  console.log('\n🎉  Migração concluída com sucesso!');
}

main().catch(err => {
  console.error('\n❌  Erro durante a migração:', err);
  process.exit(1);
});
