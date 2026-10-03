import { useLocation } from "wouter";

/**
 * Страница 404.
 *
 * Была на английском («Page Not Found», «Go Home») при `lang="ru"` и собиралась
 * из shadcn-классов, токены которых в проекте не заданы, — то есть показывалась
 * без оформления. Теперь она на русском и на тех же токенах, что и весь сайт.
 */
export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="notfound">
      <span className="notfound__code">Ошибка 404</span>
      <h1>
        Такой страницы
        <br />
        нет.
      </h1>
      <p>Возможно, ссылка устарела или в адресе опечатка. Вернитесь на главную — там услуги, стоимость и запись.</p>
      <div className="notfound__actions">
        <button type="button" className="button button--accent" onClick={() => setLocation("/")}>
          На главную
        </button>
        <a className="button button--outline" href="/#services">
          Услуги и цены
        </a>
      </div>
    </div>
  );
}
