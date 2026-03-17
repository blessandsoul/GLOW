import { OnboardingWizard } from '@/features/onboarding/components/OnboardingWizard';

export const metadata = {
    title: 'Welcome to Glow.GE',
};

export default function OnboardingPage(): React.ReactElement {
    return <OnboardingWizard />;
}
