import React from 'react';

const STEPS = [
  {
    icon: 'shield_with_heart',
    label: 'Safety Protocol',
    title: 'უსაფრთხოება, როგორც ოქროს სტანდარტი',
    body: 'პლატფორმაზე რეგისტრაცია ყველას შეუძლია, თუმცა Glow-ს უსაფრთხოების ბეიჯი სანდოობის უმაღლესი ნიშანია. ეს ბეიჯი ადასტურებს, რომ ოსტატის სამუშაო გარემო, ინსტრუმენტების სტერილიზაცია და მომსახურების ხარისხი Glow.ge-ის სტანდარტებით მკაცრად არის გადამოწმებული. აირჩიე ამ ბეიჯის მფლობელი ოსტატი და მიიღე მომსახურება, რომელიც სრულად შეესაბამება Glow.ge-ის უსაფრთხოების ოქროს სტანდარტს.',
    italic: false,
    ornament: false,
  },
  {
    icon: 'diamond',
    label: 'Expert Curated',
    title: 'ექსპერტების რჩეული',
    body: 'სტატუსი მხოლოდ მათთვის, ვისი ხარისხიც თავად პროფესიონალების მიერაა დადასტურებული. ექსპერტის ბეიჯი ნიშნავს, რომ ოსტატის ნამუშევრებმა გაიარა დამოუკიდებელი საბჭოს უმკაცრესი შეფასება. მოძებნე ეს ნიშანი და მიანდე შენი სილამაზე მხოლოდ სრულყოფილებას.',
    italic: false,
    ornament: false,
  },
  {
    icon: 'star_rate',
    label: 'The Pinnacle',
    title: 'Glow Star: ელიტის არჩევანი',
    body: 'ეს არ არის უბრალოდ სტატუსი ეს ინდუსტრიის უმაღლესი სტანდარტის აღიარებაა. ამ ნიშნის მფლობელმა ოსტატმა უკვე წარმატებით გაიარა „მისტიური მომხმარებლის" უმკაცრესი ფარული შეფასება რეალურ პროცესში. მოძებნე ეს ვარსკვლავი პროფილზე და მიიღე უმაღლესი სტანდარტის მომსახურება, დახვეწილი კომუნიკაცია და სრულყოფილი შედეგი.',
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
            style={{ fontFamily: 'var(--font-noto-georgian), sans-serif' }}
          >
            სამი ნაბიჯი შენს იდეალურ ოსტატამდე
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
                  style={{ fontFamily: 'var(--font-noto-georgian), sans-serif' }}
                >
                  {step.title}
                </h3>
                <p
                  className={`text-[14px] text-[#666] leading-[1.8] font-light${step.italic ? ' italic' : ''}`}
                  style={{ fontFamily: 'var(--font-manrope), var(--font-noto-georgian), sans-serif', textAlign: 'center' }}
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
