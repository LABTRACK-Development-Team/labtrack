using LabTrack.Api.Contracts;
using LabTrack.Api.Controllers;
using LabTrack.Application.Interfaces;
using LabTrack.Domain.Entities;

namespace LabTrack.Api.Services;

public class NotificationService : LabTrack.Api.Controllers.INotificationService
{
    private readonly IUnitOfWork _unitOfWork;

    public NotificationService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    public async Task<PaginationResponse<NotificationDto>> GetUserNotificationsAsync(
        Guid userId, int pageNumber, int pageSize, bool? isRead,
        CancellationToken cancellationToken = default)
    {
        if (pageNumber < 1) pageNumber = 1;
        if (pageSize < 1) pageSize = 10;

        var all = await _unitOfWork.Notifications.GetAllAsync(cancellationToken);
        var filtered = all.Where(n => n.UserId == userId);

        if (isRead.HasValue)
            filtered = filtered.Where(n => n.IsRead == isRead.Value);

        var list = filtered.OrderByDescending(n => n.CreatedAtUtc).ToList();
        var total = list.Count;
        var items = list.Skip((pageNumber - 1) * pageSize).Take(pageSize).Select(MapToDto).ToList();
        var totalPages = (int)Math.Ceiling(total / (double)pageSize);

        return new PaginationResponse<NotificationDto>(items, total, pageNumber, pageSize, totalPages, pageNumber > 1, pageNumber < totalPages);
    }

    public async Task<bool> MarkAsReadAsync(Guid notificationId, Guid userId, CancellationToken cancellationToken = default)
    {
        var n = await _unitOfWork.Notifications.GetByIdAsync(notificationId, cancellationToken);
        if (n is null || n.UserId != userId) return false;

        n.IsRead = true;
        n.ReadAtUtc = DateTime.UtcNow;
        await _unitOfWork.Notifications.UpdateAsync(n, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> MarkAllAsReadAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var all = await _unitOfWork.Notifications.GetAllAsync(cancellationToken);
        var unread = all.Where(n => n.UserId == userId && !n.IsRead).ToList();

        foreach (var n in unread)
        {
            n.IsRead = true;
            n.ReadAtUtc = DateTime.UtcNow;
            await _unitOfWork.Notifications.UpdateAsync(n, cancellationToken);
        }

        if (unread.Count == 0) return true;
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<NotificationDto> CreateNotificationAsync(CreateNotificationDto dto, CancellationToken cancellationToken = default)
    {
        var n = new Notification
        {
            Id = Guid.NewGuid(),
            UserId = dto.UserId,
            Title = dto.Title,
            Message = dto.Message,
            Type = dto.Type,
            IsRead = false,
            CreatedAtUtc = DateTime.UtcNow
        };

        await _unitOfWork.Notifications.AddAsync(n, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return MapToDto(n);
    }

    private static NotificationDto MapToDto(Notification n) => new(
        n.Id,
        n.UserId,
        n.Title,
        n.Message,
        n.Type,
        n.IsRead,
        n.CreatedAtUtc
    );

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        if (id == Guid.Empty)
            throw new ArgumentException("Notification ID cannot be empty.", nameof(id));

        var notification = await _unitOfWork.Notifications.GetByIdAsync(id, cancellationToken);
        if (notification != null)
        {
            notification.IsDeleted = true;
            notification.DeletedAt = DateTime.UtcNow;
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
    }
}