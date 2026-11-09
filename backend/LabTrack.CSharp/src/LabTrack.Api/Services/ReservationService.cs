using Npgsql;
using LabTrack.Api.Contracts;
using LabTrack.Api.Controllers;
using LabTrack.Domain.Entities;
using LabTrack.Infrastructure.Persistence.DbContext;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace LabTrack.Api.Services;

public class ReservationService : LabTrack.Api.Controllers.IReservationService
{
    private readonly LabTrackDbContext _db;
    private readonly IHttpContextAccessor _httpContext;

    public ReservationService(LabTrackDbContext db, IHttpContextAccessor httpContext)
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

    public async Task<PaginationResponse<ReservationDto>> GetReservationsAsync(
        int pageNumber, int pageSize, string? status, Guid? labId, Guid? userId, CancellationToken ct = default)
    {
        if (pageNumber < 1) pageNumber = 1;
        if (pageSize < 1) pageSize = 10;
        var q = _db.Reservations.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(status)) q = q.Where(r => r.Status == status);
        if (labId.HasValue) q = q.Where(r => r.LaboratoryId == labId.Value);
        if (userId.HasValue) q = q.Where(r => r.UserId == userId.Value);
        var total = await q.CountAsync(ct);
        var items = await q
            .OrderByDescending(r => r.StartTimeUtc)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new ReservationDto(
                r.Id, r.LaboratoryId, "", r.UserId, "",
                r.Purpose, r.StartTimeUtc, r.EndTimeUtc, r.Status, null, r.CreatedAtUtc))
            .ToListAsync(ct);
        var totalPages = (int)Math.Ceiling(total / (double)pageSize);
        return new PaginationResponse<ReservationDto>(items, total, pageNumber, pageSize, totalPages, pageNumber > 1, pageNumber < totalPages);
    }

    public async Task<ReservationDto?> GetReservationByIdAsync(Guid id, CancellationToken ct = default)
        => await _db.Reservations.AsNoTracking()
            .Where(x => x.Id == id)
            .Select(r => new ReservationDto(
                r.Id, r.LaboratoryId, "", r.UserId, "",
                r.Purpose, r.StartTimeUtc, r.EndTimeUtc, r.Status, null, r.CreatedAtUtc))
            .FirstOrDefaultAsync(ct);

    public async Task<ReservationDto> CreateReservationAsync(CreateReservationDto dto, Guid requestedByUserId, CancellationToken ct = default)
    {
        try
        {
            var realUserId = requestedByUserId;
            if (realUserId == Guid.Empty)
                throw new InvalidOperationException("UserId cannot be empty.");

            var labExists = await _db.Laboratories.AnyAsync(l => l.Id == dto.LabId, ct);
            if (!labExists)
                throw new InvalidOperationException($"Laboratory {dto.LabId} not found.");

            var userExists = await _db.Users.AnyAsync(u => u.Id == realUserId, ct);
            if (!userExists)
                throw new InvalidOperationException($"User {realUserId} not found.");

            var purpose = string.IsNullOrWhiteSpace(dto.Purpose) ? "Reservation" : dto.Purpose.Trim();
            var title = purpose.Length > 150 ? purpose.Substring(0, 150) : purpose;

            var r = new Reservation
            {
                Id = Guid.NewGuid(),
                UserId = realUserId,
                LaboratoryId = dto.LabId,
                Title = title,
                Purpose = purpose,
                StartTimeUtc = DateTime.SpecifyKind(dto.StartTime, DateTimeKind.Utc),
                EndTimeUtc = DateTime.SpecifyKind(dto.EndTime, DateTimeKind.Utc),
                Status = "Pending",
                CreatedAtUtc = DateTime.UtcNow
            };
            _db.Reservations.Add(r);
            await _db.SaveChangesAsync(ct);

            try
            {
                var studentIds = await _db.Users
                    .Where(u => u.IsActive && u.Role == "STUDENT")
                    .Select(u => u.Id)
                    .ToListAsync(ct);

                foreach (var sid in studentIds)
                {
                    _db.Notifications.Add(new Notification
                    {
                        Id = Guid.NewGuid(),
                        UserId = sid,
                        Title = "New Lab Reservation",
                        Message = "Reservation: " + title + " at " + r.StartTimeUtc.ToString("MMM dd HH:mm") + " UTC",
                        Type = "RESERVATION",
                        IsRead = false,
                        CreatedAtUtc = DateTime.UtcNow
                    });
                }
                if (studentIds.Count > 0) await _db.SaveChangesAsync(ct);
            }
            catch { }

            return new ReservationDto(r.Id, r.LaboratoryId, "", r.UserId, "", r.Purpose, r.StartTimeUtc, r.EndTimeUtc, r.Status, null, r.CreatedAtUtc);
        }
        catch (Microsoft.EntityFrameworkCore.DbUpdateException dbEx) when (dbEx.InnerException is Npgsql.PostgresException pg)
        {
            throw new InvalidOperationException(
                $"DB ERROR {pg.SqlState}: {pg.MessageText} | Constraint: {pg.ConstraintName} | Column: {pg.ColumnName} | Detail: {pg.Detail}", dbEx);
        }
        catch (Exception ex) when (!(ex is InvalidOperationException))
        {
            throw new InvalidOperationException($"Unexpected: {ex.Message} | Inner: {ex.InnerException?.Message}", ex);
        }
    }

    public async Task<ReservationDto?> UpdateReservationStatusAsync(Guid id, UpdateReservationStatusDto dto, CancellationToken ct = default)
    {
        var r = await _db.Reservations.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (r is null) return null;
        r.Status = dto.Status;
        if (!string.IsNullOrEmpty(dto.AdminNotes)) r.CancellationReason = dto.AdminNotes;
        r.LastModifiedAtUtc = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return new ReservationDto(r.Id, r.LaboratoryId, "", r.UserId, "", r.Purpose, r.StartTimeUtc, r.EndTimeUtc, r.Status, dto.AdminNotes, r.CreatedAtUtc);
    }

    public async Task<bool> CancelReservationAsync(Guid id, Guid userId, CancellationToken ct = default)
    {
        var r = await _db.Reservations.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (r is null || r.UserId != userId) return false;
        r.Status = "CANCELLED"; r.LastModifiedAtUtc = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return true;
    }
}