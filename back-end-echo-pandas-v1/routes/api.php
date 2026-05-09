<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProductController;
use Illuminate\Support\Facades\Route;

// Public Authentication Routes
Route::post('/register', [AuthController::class, 'register'])->name('api.register');
Route::post('/login', [AuthController::class, 'login'])->name('api.login');
Route::post('/firebase/login', [AuthController::class, 'firebaseLogin'])->name('api.firebase.login');

// Protected Routes (require authentication)
Route::middleware('auth:sanctum')->group(function () {
    // User routes
    Route::post('/logout', [AuthController::class, 'logout'])->name('api.logout');
    Route::get('/me', [AuthController::class, 'me'])->name('api.me');
    Route::get('/users/by-role', [AuthController::class, 'usersByRole'])
        ->middleware('role:admin')
        ->name('api.users.by-role');

    // Product routes (protected)
    // Route::apiResource('products', ProductController::class);
});

Route::get('/products', [ProductController::class, 'index']);
