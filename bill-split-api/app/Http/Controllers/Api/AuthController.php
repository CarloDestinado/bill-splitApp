<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
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

        $user = User::create([
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
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

    public function loginGuest(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $user = User::where('email', $request->email)->where('user_type', 'guest')->first();

        if (!$user) {
            throw ValidationException::withMessages([
                'email' => ['No guest account found with this email.'],
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
}
