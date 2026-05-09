import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import { Head, Link } from '@inertiajs/react';
import { Album } from '@/types/album';
import { Song } from '@/types/song';

interface Props {
    album: Album & {
        songs: Song[];
    };
}

export default function Show({ album }: Props) {
    const formatDate = (date: string | null) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString();
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <AuthenticatedLayout header="Album Details">
            <Head title="Album Details" />

            <div className="mb-4 flex items-center justify-between">
                <Link
                    href={route('admin.songs.create', {
                        album_id: album.id,
                    })}
                >
                    <PrimaryButton>Add Song</PrimaryButton>
                </Link>
                <Link href={route('admin.albums.edit', album.id)}>
                    <PrimaryButton>Edit Album</PrimaryButton>
                </Link>
            </div>

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg dark:bg-gray-800">
                <div className="p-6 text-gray-900 dark:text-gray-100">
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-lg font-semibold">
                                {album.title}
                            </h3>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                by {album.artist}
                            </p>
                            {album.description && (
                                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                    {album.description}
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 border-t border-gray-200 pt-4 dark:border-gray-700">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Release Date
                                </p>
                                <p className="mt-1 text-lg">
                                    {formatDate(album.release_date)}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Total Songs
                                </p>
                                <p className="mt-1 text-lg">
                                    {album.songs?.length || 0}
                                </p>
                            </div>
                        </div>

                        {/* Songs List */}
                        {album.songs && album.songs.length > 0 && (
                            <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
                                <h4 className="mb-4 text-lg font-semibold">
                                    Songs
                                </h4>
                                <div className="space-y-2">
                                    {album.songs
                                        .sort((a, b) => a.track_number - b.track_number)
                                        .map((song) => (
                                            <div
                                                key={song.id}
                                                className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                        #{song.track_number}
                                                    </span>
                                                    <div>
                                                        <p className="font-medium">
                                                            {song.title}
                                                        </p>
                                                        {song.artist && (
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                                {song.artist}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                                        {formatDuration(
                                                            song.duration,
                                                        )}
                                                    </span>
                                                    <Link
                                                        href={route(
                                                            'admin.songs.edit',
                                                            song.id,
                                                        )}
                                                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                                    >
                                                        Edit
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

