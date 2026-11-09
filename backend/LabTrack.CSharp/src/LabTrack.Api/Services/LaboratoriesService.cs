using Npgsql;
using LabTrack.Api.Contracts;
using LabTrack.Api.Controllers;
using LabTrack.Application.Interfaces;
using LabTrack.Domain.Entities;

namespace LabTrack.Api.Services;

public class LaboratoriesService : ILaboratoriesService
{
    private readonly IUnitOfWork _unitOfWork;

    public LaboratoriesService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    public async Task<PaginationResponse<LaboratoryDto>> GetLaboratoriesAsync(
        int pageNumber, int pageSize, string? search, string? status,
        CancellationToken cancellationToken = default)
    {
        if (pageNumber < 1) pageNumber = 1;
        if (pageSize < 1) pageSize = 10;

        var labs = await _unitOfWork.Laboratories.GetAllAsync(cancellationToken);

        IEnumerable<Laboratory> filtered = labs;

        if (!string.IsNullOrWhiteSpace(search))
        {
            filtered = filtered.Where(l =>
                l.Name.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                l.Building.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                l.RoomNumber.Contains(search, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            var isActive = status.Equals("Active", StringComparison.OrdinalIgnoreCase);
            filtered = filtered.Where(l => l.IsActive == isActive);
        }

        var filteredList = filtered.ToList();
        var totalCount = filteredList.Count;

        var items = filteredList
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(MapToDto)
            .ToList();

        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        return new PaginationResponse<LaboratoryDto>(
            items,
            totalCount,
            pageNumber,
            pageSize,
            totalPages,
            pageNumber > 1,
            pageNumber < totalPages);
    }

    public async Task<LaboratoryDto?> GetLaboratoryByIdAsync(
        Guid id, CancellationToken cancellationToken = default)
    {
        var lab = await _unitOfWork.Laboratories.GetByIdAsync(id, cancellationToken);
        return lab is null ? null : MapToDto(lab);
    }

    public async Task<LaboratoryDto> CreateLaboratoryAsync(
        CreateLaboratoryDto request, CancellationToken cancellationToken = default)
    {
        var lab = new Laboratory
        {
            Id = Guid.NewGuid(),
            Name = request.LabName,
            RoomNumber = request.RoomNumber,
            Building = request.Building,
            Capacity = request.Capacity,
            IsActive = request.Status.Equals("Active", StringComparison.OrdinalIgnoreCase),
            CreatedAtUtc = DateTime.UtcNow
        };

        await _unitOfWork.Laboratories.AddAsync(lab, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToDto(lab);
    }

    public async Task<LaboratoryDto?> UpdateLaboratoryAsync(
        Guid id, UpdateLaboratoryDto request, CancellationToken cancellationToken = default)
    {
        var lab = await _unitOfWork.Laboratories.GetByIdAsync(id, cancellationToken);
        if (lab is null) return null;

        lab.Name = request.LabName;
        lab.RoomNumber = request.RoomNumber;
        lab.Building = request.Building;
        lab.Capacity = request.Capacity;
        lab.IsActive = request.Status.Equals("Active", StringComparison.OrdinalIgnoreCase);
        lab.LastModifiedAtUtc = DateTime.UtcNow;

        await _unitOfWork.Laboratories.UpdateAsync(lab, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToDto(lab);
    }

    public async Task<bool> DeleteLaboratoryAsync(Guid id, CancellationToken cancellationToken = default)
    {
        try {

        var lab = await _unitOfWork.Laboratories.GetByIdAsync(id, cancellationToken);
        if (lab is null) return false;

        lab.IsDeleted = true; lab.DeletedAt = DateTime.UtcNow;
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
        }
        catch (Microsoft.EntityFrameworkCore.DbUpdateException ex) when (ex.InnerException is Npgsql.PostgresException pg && pg.SqlState == "23503")
        {
            throw new InvalidOperationException("Cannot delete laboratory with attached resources (assets, workstations, etc.). Remove them first.");
        }

    }

    public Task<IReadOnlyList<WorkstationDto>> GetWorkstationsByLabIdAsync(
        Guid labId, CancellationToken cancellationToken = default)
    {
        return Task.FromResult<IReadOnlyList<WorkstationDto>>(new List<WorkstationDto>());
    }

    private static LaboratoryDto MapToDto(Laboratory lab) => new(
        lab.Id,
        lab.Name,
        lab.RoomNumber,
        lab.Building,
        lab.Capacity,
        lab.IsActive ? "Active" : "Inactive",
        lab.CreatedAtUtc
    );
}
