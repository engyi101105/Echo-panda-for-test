<?php

use App\Http\Controllers\Api\AlbumController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\FavoriteController;
use App\Http\Controllers\Api\ListenHistoryController;
use App\Http\Controllers\Api\PlaylistController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\SongController;
use Illuminate\Support\Facades\Route;

// Public Authentication Routes
Route::post('/register', [AuthController::class, 'register'])->name('api.register');
Route::post('/login', [AuthController::class, 'login'])->name('api.login');
Route::post('/firebase/login', [AuthController::class, 'firebaseLogin'])->name('api.firebase.login');

// Public Routes (no authentication required)
Route::get('/products', [ProductController::class, 'index'])->name('api.products.index');
Route::get('/products/{product}', [ProductController::class, 'show'])->name('api.products.show');

// Public Album and Song Routes (readable by everyone)
Route::get('/albums', [AlbumController::class, 'index'])->name('api.albums.index');
Route::get('/albums/{album}', [AlbumController::class, 'show'])->name('api.albums.show');
Route::get('/songs', [SongController::class, 'index'])->name('api.songs.index');
Route::get('/songs/{song}', [SongController::class, 'show'])->name('api.songs.show');
Route::get('/albums/{albumId}/songs', [SongController::class, 'getByAlbum'])->name('api.albums.songs');
Route::get('/stats/most-played-songs', [ListenHistoryController::class, 'mostPlayedSongs'])->name('api.stats.most-played-songs');
Route::get('/stats/most-played-albums', [ListenHistoryController::class, 'mostPlayedAlbums'])->name('api.stats.most-played-albums');

// Protected Routes (require authentication)
Route::middleware('auth:sanctum')->group(function () {
    // User Authentication Routes
    Route::post('/logout', [AuthController::class, 'logout'])->name('api.logout');
    Route::get('/me', [AuthController::class, 'me'])->name('api.me');
    
    // User Management (admin only)
    Route::get('/users/by-role', [AuthController::class, 'usersByRole'])
        ->middleware('role:admin')
        ->name('api.users.by-role');

    // Profile Routes
    Route::get('/profile', [ProfileController::class, 'show'])->name('api.profile.show');
    Route::put('/profile', [ProfileController::class, 'update'])->name('api.profile.update');
    Route::get('/profile/favorite-songs', [ProfileController::class, 'getFavoriteSongs'])->name('api.profile.favorite-songs');
    Route::get('/profile/favorite-albums', [ProfileController::class, 'getFavoriteAlbums'])->name('api.profile.favorite-albums');

    // Album Routes (create/update/delete protected)
    Route::post('/albums', [AlbumController::class, 'store'])
        ->middleware('role:admin,artist,publicer')
        ->name('api.albums.store');
    Route::put('/albums/{album}', [AlbumController::class, 'update'])
        ->middleware('role:admin,artist,publicer')
        ->name('api.albums.update');
    Route::delete('/albums/{album}', [AlbumController::class, 'destroy'])
        ->middleware('role:admin,artist,publicer')
        ->name('api.albums.destroy');

    // Song Routes (create/update/delete protected)
    Route::post('/songs', [SongController::class, 'store'])
        ->middleware('role:admin,artist,publicer')
        ->name('api.songs.store');
    Route::put('/songs/{song}', [SongController::class, 'update'])
        ->middleware('role:admin,artist,publicer')
        ->name('api.songs.update');
    Route::delete('/songs/{song}', [SongController::class, 'destroy'])
        ->middleware('role:admin,artist,publicer')
        ->name('api.songs.destroy');

    // Favorites Routes
    Route::get('/favorites', [FavoriteController::class, 'index'])->name('api.favorites.index');
    Route::post('/favorites/songs', [FavoriteController::class, 'addSong'])->name('api.favorites.add-song');
    Route::post('/favorites/albums', [FavoriteController::class, 'addAlbum'])->name('api.favorites.add-album');
    Route::post('/favorites/songs/check', [FavoriteController::class, 'checkSong'])->name('api.favorites.check-song');
    Route::post('/favorites/albums/check', [FavoriteController::class, 'checkAlbum'])->name('api.favorites.check-album');
    Route::post('/favorites/songs/remove', [FavoriteController::class, 'removeSong'])->name('api.favorites.remove-song');
    Route::post('/favorites/albums/remove', [FavoriteController::class, 'removeAlbum'])->name('api.favorites.remove-album');
    Route::delete('/favorites/{favorite}', [FavoriteController::class, 'destroy'])->name('api.favorites.destroy');

    // Listen History Routes
    Route::post('/listen-history', [ListenHistoryController::class, 'track'])->name('api.listen-history.track');
    Route::get('/listen-history', [ListenHistoryController::class, 'myHistory'])->name('api.listen-history.me');

    // Playlist Routes
    Route::get('/playlists', [PlaylistController::class, 'index'])->name('api.playlists.index');
    Route::post('/playlists', [PlaylistController::class, 'store'])->name('api.playlists.store');
    Route::delete('/playlists/{playlist}', [PlaylistController::class, 'destroy'])->name('api.playlists.destroy');
    Route::get('/playlists/{playlist}/songs', [PlaylistController::class, 'songs'])->name('api.playlists.songs');
    Route::post('/playlists/{playlist}/songs', [PlaylistController::class, 'addSong'])->name('api.playlists.add-song');
    Route::delete('/playlists/{playlist}/songs/{song}', [PlaylistController::class, 'removeSong'])->name('api.playlists.remove-song');
    Route::get('/playlists/{playlist}/songs/{song}/exists', [PlaylistController::class, 'hasSong'])->name('api.playlists.has-song');

    // Product Routes (protected)
    Route::post('/products', [ProductController::class, 'store'])
        ->middleware('role:admin')
        ->name('api.products.store');
    Route::put('/products/{product}', [ProductController::class, 'update'])
        ->middleware('role:admin')
        ->name('api.products.update');
    Route::delete('/products/{product}', [ProductController::class, 'destroy'])
        ->middleware('role:admin')
        ->name('api.products.destroy');
});

