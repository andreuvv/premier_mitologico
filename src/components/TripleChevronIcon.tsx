type Props = {
  direction: 'up' | 'down';
  className?: string;
};

const CHEVRON_DOWN = 'M16.293 9.293 12 13.586 7.707 9.293l-1.414 1.414L12 16.414l5.707-5.707z';
const CHEVRON_UP = 'm6.293 13.293 1.414 1.414L12 10.414l4.293 4.293 1.414-1.414L12 7.586z';

export default function TripleChevronIcon({ direction, className }: Props) {
  const isDown = direction === 'down';
  const path = isDown ? CHEVRON_DOWN : CHEVRON_UP;
  const offsets = isDown ? [-5.85, -0.85, 4.15] : [-4.14, 0.86, 5.86];

  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {offsets.map((dy, i) => (
        <path key={i} d={path} transform={`translate(0 ${dy})`} />
      ))}
    </svg>
  );
}
