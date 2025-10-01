export function parsePagination(query) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const pageSizeRaw = parseInt(query.pageSize, 10) || 20;
    const pageSize = Math.min(100, Math.max(1, pageSizeRaw));
    return { page, pageSize, offset: (page - 1) * pageSize };
}
