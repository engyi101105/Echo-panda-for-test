<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSongRequest;
use App\Http\Requests\UpdateSongRequest;
use App\Models\Song;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class SongController extends Controller
{
    use AuthorizesRequests;

    /**
     * Display a listing of songs.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Song::query();

        // Search functionality
        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('artist', 'like', "%{$search}%")
                    ->orWhere('lyrics', 'like', "%{$search}%");
            });
        }

        // Filter by album
        if ($request->has('album_id')) {
            $query->where('album_id', $request->get('album_id'));
        }

        // Sort by track number or latest
        $sortBy = $request->get('sort_by', 'track_number');
        if ($sortBy === 'latest') {
            $query->latest();
        } else {
            $query->orderBy('track_number', 'asc');
        }

        // Pagination
        $perPage = $request->get('per_page', 20);
        $songs = $query->with('album')->paginate($perPage);

        return response()->json($songs);
    }

    /**
     * Store a newly created song.
     */
    public function store(StoreSongRequest $request): JsonResponse
    {
        $this->authorize('create', Song::class);

        $song = Song::create($request->validated());

        return response()->json([
            'message' => 'Song created successfully',
            'data' => $song->load('album'),
        ], 201);
    }

    /**
     * Display the specified song.
     */
    public function show(Song $song): JsonResponse
    {
        return response()->json($song->load('album'));
    }

    /**
     * Update the specified song.
     */
    public function update(UpdateSongRequest $request, Song $song): JsonResponse
    {
        $this->authorize('update', $song);

        $song->update($request->validated());

        return response()->json([
            'message' => 'Song updated successfully',
            'data' => $song->load('album'),
        ]);
    }

    /**
     * Remove the specified song.
     */
    public function destroy(Song $song): JsonResponse
    {
        $this->authorize('delete', $song);

        $song->delete();

        return response()->json([
            'message' => 'Song deleted successfully',
        ]);
    }

    /**
     * Get songs by album.
     */
    public function getByAlbum(Request $request, int $albumId): JsonResponse
    {
        $query = Song::where('album_id', $albumId)->orderBy('track_number', 'asc');

        $perPage = $request->get('per_page', 20);
        $songs = $query->paginate($perPage);

        return response()->json($songs);
    }
}
