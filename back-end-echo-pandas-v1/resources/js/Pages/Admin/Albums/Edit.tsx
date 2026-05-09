import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { Album } from '@/types/album';

interface Props {
    album: Album;
}

export default function Edit({ album }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        title: album.title || '',
        artist: album.artist || '',
        release_date: album.release_date
            ? new Date(album.release_date).toISOString().split('T')[0]
            : '',
        description: album.description || '',
        cover_image: album.cover_image || '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        put(route('admin.albums.update', album.id));
    };

    return (
        <AuthenticatedLayout header="Edit Album">
            <Head title="Edit Album" />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg dark:bg-gray-800">
                <div className="p-6 text-gray-900 dark:text-gray-100">
                    <form onSubmit={submit} className="space-y-6">
                        <div>
                            <InputLabel htmlFor="title" value="Album Title" />

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
                                required
                            />

                            <InputError
                                message={errors.artist}
                                className="mt-2"
                            />
                        </div>

                        <div>
                            <InputLabel
                                htmlFor="release_date"
                                value="Release Date"
                            />

                            <TextInput
                                id="release_date"
                                type="date"
                                name="release_date"
                                value={data.release_date}
                                className="mt-1 block w-full"
                                onChange={(e) =>
                                    setData('release_date', e.target.value)
                                }
                            />

                            <InputError
                                message={errors.release_date}
                                className="mt-2"
                            />
                        </div>

                        <div>
                            <InputLabel
                                htmlFor="description"
                                value="Description"
                            />

                            <textarea
                                id="description"
                                name="description"
                                value={data.description}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:focus:border-indigo-600 dark:focus:ring-indigo-600"
                                onChange={(e) =>
                                    setData('description', e.target.value)
                                }
                                rows={4}
                            />

                            <InputError
                                message={errors.description}
                                className="mt-2"
                            />
                        </div>

                        <div>
                            <InputLabel
                                htmlFor="cover_image"
                                value="Cover Image URL"
                            />

                            <TextInput
                                id="cover_image"
                                type="text"
                                name="cover_image"
                                value={data.cover_image}
                                className="mt-1 block w-full"
                                onChange={(e) =>
                                    setData('cover_image', e.target.value)
                                }
                            />

                            <InputError
                                message={errors.cover_image}
                                className="mt-2"
                            />
                        </div>

                        <div className="flex items-center gap-4">
                            <PrimaryButton disabled={processing}>
                                Update Album
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

