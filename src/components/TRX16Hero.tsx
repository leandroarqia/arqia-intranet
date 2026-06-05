import { useRef, useState, useCallback, useEffect } from 'react';

const IMGS = [
  { src: '/trx16_0.png', label: 'Frente',   rot: 0   },
  { src: '/trx16_1.png', label: 'Traseira', rot: 180 },
];

const DRIVER_H = 3000; // px — altura total de scroll

interface State {
  st:   number; // scrollTop
  dp:   number; // driver progress 0→1
  cur:  number; // imagem ativa
  py:   number; // parallax Y do device
  introOp: number;
  card1In: boolean;
  card2In: boolean;
  pfill:   number; // 0–100
}

export default function TRX16Hero({ userName }: { userName: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ch, setCh] = useState(0); // container height

  const [s, setS] = useState<State>({
    st: 0, dp: 0, cur: 0, py: 0,
    introOp: 1, card1In: false, card2In: false, pfill: 0,
  });

  // measure container height after mount so it reflects the real rendered size
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => setCh(el.getBoundingClientRect().height || el.clientHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const onScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const st  = el.scrollTop;
    const max = DRIVER_H - el.clientHeight;
    const dp  = max > 0 ? Math.max(0, Math.min(st / max, 1)) : 0;

    setS({
      st,
      dp,
      cur:      dp < 0.54 ? 0 : 1,
      py:       (dp - 0.4) * 22,
      introOp:  Math.max(0, 1 - st / (el.clientHeight * 0.55)),
      card1In:  dp >= 0.10,
      card2In:  dp >= 0.56,
      pfill:    dp * 100,
    });
  }, []);

  // container height shorthand
  const H = ch || 600;
  const st = s.st;

  // device size
  const DEV = Math.min(H * 0.55, 360);

  return (
    <div
      ref={containerRef}
      onScroll={onScroll}
      style={{
        position: 'relative',
        width: '100%',
        height: '70vh',
        minHeight: 480,
        overflowY: 'scroll',
        scrollbarWidth: 'none',
        background: 'transparent',
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.05)',
      }}
      className="[&::-webkit-scrollbar]:hidden"
    >
      {/* ── driver ── */}
      <div style={{ height: DRIVER_H }} />

      {/* ── progress bar ── */}
      <div style={{
        position: 'absolute', top: st, left: 0, right: 0,
        height: 2, background: 'rgba(255,255,255,.04)', zIndex: 50,
      }}>
        <div style={{
          height: '100%', width: `${s.pfill}%`,
          background: '#21C8D4', transition: 'width .04s linear',
        }} />
      </div>

      {/* ── device canvas (centered) ── */}
      <div style={{
        position: 'absolute',
        top: st,
        left: 0, right: 0,
        height: H,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none', zIndex: 0,
      }}>
        <div style={{
          position: 'relative',
          width: DEV, height: DEV,
          transform: `translateY(${s.py}px)`,
          transition: 'transform 0.08s linear',
        }}>
          {IMGS.map((img, i) => (
            <img key={i} src={img.src} alt={img.label} draggable={false} style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'contain', objectPosition: 'center',
              opacity: i === s.cur ? 1 : 0,
              transition: 'opacity .5s ease',
              transform: `rotate(${img.rot}deg)`,
              filter: 'drop-shadow(0 28px 56px rgba(0,0,0,.85)) drop-shadow(0 0 40px rgba(33,200,212,.09))',
            }} />
          ))}
          {/* glow */}
          <div style={{
            position: 'absolute', bottom: '-8%', left: '50%',
            transform: 'translateX(-50%)', width: '90%', height: '32%',
            background: 'radial-gradient(ellipse, rgba(33,200,212,.13) 0%, transparent 70%)',
          }} />
          {/* shadow */}
          <div style={{
            position: 'absolute', bottom: '-4%', left: '50%',
            transform: 'translateX(-50%)', width: '60%', height: '14px',
            background: 'radial-gradient(ellipse, rgba(0,0,0,.65) 0%, transparent 70%)',
            filter: 'blur(8px)',
          }} />
        </div>
      </div>

      {/* ── intro (centro, some ao rolar) ── */}
      <div style={{
        position: 'absolute', top: st, left: 0, right: 0, height: H,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', opacity: s.introOp,
        transition: 'opacity .05s linear', pointerEvents: 'none', zIndex: 2,
      }}>
        <img
          src="/logo.png"
          alt="Arqia"
          style={{ height: 36, objectFit: 'contain', marginBottom: 16, opacity: 0.85 }}
        />
        <div style={{
          fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase',
          color: '#21C8D4', marginBottom: 20, opacity: 0.8,
        }}>
          Device Intranet · Arqia
        </div>

        <div style={{
          fontSize: 'clamp(48px,6vw,72px)', fontWeight: 900,
          letterSpacing: '-0.04em', lineHeight: 1,
          marginBottom: 16,
          background: 'linear-gradient(135deg,#ffffff 30%,#b8e8f0 65%,#21C8D4 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          TRX-16
        </div>

        <div style={{
          width: 48, height: 3, background: '#21C8D4',
          borderRadius: 3, margin: '0 auto 18px', opacity: 0.7,
        }} />

        <div style={{
          fontSize: 14, letterSpacing: '0.18em', textTransform: 'uppercase',
          color: '#c8dde8', fontFamily: 'ui-monospace,monospace',
          marginBottom: 12,
          textShadow: '0 0 24px rgba(33,200,212,.45)',
        }}>
          Rastreador Veicular · <strong style={{ color: '#21C8D4' }}>2G</strong> / <strong style={{ color: '#21C8D4' }}>4G CTA-1</strong>
        </div>

        <div style={{ fontSize: 13, color: 'rgba(255,255,255,.35)', marginBottom: 48 }}>
          {userName}
        </div>

        {/* scroll arrow */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          color: 'rgba(255,255,255,.25)', fontSize: 10,
          letterSpacing: '0.18em', textTransform: 'uppercase',
          animation: 'trx-bob 2.2s ease infinite',
        }}>
          <span>Role para explorar</span>
          <div style={{
            width: 1, height: 48,
            background: 'linear-gradient(to bottom, transparent, #21C8D4, transparent)',
          }} />
        </div>
      </div>

      {/* ── card 1 — esquerda ── */}
      <div style={{
        position: 'absolute', top: st, left: 0, right: 0, height: H,
        display: 'flex', alignItems: 'center',
        justifyContent: 'flex-start', padding: '0 7vw',
        pointerEvents: 'none', zIndex: 3,
      }}>
        <div style={{
          maxWidth: 340, pointerEvents: 'auto',
          opacity: s.card1In ? 1 : 0,
          transform: s.card1In ? 'translateY(0)' : 'translateY(36px)',
          transition: 'opacity .7s ease, transform .7s ease',
        }}>
          <div style={{ fontSize: 10, letterSpacing: '0.24em', textTransform: 'uppercase', color: '#21C8D4', marginBottom: 14 }}>
            Conectividade &amp; Rastreamento
          </div>
          <h2 style={{ fontSize: 'clamp(32px,4vw,48px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.02, marginBottom: 18 }}>
            Sempre<br /><em style={{ fontStyle: 'normal', color: '#21C8D4' }}>online.</em>
          </h2>
          <p style={{ fontSize: 14, lineHeight: 1.85, color: '#6a7d90', marginBottom: 24 }}>
            Rede 2G e 4G com envio de posição por ângulo, geofence embarcado e atualizações remotas via OTA.
          </p>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            {[
              ['Tecnologia', '2G · 4G CTA-1'],
              ['Envio por ângulo', 'Sim'],
              ['Cerca embarcada', 'Sim'],
              ['Atualização OTA', 'Sim'],
              ['Armazenamento', '2.000 msgs'],
            ].map(([k, v], i, arr) => (
              <tr key={k} style={{ borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,.06)' : 'none' }}>
                <td style={{ padding: '10px 0', fontSize: 13, color: '#6a7d90', width: '55%' }}>{k}</td>
                <td style={{ padding: '10px 0', fontSize: 13, color: '#c8dde8', fontWeight: 500, textAlign: 'right' }}>
                  {i === 0
                    ? <span style={{ background: 'rgba(33,200,212,.10)', color: '#21C8D4', border: '1px solid rgba(33,200,212,.18)', borderRadius: 4, fontSize: 11, padding: '2px 8px', fontFamily: 'ui-monospace,monospace' }}>{v}</span>
                    : v}
                </td>
              </tr>
            ))}
          </table>
        </div>
      </div>

      {/* ── card 2 — direita ── */}
      <div style={{
        position: 'absolute', top: st, left: 0, right: 0, height: H,
        display: 'flex', alignItems: 'center',
        justifyContent: 'flex-end', padding: '0 7vw',
        pointerEvents: 'none', zIndex: 3,
      }}>
        <div style={{
          maxWidth: 340, pointerEvents: 'auto',
          opacity: s.card2In ? 1 : 0,
          transform: s.card2In ? 'translateY(0)' : 'translateY(36px)',
          transition: 'opacity .7s ease, transform .7s ease',
        }}>
          <div style={{ fontSize: 10, letterSpacing: '0.24em', textTransform: 'uppercase', color: '#21C8D4', marginBottom: 14 }}>
            Hardware
          </div>
          <h2 style={{ fontSize: 'clamp(32px,4vw,48px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.02, marginBottom: 18 }}>
            Robusto.<br /><em style={{ fontStyle: 'normal', color: '#21C8D4' }}>Inteligente.</em>
          </h2>
          <p style={{ fontSize: 14, lineHeight: 1.85, color: '#6a7d90', marginBottom: 24 }}>
            Acelerômetro integrado, detector de Jammer e bateria interna para continuidade total dos dados.
          </p>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            {[
              ['Tipo', 'Rastreador Veicular'],
              ['Acelerômetro', 'Sim'],
              ['Detector de Jammer', 'Sim'],
              ['Entradas / Saídas', '1 / 1'],
              ['Consumo típico', '3.7V'],
              ['Bateria', '3.7V · 150 mAh'],
            ].map(([k, v], i, arr) => (
              <tr key={k} style={{ borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,.06)' : 'none' }}>
                <td style={{ padding: '10px 0', fontSize: 13, color: '#6a7d90', width: '55%' }}>{k}</td>
                <td style={{ padding: '10px 0', fontSize: 13, color: '#c8dde8', fontWeight: 500, textAlign: 'right' }}>{v}</td>
              </tr>
            ))}
          </table>
        </div>
      </div>

      {/* ── label frente/traseira ── */}
      <div style={{
        position: 'absolute',
        top: st + H - 48,
        left: '50%', transform: 'translateX(-50%)',
        fontSize: 10, letterSpacing: '0.22em',
        color: 'rgba(255,255,255,.35)', fontWeight: 600,
        textTransform: 'uppercase', whiteSpace: 'nowrap',
        pointerEvents: 'none', zIndex: 10,
        transition: 'opacity .3s',
      }}>
        {IMGS[s.cur].label}
      </div>

      <style>{`
        @keyframes trx-bob {
          0%,100% { opacity:.2; transform:translateY(0); }
          50%      { opacity:.65; transform:translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
