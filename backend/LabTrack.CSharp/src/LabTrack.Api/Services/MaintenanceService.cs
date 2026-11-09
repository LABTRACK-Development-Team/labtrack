using LabTrack.Api.Contracts;
using LabTrack.Api.Controllers;
using LabTrack.Domain.Entities;
using LabTrack.Infrastructure.Persistence.DbContext;
using Microsoft.EntityFrameworkCore;

namespace LabTrack.Api.Services;

public class MaintenanceService : LabTrack.Api.Controllers.IMaintenanceService
{
    private readonly LabTrackDbContext _db;
    public MaintenanceService(LabTrackDbContext db) { _db = db; }

    public async Task<PaginationResponse<MaintenanceScheduleDto>> GetSchedulesAsync(
        int pageNumber, int pageSize, string? status, CancellationToken ct = default)
    {
        if (pageNumber < 1) pageNumber = 1;
        if (pageSize < 1) pageSize = 10;
        var q = _db.MaintenanceSchedules.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(status)) q = q.Where(m => m.Status == status);
        var total = await q.CountAsync(ct);
        var items = await q
            .OrderByDescending(m => m.ScheduledDateUtc)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(m => new MaintenanceScheduleDto(
                m.Id, m.AssetId, m.Title, m.Status, m.Description ?? "",
                m.ScheduledDateUtc, m.CompletedAtUtc, m.AssignedToUserId, m.CreatedAtUtc))
            .ToListAsync(ct);
        var totalPages = (int)Math.Ceiling(total / (double)pageSize);
        return new PaginationResponse<MaintenanceScheduleDto>(items, total, pageNumber, pageSize, totalPages, pageNumber > 1, pageNumber < totalPages);
    }

    public async Task<MaintenanceScheduleDto?> GetScheduleByIdAsync(Guid id, CancellationToken ct = default)
        => await _db.MaintenanceSchedules.AsNoTracking()
            .Where(x => x.Id == id)
            .Select(m => new MaintenanceScheduleDto(
                m.Id, m.AssetId, m.Title, m.Status, m.Description ?? "",
                m.ScheduledDateUtc, m.CompletedAtUtc, m.AssignedToUserId, m.CreatedAtUtc))
            .FirstOrDefaultAsync(ct);

    public async Task<MaintenanceScheduleDto> CreateScheduleAsync(CreateMaintenanceScheduleDto dto, CancellationToken ct = default)
    {
        var m = new MaintenanceSchedule
        {
            Id = Guid.NewGuid(), AssetId = dto.AssetId, Title = dto.MaintenanceType,
            Description = dto.Description, Frequency = "ONCE",
            ScheduledDateUtc = DateTime.SpecifyKind(dto.ScheduledDate, DateTimeKind.Utc), Status = "PENDING", CreatedAtUtc = DateTime.UtcNow
        };
        _db.MaintenanceSchedules.Add(m);
        await _db.SaveChangesAsync(ct);
        return new MaintenanceScheduleDto(m.Id, m.AssetId, m.Title, m.Status, m.Description ?? "",
            m.ScheduledDateUtc, m.CompletedAtUtc, m.AssignedToUserId, m.CreatedAtUtc);
    }

    public async Task<MaintenanceScheduleDto?> UpdateScheduleAsync(Guid id, UpdateMaintenanceScheduleDto dto, CancellationToken ct = default)
    {
        var m = await _db.MaintenanceSchedules.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (m is null) return null;
        m.Title = dto.MaintenanceType; m.Description = dto.Description;
        m.ScheduledDateUtc = DateTime.SpecifyKind(dto.ScheduledDate, DateTimeKind.Utc); m.CompletedAtUtc = dto.CompletedAt;
        m.AssignedToUserId = dto.PerformedByUserId; m.Status = dto.Status;
        m.LastModifiedAtUtc = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return new MaintenanceScheduleDto(m.Id, m.AssetId, m.Title, m.Status, m.Description ?? "",
            m.ScheduledDateUtc, m.CompletedAtUtc, m.AssignedToUserId, m.CreatedAtUtc);
    }

    public async Task<bool> DeleteScheduleAsync(Guid id, CancellationToken ct = default)
    {
        var m = await _db.MaintenanceSchedules.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (m is null) return false;
        m.IsDeleted = true; m.DeletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return true;
    }
}