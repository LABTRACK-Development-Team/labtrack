using LabTrack.Api.Contracts;
using LabTrack.Api.Controllers;
using LabTrack.Domain.Entities;
using LabTrack.Infrastructure.Persistence.DbContext;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;
using System.Security.Claims;

namespace LabTrack.Api.Services;

public class ProblemReportService : LabTrack.Api.Controllers.IProblemReportService
{
    private readonly LabTrackDbContext _db;
    private readonly IHttpContextAccessor _httpContext;

    public ProblemReportService(LabTrackDbContext db, IHttpContextAccessor httpContext)
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

    private static string NormalizePriority(string? p)
    {
        if (string.IsNullOrWhiteSpace(p)) return "MEDIUM";
        var u = p.Trim().ToUpperInvariant();
        if (u == "CRITICAL" || u == "URGENT") return "CRITICAL";
        if (u == "HIGH") return "HIGH";
        if (u == "LOW") return "LOW";
        return "MEDIUM";
    }

    private static readonly Expression<Func<ProblemReport, ProblemReportDto>> Projection =
        r => new ProblemReportDto(
            r.Id,
            r.WorkstationId,
            r.Workstation != null ? (r.Workstation.Code ?? r.Workstation.Name ?? "N/A") : "N/A",
            r.Laboratory != null ? r.Laboratory.Name
                : (r.Workstation != null ? "Lab-" + r.Workstation.LaboratoryId.ToString().Substring(0, 8) : "N/A"),
            r.ReportedByUserId,
            r.ReportedByUser != null
                ? (r.ReportedByUser.FirstName + " " + r.ReportedByUser.LastName).Trim()
                : "Unknown",
            r.Category,
            r.Title,
            r.Description,
            r.Priority ?? "MEDIUM",
            r.Status,
            null,
            r.ReportedAtUtc,
            r.ResolvedAtUtc
        );

