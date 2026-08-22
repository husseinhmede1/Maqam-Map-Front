import { useToast } from './toast-store';
import styles from './Toast.module.css';

export function Toast() {
  const message = useToast((state) => state.message);

  return (
    <div className={`${styles.toast} ${message ? styles.visible : ''}`} role="status">
      {message}
    </div>
  );
}
