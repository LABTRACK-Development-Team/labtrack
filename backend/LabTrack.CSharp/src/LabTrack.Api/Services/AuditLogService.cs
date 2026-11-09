using LabTrack.Api.Contracts;
using LabTrack.Api.Controllers;
using LabTrack.Application.Interfaces;
using LabTrack.Domain.Entities;

namespace LabTrack.Api.Services;

public class AuditLogService : LabTrack.Api.Controllers.IAuditLogService
{
    private readonly IUnitOfWork _uow;
    public AuditLogService(IUnitOfWork uow) => _uow = uow;

    public async Task<PaginationResponse<AuditLogDto>> GetAuditLogsAsync(
        int pageNumber, int pageSize, string? userId, string? action, string? entityName,
        DateTime? startDate, DateTime? endDate, CancellationToken ct = default)
    {
        if (pageNumber < 1) pageNumber = 1;
        if (pageSize < 1) pageSize = 10;
        var all = await _uow.Audits.GetAllAsync(ct);
        IEnumerable<AuditLog> f = all;
        if (!string.IsNullOrWhiteSpace(action)) f = f.Where(a => a.Action.Equals(action, StringComparison.OrdinalIgnoreCase));
        if (!string.IsNullOrWhiteSpace(entityName)) f = f.Where(a => a.EntityName.Equals(entityName, StringComparison.OrdinalIgnoreCase));
        if (startDate.HasValue) f = f.Where(a => a.TimestampUtc >= startDate.Value);
        if (endDate.HasValue) f = f.Where(a => a.TimestampUtc <= endDate.Value);
        var list = f.OrderByDescending(a => a.TimestampUtc).ToList();
        var total = list.Count;
        var items = list.Skip((pageNumber - 1) * pageSize).Take(pageSize).Select(Map).ToList();
        var totalPages = (int)Math.Ceiling(total / (double)pageSize);
        return new PaginationResponse<AuditLogDto>(items, total, pageNumber, pageSize, totalPages, pageNumber > 1, pageNumber < totalPages);
    }

    public async Task<AuditLogDto?> GetAuditLogByIdAsync(Guid id, CancellationToken ct = default)
    {
        var a = await _uow.Audits.GetByIdAsync(id, ct);
        return a is null ? null : Map(a);
    }

    private static AuditLogDto Map(AuditLog a) => new(
        a.Id, a.UserId?.ToString(), a.Action, a.EntityName, a.EntityId,
        a.NewValues, a.IpAddress, a.TimestampUtc);

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        if (id == Guid.Empty)
            throw new ArgumentException("Audit log ID cannot be empty.", nameof(id));

        var log = await _uow.Audits.GetByIdAsync(id, ct);
        if (log != null)
        {
            log.IsDeleted = true;
            log.DeletedAt = DateTime.UtcNow;
            await _uow.SaveChangesAsync(ct);
        }
    }
}