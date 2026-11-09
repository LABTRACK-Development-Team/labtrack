using LabTrack.Api.Controllers;
using System.Net.Http.Json;
using System.Text.Json;

namespace LabTrack.Api.Services;

public class PythonAiService : IPythonAiClient
{
    private readonly HttpClient _http;
    private readonly ILogger<PythonAiService> _logger;

    public PythonAiService(HttpClient http, ILogger<PythonAiService> logger)
    {
        _http = http;
        _logger = logger;
    }

    public async Task<AiChatResponseDto> SendChatAsync(
        AiChatRequestDto request, CancellationToken cancellationToken = default)
    {
        var sw = System.Diagnostics.Stopwatch.StartNew();
        var payload = new { prompt = request.Prompt, system_context = request.SystemContext };

        var resp = await _http.PostAsJsonAsync("/api/v1/ai/chat", payload, cancellationToken);
        var body = await resp.Content.ReadAsStringAsync(cancellationToken);

        if (!resp.IsSuccessStatusCode)
        {
            _logger.LogError("Python AI chat failed: {Status} {Body}", resp.StatusCode, body);
            throw new InvalidOperationException($"Python AI chat failed: {resp.StatusCode}");
        }

        var text = ExtractString(body, "response")
                ?? ExtractString(body, "answer")
                ?? ExtractString(body, "message")
                ?? body;

        sw.Stop();
        return new AiChatResponseDto(text, sw.Elapsed.TotalMilliseconds);
    }

    public async Task<PredictiveMaintenanceResponseDto> GetPredictiveMaintenanceAsync(
        PredictiveMaintenanceRequestDto request, CancellationToken cancellationToken = default)
    {
        var payload = new { asset_id = request.AssetId, system_usage_hours = request.SystemUsageHours };
        var resp = await _http.PostAsJsonAsync("/api/v1/ai/predictive-maintenance", payload, cancellationToken);
        var body = await resp.Content.ReadAsStringAsync(cancellationToken);

        if (!resp.IsSuccessStatusCode)
        {
            _logger.LogError("Predictive maintenance failed: {Status} {Body}", resp.StatusCode, body);
            throw new InvalidOperationException($"Predictive maintenance failed: {resp.StatusCode}");
        }

        using var doc = JsonDocument.Parse(body);
        var root = TryGetData(doc.RootElement);
        double risk = TryGetDouble(root, "failure_risk_percentage") ?? 0;
        string recommendation = TryGetString(root, "recommendation") ?? "";
        DateTime due = TryGetDateTime(root, "next_maintenance_due") ?? DateTime.UtcNow.AddMonths(1);

        return new PredictiveMaintenanceResponseDto(request.AssetId, risk, recommendation, due);
    }

    public async Task<RepairCostEstimationResponseDto> EstimateRepairCostAsync(
        RepairCostEstimationRequestDto request, CancellationToken cancellationToken = default)
    {
        var payload = new
        {
            problem_report_id = request.ProblemReportId,
            issue_description = request.IssueDescription,
            hardware_model = request.HardwareModel
        };
        var resp = await _http.PostAsJsonAsync("/api/v1/ai/estimate-repair-cost", payload, cancellationToken);
        var body = await resp.Content.ReadAsStringAsync(cancellationToken);

        if (!resp.IsSuccessStatusCode)
        {
            _logger.LogError("Repair cost estimation failed: {Status} {Body}", resp.StatusCode, body);
            throw new InvalidOperationException($"Repair cost estimation failed: {resp.StatusCode}");
        }

        using var doc = JsonDocument.Parse(body);
        var root = TryGetData(doc.RootElement);
        decimal cost = TryGetDecimal(root, "estimated_cost") ?? 0;
        string currency = TryGetString(root, "currency") ?? "PHP";
        string complexity = TryGetString(root, "labor_complexity") ?? "MODERATE";

        return new RepairCostEstimationResponseDto(request.ProblemReportId, cost, currency, complexity);
    }

    private static JsonElement TryGetData(JsonElement root)
    {
        if (root.TryGetProperty("data", out var d) && d.ValueKind == JsonValueKind.Object)
            return d;
        return root;
    }

    private static string? ExtractString(string json, string prop)
    {
        try
        {
            using var doc = JsonDocument.Parse(json);
            var root = TryGetData(doc.RootElement);
            return TryGetString(root, prop);
        }
        catch { return null; }
    }

    private static string? TryGetString(JsonElement el, string prop)
        => el.TryGetProperty(prop, out var p) && p.ValueKind == JsonValueKind.String ? p.GetString() : null;

    private static double? TryGetDouble(JsonElement el, string prop)
        => el.TryGetProperty(prop, out var p) && p.ValueKind == JsonValueKind.Number ? p.GetDouble() : null;

    private static decimal? TryGetDecimal(JsonElement el, string prop)
        => el.TryGetProperty(prop, out var p) && p.ValueKind == JsonValueKind.Number ? p.GetDecimal() : null;

    private static DateTime? TryGetDateTime(JsonElement el, string prop)
        => el.TryGetProperty(prop, out var p) && p.TryGetDateTime(out var dt) ? dt : null;
}