<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAlbumRequest;
use App\Http\Requests\UpdateAlbumRequest;
use App\Models\Album;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class AlbumController extends Controller
{
    use AuthorizesRequests;

    /**
     * Display a listing of albums.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Album::query();

        // Search functionality
        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('artist', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Sort by latest or oldest
        $sortBy = $request->get('sort_by', 'latest');
        if ($sortBy === 'oldest') {
            $query->oldest();
        } else {
            $query->latest();
        }

        // Pagination
        $perPage = $request->get('per_page', 15);
        $albums = $query->paginate($perPage);

        return response()->json($albums);
    }

    /**
     * Store a newly created album.
     */
    public function store(StoreAlbumRequest $request): JsonResponse
    {
        $this->authorize('create', Album::class);

        $album = Album::create($request->validated());

        return response()->json([
            'message' => 'Album created successfully',
            'data' => $album->load('songs'),
        ], 201);
    }

    /**
     * Display the specified album with its songs.
     */
    public function show(Album $album): JsonResponse
    {
        return response()->json($album->load('songs'));
    }

    /**
     * Update the specified album.
     */
    public function update(UpdateAlbumRequest $request, Album $album): JsonResponse
    {
        $this->authorize('update', $album);

        $album->update($request->validated());

        return response()->json([
            'message' => 'Album updated successfully',
            'data' => $album->load('songs'),
        ]);
    }

    /**
     * Remove the specified album.
     */
    public function destroy(Album $album): JsonResponse
    {
        $this->authorize('delete', $album);

        $album->delete();

        return response()->json([
            'message' => 'Album deleted successfully',
        ]);
    }
}
