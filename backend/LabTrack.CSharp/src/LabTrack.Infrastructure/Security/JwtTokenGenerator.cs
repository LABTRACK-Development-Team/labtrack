using System.Collections.Concurrent;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using LabTrack.Application.Interfaces;
using LabTrack.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace LabTrack.Infrastructure.Security;

public class JwtTokenGenerator : IJwtTokenGenerator
{
    private readonly IConfiguration _configuration;

    // In-memory refresh token store: token -> (userId, expiresAt)
    // âš ï¸ Production: replace with DB/Redis-backed store.
    private static readonly ConcurrentDictionary<string, (Guid UserId, DateTimeOffset ExpiresAt)> _refreshTokens = new();

    public JwtTokenGenerator(IConfiguration configuration)
    {
        _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));
    }

    public string GenerateAccessToken(User user, IReadOnlyList<string> roles)
    {
        if (user is null) throw new ArgumentNullException(nameof(user));

        var key = _configuration["Jwt:Key"]
            ?? throw new InvalidOperationException("Jwt:Key is not configured.");
        var issuer = _configuration["Jwt:Issuer"] ?? "LabTrack";
        var audience = _configuration["Jwt:Audience"] ?? "LabTrackClients";
        var expiryMinutes = int.TryParse(_configuration["Jwt:ExpiryMinutes"], out var m) ? m : 60;

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

                    // ─── EXPAND ADMIN ROLES ───
            // ADMIN = TECHNICIAN + SUPER_ADMIN + LAB_ADMIN (full control)
            var expandedRoles = new HashSet<string>(roles ?? Array.Empty<string>(), StringComparer.OrdinalIgnoreCase);
            
            var isAdmin = expandedRoles.Contains("ADMIN") ||
                          expandedRoles.Contains("ADMINISTRATOR") ||
                          expandedRoles.Contains("SUPER_ADMIN") ||
                          expandedRoles.Contains("LAB_ADMIN");
            
            if (isAdmin)
            {
                expandedRoles.Add("TECHNICIAN");
                expandedRoles.Add("ADMIN_TECHNICIAN");
                expandedRoles.Add("SUPER_ADMIN");
                expandedRoles.Add("LAB_ADMIN");
            }
            
            foreach (var role in expandedRoles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }
            // ─── END EXPAND ADMIN ROLES ───

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateRefreshToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(64);
        return Convert.ToBase64String(bytes);
    }

    public Task<(string AccessToken, string RefreshToken)> GenerateTokensAsync(
        User user,
        IReadOnlyList<string> roles,
        CancellationToken cancellationToken = default)
    {
        if (user is null) throw new ArgumentNullException(nameof(user));

        var accessToken = GenerateAccessToken(user, roles);
        var refreshToken = GenerateRefreshToken();

        var refreshExpiryDays = int.TryParse(_configuration["Jwt:RefreshExpiryDays"], out var d) ? d : 7;
        _refreshTokens[refreshToken] = (user.Id, DateTimeOffset.UtcNow.AddDays(refreshExpiryDays));

        return Task.FromResult((accessToken, refreshToken));
    }

    public Task<Guid?> ValidateRefreshTokenAsync(
        string refreshToken,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(refreshToken))
            return Task.FromResult<Guid?>(null);

        if (!_refreshTokens.TryGetValue(refreshToken, out var entry))
            return Task.FromResult<Guid?>(null);

        if (entry.ExpiresAt <= DateTimeOffset.UtcNow)
        {
            _refreshTokens.TryRemove(refreshToken, out _);
            return Task.FromResult<Guid?>(null);
        }

        return Task.FromResult<Guid?>(entry.UserId);
    }
}