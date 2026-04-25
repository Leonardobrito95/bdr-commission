import * as repo from './hub.repository';
import { isHubAdmin } from '../../middlewares/requireHubAdmin';

// ─── Sectors ─────────────────────────────────────────────────────────────────

export async function listSectors() {
  return repo.findAllSectors(true);
}

export async function createSector(data: {
  name: string;
  slug: string;
  icon?: string;
  color?: string;
  description?: string;
}) {
  const existing = await repo.findSectorBySlug(data.slug);
  if (existing) throw Object.assign(new Error('Slug já existe.'), { status: 400 });
  return repo.createSector(data);
}

export async function updateSector(id: string, data: Parameters<typeof repo.updateSector>[1]) {
  const sector = await repo.findSectorById(id);
  if (!sector) throw Object.assign(new Error('Setor não encontrado.'), { status: 404 });
  if (data.slug && data.slug !== sector.slug) {
    const conflict = await repo.findSectorBySlug(data.slug);
    if (conflict) throw Object.assign(new Error('Slug já existe.'), { status: 400 });
  }
  return repo.updateSector(id, data);
}

export async function deactivateSector(id: string) {
  const sector = await repo.findSectorById(id);
  if (!sector) throw Object.assign(new Error('Setor não encontrado.'), { status: 404 });
  return repo.updateSector(id, { is_active: false });
}

// ─── Dashboards ──────────────────────────────────────────────────────────────

export async function listDashboards(ixcUserId: string) {
  if (isHubAdmin(String(ixcUserId))) {
    return repo.findAllDashboards();
  }
  return repo.findDashboardsForUser(String(ixcUserId));
}

export async function getDashboard(id: string, ixcUserId: string) {
  const dashboard = await repo.findDashboardById(id);
  if (!dashboard || dashboard.status === 'archived') {
    throw Object.assign(new Error('Dashboard não encontrado.'), { status: 404 });
  }
  if (!isHubAdmin(ixcUserId)) {
    const accesses = await repo.findPermissionsForUser(ixcUserId);
    const sectorIds = accesses.filter(a => a.sector_id).map(a => a.sector_id!);
    const dashboardIds = accesses.filter(a => a.dashboard_id).map(a => a.dashboard_id!);
    const sharedIds = dashboard.sharedSectors.map(s => s.sector_id);

    const hasAccess =
      dashboardIds.includes(dashboard.id) ||
      (dashboard.sector_id && sectorIds.includes(dashboard.sector_id)) ||
      sharedIds.some(sid => sectorIds.includes(sid));

    if (!hasAccess) throw Object.assign(new Error('Acesso negado.'), { status: 403 });
  }
  return dashboard;
}

export async function createDashboard(data: Parameters<typeof repo.createDashboard>[0]) {
  if (!data.sector_id) throw Object.assign(new Error('Setor obrigatório.'), { status: 400 });
  const sector = await repo.findSectorById(data.sector_id);
  if (!sector) throw Object.assign(new Error('Setor não encontrado.'), { status: 404 });
  return repo.createDashboard(data);
}

export async function updateDashboard(id: string, data: Parameters<typeof repo.updateDashboard>[1]) {
  const dashboard = await repo.findDashboardById(id);
  if (!dashboard) throw Object.assign(new Error('Dashboard não encontrado.'), { status: 404 });
  return repo.updateDashboard(id, data);
}

export async function archiveDashboard(id: string) {
  const dashboard = await repo.findDashboardById(id);
  if (!dashboard) throw Object.assign(new Error('Dashboard não encontrado.'), { status: 404 });
  return repo.archiveDashboard(id);
}

export async function getSharedSectors(dashboardId: string) {
  const dashboard = await repo.findDashboardById(dashboardId);
  if (!dashboard) throw Object.assign(new Error('Dashboard não encontrado.'), { status: 404 });
  return repo.getSharedSectorIds(dashboardId);
}

export async function setSharedSectors(dashboardId: string, sectorIds: string[]) {
  const dashboard = await repo.findDashboardById(dashboardId);
  if (!dashboard) throw Object.assign(new Error('Dashboard não encontrado.'), { status: 404 });
  // Exclui o setor primário da lista para evitar duplicidade
  const filtered = sectorIds.filter(id => id !== dashboard.sector_id);
  await repo.setSharedSectors(dashboardId, filtered);
}

// ─── Permissions ─────────────────────────────────────────────────────────────

export async function listPermissions() {
  return repo.findAllPermissions();
}

export async function grantPermission(data: {
  ixc_user_id: string;
  ixc_user_nome: string;
  sector_id?: string;
  dashboard_id?: string;
  created_by: string;
}) {
  if (!data.sector_id && !data.dashboard_id) {
    throw Object.assign(new Error('Informe um setor ou dashboard para conceder acesso.'), { status: 400 });
  }
  return repo.grantPermission(data);
}

export async function revokePermission(id: string) {
  return repo.revokePermission(id);
}

export async function searchIxcUsers(query: string) {
  if (!query || query.trim().length < 2) {
    throw Object.assign(new Error('Informe ao menos 2 caracteres para buscar.'), { status: 400 });
  }
  return repo.searchIxcUsers(query.trim());
}

// ─── Logs & Analytics ────────────────────────────────────────────────────────

export async function logDashboardView(data: {
  ixc_user_id: string;
  ixc_username: string;
  dashboard_id: string;
  ip_address?: string;
}) {
  return repo.createAccessLog({ ...data, action: 'VIEW_DASHBOARD' });
}

export async function logAdminAction(data: {
  ixc_user_id: string;
  ixc_username: string;
  action: string;
  detail?: string;
  ip_address?: string;
}) {
  return repo.createAccessLog(data);
}

export async function listAccessLogs(filters: Parameters<typeof repo.findAccessLogs>[0]) {
  return repo.findAccessLogs(filters);
}

export async function getAnalytics(days: number, ixcUserId?: string) {
  return repo.findAnalytics(days, ixcUserId);
}
