<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ActivityLogController extends Controller
{
    public function index(Request $request)
    {
        $perPage = max(5, min(100, (int) $request->input('per_page', 25)));
        $status = $request->input('status');
        $search = trim((string) $request->input('search'));
        $from = $request->input('from');
        $to = $request->input('to');

        $logs = ActivityLog::query()
            ->with(['user.userType'])
            ->where('activity', '!=', 'view')
            ->when($status, function ($query) use ($status) {
                $query->where('status', $status);
            })
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($inner) use ($search) {
                    $inner->where('route_name', 'like', "%{$search}%")
                        ->orWhere('path', 'like', "%{$search}%")
                        ->orWhere('activity', 'like', "%{$search}%")
                        ->orWhere('status', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhere('ip_address', 'like', "%{$search}%")
                        ->orWhere('user_agent', 'like', "%{$search}%")
                        ->orWhereHas('user', function ($userQuery) use ($search) {
                            $userQuery->where('name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%")
                                ->orWhereHas('userType', function ($typeQuery) use ($search) {
                                    $typeQuery->where('name', 'like', "%{$search}%")
                                        ->orWhere('slug', 'like', "%{$search}%");
                                });
                        });
                });
            })
            ->when($from, function ($query) use ($from) {
                $query->whereDate('created_at', '>=', $from);
            })
            ->when($to, function ($query) use ($to) {
                $query->whereDate('created_at', '<=', $to);
            })
            ->latest()
            ->paginate($perPage)
            ->withQueryString()
            ->through(function (ActivityLog $log) {
                $role = $log->user?->userType?->slug ?? $log->user?->userType?->name;

                return [
                    'id' => $log->id,
                    'page' => $log->route_name
                        ? Str::of($log->route_name)->replace('.', ' / ')->headline()
                        : $log->path,
                    'pageHref' => $log->path,
                    'user' => [
                        'name' => $log->user?->name ?? 'Unknown user',
                        'role' => $role ? Str::lower((string) $role) : null,
                    ],
                    'activity' => $log->activity,
                    'description' => $log->description,
                    'status' => $log->status,
                    'ip' => $log->ip_address,
                    'device' => $log->user_agent,
                    'timestamp' => $log->created_at?->toIso8601String(),
                ];
            });

        return Inertia::render('settings/activity-log', [
            'logs' => $logs,
            'filters' => [
                'status' => $status,
                'search' => $search,
                'from' => $from,
                'to' => $to,
                'perPage' => $perPage,
            ],
        ]);
    }
}
