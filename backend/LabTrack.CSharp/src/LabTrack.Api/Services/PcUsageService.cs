using LabTrack.Api.Contracts;
using LabTrack.Api.Controllers;
using LabTrack.Domain.Entities;
using LabTrack.Infrastructure.Persistence.DbContext;
using Microsoft.EntityFrameworkCore;

namespace LabTrack.Api.Services;

public class PcUsageService : LabTrack.Api.Controllers.IPcUsageService
{
    private readonly LabTrackDbContext _db;
    public PcUsageService(LabTrackDbContext db) => _db = db;

    public async Task<PcSessionDto?> ScanLoginAsync(ScanLoginRequestDto request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.QrToken))
            throw new InvalidOperationException("QR token is required.");
        if (string.IsNullOrWhiteSpace(request.StudentNumber))
            throw new InvalidOperationException("Student number is required.");

        var qr = await _db.QrCodes.FirstOrDefaultAsync(q => q.CodeValue == request.QrToken && q.IsActive, ct);
        if (qr is null)
            throw new InvalidOperationException("Invalid or expired QR code.");
        if (qr.ExpiresAtUtc.HasValue && qr.ExpiresAtUtc.Value < DateTime.UtcNow)
            throw new InvalidOperationException("QR code has expired.");

        var emailLower = request.StudentNumber.Trim().ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == emailLower, ct);
        if (user is null)
            throw new InvalidOperationException("Student not found.");
        if (!user.IsActive)
            throw new InvalidOperationException("Student account is inactive.");

        var ws = await _db.Workstations.FirstOrDefaultAsync(w => w.Id == qr.EntityId, ct);
        if (ws is null)
            throw new InvalidOperationException("Workstation not found.");

        var active = await _db.PcUsageLogs.AnyAsync(p => p.WorkstationId == ws.Id && p.SessionEndUtc == null, ct);
        if (active)
            throw new InvalidOperationException("Workstation already has an active session.");

        var session = new PcUsageLog
        {
            Id = Guid.NewGuid(),
            WorkstationId = ws.Id,
            UserId = user.Id,
            SessionStartUtc = DateTime.UtcNow,
            Status = "Active"
        };
        _db.PcUsageLogs.Add(session);

        qr.IsActive = false;
        await _db.SaveChangesAsync(ct);

        try
        {
            var adminIds = await _db.Users
                .Where(u => u.IsActive && (u.Role == "ADMIN" || u.Role == "ADMIN_TECHNICIAN" || u.Role == "TECHNICIAN"))
                .Select(u => u.Id)
                .ToListAsync(ct);
            foreach (var aid in adminIds)
            {
                _db.Notifications.Add(new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = aid,
                    Title = "Student Checked In",
                    Message = user.FirstName + " " + user.LastName + " on " + ws.Name + " checked in at " + DateTime.UtcNow.ToString("HH:mm") + " UTC",
                    Type = "PC_SCAN",
                    IsRead = false,
                    CreatedAtUtc = DateTime.UtcNow
                });
            }
            if (adminIds.Count > 0) await _db.SaveChangesAsync(ct);
        }
        catch { }

        string labName = "";
        var lab = await _db.Laboratories.FirstOrDefaultAsync(l => l.Id == ws.LaboratoryId, ct);
        if (lab != null) labName = lab.Name;

        return new PcSessionDto(
            session.Id, ws.Id, ws.Name, labName, user.Id,
            $"{user.FirstName} {user.LastName}".Trim(),
            session.SessionStartUtc, null, session.SessionStartUtc, "Active");
    }

    public async Task<bool> HeartbeatAsync(HeartbeatRequestDto request, CancellationToken ct = default)
    {
        var log = await _db.PcUsageLogs.FirstOrDefaultAsync(p => p.Id == request.SessionId, ct);
        return log is not null && !log.SessionEndUtc.HasValue;
    }

    public async Task<bool> EndSessionAsync(Guid sessionId, CancellationToken ct = default)
    {
        var log = await _db.PcUsageLogs.FirstOrDefaultAsync(p => p.Id == sessionId, ct);
        if (log is null || log.SessionEndUtc.HasValue) return false;
        log.SessionEndUtc = DateTime.UtcNow;
        log.Status = "Completed";
        if (log.SessionStartUtc != default)
            log.DurationMinutes = (log.SessionEndUtc.Value - log.SessionStartUtc).TotalMinutes;
        await _db.SaveChangesAsync(ct);

        try
        {
            var adminIds = await _db.Users
                .Where(u => u.IsActive && (u.Role == "ADMIN" || u.Role == "ADMIN_TECHNICIAN" || u.Role == "TECHNICIAN"))
                .Select(u => u.Id)
                .ToListAsync(ct);
            var durationStr = (log.DurationMinutes ?? 0).ToString("F0");
            foreach (var aid in adminIds)
            {
                _db.Notifications.Add(new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = aid,
                    Title = "Student Checked Out",
                    Message = "Session ended at " + DateTime.UtcNow.ToString("HH:mm") + " UTC. Duration: " + durationStr + " min",
                    Type = "PC_LOGOUT",
                    IsRead = false,
                    CreatedAtUtc = DateTime.UtcNow
                });
            }
            if (adminIds.Count > 0) await _db.SaveChangesAsync(ct);
        }
        catch { }

        return true;
    }

    public async Task<PaginationResponse<PcSessionDto>> GetActiveSessionsAsync(
        int pageNumber, int pageSize, string? labId, CancellationToken ct = default)
    {
        if (pageNumber < 1) pageNumber = 1;
        if (pageSize < 1) pageSize = 10;

        var q = _db.PcUsageLogs.AsNoTracking().Where(p => p.SessionEndUtc == null);
        if (!string.IsNullOrWhiteSpace(labId) && Guid.TryParse(labId, out var labGuid))
        {
            var wsIds = await _db.Workstations.Where(w => w.LaboratoryId == labGuid).Select(w => w.Id).ToListAsync(ct);
            q = q.Where(p => wsIds.Contains(p.WorkstationId));
        }

        var total = await q.CountAsync(ct);
        var totalPages = (int)Math.Ceiling(total / (double)pageSize);
        var raw = await q.OrderByDescending(p => p.SessionStartUtc)
            .Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync(ct);

        var items = new List<PcSessionDto>();
        foreach (var p in raw)
            items.Add(await EnrichDto(p, ct));

        return new PaginationResponse<PcSessionDto>(items, total, pageNumber, pageSize, totalPages, pageNumber > 1, pageNumber < totalPages);
    }

    public async Task<PaginationResponse<PcSessionDto>> GetSessionHistoryAsync(
        int pageNumber, int pageSize, string? userId, DateTime? startDate, DateTime? endDate, CancellationToken ct = default)
    {
        if (pageNumber < 1) pageNumber = 1;
        if (pageSize < 1) pageSize = 10;

        var q = _db.PcUsageLogs.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(userId) && Guid.TryParse(userId, out var uid))
            q = q.Where(p => p.UserId == uid);
        if (startDate.HasValue) q = q.Where(p => p.SessionStartUtc >= startDate.Value);
        if (endDate.HasValue) q = q.Where(p => p.SessionStartUtc <= endDate.Value);

        var total = await q.CountAsync(ct);
        var totalPages = (int)Math.Ceiling(total / (double)pageSize);
        var raw = await q.OrderByDescending(p => p.SessionStartUtc)
            .Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync(ct);

        var items = new List<PcSessionDto>();
        foreach (var p in raw)
            items.Add(await EnrichDto(p, ct));

        return new PaginationResponse<PcSessionDto>(items, total, pageNumber, pageSize, totalPages, pageNumber > 1, pageNumber < totalPages);
    }

    private async Task<PcSessionDto> EnrichDto(PcUsageLog p, CancellationToken ct)
    {
        var ws = await _db.Workstations.FirstOrDefaultAsync(w => w.Id == p.WorkstationId, ct);
        User? user = p.UserId.HasValue
            ? await _db.Users.FirstOrDefaultAsync(u => u.Id == p.UserId.Value, ct)
            : null;
        string labName = "";
        if (ws != null)
        {
            var lab = await _db.Laboratories.FirstOrDefaultAsync(l => l.Id == ws.LaboratoryId, ct);
            if (lab != null) labName = lab.Name;
        }
        return new PcSessionDto(
            p.Id, p.WorkstationId, ws?.Name ?? "", labName,
            p.UserId ?? Guid.Empty,
            user == null ? "" : $"{user.FirstName} {user.LastName}".Trim(),
            p.SessionStartUtc, p.SessionEndUtc,
            p.SessionEndUtc ?? p.SessionStartUtc, p.Status);
    }
}