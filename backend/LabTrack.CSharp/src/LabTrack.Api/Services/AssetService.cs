using LabTrack.Api.Contracts;
using LabTrack.Api.Controllers;
using LabTrack.Application.Interfaces;
using LabTrack.Domain.Entities;

namespace LabTrack.Api.Services;

public class AssetService : LabTrack.Api.Controllers.IAssetService
{
    private readonly IUnitOfWork _unitOfWork;

    public AssetService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }

    public async Task<PaginationResponse<AssetDto>> GetAssetsAsync(
        int pageNumber, int pageSize, string? search, string? category, string? status,
        CancellationToken cancellationToken = default)
    {
        if (pageNumber < 1) pageNumber = 1;
        if (pageSize < 1) pageSize = 10;

        var all = await _unitOfWork.Assets.GetAllAsync(cancellationToken);
        IEnumerable<Asset> filtered = all;

        if (!string.IsNullOrWhiteSpace(search))
            filtered = filtered.Where(a =>
                a.AssetTag.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                a.Name.Contains(search, StringComparison.OrdinalIgnoreCase));

        if (!string.IsNullOrWhiteSpace(category))
            filtered = filtered.Where(a => a.Category.Equals(category, StringComparison.OrdinalIgnoreCase));

        if (!string.IsNullOrWhiteSpace(status))
            filtered = filtered.Where(a => a.Status.Equals(status, StringComparison.OrdinalIgnoreCase));

        var list = filtered.ToList();
        var total = list.Count;
        var items = list.Skip((pageNumber - 1) * pageSize).Take(pageSize).Select(MapToDto).ToList();
        var totalPages = (int)Math.Ceiling(total / (double)pageSize);

        return new PaginationResponse<AssetDto>(items, total, pageNumber, pageSize, totalPages, pageNumber > 1, pageNumber < totalPages);
    }

    public async Task<AssetDto?> GetAssetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var a = await _unitOfWork.Assets.GetByIdAsync(id, cancellationToken);
        return a is null ? null : MapToDto(a);
    }

    public async Task<AssetDto> CreateAssetAsync(CreateAssetDto dto, CancellationToken cancellationToken = default)
    {

        var lab = await _unitOfWork.Laboratories.GetByIdAsync(dto.LaboratoryId, cancellationToken);
        if (lab is null)
            throw new ArgumentException($"Laboratory '{dto.LaboratoryId}' not found.");

        var asset = new Asset
        {
            Id = Guid.NewGuid(),
            AssetTag = dto.AssetTag,
            Name = dto.Name,
            Category = dto.Category,
            SerialNumber = null,
            Status = dto.Status,
            LaboratoryId = dto.LaboratoryId,
            CreatedAtUtc = DateTime.UtcNow
        };

        await _unitOfWork.Assets.AddAsync(asset, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToDto(asset);
    }

    public async Task<AssetDto?> UpdateAssetAsync(Guid id, UpdateAssetDto dto, CancellationToken cancellationToken = default)
    {
        var asset = await _unitOfWork.Assets.GetByIdAsync(id, cancellationToken);
        if (asset is null) return null;

        asset.Name = dto.Name;
        asset.Category = dto.Category;
        asset.Status = dto.Status;
        asset.LastModifiedAtUtc = DateTime.UtcNow;

        await _unitOfWork.Assets.UpdateAsync(asset, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return MapToDto(asset);
    }

    public async Task<bool> DeleteAssetAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var asset = await _unitOfWork.Assets.GetByIdAsync(id, cancellationToken);
        if (asset is null) return false;
        asset.IsDeleted = true; asset.DeletedAt = DateTime.UtcNow;
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }

    private static AssetDto MapToDto(Asset a) => new(
        a.Id,
        a.AssetTag,
        a.Name,
        a.Category,
        a.Status,
        null,                // Location ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â not stored on entity
        0m,                  // PurchasePrice ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â not stored on entity
        a.CreatedAtUtc       // PurchasedAt ÃƒÂ¢Ã¢â‚¬Â°Ã‹â€  CreatedAtUtc
    );
}