import { useRef, useEffect, type ReactNode } from 'react';

const IMGS = [
  { src: '/trx16_0.png', label: 'Frente',   rot: 0   },
  { src: '/trx16_1.png', label: 'Traseira', rot: 180 },
];

const DRIVER_H = 2800;

export default function TRX16Hero({ userName }: { userName: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  // refs para todos os elementos animados
  const canvasRef   = useRef<HTMLDivElement>(null);
  const imgRefs     = useRef<(HTMLImageElement | null)[]>([]);
  const introRef    = useRef<HTMLDivElement>(null);
  const card1Ref    = useRef<HTMLDivElement>(null);
  const card2Ref    = useRef<HTMLDivElement>(null);
  const labelRef    = useRef<HTMLDivElement>(null);
  const pfillRef    = useRef<HTMLDivElement>(null);
  const pbarRef     = useRef<HTMLDivElement>(null);
  const card1WRef   = useRef<HTMLDivElement>(null);
  const card2WRef   = useRef<HTMLDivElement>(null);
  const introWRef   = useRef<HTMLDivElement>(null);

  let curImg = 0;

  function show(i: number) {
    if (i === curImg) return;
    imgRefs.current[curImg]?.classList.remove('trx-on');
    curImg = i;
    imgRefs.current[curImg]?.classList.add('trx-on');
    if (labelRef.current) labelRef.current.textContent = IMGS[i].label;
  }

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function onScroll() {
      const st  = container!.scrollTop;
      const max = DRIVER_H - container!.clientHeight;
      const dp  = max > 0 ? Math.max(0, Math.min(st / max, 1)) : 0;
      const H   = container!.clientHeight;

      // progress bar
      if (pfillRef.current) pfillRef.current.style.width = `${dp * 100}%`;
      if (pbarRef.current)  pbarRef.current.style.top    = `${st}px`;

      // device canvas — segue o scroll + parallax
      if (canvasRef.current) {
        const py = (dp - 0.4) * 22;
        canvasRef.current.style.top       = `${st}px`;
        canvasRef.current.style.transform = `translateY(${py}px)`;
      }

      // intro — segue o scroll + fade
      if (introWRef.current) {
        introWRef.current.style.top     = `${st}px`;
        introWRef.current.style.opacity = `${Math.max(0, 1 - st / (H * 0.55))}`;
      }

      // card wrappers — seguem o scroll
      if (card1WRef.current) card1WRef.current.style.top = `${st}px`;
      if (card2WRef.current) card2WRef.current.style.top = `${st}px`;
      if (labelRef.current)  labelRef.current.style.top  = `${st + H - 44}px`;

      // flip da imagem
      show(dp < 0.54 ? 0 : 1);

      // cards in/out
      card1Ref.current?.classList.toggle('trx-card-in', dp >= 0.10);
      card2Ref.current?.classList.toggle('trx-card-in', dp >= 0.56);
    }

    container.addEventListener('scroll', onScroll, { passive: true });
    // trigger inicial
    onScroll();
    return () => container.removeEventListener('scroll', onScroll);
  }, []);

  const accent = '#21C8D4';

  return (
    <>
      <style>{`
        .trx-hero-container::-webkit-scrollbar { display: none; }

        .trx-img {
          position: absolute; inset: 0;
          width: 100%; height: 100%;
          object-fit: contain; object-position: center;
          opacity: 0;
          transition: opacity .5s ease;
          transform-origin: center;
          filter: drop-shadow(0 28px 56px rgba(0,0,0,.85))
                  drop-shadow(0 0 40px rgba(33,200,212,.09));
          user-select: none; pointer-events: none;
        }
        .trx-img.trx-on { opacity: 1; }

        .trx-card {
          opacity: 0;
          transform: translateY(36px);
          transition: opacity .7s ease, transform .7s ease;
          pointer-events: auto;
        }
        .trx-card.trx-card-in {
          opacity: 1;
          transform: translateY(0);
        }

        @keyframes trx-bob {
          0%,100% { opacity: .2; transform: translateY(0); }
          50%      { opacity: .65; transform: translateY(-6px); }
        }
        .trx-bob { animation: trx-bob 2.2s ease infinite; }
      `}</style>

      <div
        ref={containerRef}
        className="trx-hero-container"
        style={{
          position: 'relative',
          width: '100%',
          height: '72vh',
          minHeight: 500,
          overflowY: 'scroll',
          overflowX: 'visible',
          scrollbarWidth: 'none',
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(8,14,36,0.4)',
        }}
      >
        {/* driver */}
        <div style={{ height: DRIVER_H }} />

        {/* ── progress bar ── */}
        <div ref={pbarRef} style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: 2, background: 'rgba(255,255,255,.04)', zIndex: 50,
        }}>
          <div ref={pfillRef} style={{
            height: '100%', width: '0%',
            background: accent,
          }} />
        </div>

        {/* ── device canvas ── */}
        <div ref={canvasRef} style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none', zIndex: 1,
          willChange: 'transform',
        }}>
          <div style={{ position: 'relative', width: 'min(44%, 320px)', aspectRatio: '1' }}>
            {IMGS.map((img, i) => (
              <img
                key={i}
                ref={el => { imgRefs.current[i] = el; }}
                src={img.src}
                alt={img.label}
                draggable={false}
                className={`trx-img${i === 0 ? ' trx-on' : ''}`}
                style={{ transform: `rotate(${img.rot}deg)` }}
              />
            ))}
            {/* glow */}
            <div style={{
              position: 'absolute', bottom: '-8%', left: '50%',
              transform: 'translateX(-50%)', width: '90%', height: '32%',
              background: `radial-gradient(ellipse, rgba(33,200,212,.13) 0%, transparent 70%)`,
              pointerEvents: 'none',
            }} />
            {/* shadow */}
            <div style={{
              position: 'absolute', bottom: '-4%', left: '50%',
              transform: 'translateX(-50%)', width: '60%', height: 14,
              background: 'radial-gradient(ellipse, rgba(0,0,0,.65) 0%, transparent 70%)',
              filter: 'blur(8px)', pointerEvents: 'none',
            }} />
          </div>
        </div>

        {/* ── intro ── */}
        <div ref={introWRef} style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '100%',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          textAlign: 'center', pointerEvents: 'none', zIndex: 2,
          willChange: 'opacity',
        }}>
          <img
            src="/logo.png"
            alt="Arqia"
            style={{ height: 32, objectFit: 'contain', marginBottom: 20, opacity: 0.7 }}
          />
          <div style={{
            fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase',
            color: accent, marginBottom: 16, opacity: 0.8,
          }}>
            Device Intranet · Arqia
          </div>
          <div style={{
            fontSize: 'clamp(44px,5.5vw,68px)', fontWeight: 900,
            letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 14,
            background: 'linear-gradient(135deg,#fff 30%,#b8e8f0 65%,#21C8D4 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            TRX-16
          </div>
          <div style={{ width: 40, height: 3, background: accent, borderRadius: 3, margin: '0 auto 16px', opacity: 0.7 }} />
          <div style={{
            fontSize: 13, letterSpacing: '0.18em', textTransform: 'uppercase',
            color: '#c8dde8', fontFamily: 'ui-monospace,monospace', marginBottom: 12,
            textShadow: `0 0 24px rgba(33,200,212,.45)`,
          }}>
            Rastreador Veicular · <strong style={{ color: accent }}>2G</strong> / <strong style={{ color: accent }}>4G CTA-1</strong>
          </div>
          <div className="trx-bob" style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            color: 'rgba(255,255,255,.2)', fontSize: 10,
            letterSpacing: '0.18em', textTransform: 'uppercase',
          }}>
            <span>Role para explorar</span>
            <div style={{
              width: 1, height: 44,
              background: `linear-gradient(to bottom, transparent, ${accent}, transparent)`,
            }} />
          </div>
        </div>

        {/* ── card 1 — esquerda ── */}
        <div ref={card1WRef} style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '100%',
          display: 'flex', alignItems: 'center',
          justifyContent: 'flex-start', padding: '0 6vw',
          pointerEvents: 'none', zIndex: 3,
        }}>
          <div ref={card1Ref} className="trx-card" style={{ maxWidth: 300 }}>
            <CardContent
              tag="Conectividade & Rastreamento"
              title={<>Sempre<br /><em style={{ fontStyle: 'normal', color: accent }}>online.</em></>}
              body="Rede 2G e 4G com envio de posição por ângulo, geofence embarcado e atualizações remotas via OTA."
              rows={[
                ['Tecnologia', '2G · 4G CTA-1', true],
                ['Envio por ângulo', 'Sim'],
                ['Cerca embarcada', 'Sim'],
                ['Atualização OTA', 'Sim'],
                ['Armazenamento', '2.000 msgs'],
              ]}
              accent={accent}
            />
          </div>
        </div>

        {/* ── card 2 — direita ── */}
        <div ref={card2WRef} style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '100%',
          display: 'flex', alignItems: 'center',
          justifyContent: 'flex-end', padding: '0 6vw',
          pointerEvents: 'none', zIndex: 3,
        }}>
          <div ref={card2Ref} className="trx-card" style={{ maxWidth: 300 }}>
            <CardContent
              tag="Hardware"
              title={<>Robusto.<br /><em style={{ fontStyle: 'normal', color: accent }}>Inteligente.</em></>}
              body="Acelerômetro integrado, detector de Jammer e bateria interna para continuidade total dos dados."
              rows={[
                ['Tipo', 'Rastreador Veicular'],
                ['Acelerômetro', 'Sim'],
                ['Detector de Jammer', 'Sim'],
                ['Entradas / Saídas', '1 / 1'],
                ['Consumo típico', '3.7V'],
                ['Bateria', '3.7V · 150 mAh'],
              ]}
              accent={accent}
            />
          </div>
        </div>

        {/* ── label ── */}
        <div ref={labelRef} style={{
          position: 'absolute', top: 'calc(100% - 44px)',
          left: '50%', transform: 'translateX(-50%)',
          fontSize: 10, letterSpacing: '0.22em',
          color: 'rgba(255,255,255,.3)', fontWeight: 600,
          textTransform: 'uppercase', whiteSpace: 'nowrap',
          pointerEvents: 'none', zIndex: 10,
        }}>
          {IMGS[0].label}
        </div>
      </div>
    </>
  );
}

function CardContent({ tag, title, body, rows, accent }: {
  tag: string;
  title: ReactNode;
  body: string;
  rows: [string, string, boolean?][];
  accent: string;
}) {
  return (
    <>
      <div style={{ fontSize: 10, letterSpacing: '0.24em', textTransform: 'uppercase', color: accent, marginBottom: 12 }}>
        {tag}
      </div>
      <h2 style={{ fontSize: 'clamp(28px,3.5vw,42px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: 14, color: '#fff' }}>
        {title}
      </h2>
      <p style={{ fontSize: 13, lineHeight: 1.8, color: '#6a7d90', marginBottom: 20 }}>
        {body}
      </p>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          {rows.map(([k, v, badge], i) => (
            <tr key={k} style={{ borderBottom: i < rows.length - 1 ? '1px solid rgba(255,255,255,.05)' : 'none' }}>
              <td style={{ padding: '9px 0', fontSize: 12, color: '#6a7d90', width: '55%' }}>{k}</td>
              <td style={{ padding: '9px 0', fontSize: 12, color: '#c8dde8', fontWeight: 500, textAlign: 'right' }}>
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
