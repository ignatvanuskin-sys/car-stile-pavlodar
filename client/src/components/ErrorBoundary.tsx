import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Ловит ошибки рендера.
 *
 * Раньше показывал посетителю полный `error.stack` — это утечка внутренностей
 * приложения в продакшене. Теперь стек уходит только в консоль, а человек
 * видит понятный экран и путь дальше: обновить страницу или вернуться на главную.
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error("[Car Stile] ошибка интерфейса:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="notfound">
          <span className="notfound__code">Сбой интерфейса</span>
          <h1>
            Что-то
            <br />
            пошло не так.
          </h1>
          <p>
            Страница не смогла отрисоваться. Обновите её — если не поможет, позвоните, и мы примем заявку по телефону.
          </p>
          <div className="notfound__actions">
            <button type="button" className="button button--accent" onClick={() => window.location.reload()}>
              Обновить страницу
            </button>
            <a className="button button--outline" href="/">
              На главную
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
