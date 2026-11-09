using LabTrack.Api.Contracts;
using LabTrack.Api.Controllers;
using LabTrack.Application.Interfaces;
using LabTrack.Domain.Entities;

namespace LabTrack.Api.Services;

public class QrService : LabTrack.Api.Controllers.IQrService
{
    private readonly IUnitOfWork _uow;
    public QrService(IUnitOfWork uow) => _uow = uow;

    public async Task<QrValidationDto?> ValidateTokenAsync(string qrToken, CancellationToken ct = default)
    {
        var all = await _uow.Qrs.GetAllAsync(ct);
        var qr = all.FirstOrDefault(q => q.CodeValue == qrToken && q.IsActive);
        if (qr is null) return null;
        return new QrValidationDto(
            qr.IsActive, qr.EntityId, "", Guid.Empty, "",
            qr.ExpiresAtUtc ?? DateTime.UtcNow.AddHours(1));
    }

    public async Task<QrGenerateResponseDto> GenerateTokenForWorkstationAsync(Guid workstationId, CancellationToken ct = default)
    {
        var token = "QR-" + Guid.NewGuid().ToString("N").Substring(0, 16).ToUpper();
        var qr = new QrCode
        {
            Id = Guid.NewGuid(),
            EntityId = workstationId,
            EntityType = "WORKSTATION",
            CodeValue = token,
            GeneratedAtUtc = DateTime.UtcNow,
            ExpiresAtUtc = DateTime.UtcNow.AddHours(8),
            IsActive = true
        };
        await _uow.Qrs.AddAsync(qr, ct);
        await _uow.SaveChangesAsync(ct);
        return new QrGenerateResponseDto(token, workstationId, qr.GeneratedAtUtc, qr.ExpiresAtUtc ?? DateTime.UtcNow.AddHours(8));
    }
}