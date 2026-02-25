import { GuestJobProvider } from '@/features/upload/hooks/useGuestJob';

export default function CreateLayout({ children }: { children: React.ReactNode }): React.ReactElement {
    return <GuestJobProvider>{children}</GuestJobProvider>;
}
