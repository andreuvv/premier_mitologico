import { useState } from 'react';
import { FaBook, FaFileAlt, FaExternalLinkAlt, FaChevronDown } from 'react-icons/fa';
import styles from './ImportantDocumentsCard.module.css';

const ImportantDocumentsCard = () => {
  const [isOpen, setIsOpen] = useState(true);
  
  const sections = [
    {
      title: 'Primer Bloque',
      color: 'var(--ocher)',
      subtitle: [
        { name: 'Racial Edición', link: 'https://andreuvv.github.io/premier_mitologico/game-formats/primerBloque/primerBloqueRacialEdicion' },
        { name: 'Racial Libre', link: 'https://andreuvv.github.io/premier_mitologico/game-formats/primerBloque/primerBloqueRacialLibre' },
      ],
      documents: [
        {
          name: 'Documento Actualizado de Reglas (D.A.R) - Julio 2021',
          link: 'https://drive.google.com/file/d/1vRDfyMMHdfy_qQrLX4zfAE83XYcH-IBH/view',
        },
        {
          name: 'Documento de Preguntas Frecuentes (F.A.Q) - Abril 2024',
          link: 'https://drive.google.com/file/d/1l6W5Qnc_Xp93i52tOflLaz1E-wzF3NM2/view',
        },
        {
          name: 'Oráculo Ra Aniversario',
          link: 'https://drive.google.com/file/d/1RnaG_evDVGQ3VWAOX25xUkKWt1EhLC0z/view',
        },
        {
          name: 'Oráculo Colmillos de Avalon e Inframundo',
          link: 'https://blog.myl.cl/wp-content/uploads/2025/10/Oraculo-Colmillos-v1.0_compressed.pdf',
        },
        {
          name: 'Oráculo LootBox 2025',
          link: 'https://blog.myl.cl/wp-content/uploads/2026/02/Oraculo-Lootbox-PB-2025.pdf',
        },
      ],
    },
    {
      title: 'Furia Extendido',
      color: 'var(--brick-red)',
      subtitle: [
        { name: 'Racial Libre', link: 'https://andreuvv.github.io/premier_mitologico/game-formats/bloqueFuria/bloqueFuriaRacialLibre' },
        { name: 'Racial VCR', link: 'https://andreuvv.github.io/premier_mitologico/game-formats/formatosEspeciales/vcr' },
      ],
      documents: [
        {
          name: 'Documento Actualizado de Reglas (D.A.R.) - Julio 2024',
          link: 'https://drive.google.com/file/d/1DfwWgBAqdCpZZNDdQMB5XltZmn5T6lBL/view',
        },
        {
          name: 'Documento de Preguntas Frecuentes (F.A.Q.) - Agosto 2025',
          link: 'https://drive.google.com/file/d/1lalgtNHq-0QftFw26gLmV7Lzqfa2KmLC/view',
        },
        {
          name: 'Reworks LBF2026',
          link: 'https://blog.myl.cl/todas-las-cartas-rework-de-leyendas-bloque-furia-2026/',
        },
      ],
    },
  ];

  return (
    <div className={styles.card}>
      <button 
        className={styles.headerButton}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className={styles.header}>
          <FaBook className={styles.headerIcon} />
          <h3 className={styles.title}>Documentos Importantes</h3>
        </div>
        <FaChevronDown className={`${styles.toggleIcon} ${isOpen ? styles.open : ''}`} />
      </button>
      
      {isOpen && (
        <div className={styles.content}>
          {sections.map((section, index) => (
            <div key={index} className={styles.section}>
              <h4 className={styles.sectionTitle} style={{ color: section.color }}>
                {section.title}
              </h4>
              <div className={styles.subtitle}>
                {section.subtitle.map((sub, subIndex) => (
                  <span key={subIndex}>
                    <a href={sub.link} target="_blank" rel="noopener noreferrer" className={styles.subtitleLink}>
                      {sub.name}
                    </a>
                    {subIndex < section.subtitle.length - 1 && <span className={styles.subtitleSeparator}> | </span>}
                  </span>
                ))}
              </div>
              <ul className={styles.documentList}>
                {section.documents.map((doc, docIndex) => (
                  <li key={docIndex} className={styles.documentItem}>
                    <FaFileAlt className={styles.docIcon} />
                    <a 
                      href={doc.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={styles.documentLink}
                    >
                      {doc.name}
                      <FaExternalLinkAlt className={styles.externalIcon} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImportantDocumentsCard;
