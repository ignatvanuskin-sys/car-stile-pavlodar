import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
/* Leaflet нужен только карте в блоке контактов, поэтому саму библиотеку тянем
   динамическим импортом внутри эффекта — она уезжает в отдельный чанк и не
   утяжеляет первую загрузку. Здесь остаются только типы и стили: CSS важен
   сразу, иначе карта мигнёт неоформленной. */
import type { Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
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

/**
 * Тайлы карты 2ГИС.
 *
 * Почему не виджет 2ГИС в iframe: `widgets.2gis.com/widget?type=firmsonmap`
 * без ключа кабинета отдаёт только «рамку» — зум и копирайт рисуются, а сами
 * тайлы и метка организации не появляются. То есть посетитель видит пустую
 * плашку, что хуже обычной карты.
 *
 * Тайловый сервис 2ГИС при этом открыт и отдаёт обычные Web-Mercator тайлы
 * (проверено: z=9 для этих координат возвращает Павлодар, z=13 — улицы Исы
 * Байзакова и Академика Чокина, парк Афганцев). Поэтому рисуем настоящую карту
 * 2ГИС через Leaflet: она гарантированно работает без ключа, тянет меньше
 * кода, чем iframe с чужим рантаймом, и полностью подчиняется нашей стилистике.
 *
 * Для продакшена правильнее взять официальный ключ 2ГИС: он даёт SLA и снимает
 * вопрос условий использования тайлов. Переключение — одна константа.
 */
const TWOGIS_TILES = "https://tile{s}.maps.2gis.com/tiles?x={x}&y={y}&z={z}";
const TWOGIS_TILE_SUBDOMAINS = ["0", "1", "2", "3"];

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
 * Карта 2ГИС под блоком контактов.
 *
 * Виджет 2ГИС ставит на карту саму организацию по её id, а не абстрактную
 * точку с координатами, — посетитель сразу видит карточку мастера.
 *
 * Iframe сторонний и тяжёлый, поэтому вставляем его только когда блок подходит
 * к экрану, а высоту карточка резервирует сама (aspect-ratio), чтобы контент
 * ниже не прыгал. Панель с адресом и кнопками — обычный DOM, а не часть
 * виджета, поэтому адрес и телефон остаются доступными, даже если iframe
 * заблокирован.
 */
function ContactMap() {
  const holder = useRef<HTMLDivElement | null>(null);
  const canvas = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);

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

  /* Карта собирается вручную, а не через iframe: так она наследует нашу
     стилистику (метка, зум, подписи) и не тянет чужой рантайм. */
  useEffect(() => {
    const el = canvas.current;
    if (!visible || !el || mapRef.current) return;

    let disposed = false;
    let ro: ResizeObserver | null = null;
    let fallback = 0;

    void (async () => {
      const mod = await import("leaflet");
      const L = (mod.default ?? mod) as typeof import("leaflet");
      if (disposed || !el.isConnected) return;

      const map = L.map(el, {
        center: [MAP_POINT.lat, MAP_POINT.lon],
        zoom: 16,
        zoomControl: false, // свой контрол поставим в правый нижний угол
        scrollWheelZoom: false, // колесо прокручивает страницу, а не зумит карту
        attributionControl: false, // свой, без префикса «Leaflet»
        keyboard: true,
      });
      mapRef.current = map;

      L.control.attribution({ prefix: false }).addTo(map);

      const tiles = L.tileLayer(TWOGIS_TILES, {
        subdomains: TWOGIS_TILE_SUBDOMAINS,
        minZoom: 3,
        maxZoom: 19,
        detectRetina: true,
        attribution: `© <a href="${TWOGIS_URL}" target="_blank" rel="noreferrer">2ГИС</a>`,
      }).addTo(map);

      L.control.zoom({ position: "bottomright" }).addTo(map);

      const pin = L.divIcon({
        className: "map-pin",
        html: '<span class="map-pin__ring"></span><span class="map-pin__dot"></span>',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      L.marker([MAP_POINT.lat, MAP_POINT.lon], { icon: pin, title: `${CITY}, ${ADDRESS}` })
        .addTo(map)
        .bindTooltip("Car Stile", {
          permanent: true,
          direction: "top",
          offset: [0, -14],
          className: "map-pin__label",
        });

      // Тайлы приходят пачкой: снимаем заглушку, когда она готова. Таймер —
      // страховка, чтобы мерцающая плашка не осталась навсегда при сбое сети.
      const showMap = () => setReady(true);
      fallback = window.setTimeout(showMap, 2500);
      tiles.on("load", showMap);
      tiles.on("tileerror", showMap);

      // Контейнер получает настоящий размер только после отрисовки.
      ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => map.invalidateSize());
      ro?.observe(el);
    })();

    return () => {
      disposed = true;
      window.clearTimeout(fallback);
      ro?.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [visible]);

  return (
    <div className="map-card reveal" ref={holder} data-shown="">
      <div className="map-card__canvas" data-state={ready ? "ready" : "loading"} aria-busy={!ready}>
        <div
          className="map-card__canvas-inner"
          ref={canvas}
          role="region"
          aria-label={`Карта 2ГИС: ${CITY}, ${ADDRESS}`}
        />
        <div className="map-card__stub" aria-hidden="true">
          <MapPin size={22} />
          <span>Загружаем карту…</span>
        </div>
        <span className="map-card__brand" translate="no">
          2ГИС
        </span>
      </div>

      <div className="map-card__panel">
        <div className="map-card__meta">
          <span className="eyebrow">Мастерская</span>
          <strong>
            {CITY}, {ADDRESS}
          </strong>
          <span>Ориентир — остановка «Дворец школьников», около 200 м.</span>
          <span>{HOURS}</span>
        </div>
        <div className="map-card__actions">
          <a className="button button--accent" href={CONTACT_LINKS.address} target="_blank" rel="noreferrer">
            <MapPin size={16} aria-hidden="true" />
            Открыть в 2ГИС
            <ArrowUpRight size={14} aria-hidden="true" />
          </a>
          <a className="button button--outline" href={PHONE_HREF}>
            <Phone size={16} aria-hidden="true" />
            Позвонить
          </a>
        </div>
      </div>
    </div>
  );
}

const STEPS = ["Услуга", "Автомобиль", "Контакты", "Дата", "Проверка"];

function BookingSheet({
  open,
  onClose,
  initialService,
  initialPack,
}: {
  open: boolean;
  onClose: () => void;
  initialService?: string;
  initialPack?: string;
}) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<BookingForm>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [copied, setCopied] = useState(false);
  const [copyFallback, setCopyFallback] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);
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
    /* Пакет приходит с карточки пакета: без этого форма открывалась пустой и
       выбор пользователя терялся на входе. */
    const pack = initialPack && packOptions.some((p) => p.name === initialPack) ? initialPack : "";
    setForm({
      ...emptyForm,
      pack,
      services: preselected && serviceNames.includes(preselected) ? [preselected] : [],
    });
  }, [open, initialService, initialPack]);

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

  /* Возврат фокуса на кнопку-триггер. Отдельный эффект только с зависимостью
     `open`: если завязаться на onClose (а он приходит из разметки новой
     ссылкой на каждом рендере), эффект перезапускался бы постоянно и уводил
     фокус из открытой формы на фон. */
  const triggerRef = useRef<HTMLElement | null>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (open && !wasOpen.current) {
      wasOpen.current = true;
      triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    } else if (!open && wasOpen.current) {
      wasOpen.current = false;
      triggerRef.current?.focus({ preventScroll: true });
      triggerRef.current = null;
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const focusables = () =>
      Array.from(
        sheetRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((el) => el.offsetParent !== null);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      /* Диалог модальный, поэтому Tab не должен уходить на содержимое фона. */
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === sheetRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
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

  /* Проверяет поля шага, который пользователь покидает. Возвращает список
     проблемных полей, а не просто «ок / не ок»: вызывающий код должен уметь
     довести человека до первой ошибки — на телефоне сообщение под сгибом
     иначе просто не видно, и шаг выглядит сломанным. */
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
      else if (digits.length > 15) next.phone = "Слишком много цифр — проверьте номер";
    }
    if (target >= 3) {
      if (!form.date) next.date = "Выберите дату";
      else if (form.date < today) next.date = "Эта дата уже прошла — выберите будущую";
      if (!form.time) next.time = "Выберите время";
    }
    setErrors(next);
    return Object.keys(next);
  };

  /* Подводим пользователя к первой ошибке: прокрутка и фокус на проблемном
     поле. Для группы услуг фокус ставим на сам контейнер. */
  const focusFirstError = (keys: string[]) => {
    const scope = bodyRef.current;
    const first = keys[0];
    if (!first || !scope) return;
    const el = scope.querySelector<HTMLElement>(`[data-field="${first}"]`);
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ block: "center", behavior: reduced ? "auto" : "smooth" });
    window.setTimeout(() => el.focus({ preventScroll: true }), reduced ? 0 : 180);
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

  /* Копирование с честной обратной связью. Если буфер обмена недоступен
     (нет разрешения, небезопасный контекст, отказ браузера) — не показываем
     нативный prompt, а раскрываем поле с текстом: его видно, можно выделить
     и скопировать руками. Раньше в этом случае не происходило ничего
     заметного, и кнопка выглядела нерабочей. */
  const copyRequest = () => {
    const text = buildMessage();
    /* Текст показываем сразу и не ждём ответа буфера обмена: если браузер
       держит промис (нет разрешения, нестандартный контекст), пользователь
       иначе не увидит вообще никакой реакции. Подтверждение копирования
       приходит вторым шагом и только меняет подпись. */
    setCopyFallback(text);
    const flash = () => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    };
    try {
      const write = navigator.clipboard?.writeText?.bind(navigator.clipboard);
      if (write) void write(text).then(flash, () => undefined);
    } catch {
      /* остаётся ручное копирование из показанного поля */
    }
  };

  const goNext = () => {
    const problems = validate(step);
    if (problems.length) {
      focusFirstError(problems);
      return;
    }
    if (step === STEPS.length - 1) {
      const href = waHref();
      setSending(true);
      setSent(true);
      /* window.open вызываем прямо в обработчике клика. В отложенном таймере
         (как было раньше) браузер теряет «жест пользователя» и вправе
         заблокировать вкладку — тогда экран успеха обещал бы открытый
         WhatsApp, которого нет. Теперь результат проверяем и говорим правду. */
      let opened: Window | null = null;
      try {
        /* Без «noopener» в аргументах: с ним window.open по спецификации
           возвращает null даже при успехе, и мы объявили бы блокировку на
           ровном месте. Вместо этого обнуляем opener вручную. */
        opened = window.open(href, "_blank");
        if (opened) {
          try {
            opened.opener = null;
          } catch {
            /* другая политика безопасности — не критично */
          }
        }
      } catch {
        opened = null;
      }
      setBlocked(opened === null);
      setSending(false);
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
                      <div className="choice-grid" data-field="services" tabIndex={-1} aria-label="Услуги">
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
                       {errors.services ? (
                         <span className="field-error" id="err-services" role="alert">
                           {errors.services}
                         </span>
                       ) : null}
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
                      data-field="make"
                      aria-invalid={errors.make ? true : undefined}
                      aria-describedby={errors.make ? "err-make" : undefined}
                    />
                    {errors.make ? (
                      <span className="field-error" id="err-make" role="alert">
                        {errors.make}
                      </span>
                    ) : null}
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
                      data-field="model"
                      aria-invalid={errors.model ? true : undefined}
                      aria-describedby={errors.model ? "err-model" : undefined}
                    />
                    {errors.model ? (
                      <span className="field-error" id="err-model" role="alert">
                        {errors.model}
                      </span>
                    ) : null}
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
                        data-field="name"
                        aria-invalid={errors.name ? true : undefined}
                        aria-describedby={errors.name ? "err-name" : undefined}
                      />
                      {errors.name ? (
                        <span className="field-error" id="err-name" role="alert">
                          {errors.name}
                        </span>
                      ) : null}
                    </label>
                    <label className={`field ${errors.phone ? "field--invalid" : ""}`}>
                      <span>Телефон</span>
                      <input
                        value={form.phone}
                        /* Поле принимало буквы, эмодзи и 20 цифр подряд — номер
                           всё равно уходил бы в заявку нечитаемым. Оставляем
                           только то, из чего состоит телефон. */
                        onChange={(e) => set("phone", e.target.value.replace(/[^\d+()\-\s]/g, "").slice(0, 18))}
                        onFocus={onFieldFocus}
                        placeholder="+7 (___) ___-__-__"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        enterKeyHint="done"
                        data-field="phone"
                        aria-invalid={errors.phone ? true : undefined}
                        aria-describedby={errors.phone ? "err-phone" : undefined}
                      />
                      {errors.phone ? (
                        <span className="field-error" id="err-phone" role="alert">
                          {errors.phone}
                        </span>
                      ) : null}
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
                        data-field="date"
                        aria-invalid={errors.date ? true : undefined}
                        aria-describedby={errors.date ? "err-date" : undefined}
                      />
                      {errors.date ? (
                        <span className="field-error" id="err-date" role="alert">
                          {errors.date}
                        </span>
                      ) : null}
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
                        data-field="time"
                        aria-invalid={errors.time ? true : undefined}
                        aria-describedby={errors.time ? "err-time" : undefined}
                      />
                      {errors.time ? (
                        <span className="field-error" id="err-time" role="alert">
                          {errors.time}
                        </span>
                      ) : null}
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
                    <span>Администратор подтвердит время в течение 15 минут в рабочее время.</span>
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
            {/* Говорим только то, что реально произошло: если браузер
                заблокировал вкладку, человек не должен искать несуществующий чат. */}
            <p>
              {blocked
                ? "Браузер заблокировал новое окно. Нажмите «Открыть WhatsApp» — заявка уже заполнена, останется отправить её в чате."
                : `Мы открыли WhatsApp с уже заполненной заявкой — нажмите «Отправить» в чате. Если окно не открылось, откройте его кнопкой ниже или позвоните: ${PHONE_DISPLAY}.`}
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
            <p className="copy-status" role="status" aria-live="polite">
              {copied ? "Текст заявки скопирован в буфер обмена" : ""}
            </p>
            {copyFallback ? (
              <div className="copy-fallback">
                <p>
                  {copied
                    ? "Текст заявки — уже в буфере обмена, но вот он целиком:"
                    : "Скопировать автоматически не вышло — выделите текст ниже и скопируйте вручную."}
                </p>
                <textarea
                  readOnly
                  rows={7}
                  value={copyFallback}
                  onFocus={(e) => e.currentTarget.select()}
                  aria-label="Текст заявки"
                />
              </div>
            ) : null}
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
  const [bookingPack, setBookingPack] = useState<string>("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [openService, setOpenService] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const menuToggleRef = useRef<HTMLButtonElement | null>(null);

  useRevealOnScroll();

  /* Пакет передаём вторым аргументом: кнопка «Рассчитать стоимость» на карточке
     пакета раньше открывала пустую форму, и выбранный пакет терялся. */
  const openBooking = useCallback((service = "", pack = "") => {
    setBookingService(service);
    setBookingPack(pack);
    setMenuOpen(false);
    setBookingOpen(true);
  }, []);

  const closeBooking = useCallback(() => setBookingOpen(false), []);

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
    /* Меню раскрывается поверх страницы, поэтому фон должен стоять на месте:
       без блокировки прокрутки палец под меню продолжает листать лендинг. */
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      /* Возвращаем фокус на гамбургер — иначе после Escape он падает на body. */
      menuToggleRef.current?.focus({ preventScroll: true });
    };
  }, [menuOpen]);

  /* Прямой заход по ссылке с якорем (/#contacts): к моменту, когда браузер
     пытается прыгнуть сам, одностраничник ещё не отрисован, поэтому
     прокручиваем вручную после монтирования. */
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (!id) return;
    const t = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ block: "start" });
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

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
      {/* Skip-link обязан быть первым в DOM: иначе первый Tab попадает на логотип
          в шапке, и до него нужно дойти ещё три нажатия. */}
      <a className="skip-link" href="#services">
        Перейти к услугам
      </a>

      <header className={`site-header ${scrolled ? "site-header--scrolled" : ""}`}>
        <a href="#top" className="brand" aria-label="Car Stile — в начало страницы" onClick={(e) => { e.preventDefault(); scrollTo("top"); }}>
          {/* Эмблема вырезана из присланного логотипа; название рядом набрано
              типографикой сайта, потому что внутри логотипа надпись занимает
              11 px по высоте и в интерфейсе нечитаема. */}
          <img className="brand__mark" src="/logo-mark.png" alt="" width={40} height={40} decoding="async" />
          <span className="brand__text">
            <span>CAR</span>
            <small>STILE</small>
          </span>
        </a>

        <nav id="site-nav" className={menuOpen ? "nav-links nav-links--open" : "nav-links"} aria-label="Основная навигация">
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
            ref={menuToggleRef}
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={menuOpen}
            aria-controls="site-nav"
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
            alt="Мастер полирует фару автомобиля — Car Stile, Павлодар"
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
                  <button type="button" className="button button--outline" onClick={() => openBooking("", pack.name)}>
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
          <a href="#top" className="brand brand--footer" onClick={(e) => { e.preventDefault(); scrollTo("top"); }}>
            <img className="brand__mark" src="/logo-mark.png" alt="" width={52} height={52} loading="lazy" decoding="async" />
            <span className="brand__text">
              <span>CAR</span>
              <small>STILE</small>
            </span>
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

      <BookingSheet
        open={bookingOpen}
        onClose={closeBooking}
        initialService={bookingService}
        initialPack={bookingPack}
      />
    </div>
  );
}
