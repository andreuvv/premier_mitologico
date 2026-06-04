import { useState } from 'react';
import { FaBook, FaFileAlt, FaExternalLinkAlt, FaChevronDown } from 'react-icons/fa';
import styles from './ImportantDocumentsCard.module.css';

const ImportantDocumentsCard = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [faqOpenMap, setFaqOpenMap] = useState<Record<number, boolean>>({});

  const toggleFaq = (index: number) => {
    setFaqOpenMap(prev => ({ ...prev, [index]: !prev[index] }));
  };
  
  const sections = [
    {
      title: 'Primer Bloque',
      color: 'var(--ocher)',
      subtitle: [
        { name: 'Racial Edición', link: 'https://mitoxicos.cl/game-formats/primerBloque/primerBloqueRacialEdicion' },
        { name: 'Racial Libre', link: 'https://mitoxicos.cl/game-formats/primerBloque/primerBloqueRacialLibre' },
      ],
      faqDocuments: [
        {
            name: 'F.A.Q. - Mayo 2026',
            link: 'https://drive.google.com/file/d/1GDDiu7p0vxFzmi9u3V_Yil2X_VJSesla/view',
        },
        {
            name: 'F.A.Q. - Abril 2024',
            link: 'https://drive.google.com/file/d/1l6W5Qnc_Xp93i52tOflLaz1E-wzF3NM2/view',
        },
        {
            name: 'F.A.Q. - Septiembre 2023',
            link: 'https://blog.myl.cl/wp-content/uploads/2023/09/Documento-de-Preguntas-Frecuentes-MyL-Primer-Bloque-Septiembre-2023.pdf',
        },
        {
            name: 'F.A.Q. - Mayo 2023',
            link: 'https://blog.myl.cl/wp-content/uploads/2023/05/Documento-de-Preguntas-Frecuentes-MyL-Primer-Bloque-Mayo-2023_ligero.pdf',
        }
      ],
      documents: [
        {
            name: 'Documento Actualizado de Reglas (D.A.R) - Julio 2021',
            link: 'https://drive.google.com/file/d/1vRDfyMMHdfy_qQrLX4zfAE83XYcH-IBH/view',
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
        {
            name: 'Oráculo Toolkit PB 2026',
            link: 'https://blog.myl.cl/wp-content/uploads/2026/03/Oraculo-Toolkit-PB-2026.pdf',
        },
      ],
    },
    {
      title: 'Furia Extendido',
      color: 'var(--brick-red)',
      subtitle: [
        { name: 'Racial Libre', link: 'https://mitoxicos.cl/game-formats/bloqueFuria/bloqueFuriaRacialLibre' },
        { name: 'Racial Ragnarok', link: 'https://mitoxicos.cl/game-formats/formatosEspeciales/ragnarok' },
      ],
      faqDocuments: [
        {
            name: 'F.A.Q. - Agosto 2025',
            link: 'https://drive.google.com/file/d/1lalgtNHq-0QftFw26gLmV7Lzqfa2KmLC/view',
        },
        {
            name: 'F.A.Q. - Julio 2024',
            link: 'https://blog.myl.cl/wp-content/uploads/2024/07/FAQ-GDS.pdf',
        },
        {
            name: 'F.A.Q. - Diciembre 2023',
            link: 'https://blog.myl.cl/wp-content/uploads/2023/12/Documento-de-Preguntas-Frecuentes-MyL-Furia-Extendido-Diciembre2023.pdf',
        },
        {
            name: 'F.A.Q. - Enero 2023',
            link: 'https://blog.myl.cl/wp-content/uploads/2023/01/FAQ-ROMA.pdf',
        }
      ],
      documents: [
        {
            name: 'Documento Actualizado de Reglas (D.A.R.) - Julio 2024',
            link: 'https://drive.google.com/file/d/1DfwWgBAqdCpZZNDdQMB5XltZmn5T6lBL/view',
        },
        {
            name: 'Reworks LBF2026',
            link: 'https://blog.myl.cl/todas-las-cartas-rework-de-leyendas-bloque-furia-2026/',
        },
        {
            name: 'Aclaraciones LBF2026',
            link: 'https://blog.myl.cl/aclaraciones-y-los-ultimos-spoilers/',
        },
        {
            name: 'Cartas nuevas LBF2026',
            link: 'https://blog.myl.cl/spoiler-leyendas-bloque-furia-2026/',
        }
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
                  <>
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
                    {docIndex === 0 && section.faqDocuments.length > 0 && (
                      <li className={styles.faqListItem}>
                        <div className={styles.faqAccordion}>
                          <button
                            className={styles.faqAccordionHeader}
                            onClick={() => toggleFaq(index)}
                          >
                            <span className={styles.faqAccordionTitle}>
                              <FaFileAlt className={styles.docIcon} />
                              Documentos de Preguntas Frecuentes (F.A.Q.)
                            </span>
                            <FaChevronDown className={`${styles.faqChevron} ${faqOpenMap[index] ? styles.faqChevronOpen : ''}`} />
                          </button>
                          {faqOpenMap[index] && (
                            <ul className={`${styles.documentList} ${styles.faqDocumentList}`}>
                              {section.faqDocuments.map((faqDoc, faqDocIndex) => (
                                <li key={faqDocIndex} className={styles.documentItem}>
                                  <FaFileAlt className={styles.docIcon} />
                                  <a
                                    href={faqDoc.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.documentLink}
                                  >
                                    {faqDoc.name}
                                    <FaExternalLinkAlt className={styles.externalIcon} />
                                  </a>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </li>
                    )}
                  </>
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
