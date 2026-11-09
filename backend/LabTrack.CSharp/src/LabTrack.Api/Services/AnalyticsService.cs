using LabTrack.Infrastructure.Persistence.DbContext;
using Microsoft.EntityFrameworkCore;

namespace LabTrack.Api.Services;

public class AnalyticsService : LabTrack.Api.Controllers.IAnalyticsService
{
    private readonly LabTrackDbContext _db;
    public AnalyticsService(LabTrackDbContext db) => _db = db;

    public async Task<LabTrack.Api.Controllers.LabUsageStatsDto> GetLabUsageStatsAsync(
        DateTime startDate, DateTime endDate, CancellationToken ct = default)
    {
        var logs = await _db.PcUsageLogs.AsNoTracking()
            .Where(p => p.SessionStartUtc >= startDate && p.SessionStartUtc <= endDate)
            .ToListAsync(ct);

        var totalSessions = logs.Count;
        var totalMinutes = logs.Where(p => p.DurationMinutes.HasValue).Sum(p => p.DurationMinutes!.Value);
        var uniqueStudents = logs.Where(p => p.UserId.HasValue).Select(p => p.UserId!.Value).Distinct().Count();
        var peakHour = logs
            .GroupBy(p => p.SessionStartUtc.Hour)
            .OrderByDescending(g => g.Count())
            .Select(g => (double)g.Key)
            .FirstOrDefault();

        return new LabTrack.Api.Controllers.LabUsageStatsDto(
            TotalSessions: totalSessions,
            TotalHoursLogged: totalMinutes / 60.0,
            UniqueStudentsCount: uniqueStudents,
            PeakHour: peakHour);
    }

    public async Task<IReadOnlyList<LabTrack.Api.Controllers.AssetStatusSummaryDto>> GetAssetStatusSummaryAsync(
        CancellationToken ct = default)
    {
        var groups = await _db.Assets.AsNoTracking()
            .GroupBy(a => a.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync(ct);

        var total = groups.Sum(g => g.Count);
        return groups
            .OrderByDescending(g => g.Count)
            .Select(g => new LabTrack.Api.Controllers.AssetStatusSummaryDto(
                Status: g.Status ?? "Unknown",
                Count: g.Count,
                Percentage: total > 0 ? (g.Count / (double)total) * 100 : 0))
            .ToList();
    }

    public async Task<IReadOnlyList<LabTrack.Api.Controllers.FrequentIssueDto>> GetFrequentIssuesAsync(
        int limit = 10, CancellationToken ct = default)
    {
        var groups = await _db.ProblemReports.AsNoTracking()
            .GroupBy(p => p.Category ?? "Other")
            .Select(g => new
            {
                Category = g.Key,
                TotalReports = g.Count(),
                TotalEstimatedCost = 0m /* ProblemReport has no cost field */
            })
            .OrderByDescending(g => g.TotalReports)
            .Take(limit)
            .ToListAsync(ct);

        return groups.Select(g => new LabTrack.Api.Controllers.FrequentIssueDto(
            Category: g.Category,
            TotalReports: g.TotalReports,
            TotalEstimatedCost: g.TotalEstimatedCost)).ToList();
    }
}

