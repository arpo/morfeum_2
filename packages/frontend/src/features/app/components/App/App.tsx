import styles from './App.module.css';

export function App() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Morfeum</h1>
      </header>
      
      <section className={styles.chatSection}>
        {/* Chat will go here */}
      </section>
      
      <section className={styles.contentSection}>
        {/* Content panels will go here */}
      </section>
    </div>
  );
}
