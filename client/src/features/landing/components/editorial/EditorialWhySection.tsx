import React from 'react';

const WHY_ITEMS = [
  {
    icon: 'verified_user',
    title: '100% უსაფრთხოება',
    body: 'ჩვენ ვამოწმებთ თითოეული მასტერის ჰიგიენის ნორმებსა და ინსტრუმენტების სტერილიზაციას.',
  },
  {
    icon: 'workspace_premium',
    title: 'ექსპერტული შერჩევა',
    body: 'პლატფორმაზე ხვდებიან მხოლოდ დამოუკიდებელი საბჭოს მიერ აღიარებული პროფესიონალები.',
  },
  {
    icon: 'diamond',
    title: 'პრემიუმ მომსახურება',
    body: 'გარანტირებული ხარისხი და ელიტური გამოცდილება ყველა სერვისზე.',
  },
] as const;

export const EditorialWhySection = (): React.ReactElement => {
  return (
    <section className="py-20 px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16 space-y-2">
          <span
            className="text-[10px] uppercase tracking-[0.6em] font-bold text-[#680005]"
            style={{ fontFamily: 'var(--font-inter), var(--font-noto-georgian), sans-serif' }}
          >
            The Standard
          </span>
          <h2
            className="text-3xl text-[#1a1c1c] tracking-tight text-balance"
            style={{ fontFamily: 'var(--font-noto-serif-georgian), var(--font-noto-serif), serif' }}
          >
            რატომ Glow.ge?
          </h2>
          <div className="w-12 h-0.5 bg-[#680005]/20 mx-auto mt-4" />
        </div>

        {/* Items */}
        <div className="grid grid-cols-1 gap-12">
          {WHY_ITEMS.map(({ icon, title, body }) => (
            <div key={icon} className="flex flex-col items-center text-center space-y-4 px-4">
              <div className="w-10 h-10 rounded-full bg-[#680005]/5 flex items-center justify-center">
                <span className="material-symbols-outlined text-[#92000a] text-2xl">{icon}</span>
              </div>
              <div className="space-y-2">
                <h3
                  className="text-xl text-[#1a1c1c]"
                  style={{ fontFamily: 'var(--font-noto-serif-georgian), var(--font-noto-serif), serif' }}
                >
                  {title}
                </h3>
                <p
                  className="text-sm text-[#5f5e5e] leading-relaxed max-w-sm mx-auto"
                  style={{ fontFamily: 'var(--font-manrope), var(--font-noto-georgian), sans-serif' }}
                >
                  {body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
