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
    <section
      className="py-20 px-8"
      style={{ backgroundColor: 'var(--ed-surface-lowest)' }}
    >
      {/* Header */}
      <div className="text-center mb-16 space-y-2">
        <span
          className="text-[10px] uppercase tracking-[0.6em] font-bold"
          style={{
            color: 'var(--ed-primary)',
            fontFamily: 'var(--font-ed-label)',
          }}
        >
          The Standard
        </span>
        <h2
          className="text-4xl tracking-tight"
          style={{
            color: 'var(--ed-on-surface)',
            fontFamily: 'var(--font-ed-display)',
            textWrap: 'balance',
          }}
        >
          რატომ Glow.ge?
        </h2>
        <div
          className="w-12 h-0.5 mx-auto mt-4"
          style={{ backgroundColor: 'color-mix(in oklch, var(--ed-primary) 20%, transparent)' }}
        />
      </div>

      {/* Items */}
      <div className="grid grid-cols-1 gap-12 max-w-xl mx-auto">
        {WHY_ITEMS.map(({ icon, title, body }) => (
          <div key={icon} className="flex items-start gap-5">
            {/* Icon */}
            <div
              className="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-full"
              style={{ backgroundColor: 'color-mix(in oklch, var(--ed-primary) 5%, transparent)' }}
            >
              <span
                className="material-symbols-outlined text-2xl select-none"
                style={{ color: 'var(--ed-primary-container)' }}
              >
                {icon}
              </span>
            </div>

            {/* Text */}
            <div className="space-y-1.5">
              <p
                className="text-base font-semibold leading-snug"
                style={{
                  color: 'var(--ed-on-surface)',
                  fontFamily: 'var(--font-ed-display)',
                }}
              >
                {title}
              </p>
              <p
                className="text-sm leading-relaxed"
                style={{
                  color: 'color-mix(in oklch, var(--ed-on-surface) 60%, transparent)',
                  fontFamily: 'var(--font-ed-body)',
                }}
              >
                {body}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
