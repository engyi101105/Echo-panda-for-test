<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Song extends Model
{
    /** @use HasFactory<\Database\Factories\SongFactory> */
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'album_id',
        'title',
        'artist',
        'duration',
        'track_number',
        'lyrics',
        's3_audio_url',
        's3_lyrics_url',
    ];

    /**
     * Get the album that owns the song.
     */
    public function album(): BelongsTo
    {
        return $this->belongsTo(Album::class);
    }

    /**
     * Get all favorites for this song.
     */
    public function favorites()
    {
        return $this->morphMany(Favorite::class, 'favoritable');
    }

    /**
     * Get listen history for this song.
     */
    public function listenHistory()
    {
        return $this->hasMany(ListenHistory::class);
    }

    /**
     * Get ratings for this song.
     */
    public function ratings()
    {
        return $this->hasMany(Rating::class);
    }
}
