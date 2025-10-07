import styles from './EntitySeedCard.module.css';

interface EntitySeed {
  name: string;
  looks: string;
  wearing: string;
  personality: string;
  presence?: string;
  setting?: string;
}

interface EntitySeedCardProps {
  seed: EntitySeed;
}

export function EntitySeedCard({ seed }: EntitySeedCardProps) {
  return (
    <div className={styles.seedCard}>
      <div className={styles.seedField}>
        <div className={styles.fieldLabel}>Name</div>
        <div className={styles.fieldValue}>{seed.name}</div>
      </div>

      <div className={styles.seedField}>
        <div className={styles.fieldLabel}>Looks</div>
        <div className={styles.fieldValue}>{seed.looks}</div>
      </div>

      <div className={styles.seedField}>
        <div className={styles.fieldLabel}>Wearing</div>
        <div className={styles.fieldValue}>{seed.wearing}</div>
      </div>

      <div className={styles.seedField}>
        <div className={styles.fieldLabel}>Personality</div>
        <div className={styles.fieldValue}>{seed.personality}</div>
      </div>

      {seed.presence && (
        <div className={styles.seedField}>
          <div className={styles.fieldLabel}>Presence</div>
          <div className={styles.fieldValue}>{seed.presence}</div>
        </div>
      )}

      {seed.setting && (
        <div className={styles.seedField}>
          <div className={styles.fieldLabel}>Setting</div>
          <div className={styles.fieldValue}>{seed.setting}</div>
        </div>
      )}
    </div>
  );
}
