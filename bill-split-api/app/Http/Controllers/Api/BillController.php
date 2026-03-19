<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bill;
use App\Models\BillUser;
use App\Models\Invitation;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BillController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        $bills = Bill::where('created_by', $user->id)
            ->orWhereHas('users', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->with(['creator', 'users'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'bills' => $bills,
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        // Check if user can create bill
        if (!$user->canCreateBill()) {
            return response()->json([
                'message' => 'Bill creation limit reached. Upgrade to Premium for unlimited bills.',
            ], 403);
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'total_amount' => 'required|numeric|min:0',
            'description' => 'nullable|string',
            'due_date' => 'nullable|date',
        ]);

        $bill = Bill::create([
            'created_by' => $user->id,
            'title' => $request->title,
            'total_amount' => $request->total_amount,
            'description' => $request->description,
            'due_date' => $request->due_date,
        ]);

        // Add creator as first bill user
        BillUser::create([
            'bill_id' => $bill->id,
            'user_id' => $user->id,
            'share_amount' => $request->total_amount,
            'payment_status' => 'pending',
        ]);

        // Increment bill count for standard users
        if (!$user->isPremium()) {
            $now = now();
            $resetAt = $user->bills_count_reset_at;
            
            // Check if we need to reset the counter (new month)
            if ($resetAt === null || 
                $now->month !== $resetAt->month || 
                $now->year !== $resetAt->year) {
                // Reset counter for new month
                $user->bills_created_count = 1;
                $user->bills_count_reset_at = $now;
            } else {
                // Increment counter for same month
                $user->bills_created_count += 1;
            }
            $user->save();
        }

        return response()->json([
            'message' => 'Bill created successfully',
            'bill' => $bill->load(['creator', 'users']),
        ], 201);
    }

    public function show(Request $request, $id)
    {
        $user = $request->user();
        $bill = Bill::with(['creator', 'users', 'invitations'])->findOrFail($id);

        // Track guest access hours based on actual time elapsed
        if ($user->isGuest()) {
            $now = now();
            $accessResetAt = $user->access_reset_at;

            // Check if we need to reset the daily counter (24 hours have passed)
            if ($accessResetAt === null || $now->diffInHours($accessResetAt) >= 24) {
                // Reset - set the baseline time to now
                $user->access_reset_at = $now;
                $user->access_hours_used = 0;
            } else {
                // Calculate actual hours used since reset time
                $hoursSinceReset = $now->diffInHours($accessResetAt);
                $user->access_hours_used = $hoursSinceReset;
            }
            
            $user->last_access_time = $now;
            $user->save();

            // Check if guest has exceeded access limit (6 hours/day)
            if ($user->access_hours_used >= 6) {
                return response()->json([
                    'message' => 'Guest access limit reached (6 hours/day). Please upgrade to registered account.',
                    'access_limit_reached' => true,
                ], 403);
            }
        }

        return response()->json([
            'bill' => $bill,
        ]);
    }

    public function update(Request $request, $id)
    {
        $bill = Bill::findOrFail($id);

        // Only creator can update
        if ($bill->created_by !== $request->user()->id) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        $request->validate([
            'title' => 'sometimes|string|max:255',
            'total_amount' => 'sometimes|numeric|min:0',
            'description' => 'nullable|string',
            'due_date' => 'nullable|date',
            'status' => 'sometimes|in:active,completed,cancelled,archived',
        ]);

        $bill->update($request->only(['title', 'total_amount', 'description', 'due_date', 'status']));

        return response()->json([
            'message' => 'Bill updated successfully',
            'bill' => $bill->fresh(['creator', 'users']),
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $bill = Bill::findOrFail($id);

        // Only creator can delete
        if ($bill->created_by !== $request->user()->id) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        $bill->delete();

        return response()->json([
            'message' => 'Bill deleted successfully',
        ]);
    }

    public function shareBill(Request $request, $id)
    {
        $bill = Bill::findOrFail($id);

        // Check max users (3 for standard, unlimited for premium)
        $currentUsers = $bill->users()->count();
        $creator = $bill->creator;

        if (!$creator->isPremium() && $currentUsers >= 3) {
            return response()->json([
                'message' => 'Maximum 3 users per bill for Standard accounts. Upgrade to Premium for more.',
            ], 403);
        }

        $request->validate([
            'email' => 'required|email',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json([
                'message' => 'User not found',
            ], 404);
        }

        // Check if already in bill
        if ($bill->users()->where('user_id', $user->id)->exists()) {
            return response()->json([
                'message' => 'User already in this bill',
            ], 400);
        }

        // Add user to bill
        BillUser::create([
            'bill_id' => $bill->id,
            'user_id' => $user->id,
            'share_amount' => $bill->total_amount / ($currentUsers + 1),
            'payment_status' => 'pending',
        ]);

        // Recalculate share amounts
        $totalUsers = $bill->users()->count() + 1;
        $shareAmount = $bill->total_amount / $totalUsers;
        
        foreach ($bill->billUsers as $billUser) {
            $billUser->update(['share_amount' => $shareAmount]);
        }

        return response()->json([
            'message' => 'User added to bill successfully',
            'bill' => $bill->fresh(['creator', 'users']),
        ]);
    }

    public function getBillUsers(Request $request, $id)
    {
        $bill = Bill::with(['users.billUsers'])->findOrFail($id);

        return response()->json([
            'users' => $bill->users,
        ]);
    }
}
