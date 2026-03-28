import React from 'react';

interface Step {
  label: string;
  title: string;
  icon: string;
  body: string;
  italic?: boolean;
  ornament?: boolean;
}

const STEPS: Step[] = [
  {
    label: 'Safety Protocol',
    title: 'ჯანმრთელობა პირველ ადგილზე',
    icon: 'shield_with_heart',
    body: 'ჩვენი უმკაცრესი სტანდარტი. ოსტატის პროფილზე უსაფრთხოების ნიშანი ადასტურებს, რომ მისი ინსტრუმენტების სტერილიზაცია და ჰიგიენის ნორმები ოფიციალურად გადამოწმებულია ჩვენი ადმინისტრაციის მიერ. ეს არის ფუნდამენტური მოთხოვნა ყველა სპეციალისტისთვის.',
  },
  {
    label: 'Expert Curated',
    title: 'ექსპერტების რჩეული',
    icon: 'diamond',
    body: 'ხარისხი, რომელსაც თავად პროფესიონალები აღიარებენ. ამ სტატუსის მქონე ოსტატების ტექნიკა და ნამუშევრების ვიზუალი დეტალურად ფასდება სფეროს წამყვანი სპეციალისტებისგან შემდგარი დამოუკიდებელი საბჭოს მიერ.',
  },
  {
    label: 'The Pinnacle',
    title: 'Glow Star: ელიტის არჩევანი',
    icon: 'star_rate',
    body: 'საუკეთესოთა შორის საუკეთესო. ეს ნიშანი ინთება მხოლოდ მაშინ, როცა ოსტატი წარმატებით გაივლის „მისტიური შოპერის" ფარულ ტესტირებას რეალურ პროცესში.',
    italic: true,
    ornament: true,
  },
];

export const EditorialSteps = (): React.ReactElement => {
  return (
    <section
      className="py-24 px-10"
      style={{ backgroundColor: 'var(--ed-surface-lowest)' }}
    >
      {/* Header */}
      <div className="text-center mb-12 space-y-4">
        <span
          className="text-[10px] uppercase tracking-[0.6em] font-bold"
          style={{
            color: 'var(--ed-primary)',
            fontFamily: 'var(--font-ed-label)',
          }}
        >
          The Standard of Excellence
        </span>
        <h2
          className="text-4xl font-bold leading-none tracking-tight"
          style={{
            color: 'var(--ed-on-surface)',
            fontFamily: 'var(--font-ed-display)',
            textWrap: 'balance',
          }}
        >
          სამი ნაბიჯი სრულყოფილებამდე
        </h2>
        <div className="flex items-center justify-center gap-4">
          <div
            className="h-px w-8"
            style={{ backgroundColor: 'color-mix(in oklch, var(--ed-on-surface) 15%, transparent)' }}
          />
          <p
            className="text-[11px] uppercase tracking-[0.2em]"
            style={{
              color: 'color-mix(in oklch, var(--ed-on-surface) 45%, transparent)',
              fontFamily: 'var(--font-ed-label)',
            }}
          >
            როგორ ვარჩევთ საუკეთესოებს
          </p>
          <div
            className="h-px w-8"
            style={{ backgroundColor: 'color-mix(in oklch, var(--ed-on-surface) 15%, transparent)' }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="max-w-2xl mx-auto">
        {STEPS.map((step, i) => (
          <div
            key={step.icon}
            className={`py-10 ${i < STEPS.length - 1 ? 'border-b' : ''}`}
            style={
              i < STEPS.length - 1
                ? { borderColor: 'color-mix(in oklch, var(--ed-outline-variant) 15%, transparent)' }
                : undefined
            }
          >
            {/* Step label */}
            <p
              className="text-[9px] uppercase tracking-[0.4em] mb-3"
              style={{
                color: 'var(--ed-primary)',
                fontFamily: 'var(--font-ed-label)',
              }}
            >
              {step.label}
            </p>

            {/* Icon + Title row */}
            <div className="flex items-center gap-3 mb-4">
              <span
                className="material-symbols-outlined text-xl select-none"
                style={{ color: 'var(--ed-primary)' }}
              >
                {step.icon}
              </span>
              <h3
                className="text-2xl font-bold"
                style={{
                  color: 'var(--ed-on-surface)',
                  fontFamily: 'var(--font-ed-display)',
                }}
              >
                {step.title}
              </h3>
            </div>

            {/* Body */}
            <p
              className={`text-sm leading-relaxed text-justify${step.italic ? ' italic' : ''}`}
              style={{
                color: 'color-mix(in oklch, var(--ed-on-surface) 65%, transparent)',
                fontFamily: 'var(--font-ed-body)',
              }}
            >
              {step.body}
            </p>

            {/* Ornament */}
            {step.ornament && (
              <p
                className="mt-4 text-[9px] uppercase tracking-[0.5em] text-center"
                style={{
                  color: 'color-mix(in oklch, var(--ed-primary) 50%, transparent)',
                  fontFamily: 'var(--font-ed-label)',
                }}
              >
                — Only at Glow.ge —
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};
