'use client'

import { useTransition } from 'react';

interface DeleteUserButtonProps {
    userId: string;
    userEmail: string;
    deleteAction: (formData: FormData) => Promise<void>;
}

export function DeleteUserButton({ userId, userEmail, deleteAction }: DeleteUserButtonProps) {
    const [isPending, startTransition] = useTransition();

    const handleDelete = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        if (!confirm(`정말로 ${userEmail} 사용자를 삭제하시겠습니까?`)) {
            return;
        }

        startTransition(async () => {
            const formData = new FormData();
            formData.append('userId', userId);
            await deleteAction(formData);
        });
    };

    return (
        <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {isPending ? 'Deleting...' : 'Delete'}
        </button>
    );
}
