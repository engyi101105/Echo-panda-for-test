import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import { Head, Link } from '@inertiajs/react';
import { Product } from '@/types/product';

interface Props {
    product: Product;
}

export default function Show({ product }: Props) {
    return (
        <AuthenticatedLayout header="Product Details">
            <Head title="Product Details" />

            <div className="mb-4 flex items-center justify-end">
                <Link href={route('admin.products.edit', product.id)}>
                    <PrimaryButton>Edit Product</PrimaryButton>
                </Link>
            </div>

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg dark:bg-gray-800">
                <div className="p-6 text-gray-900 dark:text-gray-100">
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-lg font-semibold">
                                        {product.name}
                                    </h3>
                                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                        {product.description || 'No description'}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 border-t border-gray-200 pt-4 dark:border-gray-700">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Price
                                        </p>
                                        <p className="mt-1 text-lg font-semibold">
                                            ${product.price}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Quantity
                                        </p>
                                        <p className="mt-1 text-lg font-semibold">
                                            {product.quantity}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            SKU
                                        </p>
                                        <p className="mt-1 text-lg">
                                            {product.sku || 'N/A'}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Status
                                        </p>
                                        <p className="mt-1">
                                            <span
                                                className={`inline-flex rounded-full px-2 text-xs font-semibold ${
                                                    product.is_active
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                }`}
                                            >
                                                {product.is_active
                                                    ? 'Active'
                                                    : 'Inactive'}
                                            </span>
                                        </p>
                                    </div>
                                </div>

                                <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Created:{' '}
                                        {new Date(
                                            product.created_at,
                                        ).toLocaleString()}
                                    </p>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                        Updated:{' '}
                                        {new Date(
                                            product.updated_at,
                                        ).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                
        </AuthenticatedLayout>
    );
}

