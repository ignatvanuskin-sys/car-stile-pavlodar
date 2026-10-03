import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Droplets,
  Instagram,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  X,
} from "lucide-react";

/* ------------------------------------------------------------------ content */

/* ----------------------------------------------------------------- motion */

/**
 * Reveals `.reveal` elements once they scroll into view.
 *
 * One shared IntersectionObserver for the whole page rather than one per
 * element: a single callback is far cheaper than 40 of them, and `unobserve`
 * keeps it from firing again for settled elements.
 *
 * The revealed flag goes on `data-shown`, NOT on a class. React owns the
 * `className` attribute: it rewrites the whole string on re-render, so a class
 * added here imperatively would be wiped the moment the user opens a service
 * card and React re-renders it — the card would drop back to opacity 0 and
 * look empty. An attribute React never renders is left alone.
 */
function useRevealOnScroll() {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>(".reveal:not([data-shown])"));
    if (!nodes.length) return;

    // No observer support (or reduced motion): show everything, never hide it.
    if (typeof IntersectionObserver === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      nodes.forEach((n) => n.setAttribute("data-shown", ""));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-shown", "");
          io.unobserve(entry.target);
        }
      },
      // Start the motion a little before the element reaches the edge, and
      // require a sliver to be visible so tall cards still fire.
      { rootMargin: "0px 0px -8% 0px", threshold: 0.04 },
    );

    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);
}

/** Dot-matrix spinner: 16 dots on a fixed grid, only transform/opacity move. */
function DotMatrix({ label = "Отправляем" }: { label?: string }) {
  return (
    <span className="dm-wrap" role="status" aria-live="polite">
      <span className="dm" aria-hidden="true">
        {Array.from({ length: 16 }, (_, i) => (
          <span key={i} />
        ))}
      </span>
      <span className="dm-label">{label}</span>
    </span>
  );
}

/** Hand-drawn wobble, borrowed from the doodle-icons "boil" idea. */
function BoilIcon({ children }: { children: ReactNode }) {
  return <span className="doodle-boil">{children}</span>;
}

/* ------------------------------------------------------------- content */

const services = [
  {
    no: "01",
    title: "Полировка",
    note: "Кузов и фары",
    price: "от 50 000 ₸",
    media: "polish",
    detail:
      "Стандартная, лёгкая и финишная полировка кузова — различаются числом проходов и абразивностью. Вариант подбираем по состоянию лака.",
  },
  {
    no: "02",
    title: "Химчистка",
    note: "Салон с разбором и без",
    price: "по расчёту",
    media: "interior",
    detail:
      "Без разбора, с частичным или полным разбором. Поверхности, пол, потолок, пластик, кожа и текстиль, багажник и ниша запасного колеса.",
  },
  {
    no: "03",
    title: "Шумоизоляция",
    note: "Тише в салоне",
    price: "по расчёту",
    media: "sound",
    detail: "Вибро- и звукоизоляционные материалы на двери, пол и другие зоны. Набор зон подбираем под задачу.",
  },
  {
    no: "04",
    title: "Фары и защита",
    note: "Полировка фар, керамика, воск",
    price: "по расчёту",
    media: "fara",
    detail: "Полировка фар — отдельный пункт услуг. Плюс защитные покрытия кузова: керамика и воск. Состав уточняем при записи.",
  },
];

/* До/после: реальная пара кадров одного багажного отсека, снятая с одного ракурса,
   поэтому изображения совпадают пиксель в пиксель и ползунок не «съезжает». */
const cases = [
  {
    model: "Багажный отсек",
    service: "Химчистка: ковролин, обшивка, боковины",
    result: "Было — пятна и грязь, стало — чистый ворс",
    beforeMobile: "ba-before",
    beforeDesktop: "ba-before-wide",
    afterMobile: "ba-after",
    afterDesktop: "ba-after-wide",
  },
];

const portfolio = [
  {
    model: "Полировка кузова",
    service: "Работа с лаком",
    result: "Глянец и отражения",
    mobile: "polish-tall",
    desktop: "polish-portrait",
    variant: "lead",
  },
  {
    model: "Химчистка салона",
    service: "Текстиль и пластик",
    result: "Салон после уборки",
    mobile: "salon-card",
    desktop: "salon-portrait",
    variant: "wide",
  },
  {
    model: "Разбор салона",
    service: "Подготовка к химчистке",
    result: "Ковролин открыт для чистки",
    mobile: "sound-tall",
    desktop: "sound-portrait",
    variant: "tall",
  },
  {
    model: "Полировка фары",
    service: "Работа под маской",
    result: "Процесс в мастерской",
    mobile: "fara-card",
    desktop: "fara-portrait",
    variant: "std",
  },
];

const packages = [
  {
    name: "САЛОН",
    title: "Чистота в салоне",
    price: "по расчёту",
    items: ["Химчистка салона", "Сухой туман и озонирование", "Багажник и ниша запаски"],
    cta: "Записаться",
  },
  {
    name: "КУЗОВ",
    title: "Полировка и защита",
    price: "от 50 000 ₸",
    items: ["Полировка кузова", "Керамика или воск", "Полировка фар"],
    cta: "Записаться",
  },
  {
    name: "ТИШИНА",
    title: "Шумоизоляция",
    price: "по расчёту",
    items: ["Вибро- и звукоизоляция", "Двери и пол", "Подбор зон под задачу"],
    cta: "Рассчитать стоимость",
  },
];

/* Реальные отзывы карточки 2ГИС. Формулировки короткие и без обещаний —
   полный текст и количество оценок смотреть по ссылке в блоке отзывов. */
const reviews = [
  {
    name: "Отзыв в 2ГИС",
    car: "Полировка · апрель 2026",
    text: "«Устранил царапины быстро и четко.»",
  },
  {
    name: "Отзыв в 2ГИС",
    car: "Химчистка · октябрь 2025",
    text: "Клиент отмечает чистку и результат и советует мастерскую. Отзыв о химчистке салона.",
  },
  {
    name: "Отзыв в 2ГИС",
    car: "Удаление запаха · ноябрь 2024",
    text: "«Помогли избавиться от запаха сигарет, который до этого устранить не удавалось.»",
  },
];

const process = [
  { title: "Заявка", note: "Оставляете заявку на сайте, в WhatsApp или по телефону." },
  { title: "Расчёт", note: "Уточняем задачу и называем стоимость до начала работ." },
  { title: "Приём", note: "Принимаем автомобиль в работу в согласованное время." },
  { title: "Работы", note: "Полировка, химчистка, шумоизоляция или защитные составы." },
  { title: "Контроль", note: "Проверяем результат при разном свете и убираем недочёты." },
  { title: "Выдача", note: "Показываем, что сделали, и подсказываем, как ухаживать дальше." },
];

