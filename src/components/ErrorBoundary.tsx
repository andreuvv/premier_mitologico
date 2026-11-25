import { Component, type ErrorInfo, type ReactNode } from 'react';
import styles from './StatusMessage.module.css';

type Props = {
  children: ReactNode;
  /** When this value changes (e.g. the route), a previous error is cleared. */
  resetKey?: unknown;
};

type State = {
  error: Error | null;
  resetKey: unknown;
};

// After a new deploy, an open tab can still point to page chunks that no longer
// exist. Reloading picks up the new build.
const isChunkLoadError = (error: Error) =>
  /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(
    error.message,
  );

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, resetKey: this.props.resetKey };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    if (props.resetKey !== state.resetKey) {
      return { error: null, resetKey: props.resetKey };
    }
    return null;
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled UI error:', error, info.componentStack);
  }

  private handleRetry = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const chunkError = isChunkLoadError(error);

    return (
      <section className={styles.wrapper} role="alert">
        <h1 className={styles.title}>
          {chunkError ? 'Hay una nueva versión del sitio' : 'Algo salió mal'}
        </h1>
        <p className={styles.text}>
          {chunkError
            ? 'Recarga la página para cargar la versión más reciente.'
            : 'Ocurrió un error inesperado al mostrar esta sección. Puedes reintentar o recargar la página.'}
        </p>
        <div className={styles.actions}>
          <button type="button" className={styles.primary} onClick={() => window.location.reload()}>
            Recargar
          </button>
          {!chunkError && (
            <button type="button" className={styles.secondary} onClick={this.handleRetry}>
              Reintentar
            </button>
          )}
        </div>
      </section>
    );
  }
}
