export function Logo({ className }: { className?: string }) {
  return <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" className={className} />
}
