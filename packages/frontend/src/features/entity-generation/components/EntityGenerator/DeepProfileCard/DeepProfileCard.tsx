import styles from './DeepProfileCard.module.css';

interface DeepProfile {
  looks: string;
  wearing: string;
  face: string;
  hair: string;
  body: string;
  specificDetails: string;
  style: string;
  personality: string;
  voice: string;
  speechStyle: string;
  gender: string;
  nationality: string;
  tags: string;
}

interface DeepProfileCardProps {
  profile: DeepProfile;
}

export function DeepProfileCard({ profile }: DeepProfileCardProps) {
  return (
    <div className={styles.profileCard}>
      <div className={styles.profileTitle}>Deep Profile</div>
      
      <div className={styles.profileField}>
        <div className={styles.fieldLabel}>Looks</div>
        <div className={styles.fieldValue}>{profile.looks}</div>
      </div>

      <div className={styles.profileField}>
        <div className={styles.fieldLabel}>Wearing</div>
        <div className={styles.fieldValue}>{profile.wearing}</div>
      </div>

      <div className={styles.profileField}>
        <div className={styles.fieldLabel}>Face</div>
        <div className={styles.fieldValue}>{profile.face}</div>
      </div>

      <div className={styles.profileField}>
        <div className={styles.fieldLabel}>Hair</div>
        <div className={styles.fieldValue}>{profile.hair}</div>
      </div>

      <div className={styles.profileField}>
        <div className={styles.fieldLabel}>Body</div>
        <div className={styles.fieldValue}>{profile.body}</div>
      </div>

      <div className={styles.profileField}>
        <div className={styles.fieldLabel}>Specific Details</div>
        <div className={styles.fieldValue}>{profile.specificDetails}</div>
      </div>

      <div className={styles.profileField}>
        <div className={styles.fieldLabel}>Style</div>
        <div className={styles.fieldValue}>{profile.style}</div>
      </div>

      <div className={styles.profileField}>
        <div className={styles.fieldLabel}>Personality</div>
        <div className={styles.fieldValue}>{profile.personality}</div>
      </div>

      <div className={styles.profileField}>
        <div className={styles.fieldLabel}>Voice</div>
        <div className={styles.fieldValue}>{profile.voice}</div>
      </div>

      <div className={styles.profileField}>
        <div className={styles.fieldLabel}>Speech Style</div>
        <div className={styles.fieldValue}>{profile.speechStyle}</div>
      </div>

      <div className={styles.profileField}>
        <div className={styles.fieldLabel}>Gender</div>
        <div className={styles.fieldValue}>{profile.gender}</div>
      </div>

      <div className={styles.profileField}>
        <div className={styles.fieldLabel}>Nationality</div>
        <div className={styles.fieldValue}>{profile.nationality}</div>
      </div>

      <div className={styles.profileField}>
        <div className={styles.fieldLabel}>Tags</div>
        <div className={styles.fieldValue}>{profile.tags}</div>
      </div>
    </div>
  );
}
