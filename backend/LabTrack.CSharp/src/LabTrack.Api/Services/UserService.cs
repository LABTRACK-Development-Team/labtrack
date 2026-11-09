using LabTrack.Api.Contracts;
using LabTrack.Application.Interfaces;
using LabTrack.Domain.Entities;
using LabTrack.Infrastructure.Persistence.DbContext;
using Microsoft.EntityFrameworkCore;

namespace LabTrack.Api.Services;

public class UserService : LabTrack.Api.Controllers.IUserService
{
    private readonly LabTrackDbContext _db;
    private readonly IPasswordHasher _passwordHasher;

    public UserService(LabTrackDbContext db, IPasswordHasher passwordHasher)
    {
        _db = db;
        _passwordHasher = passwordHasher;
    }

    public async Task<PaginationResponse<LabTrack.Api.Controllers.UserDto>> GetUsersAsync(
        int pageNumber, int pageSize, string? search, string? role, CancellationToken ct = default)
    {
        if (pageNumber < 1) pageNumber = 1;
        if (pageSize < 1) pageSize = 10;

        var q = _db.Users.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
            q = q.Where(u => u.Email.Contains(search)
                          || u.FirstName.Contains(search)
                          || u.LastName.Contains(search));
        if (!string.IsNullOrWhiteSpace(role))
            q = q.Where(u => u.Role == role);

        var total = await q.CountAsync(ct);
        var totalPages = (int)Math.Ceiling(total / (double)pageSize);
        var items = await q.OrderBy(u => u.Email)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return new PaginationResponse<LabTrack.Api.Controllers.UserDto>(
            items.Select(MapToApiDto).ToList(),
            total, pageNumber, pageSize, totalPages,
            pageNumber > 1, pageNumber < totalPages);
    }

    public async Task<LabTrack.Api.Controllers.UserDto?> GetUserByIdAsync(Guid id, CancellationToken ct = default)
    {
        var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == id, ct);
        return user is null ? null : MapToApiDto(user);
    }

    public async Task<LabTrack.Api.Controllers.UserDto> CreateUserAsync(
        LabTrack.Api.Controllers.CreateUserDto request, CancellationToken ct = default)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var exists = await _db.Users.AnyAsync(u => u.Email.ToLower() == email, ct);
        if (exists) throw new InvalidOperationException("Email already exists.");

        var (first, last) = SplitName(request.FullName);
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = email,
            FirstName = first,
            LastName = last,
            PasswordHash = _passwordHasher.HashPassword(request.Password),
            Role = string.IsNullOrWhiteSpace(request.Role) ? "STUDENT" : request.Role,
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow
        };
        _db.Users.Add(user);
        await _db.SaveChangesAsync(ct);
        return MapToApiDto(user);
    }

    public async Task<LabTrack.Api.Controllers.UserDto?> UpdateUserAsync(
        Guid id, LabTrack.Api.Controllers.UpdateUserDto request, CancellationToken ct = default)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == id, ct);
        if (user is null) return null;

        if (!string.IsNullOrWhiteSpace(request.Email) && request.Email.ToLower() != user.Email.ToLower())
        {
            var email = request.Email.Trim().ToLowerInvariant();
            var taken = await _db.Users.AnyAsync(u => u.Email.ToLower() == email && u.Id != id, ct);
            if (taken) throw new InvalidOperationException("Email already in use.");
            user.Email = email;
        }
        if (!string.IsNullOrWhiteSpace(request.FullName))
        {
            var (first, last) = SplitName(request.FullName);
            user.FirstName = first;
            user.LastName = last;
        }
        user.LastModifiedAtUtc = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return MapToApiDto(user);
    }

    public async Task<bool> DeleteUserAsync(Guid id, CancellationToken ct = default)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == id, ct);
        if (user is null) return false;
        user.IsDeleted = true; user.DeletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> ToggleUserStatusAsync(Guid id, bool isActive, CancellationToken ct = default)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == id, ct);
        if (user is null) return false;
        user.IsActive = isActive;
        user.LastModifiedAtUtc = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return true;
    }

    private static LabTrack.Api.Controllers.UserDto MapToApiDto(User u) => new(
        Id: u.Id,
        Username: u.Email,
        Email: u.Email,
        FullName: $"{u.FirstName} {u.LastName}".Trim(),
        Role: u.Role,
        StudentNumber: null,
        IsActive: u.IsActive,
        CreatedAt: u.CreatedAtUtc,
        LastLoginAt: u.LastLoginUtc
    );

    private static (string First, string Last) SplitName(string fullName)
    {
        if (string.IsNullOrWhiteSpace(fullName)) return ("", "");
        var parts = fullName.Trim().Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
        return parts.Length == 1 ? (parts[0], "") : (parts[0], parts[1]);
    }
}
