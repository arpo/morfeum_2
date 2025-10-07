import styles from './VisualAnalysisCard.module.css';

interface VisualAnalysis {
  face: string;
  hair: string;
  body: string;
  specificdetails: string;
}

interface VisualAnalysisCardProps {
  analysis: VisualAnalysis;
}

export function VisualAnalysisCard({ analysis }: VisualAnalysisCardProps) {
  return (
    <div className={styles.analysisCard}>
      <div className={styles.analysisTitle}>Visual Analysis</div>
      
      <div className={styles.analysisField}>
        <div className={styles.fieldLabel}>Face</div>
        <div className={styles.fieldValue}>{analysis.face}</div>
      </div>

      <div className={styles.analysisField}>
        <div className={styles.fieldLabel}>Hair</div>
        <div className={styles.fieldValue}>{analysis.hair}</div>
      </div>

      <div className={styles.analysisField}>
        <div className={styles.fieldLabel}>Body</div>
        <div className={styles.fieldValue}>{analysis.body}</div>
      </div>

      <div className={styles.analysisField}>
        <div className={styles.fieldLabel}>Specific Details</div>
        <div className={styles.fieldValue}>{analysis.specificdetails}</div>
      </div>
    </div>
  );
}
