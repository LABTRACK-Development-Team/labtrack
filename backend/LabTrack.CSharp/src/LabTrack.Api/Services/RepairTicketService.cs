using LabTrack.Api.Contracts;
using LabTrack.Api.Controllers;
using LabTrack.Domain.Entities;
using LabTrack.Infrastructure.Persistence.DbContext;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace LabTrack.Api.Services;

public class RepairTicketService : LabTrack.Api.Controllers.IRepairTicketService
{
    private readonly LabTrackDbContext _db;
    private readonly IHttpContextAccessor _httpContext;

    public RepairTicketService(LabTrackDbContext db, IHttpContextAccessor httpContext)
    {
        _db = db;
        _httpContext = httpContext;
    }

    private Guid GetUserIdOrThrow()
    {
        var user = _httpContext.HttpContext?.User;
        var claim = user?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                 ?? user?.FindFirst("sub")?.Value;

        if (!Guid.TryParse(claim, out var userId) || userId == Guid.Empty)
            throw new UnauthorizedAccessException("User context not found in token.");

        return userId;
    }

    public async Task<PaginationResponse<RepairTicketDto>> GetRepairTicketsAsync(
        int pageNumber, int pageSize, string? status, string? priority, CancellationToken ct = default)
    {
        if (pageNumber < 1) pageNumber = 1;
        if (pageSize < 1) pageSize = 10;
        var q = _db.RepairTickets.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(status)) q = q.Where(r => r.Status == status);
        if (!string.IsNullOrWhiteSpace(priority)) q = q.Where(r => r.Priority == priority);
        var total = await q.CountAsync(ct);
        var items = await q
            .OrderByDescending(r => r.ReportedAtUtc)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new RepairTicketDto(
                r.Id, Guid.Empty, r.AssignedToUserId, null, r.Status, r.Priority,
                r.ResolutionNotes ?? "", r.Cost ?? 0m,
                r.ReportedAtUtc, r.StartedAtUtc, r.ResolvedAtUtc))
            .ToListAsync(ct);
        var totalPages = (int)Math.Ceiling(total / (double)pageSize);
        return new PaginationResponse<RepairTicketDto>(items, total, pageNumber, pageSize, totalPages, pageNumber > 1, pageNumber < totalPages);
    }

    public async Task<RepairTicketDto?> GetRepairTicketByIdAsync(Guid id, CancellationToken ct = default)
        => await _db.RepairTickets.AsNoTracking()
            .Where(x => x.Id == id)
            .Select(r => new RepairTicketDto(
                r.Id, Guid.Empty, r.AssignedToUserId, null, r.Status, r.Priority,
                r.ResolutionNotes ?? "", r.Cost ?? 0m,
                r.ReportedAtUtc, r.StartedAtUtc, r.ResolvedAtUtc))
            .FirstOrDefaultAsync(ct);

    public async Task<RepairTicketDto> CreateRepairTicketAsync(CreateRepairTicketDto dto, CancellationToken ct = default)
    {
        var reportedByUserId = GetUserIdOrThrow();

        var r = new RepairTicket
        {
            Id = Guid.NewGuid(),
            AssetId = dto.AssetId,
            ReportedByUserId = reportedByUserId,
            AssignedToUserId = dto.AssignedTechnicianUserId,
            Title = dto.TechnicalNotes ?? "Repair Ticket",
            Description = dto.TechnicalNotes ?? "",
            Priority = dto.Priority,
            Status = "ASSIGNED",
            ReportedAtUtc = DateTime.UtcNow,
            CreatedAtUtc = DateTime.UtcNow
        };
        _db.RepairTickets.Add(r);
        await _db.SaveChangesAsync(ct);
        return new RepairTicketDto(r.Id, dto.AssetId, r.AssignedToUserId, null, r.Status, r.Priority,
            r.ResolutionNotes ?? "", r.Cost ?? 0m, r.ReportedAtUtc, r.StartedAtUtc, r.ResolvedAtUtc);
    }

    public async Task<RepairTicketDto?> UpdateRepairTicketAsync(Guid id, UpdateRepairTicketDto dto, CancellationToken ct = default)
    {
        var r = await _db.RepairTickets.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (r is null) return null;
        if (dto.AssignedTechnicianUserId.HasValue) r.AssignedToUserId = dto.AssignedTechnicianUserId;
        r.Status = dto.Status; r.Priority = dto.Priority;
        if (!string.IsNullOrEmpty(dto.TechnicalNotes)) r.ResolutionNotes = dto.TechnicalNotes;
        if (dto.ActualRepairCost.HasValue) r.Cost = dto.ActualRepairCost;
        r.LastModifiedAtUtc = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return new RepairTicketDto(r.Id, r.AssetId, r.AssignedToUserId, null, r.Status, r.Priority,
            r.ResolutionNotes ?? "", r.Cost ?? 0m, r.ReportedAtUtc, r.StartedAtUtc, r.ResolvedAtUtc);
    }

    public async Task<bool> DeleteRepairTicketAsync(Guid id, CancellationToken ct = default)
    {
        var r = await _db.RepairTickets.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (r is null) return false;
        r.IsDeleted = true; r.DeletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return true;
    }
}