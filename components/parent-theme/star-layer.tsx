const stars = [
  { delay: "0s", left: "12%", top: "18%" },
  { delay: "1s", left: "28%", top: "12%" },
  { delay: "2s", left: "42%", top: "22%" },
  { delay: "0.6s", left: "63%", top: "14%" },
  { delay: "1.8s", left: "78%", top: "26%" },
  { delay: "2.4s", left: "88%", top: "10%" },
  { delay: "1.2s", left: "18%", top: "38%" },
  { delay: "2.8s", left: "54%", top: "36%" },
  { delay: "0.3s", left: "72%", top: "42%" },
];

export function StarLayer() {
  return (
    <div aria-hidden="true" className="parent-theme-star-layer">
      {stars.map((star, index) => (
        <span
          className="parent-theme-star"
          key={`${star.left}-${star.top}-${index}`}
          style={{
            animationDelay: star.delay,
            left: star.left,
            top: star.top,
          }}
        />
      ))}
    </div>
  );
}
