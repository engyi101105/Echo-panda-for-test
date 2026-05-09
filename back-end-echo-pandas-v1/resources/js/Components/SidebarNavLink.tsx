import { InertiaLinkProps, Link } from '@inertiajs/react';

export default function SidebarNavLink({
    active = false,
    className = '',
    children,
    ...props
}: InertiaLinkProps & { active?: boolean }) {
    return (
        <Link
            {...props}
            className={
                'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ' +
                (active
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700') +
                ' ' +
                className
            }
        >
            {children}
        </Link>
    );
}

