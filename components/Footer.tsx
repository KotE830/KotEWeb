'use client';

import { useTranslation } from '@/hooks/useTranslation';
import './Footer.css';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <p className="footer-text">
            {t('footer.description')}
          </p>
        </div>
        <div className="footer-section">
          <p className="footer-copyright">
            © {new Date().getFullYear()} KotE. {t('footer.rights')}
          </p>
        </div>
      </div>
    </footer>
  );
}

