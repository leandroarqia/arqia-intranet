import { useRef, useEffect, type ReactNode } from 'react';

const IMGS = [
  { src: '/trx16_0.png', label: 'Frente',   rot: 0   },
  { src: '/trx16_1.png', label: 'Traseira', rot: 180 },
];

const accent  = '#21C8D4';
const HERO_H  = 500;   // px — visual height
const SCROLL_H = 2800; // px — scroll travel inside the panel

export default function TRX16Hero({ userName }: { userName: string }) {
  const outerRef  = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const img0Ref   = useRef<HTMLImageElement>(null);
  const img1Ref   = useRef<HTMLImageElement>(null);
  const introRef  = useRef<HTMLDivElement>(null);
  const card1Ref  = useRef<HTMLDivElement>(null);
  const card2Ref  = useRef<HTMLDivElement>(null);
  const labelRef  = useRef<HTMLSpanElement>(null);
  const curImg    = useRef(0);

  useEffect(() => {
    // Find the nearest scrollable ancestor (the main content panel)
    function getScroller(el: HTMLElement | null): HTMLElement {
      while (el) {
        const { overflowY } = getComputedStyle(el);
        if (overflowY === 'auto' || overflowY === 'scroll') return el;
        el = el.parentElement;
      }
      return document.documentElement;
    }

    const outer   = outerRef.current!;
    const scroller = getScroller(outer.parentElement);

    function onScroll() {
      const outerTop    = outer.getBoundingClientRect().top;
      const scrollerTop = scroller === document.documentElement
        ? 0
        : scroller.getBoundingClientRect().top;

      const relTop = scrollerTop - outerTop; // how far we've scrolled into outer
      const maxTravel = SCROLL_H - HERO_H;
      const dp = maxTravel > 0 ? Math.max(0, Math.min(relTop / maxTravel, 1)) : 0;

      if (canvasRef.current)
        canvasRef.current.style.transform = `translateY(${(dp - 0.4) * 22}px)`;

      if (introRef.current)
        introRef.current.style.opacity = String(Math.max(0, 1 - dp / 0.35));

      const nextImg = dp < 0.54 ? 0 : 1;
      if (nextImg !== curImg.current) {
        (curImg.current === 0 ? img0Ref : img1Ref).current!.style.opacity = '0';
        (nextImg === 0 ? img0Ref : img1Ref).current!.style.opacity = '1';
        curImg.current = nextImg;
        if (labelRef.current) labelRef.current.textContent = IMGS[nextImg].label;
      }

      if (card1Ref.current) {
        const on = dp >= 0.12;
        card1Ref.current.style.opacity   = on ? '1' : '0';
        card1Ref.current.style.transform = on ? 'translateY(0)' : 'translateY(36px)';
      }
      if (card2Ref.current) {
        const on = dp >= 0.58;
        card2Ref.current.style.opacity   = on ? '1' : '0';
        card2Ref.current.style.transform = on ? 'translateY(0)' : 'translateY(36px)';
      }
    }

    scroller.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => scroller.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <style>{`
        @keyframes trx-bob {
          0%,100%{opacity:.2;transform:translateY(0)}
          50%{opacity:.65;transform:translateY(-6px)}
        }
        .trx-bob{animation:trx-bob 2.2s ease infinite}
      `}</style>

      {/* tall outer div — provides scroll travel */}
      <div ref={outerRef} style={{ height: SCROLL_H, position: 'relative' }}>

        {/* sticky visual panel — stays in view while scrolling through outer */}
        <div ref={stickyRef} style={{
          position: 'sticky', top: 0,
          height: HERO_H, overflow: 'hidden',
          width: '100%',
        }}>

          {/* ── device — centered ── */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 1 }}>
            <div ref={canvasRef} style={{ position: 'relative', width: 'min(38%,260px)', aspectRatio: '1', willChange: 'transform', transition: 'transform 0.08s linear' }}>
              <img ref={img0Ref} src={IMGS[0].src} alt="Frente" draggable={false}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain',
                  opacity: 1, transition: 'opacity .5s ease', transform: 'rotate(0deg)',
                  userSelect: 'none', pointerEvents: 'none',
                  filter: 'drop-shadow(0 28px 56px rgba(0,0,0,.85)) drop-shadow(0 0 40px rgba(33,200,212,.09))' }} />
              <img ref={img1Ref} src={IMGS[1].src} alt="Traseira" draggable={false}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain',
                  opacity: 0, transition: 'opacity .5s ease', transform: 'rotate(180deg)',
                  userSelect: 'none', pointerEvents: 'none',
                  filter: 'drop-shadow(0 28px 56px rgba(0,0,0,.85)) drop-shadow(0 0 40px rgba(33,200,212,.09))' }} />
              <div style={{ position: 'absolute', bottom: '-8%', left: '50%', transform: 'translateX(-50%)', width: '90%', height: '32%', background: 'radial-gradient(ellipse,rgba(33,200,212,.13) 0%,transparent 70%)' }} />
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

          {/* ── intro text — bottom center, fades on scroll ── */}
          <div ref={introRef} style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 52, textAlign: 'center', pointerEvents: 'none', zIndex: 2 }}>
            <div style={{ fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase', color: accent, marginBottom: 10, opacity: 0.8 }}>Device Intranet · Arqia</div>
            <div style={{ fontSize: 'clamp(40px,5vw,64px)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 10,
              background: 'linear-gradient(135deg,#fff 30%,#b8e8f0 65%,#21C8D4 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>TRX-16</div>
            <div style={{ width: 36, height: 3, background: accent, borderRadius: 3, margin: '0 auto 12px', opacity: 0.7 }} />
            <div style={{ fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#c8dde8', fontFamily: 'ui-monospace,monospace', marginBottom: 10, textShadow: '0 0 24px rgba(33,200,212,.45)' }}>
              Rastreador Veicular · <strong style={{ color: accent }}>2G</strong> / <strong style={{ color: accent }}>4G CTA-1</strong>
            </div>
            <div className="trx-bob" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, color: 'rgba(255,255,255,.2)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
              <span>Role para explorar</span>
              <div style={{ width: 1, height: 40, background: `linear-gradient(to bottom,transparent,${accent},transparent)` }} />
            </div>
          </div>

          {/* ── card 1 — left ── */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', paddingLeft: '5vw', pointerEvents: 'none', zIndex: 3 }}>
            <div ref={card1Ref} style={{ maxWidth: 260, opacity: 0, transform: 'translateY(36px)', transition: 'opacity .7s ease, transform .7s ease' }}>
              <CardContent tag="Conectividade & Rastreamento"
                title={<>Sempre<br /><em style={{ fontStyle: 'normal', color: accent }}>online.</em></>}
                body="Rede 2G e 4G com envio de posição por ângulo, geofence embarcado e atualizações remotas via OTA."
                rows={[['Tecnologia','2G · 4G CTA-1',true],['Envio por ângulo','Sim'],['Cerca embarcada','Sim'],['Atualização OTA','Sim'],['Armazenamento','2.000 msgs']]}
                accent={accent} />
            </div>
          </div>

          {/* ── card 2 — right ── */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '5vw', pointerEvents: 'none', zIndex: 3 }}>
            <div ref={card2Ref} style={{ maxWidth: 260, opacity: 0, transform: 'translateY(36px)', transition: 'opacity .7s ease, transform .7s ease' }}>
              <CardContent tag="Hardware"
                title={<>Robusto.<br /><em style={{ fontStyle: 'normal', color: accent }}>Inteligente.</em></>}
                body="Acelerômetro integrado, detector de Jammer e bateria interna para continuidade total dos dados."
                rows={[['Tipo','Rastreador Veicular'],['Acelerômetro','Sim'],['Detector de Jammer','Sim'],['Entradas / Saídas','1 / 1'],['Consumo típico','3.7V'],['Bateria','3.7V · 150 mAh']]}
                accent={accent} />
            </div>
          </div>

          {/* ── label ── */}
          <div style={{ position: 'absolute', bottom: 10, left: 0, right: 0, textAlign: 'center', pointerEvents: 'none', zIndex: 10 }}>
            <span ref={labelRef} style={{ fontSize: 10, letterSpacing: '0.22em', color: 'rgba(255,255,255,.28)', fontWeight: 600, textTransform: 'uppercase' }}>
              {IMGS[0].label}
            </span>
          </div>

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
      <h2 style={{ fontSize: 'clamp(22px,2.8vw,36px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: 12, color: '#fff' }}>{title}</h2>
      <p style={{ fontSize: 12, lineHeight: 1.8, color: '#6a7d90', marginBottom: 16 }}>{body}</p>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          {rows.map(([k, v, badge], i) => (
            <tr key={k} style={{ borderBottom: i < rows.length - 1 ? '1px solid rgba(255,255,255,.05)' : 'none' }}>
              <td style={{ padding: '8px 0', fontSize: 11, color: '#6a7d90', width: '55%' }}>{k}</td>
              <td style={{ padding: '8px 0', fontSize: 11, color: '#c8dde8', fontWeight: 500, textAlign: 'right' }}>
                {badge
                  ? <span style={{ background: 'rgba(33,200,212,.10)', color: accent, border: '1px solid rgba(33,200,212,.18)', borderRadius: 4, fontSize: 10, padding: '2px 7px', fontFamily: 'ui-monospace,monospace' }}>{v}</span>
                  : v}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