/* Не список брендов, а перечень работ: подтверждённых партнёрств с марками нет,
   а сами направления подтверждены карточкой 2ГИС и публикациями мастерской. */
const brands = [
  "Полировка кузова",
  "Химчистка салона",
  "Химчистка с разбором",
  "Шумоизоляция",
  "Полировка фар",
  "Керамика и воск",
  "Сухой туман",
  "Озонирование салона",
  "Мойка двигателя",
  "Детейлинг-мойка",
  "Консервация шин",
  "Антикоррозийное покрытие",
];

/* ------------------------------------------------------- контакты мастерской */

const PHONE_DISPLAY = "+7 771 100 02 21";
const PHONE_HREF = "tel:+77711000221";
const CITY = "Павлодар";
const ADDRESS = "ул. Желтоксан, 85";
const HOURS = "Ежедневно 08:00–20:00, по записи";
const TWOGIS_URL = "https://2gis.kz/pavlodar/firm/70000001094135942";

/* Точка входа: координаты из геоточки карточки 2ГИС (52.28512, 76.950167). */
const MAP_POINT = { lat: 52.28512, lon: 76.950167 };

/* Ключ 2ГИС.
   У 2ГИС нет анонимного встраивания: виджет выдаётся организации в личном
   кабинете (widgets.2gis.com), поэтому iframe без ключа бесполезен. Пока ключа
   нет, блок показывает карту Яндекса с той же точкой и рабочую ссылку на
   карточку в 2ГИС — блок никогда не выглядит сломанным. */
const TWOGIS_KEY = "";

/** Ссылка «открыть карточку» — только проверенный адрес компании в 2ГИС. */
const TWOGIS_FALLBACK_URL = TWOGIS_URL;
const CONTACT_LINKS = {
  phone: PHONE_HREF,
  whatsapp: "https://wa.me/77711000221",
  telegram: "https://t.me/+77711000221",
  instagram: "https://www.instagram.com/car_stile_pvl",
  address: TWOGIS_URL,
};

/* Услуги в порядке, в котором владелец машины обычно их перечисляет.
   `price` — подтверждённая базовая ставка в тенге; 0 = «по расчёту»,
   тогда сумма не выводится числом, а подписывается честно. */
const serviceOptions = [
  { name: "Полировка кузова", price: 50000 },
  { name: "Химчистка салона", price: 0 },
  { name: "Сухой туман и озонирование", price: 4000 },
  { name: "Шумоизоляция", price: 0 },
  { name: "Полировка фар", price: 0 },
  { name: "Керамика и воск", price: 0 },
  { name: "Детейлинг-мойка", price: 0 },
  { name: "Мойка двигателя (диэлектрическая)", price: 15000 },
  { name: "Антикоррозийное покрытие днища", price: 0 },
] as const;

const packOptions = packages.map((p) => ({ name: p.name, title: p.title, price: Number(p.price.replace(/\D/g, "").replace(/^0+/, "")) || 0 }));

const serviceNames: string[] = serviceOptions.map((s) => s.name);
const yearOptions = Array.from({ length: 30 }, (_, i) => String(new Date().getFullYear() - i));

/** Renders tenge with thin spaces: 25 000 ₸ */
const formatTenge = (value: number) => `${value.toLocaleString("ru-RU").replace(/ /g, " ")} ₸`;

/* --------------------------------------------------------------- responsive */

const srcSetFor = (base: string, widths: number[]) => widths.map((w) => `/img/${base}-${w}.webp ${w}w`).join(", ");

type Art = { base: string; widths: number[]; sizes: string };

function Picture({
  desktop,
  mobile,
  alt,
  className,
  priority = false,
}: {
  desktop?: Art;
  mobile: Art;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <picture className={className}>
      {desktop ? <source media="(min-width: 900px)" type="image/webp" srcSet={srcSetFor(desktop.base, desktop.widths)} sizes={desktop.sizes} /> : null}
      <source type="image/webp" srcSet={srcSetFor(mobile.base, mobile.widths)} sizes={mobile.sizes} />
      <img
        src={`/img/${mobile.base}-${mobile.widths[mobile.widths.length - 1]}.webp`}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
      />
    </picture>
  );
}

const art = (base: string, widths: number[], sizes: string): Art => ({ base, widths, sizes });

/* --------------------------------------------------------------- components */

function SectionHeading({ kicker, title, copy, id }: { kicker: string; title: ReactNode; copy?: string; id?: string }) {
  return (
    <div className="section-heading">
      <span className="eyebrow">{kicker}</span>
      <h2 id={id}>{title}</h2>
      {copy ? <p>{copy}</p> : null}
    </div>
  );
}

