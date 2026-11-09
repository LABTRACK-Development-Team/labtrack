using LabTrack.Api.Controllers;
using LabTrack.Api.Contracts;
using LabTrack.Domain.Entities;
using LabTrack.Infrastructure.Persistence.DbContext;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace LabTrack.Api.Services;

public class NetworkService : INetworkService
{
    private readonly LabTrackDbContext _db;

    public NetworkService(LabTrackDbContext db)
    {
        _db = db;
    }

    public async Task<NetworkStatusSummaryDto> GetNetworkStatusSummaryAsync(CancellationToken ct = default)
    {
        var list = await _db.NetworkDevices.AsNoTracking().ToListAsync(ct);
        return new NetworkStatusSummaryDto(
            list.Count,
            list.Count(x => x.Status == "ONLINE"),
            list.Count(x => x.Status == "OFFLINE"),
            list.Count(x => x.Status == "MAINTENANCE"));
    }

    public async Task<PaginationResponse<NetworkDeviceDto>> GetNetworkDevicesAsync(int pageNumber, int pageSize, string? search, string? status, CancellationToken ct = default)
    {
        var query = _db.NetworkDevices.Include(x => x.Asset).AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(x => x.IpAddress.Contains(search) || x.MacAddress.Contains(search));

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(x => x.Status == status);

        var total = await query.CountAsync(ct);
        var totalPages = (int)Math.Ceiling(total / (double)pageSize);

        var items = await query
            .OrderByDescending(x => x.CreatedAtUtc)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return new PaginationResponse<NetworkDeviceDto>(
            items.Select(MapToDto).ToList(),
            total,
            pageNumber,
            pageSize,
            totalPages,
            pageNumber > 1,
            pageNumber < totalPages);
    }

    public Task<NetworkDeviceDto?> GetByIdAsync(Guid id, CancellationToken ct = default) => GetNetworkDeviceByIdAsync(id, ct);

