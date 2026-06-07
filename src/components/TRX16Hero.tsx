import { useRef, useEffect, type ReactNode } from 'react';

const IMGS = [
  { src: '/trx16_0.png', label: 'Frente',   rot: 0   },
  { src: '/trx16_1.png', label: 'Traseira', rot: 180 },
];

const DRIVER_H = 3000;
const accent   = '#21C8D4';
const H        = 520; // hero height px

export default function TRX16Hero({ userName }: { userName: string }) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const canvasRef     = useRef<HTMLDivElement>(null);
  const img0Ref       = useRef<HTMLImageElement>(null);
  const img1Ref       = useRef<HTMLImageElement>(null);
  const introRef      = useRef<HTMLDivElement>(null);
  const card1Ref      = useRef<HTMLDivElement>(null);
  const card2Ref      = useRef<HTMLDivElement>(null);
  const labelRef      = useRef<HTMLSpanElement>(null);
  const curImg        = useRef(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function show(i: number) {
      if (i === curImg.current) return;
      const prev = curImg.current === 0 ? img0Ref.current : img1Ref.current;
      const next = i === 0 ? img0Ref.current : img1Ref.current;
      if (prev) prev.style.opacity = '0';
      if (next) next.style.opacity = '1';
      curImg.current = i;
      if (labelRef.current) labelRef.current.textContent = IMGS[i].label;
    }

    function onScroll() {
      const st  = el.scrollTop;
      const max = DRIVER_H - el.clientHeight;
      const dp  = max > 0 ? Math.max(0, Math.min(st / max, 1)) : 0;

      if (canvasRef.current)
        canvasRef.current.style.transform = `translateY(${(dp - 0.4) * 22}px)`;

      if (introRef.current)
        introRef.current.style.opacity = String(Math.max(0, 1 - st / (el.clientHeight * 0.5)));

      show(dp < 0.54 ? 0 : 1);

      if (card1Ref.current) {
        card1Ref.current.style.opacity      = dp >= 0.12 ? '1' : '0';
        card1Ref.current.style.transform    = dp >= 0.12 ? 'translateY(0)' : 'translateY(36px)';
      }
      if (card2Ref.current) {
        card2Ref.current.style.opacity      = dp >= 0.58 ? '1' : '0';
        card2Ref.current.style.transform    = dp >= 0.58 ? 'translateY(0)' : 'translateY(36px)';
      }
    }

    el.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const wrapStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: H,
    overflow: 'hidden',
  };

  const absCenter: React.CSSProperties = {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  };

  return (
    <>
      <style>{`
        @keyframes trx-bob {
          0%,100% { opacity:.2; transform:translateY(0); }
          50%      { opacity:.65; transform:translateY(-6px); }
        }
        .trx-bob { animation: trx-bob 2.2s ease infinite; }
      `}</style>

      <div style={wrapStyle}>

        {/* scroll driver — hidden, captures scroll events */}
        <div
          ref={containerRef}
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            overflowY: 'scroll', overflowX: 'hidden',
            scrollbarWidth: 'none', zIndex: 0,
          }}
        >
          <style>{`.trx-driver::-webkit-scrollbar{display:none}`}</style>
          <div className="trx-driver" style={{ height: DRIVER_H }} />
        </div>

        {/* ── device image — centered ── */}
        <div style={{ ...absCenter, zIndex: 1 }}>
          <div
            ref={canvasRef}
            style={{
              position: 'relative',
              width: 'min(38%, 280px)',
              aspectRatio: '1',
              willChange: 'transform',
              transition: 'transform 0.08s linear',
            }}
          >
            <img ref={img0Ref} src={IMGS[0].src} alt="Frente" draggable={false}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%',
                objectFit: 'contain', objectPosition: 'center', opacity: 1,
                transition: 'opacity .5s ease', transform: 'rotate(0deg)',
                filter: 'drop-shadow(0 28px 56px rgba(0,0,0,.85)) drop-shadow(0 0 40px rgba(33,200,212,.09))',
                userSelect: 'none', pointerEvents: 'none' }} />
            <img ref={img1Ref} src={IMGS[1].src} alt="Traseira" draggable={false}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%',
                objectFit: 'contain', objectPosition: 'center', opacity: 0,
                transition: 'opacity .5s ease', transform: 'rotate(180deg)',
                filter: 'drop-shadow(0 28px 56px rgba(0,0,0,.85)) drop-shadow(0 0 40px rgba(33,200,212,.09))',
                userSelect: 'none', pointerEvents: 'none' }} />
            {/* glow */}
            <div style={{ position: 'absolute', bottom: '-8%', left: '50%', transform: 'translateX(-50%)', width: '90%', height: '32%', background: 'radial-gradient(ellipse,rgba(33,200,212,.13) 0%,transparent 70%)' }} />
            {/* shadow */}
            <div style={{ position: 'absolute', bottom: '-4%', left: '50%', transform: 'translateX(-50%)', width: '60%', height: 14, background: 'radial-gradient(ellipse,rgba(0,0,0,.65) 0%,transparent 70%)', filter: 'blur(8px)' }} />
          </div>
        </div>

        {/* ── greeting — top left ── */}
        <div style={{ position: 'absolute', top: 24, left: 28, zIndex: 10, pointerEvents: 'none' }}>
          <h2 style={{ fontSize: 'clamp(18px,2vw,26px)', fontWeight: 700, lineHeight: 1.2, marginBottom: 4, color: '#fff' }}>
            {(() => {
              const h = new Date().getHours();
              const s = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
              return <>{s}, <span style={{ color: '#00D1C1' }}>{userName}</span>!</>;
            })()}
          </h2>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.32)' }}>Painel de controle — Device Intranet Arqia</p>
        </div>

        {/* ── intro text — center, fades on scroll ── */}
        <div ref={introRef} style={{ ...absCenter, flexDirection: 'column', textAlign: 'center', zIndex: 2, transition: 'opacity .15s linear' }}>
          {/* push down so it doesn't cover greeting */}
          <div style={{ marginTop: 80, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase', color: accent, marginBottom: 12, opacity: 0.8 }}>Device Intranet · Arqia</div>
            <div style={{ fontSize: 'clamp(42px,5vw,66px)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 12,
              background: 'linear-gradient(135deg,#fff 30%,#b8e8f0 65%,#21C8D4 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>TRX-16</div>
            <div style={{ width: 36, height: 3, background: accent, borderRadius: 3, margin: '0 auto 14px', opacity: 0.7 }} />
            <div style={{ fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#c8dde8', fontFamily: 'ui-monospace,monospace', marginBottom: 10, textShadow: '0 0 24px rgba(33,200,212,.45)' }}>
              Rastreador Veicular · <strong style={{ color: accent }}>2G</strong> / <strong style={{ color: accent }}>4G CTA-1</strong>
            </div>
            <div className="trx-bob" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, color: 'rgba(255,255,255,.2)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
              <span>Role para explorar</span>
              <div style={{ width: 1, height: 40, background: `linear-gradient(to bottom,transparent,${accent},transparent)` }} />
            </div>
          </div>
        </div>

        {/* ── card 1 — left ── */}
        <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, display: 'flex', alignItems: 'center', paddingLeft: '5vw', pointerEvents: 'none', zIndex: 3 }}>
          <div ref={card1Ref} style={{ maxWidth: 280, opacity: 0, transform: 'translateY(36px)', transition: 'opacity .7s ease, transform .7s ease' }}>
            <CardContent tag="Conectividade & Rastreamento"
              title={<>Sempre<br /><em style={{ fontStyle: 'normal', color: accent }}>online.</em></>}
              body="Rede 2G e 4G com envio de posição por ângulo, geofence embarcado e atualizações remotas via OTA."
              rows={[['Tecnologia','2G · 4G CTA-1',true],['Envio por ângulo','Sim'],['Cerca embarcada','Sim'],['Atualização OTA','Sim'],['Armazenamento','2.000 msgs']]}
              accent={accent} />
          </div>
        </div>

        {/* ── card 2 — right ── */}
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', paddingRight: '5vw', pointerEvents: 'none', zIndex: 3 }}>
          <div ref={card2Ref} style={{ maxWidth: 280, opacity: 0, transform: 'translateY(36px)', transition: 'opacity .7s ease, transform .7s ease' }}>
            <CardContent tag="Hardware"
              title={<>Robusto.<br /><em style={{ fontStyle: 'normal', color: accent }}>Inteligente.</em></>}
              body="Acelerômetro integrado, detector de Jammer e bateria interna para continuidade total dos dados."
              rows={[['Tipo','Rastreador Veicular'],['Acelerômetro','Sim'],['Detector de Jammer','Sim'],['Entradas / Saídas','1 / 1'],['Consumo típico','3.7V'],['Bateria','3.7V · 150 mAh']]}
              accent={accent} />
          </div>
        </div>

        {/* ── view label ── */}
        <div style={{ position: 'absolute', bottom: 10, left: 0, right: 0, textAlign: 'center', pointerEvents: 'none', zIndex: 10 }}>
          <span ref={labelRef} style={{ fontSize: 10, letterSpacing: '0.22em', color: 'rgba(255,255,255,.28)', fontWeight: 600, textTransform: 'uppercase' }}>
            {IMGS[0].label}
          </span>
        </div>

      </div>
    </>
  );
}

function CardContent({ tag, title, body, rows, accent }: {
  tag: string; title: ReactNode; body: string;
  rows: [string, string, boolean?][]; accent: string;
}) {
  return (
    <>
      <div style={{ fontSize: 10, letterSpacing: '0.24em', textTransform: 'uppercase', color: accent, marginBottom: 10 }}>{tag}</div>
      <h2 style={{ fontSize: 'clamp(24px,3vw,38px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: 12, color: '#fff' }}>{title}</h2>
      <p style={{ fontSize: 12, lineHeight: 1.8, color: '#6a7d90', marginBottom: 18 }}>{body}</p>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          {rows.map(([k, v, badge], i) => (
            <tr key={k} style={{ borderBottom: i < rows.length - 1 ? '1px solid rgba(255,255,255,.05)' : 'none' }}>
              <td style={{ padding: '8px 0', fontSize: 11, color: '#6a7d90', width: '55%' }}>{k}</td>
              <td style={{ padding: '8px 0', fontSize: 11, color: '#c8dde8', fontWeight: 500, textAlign: 'right' }}>
                {badge ? <span style={{ background: 'rgba(33,200,212,.10)', color: accent, border: '1px solid rgba(33,200,212,.18)', borderRadius: 4, fontSize: 10, padding: '2px 7px', fontFamily: 'ui-monospace,monospace' }}>{v}</span> : v}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
