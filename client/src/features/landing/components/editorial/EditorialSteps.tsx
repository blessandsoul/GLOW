import React from 'react';

const STEPS = [
  {
    icon: 'shield_with_heart',
    label: 'Safety Protocol',
    title: 'ჯანმრთელობა პირველ ადგილზე',
    body: 'ჩვენი უმკაცრესი სტანდარტი. ოსტატის პროფილზე უსაფრთხოების ნიშანი ადასტურებს, რომ მისი ინსტრუმენტების სტერილიზაცია და ჰიგიენის ნორმები ოფიციალურად გადამოწმებულია ჩვენი ადმინისტრაციის მიერ. ეს არის ფუნდამენტური მოთხოვნა ყველა სპეციალისტისთვის.',
    italic: false,
    ornament: false,
  },
  {
    icon: 'diamond',
    label: 'Expert Curated',
    title: 'ექსპერტების რჩეული',
    body: 'ხარისხი, რომელსაც თავად პროფესიონალები აღიარებენ. ამ სტატუსის მქონე ოსტატების ტექნიკა და ნამუშევრების ვიზუალი დეტალურად ფასდება სფეროს წამყვანი სპეციალისტებისგან შემდგარი დამოუკიდებელი საბჭოს მიერ. მხოლოდ უნაკლო შესრულება იღებს ამ აღიარებას.',
    italic: false,
    ornament: false,
  },
  {
    icon: 'star_rate',
    label: 'The Pinnacle',
    title: 'Glow Star: ელიტის არჩევანი',
    body: 'საუკეთესოთა შორის საუკეთესო. ეს ნიშანი ინთება მხოლოდ მაშინ, როცა ოსტატი წარმატებით გაივლის „მისტიური შოპერის" ფარულ ტესტირებას რეალურ პროცესში. ეს არის იდეალური მომსახურების, კომუნიკაციისა და შედეგის 100%-იანი გარანტია პრემიუმ კლასში.',
    italic: true,
    ornament: true,
  },
] as const;

export const EditorialSteps = (): React.ReactElement => {
  return (
    <section className="py-24 px-10 bg-white">
      <div className="max-w-screen-md mx-auto">
        {/* Header */}
        <div className="text-center mb-12 space-y-4">
          <span
            className="text-[10px] uppercase tracking-[0.6em] font-bold text-[#92000a]"
            style={{ fontFamily: 'var(--font-inter), var(--font-noto-georgian), sans-serif' }}
          >
            The Standard of Excellence
          </span>
          <h2
            className="text-3xl font-bold text-black leading-tight tracking-tight text-balance"
            style={{ fontFamily: 'var(--font-noto-serif-georgian), var(--font-noto-serif), serif' }}
          >
            სამი ნაბიჯი სრულყოფილებამდე
          </h2>
          <div className="flex items-center justify-center space-x-4">
            <div className="h-px w-8 bg-[#e0e0e0]" />
            <p
              className="text-[11px] text-[#888] uppercase tracking-[0.2em]"
              style={{ fontFamily: 'var(--font-manrope), var(--font-noto-georgian), sans-serif' }}
            >
              როგორ ვარჩევთ საუკეთესოებს
            </p>
            <div className="h-px w-8 bg-[#e0e0e0]" />
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-0">
          {STEPS.map((step, i) => (
            <div
              key={step.icon}
              className={`py-12${i < STEPS.length - 1 ? ' border-b border-[#f0f0f0]' : ''}`}
            >
              <div className="flex flex-col items-center text-center max-w-lg mx-auto">
                <div className="mb-6">
                  <span
                    className="material-symbols-outlined text-[#92000a] text-xl"
                    style={{ fontVariationSettings: "'wght' 200" }}
                  >
                    {step.icon}
                  </span>
                </div>
                <span
                  className="text-[9px] uppercase tracking-[0.4em] text-[#92000a] font-bold mb-3"
                  style={{ fontFamily: 'var(--font-inter), var(--font-noto-georgian), sans-serif' }}
                >
                  {step.label}
                </span>
                <h3
                  className="text-2xl font-bold text-black mb-5 tracking-tight leading-tight"
                  style={{ fontFamily: 'var(--font-noto-serif-georgian), var(--font-noto-serif), serif' }}
                >
                  {step.title}
                </h3>
                <p
                  className={`text-[14px] text-[#666] leading-[1.8] font-light${step.italic ? ' italic' : ''}`}
                  style={{ fontFamily: 'var(--font-manrope), var(--font-noto-georgian), sans-serif', textAlign: 'justify', textJustify: 'inter-word' }}
                >
                  {step.body}
                </p>
                {step.ornament && (
                  <div className="mt-10 flex items-center space-x-6 opacity-40">
                    <div className="w-12 bg-[#92000a]" style={{ height: '0.5px' }} />
                    <span
                      className="text-[8px] uppercase tracking-[0.5em] text-[#92000a] font-bold"
                      style={{ fontFamily: 'var(--font-inter), var(--font-noto-georgian), sans-serif' }}
                    >
                      Only at Glow.ge
                    </span>
                    <div className="w-12 bg-[#92000a]" style={{ height: '0.5px' }} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
