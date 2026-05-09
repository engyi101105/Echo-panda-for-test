import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { Album } from '@/types/album';

interface Props {
    albums: Album[];
    defaultAlbumId?: number;
}

export default function Create({ albums, defaultAlbumId }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({
        album_id: defaultAlbumId?.toString() || '',
        title: '',
        artist: '',
        duration: '',
        track_number: '',
        lyrics: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('admin.songs.store'), {
            onSuccess: () => reset(),
        });
    };

    return (
        <AuthenticatedLayout header="Create Song">
            <Head title="Create Song" />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg dark:bg-gray-800">
                <div className="p-6 text-gray-900 dark:text-gray-100">
                    <form onSubmit={submit} className="space-y-6">
                        <div>
                            <InputLabel htmlFor="album_id" value="Album" />

                            <select
                                id="album_id"
                                name="album_id"
                                value={data.album_id}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:focus:border-indigo-600 dark:focus:ring-indigo-600"
                                onChange={(e) =>
                                    setData('album_id', e.target.value)
                                }
                                required
                            >
                                <option value="">Select an album</option>
                                {albums.map((album) => (
                                    <option key={album.id} value={album.id}>
                                        {album.title} - {album.artist}
                                    </option>
                                ))}
                            </select>

                            <InputError
                                message={errors.album_id}
                                className="mt-2"
                            />
                        </div>

                        <div>
                            <InputLabel htmlFor="title" value="Song Title" />

                            <TextInput
                                id="title"
                                type="text"
                                name="title"
                                value={data.title}
                                className="mt-1 block w-full"
                                autoComplete="title"
                                isFocused
                                onChange={(e) =>
                                    setData('title', e.target.value)
                                }
                                required
                            />

                            <InputError
                                message={errors.title}
                                className="mt-2"
                            />
                        </div>

                        <div>
                            <InputLabel htmlFor="artist" value="Artist" />

                            <TextInput
                                id="artist"
                                type="text"
                                name="artist"
                                value={data.artist}
                                className="mt-1 block w-full"
                                onChange={(e) =>
                                    setData('artist', e.target.value)
                                }
                            />

                            <InputError
                                message={errors.artist}
                                className="mt-2"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <InputLabel
                                    htmlFor="duration"
                                    value="Duration (seconds)"
                                />

                                <TextInput
                                    id="duration"
                                    type="number"
                                    name="duration"
                                    value={data.duration}
                                    className="mt-1 block w-full"
                                    min="1"
                                    onChange={(e) =>
                                        setData('duration', e.target.value)
                                    }
                                    required
                                />

                                <InputError
                                    message={errors.duration}
                                    className="mt-2"
                                />
                            </div>

                            <div>
                                <InputLabel
                                    htmlFor="track_number"
                                    value="Track Number"
                                />

                                <TextInput
                                    id="track_number"
                                    type="number"
                                    name="track_number"
                                    value={data.track_number}
                                    className="mt-1 block w-full"
                                    min="1"
                                    onChange={(e) =>
                                        setData('track_number', e.target.value)
                                    }
                                    required
                                />

                                <InputError
                                    message={errors.track_number}
                                    className="mt-2"
                                />
                            </div>
                        </div>

                        <div>
                            <InputLabel htmlFor="lyrics" value="Lyrics" />

                            <textarea
                                id="lyrics"
                                name="lyrics"
                                value={data.lyrics}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:focus:border-indigo-600 dark:focus:ring-indigo-600"
                                onChange={(e) =>
                                    setData('lyrics', e.target.value)
                                }
                                rows={8}
                            />

                            <InputError
                                message={errors.lyrics}
                                className="mt-2"
                            />
                        </div>

                        <div className="flex items-center gap-4">
                            <PrimaryButton disabled={processing}>
                                Create Song
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

