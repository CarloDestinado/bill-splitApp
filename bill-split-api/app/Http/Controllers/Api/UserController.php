<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function getProfile(Request $request)
    {
        return response()->json([
            'user' => $request->user(),
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();
        
        $request->validate([
            'first_name' => 'sometimes|string|max:255',
            'last_name' => 'sometimes|string|max:255',
            'email' => 'sometimes|string|email|unique:users,email,' . $user->id,
        ]);

        if ($request->has('first_name')) {
            $user->first_name = $request->first_name;
        }
        if ($request->has('last_name')) {
            $user->last_name = $request->last_name;
        }
        if ($request->has('email')) {
            $user->email = $request->email;
        }

        $user->save();

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => $user,
        ]);
    }

    public function upgradeToPremium(Request $request)
    {
        $request->validate([
            'payment_method' => 'required|string',
            'payment_token' => 'required|string',
        ]);

        $user = $request->user();
        
        // Here you would integrate with a payment gateway (Stripe, PayPal, etc.)
        // For now, we'll just upgrade the user
        
        $user->account_type = 'premium';
        $user->premium_expiry = now()->addYear(); // 1 year premium
        $user->save();

        return response()->json([
            'message' => 'Upgraded to Premium successfully',
            'user' => $user,
        ]);
    }
}
