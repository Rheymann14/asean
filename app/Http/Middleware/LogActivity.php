<?php

namespace App\Http\Middleware;

use App\Models\ActivityLog;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class LogActivity
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        /** @var Response $response */
        $response = $next($request);

        $user = $request->user();
        if (! $user) {
            return $response;
        }

        $route = $request->route();
        $routeName = $route?->getName();
        $path = $request->path() === '/' ? '/' : '/'.ltrim($request->path(), '/');
        $activity = $this->resolveActivity($request, $routeName);
        $status = $this->resolveStatus($response->getStatusCode(), $activity);

        if ($routeName === 'activity-log.index' && $activity === 'view') {
            return $response;
        }
        $pageLabel = $routeName
            ? Str::of($routeName)->replace('.', ' / ')->headline()
            : $path;
        $description = sprintf('%s %s.', Str::headline($activity), $pageLabel);

        ActivityLog::create([
            'user_id' => $user->id,
            'route_name' => $routeName,
            'path' => $path,
            'method' => $request->method(),
            'activity' => $activity,
            'description' => $description,
            'status' => $status,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return $response;
    }

    private function resolveActivity(Request $request, ?string $routeName): string
    {
        $routeName = Str::lower((string) $routeName);
        $method = $request->method();

        if (Str::contains($routeName, 'login')) {
            return 'login';
        }

        if (Str::contains($routeName, 'logout')) {
            return 'logout';
        }

        if (Str::contains($routeName, 'export')) {
            return 'export';
        }

        if (Str::contains($routeName, 'approve')) {
            return 'approve';
        }

        if (Str::contains($routeName, 'reject')) {
            return 'reject';
        }

        return match ($method) {
            'POST' => 'create',
            'PUT', 'PATCH' => 'update',
            'DELETE' => 'delete',
            default => 'view',
        };
    }

    private function resolveStatus(int $statusCode, string $activity): string
    {
        if ($statusCode >= 400) {
            return 'failed';
        }

        if ($statusCode >= 300) {
            return 'warning';
        }

        if (in_array($activity, ['view'], true)) {
            return 'info';
        }

        return 'success';
    }
}
