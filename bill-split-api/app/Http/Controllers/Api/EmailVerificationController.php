<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\URL;

class EmailVerificationController extends Controller
{
    /**
     * Mark the authenticated user's email address as verified.
     */
    public function verify(Request $request)
    {
        $user = User::find($request->route('id'));

        if (! $user) {
            return response()->json([
                'message' => 'User not found.',
            ], 404);
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'Email already verified.',
            ], 200);
        }

        // Validate the hash matches the user
        $expectedHash = sha1($user->getEmailForVerification());
        $providedHash = $request->route('hash');

        if ($providedHash !== $expectedHash) {
            return response()->json([
                'message' => 'Invalid verification link. User hash mismatch.',
            ], 422);
        }

        // Use Laravel's signature validation
        $signature = $request->query('signature');
        $expires = $request->query('expires');

        if (! $signature || ! $expires) {
            return response()->json([
                'message' => 'Invalid verification link. Missing signature or expires parameter.',
            ], 422);
        }

        // Check if signature has expired
        if (Carbon::createFromTimestamp($expires)->isPast()) {
            return response()->json([
                'message' => 'Verification link has expired.',
            ], 422);
        }

        // Validate the signature using Laravel's built-in method
        // The request already has the correct URL structure since we're using the API URL directly
        if (! URL::hasValidSignature($request)) {
            Log::error('Email verification failed: Invalid signature', [
                'user_id' => $user->getKey(),
                'user_email' => $user->getEmailForVerification(),
            ]);

            return response()->json([
                'message' => 'Invalid or expired verification link.',
            ], 422);
        }

        $user->markEmailAsVerified();
        event(new Verified($user));

        return response()->json([
            'message' => 'Email verified successfully.',
            'user' => $user,
        ], 200);
    }

    /**
     * Resend the email verification notification.
     */
    public function resend(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
        ], [
            'email.exists' => 'No account found with this email address.',
        ]);

        $user = User::where('email', $request->email)->first();

        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'Email is already verified.',
            ], 200);
        }

        $user->sendEmailVerificationNotification();

        return response()->json([
            'message' => 'Verification email sent successfully.',
        ], 200);
    }

    /**
     * Check if the authenticated user's email is verified.
     */
    public function check(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'verified' => $user->hasVerifiedEmail(),
        ], 200);
    }
}
