import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import { Head, Link } from '@inertiajs/react';
import { Song } from '@/types/song';

interface Props {
    song: Song;
}

export default function Show({ song }: Props) {
    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <AuthenticatedLayout header="Song Details">
            <Head title="Song Details" />

            <div className="mb-4 flex items-center justify-end">
                <Link href={route('admin.songs.edit', song.id)}>
                    <PrimaryButton>Edit Song</PrimaryButton>
                </Link>
            </div>

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg dark:bg-gray-800">
                <div className="p-6 text-gray-900 dark:text-gray-100">
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-lg font-semibold">
                                {song.title}
                            </h3>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                {song.artist || song.album?.artist || 'Unknown Artist'}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 border-t border-gray-200 pt-4 dark:border-gray-700">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Album
                                </p>
                                <p className="mt-1 text-lg">
                                    {song.album?.title || 'N/A'}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Track Number
                                </p>
                                <p className="mt-1 text-lg">
                                    #{song.track_number}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Duration
                                </p>
                                <p className="mt-1 text-lg">
                                    {formatDuration(song.duration)}
                                </p>
                            </div>
                        </div>

                        {song.lyrics && (
                            <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
                                <h4 className="mb-2 text-sm font-semibold">
                                    Lyrics
                                </h4>
                                <div className="whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-sm dark:bg-gray-900">
                                    {song.lyrics}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