function Stars({ count = 5 }: { count?: number }) {
  return (
    <div className="review-stars" aria-label={`Оценка ${count} из 5`}>
      {Array.from({ length: count }, (_, i) => (
        <Star key={i} size={15} fill="currentColor" strokeWidth={0} aria-hidden="true" />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------ before / after */

function BeforeAfter() {
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState(55);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const dragging = useRef(false);
  const current = cases[index];

  const setFromClientX = useCallback((clientX: number) => {
    const el = stageRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0) return;
    const next = ((clientX - rect.left) / rect.width) * 100;
    setValue(Math.min(96, Math.max(4, Math.round(next))));
  }, []);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (!dragging.current) return;
      setFromClientX(e.clientX);
    };
    const up = () => {
      dragging.current = false;
    };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [setFromClientX]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") setValue((v) => Math.max(4, v - 4));
    if (e.key === "ArrowRight") setValue((v) => Math.min(96, v + 4));
    if (e.key === "Home") setValue(4);
    if (e.key === "End") setValue(96);
  };

  const stageStyle = { "--ba-left": `${value}%`, "--ba-right": `${100 - value}%` } as React.CSSProperties;

  return (
    <div className="ba-wrap">
      <div
        className="ba-stage"
        ref={stageRef}
        style={stageStyle}
        onPointerDown={(e) => {
          dragging.current = true;
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
          setFromClientX(e.clientX);
        }}
      >
        <div className="ba-layer ba-after">
          <Picture
            mobile={art(current.afterMobile, [480, 800], "(max-width: 899px) 100vw")}
            desktop={art(current.afterDesktop, [1280, 1920], "1050px")}
            alt={`${current.model} — после`}
          />
        </div>
        <div className="ba-layer ba-before">
          <Picture
            mobile={art(current.beforeMobile, [480, 800], "(max-width: 899px) 100vw")}
            desktop={art(current.beforeDesktop, [1280, 1920], "1050px")}
            alt={`${current.model} — до`}
          />
        </div>
        <div className="ba-divider" aria-hidden="true" />
        <div className="ba-handle" aria-hidden="true">
          <ChevronLeft size={18} />
          <ChevronRight size={18} />
        </div>
        <span className="ba-hint">Потяните</span>
        <div
          className="ba-control"
          role="slider"
          tabIndex={0}
          aria-label={`Сравнение до и после: ${current.model}`}
          aria-valuemin={4}
          aria-valuemax={96}
          aria-valuenow={value}
          onKeyDown={onKeyDown}
          style={{ position: "absolute", inset: 0, zIndex: 4, opacity: 0 }}
        />
      </div>

      <div className="ba-caption">
        <div>
          <span className="eyebrow">До / после</span>
          <p>
            {current.model} — {current.service}
            <br />
            <strong>{current.result}</strong>
          </p>
        </div>
      </div>

      {/* Переключатель нужен только когда сравнений несколько; для одной пары
          он был бы кнопкой в никуда. */}
      {cases.length > 1 ? (
        <div className="case-tabs" role="group" aria-label="Выбор примера для сравнения">
          {cases.map((item, i) => (
            <button
              key={item.model}
              type="button"
              className="case-tab"
              aria-pressed={i === index}
              onClick={() => setIndex(i)}
            >
              {item.model}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* --------------------------------------------------------------- booking UX */

type BookingForm = {
  services: string[];
  pack: string;
  make: string;
  model: string;
  year: string;
  name: string;
  phone: string;
  channel: "phone" | "whatsapp" | "telegram";
  date: string;
  time: string;
  comment: string;
};

const emptyForm: BookingForm = {
  services: [],
  pack: "",
  make: "",
  model: "",
  year: "",
  name: "",
  phone: "",
  channel: "phone",
  date: "",
  time: "",
  comment: "",
};

/** Plus glyph for "add this service"; a tick replaces it once selected. */
function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Live running total. A package replaces the individual lines; a custom set adds
 * them up. Always labelled as a preliminary figure, since the studio confirms
 * the real cost after inspecting the car.
 */
function Estimate({ pack = "", services }: { pack?: string; services: string[] }) {
  const packItem = packOptions.find((p) => p.name === pack);
  const lines = services
    .map((name) => serviceOptions.find((s) => s.name === name))
    .filter((s): s is (typeof serviceOptions)[number] => Boolean(s));
  const known = lines.filter((s) => s.price > 0);
  const total = packItem ? packItem.price : known.reduce((sum, s) => sum + s.price, 0);
  const nothing = !packItem && lines.length === 0;
  /* Цены подтверждены только на часть услуг. Если в наборе есть позиция
     «по расчёту», итог не выдумываем — вместо суммы идёт честная подпись. */
  const hasUnknown = !nothing && (packItem ? packItem.price === 0 : known.length !== lines.length);

  return (
    <div className={`estimate ${nothing ? "estimate--empty" : ""}`} aria-live="polite">
      <div className="estimate-head">
        <span>{packItem ? `Пакет ${packItem.name}` : "Ваш набор"}</span>
        <strong className="stat-value">{nothing ? "—" : hasUnknown ? "по расчёту" : `от ${formatTenge(total)}`}</strong>
      </div>
      {lines.length > 0 ? (
        <ul className="estimate-lines">
          {lines.map((line) => (
            <li key={line.name}>
              <span>{line.name}</span>
              <span>{line.price > 0 ? formatTenge(line.price) : "по расчёту"}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="estimate-note">
        {hasUnknown
          ? "На часть позиций цена зависит от состояния автомобиля — уточним при записи."
          : "Точную стоимость подтвердит мастер после осмотра автомобиля."}
      </p>
    </div>
  );
}

/* Opening the sheet from a service card passes that card's short title
   ("Мойка", "Защита"), while the form uses the fuller option names. */
const serviceTitleToOption: Record<string, string> = {
  Полировка: "Полировка кузова",
  Химчистка: "Химчистка салона",
  Шумоизоляция: "Шумоизоляция",
  "Фары и защита": "Полировка фар",
};

/**
 * Contact map.
 *
 * Provider is chosen at build time by whether a 2GIS key is present:
 *
 *  - with a key   -> 2GIS widget iframe (the 2GIS map people actually use);
 *  - without one  -> the Yandex widget, which works anonymously.
 *
 * 2GIS has no anonymous embed: `widget.2gis.ru` renders its banner constructor
 * for an unknown key, so shipping it keyless would show a builder to visitors.
 * A key comes from the 2GIS personal account (widgets.2gis.com). Until one is
 * pasted in, the site stays on Yandex instead of showing something broken.
 *
 * Either way the iframe is third-party and heavy, so it is only inserted once
 * the block is near the viewport. The link underneath is a real anchor, so the
 * address stays reachable if the iframe is blocked or fails.
 */
function ContactMap() {
  const holder = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  const use2GIS = TWOGIS_KEY.trim().length > 0;

  useEffect(() => {
    const el = holder.current;
    if (!el || visible) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        setVisible(true);
        io.disconnect();
      },
      // Start fetching a little before the block is fully on screen.
      { rootMargin: "300px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);

  const point = `${MAP_POINT.lon}%2C${MAP_POINT.lat}`;
  const src = use2GIS
    ? `https://widget.2gis.ru/2.0/frame?key=${encodeURIComponent(TWOGIS_KEY.trim())}&point=${MAP_POINT.lon}%2C${MAP_POINT.lat}&z=16`
    : `https://yandex.ru/map-widget/v1/?ll=${point}&z=16&pt=${point}%2Cpm2rdm`;

  const openUrl = CONTACT_LINKS.address;
  const openLabel = "Открыть в 2ГИС";

  return (
    <div className="contact-map reveal" ref={holder} data-shown="">
      {visible ? (
        <iframe
          className="contact-map__frame"
          src={src}
          title={`Карта: ${CITY}, ${ADDRESS}`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      ) : (
        <div className="contact-map__placeholder" aria-hidden="true">
          <MapPin size={26} />
          <span>
            {CITY}, {ADDRESS}
          </span>
        </div>
      )}
      <a className="contact-map__link" href={openUrl} target="_blank" rel="noreferrer">
        <MapPin size={16} aria-hidden="true" />
        {openLabel}
        <ArrowUpRight size={14} aria-hidden="true" />
      </a>
    </div>
  );
}

const STEPS = ["Услуга", "Автомобиль", "Контакты", "Дата", "Проверка"];

function BookingSheet({ open, onClose, initialService }: { open: boolean; onClose: () => void; initialService?: string }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<BookingForm>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [copied, setCopied] = useState(false);
  const dragStart = useRef<number | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setSent(false);
    setSending(false);
    setErrors({});
    setDragY(0);
    // Pre-select the service the user clicked, so the form never opens empty
    // with the choice they already made somewhere else on the page.
    const preselected = initialService ? serviceTitleToOption[initialService] : undefined;
    setForm({
      ...emptyForm,
      services: preselected && serviceNames.includes(preselected) ? [preselected] : [],
    });
  }, [open, initialService]);

  /* keep the sheet inside the visible viewport when the keyboard opens */
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const vv = window.visualViewport;
    const apply = () => {
      if (!vv) return;
      root.style.setProperty("--vvh", `${Math.round(vv.height)}px`);
      root.style.setProperty("--vv-top", `${Math.round(vv.offsetTop)}px`);
    };
    apply();
    vv?.addEventListener("resize", apply);
    vv?.addEventListener("scroll", apply);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      vv?.removeEventListener("resize", apply);
      vv?.removeEventListener("scroll", apply);
      root.style.removeProperty("--vvh");
      root.style.removeProperty("--vv-top");
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const t = window.setTimeout(() => sheetRef.current?.focus({ preventScroll: true }), 60);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
    };
  }, [open, onClose]);

  if (!open) return null;

  const set = <K extends keyof BookingForm>(key: K, value: BookingForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => (prev[key as string] ? { ...prev, [key as string]: "" } : prev));
  };

  /* validates the fields of the step the user is leaving */
  const validate = (target: number) => {
    const next: Record<string, string> = {};
    if (target === 0 && !form.pack && form.services.length === 0) next.services = "Выберите пакет или хотя бы одну услугу";
    if (target >= 1) {
      if (!form.make.trim()) next.make = "Укажите марку";
      if (!form.model.trim()) next.model = "Укажите модель";
    }
    if (target >= 2) {
      if (!form.name.trim()) next.name = "Как к вам обращаться?";
      const digits = form.phone.replace(/\D/g, "");
      if (digits.length < 10) next.phone = "Введите номер телефона полностью";
    }
    if (target >= 3) {
      if (!form.date) next.date = "Выберите дату";
      if (!form.time) next.time = "Выберите время";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  /* Заявка уходит в WhatsApp мастерской. Бэкенда у статического сайта нет,
     поэтому единственный честный «отправитель» — сам клиент: мы собираем
     готовый текст и открываем чат, где остаётся нажать «Отправить». */
  const buildMessage = () => {
    const chosen = form.pack ? `пакет ${form.pack}` : form.services.length ? form.services.join(", ") : "—";
    const channel = form.channel === "phone" ? "звонок" : form.channel === "whatsapp" ? "WhatsApp" : "Telegram";
    const lines = [
      "Заявка с сайта Car Stile",
      `Услуги: ${chosen}`,
      `Автомобиль: ${[form.make, form.model, form.year].filter(Boolean).join(" ") || "—"}`,
      `Дата и время: ${[form.date, form.time].filter(Boolean).join(", ") || "—"}`,
      `Имя: ${form.name || "—"}`,
      `Телефон: ${form.phone || "—"}`,
      `Удобная связь: ${channel}`,
    ];
    if (form.comment.trim()) lines.push(`Комментарий: ${form.comment.trim()}`);
    return lines.join("\n");
  };

  const waHref = () => `${CONTACT_LINKS.whatsapp}?text=${encodeURIComponent(buildMessage())}`;

  const copyRequest = () => {
    const text = buildMessage();
    const done = () => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => window.prompt("Скопируйте заявку:", text));
      return;
    }
    window.prompt("Скопируйте заявку:", text);
  };

  const goNext = () => {
    if (!validate(step)) return;
    if (step === STEPS.length - 1) {
      setSending(true);
      const href = waHref();
      window.setTimeout(() => {
        setSending(false);
        setSent(true);
        window.open(href, "_blank", "noopener,noreferrer");
      }, 600);
      return;
    }
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
    bodyRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => {
    setErrors({});
    if (sent) {
      setSent(false);
      return;
    }
    setStep((s) => Math.max(0, s - 1));
    bodyRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onFieldFocus = (e: React.FocusEvent<HTMLElement>) => {
    const el = e.target;
    window.setTimeout(() => el.scrollIntoView({ block: "nearest", behavior: "smooth" }), 220);
  };

  const stepTitles = ["Что сделаем с автомобилем?", "Расскажите об автомобиле", "Куда отправить подтверждение?", "Когда удобно приехать?", "Проверьте заявку"];

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="booking-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-title"
        tabIndex={-1}
        ref={sheetRef}
        style={dragY ? { transform: `translateY(${dragY}px)`, transition: "none" } : { transition: "transform .22s ease" }}
      >
        <div
          className="sheet-grab"
          aria-hidden="true"
          onPointerDown={(e) => {
            dragStart.current = e.clientY;
            (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (dragStart.current == null) return;
            setDragY(Math.max(0, e.clientY - dragStart.current));
          }}
          onPointerUp={() => {
            if (dragY > 110) {
              dragStart.current = null;
              setDragY(0);
              onClose();
              return;
            }
            dragStart.current = null;
            setDragY(0);
          }}
        >
          <i />
        </div>

        <div className="modal-head">
          <span className="modal-head-label">{sent ? "Заявка принята" : "Онлайн-запись"}</span>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Закрыть окно записи">
            <X size={18} />
          </button>
        </div>

        {!sent ? (
          <>
            <div className="modal-steps">
              <div className="modal-top">
                <span className="eyebrow">CAR STILE / ЗАПИСЬ</span>
                <span className="step-count">
                  {String(step + 1).padStart(2, "0")} / {String(STEPS.length).padStart(2, "0")}
                </span>
              </div>
              <h2 id="booking-title">{stepTitles[step]}</h2>
              <div className="progress" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={step + 1}>
                <span style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
              </div>
            </div>

            <div className="modal-body" ref={bodyRef}>
              {step === 0 ? (
                <>
                  <p className="form-lead">Выберите пакет целиком или соберите свой набор — можно взять несколько услуг сразу.</p>

                  <div className="pack-picker" role="group" aria-label="Готовые пакеты">
                    <button
                      type="button"
                      className={`pack-option ${form.pack === "" ? "selected" : ""}`}
                      aria-pressed={form.pack === ""}
                      onClick={() => set("pack", "")}
                    >
                      <span className="pack-option-name">Без пакета</span>
                      <span className="pack-option-note">Соберу услуги сам</span>
                    </button>
                    {packOptions.map((item) => (
                      <button
                        key={item.name}
                        type="button"
                        className={`pack-option ${form.pack === item.name ? "selected" : ""}`}
                        aria-pressed={form.pack === item.name}
                        onClick={() => set("pack", form.pack === item.name ? "" : item.name)}
                      >
                        <span className="pack-option-name">{item.name}</span>
                        <span className="pack-option-title">{item.title}</span>
                        <span className="pack-option-price">{item.price > 0 ? formatTenge(item.price) : "по расчёту"}</span>
                      </button>
                    ))}
                  </div>

                  {/* Picking a package replaces the individual list, the way a
                      car owner thinks about it: either the bundle or the parts. */}
                  {form.pack === "" ? (
                    <>
                      <div className="choice-grid">
                        {serviceOptions.map((item) => {
                          const active = form.services.includes(item.name);
                          return (
                            <button
                              key={item.name}
                              type="button"
                              className={`choice ${active ? "selected" : ""}`}
                              aria-pressed={active}
                              onClick={() =>
                                set(
                                  "services",
                                  active ? form.services.filter((n) => n !== item.name) : [...form.services, item.name],
                                )
                              }
                            >
                              <span>{item.name}</span>
                              <span className="choice-price">{item.price > 0 ? formatTenge(item.price) : "по расчёту"}</span>
                              {active ? <Check size={16} /> : <PlusIcon />}
                            </button>
                          );
                        })}
                      </div>
                      {errors.services ? <span className="field-error">{errors.services}</span> : null}
                      <Estimate services={form.services} />
                    </>
                  ) : (
                    <Estimate pack={form.pack} services={[]} />
                  )}
                </>
              ) : null}

              {step === 1 ? (
                <div className="input-grid input-grid--pair">
                  <label className={`field ${errors.make ? "field--invalid" : ""}`}>
                    <span>Марка</span>
                    <input
                      value={form.make}
                      onChange={(e) => set("make", e.target.value)}
                      onFocus={onFieldFocus}
                      placeholder="Toyota"
                      autoComplete="off"
                      enterKeyHint="next"
                    />
                    {errors.make ? <span className="field-error">{errors.make}</span> : null}
                  </label>
                  <label className={`field ${errors.model ? "field--invalid" : ""}`}>
                    <span>Модель</span>
                    <input
                      value={form.model}
                      onChange={(e) => set("model", e.target.value)}
                      onFocus={onFieldFocus}
                      placeholder="Camry"
                      autoComplete="off"
                      enterKeyHint="next"
                    />
                    {errors.model ? <span className="field-error">{errors.model}</span> : null}
                  </label>
                  <label className="field">
                    <span>Год выпуска</span>
                    <select value={form.year} onChange={(e) => set("year", e.target.value)} onFocus={onFieldFocus}>
                      <option value="">Не важно</option>
                      {yearOptions.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              ) : null}

              {step === 2 ? (
                <>
                  <div className="input-grid input-grid--pair">
                    <label className={`field ${errors.name ? "field--invalid" : ""}`}>
                      <span>Имя</span>
                      <input
                        value={form.name}
                        onChange={(e) => set("name", e.target.value)}
                        onFocus={onFieldFocus}
                        placeholder="Ваше имя"
                        autoComplete="name"
                        enterKeyHint="next"
                      />
                      {errors.name ? <span className="field-error">{errors.name}</span> : null}
                    </label>
                    <label className={`field ${errors.phone ? "field--invalid" : ""}`}>
                      <span>Телефон</span>
                      <input
                        value={form.phone}
                        onChange={(e) => set("phone", e.target.value)}
                        onFocus={onFieldFocus}
                        placeholder="+7 (___) ___-__-__"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        enterKeyHint="done"
                      />
                      {errors.phone ? <span className="field-error">{errors.phone}</span> : null}
                    </label>
                  </div>
                  <div className="contact-row" role="group" aria-label="Способ связи">
                    {(["phone", "whatsapp", "telegram"] as const).map((channel) => (
                      <button
                        key={channel}
                        type="button"
                        className={`contact-pill ${form.channel === channel ? "active" : ""}`}
                        aria-pressed={form.channel === channel}
                        onClick={() => set("channel", channel)}
                      >
                        {channel === "phone" ? "Звонок" : channel === "whatsapp" ? "WhatsApp" : "Telegram"}
                      </button>
                    ))}
                  </div>
                </>
              ) : null}

              {step === 3 ? (
                <>
                  <div className="input-grid input-grid--pair">
                    <label className={`field ${errors.date ? "field--invalid" : ""}`}>
                      <span>Дата</span>
                      <input
                        value={form.date}
                        min={today}
                        onChange={(e) => set("date", e.target.value)}
                        onFocus={onFieldFocus}
                        type="date"
                        enterKeyHint="next"
                      />
                      {errors.date ? <span className="field-error">{errors.date}</span> : null}
                    </label>
                    <label className={`field ${errors.time ? "field--invalid" : ""}`}>
                      <span>Время</span>
                      <input
                        value={form.time}
                        onChange={(e) => set("time", e.target.value)}
                        onFocus={onFieldFocus}
                        type="time"
                        step={1800}
                        enterKeyHint="done"
                      />
                      {errors.time ? <span className="field-error">{errors.time}</span> : null}
                    </label>
                  </div>
                  <label className="field" style={{ marginTop: 14 }}>
                    <span>Комментарий (необязательно)</span>
                    <textarea
                      value={form.comment}
                      onChange={(e) => set("comment", e.target.value)}
                      onFocus={onFieldFocus}
                      rows={3}
                      placeholder="Например: есть царапина на заднем бампере"
                    />
                  </label>
                  <div className="booking-note">
                    <CalendarDays size={16} />
                    <span>Администратор подтвердит время в течение 15 минут в рабочее часы.</span>
                  </div>
                </>
              ) : null}

              {step === 4 ? (
                <>
                  <div className="recap">
                    <div className="recap-row">
                      <span>Пакет</span>
                      <b>{form.pack ? `${form.pack} — ${packOptions.find((p) => p.name === form.pack)?.title ?? ""}` : "Без пакета"}</b>
                    </div>
                    <div className="recap-row">
                      <span>Услуги{form.services.length > 1 ? ` (${form.services.length})` : ""}</span>
                      <b>{form.services.length ? form.services.join(", ") : "—"}</b>
                    </div>
                    <div className="recap-row">
                      <span>Автомобиль</span>
                      <b>{[form.make, form.model].filter(Boolean).join(" ") || "—"}</b>
                    </div>
                    <div className="recap-row">
                      <span>Контакты</span>
                      <b>
                        {form.name}
                        {form.name && form.phone ? ", " : ""}
                        {form.phone}
                      </b>
                    </div>
                    <div className="recap-row">
                      <span>Дата и время</span>
                      <b>
                        {form.date || "—"}
                        {form.time ? `, ${form.time}` : ""}
                      </b>
                    </div>
                    <div className="recap-row">
                      <span>Способ связи</span>
                      <b>{form.channel === "phone" ? "Звонок" : form.channel === "whatsapp" ? "WhatsApp" : "Telegram"}</b>
                    </div>
                    {form.comment ? (
                      <div className="recap-row">
                        <span>Комментарий</span>
                        <b>{form.comment}</b>
                      </div>
                    ) : null}
                  </div>
                  <div className="booking-note">
                    <ShieldCheck size={16} />
                    <span>Мы не передаём контакты третьим лицам и не звоним без запроса.</span>
                  </div>
                </>
              ) : null}
            </div>

            <div className={`modal-foot ${step > 0 ? "modal-foot--split" : ""}`}>
              {step > 0 ? (
                <button type="button" className="button button--outline" onClick={goBack} aria-label="Вернуться на предыдущий шаг">
                  <ChevronLeft size={16} />
                  Назад
                </button>
              ) : null}
              <button type="button" className="button button--accent" onClick={goNext} disabled={sending}>
                {sending ? (
                  <>
                    <DotMatrix label="Отправляем" />
                  </>
                ) : (
                  <>
                    {step === STEPS.length - 1 ? "Отправить заявку" : "Продолжить"}
                    {step === STEPS.length - 1 ? <ArrowUpRight size={16} /> : <ChevronRight size={16} />}
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          <div className="success-state">
            <div className="success-mark">
              <Check size={28} />
            </div>
            <span className="eyebrow">Заявка готова</span>
            <h2>
              Осталось
              <br />
              <em>её отправить.</em>
            </h2>
            <p>
              Мы открыли WhatsApp с уже заполненной заявкой — нажмите «Отправить» в чате. Если окно не открылось, скопируйте текст или
              позвоните: {PHONE_DISPLAY}.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 18 }}>
              <a className="button button--accent" href={waHref()} target="_blank" rel="noreferrer">
                Открыть WhatsApp <ArrowUpRight size={16} aria-hidden="true" />
              </a>
              <button type="button" className="button button--outline" onClick={copyRequest}>
                {copied ? "Скопировано" : "Скопировать текст"}
              </button>
              <button type="button" className="button button--outline" onClick={onClose}>
                Закрыть
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------- page */

export default function Home() {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingService, setBookingService] = useState<string>("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [openService, setOpenService] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useRevealOnScroll();

  const openBooking = useCallback((service = "") => {
    setBookingService(service);
    setMenuOpen(false);
    setBookingOpen(true);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 900) setMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="site-shell">
      <header className={`site-header ${scrolled ? "site-header--scrolled" : ""}`}>
        <a href="#top" className="brand" aria-label="Car Stile — в начало страницы" onClick={(e) => { e.preventDefault(); scrollTo("top"); }}>
          <span>CAR</span>
          <small>STILE</small>
        </a>

        <nav className={menuOpen ? "nav-links nav-links--open" : "nav-links"} aria-label="Основная навигация">
          {[
            ["services", "Услуги"],
            ["work", "Работы"],
            ["reviews", "Отзывы"],
            ["process", "Процесс"],
            ["contacts", "Контакты"],
          ].map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              onClick={(e) => {
                e.preventDefault();
                scrollTo(id);
              }}
            >
              {label}
            </a>
          ))}
          <div className="nav-contact">
            <a href={PHONE_HREF}>
              <Phone size={14} aria-hidden="true" /> {PHONE_DISPLAY}
            </a>
            <a href={CONTACT_LINKS.address} target="_blank" rel="noreferrer">
              <MapPin size={14} aria-hidden="true" /> {CITY}, {ADDRESS}
            </a>
          </div>
        </nav>

        <div className="header-actions">
          <span className="header-phone">{PHONE_DISPLAY}</span>
          <button type="button" className="header-cta" onClick={() => openBooking()}>
            Записаться <ArrowUpRight size={14} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="menu-toggle"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {menuOpen ? <div className="nav-scrim nav-scrim--open" onClick={() => setMenuOpen(false)} role="presentation" /> : null}

      <main id="top">
        <section className="hero">
          <Picture
            className="hero-media"
            priority
            mobile={art("hero-mobile", [480, 800, 1200], "100vw")}
            desktop={art("hero-wide", [1280, 1920], "100vw")}
            alt="Глянцевый кузов после полировки — Car Stile, Павлодар"
          />
          <div className="hero-overlay" />
          <div className="hero-content">
            <div className="hero-kicker">
              <span>Полировка · Химчистка · Шумоизоляция</span>
              <span>
                {CITY} · {ADDRESS}
              </span>
            </div>
            <h1>
              Глянец, чистота <em>и тишина.</em>
            </h1>
            <div className="hero-bottom">
              <p>Полировка кузова и фар, химчистка салона, удаление запахов, шумоизоляция и защитные покрытия. Приём по записи.</p>
              <div className="hero-actions">
                <button type="button" className="button button--accent" onClick={() => openBooking()}>
                  Записаться <ArrowUpRight size={16} aria-hidden="true" />
                </button>
                <button type="button" className="button button--outline button--ghost-light" onClick={() => scrollTo("services")}>
                  Услуги и цены
                </button>
              </div>
            </div>
            <div className="hero-meta">
              <span>
                <strong>5.0</strong> рейтинг в 2ГИС
              </span>
              <span>
                <strong>11</strong> оценок клиентов
              </span>
              <span>
                <strong>08:00–20:00</strong> ежедневно
              </span>
            </div>
          </div>
        </section>

        <section className="trust-bar" aria-label="Ключевые преимущества">
          <span className="eyebrow">Что важно</span>
          {/* Duplicated once so the marquee can loop seamlessly at -50%.
              The copy is hidden from assistive tech to avoid reading it twice. */}
          <div className="trust-marquee" aria-hidden="true">
            {[0, 1].map((copy) => (
              <div className="trust-marquee-run" key={copy}>
                <span className="trust-item">Стоимость до начала работ</span>
                <span className="trust-item">Приём по записи</span>
                <span className="trust-item">Химчистка с разбором и без</span>
                <span className="trust-item">Сухой туман и озонирование</span>
                <span className="trust-item">Полировка и керамика</span>
                <span className="trust-item">Запись онлайн за минуту</span>
              </div>
            ))}
          </div>
          <div className="trust-static">
            <span className="trust-item">Стоимость до начала работ</span>
            <span className="trust-item">Приём по записи</span>
            <span className="trust-item">Химчистка с разбором и без</span>
            <span className="trust-item">Сухой туман и озонирование</span>
          </div>
        </section>

        <section className="section services-section" id="services">
          <div className="container">
            <SectionHeading
              kicker="01 / Услуги"
              title={
                <>
                  Уход <em>для вашей машины.</em>
                </>
              }
              copy="Нажмите на услугу, чтобы увидеть детали и записаться. Цены «от» указаны по подтверждённым позициям, остальное считаем при записи."
            />
            <div className="services-grid">
              {services.map((service, i) => {
                const isOpen = openService === service.title;
                return (
                  <article
                    className={`service-card reveal ${isOpen ? "service-card--open" : ""}`}
                    style={{ "--d": `${Math.min(i, 4) * 70}ms` } as React.CSSProperties}
                    key={service.title}
                  >
                    <button
                      type="button"
                      className="service-card__button"
                      aria-expanded={isOpen}
                      onClick={() => setOpenService(isOpen ? null : service.title)}
                    >
                      <div className="service-image">
                        <Picture
                          mobile={art(`${service.media}-card`, [480, 800], "(max-width: 899px) calc(100vw - 40px)")}
                          desktop={art(`${service.media}-portrait`, [420, 760], "25vw")}
                          alt={`${service.title} — ${service.note}`}
                        />
                        <span className="service-no">{service.no}</span>
                        <span className="service-arrow" aria-hidden="true">
                          <ArrowUpRight size={18} />
                        </span>
                      </div>
                      <div className="service-meta">
                        <div>
                          <h3>{service.title}</h3>
                          <p>{service.note}</p>
                        </div>
                        <strong>{service.price}</strong>
                      </div>
                    </button>
                    <div className="service-detail">
                      <div className="service-detail-inner">
                        <p>{service.detail}</p>
                        <button type="button" className="text-link" onClick={() => openBooking(service.title)}>
                          Записаться на «{service.title}» <ArrowUpRight size={14} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="split-feature">
          <div className="split-image">
            <Picture
              mobile={art("salon-card", [480, 800], "100vw")}
              desktop={art("salon-tall", [480, 800], "50vw")}
              alt="Салон после химчистки — Car Stile, Павлодар"
            />
          </div>
          <div className="split-copy">
            <span className="eyebrow">02 / Наш подход</span>
            <h2>
              Уход <em>по делу.</em>
            </h2>
            <p>
              Мастерская автоухода в Павлодаре на Желтоксан, 85. Принимаем по предварительной записи: смотрим состояние кузова и салона, объясняем, что
              действительно нужно, и называем стоимость до начала работ.
            </p>
            <div className="feature-list">
              <div>
                <BoilIcon>
                  <Sparkles size={18} aria-hidden="true" />
                </BoilIcon>
                <span>Стоимость называем до начала работ</span>
              </div>
              <div>
                <BoilIcon>
                  <ShieldCheck size={18} aria-hidden="true" />
                </BoilIcon>
                <span>Подбираем работы под состояние автомобиля</span>
              </div>
              <div>
                <BoilIcon>
                  <Droplets size={18} aria-hidden="true" />
                </BoilIcon>
                <span>Химчистка с разбором и без разбора</span>
              </div>
            </div>
            <button type="button" className="text-link" onClick={() => scrollTo("process")}>
              Как мы работаем <ArrowUpRight size={15} aria-hidden="true" />
            </button>
          </div>
        </section>

        <section className="section before-section">
          <div className="container">
            <SectionHeading
              kicker="03 / Результат"
              title={
                <>
                  Разница <em>видна сразу.</em>
                </>
              }
              copy="Одна пара кадров из мастерской, снятая с одного ракурса. Потяните ползунок по фото."
            />
            <BeforeAfter />
          </div>
        </section>

        <section className="section work-section" id="work">
          <div className="container">
            <div className="work-head">
              <SectionHeading
                kicker="04 / Наши работы"
                title={
                  <>
                    Кадры <em>из мастерской.</em>
                  </>
                }
              />
              <button type="button" className="text-link" onClick={() => openBooking()}>
                Записаться <ArrowUpRight size={15} aria-hidden="true" />
              </button>
            </div>
            <div className="work-grid">
              {portfolio.map((item, i) => (
                <article
                  className={`work-card work-card--${i} work-card--${item.variant} reveal`}
                  style={{ "--d": `${Math.min(i, 3) * 80}ms` } as React.CSSProperties}
                  key={item.model}
                >
                  <Picture
                    mobile={art(item.mobile, [480, 800], "(max-width: 899px) 100vw")}
                    desktop={art(item.desktop, [420, 760], "33vw")}
                    alt={`${item.model} — ${item.service}`}
                  />
                  <div className="work-card-overlay">
                    <span>{item.model}</span>
                    <small>{item.service}</small>
                    <strong>{item.result}</strong>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section packages-section" id="packages">
          <div className="container">
            <SectionHeading
              kicker="05 / Пакеты"
              title={
                <>
                  Выберите <em>свой уход.</em>
                </>
              }
              copy="Три готовых сценария. Можно собрать свой набор — стоимость назовём при записи."
            />
            <div className="packages-grid">
              {packages.map((pack, i) => (
                <article
                  className={`package-card reveal ${i === 1 ? "package-card--featured" : ""}`}
                  style={{ "--d": `${i * 90}ms` } as React.CSSProperties}
                  key={pack.name}
                >
                  {i === 1 ? <span className="package-badge">Чаще выбирают</span> : null}
                  <span className="eyebrow">0{i + 1} / {pack.name}</span>
                  <h3>{pack.title}</h3>
                  <p>{pack.name}</p>
                  <div className="package-price">{pack.price}</div>
                  <ul>
                    {pack.items.map((item) => (
                      <li key={item}>
                        <Check size={15} aria-hidden="true" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <button type="button" className="button button--outline" onClick={() => openBooking()}>
                    {pack.cta}
                  </button>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section reviews-section" id="reviews">
          <div className="container">
            <div className="reviews-head">
              <span className="eyebrow">06 / Отзывы</span>
              <h2>
                Что пишут <em>клиенты.</em>
              </h2>
              <div className="reviews-rating">
                <Stars />
                <span>
                  5.0 из 5 — 11 оценок и 5 текстовых отзывов в карточке 2ГИС.{" "}
                  <a href={TWOGIS_URL} target="_blank" rel="noreferrer">
                    Смотреть отзывы
                  </a>
                </span>
              </div>
            </div>
            <div className="reviews-grid">
              {reviews.map((review, i) => (
                <article className="review-card reveal" style={{ "--d": `${i * 80}ms` } as React.CSSProperties} key={review.name}>
                  <Stars />
                  <blockquote>{review.text}</blockquote>
                  <div className="review-author">
                    <strong>{review.name}</strong>
                    <span>{review.car}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="process-band" id="process">
          <div className="container">
            <div className="process-intro">
              <span className="eyebrow">07 / Процесс</span>
              <h2>
                Как <em>это работает.</em>
              </h2>
              <p>Шесть шагов от заявки до готового автомобиля.</p>
            </div>
            <ol className="process-steps">
              {process.map((item, i) => (
                <li className="process-step reveal" style={{ "--d": `${i * 60}ms` } as React.CSSProperties} key={item.title}>
                  <span aria-hidden="true">0{i + 1}</span>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.note}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="section brands-section">
          <div className="container">
            <div className="brands-layout">
              <SectionHeading
                kicker="08 / Направления"
                title={
                  <>
                    Что мы <em>делаем.</em>
                  </>
                }
                copy="Не только полировка: салон, шумоизоляция, защитные покрытия и сезонные работы. Ниже — направления, подтверждённые карточкой 2ГИС и публикациями мастерской."
              />
              <div className="brands-list">
                {brands.map((brand) => (
                  <span key={brand}>{brand}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="final-cta">
          <Picture
            className="final-media"
            mobile={art("seats-mobile", [480, 800, 1200], "100vw")}
            desktop={art("seats-wide", [1280, 1920], "100vw")}
            alt="Задние сиденья после химчистки — Car Stile, Павлодар"
          />
          <div className="final-cta-overlay" />
          <div className="final-content">
            <span className="eyebrow">09 / Ваш автомобиль. Наш уход.</span>
            <h2>
              Пора <em>навести блеск?</em>
            </h2>
            <button type="button" className="button button--accent" onClick={() => openBooking()}>
              Записаться онлайн <ArrowUpRight size={16} aria-hidden="true" />
            </button>
          </div>
        </section>

        <section className="section contacts-section" id="contacts" aria-labelledby="contacts-title">
          <div className="container">
            <div className="contacts-layout">
              <div className="contacts-copy">
                <span className="eyebrow">10 / Как нас найти</span>
                <h2 id="contacts-title">
                  Приезжайте <em>в мастерскую.</em>
                </h2>
                <p>
                  {CITY}, {ADDRESS}. Ориентир — остановка «Дворец школьников», около 200 метров. Работаем ежедневно 08:00–20:00, приём по
                  предварительной записи.
                </p>

                <ul className="contacts-list">
                  <li>
                    <span className="contacts-list__icon">
                      <MapPin size={18} aria-hidden="true" />
                    </span>
                    <div>
                      <strong>Адрес</strong>
                      <span>
                        {CITY}, {ADDRESS}
                      </span>
                    </div>
                  </li>
                  <li>
                    <span className="contacts-list__icon">
                      <Clock3 size={18} aria-hidden="true" />
                    </span>
                    <div>
                      <strong>Часы работы</strong>
                      <span>{HOURS}</span>
                    </div>
                  </li>
                  <li>
                    <span className="contacts-list__icon">
                      <Check size={18} aria-hidden="true" />
                    </span>
                    <div>
                      <strong>Оплата</strong>
                      <span>Карта, наличные, QR-код</span>
                    </div>
                  </li>
                  <li>
                    <span className="contacts-list__icon">
                      <Phone size={18} aria-hidden="true" />
                    </span>
                    <div>
                      <strong>Телефон</strong>
                      <a href={PHONE_HREF}>{PHONE_DISPLAY}</a>
                    </div>
                  </li>
                  <li>
                    <span className="contacts-list__icon">
                      <MessageCircle size={18} aria-hidden="true" />
                    </span>
                    <div>
                      <strong>Мессенджеры</strong>
                      <span className="contacts-list__links">
                        <a href={CONTACT_LINKS.whatsapp} target="_blank" rel="noreferrer">
                          WhatsApp
                        </a>
                        <a href={CONTACT_LINKS.telegram} target="_blank" rel="noreferrer">
                          Telegram
                        </a>
                        <a href={CONTACT_LINKS.instagram} target="_blank" rel="noreferrer">
                          Instagram
                        </a>
                      </span>
                    </div>
                  </li>
                </ul>

                <button type="button" className="button button--accent" onClick={() => openBooking()}>
                  Записаться онлайн <ArrowUpRight size={16} aria-hidden="true" />
                </button>
              </div>

              <ContactMap />
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="footer-top">
          <a href="#top" className="brand" onClick={(e) => { e.preventDefault(); scrollTo("top"); }}>
            <span>CAR</span>
            <small>STILE</small>
          </a>
          <p>
            Полировка. Химчистка.
            <br />
            Шумоизоляция. Защита.
          </p>
          <div className="footer-cta">
            <span>Есть вопрос?</span>
            <a href={PHONE_HREF}>
              <Phone size={14} aria-hidden="true" /> {PHONE_DISPLAY}
            </a>
          </div>
        </div>
        <div className="footer-bottom">
          <div>
            <span>
              {CITY}, {ADDRESS}
            </span>
            <span>{HOURS}</span>
          </div>
          <div className="footer-social">
            <a href={CONTACT_LINKS.whatsapp} target="_blank" rel="noreferrer">
              <MessageCircle size={16} aria-hidden="true" /> WhatsApp
            </a>
            <a href={CONTACT_LINKS.telegram} target="_blank" rel="noreferrer">
              <ArrowUpRight size={14} aria-hidden="true" /> Telegram
            </a>
            <a href={CONTACT_LINKS.instagram} target="_blank" rel="noreferrer">
              <Instagram size={16} aria-hidden="true" /> Instagram
            </a>
          </div>
          <span>© {new Date().getFullYear()} Car Stile, {CITY}</span>
        </div>
      </footer>

      <BookingSheet open={bookingOpen} onClose={() => setBookingOpen(false)} initialService={bookingService} />
    </div>
  );
}
