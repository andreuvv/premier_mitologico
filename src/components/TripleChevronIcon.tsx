type Props = {
  direction: 'up' | 'down';
  className?: string;
};

export default function TripleChevronIcon({ direction, className }: Props) {
  const paths =
    direction === 'down'
      ? [
          'M5 3 L12 9 L19 3',
          'M5 12 L12 18 L19 12',
          'M5 21 L12 27 L19 21',
        ]
      : [
          'M5 27 L12 21 L19 27',
          'M5 18 L12 12 L19 18',
          'M5 9 L12 3 L19 9',
        ];

  return (
    <svg
      className={className}
      viewBox="0 0 24 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {paths.map((d) => (
        <path
          key={d}
          d={d}
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}
