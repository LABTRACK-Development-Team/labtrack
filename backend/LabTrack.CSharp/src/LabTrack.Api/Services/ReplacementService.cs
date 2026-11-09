using LabTrack.Api.Contracts;
using LabTrack.Api.Controllers;
using LabTrack.Domain.Entities;
using LabTrack.Infrastructure.Persistence.DbContext;
using Microsoft.EntityFrameworkCore;

namespace LabTrack.Api.Services;

public class ReplacementService : LabTrack.Api.Controllers.IReplacementService
{
    private readonly LabTrackDbContext _db;

    public ReplacementService(LabTrackDbContext db) => _db = db;

    public async Task<PaginationResponse<ReplacementRequestDto>> GetReplacementRequestsAsync(
        int pageNumber, int pageSize, string? status, CancellationToken ct = default)
    {
        if (pageNumber < 1) pageNumber = 1;
        if (pageSize < 1) pageSize = 10;

        var q = _db.ReplacementRequests.AsNoTracking()
            .Include(r => r.Asset)
            .Include(r => r.RequestedByUser)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
            q = q.Where(r => r.Status == status);

        var total = await q.CountAsync(ct);
        var totalPages = (int)Math.Ceiling(total / (double)pageSize);
        var items = await q.OrderByDescending(r => r.RequestedAtUtc)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return new PaginationResponse<ReplacementRequestDto>(
            items.Select(MapToDto).ToList(),
            total, pageNumber, pageSize, totalPages,
            pageNumber > 1, pageNumber < totalPages);
    }

    public async Task<ReplacementRequestDto?> GetReplacementRequestByIdAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await _db.ReplacementRequests.AsNoTracking()
            .Include(r => r.Asset)
            .Include(r => r.RequestedByUser)
            .FirstOrDefaultAsync(r => r.Id == id, ct);
        return entity is null ? null : MapToDto(entity);
    }

    public async Task<ReplacementRequestDto> CreateReplacementRequestAsync(
        CreateReplacementRequestDto dto, Guid requestedByUserId, CancellationToken ct = default)
    {
        // Validate asset exists
        var assetExists = await _db.Assets.AnyAsync(a => a.Id == dto.AssetId, ct);
        if (!assetExists)
            throw new InvalidOperationException($"Asset with ID '{dto.AssetId}' not found.");

        var entity = new ReplacementRequest
        {
            Id = Guid.NewGuid(),
            AssetId = dto.AssetId,
            RequestedByUserId = requestedByUserId,
            Reason = dto.Reason,
            EstimatedCost = dto.EstimatedReplacementCost,
            Priority = "Medium",
            Status = "Pending",
            RequestedAtUtc = DateTime.UtcNow
        };

        _db.ReplacementRequests.Add(entity);
        await _db.SaveChangesAsync(ct);

        // Reload with navigations
        entity = await _db.ReplacementRequests
            .Include(r => r.Asset)
            .Include(r => r.RequestedByUser)
            .FirstAsync(r => r.Id == entity.Id, ct);

        return MapToDto(entity);
    }

    public async Task<ReplacementRequestDto?> UpdateReplacementStatusAsync(
        Guid id, UpdateReplacementStatusDto dto, CancellationToken ct = default)
    {
        var entity = await _db.ReplacementRequests
            .Include(r => r.Asset)
            .Include(r => r.RequestedByUser)
            .FirstOrDefaultAsync(r => r.Id == id, ct);
        if (entity is null) return null;

        entity.Status = dto.Status;
        entity.ReviewNotes = dto.AdminNotes;
        entity.ReviewedAtUtc = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
        return MapToDto(entity);
    }

    public async Task<bool> DeleteReplacementRequestAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await _db.ReplacementRequests.FirstOrDefaultAsync(r => r.Id == id, ct);
        if (entity is null) return false;
        entity.IsDeleted = true; entity.DeletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return true;
    }

    private static ReplacementRequestDto MapToDto(ReplacementRequest r) => new(
        r.Id,
        r.AssetId,
        r.Asset?.AssetTag ?? string.Empty,
        r.Asset?.Name ?? string.Empty,
        r.RequestedByUserId,
        r.RequestedByUser is null ? string.Empty : $"{r.RequestedByUser.FirstName} {r.RequestedByUser.LastName}".Trim(),
        r.Reason,
        r.Status,
        r.EstimatedCost ?? 0m,
        r.RequestedAtUtc,
        r.ReviewedAtUtc,
        null
    );
}
