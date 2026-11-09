using LabTrack.Api.Contracts;
using LabTrack.Api.Controllers;
using LabTrack.Domain.Entities;
using LabTrack.Infrastructure.Persistence.DbContext;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace LabTrack.Api.Services;

public class FinancialService : LabTrack.Api.Controllers.IFinancialService
{
    private readonly LabTrackDbContext _db;
    public FinancialService(LabTrackDbContext db) => _db = db;

    public async Task<PaginationResponse<FinancialTransactionDto>> GetTransactionsAsync(
        int pageNumber, int pageSize, string? type, DateTime? startDate, DateTime? endDate, CancellationToken ct = default)
    {
        if (pageNumber < 1) pageNumber = 1;
        if (pageSize < 1) pageSize = 10;

        var q = _db.FinancialExpenses.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(type)) q = q.Where(x => x.Category == type);
        if (startDate.HasValue) { var s = ToUtc(startDate.Value); q = q.Where(x => x.ExpenseDateUtc >= s); }
        if (endDate.HasValue)   { var e = ToUtc(endDate.Value);   q = q.Where(x => x.ExpenseDateUtc <= e); }

        var total = await q.CountAsync(ct);
        var totalPages = (int)Math.Ceiling(total / (double)pageSize);
        var items = await q.OrderByDescending(x => x.ExpenseDateUtc)
            .Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync(ct);

        return new PaginationResponse<FinancialTransactionDto>(
            items.Select(Map).ToList(), total, pageNumber, pageSize, totalPages,
            pageNumber > 1, pageNumber < totalPages);
    }

    public async Task<FinancialTransactionDto?> GetTransactionByIdAsync(Guid id, CancellationToken ct = default)
    {
        var x = await _db.FinancialExpenses.AsNoTracking().FirstOrDefaultAsync(e => e.Id == id, ct);
        return x is null ? null : Map(x);
    }

    public async Task<FinancialTransactionDto> CreateTransactionAsync(
        CreateFinancialTransactionDto dto, Guid recordedByUserId, CancellationToken ct = default)
    {
        if (recordedByUserId == Guid.Empty)
            throw new InvalidOperationException("Invalid user id.");

        var userExists = await _db.Users.AnyAsync(u => u.Id == recordedByUserId, ct);
        if (!userExists)
            throw new InvalidOperationException($"User {recordedByUserId} not found.");

        Guid? laboratoryId = null;
        if (dto.AssetId.HasValue)
        {
            laboratoryId = await _db.Assets.Where(a => a.Id == dto.AssetId.Value)
                .Select(a => (Guid?)a.LaboratoryId).FirstOrDefaultAsync(ct);
        }
        if (!laboratoryId.HasValue)
        {
            var anyLab = await _db.Laboratories.AsNoTracking().FirstOrDefaultAsync(ct);
            if (anyLab != null) laboratoryId = anyLab.Id;
        }

        // CRITICAL: Convert everything to UTC
        var transactionDateUtc = dto.TransactionDate == default 
            ? DateTime.UtcNow 
            : ToUtc(dto.TransactionDate);

        var x = new FinancialExpense
        {
            Id = Guid.NewGuid(),
            Category = string.IsNullOrWhiteSpace(dto.TransactionType) ? "Other" : dto.TransactionType,
            Amount = dto.Amount,
            Currency = string.IsNullOrWhiteSpace(dto.Currency) ? "PHP" : dto.Currency,
            Description = dto.Description ?? "",
            ExpenseDateUtc = transactionDateUtc,
            RecordedByUserId = recordedByUserId,
            AssetId = dto.AssetId,
            LaboratoryId = laboratoryId,
            CreatedAtUtc = DateTime.UtcNow
        };

        try
        {
            _db.FinancialExpenses.Add(x);
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException dbEx) when (dbEx.InnerException is PostgresException pg)
        {
            throw new InvalidOperationException(
                $"DB error {pg.SqlState}: {pg.MessageText}. Constraint: {pg.ConstraintName}. Column: {pg.ColumnName}.", dbEx);
        }

        return Map(x);
    }

    public async Task<FinancialSummaryDto> GetFinancialSummaryAsync(CancellationToken ct = default)
    {
        var all = await _db.FinancialExpenses.AsNoTracking().ToListAsync(ct);
        return new FinancialSummaryDto(
            TotalExpenditure: all.Sum(x => x.Amount),
            TotalRepairCosts: all.Where(x => x.Category.Contains("repair", StringComparison.OrdinalIgnoreCase)).Sum(x => x.Amount),
            TotalAssetAcquisitions: all.Where(x => x.Category.Contains("asset", StringComparison.OrdinalIgnoreCase)).Sum(x => x.Amount),
            TotalTransactionsCount: all.Count);
    }

    // CRITICAL: Forces any DateTime to UTC regardless of Kind
    private static DateTime ToUtc(DateTime dt)
    {
        return dt.Kind switch
        {
            DateTimeKind.Utc => dt,
            DateTimeKind.Local => dt.ToUniversalTime(),
            _ => DateTime.SpecifyKind(dt, DateTimeKind.Utc)  // Unspecified = assume UTC
        };
    }

    private static FinancialTransactionDto Map(FinancialExpense x) => new(
        x.Id, x.AssetId, null, x.Category, x.Amount, x.Currency,
        x.Description, x.ExpenseDateUtc, x.CreatedAtUtc);
}
