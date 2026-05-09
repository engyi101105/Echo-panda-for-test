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
    ];

    /**
     * Get the album that owns the song.
     */
    public function album(): BelongsTo
    {
        return $this->belongsTo(Album::class);
    }
}
