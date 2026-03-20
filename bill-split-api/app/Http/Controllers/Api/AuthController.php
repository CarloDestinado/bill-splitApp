<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'last_name' => ['required', 'string', 'max:255', 'regex:/^\S+$/'],
            'first_name' => ['required', 'string', 'max:255', 'regex:/^\S+$/'],
            'nickname' => ['required', 'string', 'max:255', 'unique:users,nickname'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'username' => ['required', 'string', 'max:255', 'unique:users,username'],
            'password' => [
                'required',
                'string',
                'min:8',
                'max:16',
                'confirmed',
                'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@₱!%*?&#])[A-Za-z\d@₱!%*?&#]+$/',
            ],
        ], [
            'last_name.regex' => 'Last name cannot contain spaces.',
            'first_name.regex' => 'First name cannot contain spaces.',
            'nickname.unique' => 'This nickname has already been taken.',
            'email.email' => 'Please enter a valid email address.',
            'email.unique' => 'This email address has already been registered.',
            'username.unique' => 'This username has already been taken.',
            'password.min' => 'Password must be at least 8 characters long.',
            'password.max' => 'Password cannot be more than 16 characters long.',
            'password.regex' => 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
            'password.confirmed' => 'Password confirmation does not match.',
        ]);

        $user = User::create([
            'last_name' => $request->last_name,
            'first_name' => $request->first_name,
            'nickname' => $request->nickname,
            'email' => $request->email,
            'username' => $request->username,
            'password' => Hash::make($request->password),
            'user_type' => 'registered',
            'account_type' => 'standard',
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'User registered successfully.',
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (!Auth::attempt($request->only('email', 'password'))) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $user = User::where('email', $request->email)->firstOrFail();

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'user' => $user,
            'token' => $token,
        ]);
    }

    public function registerGuest(Request $request)
    {
        $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|string|email|unique:users',
        ]);

        // Generate unique username and nickname from email
        $emailPrefix = explode('@', $request->email)[0];
        $uniqueSuffix = time() . rand(1000, 9999);
        $nickname = $emailPrefix . '_' . substr($uniqueSuffix, -4);
        $username = $emailPrefix . '_' . $uniqueSuffix;

        $user = User::create([
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'nickname' => $nickname,
            'username' => $username,
            'email' => $request->email,
            'user_type' => 'guest',
            'account_type' => 'standard',
            'access_reset_at' => now(),
            'access_hours_used' => 0,
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Guest registered successfully',
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    public function registerGuestWithCode(Request $request)
    {
        $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|string|email|unique:users',
            'nickname' => 'required|string|max:255|unique:users,nickname',
            'invitation_code' => 'required|string',
        ], [
            'nickname.unique' => 'This nickname has already been taken.',
        ]);

        // Verify the invitation code first
        $bill = \App\Models\Bill::where('invitation_code', strtoupper($request->invitation_code))
            ->first();

        if (!$bill) {
            throw ValidationException::withMessages([
                'invitation_code' => ['Invalid invitation code. Please check the code and try again.'],
            ]);
        }

        // Generate unique username from email
        $emailPrefix = explode('@', $request->email)[0];
        $uniqueSuffix = time() . rand(1000, 9999);
        $username = $emailPrefix . '_' . $uniqueSuffix;

        $user = User::create([
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'nickname' => $request->nickname,
            'username' => $username,
            'email' => $request->email,
            'user_type' => 'guest',
            'account_type' => 'standard',
            'access_reset_at' => now(),
            'access_hours_used' => 0,
        ]);

        // Add the guest user to the bill
        $currentUsers = $bill->users()->count();
        $totalUsers = $currentUsers + 1;
        $shareAmount = $bill->total_amount / $totalUsers;

        \App\Models\BillUser::create([
            'bill_id' => $bill->id,
            'user_id' => $user->id,
            'share_amount' => $shareAmount,
            'payment_status' => 'pending',
        ]);

        // Recalculate share amounts for all users
        foreach ($bill->billUsers as $billUser) {
            $billUser->update(['share_amount' => $shareAmount]);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Guest registered successfully and added to bill',
            'user' => $user,
            'token' => $token,
            'bill' => [
                'id' => $bill->id,
                'title' => $bill->title,
                'total_amount' => $bill->total_amount,
                'description' => $bill->description,
                'status' => $bill->status,
                'invitation_code' => $bill->invitation_code,
            ],
        ], 201);
    }

    public function loginGuest(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        // First check if user exists at all
        $user = User::where('email', $request->email)->first();

        if (!$user) {
            throw ValidationException::withMessages([
                'email' => ['No account found with this email address. Please register first.'],
            ]);
        }

        // Check if the account is a guest account
        if ($user->user_type !== 'guest') {
            throw ValidationException::withMessages([
                'email' => ['This is not a guest account. Please use the regular login instead.'],
            ]);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Guest login successful',
            'user' => $user,
            'token' => $token,
        ]);
    }

    public function upgradeToRegistered(Request $request)
    {
        $request->validate([
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();
        $user->password = Hash::make($request->password);
        $user->user_type = 'registered';
        $user->save();

        return response()->json([
            'message' => 'Account upgraded to registered user',
            'user' => $user,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully',
        ]);
    }

    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
        ], [
            'email.exists' => 'No account found with this email address.',
        ]);

        $user = User::where('email', $request->email)->first();

        // Don't allow guest users to reset password
        if ($user->user_type === 'guest') {
            return response()->json([
                'message' => 'Guest accounts cannot reset passwords. Please upgrade to a registered account.',
            ], 400);
        }

        // Generate reset token
        $token = Str::random(60);
        
        // Store token in database
        \DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $request->email],
            [
                'token' => hash('sha256', $token),
                'created_at' => now(),
            ]
        );

        // In a real application, you would send an email with the reset link
        // For now, we'll return the token in the response for testing
        return response()->json([
            'message' => 'Password reset link generated successfully.',
            'reset_token' => $token, // Remove this in production
            'email' => $request->email,
        ]);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'nickname' => 'required|string',
            'email' => 'required|email',
            'password' => [
                'required',
                'string',
                'min:8',
                'max:16',
                'confirmed',
                'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,16}$/',
            ],
        ], [
            'nickname.required' => 'Nickname is required.',
            'email.required' => 'Email is required.',
            'password.min' => 'Password must be at least 8 characters long.',
            'password.max' => 'Password cannot be more than 16 characters long.',
            'password.regex' => 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
            'password.confirmed' => 'Password confirmation does not match.',
        ]);

        // Find user with matching nickname AND email
        $user = User::where('nickname', $request->nickname)
                    ->where('email', $request->email)
                    ->first();

        if (!$user) {
            throw ValidationException::withMessages([
                'email' => ['No account found with this nickname and email combination.'],
            ]);
        }

        // Check if new password is the same as old password
        if (Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'password' => ['Your new password cannot be the same as your old password.'],
            ]);
        }

        // Update password
        $user->password = Hash::make($request->password);
        $user->save();

        return response()->json([
            'message' => 'Password reset successfully.',
        ]);
    }
}
