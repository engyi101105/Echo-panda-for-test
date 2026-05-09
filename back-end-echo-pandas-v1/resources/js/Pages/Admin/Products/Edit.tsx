import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { Product } from '@/types/product';

interface Props {
    product: Product;
}

export default function Edit({ product }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: product.name || '',
        description: product.description || '',
        price: product.price?.toString() || '',
        quantity: product.quantity?.toString() || '',
        sku: product.sku || '',
        is_active: product.is_active ?? true,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        put(route('admin.products.update', product.id));
    };

    return (
        <AuthenticatedLayout header="Edit Product">
            <Head title="Edit Product" />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg dark:bg-gray-800">
                <div className="p-6 text-gray-900 dark:text-gray-100">
                            <form onSubmit={submit} className="space-y-6">
                                <div>
                                    <InputLabel
                                        htmlFor="name"
                                        value="Product Name"
                                    />

                                    <TextInput
                                        id="name"
                                        type="text"
                                        name="name"
                                        value={data.name}
                                        className="mt-1 block w-full"
                                        autoComplete="name"
                                        isFocused
                                        onChange={(e) =>
                                            setData('name', e.target.value)
                                        }
                                        required
                                    />

                                    <InputError
                                        message={errors.name}
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
                                            setData(
                                                'description',
                                                e.target.value,
                                            )
                                        }
                                        rows={4}
                                    />

                                    <InputError
                                        message={errors.description}
                                        className="mt-2"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <InputLabel
                                            htmlFor="price"
                                            value="Price"
                                        />

                                        <TextInput
                                            id="price"
                                            type="number"
                                            name="price"
                                            value={data.price}
                                            className="mt-1 block w-full"
                                            step="0.01"
                                            min="0"
                                            onChange={(e) =>
                                                setData('price', e.target.value)
                                            }
                                            required
                                        />

                                        <InputError
                                            message={errors.price}
                                            className="mt-2"
                                        />
                                    </div>

                                    <div>
                                        <InputLabel
                                            htmlFor="quantity"
                                            value="Quantity"
                                        />

                                        <TextInput
                                            id="quantity"
                                            type="number"
                                            name="quantity"
                                            value={data.quantity}
                                            className="mt-1 block w-full"
                                            min="0"
                                            onChange={(e) =>
                                                setData(
                                                    'quantity',
                                                    e.target.value,
                                                )
                                            }
                                            required
                                        />

                                        <InputError
                                            message={errors.quantity}
                                            className="mt-2"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <InputLabel htmlFor="sku" value="SKU" />

                                    <TextInput
                                        id="sku"
                                        type="text"
                                        name="sku"
                                        value={data.sku}
                                        className="mt-1 block w-full"
                                        onChange={(e) =>
                                            setData('sku', e.target.value)
                                        }
                                    />

                                    <InputError
                                        message={errors.sku}
                                        className="mt-2"
                                    />
                                </div>

                                <div className="block">
                                    <label className="flex items-center">
                                        <Checkbox
                                            name="is_active"
                                            checked={data.is_active}
                                            onChange={(e) =>
                                                setData(
                                                    'is_active',
                                                    e.target.checked,
                                                )
                                            }
                                        />
                                        <span className="ms-2 text-sm text-gray-600 dark:text-gray-400">
                                            Active
                                        </span>
                                    </label>
                                </div>

                                <div className="flex items-center gap-4">
                                    <PrimaryButton disabled={processing}>
                                        Update Product
                                    </PrimaryButton>
                                </div>
                            </form>
                        </div>
                    </div>
             
        </AuthenticatedLayout>
    );
}

