using LabTrack.Api.Contracts;
using LabTrack.Api.Controllers;
using LabTrack.Domain.Entities;
using LabTrack.Infrastructure.Persistence.DbContext;
using Microsoft.EntityFrameworkCore;

namespace LabTrack.Api.Services;

public class CommunicationService : LabTrack.Api.Controllers.ICommunicationService
{
    private readonly LabTrackDbContext _db;
    public CommunicationService(LabTrackDbContext db) => _db = db;

    public async Task<PaginationResponse<CommunicationDto>> GetCommunicationsAsync(
        int pageNumber, int pageSize, string? status, CancellationToken ct = default)
    {
        if (pageNumber < 1) pageNumber = 1;
        if (pageSize < 1) pageSize = 10;

        var q = _db.Communications.AsNoTracking()
            .Include(c => c.Sender)
            .Include(c => c.Recipient)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
            q = q.Where(c => c.Status == status);

        var total = await q.CountAsync(ct);
        var totalPages = (int)Math.Ceiling(total / (double)pageSize);
        var items = await q.OrderByDescending(c => c.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return new PaginationResponse<CommunicationDto>(
            items.Select(Map).ToList(),
            total, pageNumber, pageSize, totalPages,
            pageNumber > 1, pageNumber < totalPages);
    }

    public async Task<CommunicationDto?> GetCommunicationByIdAsync(Guid id, CancellationToken ct = default)
    {
        var c = await _db.Communications.AsNoTracking()
            .Include(x => x.Sender)
            .Include(x => x.Recipient)
            .FirstOrDefaultAsync(x => x.Id == id, ct);
        return c is null ? null : Map(c);
    }

    public async Task<CommunicationDto> SendCommunicationAsync(SendCommunicationDto dto, CancellationToken ct = default)
    {
        // Resolve recipient: prefer userId, fallback to email lookup
        User? recipient = null;
        if (dto.RecipientUserId != Guid.Empty)
            recipient = await _db.Users.FirstOrDefaultAsync(u => u.Id == dto.RecipientUserId, ct);

        if (recipient is null && !string.IsNullOrWhiteSpace(dto.RecipientEmail))
            recipient = await _db.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == dto.RecipientEmail.ToLower(), ct);

        if (recipient is null)
            throw new InvalidOperationException($"Recipient not found (userId={dto.RecipientUserId}, email={dto.RecipientEmail}).");

        // Sender: use recipient as fallback (no HttpContext sender in DTO)
        var senderId = recipient.Id;

        var entity = new Communication
        {
            Id = Guid.NewGuid(),
            SenderId = senderId,
            RecipientId = recipient.Id,
            Subject = string.IsNullOrWhiteSpace(dto.Subject) ? "(No subject)" : dto.Subject,
            Body = string.IsNullOrWhiteSpace(dto.Body) ? "(No body)" : dto.Body,
            Channel = !string.IsNullOrWhiteSpace(dto.RecipientEmail) ? "Email" : "InApp",
            Status = "Sent",
            SentAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };

        try
        {
            _db.Communications.Add(entity);
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException dbEx) when (dbEx.InnerException is Npgsql.PostgresException pg)
        {
            throw new InvalidOperationException(
                $"DB error {pg.SqlState}: {pg.MessageText}. Constraint: {pg.ConstraintName}. Column: {pg.ColumnName}.", dbEx);
        }

        // Reload with navigations
        entity = await _db.Communications
            .Include(x => x.Sender)
            .Include(x => x.Recipient)
            .FirstAsync(x => x.Id == entity.Id, ct);

        return Map(entity);
    }

    public async Task<bool> ResendCommunicationAsync(Guid id, CancellationToken ct = default)
    {
        var existing = await _db.Communications.FirstOrDefaultAsync(c => c.Id == id, ct);
        if (existing is null) return false;

        existing.Status = "Sent";
        existing.SentAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return true;
    }

    private static CommunicationDto Map(Communication c) => new(
        Id: c.Id,
        RecipientUserId: c.RecipientId,
        RecipientEmail: c.Recipient?.Email ?? "",
        Subject: c.Subject,
        Body: c.Body,
        Status: c.Status,
        RetryCount: 0,
        CreatedAt: c.CreatedAt,
        SentAt: c.SentAt
    );
}
