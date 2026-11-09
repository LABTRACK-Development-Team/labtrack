using LabTrack.Application.Dtos.Maintenance;
using LabTrack.Application.Interfaces;

namespace LabTrack.Application.Services;

public class MaintenanceService : IMaintenanceService
{
    private readonly IUnitOfWork _unitOfWork;

    public MaintenanceService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<MaintenanceScheduleDto?> GetByIdAsync(
        Guid id, 
        CancellationToken cancellationToken = default)
    {
        if (id == Guid.Empty)
            throw new ArgumentException("Maintenance schedule ID cannot be empty.", nameof(id));

        return await Task.FromResult<MaintenanceScheduleDto?>(null);
    }

    public async Task<IReadOnlyList<MaintenanceScheduleDto>> GetByAssetIdAsync(
        Guid assetId, 
        int skip = 0, 
        int take = 50, 
        CancellationToken cancellationToken = default)
    {
        if (assetId == Guid.Empty)
            throw new ArgumentException("Asset ID cannot be empty.", nameof(assetId));

        return await Task.FromResult<IReadOnlyList<MaintenanceScheduleDto>>(Array.Empty<MaintenanceScheduleDto>());
    }

    public async Task<IReadOnlyList<MaintenanceScheduleDto>> GetByLaboratoryIdAsync(
        Guid laboratoryId, 
        int skip = 0, 
        int take = 50, 
        CancellationToken cancellationToken = default)
    {
        if (laboratoryId == Guid.Empty)
            throw new ArgumentException("Laboratory ID cannot be empty.", nameof(laboratoryId));

        return await Task.FromResult<IReadOnlyList<MaintenanceScheduleDto>>(Array.Empty<MaintenanceScheduleDto>());
    }

    public async Task<IReadOnlyList<MaintenanceScheduleDto>> GetUpcomingSchedulesAsync(
        Guid? laboratoryId = null, 
        int daysAhead = 30, 
        CancellationToken cancellationToken = default)
    {
        return await Task.FromResult<IReadOnlyList<MaintenanceScheduleDto>>(Array.Empty<MaintenanceScheduleDto>());
    }

    public async Task<IReadOnlyList<MaintenanceScheduleDto>> GetOverdueSchedulesAsync(
        Guid? laboratoryId = null, 
        CancellationToken cancellationToken = default)
    {
        return await Task.FromResult<IReadOnlyList<MaintenanceScheduleDto>>(Array.Empty<MaintenanceScheduleDto>());
    }


    public async Task<MaintenanceScheduleDto> CreateScheduleAsync(
        CreateMaintenanceScheduleDto dto, 
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(dto);

        if (dto.AssetId == Guid.Empty)
            throw new ArgumentException("Asset ID must be provided.", nameof(dto.AssetId));

        if (dto.ScheduledDateUtc < DateTime.UtcNow.Date)
            throw new ArgumentException("Scheduled date cannot be in the past.", nameof(dto.ScheduledDateUtc));

        return await Task.FromResult(new MaintenanceScheduleDto
        {
            Id = Guid.NewGuid(),
            AssetId = dto.AssetId,
            MaintenanceType = dto.MaintenanceType,
            Description = dto.Description,
            ScheduledDateUtc = dto.ScheduledDateUtc,
            Status = "Scheduled",
            AssignedTechnicianId = dto.AssignedTechnicianId,
            RecurringIntervalDays = dto.RecurringIntervalDays
        });
    }

    public async Task<MaintenanceScheduleDto> UpdateScheduleAsync(
        Guid id, 
        UpdateMaintenanceScheduleDto dto, 
        CancellationToken cancellationToken = default)
    {
        if (id == Guid.Empty)
            throw new ArgumentException("Maintenance schedule ID cannot be empty.", nameof(id));

        ArgumentNullException.ThrowIfNull(dto);

        return await Task.FromResult(new MaintenanceScheduleDto
        {
            Id = id,
            AssetId = dto.AssetId ?? Guid.Empty,
            MaintenanceType = dto.MaintenanceType,
            Description = dto.Description,
            ScheduledDateUtc = dto.ScheduledDateUtc == default ? DateTime.UtcNow : dto.ScheduledDateUtc,
            Status = dto.Status ?? "Scheduled",
            AssignedTechnicianId = dto.AssignedTechnicianId,
            RecurringIntervalDays = dto.RecurringIntervalDays
        });
    }

 
    public async Task CompleteScheduleAsync(
        Guid id, 
        string completionNotes, 
        CancellationToken cancellationToken = default)
    {
        if (id == Guid.Empty)
            throw new ArgumentException("Maintenance schedule ID cannot be empty.", nameof(id));

        if (string.IsNullOrWhiteSpace(completionNotes))
            throw new ArgumentException("Completion notes must be provided.", nameof(completionNotes));

        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }


    public async Task CancelScheduleAsync(
        Guid id, 
        string reason, 
        CancellationToken cancellationToken = default)
    {
        if (id == Guid.Empty)
            throw new ArgumentException("Maintenance schedule ID cannot be empty.", nameof(id));

        if (string.IsNullOrWhiteSpace(reason))
            throw new ArgumentException("Cancellation reason must be provided.", nameof(reason));

        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
    
}