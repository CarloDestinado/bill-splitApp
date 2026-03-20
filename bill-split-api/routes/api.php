<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\BillController;
use App\Http\Controllers\Api\InvitationController;

// Public routes
Route::post("/register", [AuthController::class, "register"]);
Route::post("/login", [AuthController::class, "login"]);
Route::post("/guest/register", [AuthController::class, "registerGuest"]);
Route::post("/guest/register-with-code", [AuthController::class, "registerGuestWithCode"]);
Route::post("/guest/login", [AuthController::class, "loginGuest"]);
Route::post("/upgrade-account", [AuthController::class, "upgradeToRegistered"])->middleware("auth:sanctum");
Route::post("/forgot-password", [AuthController::class, "forgotPassword"]);
Route::post("/reset-password", [AuthController::class, "resetPassword"]);

// Guest access - verify invitation code and check email
Route::post("/verify-invitation", [InvitationController::class, "verifyCode"]);
Route::post("/guest/check-email", [InvitationController::class, "checkEmail"]);

// Protected routes
Route::middleware("auth:sanctum")->group(function () {
    // User routes
    Route::get("/user", [UserController::class, "getProfile"]);
    Route::put("/user/update", [UserController::class, "updateProfile"]);
    Route::post("/logout", [AuthController::class, "logout"]);

    // Bill routes
    Route::apiResource("/bills", BillController::class);
    Route::post("/bills/{id}/share", [BillController::class, "shareBill"]);
    Route::get("/bills/{id}/users", [BillController::class, "getBillUsers"]);
    Route::post("/bills/join-with-code", [BillController::class, "joinWithCode"]);

    // Invitation routes
    Route::post("/invitations/create", [InvitationController::class, "createInvitation"]);
    Route::post("/invitations/{id}/accept", [InvitationController::class, "acceptInvitation"]);

    // Premium upgrade
    Route::post("/user/upgrade-premium", [UserController::class, "upgradeToPremium"]);
});
