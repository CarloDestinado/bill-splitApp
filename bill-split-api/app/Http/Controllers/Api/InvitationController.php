<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bill;
use App\Models\BillUser;
use App\Models\Invitation;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InvitationController extends Controller
{
    public function verifyCode(Request $request)
    {
        $request->validate([
            'invitation_code' => 'required|string',
        ]);

        // First, check the bill's invitation_code directly
        $bill = Bill::where('invitation_code', strtoupper($request->invitation_code))
            ->first();

        if ($bill) {
            // Bill found - this is a direct bill invitation code
            return response()->json([
                'valid' => true,
                'bill' => [
                    'id' => $bill->id,
                    'title' => $bill->title,
                    'total_amount' => $bill->total_amount,
                    'description' => $bill->description ?? '',
                    'status' => $bill->status ?? 'active',
                    'invitation_code' => $bill->invitation_code,
                ],
            ]);
        }

        // If not found in bills, check invitations table
        $invitation = Invitation::where('invitation_code', strtoupper($request->invitation_code))
            ->where('status', 'pending')
            ->first();

        if (! $invitation) {
            return response()->json([
                'valid' => false,
                'message' => 'Invalid or expired invitation code',
            ], 404);
        }

        if ($invitation->isExpired()) {
            $invitation->update(['status' => 'expired']);

            return response()->json([
                'valid' => false,
                'message' => 'Invitation code has expired',
            ], 400);
        }

        $bill = $invitation->bill;

        return response()->json([
            'valid' => true,
            'bill' => [
                'id' => $bill->id,
                'title' => $bill->title,
                'total_amount' => $bill->total_amount,
                'description' => $bill->description ?? '',
                'status' => $bill->status ?? 'active',
                'invitation_code' => $bill->invitation_code,
            ],
        ]);
    }

    public function checkEmail(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'invitation_code' => 'required|string',
        ]);

        // First check if the code is a bill's invitation code
        $bill = Bill::where('invitation_code', strtoupper($request->invitation_code))->first();

        if ($bill) {
            // Bill found, check if email exists
            $user = User::where('email', $request->email)->first();

            return response()->json([
                'exists' => $user !== null,
                'user_type' => $user ? $user->user_type : null,
                'bill' => [
                    'id' => $bill->id,
                    'title' => $bill->title,
                    'total_amount' => $bill->total_amount,
                ],
            ]);
        }

        // If not a bill code, check invitations table
        $invitation = Invitation::where('invitation_code', strtoupper($request->invitation_code))
            ->where('status', 'pending')
            ->where('invitee_email', $request->email)
            ->first();

        if (! $invitation) {
            return response()->json([
                'message' => 'This email is not associated with the invitation code',
            ], 404);
        }

        // Check if user exists
        $user = User::where('email', $request->email)->first();

        return response()->json([
            'exists' => $user !== null,
            'user_type' => $user ? $user->user_type : null,
        ]);
    }

    public function createInvitation(Request $request)
    {
        $request->validate([
            'bill_id' => 'required|exists:bills,id',
            'invitee_email' => 'required|email',
        ]);

        $bill = Bill::findOrFail($request->bill_id);

        // Only creator can invite
        if ($bill->created_by !== $request->user()->id) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        // Check if invitation already exists for this email
        $existingInvitation = Invitation::where('bill_id', $bill->id)
            ->where('invitee_email', $request->invitee_email)
            ->where('status', 'pending')
            ->first();

        if ($existingInvitation) {
            return response()->json([
                'message' => 'Invitation already sent to this email',
                'invitation' => $existingInvitation,
            ], 400);
        }

        $invitation = Invitation::create([
            'bill_id' => $bill->id,
            'invited_by' => $request->user()->id,
            'invitee_email' => $request->invitee_email,
        ]);

        return response()->json([
            'message' => 'Invitation created successfully',
            'invitation' => $invitation,
        ], 201);
    }

    public function acceptInvitation(Request $request, $id)
    {
        $invitation = Invitation::findOrFail($id);

        if ($invitation->isExpired()) {
            $invitation->update(['status' => 'expired']);

            return response()->json([
                'message' => 'Invitation has expired',
            ], 400);
        }

        if ($invitation->status !== 'pending') {
            return response()->json([
                'message' => 'Invitation already processed',
            ], 400);
        }

        // Find or create user
        $user = User::where('email', $invitation->invitee_email)->first();

        if (! $user) {
            return response()->json([
                'message' => 'No account found with this email. Please register first.',
            ], 404);
        }

        DB::transaction(function () use ($invitation, $user) {
            $bill = $invitation->bill;

            // Add user to bill
            $currentUsers = $bill->users()->count();
            $totalUsers = $currentUsers + 1;
            $shareAmount = $bill->total_amount / $totalUsers;

            BillUser::create([
                'bill_id' => $bill->id,
                'user_id' => $user->id,
                'share_amount' => $shareAmount,
                'payment_status' => 'pending',
            ]);

            // Update existing users' share
            foreach ($bill->billUsers as $billUser) {
                $billUser->update(['share_amount' => $shareAmount]);
            }

            $invitation->update(['status' => 'accepted']);
        });

        return response()->json([
            'message' => 'Invitation accepted successfully',
        ]);
    }
}
