<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\FirebaseLoginRequest;
use App\Http\Requests\Api\LoginRequest;
use App\Http\Requests\Api\RegisterRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Register a new user.
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => User::ROLE_USER,
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'User registered successfully',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
            'token' => $token,
            'token_type' => 'Bearer',
        ], 201);
    }

    /**
     * Login user and create token.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $users = User::where('email', $request->email)->get();

        $user = $users->first(function (User $candidate) use ($request) {
            return Hash::check($request->password, $candidate->password);
        });

        if (! $user) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $adminUser = $users->firstWhere('role', User::ROLE_ADMIN);

        if ($adminUser && Hash::check($request->password, $adminUser->password)) {
            $user = $adminUser;
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
            'token' => $token,
            'token_type' => 'Bearer',
        ]);
    }

    /**
     * Logout user (Revoke the token).
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully',
        ]);
    }

    /**
     * Get authenticated user information.
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => [
                'id' => $request->user()->id,
                'name' => $request->user()->name,
                'email' => $request->user()->email,
                'role' => $request->user()->role,
            ],
        ]);
    }

    /**
     * Sync/login users coming from Firebase Auth + Firestore.
     */
    public function firebaseLogin(FirebaseLoginRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $users = User::where('email', $validated['email'])->get();

        $user = $users->firstWhere('role', User::ROLE_ADMIN)
            ?? $users->first()
            ?? User::create([
                'email' => $validated['email'],
                'name' => $validated['name'] ?? explode('@', $validated['email'])[0],
                'password' => Hash::make((string) str()->uuid()),
                'role' => User::ROLE_USER,
            ]);

        if (! empty($validated['name']) && $user->name !== $validated['name']) {
            $user->name = $validated['name'];
            $user->save();
        }

        $token = $user->createToken('firebase_auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Firebase login synchronized successfully',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
            'firebase_uid' => $validated['firebase_uid'] ?? null,
            'provider' => $validated['provider'] ?? null,
            'redirect_to' => $user->roleRedirectTarget(),
            'token' => $token,
            'token_type' => 'Bearer',
        ]);
    }

    /**
     * Get users grouped by role buckets.
     */
    public function usersByRole(): JsonResponse
    {
        $users = User::select('id', 'name', 'email', 'role')->get();

        return response()->json([
            'normal_users' => $users->where('role', User::ROLE_USER)->values(),
            'artist_users' => $users->whereIn('role', [User::ROLE_ARTIST, User::ROLE_PUBLICER])->values(),
            'admin_users' => $users->where('role', User::ROLE_ADMIN)->values(),
        ]);
    }
}
