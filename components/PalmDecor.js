export default function PalmDecor({ className = "" }) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M100 190 L104 90"
        stroke="#9f5723"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <g fill="#227e36">
        <path d="M104 90 C 60 70, 30 40, 20 20 C 60 25, 95 55, 104 90 Z" />
        <path d="M104 90 C 150 65, 175 35, 185 15 C 145 22, 110 50, 104 90 Z" />
        <path d="M104 90 C 70 55, 60 20, 65 5 C 95 20, 108 55, 104 90 Z" />
        <path d="M104 90 C 140 60, 150 25, 145 10 C 115 22, 100 55, 104 90 Z" />
        <path d="M104 90 C 90 45, 100 15, 115 0 C 125 30, 118 60, 104 90 Z" />
      </g>
    </svg>
  );
}
