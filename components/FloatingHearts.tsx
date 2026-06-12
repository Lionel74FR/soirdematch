const hearts = Array.from({ length: 14 });

export default function FloatingHearts() {
  return (
    <div className="hearts" aria-hidden="true">
      {hearts.map((_, i) => {
        const style = {
          left: `${(i * 7 + 4) % 100}%`,
          fontSize: `${10 + (i % 5) * 6}px`,
          animationDuration: `${9 + (i % 6) * 2}s`,
          animationDelay: `${(i % 7) * 1.3}s`,
        } as React.CSSProperties;
        return (
          <span key={i} className="heart" style={style}>
            ♥
          </span>
        );
      })}
    </div>
  );
}