    public async Task<PaginationResponse<ProblemReportDto>> GetProblemReportsAsync(
        int pageNumber, int pageSize, string? status, string? category, CancellationToken ct = default)
    {
        if (pageNumber < 1) pageNumber = 1;
        if (pageSize < 1) pageSize = 50;
        var q = _db.ProblemReports.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(status))   q = q.Where(r => r.Status == status);
        if (!string.IsNullOrWhiteSpace(category)) q = q.Where(r => r.Category == category);
        var total = await q.CountAsync(ct);
        var items = await q
            .OrderByDescending(r => r.ReportedAtUtc)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(Projection)
            .ToListAsync(ct);
        var totalPages = (int)Math.Ceiling(total / (double)pageSize);
        return new PaginationResponse<ProblemReportDto>(items, total, pageNumber, pageSize, totalPages, pageNumber > 1, pageNumber < totalPages);
    }

    public async Task<PaginationResponse<ProblemReportDto>> GetMyProblemReportsAsync(
        Guid userId, int pageNumber, int pageSize, CancellationToken ct = default)
    {
        if (pageNumber < 1) pageNumber = 1;
        if (pageSize < 1) pageSize = 50;
        var q = _db.ProblemReports.AsNoTracking().Where(r => r.ReportedByUserId == userId);
        var total = await q.CountAsync(ct);
        var items = await q
            .OrderByDescending(r => r.ReportedAtUtc)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(Projection)
            .ToListAsync(ct);
        var totalPages = (int)Math.Ceiling(total / (double)pageSize);
        return new PaginationResponse<ProblemReportDto>(items, total, pageNumber, pageSize, totalPages, pageNumber > 1, pageNumber < totalPages);
    }

    public async Task<ProblemReportDto?> GetProblemReportByIdAsync(Guid id, CancellationToken ct = default)
        => await _db.ProblemReports.AsNoTracking()
            .Where(x => x.Id == id)
            .Select(Projection)
            .FirstOrDefaultAsync(ct);

    public async Task<ProblemReportDto> SubmitProblemReportAsync(CreateProblemReportDto dto, Guid reportedByUserId, CancellationToken ct = default)
    {
        var realUserId = GetUserIdOrThrow();

        Guid? resolvedWorkstationId = null;
        Guid? resolvedLaboratoryId  = null;

        // 1. WorkstationId — Guid or Code
        if (!string.IsNullOrWhiteSpace(dto.WorkstationId))
        {
            if (Guid.TryParse(dto.WorkstationId, out var wid))
                resolvedWorkstationId = wid;
            else
            {
                var ws = await _db.Workstations.AsNoTracking()
                    .FirstOrDefaultAsync(w => w.Code == dto.WorkstationId || w.Name == dto.WorkstationId, ct);
                if (ws != null) { resolvedWorkstationId = ws.Id; resolvedLaboratoryId = ws.LaboratoryId; }
            }
        }
        // 2. WorkstationCode fallback
        if (!resolvedWorkstationId.HasValue && !string.IsNullOrWhiteSpace(dto.WorkstationCode))
        {
            var ws = await _db.Workstations.AsNoTracking()
                .FirstOrDefaultAsync(w => w.Code == dto.WorkstationCode || w.Name == dto.WorkstationCode, ct);
            if (ws != null) { resolvedWorkstationId = ws.Id; resolvedLaboratoryId = ws.LaboratoryId; }
        }
        // 3. Derive lab from workstation
        if (resolvedWorkstationId.HasValue && !resolvedLaboratoryId.HasValue)
        {
            var labId = await _db.Workstations.AsNoTracking()
                .Where(w => w.Id == resolvedWorkstationId.Value)
                .Select(w => w.LaboratoryId)
                .FirstOrDefaultAsync(ct);
            if (labId != Guid.Empty) resolvedLaboratoryId = labId;
        }
        // 4. LaboratoryId (Guid or name)
        if (!resolvedLaboratoryId.HasValue && !string.IsNullOrWhiteSpace(dto.LaboratoryId))
        {
            if (Guid.TryParse(dto.LaboratoryId, out var lid)) resolvedLaboratoryId = lid;
            else
            {
                var lab = await _db.Laboratories.AsNoTracking()
                    .FirstOrDefaultAsync(l => l.Name == dto.LaboratoryId, ct);
                if (lab != null) resolvedLaboratoryId = lab.Id;
            }
        }
        // 5. LaboratoryName / LabName by name lookup
        var labLookup = dto.LaboratoryName ?? dto.LabName;
        if (!resolvedLaboratoryId.HasValue && !string.IsNullOrWhiteSpace(labLookup))
        {
            var lab = await _db.Laboratories.AsNoTracking()
                .FirstOrDefaultAsync(l => l.Name == labLookup, ct);
            if (lab != null) resolvedLaboratoryId = lab.Id;
        }

        var desc = dto.Description!;
        var title = !string.IsNullOrWhiteSpace(dto.Title) ? dto.Title!
            : (desc.Length > 200 ? desc.Substring(0, 200) : desc);

        var r = new ProblemReport
        {
            Id = Guid.NewGuid(),
            ReportedByUserId = realUserId,
            WorkstationId = resolvedWorkstationId,
            LaboratoryId = resolvedLaboratoryId,
            AssetId = null,
            Title = title,
            Description = desc,
            Category = dto.Category!,
            Priority = NormalizePriority(dto.Priority),
            Status = "REPORTED",
            ReportedAtUtc = DateTime.UtcNow,
            CreatedAtUtc = DateTime.UtcNow
        };
        _db.ProblemReports.Add(r);
        await _db.SaveChangesAsync(ct);

        try
        {
            var notifyIds = await _db.Users
                .Where(u => u.IsActive && (u.Role == "ADMIN" || u.Role == "ADMIN_TECHNICIAN" || u.Role == "TECHNICIAN" || u.Role == "SUPER_ADMIN" || u.Role == "LAB_ADMIN"))
                .Select(u => u.Id)
                .ToListAsync(ct);
            foreach (var nid in notifyIds)
            {
                _db.Notifications.Add(new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = nid,
                    Title = "New Problem Report",
                    Message = $"[{r.Category}] {r.Title}",
                    Type = "PROBLEM_REPORT",
                    IsRead = false,
                    CreatedAtUtc = DateTime.UtcNow
                });
            }
            if (notifyIds.Count > 0) await _db.SaveChangesAsync(ct);
        }
        catch { }

        return (await GetProblemReportByIdAsync(r.Id, ct))!;
    }

    public async Task<ProblemReportDto?> UpdateReportStatusAsync(Guid id, UpdateProblemReportStatusDto dto, CancellationToken ct = default)
    {
        var r = await _db.ProblemReports.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (r is null) return null;
        r.Status = dto.Status;
        if (!string.IsNullOrEmpty(dto.AdminNotes)) r.ResolutionNotes = dto.AdminNotes;
        if (dto.Status.Equals("RESOLVED", StringComparison.OrdinalIgnoreCase)) r.ResolvedAtUtc = DateTime.UtcNow;
        r.LastModifiedAtUtc = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return await GetProblemReportByIdAsync(id, ct);
    }

    public async Task<ProblemReportDto?> UpdateProblemReportAsync(Guid id, UpdateProblemReportDto dto, CancellationToken ct = default)
    {
        var r = await _db.ProblemReports.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (r is null) return null;
        if (!string.IsNullOrWhiteSpace(dto.Title))         r.Title = dto.Title!;
        if (!string.IsNullOrWhiteSpace(dto.Description))   r.Description = dto.Description!;
        if (!string.IsNullOrWhiteSpace(dto.Category))      r.Category = dto.Category!;
        if (!string.IsNullOrWhiteSpace(dto.Priority))      r.Priority = NormalizePriority(dto.Priority);
        if (!string.IsNullOrWhiteSpace(dto.Status))        r.Status = dto.Status!;
        if (!string.IsNullOrWhiteSpace(dto.ResolutionNotes)) r.ResolutionNotes = dto.ResolutionNotes;
        r.LastModifiedAtUtc = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return await GetProblemReportByIdAsync(id, ct);
    }

    public async Task<bool> DeleteProblemReportAsync(Guid id, CancellationToken ct = default)
    {
        var r = await _db.ProblemReports.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (r is null) return false;
        r.IsDeleted = true;
        r.DeletedAt = DateTime.UtcNow;
        r.LastModifiedAtUtc = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return true;
    }
}