    public async Task<NetworkDeviceDto?> GetNetworkDeviceByIdAsync(Guid id, CancellationToken ct = default)
    {
        var device = await _db.NetworkDevices.Include(x => x.Asset).AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct);
        return device == null ? null : MapToDto(device);
    }

    public async Task<NetworkDeviceDto?> GetByMacAddressAsync(string macAddress, CancellationToken ct = default)
    {
        var device = await _db.NetworkDevices.Include(x => x.Asset).AsNoTracking().FirstOrDefaultAsync(x => x.MacAddress == macAddress, ct);
        return device == null ? null : MapToDto(device);
    }

    public async Task<NetworkDeviceDto?> GetByIpAddressAsync(string ipAddress, CancellationToken ct = default)
    {
        var device = await _db.NetworkDevices.Include(x => x.Asset).AsNoTracking().FirstOrDefaultAsync(x => x.IpAddress == ipAddress, ct);
        return device == null ? null : MapToDto(device);
    }

    public async Task<IReadOnlyList<NetworkDeviceDto>> GetByLaboratoryIdAsync(Guid laboratoryId, CancellationToken ct = default)
    {
        var devices = await _db.NetworkDevices.Include(x => x.Asset).AsNoTracking()
            .Where(x => x.Asset != null && x.Asset.LaboratoryId == laboratoryId).ToListAsync(ct);
        return devices.Select(MapToDto).ToList();
    }

    public async Task<IReadOnlyList<NetworkDeviceDto>> GetByWorkstationIdAsync(Guid workstationId, CancellationToken ct = default)
    {
        var devices = await _db.NetworkDevices.Include(x => x.Asset).AsNoTracking()
            .Where(x => x.Asset != null && x.Asset.Id == workstationId).ToListAsync(ct);
        return devices.Select(MapToDto).ToList();
    }

    public async Task<IReadOnlyList<NetworkDeviceDto>> GetActiveDevicesAsync(Guid? laboratoryId = null, CancellationToken ct = default)
    {
        var query = _db.NetworkDevices.Include(x => x.Asset).AsNoTracking().Where(x => x.Status == "ONLINE");
        if (laboratoryId.HasValue)
            query = query.Where(x => x.Asset != null && x.Asset.LaboratoryId == laboratoryId.Value);

        var devices = await query.ToListAsync(ct);
        return devices.Select(MapToDto).ToList();
    }

    public Task<NetworkDeviceDto> RegisterDeviceAsync(RegisterNetworkDeviceDto dto, CancellationToken ct = default) => RegisterNetworkDeviceAsync(dto, ct);

    public async Task<NetworkDeviceDto> RegisterNetworkDeviceAsync(RegisterNetworkDeviceDto dto, CancellationToken ct = default)
    {
        var labId = dto.LabId;
        if (labId == Guid.Empty)
        {
            var defaultLab = await _db.Laboratories.FirstOrDefaultAsync(ct);
            if (defaultLab == null) throw new InvalidOperationException("No laboratory found.");
            labId = defaultLab.Id;
        }

        // FIXED: Gumamit ng GUID para sa AssetTag para laging unique
        var uniqueSuffix = Guid.NewGuid().ToString("N").Substring(0, 8).ToUpper();
        
        var placeholderAsset = new Asset
        {
            Id = Guid.NewGuid(),
            AssetTag = $"NET-{uniqueSuffix}",
            Name = string.IsNullOrEmpty(dto.DeviceName) ? $"Network Device {dto.IpAddress}" : dto.DeviceName,
            Category = "Network Device",
            Status = "Active",
            LaboratoryId = labId,
            CreatedAtUtc = DateTime.UtcNow
        };
        _db.Assets.Add(placeholderAsset);

        var device = new NetworkDevice
        {
            Id = Guid.NewGuid(),
            AssetId = placeholderAsset.Id,
            IpAddress = dto.IpAddress,
            MacAddress = dto.MacAddress,
            DeviceType = dto.DeviceType,
            Status = string.IsNullOrEmpty(dto.Status) ? "OFFLINE" : dto.Status,
            LastPingUtc = DateTime.UtcNow,
            CreatedAtUtc = DateTime.UtcNow
        };

        _db.NetworkDevices.Add(device);
        await _db.SaveChangesAsync(ct);
        return MapToDto(device);
    }

    public Task<NetworkDeviceDto?> UpdateDeviceAsync(Guid id, UpdateNetworkDeviceDto dto, CancellationToken ct = default) => UpdateNetworkDeviceAsync(id, dto, ct);

    public async Task<NetworkDeviceDto?> UpdateNetworkDeviceAsync(Guid id, UpdateNetworkDeviceDto dto, CancellationToken ct = default)
    {
        var device = await _db.NetworkDevices.Include(x => x.Asset).FirstOrDefaultAsync(x => x.Id == id, ct);
        if (device == null) return null;

        device.IpAddress = dto.IpAddress;
        device.MacAddress = dto.MacAddress;
        device.DeviceType = dto.DeviceType;
        device.Status = dto.Status;
        device.LastModifiedAtUtc = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
        return MapToDto(device);
    }

    public async Task UpdateDeviceStatusAsync(Guid id, string status, DateTime lastSeenUtc, CancellationToken ct = default)
    {
        var device = await _db.NetworkDevices.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (device != null)
        {
            device.Status = status;
            device.LastPingUtc = lastSeenUtc;
            await _db.SaveChangesAsync(ct);
        }
    }

    public Task UnregisterDeviceAsync(Guid id, CancellationToken ct = default) => DeleteNetworkDeviceAsync(id, ct);

    public async Task<bool> DeleteNetworkDeviceAsync(Guid id, CancellationToken ct = default)
    {
        var device = await _db.NetworkDevices.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (device == null) return false;

        device.IsDeleted = true; device.DeletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return true;
    }

    private static NetworkDeviceDto MapToDto(NetworkDevice device)
    {
        return new NetworkDeviceDto(
            device.Id,
            device.AssetId,
            device.Asset?.Name ?? "Unknown Asset",
            device.IpAddress,
            device.MacAddress,
            device.DeviceType,
            device.Status,
            device.LastPingUtc ?? DateTime.UtcNow,
            device.CreatedAtUtc);
    }
}