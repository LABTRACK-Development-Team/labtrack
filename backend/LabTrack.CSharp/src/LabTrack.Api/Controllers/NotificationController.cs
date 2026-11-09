using LabTrack.Api.Contracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LabTrack.Api.Controllers;

public interface INotificationService
{
    Task<PaginationResponse<NotificationDto>> GetUserNotificationsAsync(Guid userId, int pageNumber, int pageSize, bool? isRead, CancellationToken cancellationToken = default);
    Task<bool> MarkAsReadAsync(Guid notificationId, Guid userId, CancellationToken cancellationToken = default);
    Task<bool> MarkAllAsReadAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<NotificationDto> CreateNotificationAsync(CreateNotificationDto request, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}

public sealed record NotificationDto(
    Guid Id,
    Guid UserId,
    string Title,
    string Message,
    string Type,
    bool IsRead,
    DateTime CreatedAt
);

public sealed record CreateNotificationDto(
    Guid UserId,
    string Title,
    string Message,
    string Type
);

[ApiController]
[Route("api/v1/notifications")]
[Authorize]
public sealed class NotificationController : ControllerBase
{
    private readonly INotificationService _notificationService;
    private readonly ILogger<NotificationController> _logger;

    public NotificationController(
        INotificationService notificationService,
        ILogger<NotificationController> logger)
    {
        _notificationService = notificationService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PaginationResponse<NotificationDto>>>> GetMyNotifications(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] bool? isRead = null,
        CancellationToken cancellationToken = default)
    {
        if (pageNumber < 1 || pageSize < 1)
        {
            return BadRequest(ApiResponse<PaginationResponse<NotificationDto>>.Fail(
                "INVALID_PAGINATION",
                "Page number and page size must be greater than zero."));
        }

        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(ApiResponse<PaginationResponse<NotificationDto>>.Fail(
                "UNAUTHORIZED",
                "User identity is invalid or missing."));
        }

        try
        {
            var result = await _notificationService.GetUserNotificationsAsync(userId, pageNumber, pageSize, isRead, cancellationToken);
            return Ok(ApiResponse<PaginationResponse<NotificationDto>>.Ok(result));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching notifications for user {UserId}", userId);
            return StatusCode(500, ApiResponse<PaginationResponse<NotificationDto>>.Fail(
                "NOTIFICATION_ERROR",
                "An error occurred while fetching notifications."));
        }
    }

    [HttpPatch("{id:guid}/read")]
    public async Task<ActionResult<ApiResponse<bool>>> MarkAsRead(
        Guid id,
        CancellationToken cancellationToken)
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(ApiResponse<bool>.Fail(
                "UNAUTHORIZED",
                "User identity is invalid or missing."));
        }

        try
        {
            var success = await _notificationService.MarkAsReadAsync(id, userId, cancellationToken);
            if (!success)
            {
                return NotFound(ApiResponse<bool>.Fail(
                    "NOTIFICATION_NOT_FOUND",
                    $"Notification with ID '{id}' was not found or does not belong to the user."));
            }

            return Ok(ApiResponse<bool>.Ok(true));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking notification {NotificationId} as read", id);
            return StatusCode(500, ApiResponse<bool>.Fail(
                "NOTIFICATION_ERROR",
                "An error occurred while updating notification status."));
        }
    }

    [HttpPost("read-all")]
    public async Task<ActionResult<ApiResponse<bool>>> MarkAllAsRead(
        CancellationToken cancellationToken)
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(ApiResponse<bool>.Fail(
                "UNAUTHORIZED",
                "User identity is invalid or missing."));
        }

        try
        {
            await _notificationService.MarkAllAsReadAsync(userId, cancellationToken);
            return Ok(ApiResponse<bool>.Ok(true));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking all notifications as read for user {UserId}", userId);
            return StatusCode(500, ApiResponse<bool>.Fail(
                "NOTIFICATION_ERROR",
                "An error occurred while marking all notifications as read."));
        }
    }

    [HttpPost]
    [Authorize(Roles = "TECHNICIAN,ADMIN,ADMIN_TECHNICIAN")]
    public async Task<ActionResult<ApiResponse<NotificationDto>>> CreateNotification(
        [FromBody] CreateNotificationDto request,
        CancellationToken cancellationToken)
    {
        if (request.UserId == Guid.Empty || string.IsNullOrWhiteSpace(request.Title) || string.IsNullOrWhiteSpace(request.Message))
        {
            return BadRequest(ApiResponse<NotificationDto>.Fail(
                "INVALID_NOTIFICATION_DATA",
                "Target User ID, title, and message are required."));
        }

        try
        {
            var notification = await _notificationService.CreateNotificationAsync(request, cancellationToken);
            return Ok(ApiResponse<NotificationDto>.Ok(notification));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating notification for user {UserId}", request.UserId);
            return StatusCode(500, ApiResponse<NotificationDto>.Fail(
                "NOTIFICATION_CREATE_ERROR",
                "An error occurred while creating the notification."));
        }
    }
    // ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ AUTO-GENERATED GET ALL ENDPOINT ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬

    [HttpDelete("{id:guid}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteNotification(
        Guid id, CancellationToken cancellationToken)
    {
        try
        {
            await _notificationService.DeleteAsync(id, cancellationToken);
            return Ok(ApiResponse<bool>.Ok(true));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting notification {Id}", id);
            return StatusCode(500, ApiResponse<bool>.Fail("NOTIFICATION_DELETE_ERROR", "Error deleting notification"));
        }
    }
}