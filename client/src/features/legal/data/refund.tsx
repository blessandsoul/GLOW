import type { ReactNode } from 'react';

export function RefundContentEn(): ReactNode { return <>
  <h2>1. Policy</h2><p>This policy applies to bookings paid online to Glow. A manual payment made directly to a Master must be resolved with that Master because Glow did not collect it.</p>
  <h2>2. Refund calculation</h2><ul><li>Cancellation by the Master: 100% of the captured amount.</li><li>Cancellation by the client at or before the exact 24-hour deadline: 100%.</li><li>Cancellation after that deadline or no-show: captured amount minus the deposit fixed when the booking was created.</li></ul><p>For a deposit-only booking, a late cancellation or no-show therefore has no refund. A refund can never be negative or exceed the unreversed captured amount.</p>
  <h2>3. How to cancel</h2><p>Use the secure link sent by SMS. It shows the appointment, deadline, exact refund and retained amount before confirmation. Masters use the booking dashboard; administrators use the auditable refund interface. A plain status change cannot bypass this calculation.</p>
  <h2>4. Processing</h2><p>Glow sends full or partial reversals to Flitt and returns money to the original card. A successful reversal is recorded immediately; processing, timeout or failure remains visible for reconciliation and safe retry. Your bank controls when the credit appears.</p>
  <h2>5. Exceptions and disputes</h2><p>For an incorrect amount, duplicate charge or suspected fraud, contact support@glow.ge with the booking reference. An administrator may approve an exceptional refund, but cannot refund more than the remaining captured balance.</p>
</>; }

export function RefundContentKa(): ReactNode { return <>
  <h2>1. პოლიტიკა</h2><p>პოლიტიკა ვრცელდება Glow-სთვის ონლაინ გადახდილ ჯავშნებზე. მასტერთან პირდაპირ, ხელით გადახდილი თანხა უნდა მოგვარდეს მასტერთან, რადგან Glow-ს იგი არ მიუღია.</p>
  <h2>2. დაბრუნების გამოთვლა</h2><ul><li>მასტერი აუქმებს — მიღებული თანხის 100%.</li><li>კლიენტი აუქმებს ზუსტად 24-საათიან ზღვრამდე ან მასზე — 100%.</li><li>ამ ზღვრის შემდეგ გაუქმება ან გამოუცხადებლობა — მიღებული თანხა მინუს ჯავშნის შექმნისას დაფიქსირებული დეპოზიტი.</li></ul><p>შესაბამისად, მხოლოდ დეპოზიტის გადახდის შემთხვევაში გვიანი გაუქმებისას დასაბრუნებელი თანხა ნულია. თანხა ვერ იქნება უარყოფითი და ვერ გადააჭარბებს ჯერ დაუბრუნებელ მიღებულ თანხას.</p>
  <h2>3. როგორ გაუქმდეს</h2><p>გამოიყენეთ SMS-ით მიღებული დაცული ბმული. დადასტურებამდე ჩანს ვიზიტი, ვადა, ზუსტი დაბრუნება და დაკავება. მასტერი იყენებს ჯავშნების პანელს, ადმინისტრატორი — აუდიტირებად დაბრუნების ინტერფეისს. სტატუსის უბრალო ცვლილება პოლიტიკას ვერ აუვლის.</p>
  <h2>4. დამუშავება</h2><p>Glow Flitt-ში აგზავნის სრულ ან ნაწილობრივ რევერსალს და თანხა ბრუნდება საწყის ბარათზე. წარმატება მაშინვე აღირიცხება; დამუშავების, ტაიმაუტის ან შეცდომის სტატუსი რჩება შესამოწმებლად და უსაფრთხო განმეორებისთვის. ანგარიშზე ასახვის ვადას განსაზღვრავს ბანკი.</p>
  <h2>5. გამონაკლისი და დავა</h2><p>არასწორი თანხის, დუბლირებული ჩამოჭრის ან თაღლითობის ეჭვისას მოგვწერეთ support@glow.ge-ზე ჯავშნის ნომრით. ადმინისტრატორს შეუძლია გამონაკლისის დამტკიცება, მაგრამ დარჩენილ მიღებულ თანხაზე მეტს ვერ დააბრუნებს.</p>
</>; }

export function RefundContentRu(): ReactNode { return <>
  <h2>1. Применение</h2><p>Политика относится к онлайн-платежам, полученным Glow. Ручной платёж напрямую мастеру возвращает мастер.</p>
  <h2>2. Расчёт</h2><ul><li>Отмена мастером — 100% полученной суммы.</li><li>Отмена клиентом ровно за 24 часа или раньше — 100%.</li><li>Позже 24 часов или неявка — полученная сумма минус депозит, зафиксированный при создании брони.</li></ul><p>Для брони с оплатой только депозита поздний возврат равен нулю. Возврат не бывает отрицательным и не превышает ещё не возвращённую сумму.</p>
  <h2>3. Отмена</h2><p>Защищённая SMS-ссылка показывает бронь и точную сумму до подтверждения. Мастер отменяет через кабинет, администратор — через журналируемый интерфейс; простая смена статуса не обходит правила.</p>
  <h2>4. Обработка</h2><p>Glow отправляет полный или частичный реверс в Flitt на исходную карту. Неопределённые и неуспешные операции остаются в очереди сверки и безопасно повторяются. Срок зачисления определяет банк.</p>
  <h2>5. Споры</h2><p>При неверной сумме, двойном списании или подозрении на мошенничество напишите support@glow.ge и укажите бронь.</p>
</>; }
