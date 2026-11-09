using System.Net;
using System.Text.Json;
using LabTrack.Api.Contracts;

namespace LabTrack.Api.Middleware;

public sealed class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;
    private readonly IHostEnvironment _environment;

    public ExceptionHandlingMiddleware(
        RequestDelegate next,
        ILogger<ExceptionHandlingMiddleware> logger,
        IHostEnvironment environment)
    {
        _next = next;
        _logger = logger;
        _environment = environment;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Unhandled exception captured by middleware. Path: {Path}, TraceId: {TraceId}",
                context.Request.Path,
                context.TraceIdentifier);

            await HandleExceptionAsync(context, ex);
        }
    }

    private Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        var (statusCode, errorCode, message) = exception switch
        {
            KeyNotFoundException => (
                HttpStatusCode.NotFound,
                "RESOURCE_NOT_FOUND",
                "The requested resource was not found."),
            
            UnauthorizedAccessException => (
                HttpStatusCode.Unauthorized,
                "UNAUTHORIZED_ACCESS",
                "You are not authorized to perform this operation."),
            
            InvalidOperationException => (
                HttpStatusCode.BadRequest,
                "INVALID_OPERATION",
                exception.Message),
            
            ArgumentException argEx => (
                HttpStatusCode.BadRequest,
                "INVALID_ARGUMENT",
                argEx.Message),
            
            _ => (
                HttpStatusCode.InternalServerError,
                "INTERNAL_SERVER_ERROR",
                "An unexpected server error occurred. Please try again later.")
        };

        context.Response.StatusCode = (int)statusCode;

        // In Development, attach exception details if needed for debugging
        var errorDetails = _environment.IsDevelopment()
            ? exception.ToString()
            : null;

        var apiError = new ApiError(
            errorCode,
            message,
            errorDetails is not null ? new Dictionary<string, string[]> { { "exception", new[] { errorDetails } } } : null);

        var response = ApiResponse<object>.Fail(apiError);

        var jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = false
        };

        return context.Response.WriteAsync(JsonSerializer.Serialize(response, jsonOptions));
    }
}