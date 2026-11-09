using LabTrack.Application.Dtos.Tickets;
using LabTrack.Application.Interfaces;

namespace LabTrack.Application.Services;

public class RepairTicketService : IRepairTicketService
{
    private readonly IUnitOfWork _unitOfWork;

    public RepairTicketService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<RepairTicketDto?> GetByIdAsync(
        Guid id, 
        CancellationToken cancellationToken = default)
    {
        if (id == Guid.Empty)
            throw new ArgumentException("Repair ticket ID cannot be empty.", nameof(id));

        return await Task.FromResult<RepairTicketDto?>(null);
    }

    public async Task<RepairTicketDto?> GetByTicketNumberAsync(
        string ticketNumber, 
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(ticketNumber))
            throw new ArgumentException("Ticket number cannot be empty.", nameof(ticketNumber));

        return await Task.FromResult<RepairTicketDto?>(null);
    }

    public async Task<IReadOnlyList<RepairTicketDto>> GetByAssetIdAsync(
        Guid assetId, 
        int skip = 0, 
        int take = 50, 
        CancellationToken cancellationToken = default)
    {
        if (assetId == Guid.Empty)
            throw new ArgumentException("Asset ID cannot be empty.", nameof(assetId));

        return await Task.FromResult<IReadOnlyList<RepairTicketDto>>(Array.Empty<RepairTicketDto>());
    }

    public async Task<IReadOnlyList<RepairTicketDto>> GetByTechnicianIdAsync(
        Guid technicianId, 
        int skip = 0, 
        int take = 50, 
        CancellationToken cancellationToken = default)
    {
        if (technicianId == Guid.Empty)
            throw new ArgumentException("Technician ID cannot be empty.", nameof(technicianId));

        return await Task.FromResult<IReadOnlyList<RepairTicketDto>>(Array.Empty<RepairTicketDto>());
    }

    public async Task<IReadOnlyList<RepairTicketDto>> GetByStatusAsync(
        string status, 
        int skip = 0, 
        int take = 50, 
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(status))
            throw new ArgumentException("Status cannot be empty.", nameof(status));

        return await Task.FromResult<IReadOnlyList<RepairTicketDto>>(Array.Empty<RepairTicketDto>());
    }

    public async Task<RepairTicketDto> CreateAsync(
        CreateRepairTicketDto dto, 
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(dto);

        if (dto.AssetId == Guid.Empty)
            throw new ArgumentException("Asset ID must be provided.", nameof(dto.AssetId));

        if (string.IsNullOrWhiteSpace(dto.ProblemDescription))
            throw new ArgumentException("Problem description cannot be empty.", nameof(dto.ProblemDescription));

        return await Task.FromResult(new RepairTicketDto
        {
            Id = Guid.NewGuid(),
            AssetId = dto.AssetId,
            ProblemDescription = dto.ProblemDescription,
            Status = "Pending",
            CreatedAtUtc = DateTime.UtcNow
        });
    }

    public async Task<RepairTicketDto> UpdateStatusAsync(
        Guid id, 
        UpdateRepairTicketStatusDto dto, 
        CancellationToken cancellationToken = default)
    {
        if (id == Guid.Empty)
            throw new ArgumentException("Repair ticket ID cannot be empty.", nameof(id));

        ArgumentNullException.ThrowIfNull(dto);

        if (string.IsNullOrWhiteSpace(dto.Status))
            throw new ArgumentException("Status cannot be empty.", nameof(dto.Status));

        return await Task.FromResult(new RepairTicketDto
        {
            Id = id,
            Status = dto.Status,
            Notes = dto.Notes
        });
    }

    public async Task AssignTechnicianAsync(
        Guid id, 
        Guid technicianId, 
        CancellationToken cancellationToken = default)
    {
        if (id == Guid.Empty || technicianId == Guid.Empty)
            throw new ArgumentException("Repair ticket ID and Technician ID must be valid.");

        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task CompleteRepairAsync(
        Guid id, 
        string repairSummary, 
        decimal laborCost, 
        decimal partsCost, 
        CancellationToken cancellationToken = default)
    {
        if (id == Guid.Empty)
            throw new ArgumentException("Repair ticket ID cannot be empty.", nameof(id));

        if (string.IsNullOrWhiteSpace(repairSummary))
            throw new ArgumentException("Repair summary cannot be empty.", nameof(repairSummary));

        if (laborCost < 0 || partsCost < 0)
            throw new ArgumentException("Labor and parts costs cannot be negative.");

        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task CancelTicketAsync(
        Guid id, 
        string reason, 
        CancellationToken cancellationToken = default)
    {
        if (id == Guid.Empty)
            throw new ArgumentException("Repair ticket ID cannot be empty.", nameof(id));

        if (string.IsNullOrWhiteSpace(reason))
            throw new ArgumentException("Cancellation reason must be provided.", nameof(reason));

        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}