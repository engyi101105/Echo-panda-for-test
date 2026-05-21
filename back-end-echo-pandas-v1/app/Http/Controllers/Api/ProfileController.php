<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\UpdateProfileRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    /**
     * Get the authenticated user's profile.
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
            ],
        ]);
    }

    /**
     * Update the authenticated user's profile.
     */
    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        $user->update($request->validated());

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
            ],
        ]);
    }

    /**
     * Get user's favorite songs.
     */
    public function getFavoriteSongs(Request $request): JsonResponse
    {
        $user = $request->user();
        $perPage = $request->get('per_page', 20);

        $favorites = $user->favorites()
            ->where('favoritable_type', 'App\Models\Song')
            ->with('favoritable.album')
            ->latest()
            ->paginate($perPage);

        return response()->json($favorites);
    }

    /**
     * Get user's favorite albums.
     */
    public function getFavoriteAlbums(Request $request): JsonResponse
    {
        $user = $request->user();
        $perPage = $request->get('per_page', 20);

        $favorites = $user->favorites()
            ->where('favoritable_type', 'App\Models\Album')
            ->with('favoritable')
            ->latest()
            ->paginate($perPage);

        return response()->json($favorites);
    }
}
