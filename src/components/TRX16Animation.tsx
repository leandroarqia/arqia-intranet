import { useRef, useState, useCallback } from 'react';

const IMGS = [
  { src: '/trx16_0.png', label: 'Frente',   rot: 0   },
  { src: '/trx16_1.png', label: 'Traseira', rot: 180 },
];

const DRIVER_VH = 4; // número de "telas" de scroll para flip completo

export default function TRX16Animation() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent]     = useState(0);
  const [translateY, setTranslateY] = useState(0);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const sy  = el.scrollTop;
    const dH  = el.scrollHeight - el.clientHeight;
    const dp  = dH > 0 ? Math.max(0, Math.min(sy / dH, 1)) : 0;

    setCurrent(dp < 0.54 ? 0 : 1);
    setTranslateY((dp - 0.4) * 22);
  }, []);

  return (
    <div
      ref={scrollRef}
      onScroll={onScroll}
      style={{
        width: 'min(36vw, 360px)',
        height: 'min(36vw, 360px)',
        overflowY: 'scroll',
        scrollbarWidth: 'none',
        position: 'relative',
        flexShrink: 0,
      }}
      // hide scrollbar on webkit
      className="[&::-webkit-scrollbar]:hidden"
    >
      {/* driver tall enough to scroll through */}
      <div style={{ height: `${DRIVER_VH * 100}%` }} />

      {/* sticky canvas */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          width: '100%',
          height: 'min(36vw, 360px)',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            transform: `translateY(${translateY}px)`,
            transition: 'transform 0.08s linear',
          }}
        >
          {IMGS.map((img, i) => (
            <img
              key={i}
              src={img.src}
              alt={img.label}
              draggable={false}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                objectPosition: 'center',
                opacity: i === current ? 1 : 0,
                transition: 'opacity 0.5s ease',
                transform: `rotate(${img.rot}deg)`,
                filter:
                  'drop-shadow(0 28px 56px rgba(0,0,0,.85)) drop-shadow(0 0 40px rgba(33,200,212,.09))',
              }}
            />
          ))}

          {/* Glow */}
          <div
            style={{
              position: 'absolute',
              bottom: '-8%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '90%',
              height: '32%',
              background:
                'radial-gradient(ellipse, rgba(33,200,212,.13) 0%, transparent 70%)',
            }}
          />

          {/* Shadow */}
          <div
            style={{
              position: 'absolute',
              bottom: '-4%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '60%',
              height: '14px',
              background:
                'radial-gradient(ellipse, rgba(0,0,0,.65) 0%, transparent 70%)',
              filter: 'blur(8px)',
            }}
          />
        </div>

        {/* Label */}
        <div
          style={{
            position: 'absolute',
            bottom: '-24px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '10px',
            letterSpacing: '0.22em',
            color: 'rgba(255,255,255,0.35)',
            fontWeight: 600,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}
        >
          {IMGS[current].label}
        </div>
      </div>
    </div>
  );
}
