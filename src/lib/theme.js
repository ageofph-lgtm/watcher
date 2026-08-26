// Paleta de superfícies partilhada — suporta os 4 modos:
// clássico claro/escuro e glass claro/escuro (efeito vidro tipo Sagan).
export function surfaces(isDark, isGlass) {
  if (isGlass) {
    return isDark
      ? {
          panel:       'rgba(22,24,32,0.55)',
          panelHover:  'rgba(30,33,44,0.68)',
          card:        'rgba(255,255,255,0.05)',
          cardAlt:     'rgba(255,255,255,0.08)',
          border:      'rgba(255,255,255,0.10)',
          borderStrong:'rgba(255,255,255,0.18)',
          text:        '#EAEEF6',
          muted:       'rgba(190,200,220,0.60)',
          blur:        'blur(20px) saturate(140%)',
          shadow:      '0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)',
          radius:      '14px',
        }
      : {
          panel:       'rgba(255,255,255,0.58)',
          panelHover:  'rgba(255,255,255,0.75)',
          card:        'rgba(255,255,255,0.62)',
          cardAlt:     'rgba(255,255,255,0.80)',
          border:      'rgba(255,255,255,0.75)',
          borderStrong:'rgba(13,13,15,0.12)',
          text:        '#12131A',
          muted:       'rgba(60,66,86,0.65)',
          blur:        'blur(20px) saturate(150%)',
          shadow:      '0 8px 32px rgba(20,24,40,0.10), inset 0 1px 0 rgba(255,255,255,0.9)',
          radius:      '14px',
        };
  }
  return isDark
    ? {
        panel: '#111114', panelHover: '#18181c', card: '#18181c', cardAlt: '#0c0c0e',
        border: 'rgba(255,255,255,0.07)', borderStrong: 'rgba(255,255,255,0.14)',
        text: '#f0f0f0', muted: 'rgba(150,150,150,0.65)',
        blur: 'none', shadow: '0 1px 8px rgba(0,0,0,0.6)', radius: '8px',
      }
    : {
        panel: '#FFFFFF', panelHover: '#F6F6FA', card: '#FFFFFF', cardAlt: '#F8F8FF',
        border: 'rgba(13,13,15,0.10)', borderStrong: 'rgba(13,13,15,0.18)',
        text: '#0B0C18', muted: '#666888',
        blur: 'none', shadow: '0 1px 4px rgba(0,0,0,0.07)', radius: '8px',
      };
}

// Fundo da página para o tema glass
export function glassBackdrop(isDark) {
  return isDark
    ? {
        background: '#07080C',
        backgroundImage: `
          radial-gradient(ellipse 80% 60% at 12% -5%, rgba(200,16,46,0.18) 0%, transparent 60%),
          radial-gradient(ellipse 70% 55% at 88% 5%, rgba(77,159,255,0.16) 0%, transparent 60%),
          radial-gradient(ellipse 90% 60% at 50% 105%, rgba(155,92,246,0.14) 0%, transparent 65%)
        `,
      }
    : {
        background: '#EEF1F7',
        backgroundImage: `
          radial-gradient(ellipse 80% 60% at 10% -5%, rgba(255,45,120,0.16) 0%, transparent 60%),
          radial-gradient(ellipse 70% 55% at 90% 0%, rgba(77,159,255,0.18) 0%, transparent 60%),
          radial-gradient(ellipse 90% 60% at 50% 105%, rgba(155,92,246,0.12) 0%, transparent 65%)
        `,
      };
}